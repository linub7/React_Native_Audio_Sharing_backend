import { Request } from 'express';

export interface SignupUserRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
  };
}
