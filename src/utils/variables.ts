const { env } = process as { env: { [key: string]: string } };

export const {
  MONGO_URI,
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
  EMAIL_SERVICE,
  ETHEREAL_USER,
  ETHEREAL_PASSWORD,
} = env;
