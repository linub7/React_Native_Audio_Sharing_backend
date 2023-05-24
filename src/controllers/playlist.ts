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
) => {
  const {
    params: { id },
    body: { title, item, visibility },
    user,
  } = req;

  if (item && !isValidObjectId(item))
    return res.status(422).json({ error: 'Please provide a valid audio id' });

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: id,
      owner: user.id,
    },
    {
      title,
      visibility,
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist)
    return res.status(404).json({ error: 'playlist not fount' });

  if (item) {
    const existedAudio = await Audio.findById(item);
    if (!existedAudio)
      return res.status(404).json({ error: 'Audio not fount' });

    await Playlist.findByIdAndUpdate(
      updatedPlaylist._id,
      {
        $addToSet: { items: item },
      },
      { new: true }
    );
  }

  return res.json({
    playlist: {
      id: updatedPlaylist._id,
      title: updatedPlaylist.title,
      visibility: updatedPlaylist.visibility,
    },
  });
};

export const deletePlaylist: RequestHandler = async (req, res, next) => {
  const {
    params: { id },
    user,
  } = req;

  const resId = req.query?.resId as string;
  const all = req.query?.all as string;

  if (all === 'yes') {
    const deletedPlaylist = await Playlist.findOneAndDelete({
      _id: id,
      owner: user.id,
    });
    if (!deletedPlaylist)
      return res.json(404).json({ error: 'record not found!' });
  }

  if (resId) {
    if (!isValidObjectId(resId))
      return res
        .status(422)
        .json({ error: 'Please provide a valid audio id!' });

    const existedAudio = await Audio.findById(resId);
    if (!existedAudio)
      return res.status(422).json({ error: 'record not found!' });

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      id,
      { $pull: { items: existedAudio._id } },
      { new: true }
    );
    if (!updatedPlaylist)
      return res.status(404).json({ error: 'record not found!' });
  }

  res.json({ success: true });
};
