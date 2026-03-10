import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const count = await prisma.notification.count({ where: { read: false } });
        return NextResponse.json({ count });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to get count' }, { status: 500 });
    }
}
