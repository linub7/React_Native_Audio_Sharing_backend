import { Router } from 'express';
import { isValidObjectId } from 'mongoose';

import { toggleFavorite } from '#/controllers/favorite';
import { isVerifiedAccount, protect } from '#/middlewares/auth';

const router = Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return res.status(422).json({ error: 'Please provide a valid id' });
  }
  next();
});

router.route('/').post(protect, isVerifiedAccount, toggleFavorite);

export default router;
