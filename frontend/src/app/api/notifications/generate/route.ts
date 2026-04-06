import { NextResponse } from 'next/server';
import { Query, ID } from 'node-appwrite';
import { appwriteServer, DB_ID, CLIENTS_ID, NOTIFICATIONS_ID } from '@/lib/appwriteServer';

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        
        // Settings from request body (sent from frontend)
        const CRITICAL_THRESHOLD = body.criticalThreshold ?? 2;
        const ALERT_THRESHOLD = body.alertThreshold ?? 1;
        const REMINDER_DAYS = body.reminderDays ?? 30;

        const { documents: clients } = await appwriteServer.databases.listDocuments(
            DB_ID,
            CLIENTS_ID,
            [Query.limit(5000)]
        );

        const now = new Date();
        let created = 0;

        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

        for (const client of clients) {
            // Critical: exceeds critical threshold
            if (client.overdueInstallments > CRITICAL_THRESHOLD) {
                const existing = await appwriteServer.databases.listDocuments(DB_ID, NOTIFICATIONS_ID, [
                    Query.equal('clientId', client.$id),
                    Query.equal('type', 'critical'),
                    Query.greaterThanEqual('createdAt', oneDayAgo),
                    Query.limit(1)
                ]);

                if (existing.total === 0) {
                    try {
                        await appwriteServer.databases.createDocument(DB_ID, NOTIFICATIONS_ID, ID.unique(), {
                            type: 'critical',
                            title: 'Caso Crítico',
                            message: `${client.name} está com ${client.overdueInstallments} meses de atraso (limiar: ${CRITICAL_THRESHOLD}).`,
                            clientId: client.$id,
                            read: false,
                            createdAt: new Date().toISOString()
                        });
                        created++;
                    } catch (e) {
                         console.error('Error creating critical notice', e);
                    }
                }
            }

            // Warning: exceeds alert threshold but not critical
            if (client.overdueInstallments > ALERT_THRESHOLD && client.overdueInstallments <= CRITICAL_THRESHOLD) {
                const existing = await appwriteServer.databases.listDocuments(DB_ID, NOTIFICATIONS_ID, [
                    Query.equal('clientId', client.$id),
                    Query.equal('type', 'warning'),
                    Query.greaterThanEqual('createdAt', oneDayAgo),
                    Query.limit(1)
                ]);

                if (existing.total === 0) {
                    try {
                        await appwriteServer.databases.createDocument(DB_ID, NOTIFICATIONS_ID, ID.unique(), {
                            type: 'warning',
                            title: 'Alerta de Atraso',
                            message: `${client.name} está com ${client.overdueInstallments} meses de atraso.`,
                            clientId: client.$id,
                            read: false,
                            createdAt: new Date().toISOString()
                        });
                        created++;
                    } catch (e) {
                        console.error('Error creating warning notice', e);
                    }
                }
            }

            // Info: consultation overdue
            if (client.consultationDate) {
                const consultDate = new Date(client.consultationDate);
                const daysSince = Math.floor((now.getTime() - consultDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSince > REMINDER_DAYS) {
                    const existing = await appwriteServer.databases.listDocuments(DB_ID, NOTIFICATIONS_ID, [
                        Query.equal('clientId', client.$id),
                        Query.equal('type', 'info'),
                        Query.greaterThanEqual('createdAt', oneDayAgo),
                        Query.limit(1)
                    ]);

                    if (existing.total === 0) {
                        try {
                            await appwriteServer.databases.createDocument(DB_ID, NOTIFICATIONS_ID, ID.unique(), {
                                type: 'info',
                                title: 'Consulta Pendente',
                                message: `${client.name} não é consultado há ${daysSince} dias (limite: ${REMINDER_DAYS} dias).`,
                                clientId: client.$id,
                                read: false,
                                createdAt: new Date().toISOString()
                            });
                            created++;
                        } catch (e) {
                            console.error('Error creating info notice', e);
                        }
                    }
                }
            }
        }

        return NextResponse.json({ message: `${created} nova(s) notificação(ões) gerada(s)` });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Falha ao gerar notificações' }, { status: 500 });
    }
}
