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

router.get('/uploads/:id', getPublicUploads);
router.post('/update-follower/:id', protect, isVerifiedAccount, updateFollower);
router.get('/infos/:id', getPublicProfile);
router.get('/playlists/:id', getPublicPlaylist);

export default router;
