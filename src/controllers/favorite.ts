import { RequestHandler } from 'express';
import { isValidObjectId } from 'mongoose';

import Audio from '#/models/Audio';
import Favorite from '#/models/Favorite';

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
  return res.json({
    status,
  });
};
