import { Router } from 'express';

import {
  signup,
  verifyEmail,
  sendReverificationToken,
} from '#/controllers/auth';
import { validate } from '#/middlewares/validator';
import {
  EmailVerificationBody,
  SignupUserSchema,
} from '#/utils/validationSchema';

const router = Router();

router.post('/signup', validate(SignupUserSchema), signup);
router.post('/verify-email', validate(EmailVerificationBody), verifyEmail);
router.post('/re-verify-email', sendReverificationToken);

export default router;
