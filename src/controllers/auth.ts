import { RequestHandler } from 'express';
import { SignupUserRequest } from '#/@types/user';
import User from '#/models/User';

export const signup: RequestHandler = async (
  req: SignupUserRequest,
  res,
  next
) => {
  const {
    body: { name, email, password },
  } = req;

  const user = await User.create({ name, email, password });

  return res.status(201).json({
    status: 'success',
    data: { data: user },
  });
};
