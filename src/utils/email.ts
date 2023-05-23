import nodemailer from 'nodemailer';
import path from 'path';

import { ETHEREAL_PASSWORD, ETHEREAL_USER } from '#/utils/variables';
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
