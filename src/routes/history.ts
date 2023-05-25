import { Router } from 'express';
import { isValidObjectId } from 'mongoose';

import { updateHistory } from '#/controllers/history';
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

router.route('/').post(protect, validate(UpdateHistorySchema), updateHistory);

export default router;
