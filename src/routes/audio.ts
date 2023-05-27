import { Router } from 'express';

import { protect, isVerifiedAccount } from '#/middlewares/auth';
import {
  getLatestUploads,
  createAudio,
  updateAudio,
} from '#/controllers/audio';
import fileParser from '#/middlewares/fileParser';
import { validate } from '#/middlewares/validator';
import { AudioValidationSchema } from '#/utils/validationSchema';
import { isValidObjectId } from 'mongoose';

const router = Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return res.status(422).json({ error: 'Please provide a valid id' });
  }
  next();
});

router.get('/latest-uploads', getLatestUploads);

router
  .route('/')
  .post(
    protect,
    isVerifiedAccount,
    fileParser,
    validate(AudioValidationSchema),
    createAudio
  );

router
  .route('/:id')
  .patch(
    protect,
    isVerifiedAccount,
    fileParser,
    validate(AudioValidationSchema),
    updateAudio
  );

export default router;
