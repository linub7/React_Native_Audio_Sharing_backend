import { Router } from 'express';

import {
  signup,
  verifyEmail,
  sendReverificationToken,
  generateForgotPasswordLink,
  grantValid,
  updatePassword,
  signin,
} from '#/controllers/auth';
import { validate } from '#/middlewares/validator';
import {
  TokenAndIDValidation,
  SignupUserSchema,
  UpdatePasswordSchema,
  SigninUserSchema,
} from '#/utils/validationSchema';
import { isValidPassResetToken, protect } from '#/middlewares/auth';

const router = Router();

router.post('/signup', validate(SignupUserSchema), signup);
router.post('/signin', validate(SigninUserSchema), signin);
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

router.get('/test', protect, (req, res) => {
  res.json({
    user: req?.user,
  });
});

export default router;
