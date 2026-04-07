import { Client, Databases, Storage, ID, Query } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import 'dotenv/config';

const {
  NEXT_PUBLIC_APPWRITE_ENDPOINT,
  NEXT_PUBLIC_APPWRITE_PROJECT,
  APPWRITE_API_KEY,
} = process.env;

const appwrite = new Client()
  .setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(appwrite);
const storage = new Storage(appwrite);

const DB_ID = 'main_db';
const CLIENTS_ID = 'Client';
const BUCKET_ID = 'documents';

async function run() {
  console.log('--- STARTING STORAGE MIGRATION ---');
  let offset = 0;
  let hasMore = true;
  let migratedCount = 0;
  
  while (hasMore) {
    const response = await databases.listDocuments(DB_ID, CLIENTS_ID, [
        Query.limit(50),
        Query.offset(offset)
    ]);
    
    for (const client of response.documents) {
      if (client.fileUrl && client.fileUrl.includes('supabase.co')) {
         console.log(`Migrating file for client: ${client.name} (${client.$id})`);
         
         try {
           const fileRes = await fetch(client.fileUrl);
           if (!fileRes.ok) {
              console.log(`  -> Failed to download: ${client.fileUrl}`);
              continue;
           }
           const arrayBuffer = await fileRes.arrayBuffer();
           const buffer = Buffer.from(arrayBuffer);
           
           // Extract extension properly or default to pdf
           let ext = 'pdf';
           try {
               const urlParts = client.fileUrl.split('?')[0].split('.');
               ext = urlParts[urlParts.length - 1];
               if (ext.length > 5 || ext.includes('/')) ext = 'pdf';
           } catch { }

           const filename = `${client.$id}_migrated.${ext}`;
           
           // For node-appwrite >= 14, InputFile.fromBuffer is used
           const inputFile = InputFile.fromBuffer(buffer, filename);
           
           const uploadRes = await storage.createFile(BUCKET_ID, ID.unique(), inputFile);
           
           // Construct the explicit public view URL 
           const newUrl = `${NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploadRes.$id}/view?project=${NEXT_PUBLIC_APPWRITE_PROJECT}`;
           
           // Update client in database with new URL
           await databases.updateDocument(DB_ID, CLIENTS_ID, client.$id, {
               fileUrl: newUrl
           });
           
           console.log(`  -> Success! File uploaded and DB updated.`);
           migratedCount++;
         } catch (e) {
           console.error(`  -> Error migrating client ${client.$id}:`, e.message);
         }
      }
    }
    
    offset += 50;
    if (offset >= response.total) {
      hasMore = false;
    }
  }
  
  console.log(`--- STORAGE MIGRATION COMPLETED! (${migratedCount} files migrated) ---`);
}

run();
