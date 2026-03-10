"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getNotifications, markNotificationAsRead, markNotificationAsUnread, markAllNotificationsAsRead, deleteNotification, generateNotifications as apiGenerateNotifications } from '@/services/api';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCheck, Trash2, RefreshCw, Filter, ExternalLink, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';

type NotificationType = 'all' | 'critical' | 'warning' | 'info';
type ReadFilter = 'all' | 'unread' | 'read';

interface Notification {
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    read: boolean;
    clientId: string | null;
    client: { id: string; name: string; cpf: string } | null;
    createdAt: string;
}

const typeConfig = {
    critical: {
        label: 'Crítico',
        icon: AlertCircle,
        gradient: 'from-rose-500 to-pink-500',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        badge: 'bg-rose-100 text-rose-700',
        dot: 'bg-rose-500',
    },
    warning: {
        label: 'Alerta',
        icon: AlertTriangle,
        gradient: 'from-amber-500 to-orange-500',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-700',
        dot: 'bg-amber-500',
    },
    info: {
        label: 'Informação',
        icon: Info,
        gradient: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-700',
        dot: 'bg-blue-500',
    },
};

export default function NotificacoesPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [typeFilter, setTypeFilter] = useState<NotificationType>('all');
    const [readFilter, setReadFilter] = useState<ReadFilter>('all');

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar notificações');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const filtered = useMemo(() => {
        let result = notifications;
        if (typeFilter !== 'all') result = result.filter(n => n.type === typeFilter);
        if (readFilter === 'unread') result = result.filter(n => !n.read);
        if (readFilter === 'read') result = result.filter(n => n.read);
        return result;
    }, [notifications, typeFilter, readFilter]);

    const counts = useMemo(() => ({
        all: notifications.length,
        critical: notifications.filter(n => n.type === 'critical').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        info: notifications.filter(n => n.type === 'info').length,
        unread: notifications.filter(n => !n.read).length,
    }), [notifications]);

    const handleMarkRead = async (id: string) => {
        try {
            await markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch { toast.error('Erro ao marcar como lida'); }
    };

    const handleMarkUnread = async (id: string) => {
        try {
            await markNotificationAsUnread(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
        } catch { toast.error('Erro ao marcar como não lida'); }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success('Todas marcadas como lidas');
        } catch { toast.error('Erro ao marcar todas'); }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Notificação removida');
        } catch { toast.error('Erro ao remover'); }
    };

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            const result = await apiGenerateNotifications();
            toast.success(result.message);
            await fetchNotifications();
        } catch { toast.error('Erro ao gerar notificações'); }
        finally { setGenerating(false); }
    };

    const handleNavigateToClient = (notification: Notification) => {
        if (!notification.read) handleMarkRead(notification.id);
        if (notification.client) {
            router.push(`/?search=${encodeURIComponent(notification.client.name)}`);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'Agora mesmo';
        if (diffMin < 60) return `${diffMin}min atrás`;
        if (diffHrs < 24) return `${diffHrs}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    const typeTabs: { key: NotificationType; label: string }[] = [
        { key: 'all', label: 'Todas' },
        { key: 'critical', label: 'Críticas' },
        { key: 'warning', label: 'Alertas' },
        { key: 'info', label: 'Info' },
    ];

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Central de Notificações</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Histórico de alertas e notificações do sistema.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleGenerate}
                        disabled={generating}
                        variant="outline"
                        className="gap-2 rounded-xl border-slate-200"
                    >
                        <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                        Verificar Novos
                    </Button>
                    {counts.unread > 0 && (
                        <Button
                            onClick={handleMarkAllRead}
                            className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white border-0 rounded-xl shadow-lg shadow-blue-500/20"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Marcar todas como lidas
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { label: 'Total', value: counts.all, gradient: 'from-slate-600 to-slate-800', shadow: 'shadow-slate-500/15' },
                    { label: 'Críticas', value: counts.critical, gradient: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/15' },
                    { label: 'Alertas', value: counts.warning, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/15' },
                    { label: 'Não lidas', value: counts.unread, gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/15' },
                ].map(card => (
                    <div key={card.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-4 shadow-lg ${card.shadow}`}>
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                        <p className="text-sm font-medium text-white/70">{card.label}</p>
                        <p className="text-2xl font-extrabold text-white mt-1">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters + List */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                {/* Filter Bar */}
                <div className="p-4 border-b border-slate-200/60 bg-slate-50/30">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                        <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl">
                            {typeTabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setTypeFilter(tab.key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${typeFilter === tab.key
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab.label}
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${typeFilter === tab.key
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-200/80 text-slate-500'
                                        }`}>
                                        {tab.key === 'all' ? counts.all : counts[tab.key as keyof typeof counts]}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl">
                            {[
                                { key: 'all' as ReadFilter, label: 'Todas' },
                                { key: 'unread' as ReadFilter, label: 'Não lidas' },
                                { key: 'read' as ReadFilter, label: 'Lidas' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setReadFilter(tab.key)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${readFilter === tab.key
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Notification List */}
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex gap-4 animate-pulse">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-100 rounded-lg w-48" />
                                        <div className="h-3 bg-slate-100 rounded-lg w-72" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">Nenhuma notificação encontrada</p>
                            <p className="text-sm text-slate-400 mt-1">Clique em "Verificar Novos" para gerar alertas.</p>
                        </div>
                    ) : (
                        filtered.map(notification => {
                            const config = typeConfig[notification.type];
                            const Icon = config.icon;
                            return (
                                <div
                                    key={notification.id}
                                    className={`flex items-start gap-4 p-4 transition-all duration-200 hover:bg-slate-50 border-l-4 ${!notification.read
                                        ? 'bg-blue-50/60 border-blue-500 shadow-sm'
                                        : 'bg-white border-transparent opacity-75 hover:opacity-100'
                                        }`}
                                >
                                    {/* Type Icon */}
                                    <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-5 h-5 ${config.text}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {!notification.read && (
                                                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                                                    Nova
                                                </span>
                                            )}
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
                                                {config.label}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">
                                                {formatDate(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className={`text-sm font-semibold ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {notification.title}
                                        </p>
                                        <p className={`text-sm mt-0.5 ${!notification.read ? 'text-slate-600' : 'text-slate-500'}`}>
                                            {notification.message}
                                        </p>
                                        {notification.client && (
                                            <button
                                                onClick={() => handleNavigateToClient(notification)}
                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold mt-2 hover:underline bg-blue-50/50 px-2.5 py-1 rounded-md transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                Ver {notification.client.name}
                                            </button>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {!notification.read && (
                                            <button
                                                onClick={() => handleMarkRead(notification.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors mr-2 shadow-sm"
                                                title="Marcar como lida"
                                            >
                                                <CheckCheck className="w-3.5 h-3.5" />
                                                Marcar Lida
                                            </button>
                                        )}
                                        {notification.read && (
                                            <button
                                                onClick={() => handleMarkUnread(notification.id)}
                                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors mr-1"
                                                title="Marcar como não lida"
                                            >
                                                <EyeOff className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notification.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remover notificação"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
