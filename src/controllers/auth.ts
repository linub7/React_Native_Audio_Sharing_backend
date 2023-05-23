import { RequestHandler } from 'express';

import { SignupUserRequest, VerifyEmailRequest } from '#/@types/user';
import User from '#/models/User';
import { generateOTPToken } from '#/utils/helper';
import { sendVerificationMail } from '#/utils/email';
import EmailVerificationToken from '#/models/EmailVerificationToken';
import { isValidObjectId } from 'mongoose';

export const signup: RequestHandler = async (
  req: SignupUserRequest,
  res,
  next
) => {
  const {
    body: { name, email, password },
  } = req;

  const user = await User.create({ name, email, password });

  // send verification email
  const token = generateOTPToken();
  console.log({ token });

  await EmailVerificationToken.create({
    owner: user._id,
    token,
  });

  const info = sendVerificationMail(token, {
    name,
    email,
    userId: user._id.toString(),
  });
  console.log(info);

  res
    .status(201)
    .json({ user: { id: user._id, name: user.name, email: user.email } });
};

export const verifyEmail: RequestHandler = async (
  req: VerifyEmailRequest,
  res,
  next
) => {
  const {
    body: { token, userId },
  } = req;

  const verificationToken = await EmailVerificationToken.findOne({
    owner: userId,
  });

  if (!verificationToken)
    return res.status(403).json({ error: 'Invalid token' });

  const matched = await verificationToken.compareToken(token);

  if (!matched) return res.status(403).json({ error: 'Invalid token' });

  await User.findByIdAndUpdate(userId, { verified: true }, { new: true });

  await EmailVerificationToken.findByIdAndDelete(verificationToken._id);

  res.json({ message: 'your email is verified' });
};

export const sendReverificationToken: RequestHandler = async (
  req: VerifyEmailRequest,
  res,
  next
) => {
  const {
    body: { userId },
  } = req;

  if (!isValidObjectId(userId))
    return res.status(404).json({ error: 'Invalid Request' });

  const user = await User.findById(userId);

  if (!user) return res.status(404).json({ error: 'Invalid Request' });

  await EmailVerificationToken.findOneAndDelete({ owner: userId });

  const token = generateOTPToken();

  await EmailVerificationToken.create({
    owner: userId,
    token,
  });

  sendVerificationMail(token, {
    name: user?.name,
    email: user?.email,
    userId: user?._id?.toString(),
  });

  res.json({ message: 'Please check your mail box.' });
};
