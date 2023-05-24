import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: any;
        name: string;
        email: string;
        verified: boolean;
        followers: number;
        followings: number;
        avatar?: string;
      };
    }
  }
}

export interface SignupUserRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

export interface SigninUserRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export interface VerifyEmailRequest extends Request {
  body: {
    token: string;
    userId: string;
  };
}
