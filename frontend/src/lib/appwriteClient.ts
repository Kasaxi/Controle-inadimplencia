import { Client, Storage, ID } from 'appwrite';

const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

export const appwriteStorage = new Storage(client);
export const BUCKET_ID = 'documents';
export { ID };
