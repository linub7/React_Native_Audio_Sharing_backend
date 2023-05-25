import { Router } from 'express';
import { isValidObjectId } from 'mongoose';

import {
  getHistories,
  getRecentlyPlayed,
  removeHistory,
  updateHistory,
} from '#/controllers/history';
import { protect } from '#/middlewares/auth';
import { validate } from '#/middlewares/validator';
import { UpdateHistorySchema } from '#/utils/validationSchema';

const router = Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return res.status(422).json({ error: 'Please provide a valid id' });
  }
  next();
});

router
  .route('/')
  .get(protect, getHistories)
  .post(protect, validate(UpdateHistorySchema), updateHistory)
  .delete(protect, removeHistory);

router.get('/recently-played', protect, getRecentlyPlayed);

export default router;
