import { Client, Databases, Storage } from 'node-appwrite';

function createAdminClient() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
        .setKey(process.env.APPWRITE_API_KEY!);

    return {
        get databases() {
            return new Databases(client);
        },
        get storage() {
            return new Storage(client);
        }
    };
}

export const appwriteServer = createAdminClient();
export const DB_ID = 'main_db';
export const CLIENTS_ID = 'Client';
export const NOTIFICATIONS_ID = 'Notification';
export const CONTACTS_ID = 'WhatsAppContact';
