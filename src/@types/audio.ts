import { ObjectId } from 'mongoose';

import { AudioDocument } from '#/models/Audio';
import { Request } from 'express';

export type PopulateFavoriteList = AudioDocument<{
  _id: ObjectId;
  name: string;
}>;

export interface CreatePlaylistRequest extends Request {
  body: {
    title: string;
    resId?: string;
    visibility: 'public' | 'private';
  };
}

export interface UpdatePlaylistRequest extends Request {
  body: {
    title: string;
    item: string;
    visibility?: 'public' | 'private';
  };
}
