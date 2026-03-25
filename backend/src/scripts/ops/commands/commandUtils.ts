/**
 * Shared utilities for ops commands.
 */

import mongoose from 'mongoose';

/** Resolve the MongoDB connection URI from environment variables. */
export const getMongoUri = (): string => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Missing MONGODB_URI (or MONGO_URI)');
  return uri;
};

/** Connect to MongoDB with a standard ops timeout and validate the db handle. */
export const connectOpsDb = async (): Promise<mongoose.mongo.Db> => {
  const uri = getMongoUri();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('Mongo connection established without database handle');
  return db;
};
