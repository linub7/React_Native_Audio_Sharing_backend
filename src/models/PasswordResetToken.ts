import { hash, compare } from 'bcrypt';
import { Model, ObjectId, Schema, model } from 'mongoose';

interface PasswordResetTokenDocument {
  owner: ObjectId;
  token: string;
  createdAt: Date;
}

interface Methods {
  compareToken(token: string): Promise<boolean>;
}

const PasswordResetTokenSchema = new Schema<
  PasswordResetTokenDocument,
  {},
  Methods
>({
  owner: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: 3600, // 60 min * 60 seconds = 3600s,
    default: Date.now(),
  },
});

PasswordResetTokenSchema.pre('save', async function (next) {
  if (this.isModified('token')) {
    this.token = await hash(this.token, 12);
  }
  next();
});

PasswordResetTokenSchema.methods.compareToken = async function (token) {
  const result = await compare(token, this.token);
  return result;
};

export default model('PasswordResetToken', PasswordResetTokenSchema) as Model<
  PasswordResetTokenDocument,
  {},
  Methods
>;
