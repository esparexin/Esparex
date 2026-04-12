import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, getUserConnection } from '../../../config/db';

/** Resolve the MongoDB connection URI from environment variables. */
export const getMongoUri = (): string => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Missing MONGODB_URI (or MONGO_URI)');
  return uri;
};

/** Connect to MongoDB using the app's connection manager and return the user DB handle. */
export const connectOpsDb = async (): Promise<mongoose.mongo.Db> => {
  await connectDB();
  const db = getUserConnection().db;
  if (!db) throw new Error('User DB connection established without database handle');
  return db;
};
