import { Router } from 'express';

import {
  signup,
  verifyEmail,
  sendReverificationToken,
  generateForgotPasswordLink,
  grantValid,
  updatePassword,
} from '#/controllers/auth';
import { validate } from '#/middlewares/validator';
import {
  TokenAndIDValidation,
  SignupUserSchema,
  UpdatePasswordSchema,
} from '#/utils/validationSchema';
import { isValidPassResetToken } from '#/middlewares/auth';

const router = Router();

router.post('/signup', validate(SignupUserSchema), signup);
router.post('/verify-email', validate(TokenAndIDValidation), verifyEmail);
router.post('/re-verify-email', sendReverificationToken);
router.post('/forgot-password', generateForgotPasswordLink);
router.post(
  '/verify-pass-reset-token',
  validate(TokenAndIDValidation),
  isValidPassResetToken,
  grantValid
);

router.post(
  '/update-password',
  validate(UpdatePasswordSchema),
  isValidPassResetToken,
  updatePassword
);

export default router;
