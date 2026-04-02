"use client";

import { useState, useEffect } from 'react';
import { ClientTable } from '@/components/ClientTable';
import { ClientForm } from '@/components/ClientForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/Pagination';
import { AlertCircle, FileText, PlusCircle, Users, UserX, Search, UserCheck, MessageSquare, Trash2, RefreshCw } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { loadSettings } from '@/lib/settings';
import { useClients, useDeleteClient, useClientStats, useWhatsAppContacts, useCreateWhatsAppContact, useDeleteWhatsAppContact } from '@/hooks/useApi';
import type { Client } from '@/types';

type FilterTab = 'all' | 'overdue' | 'current' | 'critical' | 'new';
type SortKey = 'name' | 'cpf' | 'contactNumber' | 'overdueInstallments' | 'responsible' | 'createdAt';
type SortDir = 'asc' | 'desc';

export default function HomePage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [activeFilter, debouncedSearch]);

  // Fetch stats (always for total, regardless of filters)
  const settings = loadSettings();
  const { data: stats } = useClientStats(debouncedSearch, settings.criticalThreshold);

  const { data: response, isLoading, refetch, isFetching } = useClients({
    page,
    limit,
    search: debouncedSearch,
    status: activeFilter,
    sortBy,
    sortOrder: sortDir,
    criticalThreshold: settings.criticalThreshold,
  });

  const clients = response?.data || [];
  const pagination = response?.pagination;

  const deleteClientMutation = useDeleteClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  
  // WhatsApp contacts from API (synced across browsers)
  const { data: waContacts = [], refetch: refetchWaContacts, isFetching: isFetchingWaContacts } = useWhatsAppContacts();
  const createContactMutation = useCreateWhatsAppContact();
  const deleteContactMutation = useDeleteWhatsAppContact();
  
  const [newWaName, setNewWaName] = useState('');
  const [newWaNumber, setNewWaNumber] = useState('');

  const handleSort = (key: string) => {
    const sortKey = key as SortKey;
    if (sortBy === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sortKey);
      setSortDir('asc');
    }
  };

  const tabs: { key: FilterTab; label: string; icon: typeof Users; count: number }[] = [
    { key: 'all', label: 'Todos', icon: Users, count: stats?.total || 0 },
    { key: 'overdue', label: 'Inadimplentes', icon: UserX, count: stats?.totalOverdue || 0 },
    { key: 'current', label: 'Em dia', icon: UserCheck, count: stats?.totalCurrent || 0 },
    { key: 'critical', label: 'Críticos', icon: AlertCircle, count: stats?.totalCritical || 0 },
    { key: 'new', label: 'Novos', icon: PlusCircle, count: stats?.totalNewClients || 0 },
  ];

  // KPIs from stats (global, not filtered by page)
  const totalClients = stats?.total || 0;
  const totalCurrent = stats?.totalCurrent || 0;
  const totalOverdue = stats?.totalOverdue || 0;
  const totalInstallments = stats?.totalInstallments || 0;
  const criticalClients = stats?.totalCritical || 0;
  const totalNewClients = stats?.totalNewClients || 0;

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
      title: 'Clientes em Dia',
      value: totalCurrent,
      subtitle: totalClients > 0 ? `${Math.round((totalCurrent / Math.max(totalClients, 1)) * 100)}% da carteira` : 'Nenhum cliente',
      icon: UserCheck,
      gradient: totalCurrent > 0 ? 'from-emerald-500 to-teal-500' : 'from-slate-400 to-slate-500',
      shadowColor: totalCurrent > 0 ? 'shadow-emerald-500/20' : 'shadow-slate-400/10',
      filter: 'current' as FilterTab,
    },
    {
      title: 'Inadimplentes',
      value: totalOverdue,
      subtitle: totalClients > 0 ? `${Math.round((totalOverdue / Math.max(totalClients, 1)) * 100)}% da carteira` : 'Nenhum cliente',
      icon: UserX,
      gradient: totalOverdue > 0 ? 'from-amber-500 to-orange-500' : 'from-slate-400 to-slate-500',
      shadowColor: totalOverdue > 0 ? 'shadow-amber-500/20' : 'shadow-slate-400/10',
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
      title: 'Clientes Novos',
      value: totalNewClients,
      subtitle: totalClients > 0 ? `${Math.round((totalNewClients / Math.max(totalClients, 1)) * 100)}% da base` : 'Nenhum novo',
      icon: PlusCircle,
      gradient: totalNewClients > 0 ? 'from-fuchsia-500 to-purple-600' : 'from-slate-400 to-slate-500',
      shadowColor: totalNewClients > 0 ? 'shadow-fuchsia-500/20' : 'shadow-slate-400/10',
      filter: 'new' as FilterTab,
    },
  ];

  const handleOpenForm = (client: Client | undefined) => {
    setCurrentClient(client ?? null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCurrentClient(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await deleteClientMutation.mutateAsync(clientToDelete.id);
      toast.success(`Cliente ${clientToDelete.name} excluído com sucesso!`);
      setClientToDelete(null);
    } catch (error) {
      const err = error as Error;
      console.error('Error deleting client:', error);
      toast.error(`Erro ao excluir: ${err.message || 'Desconhecido'}`);
    }
  };

  const handleViewContract = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const removeWaContact = async (id: string) => {
    try {
      await deleteContactMutation.mutateAsync(id);
      toast.success('Contato removido');
    } catch {
      toast.error('Erro ao remover contato');
    }
  };

  const saveWaContact = async () => {
    if (!newWaName.trim() || newWaNumber.replace(/\D/g, '').length < 10) {
      toast.error('Preencha um nome e um número de telefone válido com DDD.');
      return;
    }
    try {
      await createContactMutation.mutateAsync({ 
        name: newWaName.trim(), 
        number: newWaNumber.trim() 
      });
      setNewWaName('');
      setNewWaNumber('');
      toast.success('Contato salvo!');
      await refetchWaContacts();
    } catch {
      toast.error('Erro ao salvar contato');
    }
  };

  const generateWhatsAppReport = (targetNumber: string, isWeb: boolean = false) => {
    if (!targetNumber || targetNumber.replace(/\D/g, '').length < 10) {
      toast.error('Informe um número telefônico válido com DDD.');
      return;
    }

    const filterName = tabs.find(t => t.key === activeFilter)?.label || 'Todos';
    
    const eChart = String.fromCodePoint(0x1F4CA);
    const eUser = String.fromCodePoint(0x1F464);
    const ePhone = String.fromCodePoint(0x1F4DE);
    const eWarn = String.fromCodePoint(0x26A0, 0xFE0F);
    const eCheck = String.fromCodePoint(0x2705);
    const eMemo = String.fromCodePoint(0x1F4DD);

    let msg = `${eChart} *Relatório Controle de Inadimplência*\n`;
    msg += `*Filtro Atual:* ${filterName}\n`;
    msg += `*Total na lista:* ${clients.length} clientes\n\n`;

    if (clients.length > 0) {
        msg += `*Lista de Clientes:*\n`;
        clients.forEach(c => {
            msg += `${eUser} *Nome:* ${c.name}\n`;
            if (c.contactNumber) msg += `${ePhone} *Tel:* ${c.contactNumber}\n`;
            if (c.overdueInstallments > 0) {
                msg += `${eWarn} *Atraso:* ${c.overdueInstallments} parcela(s)\n`;
            } else {
                msg += `${eCheck} *Atraso:* Em dia\n`;
            }
            if (c.observation) {
                const obsShort = c.observation.length > 50 ? c.observation.substring(0, 50) + '...' : c.observation;
                msg += `${eMemo} *Obs:* ${obsShort}\n`;
            }
            msg += `--------------------------\n`;
        });
    }

    msg += `\n_Relatório extraído pela plataforma._`;

    const encodedText = encodeURIComponent(msg);
    const cleanNumber = targetNumber.replace(/\D/g, '');
    const finalNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;

    if (isWeb) {
      window.open(`https://web.whatsapp.com/send?phone=${finalNumber}&text=${encodedText}`, '_blank');
    } else {
      window.open(`whatsapp://send?phone=${finalNumber}&text=${encodedText}`, '_blank');
    }
    
    setIsWhatsappModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Acompanhamento</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestão de parcelas e contratos dos clientes da Caixa.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-10 h-10 rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all group"
            title="Atualizar dados"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 group-hover:text-slate-700 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => { refetchWaContacts(); setIsWhatsappModalOpen(true); }} className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all text-white border-0 rounded-xl px-4">
            <MessageSquare className="h-4 w-4" />
            Relatório
          </Button>
          <Button onClick={() => handleOpenForm(undefined)} className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-500/20 transition-all text-white border-0 rounded-xl px-5">
            <PlusCircle className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map((kpi) => (
          <button
            key={kpi.title}
            onClick={() => setActiveFilter(kpi.filter)}
            className="text-left group cursor-pointer focus:outline-none"
            title={`Filtrar por ${kpi.title}`}
          >
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${kpi.gradient} p-5 shadow-lg ${kpi.shadowColor} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:brightness-105 active:scale-95 ${activeFilter === kpi.filter ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-slate-50 scale-[1.02] shadow-xl' : ''}`}>
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

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
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
          {isLoading ? (
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
              clients={clients}
              onEdit={handleOpenForm}
              onDelete={handleDeleteClick}
              onViewContract={handleViewContract}
              onRefresh={() => refetch()}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
            />
          )}
          
          <Pagination
            page={page}
            totalPages={pagination?.totalPages || 1}
            total={pagination?.total || 0}
            limit={limit}
            onPageChange={setPage}
          />
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentClient ? 'Editar Acompanhamento' : 'Novo Registro de Atraso'}</DialogTitle>
          </DialogHeader>
          <ClientForm
            initialData={currentClient ?? undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirmar exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-slate-600 leading-relaxed">
            <p>
              Tem certeza que deseja excluir <strong>definitivamente</strong> o cliente{" "}
              <span className="font-semibold text-slate-800">{clientToDelete?.name}</span>?
            </p>
            <p className="mt-2 text-sm text-red-500 font-medium">Esta ação não pode ser desfeita e todos os dados serão perdidos.</p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setClientToDelete(null)} 
              disabled={deleteClientMutation.isPending}
              className="rounded-xl px-4"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteClientMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 rounded-xl px-4"
            >
              {deleteClientMutation.isPending ? 'Excluindo...' : 'Excluir Cliente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isWhatsappModalOpen} onOpenChange={setIsWhatsappModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
          <div className="p-6 pb-4 bg-slate-50/50 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-600 text-xl">
                <MessageSquare className="h-5 w-5" />
                Relatório WhatsApp
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              O relatório será gerado com <strong className="text-slate-700">{clients.length} cliente(s)</strong> do filtro atual (<strong className="text-slate-700">{tabs.find(t => t.key === activeFilter)?.label || 'Todos'}</strong>). 
            </p>
          </div>

          <div className="p-6 pt-4 max-h-[60vh] overflow-y-auto">
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Contatos Salvos</h4>
              {isFetchingWaContacts ? (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-400">Carregando...</p>
                </div>
              ) : waContacts.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-400">Nenhum contato salvo ainda.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {waContacts.map(contact => (
                    <div key={contact.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-sm transition-all group">
                      <div className="mb-2 sm:mb-0">
                        <p className="font-semibold text-slate-800 text-sm">{contact.name}</p>
                        <p className="font-mono text-xs text-slate-500">{contact.number}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => removeWaContact(contact.id)}
                          title="Remover contato"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 px-2"
                            onClick={() => generateWhatsAppReport(contact.number, true)}
                            title="Abrir no navegador (WhatsApp Web)"
                          >
                            Web
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700 border-0 px-2"
                            onClick={() => generateWhatsAppReport(contact.number, false)}
                            title="Abrir no aplicativo nativo"
                          >
                            App
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" /> Adicionar Contato
              </h4>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Nome do contato (ex: Diretoria)"
                    value={newWaName}
                    onChange={(e) => setNewWaName(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={newWaNumber}
                    onChange={(e) => setNewWaNumber(e.target.value)}
                    className="flex-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && saveWaContact()}
                  />
                  <Button
                    variant="outline"
                    className="h-9 px-3 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200"
                    onClick={saveWaContact}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent 
          className="max-w-[95vw] w-[95vw] h-[95vh] p-0 border border-slate-700 rounded-xl bg-[#1a1a2e] flex flex-col overflow-hidden z-[100] shadow-2xl sm:max-w-[95vw]" 
          showCloseButton={false}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Visualizador de Documento</DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-between items-center px-6 py-3 bg-[#111827] text-white shrink-0 shadow-lg z-10">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-200 font-bold">Visualizador de Documento</h2>
            <Button
              variant="ghost"
              onClick={() => setIsPreviewOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors h-auto border-0"
            >
              ✕ Fechar
            </Button>
          </div>
          
          <div className="flex-1 w-full relative bg-slate-100">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0 absolute inset-0"
                title="Visualização do Contrato"
                allow="fullscreen"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
