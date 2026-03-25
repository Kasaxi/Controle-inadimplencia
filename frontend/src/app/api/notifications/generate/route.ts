import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        
        // Settings from request body (sent from frontend)
        const CRITICAL_THRESHOLD = body.criticalThreshold ?? 2;
        const ALERT_THRESHOLD = body.alertThreshold ?? 1;
        const REMINDER_DAYS = body.reminderDays ?? 30;

        const { data: clients, error: clientsError } = await supabase
            .from('Client')
            .select('*');

        if (clientsError) throw clientsError;

        const now = new Date();
        let created = 0;

        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

        for (const client of clients) {
            // Critical: exceeds critical threshold
            if (client.overdueInstallments > CRITICAL_THRESHOLD) {
                const { data: exists } = await supabase
                    .from('Notification')
                    .select('id')
                    .eq('clientId', client.id)
                    .eq('type', 'critical')
                    .gte('createdAt', oneDayAgo)
                    .limit(1)
                    .maybeSingle();

                if (!exists) {
                    const { error } = await supabase.from('Notification').insert([{
                        "id": crypto.randomUUID(),
                        "type": 'critical',
                        "title": 'Caso Crítico',
                        "message": `${client.name} está com ${client.overdueInstallments} meses de atraso (limiar: ${CRITICAL_THRESHOLD}).`,
                        "clientId": client.id,
                        "read": false,
                        "createdAt": new Date().toISOString()
                    }]);
                    if (!error) created++;
                }
            }

            // Warning: exceeds alert threshold but not critical
            if (client.overdueInstallments > ALERT_THRESHOLD && client.overdueInstallments <= CRITICAL_THRESHOLD) {
                const { data: exists } = await supabase
                    .from('Notification')
                    .select('id')
                    .eq('clientId', client.id)
                    .eq('type', 'warning')
                    .gte('createdAt', oneDayAgo)
                    .limit(1)
                    .maybeSingle();

                if (!exists) {
                    const { error } = await supabase.from('Notification').insert([{
                        "id": crypto.randomUUID(),
                        "type": 'warning',
                        "title": 'Alerta de Atraso',
                        "message": `${client.name} está com ${client.overdueInstallments} meses de atraso.`,
                        "clientId": client.id,
                        "read": false,
                        "createdAt": new Date().toISOString()
                    }]);
                    if (!error) created++;
                }
            }

            // Info: consultation overdue
            if (client.consultationDate) {
                const consultDate = new Date(client.consultationDate);
                const daysSince = Math.floor((now.getTime() - consultDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSince > REMINDER_DAYS) {
                    const { data: exists } = await supabase
                        .from('Notification')
                        .select('id')
                        .eq('clientId', client.id)
                        .eq('type', 'info')
                        .gte('createdAt', oneDayAgo)
                        .limit(1)
                        .maybeSingle();

                    if (!exists) {
                        const { error } = await supabase.from('Notification').insert([{
                            "id": crypto.randomUUID(),
                            "type": 'info',
                            "title": 'Consulta Pendente',
                            "message": `${client.name} não é consultado há ${daysSince} dias (limite: ${REMINDER_DAYS} dias).`,
                            "clientId": client.id,
                            "read": false,
                            "createdAt": new Date().toISOString()
                        }]);
                        if (!error) created++;
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
