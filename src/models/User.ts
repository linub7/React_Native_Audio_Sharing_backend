import { Model, ObjectId, Schema, model } from 'mongoose';

interface UserDocument {
  name: string;
  email: string;
  password: string;
  verified: boolean;
  avatar?: { url: string; publicId: string };
  tokens: string[];
  favorites: ObjectId[];
  followers: ObjectId[];
  followings: ObjectId[];
}

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: Object,
      url: String,
      publicId: String,
    },
    tokens: [String],
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Audio' }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followings: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

export default model('User', UserSchema) as Model<UserDocument>;
