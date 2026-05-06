import { Client, Databases, Query } from 'node-appwrite';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env.local') });

const {
  NEXT_PUBLIC_APPWRITE_ENDPOINT,
  NEXT_PUBLIC_APPWRITE_PROJECT,
  APPWRITE_API_KEY,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  NEXT_PUBLIC_R2_PUBLIC_URL
} = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("Missing R2 Environment Variables");
  process.exit(1);
}

const appwrite = new Client()
  .setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(appwrite);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const DB_ID = 'main_db';
const CLIENTS_ID = 'Client';

async function run() {
  console.log('--- STARTING R2 STORAGE MIGRATION ---');
  let offset = 0;
  let hasMore = true;
  let migratedCount = 0;
  
  while (hasMore) {
    const response = await databases.listDocuments(DB_ID, CLIENTS_ID, [
        Query.limit(50),
        Query.offset(offset)
    ]);
    
    for (const client of response.documents) {
      if (client.fileUrl && client.fileUrl.includes('appwrite')) {
         console.log(`Migrating file for client: ${client.name} (${client.$id})`);
         
         try {
           const fileRes = await fetch(client.fileUrl);
           if (!fileRes.ok) {
              console.log(`  -> Failed to download: ${client.fileUrl}`);
              continue;
           }
           const arrayBuffer = await fileRes.arrayBuffer();
           const buffer = Buffer.from(arrayBuffer);
           
           // Extract extension
           let ext = 'pdf';
           const contentType = fileRes.headers.get('content-type') || 'application/pdf';
           if (contentType.includes('image/png')) ext = 'png';
           else if (contentType.includes('image/jpeg')) ext = 'jpg';
           else if (contentType.includes('image/webp')) ext = 'webp';

           const filename = `${client.$id}_migrated_${Date.now()}.${ext}`;
           
           // Upload to R2
           const command = new PutObjectCommand({
             Bucket: R2_BUCKET_NAME,
             Key: filename,
             Body: buffer,
             ContentType: contentType,
           });
           
           await r2.send(command);
           
           // Construct public URL
           const newUrl = `${NEXT_PUBLIC_R2_PUBLIC_URL}/${filename}`;
           
           // Update database
           await databases.updateDocument(DB_ID, CLIENTS_ID, client.$id, {
               fileUrl: newUrl
           });
           
           console.log(`  -> Success! File uploaded to R2 and DB updated.`);
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
  
  console.log(`--- R2 STORAGE MIGRATION COMPLETED! (${migratedCount} files migrated) ---`);
}

run();
