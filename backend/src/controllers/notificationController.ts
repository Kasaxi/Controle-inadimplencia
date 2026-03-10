import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAll = async (req: any, res: any) => {
    try {
        const { type, read } = req.query;
        const where: any = {};
        if (type) where.type = type;
        if (read !== undefined) where.read = read === 'true';

        const notifications = await prisma.notification.findMany({
            where,
            include: { client: { select: { id: true, name: true, cpf: true } } },
            orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
        });
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const markAsRead = async (req: any, res: any) => {
    try {
        const notification = await prisma.notification.update({
            where: { id: req.params.id },
            data: { read: true },
        });
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

export const markAsUnread = async (req: any, res: any) => {
    try {
        const notification = await prisma.notification.update({
            where: { id: req.params.id },
            data: { read: false },
        });
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark notification as unread' });
    }
};

export const markAllAsRead = async (_req: any, res: any) => {
    try {
        await prisma.notification.updateMany({
            where: { read: false },
            data: { read: true },
        });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

export const deleteNotification = async (req: any, res: any) => {
    try {
        await prisma.notification.delete({ where: { id: req.params.id } });
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};

export const getUnreadCount = async (_req: any, res: any) => {
    try {
        const count = await prisma.notification.count({ where: { read: false } });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get count' });
    }
};

export const generate = async (_req: any, res: any) => {
    try {
        const clients = await prisma.client.findMany();
        const now = new Date();
        let created = 0;

        // Configurable thresholds (defaults)
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

        res.json({ message: `Generated ${created} new notifications` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate notifications' });
    }
};
