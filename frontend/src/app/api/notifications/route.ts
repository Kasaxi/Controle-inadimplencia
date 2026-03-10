import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type');
        const read = searchParams.get('read');

        const where: any = {};
        if (type) where.type = type;
        if (read !== null) where.read = read === 'true';

        const notifications = await prisma.notification.findMany({
            where,
            include: { client: { select: { id: true, name: true, cpf: true } } },
            orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
        });
        return NextResponse.json(notifications);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}
