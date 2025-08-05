import { ObjectId } from "mongodb";
export interface VideoProject {
  _id?: ObjectId;
  userId: string;

  title: string;
  description?: string;

  resolution: {
    width: number;
    height: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt: Date;
}
