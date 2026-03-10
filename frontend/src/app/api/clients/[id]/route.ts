import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, context: any) {
    try {
        const { id } = context.params;
        const updateData = await request.json();

        if (updateData.consultationDate) {
            updateData.consultationDate = new Date(updateData.consultationDate);
        }

        if (updateData.overdueInstallments !== undefined) {
            updateData.overdueInstallments = Number(updateData.overdueInstallments);
        }

        const updatedClient = await prisma.client.update({
            where: { id: String(id) },
            data: updateData,
        });

        return NextResponse.json(updatedClient);
    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: any) {
    try {
        const { id } = context.params;
        await prisma.client.delete({
            where: { id: String(id) },
        });
        return NextResponse.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }
}
