import { Router } from 'express';
import { isValidObjectId } from 'mongoose';

import { isVerifiedAccount, protect } from '#/middlewares/auth';
import {
  getPublicUploads,
  updateFollower,
  getUploads,
  getPublicProfile,
  getPublicPlaylist,
} from '#/controllers/profile';

const router = Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return res.status(422).json({ error: 'Please provide a valid id' });
  }
  next();
});

router.post('/update-follower/:id', protect, isVerifiedAccount, updateFollower);
router.get('/uploads', protect, getUploads);
router.get('/uploads/:id', getPublicUploads);
router.get('/infos/:id', getPublicProfile);
router.get('/playlists/:id', getPublicPlaylist);

export default router;
