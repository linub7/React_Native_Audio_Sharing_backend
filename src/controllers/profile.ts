import { RequestHandler } from 'express';

import { PaginationQuery } from '#/@types/misc';
import { LIMIT_AMOUNT } from '#/constants';
import Audio from '#/models/Audio';
import Playlist from '#/models/Playlist';
import User from '#/models/User';
import { PipelineStage, Types } from 'mongoose';
import { getUserPreviousHistory } from '#/utils/helper';

export const updateFollower: RequestHandler = async (req, res, next) => {
  const {
    user,
    params: { id },
  } = req;

  let status: 'follow' | 'unfollow';

  if (user.id.toString() === id.toString())
    return res.status(422).json({ error: 'you can not follow yourself!' });

  const profile = await User.findById(id);
  if (!profile) return res.status(422).json({ error: 'user not found!' });

  const alreadyFollower = await User.findOne({ _id: id, followers: user.id });

  if (alreadyFollower) {
    // unfollow
    await User.findOneAndUpdate(
      { _id: id },
      { $pull: { followers: user.id } },
      { new: true }
    );
    status = 'unfollow';
  } else {
    // follow
    await User.findOneAndUpdate(
      { _id: id },
      { $addToSet: { followers: user.id } },
      { new: true }
    );
    status = 'follow';
  }

  if (status === 'follow') {
    await User.findByIdAndUpdate(
      { _id: user.id },
      { $addToSet: { followings: id } },
      { new: true }
    );
  }

  if (status === 'unfollow') {
    await User.findByIdAndUpdate(
      { _id: user.id },
      { $pull: { followings: id } },
      { new: true }
    );
  }

  return res.json({
    status,
  });
};

export const getUploads: RequestHandler = async (req, res, next) => {
  const {
    user: { id, name },
  } = req;

  const { page, limit } = req.query as PaginationQuery;

  const pageNumber = parseInt(page, 10) || 1;
  const limitAmount = parseInt(limit, 10) || LIMIT_AMOUNT;
  const startIndex = (pageNumber - 1) * limitAmount;

  const uploads = await Audio.find({ owner: id })
    .skip(startIndex)
    .limit(limitAmount)
    .sort('-createdAt');

  const audios = uploads?.map((item) => {
    return {
      id: item?._id,
      title: item?.title,
      about: item?.about,
      file: item?.file?.url,
      poster: item?.poster?.url,
      date: item?.createdAt,
      owner: { name, id },
    };
  });

  res.json({
    audios,
  });
};

export const getPublicUploads: RequestHandler = async (req, res, next) => {
  const {
    params: { id },
  } = req;

  const { page, limit } = req.query as PaginationQuery;

  const pageNumber = parseInt(page, 10) || 1;
  const limitAmount = parseInt(limit, 10) || LIMIT_AMOUNT;
  const startIndex = (pageNumber - 1) * limitAmount;

  const profile = await User.findById(id).select('name _id');
  if (!profile) return res.status(422).json({ error: 'Profile not found!' });

  const uploads = await Audio.find({ owner: id })
    .skip(startIndex)
    .limit(limitAmount)
    .sort('-createdAt');

  const audios = uploads?.map((item) => {
    return {
      id: item?._id,
      title: item?.title,
      about: item?.about,
      file: item?.file?.url,
      poster: item?.poster?.url,
      date: item?.createdAt,
      owner: { name: profile?.name, id: profile?._id },
    };
  });

  res.json({
    audios,
  });
};

export const getPublicProfile: RequestHandler = async (req, res, next) => {
  const {
    params: { id },
  } = req;

  const profile = await User.findById(id);
  if (!profile) return res.status(422).json({ error: 'profile not found!' });

  return res.json({
    profile: {
      id: profile?._id,
      name: profile?.name,
      followers: profile?.followers?.length,
      avatar: profile?.avatar?.url,
    },
  });
};

export const getPublicPlaylist: RequestHandler = async (req, res, next) => {
  const {
    params: { id },
  } = req;

  const { page, limit } = req.query as PaginationQuery;

  const pageNumber = parseInt(page, 10) || 1;
  const limitAmount = parseInt(limit, 10) || LIMIT_AMOUNT;
  const startIndex = (pageNumber - 1) * limitAmount;

  const profile = await User.findById(id);
  if (!profile) return res.status(422).json({ error: 'profile not found!' });

  const data = await Playlist.find({
    owner: profile?._id,
    visibility: 'public',
  })
    .skip(startIndex)
    .limit(limitAmount)
    .sort('-createdAt');

  const playlists = data?.map((item) => {
    return {
      id: item?._id,
      title: item?.title,
      itemsCount: item?.items?.length,
      visibility: item?.visibility,
    };
  });

  return res.json({
    playlists,
  });
};

