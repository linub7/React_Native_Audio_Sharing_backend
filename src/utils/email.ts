import nodemailer from 'nodemailer';
import path from 'path';

import {
  ETHEREAL_PASSWORD,
  ETHEREAL_USER,
  SIGN_IN_URL,
} from '#/utils/variables';
import { generateTemplate } from '#/mail/template';
import EmailVerificationToken from '#/models/EmailVerificationToken';

const generateMailTransporter = () => {
  const transport = nodemailer.createTransport({
    host: 'mail.openjavascript.info',
    port: 465, // Port for SMTP (usually 465)
    secure: true, // Usually true if connecting to port 465
    auth: {
      user: 'test@openjavascript.info', // Your email address
      pass: 'Nodemailer123!',
    },
  });

  return transport;
};

interface Profile {
  name: string;
  email: string;
  userId: string;
}

export const sendVerificationMail = async (token: string, profile: Profile) => {
  const transport = generateMailTransporter();

  const { name, email, userId } = profile;

  const welcomeMessage = `Hi ${name}, welcome to Podify! There are so much thing that we do for verified users. Use the given OTP to verify your email.`;

  transport.sendMail({
    to: email,
    from: 'myapp@auth.com',
    subject: 'Welcome message',
    html: generateTemplate({
      title: 'Welcome to Podify',
      message: welcomeMessage,
      logo: 'cid:logo',
      banner: 'cid:welcome',
      link: '#',
      btnTitle: token,
    }),
    attachments: [
      {
        filename: 'logo.png',
        path: path.join(__dirname, '../mail/logo.png'),
        cid: 'logo',
      },
      {
        filename: 'welcome.png',
        path: path.join(__dirname, '../mail/welcome.png'),
        cid: 'welcome',
      },
    ],
  });
};

interface Options {
  email: string;
  link: string;
}

export const sendForgotPasswordLink = async (options: Options) => {
  const transport = generateMailTransporter();

  const { email, link } = options;

  const message = `We just received a request that you forgot your password. No problem you can use the link below and create brand new password`;

  transport.sendMail({
    to: email,
    from: 'myapp@auth.com',
    subject: 'Reset Password Link',
    html: generateTemplate({
      title: 'Forgot Password',
      message,
      logo: 'cid:logo',
      banner: 'cid:forget_password',
      link,
      btnTitle: 'Reset Password',
    }),
    attachments: [
      {
        filename: 'logo.png',
        path: path.join(__dirname, '../mail/logo.png'),
        cid: 'logo',
      },
      {
        filename: 'forget_password.png',
        path: path.join(__dirname, '../mail/forget_password.png'),
        cid: 'forget_password',
      },
    ],
  });
};

export const sendPassResetSuccessEmail = async (
  name: string,
  email: string
) => {
  const transport = generateMailTransporter();

  const message = `Dear ${name} we just updated your new password.You can not sign in with your new password`;

  transport.sendMail({
    to: email,
    from: 'myapp@auth.com',
    subject: 'Password Reset Successfully',
    html: generateTemplate({
      title: 'Password Reset Successfully',
      message,
      logo: 'cid:logo',
      banner: 'cid:forget_password',
      link: SIGN_IN_URL,
      btnTitle: 'Update Password',
    }),
    attachments: [
      {
        filename: 'logo.png',
        path: path.join(__dirname, '../mail/logo.png'),
        cid: 'logo',
      },
      {
        filename: 'forget_password.png',
        path: path.join(__dirname, '../mail/forget_password.png'),
        cid: 'forget_password',
      },
    ],
  });
};
