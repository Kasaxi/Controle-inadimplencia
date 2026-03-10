import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, context: any) {
    try {
        const { id } = context.params;
        const notification = await prisma.notification.update({
            where: { id: String(id) },
            data: { read: true },
        });
        return NextResponse.json(notification);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
    }
}
