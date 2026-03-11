"use client";

import { ReactNode, useState, useEffect } from "react";
import { LayoutDashboard, FileText, Settings, LogOut, PanelLeftClose, PanelLeft, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationPanel } from "@/components/NotificationPanel";
import { getClients, getUnreadCount, getNotifications } from "@/services/api";

interface AppLayoutProps {
    children: ReactNode;
}

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
}

export function AppLayout({ children }: AppLayoutProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem('caixaflow-sidebar-collapsed');
        if (saved === 'true') setCollapsed(true);
    }, []);

    const navItems = [
        { name: "Acompanhamento", href: "/", icon: LayoutDashboard },
        { name: "Notificações", href: "/notificacoes", icon: Bell, badge: unreadCount },
        { name: "Configurações", href: "/configuracoes", icon: Settings },
    ];

    useEffect(() => {
        async function loadNotifications() {
            try {
                const notifs = await getNotifications({ read: 'false' });
                setNotifications(notifs);
                const count = await getUnreadCount();
                setUnreadCount(count);
            } catch (error) {
                console.error("Failed to load notifications:", error);
            }
        }

        loadNotifications();
        const interval = setInterval(loadNotifications, 5 * 60 * 1000);

        const handleUpdate = () => loadNotifications();
        window.addEventListener('caixaflow-notifications-updated', handleUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('caixaflow-notifications-updated', handleUpdate);
        };
    }, []);

    const pageTitles: Record<string, string> = {
        '/': 'Visão Geral',
        '/configuracoes': 'Configurações',
        '/notificacoes': 'Notificações',
    };
    const pageTitle = pageTitles[pathname] || 'CaixaFlow';

    return (
        <div className="flex h-screen bg-slate-50">
            {/* ─── Dark Sidebar ─── */}
            <aside
                className={`flex-col hidden md:flex transition-all duration-300 ease-in-out relative overflow-hidden ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
                style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}
            >
                {/* Decorative glow */}
                <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

                {/* Logo area */}
                <div className={`relative z-10 p-5 ${collapsed ? 'px-4' : ''}`}>
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                        <div className="flex items-center gap-3">
                            {collapsed ? (
                                <button
                                    onClick={() => { setCollapsed(false); localStorage.setItem('caixaflow-sidebar-collapsed', 'false'); }}
                                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shrink-0 hover:from-blue-400 hover:to-cyan-300 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                                    title="Expandir menu"
                                >
                                    <PanelLeft className="w-4 h-4" />
                                </button>
                            ) : (
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                                    <FileText className="w-5 h-5" />
                                </div>
                            )}
                            {!collapsed && (
                                <div>
                                    <span className="text-white font-bold text-lg tracking-tight">CaixaFlow</span>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.15em] font-medium -mt-0.5">Controle</p>
                                </div>
                            )}
                        </div>
                        {!collapsed && (
                            <button
                                onClick={() => { setCollapsed(true); localStorage.setItem('caixaflow-sidebar-collapsed', 'true'); }}
                                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                                title="Recolher menu"
                            >
                                <PanelLeftClose className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className={`relative z-10 flex-1 mt-4 space-y-1 ${collapsed ? 'px-3' : 'px-4'}`}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={item.name}
                                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${collapsed ? 'justify-center' : ''} ${isActive
                                    ? 'bg-white/10 text-white shadow-sm backdrop-blur-sm'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
                                {!collapsed && <span>{item.name}</span>}
                                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                                    <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {item.badge}
                                    </span>
                                )}
                                {collapsed && item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className={`relative z-10 border-t border-white/10 ${collapsed ? 'p-3' : 'p-4'}`}>
                    <button className={`flex items-center gap-3 px-3 py-2.5 w-full text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-xl text-sm font-medium transition-all ${collapsed ? 'justify-center' : ''}`} title="Sair">
                        <LogOut className="w-[18px] h-[18px] shrink-0" />
                        {!collapsed && <span>Sair</span>}
                    </button>
                </div>
            </aside>

            {/* ─── Main Content ─── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 z-50 relative">
                    <div>
                        <h2 className="text-base font-semibold text-slate-800">{pageTitle}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationPanel notifications={notifications} />
                        <div className="flex items-center gap-3 pl-3 border-l border-slate-200/60">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                A
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-slate-700">{getGreeting()} 👋</p>
                                <p className="text-[11px] text-slate-400 -mt-0.5">Administrador</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 relative bg-slate-50">
                    <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-slate-100/80 to-transparent pointer-events-none" />
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
