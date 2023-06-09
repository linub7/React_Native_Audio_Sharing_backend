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
      return this.isType(value) && isValidObjectId(value) ? value : '';
    })
    .required('Invalid user id'),
});

export const UpdatePasswordSchema = yup.object().shape({
  token: yup.string().trim().required('Invalid token'),
  userId: yup
    .string()
    .transform(function (value) {
      return this.isType(value) && isValidObjectId(value) ? value : '';
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

export const NewPlaylistValidationSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  resId: yup.string().transform(function (value) {
    return this.isType(value) && isValidObjectId(value) ? value : '';
  }),
  visibility: yup
    .string()
    .oneOf(['public', 'private'], 'visibility must be public or private')
    .required('Visibility is required'),
});

export const OldPlaylistValidationSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  // this is gonna validate audio id
  item: yup.string().transform(function (value) {
    return this.isType(value) && isValidObjectId(value) ? value : '';
  }),
  visibility: yup
    .string()
    .oneOf(['public', 'private'], 'visibility must be public or private'),
});

export const UpdateHistorySchema = yup.object().shape({
  audio: yup
    .string()
    .transform(function (value) {
      return this.isType(value) && isValidObjectId(value) ? value : '';
    })
    .required('Audio is required!'),
  progress: yup.number().required('History Progress is required'),
  date: yup
    .string()
    .transform(function (value) {
      const date = new Date(value);
      if (date instanceof Date) return value;
      else return '';
    })
    .required('Date is required!'),
});
