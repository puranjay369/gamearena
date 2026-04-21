import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const envFilePath = fileURLToPath(new URL('../../.env', import.meta.url));
dotenv.config({ path: envFilePath });

export async function connectDB() {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return true;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    // eslint-disable-next-line no-console
    console.warn('[db] MONGO_URI is not set. Skipping MongoDB connection.');
    return false;
  }

  try {
    await mongoose.connect(mongoUri);
    // eslint-disable-next-line no-console
    console.log('[db] MongoDB connected');
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[db] MongoDB connection failed:', error.message);
    throw error;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
