import { Router } from 'express';
import { isValidObjectId } from 'mongoose';

import {
  isAuthenticated,
  isVerifiedAccount,
  protect,
} from '#/middlewares/auth';
import {
  getPublicUploads,
  updateFollower,
  getUploads,
  getPublicProfile,
  getPublicPlaylist,
  getRecommendedByProfile,
  getMyProfileFollowers,
  getMyProfileFollowings,
  getUserFollowers,
  getPublicPlaylistAudios,
  getIsFollowing,
} from '#/controllers/profile';

const router = Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return res.status(422).json({ error: 'Please provide a valid id' });
  }
  next();
});

router.get('/uploads', protect, getUploads);
router.get('/recommended', isAuthenticated, getRecommendedByProfile);
router.get('/followings', protect, getMyProfileFollowings);
router.get('/followers', protect, getMyProfileFollowers);
router.get('/followers/:id', protect, getUserFollowers);

router.get('/uploads/:id', getPublicUploads);
router.post('/update-follower/:id', protect, isVerifiedAccount, updateFollower);
router.get('/infos/:id', getPublicProfile);
router.get('/playlists/:id', getPublicPlaylist);
router.get('/playlists-audios/:id', getPublicPlaylistAudios);
router.get('/is-following/:id', protect, getIsFollowing);

export default router;
