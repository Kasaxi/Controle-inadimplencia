"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Gauge, Save, RotateCcw, Info, Mail, MessageSquare, Clock } from "lucide-react";
import { toast, Toaster } from "sonner";
import { AppSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from "@/lib/settings";

function getInitialSettings(): AppSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    return loadSettings();
}

export default function ConfiguracoesPage() {
    const [settings, setSettings] = useState<AppSettings>(getInitialSettings);
    const [hasChanges, setHasChanges] = useState(false);

    const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        saveSettings(settings);
        setHasChanges(false);
        toast.success("Configurações salvas com sucesso!");
    };

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        setHasChanges(true);
        toast.info("Configurações restauradas para o padrão.");
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configurações</h1>
                    <p className="text-sm text-slate-500 mt-1">Personalize o comportamento do sistema.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="gap-2 text-slate-600"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Restaurar Padrão
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Parâmetros do Sistema */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Gauge className="h-4 w-4" />
                            </div>
                            Parâmetros do Sistema
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">Defina os limites e comportamentos padrão.</p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Limiar Crítico */}
                        <div className="space-y-2">
                            <label className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-slate-700">Limiar de Caso Crítico</span>
                                    <p className="text-xs text-slate-400 mt-0.5">Clientes com parcelas acima deste valor são marcados como críticos.</p>
                                </div>
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={1}
                                    max={12}
                                    value={settings.criticalThreshold}
                                    onChange={(e) => update("criticalThreshold", Number(e.target.value))}
                                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                                />
                                <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg min-w-[60px] text-center">
                                    &gt; {settings.criticalThreshold} meses
                                </span>
                            </div>
                        </div>

                        {/* Limiar de Alerta */}
                        <div className="space-y-2">
                            <label className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-slate-700">Limiar de Alerta</span>
                                    <p className="text-xs text-slate-400 mt-0.5">A partir de quantas parcelas o cliente recebe um alerta visual.</p>
                                </div>
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={1}
                                    max={6}
                                    value={settings.alertThreshold}
                                    onChange={(e) => update("alertThreshold", Number(e.target.value))}
                                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                                <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg min-w-[60px] text-center">
                                    &gt; {settings.alertThreshold} meses
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 my-4" />

                        {/* Responsável Padrão */}
                        <div className="space-y-2">
                            <label>
                                <span className="text-sm font-medium text-slate-700">Responsável Padrão</span>
                                <p className="text-xs text-slate-400 mt-0.5">Preenchido automaticamente ao cadastrar um novo cliente.</p>
                            </label>
                            <input
                                type="text"
                                value={settings.defaultResponsible}
                                onChange={(e) => update("defaultResponsible", e.target.value)}
                                placeholder="Ex: AJMG, João Silva..."
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notificações */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                <Bell className="h-4 w-4" />
                            </div>
                            Notificações
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">Configure alertas e lembretes automáticos.</p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Toggle de notificação */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-3">
                                <Bell className="w-4 h-4 text-slate-500" />
                                <div>
                                    <span className="text-sm font-medium text-slate-700">Alerta de Casos Críticos</span>
                                    <p className="text-xs text-slate-400 mt-0.5">Notificar quando um cliente atingir o limiar crítico.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => update("notifyOnCritical", !settings.notifyOnCritical)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.notifyOnCritical ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${settings.notifyOnCritical ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">E-mail para Notificações</span>
                            </label>
                            <input
                                type="email"
                                value={settings.notifyEmail}
                                onChange={(e) => update("notifyEmail", e.target.value)}
                                placeholder="email@exemplo.com"
                                disabled={!settings.notifyOnCritical}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:bg-slate-50"
                            />
                        </div>

                        {/* WhatsApp */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">WhatsApp para Alertas</span>
                            </label>
                            <input
                                type="text"
                                value={settings.notifyWhatsApp}
                                onChange={(e) => update("notifyWhatsApp", e.target.value)}
                                placeholder="(00) 00000-0000"
                                disabled={!settings.notifyOnCritical}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:bg-slate-50"
                            />
                        </div>

                        <div className="border-t border-slate-100 my-4" />

                        {/* Lembrete de Consulta */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <div>
                                    <span className="text-sm font-medium text-slate-700">Lembrete de Consulta</span>
                                    <p className="text-xs text-slate-400 mt-0.5">Alertar quando a última consulta do cliente ultrapassar este período.</p>
                                </div>
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={7}
                                    max={90}
                                    step={7}
                                    value={settings.reminderDays}
                                    onChange={(e) => update("reminderDays", Number(e.target.value))}
                                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg min-w-[60px] text-center">
                                    {settings.reminderDays} dias
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="border-slate-200 shadow-sm lg:col-span-2">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                                <Info className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700">Sobre as Configurações</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    As configurações são salvas localmente no seu navegador. O recurso de notificações por e-mail e WhatsApp
                                    será ativado em uma atualização futura com integração ao servidor. Por enquanto, os limiares configurados
                                    aqui definem como os indicadores de cores e os filtros de &quot;Casos Críticos&quot; funcionam na tela de acompanhamento.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
