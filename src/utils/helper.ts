import { UserDocument } from '#/models/User';

export const generateOTPToken = (length: number = 6) => {
  let otp = '';

  for (let index = 0; index < length; index++) {
    const digit = Math.floor(Math.random() * 10);
    otp += digit;
  }

  return otp;
};

export const formatUser = (user: UserDocument) => {
  return {
    id: user?._id,
    name: user?.name,
    email: user?.email,
    verified: user?.verified,
    followers: user?.followers?.length,
    followings: user?.followings?.length,
    avatar: user?.avatar?.url,
  };
};
