import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT, APPWRITE_API_KEY } = process.env;

if (!NEXT_PUBLIC_APPWRITE_ENDPOINT || !APPWRITE_API_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const client = new Client()
  .setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = 'main_db';

async function addAttributes() {
  const collection = 'Client';
  console.log('Adding boolean attributes...');
  
  for (const attr of ['p1Paid', 'p2Paid', 'p3Paid']) {
      try {
        await databases.createBooleanAttribute(DB_ID, collection, attr, false, false);
        console.log(`Created ${attr}`);
      } catch (e) {
        if (e.code !== 409) console.error(`Error on ${attr}:`, e.message);
        else console.log(`${attr} already exists`);
      }
  }
  process.exit(0);
}

addAttributes();
