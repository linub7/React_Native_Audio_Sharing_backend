import { Request } from 'express';
import moment from 'moment';

import { UserDocument } from '#/models/User';
import History from '#/models/History';

export const generateOTPToken = (length: number = 6) => {
  let otp = '';

  for (let index = 0; index < length; index++) {
    const digit = Math.floor(Math.random() * 10);
    otp += digit;
  }

  return otp;
};

export const formatUser = (user: UserDocument) => {
  return {
    id: user?._id,
    name: user?.name,
    email: user?.email,
    verified: user?.verified,
    followers: user?.followers?.length,
    followings: user?.followings?.length,
    avatar: user?.avatar?.url,
  };
};

export const getUserPreviousHistory = async (
  req: Request
): Promise<string[]> => {
  const { user } = req;
  const [result] = await History.aggregate([
    { $match: { owner: user.id } }, // select user history
    {
      $unwind: '$all',
    },
    {
      $match: {
        'all.date': {
          // only those histories which are not older than 30 days
          $gte: moment().subtract(30, 'days').toDate(),
        },
      },
    },
    {
      $group: {
        _id: '$all.audio',
      },
    },
    {
      $lookup: {
        from: 'audios', // audios is name of Audio models in mongo compass
        localField: '_id', // this _id comes from line 218 -> we write _id: '$all.audio' ourselves
        foreignField: '_id', // this _id comes from Audio Model
        as: 'audioInfo',
      },
    },
    {
      $unwind: '$audioInfo', // comes from line 226
    },
    {
      $group: {
        _id: null,
        category: {
          $addToSet: '$audioInfo.category',
        },
      },
    },
  ]);

  if (result) {
    return result.category;
  }

  return [];
};
