import { loadSettings } from './settings';

export type AlertLevel = 'critical' | 'warning' | 'info';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    level: AlertLevel;
    clientId?: string;
    clientName?: string;
    timestamp: Date;
}

interface Client {
    id: string;
    name: string;
    overdueInstallments: number;
    consultationDate: string | null;
}

export function generateNotifications(clients: Client[]): AppNotification[] {
    const settings = loadSettings();
    const notifications: AppNotification[] = [];
    const now = new Date();

    for (const client of clients) {
        // Critical: exceeds critical threshold
        if (client.overdueInstallments > settings.criticalThreshold) {
            notifications.push({
                id: `critical-${client.id}`,
                title: 'Caso Crítico',
                message: `${client.name} está com ${client.overdueInstallments} meses de atraso (limiar: ${settings.criticalThreshold}).`,
                level: 'critical',
                clientId: client.id,
                clientName: client.name,
                timestamp: now,
            });
        }

        // Warning: exceeds alert threshold but not critical
        if (
            client.overdueInstallments > settings.alertThreshold &&
            client.overdueInstallments <= settings.criticalThreshold
        ) {
            notifications.push({
                id: `warning-${client.id}`,
                title: 'Alerta de Atraso',
                message: `${client.name} está com ${client.overdueInstallments} meses de atraso.`,
                level: 'warning',
                clientId: client.id,
                clientName: client.name,
                timestamp: now,
            });
        }

        // Info: consultation overdue
        if (client.consultationDate) {
            const lastConsult = new Date(client.consultationDate);
            const daysSince = Math.floor((now.getTime() - lastConsult.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince > settings.reminderDays) {
                notifications.push({
                    id: `reminder-${client.id}`,
                    title: 'Consulta Pendente',
                    message: `${client.name} não é consultado há ${daysSince} dias (limite: ${settings.reminderDays} dias).`,
                    level: 'info',
                    clientId: client.id,
                    clientName: client.name,
                    timestamp: now,
                });
            }
        }
    }

    // Sort: critical first, then warning, then info
    const order: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2 };
    notifications.sort((a, b) => order[a.level] - order[b.level]);

    return notifications;
}
