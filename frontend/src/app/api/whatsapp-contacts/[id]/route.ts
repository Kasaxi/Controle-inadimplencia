import { NextResponse } from 'next/server';
import { appwriteServer, DB_ID, CONTACTS_ID } from '@/lib/appwriteServer';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteParams) {
    try {
        const { id } = await context.params;
        await appwriteServer.databases.deleteDocument(DB_ID, CONTACTS_ID, id);

        return NextResponse.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Error deleting WhatsApp contact:', error);
        return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
    }
}
