export const generateOTPToken = (length: number = 6) => {
  let otp = '';

  for (let index = 0; index < length; index++) {
    const digit = Math.floor(Math.random() * 10);
    otp += digit;
  }

  return otp;
};
