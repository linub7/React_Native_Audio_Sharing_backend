import { RequestHandler } from 'express';
import { isValidObjectId } from 'mongoose';
import crypto from 'crypto';
import JWT from 'jsonwebtoken';
import cloudinary from '#/cloud';
import formidable from 'formidable';

import {
  SigninUserRequest,
  SignupUserRequest,
  VerifyEmailRequest,
} from '#/@types/user';
import User from '#/models/User';
import { formatUser, generateOTPToken } from '#/utils/helper';
import {
  sendForgotPasswordLink,
  sendPassResetSuccessEmail,
  sendVerificationMail,
} from '#/utils/email';
import EmailVerificationToken from '#/models/EmailVerificationToken';
import PasswordResetToken from '#/models/PasswordResetToken';
import { JWT_SECRET, PASSWORD_RESET_LINK } from '#/utils/variables';
import { RequestWithFiles } from '#/middlewares/fileParser';

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
    return res.status(422).json({ error: 'Invalid Request' });

  const user = await User.findById(userId);

  if (!user) return res.status(403).json({ error: 'Invalid Request' });

  if (user.verified)
    return res.status(422).json({ error: 'Your account already is verified!' });

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

export const myInfo: RequestHandler = async (req, res, next) => {
  const { user } = req;

  return res.json({ user });
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

export const updateProfile: RequestHandler = async (
  req: RequestWithFiles,
  res,
  next
) => {
  const {
    body: { name },
    user: { id },
  } = req;
  const avatar = req.files?.avatar as formidable.File;

  const existedUser = await User.findById(id).select('-password');
  if (!existedUser)
    throw new Error('OOOPS! Something went WRONG, user not found!');

  if (typeof name !== 'string')
    return res.status(422).json({ error: 'Invalid name!' });

  if (name.trim().length < 2)
    return res.status(422).json({ error: 'Invalid name!' });

  existedUser.name = name;

  if (avatar) {
    if (existedUser.avatar?.publicId) {
      await cloudinary.uploader.destroy(existedUser.avatar?.publicId);
    }

    const { public_id, secure_url } = await cloudinary.uploader.upload(
      avatar.filepath,
      {
        width: 300,
        height: 300,
        crop: 'thumb',
        gravity: 'face',
      }
    );
    existedUser.avatar = {
      url: secure_url,
      publicId: public_id,
    };
  }

  await existedUser.save();

  return res.json({
    user: formatUser(existedUser),
  });
};

export const signout: RequestHandler = async (req, res, next) => {
  const {
    query: { fromAll },
    user: { id },
    token,
  } = req;

  const existedUser = await User.findById(id);
  if (!existedUser)
    throw new Error('OOOPS! Something went WRONG, user not found!');

  // logout from all devices
  if (fromAll && fromAll === 'yes') {
    existedUser.tokens = [];
  } else {
    existedUser.tokens = existedUser.tokens.filter((el) => el !== token);
  }

  await existedUser.save();

  return res.json({
    success: true,
  });
};
