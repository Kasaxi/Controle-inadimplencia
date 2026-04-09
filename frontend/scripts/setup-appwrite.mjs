import { Client, Databases, Storage, ID, Permission, Role } from 'node-appwrite';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env first, then .env.local (standard Next.js behavior)
config();
config({ path: resolve(process.cwd(), '.env.local') });

// Load variables from .env.local if not available
const { NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT, APPWRITE_API_KEY } = process.env;

if (!NEXT_PUBLIC_APPWRITE_ENDPOINT || !NEXT_PUBLIC_APPWRITE_PROJECT || !APPWRITE_API_KEY) {
  console.error('Missing Appwrite environment variables');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = 'main_db';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createDatabase() {
  try {
    await databases.get(DB_ID);
    console.log('Database already exists.');
  } catch {
    console.log('Creating database...');
    await databases.create(DB_ID, 'Controle Inadimplencia DB');
    console.log('Database created.');
  }
}

async function createCollection(id, name) {
  try {
    await databases.getCollection(DB_ID, id);
    console.log(`Collection ${name} already exists.`);
  } catch {
    console.log(`Creating collection ${name}...`);
    await databases.createCollection(DB_ID, id, name);
    console.log(`Collection ${name} created.`);
  }
}

// Ensure attribute exists
async function attrStr(collection, key, size, required = false) {
  try {
    await databases.createStringAttribute(DB_ID, collection, key, size, required);
    console.log(`Created string attribute: ${key}`);
  } catch (e) {
    if (e.code !== 409) console.error(`Error on ${key}:`, e.message);
  }
}

async function attrInt(collection, key, required = false, defaultValue = null) {
  try {
    if (defaultValue !== null) {
        await databases.createIntegerAttribute(DB_ID, collection, key, required, -2147483648, 2147483647, defaultValue);
    } else {
        await databases.createIntegerAttribute(DB_ID, collection, key, required);
    }
    console.log(`Created integer attribute: ${key}`);
  } catch (e) {
    if (e.code !== 409) console.error(`Error on ${key}:`, e.message);
  }
}

async function attrBool(collection, key, required = false, defaultValue = null) {
  try {
    if (defaultValue !== null) {
        await databases.createBooleanAttribute(DB_ID, collection, key, required, defaultValue);
    } else {
        await databases.createBooleanAttribute(DB_ID, collection, key, required);
    }
    console.log(`Created boolean attribute: ${key}`);
  } catch (e) {
    if (e.code !== 409) console.error(`Error on ${key}:`, e.message);
  }
}

async function attrDatetime(collection, key, required = false) {
    try {
      await databases.createDatetimeAttribute(DB_ID, collection, key, required);
      console.log(`Created datetime attribute: ${key}`);
    } catch (e) {
      if (e.code !== 409) console.error(`Error on ${key}:`, e.message);
    }
  }

async function setupClient() {
  const c = 'Client';
  await createCollection(c, 'Clients');
  await attrStr(c, 'name', 255, true);
  await attrStr(c, 'cpf', 20, true);
  await attrStr(c, 'contactNumber', 50, false);
  await attrInt(c, 'overdueInstallments', false, 0);
  await attrStr(c, 'address', 500, false);
  await attrStr(c, 'responsible', 255, false);
  await attrStr(c, 'observation', 5000, false);
  await attrStr(c, 'fileUrl', 1000, false);
  await attrDatetime(c, 'consultationDate', false);
  await attrStr(c, 'alertStatus', 255, false);
  await attrDatetime(c, 'createdAt', false);
  await attrDatetime(c, 'updatedAt', false);
  await attrBool(c, 'isNewClient', false, true);
  await attrBool(c, 'p1Paid', false, false);
  await attrBool(c, 'p2Paid', false, false);
  await attrBool(c, 'p3Paid', false, false);

  // Allow time for attributes to be created before indexing
  await wait(3000);
  try {
      await databases.createIndex(DB_ID, c, 'idx_cpf', 'unique', ['cpf']);
      console.log('Created index on CPF');
  } catch(e) { if(e.code !== 409) console.error(e.message); }
}

async function setupNotification() {
  const c = 'Notification';
  await createCollection(c, 'Notifications');
  await attrStr(c, 'type', 50, true);
  await attrStr(c, 'title', 255, true);
  await attrStr(c, 'message', 2000, true);
  await attrBool(c, 'read', false, false);
  await attrStr(c, 'clientId', 50, false);
  await attrDatetime(c, 'createdAt', false);
}

async function setupContact() {
  const c = 'WhatsAppContact';
  await createCollection(c, 'WhatsAppContacts');
  await attrStr(c, 'name', 255, true);
  await attrStr(c, 'number', 50, true);
  await attrDatetime(c, 'createdAt', false);
  await attrDatetime(c, 'updatedAt', false);
}

async function setupBucket() {
  const permissions = [
    Permission.read(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ];

  try {
    await storage.getBucket('documents');
    console.log('Updating Bucket permissions...');
    await storage.updateBucket('documents', 'Documents', permissions, false, true);
    console.log('Bucket documents permissions updated.');
  } catch {
    console.log('Creating Bucket documents...');
    // allow 50mb files
    await storage.createBucket('documents', 'Documents', permissions, false, true, 50000000);
    console.log('Bucket documents created.');
  }
}

async function run() {
  console.log('Starting Appwrite Database Initialization...');
  await createDatabase();
  await setupClient();
  await setupNotification();
  await setupContact();
  await setupBucket();
  console.log('Complete!');
}

run();
