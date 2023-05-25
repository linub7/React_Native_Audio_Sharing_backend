import { RequestHandler } from 'express';
import { isValidObjectId } from 'mongoose';

import Audio from '#/models/Audio';
import Favorite from '#/models/Favorite';
import { PopulateFavoriteList } from '#/@types/audio';

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

  const favorites = await Favorite.findOne({ owner: id }).populate<{
    items: PopulateFavoriteList[];
  }>({
    path: 'items',
    populate: {
      path: 'owner',
    },
  });

  if (!favorites) return res.json({ audios: [] });

  const audios = favorites.items?.map((item) => {
    return {
      id: item._id,
      title: item.title,
      category: item.category,
      file: item.file?.url,
      poster: item.poster?.url,
      owner: { name: item.owner?.name, id: item.owner?._id },
    };
  });

  return res.json({
    audios,
  });
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
