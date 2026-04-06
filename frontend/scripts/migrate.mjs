import { Client, Databases, Storage, ID } from 'node-appwrite';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const { 
  NEXT_PUBLIC_APPWRITE_ENDPOINT, 
  NEXT_PUBLIC_APPWRITE_PROJECT, 
  APPWRITE_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
} = process.env;

if (!NEXT_PUBLIC_APPWRITE_ENDPOINT || !APPWRITE_API_KEY || !NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing environment variables');
  process.exit(1);
}

// Appwrite Init
const appwrite = new Client()
  .setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(APPWRITE_API_KEY);
const databases = new Databases(appwrite);
const DB_ID = 'main_db';

// Supabase Init
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateTable(tableName, collectionName, idMapFn = (d) => d) {
  console.log(`Starting migration for ${tableName} -> ${collectionName}`);
  
  let { data, error } = await supabase.from(tableName).select('*');
  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log(`No records found in ${tableName}`);
    return;
  }

  console.log(`Found ${data.length} records. Migrating...`);

  let count = 0;
  for (const item of data) {
    // Map data types and clean up
    const docData = idMapFn({...item});
    
    // Attempt to keep same ID to preserve foreign keys
    const rawId = item.id;
    let docId = rawId ? rawId.toString() : ID.unique();
    if (docId.length > 36) docId = ID.unique(); // Appwrite limit is 36
    
    // remove id from docData payload, as appwrite doesn't want the ID in the body for custom IDs
    delete docData.id;

    // Convert date properties to ISO strings without fractional parts or adjust if needed.
    // Appwrite accepts standard ISO 8601 Strings.
    
    // Make sure we pass numbers instead of strings for integer attributes
    if (docData.overdueInstallments) {
        docData.overdueInstallments = parseInt(docData.overdueInstallments, 10);
    }
    if (tableName === 'Client' && (docData.isNewClient === null || docData.isNewClient === undefined)) {
        docData.isNewClient = true; // Set default mapped fallback
    }

    try {
      await databases.createDocument(DB_ID, collectionName, docId, docData);
      count++;
    } catch (e) {
      if (e.code === 409) {
        // Document already exists, skipping
        console.warn(`Document ${docId} already exists, skipping.`);
      } else {
        console.error(`Failed to migrate record ${docId}:`, e.message);
      }
    }
  }
  console.log(`Successfully migrated ${count}/${data.length} records in ${tableName}.\n`);
}

async function run() {
  console.log('--- STARTING MIGRATION ---');
  // Be aware: supabase tables refer to the ones in your Supabase DB, 
  // ensure these names EXACTLY match your actual supabase tables (e.g., 'Client', 'Notification', 'WhatsAppContact')
  await migrateTable('Client', 'Client');
  await migrateTable('Notification', 'Notification');
  await migrateTable('WhatsAppContact', 'WhatsAppContact');
  console.log('--- MIGRATION COMPLETE ---');
}

run();
