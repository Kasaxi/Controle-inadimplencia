"use client";

import { useEffect, useState, useMemo } from 'react';
import { getClients } from '@/services/api';
import { ClientTable } from '@/components/ClientTable';
import { ClientForm } from '@/components/ClientForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, FileText, PlusCircle, Users, UserX, Search, UserCheck } from 'lucide-react';
import { Toaster } from 'sonner';
import { loadSettings } from '@/lib/settings';

type FilterTab = 'all' | 'overdue' | 'current' | 'critical';

export default function HomePage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const criticalThreshold = loadSettings().criticalThreshold;

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();

    // Check for search query in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const search = params.get('search');
      if (search) {
        setSearchQuery(search);
      }
    }
  }, []);
  // KPI Calculations
  const totalClients = clients.length;
  const totalOverdue = clients.filter((c) => c.overdueInstallments > 0).length;
  const totalInstallments = clients.reduce((acc, client) => acc + client.overdueInstallments, 0);
  const criticalClients = clients.filter((c) => c.overdueInstallments > criticalThreshold).length;

  const filteredClients = useMemo(() => {
    let result = clients;

    if (activeFilter === 'overdue') {
      result = result.filter(c => c.overdueInstallments > 0);
    } else if (activeFilter === 'current') {
      result = result.filter(c => c.overdueInstallments === 0);
    } else if (activeFilter === 'critical') {
      result = result.filter(c => c.overdueInstallments > criticalThreshold);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.cpf?.toLowerCase().includes(q) ||
        c.responsible?.toLowerCase().includes(q) ||
        c.contactNumber?.toLowerCase().includes(q) ||
        c.observation?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [clients, activeFilter, searchQuery, criticalThreshold]);

  const counts = useMemo(() => ({
    all: clients.length,
    overdue: clients.filter(c => c.overdueInstallments > 0).length,
    current: clients.filter(c => c.overdueInstallments === 0).length,
    critical: clients.filter(c => c.overdueInstallments > criticalThreshold).length,
  }), [clients, criticalThreshold]);

  const handleOpenForm = (client?: any) => {
    setCurrentClient(client || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCurrentClient(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    fetchClients();
  };

  const handleViewContract = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const tabs: { key: FilterTab; label: string; icon: typeof Users; count: number }[] = [
    { key: 'all', label: 'Todos', icon: Users, count: counts.all },
    { key: 'overdue', label: 'Inadimplentes', icon: UserX, count: counts.overdue },
    { key: 'current', label: 'Em dia', icon: UserCheck, count: counts.current },
    { key: 'critical', label: 'Críticos', icon: AlertCircle, count: counts.critical },
  ];

  const kpiCards = [
    {
      title: 'Total de Clientes',
      value: totalClients,
      subtitle: 'Cadastrados no sistema',
      icon: Users,
      gradient: 'from-blue-600 to-cyan-500',
      shadowColor: 'shadow-blue-500/20',
      filter: 'all' as FilterTab,
    },
    {
      title: 'Inadimplentes',
      value: totalOverdue,
      subtitle: totalClients > 0 ? `${Math.round((totalOverdue / totalClients) * 100)}% da carteira` : 'Nenhum cliente',
      icon: UserX,
      gradient: totalOverdue > 0 ? 'from-amber-500 to-orange-500' : 'from-slate-400 to-slate-500',
      shadowColor: totalOverdue > 0 ? 'shadow-amber-500/20' : 'shadow-slate-400/10',
      filter: 'overdue' as FilterTab,
    },
    {
      title: 'Parcelas Acumuladas',
      value: totalInstallments,
      subtitle: 'Somatório de atrasos',
      icon: FileText,
      gradient: 'from-indigo-500 to-violet-500',
      shadowColor: 'shadow-indigo-500/20',
      filter: 'overdue' as FilterTab,
    },
    {
      title: 'Casos Críticos',
      value: criticalClients,
      subtitle: criticalClients > 0 ? 'Atenção prioritária' : 'Nenhum caso',
      icon: AlertCircle,
      gradient: criticalClients > 0 ? 'from-rose-500 to-pink-500' : 'from-slate-400 to-slate-500',
      shadowColor: criticalClients > 0 ? 'shadow-rose-500/20' : 'shadow-slate-400/10',
      filter: 'critical' as FilterTab,
    },
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Acompanhamento</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestão de parcelas e contratos dos clientes da Caixa.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-500/20 transition-all text-white border-0 rounded-xl px-5">
          <PlusCircle className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <button
            key={kpi.title}
            onClick={() => setActiveFilter(kpi.filter)}
            className="text-left group"
          >
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${kpi.gradient} p-5 shadow-lg ${kpi.shadowColor} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${activeFilter === kpi.filter ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-slate-50 scale-[1.02]' : ''}`}>
              {/* Decorative circles */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white/80">{kpi.title}</span>
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <kpi.icon className="w-[18px] h-[18px] text-white" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white tracking-tight">{kpi.value}</div>
                <p className="text-xs mt-1.5 text-white/60 font-medium">{kpi.subtitle}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Client Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Filter Tabs + Search */}
        <div className="p-4 border-b border-slate-200/60 bg-slate-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeFilter === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeFilter === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-200/80 text-slate-500'
                    }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF, responsável..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-72 pl-9 pr-4 py-2 text-sm border border-slate-200/60 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded-lg w-32" />
                  <div className="h-4 bg-slate-100 rounded-lg w-28" />
                  <div className="h-4 bg-slate-100 rounded-lg w-24" />
                  <div className="h-4 bg-slate-100 rounded-lg w-20" />
                  <div className="h-4 bg-slate-100 rounded-lg flex-1" />
                </div>
              ))}
            </div>
          ) : (
            <ClientTable
              clients={filteredClients}
              onEdit={handleOpenForm}
              onViewContract={handleViewContract}
              onRefresh={fetchClients}
            />
          )}
        </div>
      </div>

      {/* Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentClient ? 'Editar Acompanhamento' : 'Novo Registro de Atraso'}</DialogTitle>
          </DialogHeader>
          <ClientForm
            initialData={currentClient}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Contract Viewer - Fullscreen Overlay */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a2e]">
          <div className="flex justify-between items-center px-6 py-3 bg-[#111827] text-white shrink-0 shadow-lg">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-200">Visualizador de Documento</h2>
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
            >
              ✕ Fechar
            </button>
          </div>
          <div className="flex-1 w-full relative">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0 absolute inset-0"
                title="Visualização do Contrato"
                allow="fullscreen"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
