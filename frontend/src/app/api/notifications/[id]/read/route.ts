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
            { read: true }
        );

        return NextResponse.json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Error marking as read:', error);
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
    }
}
