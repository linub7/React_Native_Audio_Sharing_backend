import { RequestHandler } from 'express';
import formidable from 'formidable';

import cloudinary from '#/cloud';
import { RequestWithFiles } from '#/middlewares/fileParser';
import { categoriesTypes } from '#/utils/audioCategory';
import Audio from '#/models/Audio';

interface CreateAudioRequest extends RequestWithFiles {
  body: {
    title: string;
    about: string;
    category: categoriesTypes;
  };
}
export const createAudio: RequestHandler = async (
  req: CreateAudioRequest,
  res,
  next
) => {
  const {
    body: { about, category, title },
    user: { id },
  } = req;

  const poster = req.files?.poster as formidable.File;
  const audioFile = req.files?.file as formidable.File;
  const ownerId = id;

  if (!audioFile)
    return res.status(422).json({ error: 'Audio file is required!' });

  const audioRes = await cloudinary.uploader.upload(audioFile.filepath, {
    resource_type: 'video',
  });

  const newAudio = new Audio({
    title,
    about,
    category,
    owner: ownerId,
    file: {
      url: audioRes.secure_url,
      publicId: audioRes.public_id,
    },
  });

  if (poster) {
    const posterRes = await cloudinary.uploader.upload(poster.filepath, {
      width: 300,
      height: 300,
      crop: 'thumb',
      gravity: 'face',
    });

    newAudio.poster = {
      url: posterRes.secure_url,
      publicId: posterRes.public_id,
    };
  }

  await newAudio.save();

  return res.status(201).json({
    audio: {
      title: newAudio.title,
      about: newAudio.about,
      file: newAudio.file.url,
      poster: newAudio.poster?.url,
    },
  });
};

export const updateAudio: RequestHandler = async (
  req: CreateAudioRequest,
  res,
  next
) => {
  const {
    params: { id },
    body: { about, category, title },
    user,
  } = req;

  const poster = req.files?.poster as formidable.File;
  const ownerId = user.id;

  const existedAudio = await Audio.findOne({ _id: id, owner: ownerId });
  if (!existedAudio)
    return res.status(404).json({ error: 'record not found!' });

  if (poster) {
    if (existedAudio.poster?.publicId) {
      await cloudinary.uploader.destroy(existedAudio.poster?.publicId);
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      poster.filepath,
      {
        width: 300,
        height: 300,
        crop: 'thumb',
        gravity: 'face',
      }
    );

    existedAudio.poster = {
      url: secure_url,
      publicId: public_id,
    };
  }

  existedAudio.title = title;
  existedAudio.about = about;
  existedAudio.category = category;

  await existedAudio.save();

  return res.json({
    audio: {
      title: existedAudio.title,
      about: existedAudio.about,
      file: existedAudio.file.url,
      poster: existedAudio.poster?.url,
    },
  });
};
