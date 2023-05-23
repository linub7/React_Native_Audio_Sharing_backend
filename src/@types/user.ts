import { Request } from 'express';

export interface SignupUserRequest extends Request {
  body: {
    name: string;
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
