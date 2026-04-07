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
  
  try {
    await databases.createBooleanAttribute(DB_ID, collection, 'p1Paid', false, false);
    console.log('Created p1Paid');
  } catch (e) {
    if (e.code !== 409) console.error(`Error on p1Paid:`, e.message);
    else console.log('p1Paid already exists');
  }

  try {
    await databases.createBooleanAttribute(DB_ID, collection, 'p2Paid', false, false);
    console.log('Created p2Paid');
  } catch (e) {
    if (e.code !== 409) console.error(`Error on p2Paid:`, e.message);
    else console.log('p2Paid already exists');
  }

  try {
    await databases.createBooleanAttribute(DB_ID, collection, 'p3Paid', false, false);
    console.log('Created p3Paid');
  } catch (e) {
    if (e.code !== 409) console.error(`Error on p3Paid:`, e.message);
    else console.log('p3Paid already exists');
  }
}

addAttributes();
