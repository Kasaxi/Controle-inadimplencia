import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT, APPWRITE_API_KEY } = process.env;
const client = new Client().setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(NEXT_PUBLIC_APPWRITE_PROJECT).setKey(APPWRITE_API_KEY);
const databases = new Databases(client);
const DB_ID = 'main_db';
const C = 'Client';
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// 1) create integer attribute
try {
  await databases.createIntegerAttribute(DB_ID, C, 'firstInstallmentsPaidCount', false, 0, 6, 0);
  console.log('Created attribute firstInstallmentsPaidCount');
} catch (e) {
  if (e.code === 409) console.log('Attribute already exists');
  else { console.error('Attr error:', e.message); }
}

// wait for attribute to become available
await wait(3000);

// 2) create index for sorting
try {
  await databases.createIndex(DB_ID, C, 'idx_firstInstallmentsPaidCount', 'key', ['firstInstallmentsPaidCount']);
  console.log('Created index idx_firstInstallmentsPaidCount');
} catch (e) {
  if (e.code === 409) console.log('Index already exists');
  else console.error('Index error:', e.message);
}

await wait(2000);

// 3) backfill existing documents
let offset = 0;
let updated = 0;
const limit = 100;
while (true) {
  const res = await databases.listDocuments(DB_ID, C, [Query.limit(limit), Query.offset(offset)]);
  if (res.documents.length === 0) break;
  for (const d of res.documents) {
    const count = [d.p1Paid, d.p2Paid, d.p3Paid, d.p4Paid, d.p5Paid, d.p6Paid].filter(Boolean).length;
    if (d.firstInstallmentsPaidCount !== count) {
      try {
        await databases.updateDocument(DB_ID, C, d.$id, { firstInstallmentsPaidCount: count });
        updated++;
      } catch (e) { console.error(`Update ${d.$id} failed:`, e.message); }
    }
  }
  offset += res.documents.length;
  if (offset >= res.total) break;
}
console.log(`Backfill complete. Updated ${updated} documents.`);
