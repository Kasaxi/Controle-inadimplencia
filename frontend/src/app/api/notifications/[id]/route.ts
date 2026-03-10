import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, context: any) {
    try {
        const { id } = context.params;
        await prisma.notification.delete({ where: { id: String(id) } });
        return NextResponse.json({ message: 'Notification deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }
}
