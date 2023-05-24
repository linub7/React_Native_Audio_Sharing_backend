import { compare, hash } from 'bcrypt';
import { Model, ObjectId, Schema, model } from 'mongoose';

export interface UserDocument {
  _id: ObjectId;
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

interface Methods {
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<UserDocument, {}, Methods>(
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

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hash(this.password, 12);
  }
  next();
});

UserSchema.methods.comparePassword = async function (password) {
  const result = await compare(password, this.password);
  return result;
};

export default model('User', UserSchema) as Model<UserDocument, {}, Methods>;
