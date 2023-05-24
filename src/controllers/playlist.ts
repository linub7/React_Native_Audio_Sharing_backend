import { CreatePlaylistRequest, UpdatePlaylistRequest } from '#/@types/audio';
import Audio from '#/models/Audio';
import Playlist from '#/models/Playlist';
import { RequestHandler } from 'express';
import { isValidObjectId } from 'mongoose';

export const createPlaylist: RequestHandler = async (
  req: CreatePlaylistRequest,
  res,
  next
) => {
  const {
    user: { id },
    body: { title, resId, visibility },
  } = req;

  if (resId && !isValidObjectId(resId))
    return res.status(422).json({ error: 'Please provide a valid audio id' });

  if (resId) {
    const audio = await Audio.findById(resId);
    if (!audio) return res.status(422).json({ error: 'audio not found' });
  }

  const newPlaylist = new Playlist({
    title,
    owner: id,
    visibility,
  });

  if (resId) newPlaylist.items = [resId as any];

  await newPlaylist.save();

  return res.status(201).json({
    playlist: {
      id: newPlaylist._id,
      title: newPlaylist.title,
      visibility: newPlaylist.visibility,
    },
  });
};

export const updatePlaylist: RequestHandler = async (
  req: UpdatePlaylistRequest,
  res,
  next
) => {};
