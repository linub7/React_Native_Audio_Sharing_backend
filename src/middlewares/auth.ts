import { RequestHandler } from 'express';
import JWT, { JwtPayload } from 'jsonwebtoken';
import PasswordResetToken from '#/models/PasswordResetToken';
import { JWT_SECRET } from '#/utils/variables';
import User from '#/models/User';

export const isValidPassResetToken: RequestHandler = async (req, res, next) => {
  const {
    body: { userId, token },
  } = req;

  const resetToken = await PasswordResetToken.findOne({ owner: userId });

  if (!resetToken)
    return res
      .status(403)
      .json({ error: 'Unauthorized access, invalid token' });

  const matched = await resetToken.compareToken(token);

  if (!matched)
    return res
      .status(403)
      .json({ error: 'Unauthorized access, invalid token' });

  next();
};

export const protect: RequestHandler = async (req, res, next) => {
  const token = req.headers?.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Unauthorized request!' });

  const payload = JWT.verify(token, JWT_SECRET) as JwtPayload;
  const id = payload?.userId;

  const user = await User.findOne({ _id: id, tokens: token });
  if (!user) return res.status(403).json({ error: 'Unauthorized request!' });

  req.user = {
    id: user?._id,
    name: user?.name,
    email: user?.email,
    verified: user?.verified,
    followers: user?.followers?.length,
    followings: user?.followings?.length,
    avatar: user?.avatar?.url,
  };
  req.token = token;

  next();
};
