"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, Edit2 } from 'lucide-react';
import { updateClient } from '@/services/api';
import { toast } from 'sonner';
import type { Client } from '@/types';

function displayCPF(val: string): string {
    const d = val?.replace(/\D/g, '') || '';
    if (d.length !== 11) return val;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function displayPhone(val: string): string {
    const d = val?.replace(/\D/g, '') || '';
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return val;
}

interface ClientTableProps {
    clients: Client[];
    onEdit: (client: Client) => void;
    onViewContract: (url: string) => void;
    onRefresh?: (silent?: boolean) => void;
    onDelete?: (client: Client) => void;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    onSort?: (key: SortKey) => void;
}

type SortKey = keyof Client;

const PARCEL_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const DEFAULT_WIDTHS: Record<string, number> = {
    name: 180,
    cpf: 140,
    contactNumber: 130,
    responsible: 140,
    overdueInstallments: 120,
    consultationDate: 140,
    observation: 200,
    fileUrl: 120,
    actions: 140,
};

export function ClientTable({ clients, onEdit, onViewContract, onRefresh, onDelete, sortBy, sortDir = 'asc', onSort }: ClientTableProps) {
    const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
        if (typeof window === 'undefined') return { ...DEFAULT_WIDTHS };
        try {
            const saved = localStorage.getItem('contr-inad-col-widths-v2');
            if (saved) return { ...DEFAULT_WIDTHS, ...JSON.parse(saved) };
        } catch { }
        return { ...DEFAULT_WIDTHS };
    });
    const [editingParcel, setEditingParcel] = useState<string | null>(null);
    const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

    const [editingCell, setEditingCell] = useState<{ id: string; key: SortKey } | null>(null);
    const [editValue, setEditValue] = useState('');

    const handleCellDoubleClick = (client: Client, key: SortKey) => {
        setEditingCell({ id: client.id, key });
        let val = client[key] || '';
        if (key === 'consultationDate' && val) {
            val = String(val).split('T')[0];
        }
        setEditValue(String(val));
    };

    const handleCellSave = async (client: Client, key: SortKey) => {
        if (!editingCell) return;
        const newVal = editValue.trim();
        const oldValRaw = client[key] || '';
        
        let oldValComp = String(oldValRaw).trim();
        if (key === 'consultationDate' && oldValRaw) {
             oldValComp = String(oldValRaw).split('T')[0];
        }

        setEditingCell(null);
        if (newVal === oldValComp) return;

        try {
            let saveVal: string | number | null = newVal;
            if (key === 'cpf' || key === 'contactNumber') {
                 saveVal = newVal.replace(/\D/g, '');
            }
            if (key === 'consultationDate' && !saveVal) {
                 saveVal = null;
            }

            await updateClient(String(client.id), { [key]: saveVal } as never);
            toast.success("Atualizado com sucesso!");
            onRefresh?.(true);
        } catch {
            toast.error("Erro ao atualizar campo.");
        }
    };

    const handleCellKeyDown = (e: React.KeyboardEvent, client: Client, key: SortKey) => {
        if (e.key === 'Enter') handleCellSave(client, key);
        else if (e.key === 'Escape') setEditingCell(null);
    };

    const renderCell = (client: Client, key: SortKey, displayValue: React.ReactNode, type: 'text' | 'date' | 'textarea' = 'text') => {
        const isEditing = editingCell?.id === client.id && editingCell?.key === key;

        if (isEditing) {
            const commonClasses = "w-full text-xs p-1 border border-blue-400 rounded outline-none focus:ring-2 focus:ring-blue-200 bg-white text-slate-900";
            if (type === 'textarea') {
                return (
                    <textarea
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellSave(client, key)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingCell(null);
                        }}
                        className={`${commonClasses} resize-none min-h-[40px]`}
                        rows={2}
                    />
                );
            }
            return (
                <input
                    type={type}
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleCellSave(client, key)}
                    onKeyDown={(e) => handleCellKeyDown(e, client, key)}
                    className={commonClasses}
                />
            );
        }

        return (
            <div
                onDoubleClick={() => handleCellDoubleClick(client, key)}
                className="w-full h-full min-h-[24px] flex items-center cursor-text group/cell rounded hover:bg-black/5 px-1 -mx-1 transition-colors"
                title="Dê um duplo clique para editar"
            >
                {displayValue}
            </div>
        );
    };

    const resizingCol = useRef<string | null>(null);
    const startX = useRef(0);
    const startW = useRef(0);

    const handleSort = (key: SortKey) => {
        onSort?.(key);
    };

    const sortedClients = [...clients].sort((a, b) => {
        if (!sortBy) return 0;
        const aVal = a[sortBy as keyof Client];
        const bVal = b[sortBy as keyof Client];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const strA = String(aVal).toLowerCase();
        const strB = String(bVal).toLowerCase();
        return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    const onMouseDown = useCallback((col: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resizingCol.current = col;
        startX.current = e.clientX;
        startW.current = colWidths[col] || DEFAULT_WIDTHS[col];

        const onMouseMove = (ev: MouseEvent) => {
            if (!resizingCol.current) return;
            const diff = ev.clientX - startX.current;
            const newW = Math.max(60, startW.current + diff);
            setColWidths(prev => ({ ...prev, [resizingCol.current!]: newW }));
        };

        const onMouseUp = () => {
            resizingCol.current = null;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            // Persist column widths
            setColWidths(current => {
                try { localStorage.setItem('contr-inad-col-widths-v2', JSON.stringify(current)); } catch { }
                return current;
            });
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [colWidths]);

    const handleParcelChange = async (client: Client, newVal: number) => {
        setEditingParcel(null);
        setPopoverPos(null);
        if (newVal === client.overdueInstallments) return;
        try {
            await updateClient(String(client.id), { overdueInstallments: newVal });
            toast.success(`Parcelas de ${client.name} atualizadas para ${newVal}`);
            onRefresh?.(true);
        } catch {
            toast.error("Erro ao atualizar parcelas.");
        }
    };

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortBy !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
        return sortDir === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
    };

    const columns = [
        { key: 'name', label: 'Cliente', sticky: true },
        { key: 'cpf', label: 'CPF' },
        { key: 'contactNumber', label: 'Contato' },
        { key: 'responsible', label: 'Responsável' },
        { key: 'overdueInstallments', label: 'Parcelas' },
        { key: 'consultationDate', label: 'Última Consulta' },
        { key: 'observation', label: 'Observações' },
        { key: 'fileUrl', label: 'Contrato' },
        { key: 'actions', label: 'Ações' },
    ];

    const totalWidth = columns.reduce((sum, col) => sum + (colWidths[col.key] || DEFAULT_WIDTHS[col.key] || 100), 0);

    return (
        <div className="w-full overflow-x-auto relative">
            <table className="text-sm border-collapse" style={{ tableLayout: 'fixed', width: `${totalWidth}px` }}>
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                        {columns.map((col, idx) => {
                            const width = colWidths[col.key] || DEFAULT_WIDTHS[col.key];
                            const isSortable = col.key !== 'fileUrl' && col.key !== 'actions';
                            const isLast = idx === columns.length - 1;
                            return (
                                <th
                                    key={col.key}
                                    className={`relative px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap select-none ${!isLast ? 'border-r border-slate-200/60' : ''
                                        } ${col.sticky ? 'sticky left-0 z-20 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''
                                        }`}
                                    style={{ width: `${width}px`, minWidth: '60px', maxWidth: `${width}px`, overflow: 'hidden' }}
                                >
                                    <div
                                        className={`flex items-center ${isSortable ? 'cursor-pointer hover:text-slate-900' : ''}`}
                                        onClick={() => isSortable && handleSort(col.key as SortKey)}
                                    >
                                        {col.label}
                                        {isSortable && <SortIcon col={col.key as SortKey} />}
                                    </div>
                                    {col.key !== 'actions' && (
                                        <div
                                            onMouseDown={(e) => onMouseDown(col.key, e)}
                                            className="absolute right-0 top-0 bottom-0 w-[6px] cursor-col-resize group/resize z-10 flex items-center justify-center"
                                        >
                                            <div className="w-[2px] h-4 rounded-full bg-transparent group-hover/resize:bg-blue-400 transition-colors" />
                                        </div>
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {sortedClients.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-8 text-slate-400">
                                Nenhum cliente encontrado.
                            </td>
                        </tr>
                    ) : (
                        sortedClients.map((client) => (
                            <tr key={client.id} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors">
                                {/* Cliente - Sticky */}
                                <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-slate-900 whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] border-r border-slate-200/60 overflow-hidden text-ellipsis">
                                    {renderCell(client, 'name', client.name)}
                                </td>
                                {/* CPF */}
                                <td className="px-4 py-3 text-slate-700 whitespace-nowrap font-mono text-xs border-r border-slate-200/60 overflow-hidden text-ellipsis">
                                    {renderCell(client, 'cpf', displayCPF(client.cpf))}
                                </td>
                                {/* Contato */}
                                <td className="px-4 py-3 text-slate-700 whitespace-nowrap border-r border-slate-200/60 overflow-hidden text-ellipsis">
                                    {renderCell(client, 'contactNumber', client.contactNumber ? displayPhone(client.contactNumber) : '-')}
                                </td>
                                {/* Responsável */}
                                <td className="px-4 py-3 text-slate-700 whitespace-nowrap border-r border-slate-200/60 overflow-hidden text-ellipsis">
                                    {renderCell(client, 'responsible', client.responsible || '-')}
                                </td>
                                {/* Parcelas - Fixed Popover Edit */}
                                <td className="px-4 py-3 whitespace-nowrap border-r border-slate-200/60">
                                    <button
                                        onClick={(e) => {
                                            if (editingParcel === client.id) {
                                                setEditingParcel(null);
                                                setPopoverPos(null);
                                            } else {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setPopoverPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
                                                setEditingParcel(client.id);
                                            }
                                        }}
                                        className="cursor-pointer group"
                                        title="Clique para alterar"
                                    >
                                        {client.overdueInstallments > 0 ? (
                                            <Badge className={`font-normal transition-all group-hover:ring-2 group-hover:ring-offset-1 ${client.overdueInstallments > 2
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200 group-hover:ring-red-300'
                                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200 group-hover:ring-amber-300'
                                                }`} variant="outline">
                                                {client.overdueInstallments} {client.overdueInstallments === 1 ? 'mês' : 'meses'}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-500 font-normal bg-slate-50 group-hover:ring-2 group-hover:ring-slate-300 group-hover:ring-offset-1 transition-all">
                                                Em dia
                                            </Badge>
                                        )}
                                    </button>

                                    {editingParcel === client.id && popoverPos && (
                                        <>
                                            <div className="fixed inset-0 z-[9998]" onClick={() => { setEditingParcel(null); setPopoverPos(null); }} />
                                            <div
                                                className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-slate-200 p-3 min-w-[220px]"
                                                style={{ top: popoverPos.top, left: popoverPos.left, transform: 'translateX(-50%)' }}
                                            >
                                                <div className="flex items-center justify-between mb-2.5 px-0.5">
                                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Meses em atraso</span>
                                                    <button onClick={() => { setEditingParcel(null); setPopoverPos(null); }} className="text-slate-300 hover:text-slate-500 text-sm leading-none">✕</button>
                                                </div>
                                                <div className="grid grid-cols-5 gap-1.5">
                                                    {PARCEL_OPTIONS.map(n => (
                                                        <button
                                                            key={n}
                                                            onClick={() => handleParcelChange(client, n)}
                                                            className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${n === client.overdueInstallments
                                                                ? 'bg-blue-600 text-white shadow-md scale-110 ring-2 ring-blue-300'
                                                                : n > 2
                                                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                                                                    : n > 0
                                                                        ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100'
                                                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                                                                }`}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </td>
                                {/* Última Consulta */}
                                <td className="px-4 py-3 text-slate-700 whitespace-nowrap border-r border-slate-200/60">
                                    {renderCell(client, 'consultationDate', client.consultationDate ? format(new Date(client.consultationDate), "dd/MM/yyyy", { locale: ptBR }) : '-', 'date')}
                                </td>
                                {/* Observações */}
                                <td className="px-4 py-3 text-slate-600 border-r border-slate-200/60 overflow-hidden">
                                    {renderCell(client, 'observation', (
                                        <span className="line-clamp-2 text-xs" title={client.observation || ''}>
                                            {client.observation || <span className="text-slate-300 italic">—</span>}
                                        </span>
                                    ), 'textarea')}
                                </td>
                                {/* Contrato */}
                                <td className="px-4 py-3 whitespace-nowrap border-r border-slate-200/60">
                                    {client.fileUrl ? (
                                        <Button variant="link" size="sm" className="text-blue-600 p-0 h-auto" onClick={() => onViewContract(client.fileUrl!)}>
                                            Ver Contrato
                                        </Button>
                                    ) : (
                                        <span className="text-slate-300 text-xs">Sem arquivo</span>
                                    )}
                                </td>
                                {/* Ações */}
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="icon" onClick={() => onEdit(client)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100 flex-shrink-0 w-8 h-8" title="Editar Cliente">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        {onDelete && (
                                            <Button variant="outline" size="icon" onClick={() => onDelete(client)} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 flex-shrink-0 w-8 h-8" title="Excluir Cliente">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
