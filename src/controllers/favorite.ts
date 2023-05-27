import { RequestHandler } from 'express';
import { isValidObjectId } from 'mongoose';

import Audio from '#/models/Audio';
import Favorite from '#/models/Favorite';
import { PopulateFavoriteList } from '#/@types/audio';
import { PaginationQuery } from '#/@types/misc';
import { LIMIT_AMOUNT } from '#/constants';

export const toggleFavorite: RequestHandler = async (req, res, next) => {
  const {
    user: { id },
  } = req;

  let status: 'added' | 'removed';

  const audioId = req.query?.audioId as string;

  if (!isValidObjectId(audioId))
    return res.status(422).json({ error: 'Please provide a valid audio id' });

  const existedAudio = await Audio.findById(audioId);
  if (!existedAudio) return res.status(404).json({ error: 'record not found' });

  const isExistedInFavorite = await Favorite.findOne({
    owner: id,
    items: existedAudio._id,
  });

  if (isExistedInFavorite) {
    // remove from list
    await Favorite.findOneAndUpdate(
      { owner: id },
      { $pull: { items: existedAudio._id } }
    );

    status = 'removed';
  } else {
    const favorite = await Favorite.findOne({ owner: id });
    // try to add ew audio to the ols list
    if (favorite) {
      await Favorite.findOneAndUpdate(
        { owner: id },
        { $addToSet: { items: existedAudio._id } }
      );
    } else {
      // try to create a new favorite list
      await Favorite.create({
        owner: id,
        items: [existedAudio._id],
      });
    }
    status = 'added';
  }

  if (status === 'added') {
    await Audio.findByIdAndUpdate(existedAudio._id, {
      $addToSet: { likes: id },
    });
  }

  if (status === 'removed') {
    await Audio.findByIdAndUpdate(existedAudio._id, {
      $pull: { likes: id },
    });
  }

  return res.json({
    status,
  });
};

export const getFavorites: RequestHandler = async (req, res, next) => {
  const {
    user: { id },
  } = req;

  const { page, limit } = req.query as PaginationQuery;

  const pageNumber = parseInt(page, 10) || 1;
  const limitAmount = parseInt(limit, 10) || LIMIT_AMOUNT;
  const startIndex = (pageNumber - 1) * limitAmount;

  const favorites = await Favorite.aggregate([
    {
      $match: { owner: id },
    },
    {
      $project: {
        audioIds: {
          // we write  audioIds ourselves! you can write everything
          $slice: ['$items', startIndex, limitAmount],
        },
      },
    },
    { $unwind: '$audioIds' },
    {
      // populate audio
      $lookup: {
        from: 'audios',
        localField: 'audioIds', // comes from line 90
        foreignField: '_id',
        as: 'audioInfo',
      },
    },
    {
      $unwind: '$audioInfo', // comes from line 103
    },
    {
      // populate owner of audio
      $lookup: {
        from: 'users',
        localField: 'audioInfo.owner',
        foreignField: '_id',
        as: 'audioOwnerInfo',
      },
    },
    {
      $unwind: '$audioOwnerInfo', // comes from line 115
    },
    {
      $project: {
        _id: 0,
        id: '$audioInfo._id',
        title: '$audioInfo.title',
        about: '$audioInfo.about',
        category: '$audioInfo.category',
        file: '$audioInfo.file.url',
        poster: '$audioInfo.poster.url',
        owner: { name: '$audioOwnerInfo.name', id: '$audioOwnerInfo._id' },
      },
    },
  ]);

  return res.json({ audios: favorites });
};

export const getIsFavorite: RequestHandler = async (req, res, next) => {
  const {
    user: { id },
  } = req;
  const audioId = req.query?.audioId as string;
  if (!isValidObjectId(audioId))
    return res.status(422).json({ error: 'Please provide a valid audio id' });

  const favorite = await Favorite.findOne({ owner: id, items: audioId });

  return res.json({
    result: favorite ? true : false,
  });
};
