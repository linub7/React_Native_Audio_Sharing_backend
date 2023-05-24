import { ObjectId } from 'mongoose';

import { AudioDocument } from '#/models/Audio';

export type PopulateFavoriteList = AudioDocument<{
  _id: ObjectId;
  name: string;
}>[];