export const getRecommendedByProfile: RequestHandler = async (
  req,
  res,
  next
) => {
  const { user } = req;

  let matchOptions: PipelineStage.Match = {
    $match: { _id: { $exists: true } },
  }; // fetch all the audios === Audio.find({})

  if (user) {
    // then we want to send by te profile

    // fetch users previous history
    const category = await getUserPreviousHistory(req);
    /**
      output is like this: 
        
	         [
		        {
			        "_id": null,
			        "category": [
				        "Arts",
				        "Music"
			        ]
		        }
	        ]        
    */

    if (category.length) {
      matchOptions = {
        $match: { category: { $in: category } },
      };
    }
  }

  // otherwise we will send generic audios
  const audios = await Audio.aggregate([
    matchOptions,
    {
      $sort: {
        'likes.count': -1, // sorting audios based on likes count DESC
      },
    },
    {
      $limit: 10,
    },
    {
      // populate owner
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerInfo',
      },
    },
    {
      $unwind: '$ownerInfo',
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        title: '$title',
        category: '$category',
        about: '$about',
        file: '$file.url',
        poster: '$poster.url',
        owner: {
          name: '$ownerInfo.name',
          id: '$ownerInfo._id',
        },
      },
    },
  ]);

  return res.json({
    audios,
  });
};

export const getMyProfileFollowers: RequestHandler = async (req, res, next) => {
  const {
    user: { id },
  } = req;

  const { page, limit } = req.query as PaginationQuery;

  const pageNumber = parseInt(page, 10) || 1;
  const limitAmount = parseInt(limit, 10) || LIMIT_AMOUNT;
  const startIndex = (pageNumber - 1) * limitAmount;

  const [result] = await User.aggregate([
    { $match: { _id: id } },
    {
      $project: {
        followers: {
          $slice: ['$followers', startIndex, limitAmount],
        },
      },
    },
    { $unwind: '$followers' }, // "$followers" comes from line 288
    {
      $lookup: {
        from: 'users',
        localField: 'followers', // "$followers" comes from line 288
        foreignField: '_id',
        as: 'followersInfo',
      },
    },
    {
      $unwind: '$followersInfo',
    },
    {
      $group: {
        _id: null,
        followers: {
          $push: {
            id: '$followersInfo._id',
            name: '$followersInfo.name',
            avatar: '$followersInfo.avatar.url',
          },
        },
      },
    },
  ]);

  if (!result) {
    return res.json({ followers: [] });
  }

  return res.json({ followers: result.followers });
};

export const getUserFollowers: RequestHandler = async (req, res, next) => {
  const {
    params: { id },
  } = req;

  const { page, limit } = req.query as PaginationQuery;

  const pageNumber = parseInt(page, 10) || 1;
  const limitAmount = parseInt(limit, 10) || LIMIT_AMOUNT;
  const startIndex = (pageNumber - 1) * limitAmount;

  const [result] = await User.aggregate([
    { $match: { _id: new Types.ObjectId(id) } },
    {
      $project: {
        followers: {
          $slice: ['$followers', startIndex, limitAmount],
        },
      },
    },
    { $unwind: '$followers' }, // "$followers" comes from line 288
    {
      $lookup: {
        from: 'users',
        localField: 'followers', // "$followers" comes from line 288
        foreignField: '_id',
        as: 'followersInfo',
      },
    },
    {
      $unwind: '$followersInfo',
    },
    {
      $group: {
        _id: null,
        followers: {
          $push: {
            id: '$followersInfo._id',
            name: '$followersInfo.name',
            avatar: '$followersInfo.avatar.url',
          },
        },
      },
    },
  ]);

  if (!result) {
    return res.json({ followers: [] });
  }

  return res.json({ followers: result.followers });
};

export const getMyProfileFollowings: RequestHandler = async (
  req,
  res,
  next
) => {
  const {
    user: { id },
  } = req;

  const { page, limit } = req.query as PaginationQuery;

  const pageNumber = parseInt(page, 10) || 1;
  const limitAmount = parseInt(limit, 10) || LIMIT_AMOUNT;
  const startIndex = (pageNumber - 1) * limitAmount;

  const [result] = await User.aggregate([
    { $match: { _id: id } },
    {
      $project: {
        followings: {
          $slice: ['$followings', startIndex, limitAmount],
        },
      },
    },
    { $unwind: '$followings' }, // "$followings" comes from line 288
    {
      $lookup: {
        from: 'users',
        localField: 'followings', // "$followings" comes from line 288
        foreignField: '_id',
        as: 'followingsInfo',
      },
    },
    {
      $unwind: '$followingsInfo',
    },
    {
      $group: {
        _id: null,
        followings: {
          $push: {
            id: '$followingsInfo._id',
            name: '$followingsInfo.name',
            avatar: '$followingsInfo.avatar.url',
          },
        },
      },
    },
  ]);

  if (!result) {
    return res.json({ followings: [] });
  }

  return res.json({ followings: result.followings });
};
