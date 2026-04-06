import { NextResponse } from 'next/server';
import { appwriteServer, DB_ID, NOTIFICATIONS_ID } from '@/lib/appwriteServer';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function PUT(_request: Request, context: RouteParams) {
    try {
        const { id } = await context.params;
        await appwriteServer.databases.updateDocument(
            DB_ID,
            NOTIFICATIONS_ID,
            String(id),
            { read: false }
        );

        return NextResponse.json({ message: 'Marked as unread' });
    } catch (error) {
        console.error('Error marking as unread:', error);
        return NextResponse.json({ error: 'Failed to mark as unread' }, { status: 500 });
    }
}
