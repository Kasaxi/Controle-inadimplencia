import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        const clients = await prisma.client.findMany();
        const now = new Date();
        let created = 0;

        const CRITICAL_THRESHOLD = 3;
        const ALERT_THRESHOLD = 1;
        const REMINDER_DAYS = 30;

        for (const client of clients) {
            // Critical
            if (client.overdueInstallments > CRITICAL_THRESHOLD) {
                const exists = await prisma.notification.findFirst({
                    where: {
                        clientId: client.id,
                        type: 'critical',
                        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                    },
                });
                if (!exists) {
                    await prisma.notification.create({
                        data: {
                            type: 'critical',
                            title: 'Caso Crítico',
                            message: `${client.name} está com ${client.overdueInstallments} meses de atraso.`,
                            clientId: client.id,
                        },
                    });
                    created++;
                }
            }

            // Warning
            if (client.overdueInstallments > ALERT_THRESHOLD && client.overdueInstallments <= CRITICAL_THRESHOLD) {
                const exists = await prisma.notification.findFirst({
                    where: {
                        clientId: client.id,
                        type: 'warning',
                        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                    },
                });
                if (!exists) {
                    await prisma.notification.create({
                        data: {
                            type: 'warning',
                            title: 'Alerta de Atraso',
                            message: `${client.name} está com ${client.overdueInstallments} meses de atraso.`,
                            clientId: client.id,
                        },
                    });
                    created++;
                }
            }

            // Info: consultation overdue
            if (client.consultationDate) {
                const daysSince = Math.floor((now.getTime() - client.consultationDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSince > REMINDER_DAYS) {
                    const exists = await prisma.notification.findFirst({
                        where: {
                            clientId: client.id,
                            type: 'info',
                            createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                        },
                    });
                    if (!exists) {
                        await prisma.notification.create({
                            data: {
                                type: 'info',
                                title: 'Consulta Pendente',
                                message: `${client.name} não é consultado há ${daysSince} dias.`,
                                clientId: client.id,
                            },
                        });
                        created++;
                    }
                }
            }
        }

        return NextResponse.json({ message: `Generated ${created} new notifications` });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to generate notifications' }, { status: 500 });
    }
}
