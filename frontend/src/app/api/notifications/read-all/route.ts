import { NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { appwriteServer, DB_ID, NOTIFICATIONS_ID } from '@/lib/appwriteServer';

export async function PUT() {
    try {
        // Fetch all unread
        const response = await appwriteServer.databases.listDocuments(
            DB_ID,
            NOTIFICATIONS_ID,
            [
                Query.equal('read', false),
                Query.limit(100) // max per page for safety
            ]
        );

        // Update all manually since Appwrite handles them individually
        await Promise.all(
            response.documents.map(doc => 
                appwriteServer.databases.updateDocument(
                    DB_ID,
                    NOTIFICATIONS_ID,
                    doc.$id,
                    { read: true }
                )
            )
        );

        return NextResponse.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
    }
}
