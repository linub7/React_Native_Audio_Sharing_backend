import { Model, ObjectId, Schema, model, models } from 'mongoose';

export type HistoryType = {
  audio: ObjectId;
  progress: number;
  date: Date;
};

export interface HistoryDocument {
  owner: ObjectId;
  last: HistoryType;
  all: HistoryType[];
}

const HistorySchema = new Schema<HistoryDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    last: {
      audio: {
        type: Schema.Types.ObjectId,
        ref: 'Audio',
      },
      progress: Number,
      date: {
        type: Date,
        required: true,
      },
    },
    all: [
      {
        audio: {
          type: Schema.Types.ObjectId,
          ref: 'Audio',
        },
        progress: Number,
        date: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const History = models.History || model('History', HistorySchema);
export default History as Model<HistoryDocument>;
