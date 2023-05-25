import Audio from '#/models/Audio';
import History, { HistoryType } from '#/models/History';
import { RequestHandler } from 'express';
import { isValidObjectId } from 'mongoose';

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
