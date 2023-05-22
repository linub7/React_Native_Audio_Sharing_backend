import { Router } from 'express';

import { signup } from '#/controllers/auth';
import { validate } from '#/middlewares/validator';
import { SignupUserSchema } from '#/utils/validationSchema';

const router = Router();

router.post('/signup', validate(SignupUserSchema), signup);

export default router;
