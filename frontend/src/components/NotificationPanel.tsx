"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import Link from "next/link";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/services/api";

interface NotificationPanelProps {
    notifications: any[];
}

export function NotificationPanel({ notifications }: NotificationPanelProps) {
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const count = notifications.length;

    const dismissOne = async (id: string) => {
        try {
            await markNotificationAsRead(id);
        } catch (error) {
            console.error("Failed to dismiss notification", error);
        }
    };

    const dismissAll = async () => {
        try {
            await markAllNotificationsAsRead();
            setOpen(false);
        } catch (error) {
            console.error("Failed to dismiss all notifications", error);
        }
    };

    const typeConfig: Record<string, any> = {
        critical: {
            icon: AlertCircle,
            bg: "bg-red-50",
            border: "border-red-200",
            iconColor: "text-red-500",
            dot: "bg-red-500",
            titleColor: "text-red-700",
        },
        warning: {
            icon: AlertTriangle,
            bg: "bg-amber-50",
            border: "border-amber-200",
            iconColor: "text-amber-500",
            dot: "bg-amber-500",
            titleColor: "text-amber-700",
        },
        info: {
            icon: Info,
            bg: "bg-blue-50",
            border: "border-blue-200",
            iconColor: "text-blue-500",
            dot: "bg-blue-500",
            titleColor: "text-blue-700",
        },
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors relative"
            >
                <Bell className={`w-5 h-5 ${count > 0 ? 'text-slate-600' : ''}`} />
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                        {count > 99 ? "99+" : count}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-12 w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-700">Notificações</h3>
                            {count > 0 && (
                                <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                                    {count}
                                </span>
                            )}
                        </div>
                        {count > 0 && (
                            <button
                                onClick={dismissAll}
                                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Limpar tudo
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">Nenhuma notificação não lida</p>
                                <p className="text-xs text-slate-300 mt-1">Tudo em dia por aqui! 🎉</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const config = typeConfig[notif.type as string] || typeConfig.info;
                                const Icon = config.icon;
                                return (
                                    <div
                                        key={notif.id}
                                        className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors group`}
                                    >
                                        <div className={`p-1.5 rounded-lg ${config.bg} ${config.iconColor} shrink-0 mt-0.5`}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-semibold ${config.titleColor}`}>
                                                    {notif.title}
                                                </span>
                                                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                                {notif.message}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => dismissOne(notif.id)}
                                            className="p-1 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                            title="Marcar como lida"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/50">
                        <Link
                            href="/notificacoes"
                            onClick={() => setOpen(false)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                        >
                            Ver todas as notificações →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
