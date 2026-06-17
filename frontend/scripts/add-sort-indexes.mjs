import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const { NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT, APPWRITE_API_KEY } = process.env;
const client = new Client().setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(NEXT_PUBLIC_APPWRITE_PROJECT).setKey(APPWRITE_API_KEY);
const databases = new Databases(client);
const DB_ID = 'main_db';
const c = 'Client';
const sortIndexes = [
  ['idx_overdueInstallments', 'overdueInstallments'],
  ['idx_name', 'name'],
  ['idx_responsible', 'responsible'],
  ['idx_contactNumber', 'contactNumber'],
  ['idx_createdAt', 'createdAt'],
];
for (const [key, attr] of sortIndexes) {
  try {
    await databases.createIndex(DB_ID, c, key, 'key', [attr]);
    console.log(`Created index on ${attr}`);
  } catch (e) {
    if (e.code === 409) console.log(`${key} already exists`);
    else console.error(`Error on ${key}:`, e.message);
  }
}
