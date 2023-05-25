import { RequestHandler } from 'express';
import { isValidObjectId } from 'mongoose';

import Audio from '#/models/Audio';
import History, { HistoryType } from '#/models/History';
import { PaginationQuery } from '#/@types/misc';
import { LIMIT_AMOUNT } from '#/constants';

export const updateHistory: RequestHandler = async (req, res, next) => {
  const {
    user: { id },
    body: { audio, progress, date },
  } = req;

  if (!isValidObjectId(audio))
    return res.status(422).json({ error: 'Please provide a valid audio id!' });

  const existedAudio = await Audio.findById(audio);
  if (!existedAudio) return res.status(404).json({ error: 'Audio not found!' });

  const oldHistory = await History.findOne({ owner: id });

  const history: HistoryType = {
    audio: existedAudio?._id,
    progress,
    date,
  };

  if (!oldHistory) {
    await History.create({
      owner: id,
      last: history,
      all: [history],
    });
    return res.json({ success: true });
  }

  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  const histories = await History.aggregate([
    { $match: { owner: id } }, // act like findOne
    { $unwind: '$all' }, // convert all type from Array to Object
    {
      $match: {
        'all.date': {
          // give us history from the same day
          $gte: startOfDay,
          $lt: endOfDay,
        },
      },
    },
    {
      $project: {
        // select "all.audio" field
        _id: 0, // de-select _id
        audio: '$all.audio',
      },
    },
  ]);

  const sameDayHistory = histories.find((item) => {
    if (item?.audio?.toString() === existedAudio?._id?.toString()) return item;
  });

  if (sameDayHistory) {
    await History.findOneAndUpdate(
      { owner: id, 'all.audio': existedAudio?._id },
      {
        $set: {
          'all.$.progress': progress,
          'all.$.date': date,
        },
      }
    );
  } else {
    await History.findByIdAndUpdate(oldHistory?._id, {
      $push: { all: { $each: [history], $position: 0 } }, // $position:0 -> insert as first item
      $set: { last: history },
    });
  }

  return res.json({
    success: true,
  });
};

export const removeHistory: RequestHandler = async (req, res, next) => {
  const {
    user: { id },
    query: { all },
  } = req;

  const removeAll = all === 'yes';

  if (removeAll) {
    const existedHistory = await History.findOneAndDelete({ owner: id });
    if (!existedHistory)
      return res.status(404).json({ error: 'history was not found!' });

    return res.json({ success: true });
  }

  const histories = req.query.histories as string;

  const ids = JSON.parse(histories) as string[];
  console.log('ids: ', ids);

  await History.findOneAndUpdate(
    { owner: id },
    { $pull: { all: { _id: ids } } },
    { new: true }
  );

  return res.json({
    success: true,
  });
};

export const getHistories: RequestHandler = async (req, res, next) => {
  const {
    user: { id },
  } = req;

  const { page, limit } = req.query as PaginationQuery;

  const pageNumber = parseInt(page, 10) || 1;
  const limitAmount = parseInt(limit, 10) || LIMIT_AMOUNT;
  const startIndex = (pageNumber - 1) * limitAmount;

  const histories = await History.aggregate([
    { $match: { owner: id } },
    {
      $project: {
        all: {
          // create "all" key
          $slice: ['$all', startIndex, limitAmount], // imply pagination
        },
      },
    },
    {
      $unwind: '$all', // all come from line 144
    },
    {
      // act populate in aggregation
      $lookup: {
        from: 'audios', // audios -> Audio collection name -> come from mongodb compass
        localField: 'all.audio',
        foreignField: '_id',
        as: 'audioInfo',
      },
    },
    {
      $unwind: '$audioInfo', // audioInfo come from line 159
    },
    {
      $project: {
        _id: 0, // de-select _id
        id: '$all._id', // historyId
        audioId: '$audioInfo._id', //audioId
        date: '$all.date',
        title: '$audioInfo.title',
      },
    },
    {
      // group histories by date
      $group: {
        _id: {
          $dateToString: {
            // convert date to string
            format: '%Y-%m-%d',
            date: '$date',
          },
        },
        audios: {
          $push: '$$ROOT',
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: '$id',
        date: '$_id',
        audios: '$$ROOT.audios',
      },
    },
    {
      $sort: { date: -1 },
    },
  ]);

  return res.json({ histories });
};

export const getRecentlyPlayed: RequestHandler = async (req, res, next) => {
  const {
    user: { id },
  } = req;
  const recentlyPlayed = await History.aggregate([
    { $match: { owner: id } }, // match
    {
      // sliceMatch
      $project: {
        myHistory: {
          $slice: ['$all', 10],
        },
      },
    },
    {
      // dateSort
      $project: {
        histories: {
          $sortArray: {
            input: '$myHistory', // myHistory -> come from line 214
            sortBy: { date: -1 },
          },
        },
      },
    },
    {
      // unwind with index
      $unwind: {
        path: '$histories', // histories -> come from 222
        includeArrayIndex: 'index',
      },
    },
    {
      // populate audio
      $lookup: {
        from: 'audios', // Audio collection name -> come from mongo compass,
        localField: 'histories.audio', // histories -> come from line 222
        foreignField: '_id',
        as: 'audioInfo',
      },
    },
    {
      $unwind: '$audioInfo',
    },
    {
      // populate owner
      $lookup: {
        from: 'users',
        localField: 'audioInfo.owner',
        foreignField: '_id',
        as: 'owner',
      },
    },
    {
      $unwind: '$owner',
    },
    {
      // shaping the output
      $project: {
        _id: 0,
        id: '$audioInfo._id',
        title: '$audioInfo.title',
        about: '$audioInfo.about',
        file: '$audioInfo.file.url',
        poster: '$audioInfo.poster.url',
        category: '$audioInfo.category',
        owner: { name: '$owner.name', id: '$owner._id' },
        date: '$histories.date',
        progress: '$histories.progress',
      },
    },
  ]);

  res.json({
    recentlyPlayed,
  });
};
