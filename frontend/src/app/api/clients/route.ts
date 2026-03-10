import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            cpf,
            contactNumber,
            overdueInstallments,
            address,
            responsible,
            observation,
            fileUrl,
            consultationDate,
        } = body;

        const newClient = await prisma.client.create({
            data: {
                name,
                cpf,
                contactNumber,
                overdueInstallments: overdueInstallments ? Number(overdueInstallments) : 0,
                address,
                responsible,
                observation,
                fileUrl,
                consultationDate: consultationDate ? new Date(consultationDate) : null,
            },
        });

        return NextResponse.json(newClient, { status: 201 });
    } catch (error: any) {
        console.error('Error creating client:', error);
        return NextResponse.json({ error: error?.message || 'Failed to create client', details: error }, { status: 500 });
    }
}
