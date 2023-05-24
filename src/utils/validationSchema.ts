import * as yup from 'yup';
import { isValidObjectId } from 'mongoose';
import { categories } from './audioCategory';

export const SignupUserSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('Name is required')
    .min(3, 'Name is too short')
    .max(20, 'Name is too long'),

  email: yup.string().required('Email is required').email('Invalid email!'),
  password: yup
    .string()
    .trim()
    .required('Password is required')
    .min(8, 'Password is too short')
    .matches(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/,
      'Password should contain alphabetical characters and special character and numbers.'
    ),
});

export const SigninUserSchema = yup.object().shape({
  email: yup.string().required('Email is required').email('Invalid email!'),
  password: yup.string().trim().required('Password is required'),
});

export const TokenAndIDValidation = yup.object().shape({
  token: yup.string().trim().required('Invalid token'),
  userId: yup
    .string()
    .transform(function (value) {
      if (this.isType(value) && isValidObjectId(value)) {
        return value;
      } else {
        return '';
      }
    })
    .required('Invalid user id'),
});

export const UpdatePasswordSchema = yup.object().shape({
  token: yup.string().trim().required('Invalid token'),
  userId: yup
    .string()
    .transform(function (value) {
      if (this.isType(value) && isValidObjectId(value)) {
        return value;
      } else {
        return '';
      }
    })
    .required('Invalid user id'),
  password: yup
    .string()
    .trim()
    .required('Password is required')
    .min(8, 'Password is too short')
    .matches(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/,
      'Password should contain alphabetical characters and special character and numbers.'
    ),
});

export const AudioValidationSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  about: yup.string().required('About is required'),
  category: yup
    .string()
    .oneOf(categories, 'Invalid Category')
    .required('Category is required'),
});
