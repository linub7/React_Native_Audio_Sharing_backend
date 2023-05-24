import { Router } from 'express';
import { isValidObjectId } from 'mongoose';

import {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
} from '#/controllers/playlist';
import { isVerifiedAccount, protect } from '#/middlewares/auth';
import { validate } from '#/middlewares/validator';
import {
  OldPlaylistValidationSchema,
  NewPlaylistValidationSchema,
} from '#/utils/validationSchema';

const router = Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return res.status(422).json({ error: 'Please provide a valid id' });
  }
  next();
});

router
  .route('/')
  .post(
    protect,
    isVerifiedAccount,
    validate(NewPlaylistValidationSchema),
    createPlaylist
  );

router
  .route('/:id')
  .patch(
    protect,
    isVerifiedAccount,
    validate(OldPlaylistValidationSchema),
    updatePlaylist
  )
  .delete(protect, isVerifiedAccount, deletePlaylist);

export default router;