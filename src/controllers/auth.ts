import { RequestHandler } from 'express';
import { isValidObjectId } from 'mongoose';
import crypto from 'crypto';
import JWT from 'jsonwebtoken';
import {
  SigninUserRequest,
  SignupUserRequest,
  VerifyEmailRequest,
} from '#/@types/user';
import User from '#/models/User';
import { generateOTPToken } from '#/utils/helper';
import {
  sendForgotPasswordLink,
  sendPassResetSuccessEmail,
  sendVerificationMail,
} from '#/utils/email';
import EmailVerificationToken from '#/models/EmailVerificationToken';
import PasswordResetToken from '#/models/PasswordResetToken';
import {
  JWT_EXPIRES_IN,
  JWT_SECRET,
  PASSWORD_RESET_LINK,
} from '#/utils/variables';

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

export const signin: RequestHandler = async (
  req: SigninUserRequest,
  res,
  next
) => {
  const {
    body: { email, password },
  } = req;

  const existedUser = await User.findOne({ email });
  if (!existedUser)
    return res.status(403).json({ error: 'Invalid credentials!' });

  const matched = await existedUser.comparePassword(password);
  if (!matched) return res.status(403).json({ error: 'Invalid credentials!' });

  const token = JWT.sign({ userId: existedUser?._id }, JWT_SECRET);

  existedUser.tokens.push(token);

  await existedUser.save();

  return res.json({
    user: {
      id: existedUser?._id,
      name: existedUser?.name,
      email: existedUser?.email,
      verified: existedUser?.verified,
      followers: existedUser?.followers?.length,
      followings: existedUser?.followings?.length,
      avatar: existedUser?.avatar?.url,
    },
    token,
  });
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

export const generateForgotPasswordLink: RequestHandler = async (
  req,
  res,
  next
) => {
  const {
    body: { email },
  } = req;

  const existedUser = await User.findOne({ email });

  if (!existedUser)
    return res.status(404).json({ error: 'Invalid credentials.' });

  await PasswordResetToken.findOneAndDelete({ owner: existedUser?._id });

  const token = crypto.randomBytes(36).toString('hex');

  await PasswordResetToken.create({
    owner: existedUser?._id,
    token,
  });

  const resetLink = `${PASSWORD_RESET_LINK}?token=${token}&userId=${existedUser?._id}`;

  sendForgotPasswordLink({ email: existedUser?.email, link: resetLink });

  return res.json({ message: 'Check your mail box, please' });
};

export const grantValid: RequestHandler = async (req, res, next) => {
  return res.json({ valid: true });
};

export const updatePassword: RequestHandler = async (req, res, next) => {
  const {
    body: { password, userId },
  } = req;

  const existedUser = await User.findById(userId);

  if (!existedUser)
    return res.status(403).json({ error: 'Unauthorized access' });

  const matched = await existedUser.comparePassword(password);

  if (matched)
    return res
      .status(422)
      .json({ error: 'The new password must be different' });

  existedUser.password = password;
  await existedUser.save();

  await PasswordResetToken.findOneAndDelete({ owner: existedUser?._id });

  sendPassResetSuccessEmail(existedUser?.name, existedUser?.email);

  return res.json({ message: 'Password reset successfully.' });
};
