import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const { NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT, APPWRITE_API_KEY } = process.env;

const client = new Client()
  .setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = 'main_db';

async function addAttributes() {
  const collection = 'Client';
  console.log('Adding boolean attributes...');

  for (const key of ['p1Paid', 'p2Paid', 'p3Paid', 'p4Paid', 'p5Paid', 'p6Paid']) {
    try {
      await databases.createBooleanAttribute(DB_ID, collection, key, false, false);
      console.log(`Created ${key}`);
    } catch (e) {
      if (e.code !== 409) console.error(`Error on ${key}:`, e.message);
      else console.log(`${key} already exists`);
    }
  }
}

addAttributes();
