import { NextResponse } from 'next/server';
import { appwriteServer, DB_ID, NOTIFICATIONS_ID } from '@/lib/appwriteServer';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteParams) {
    try {
        const { id } = await context.params;
        await appwriteServer.databases.deleteDocument(DB_ID, NOTIFICATIONS_ID, String(id));

        return NextResponse.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }
}
