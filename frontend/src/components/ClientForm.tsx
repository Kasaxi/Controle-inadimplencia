import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient, updateClient } from '@/services/api';
import { appwriteStorage, BUCKET_ID, ID } from '@/lib/appwriteClient';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { ClientCreateInput, ClientUpdateInput } from '@/types';

interface ClientFormProps {
    initialData?: (Partial<ClientCreateInput> & { id?: string; isNewClient?: boolean }) | null;
    onSuccess: () => void;
    onCancel: () => void;
}

function formatCPF(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : '';
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function stripMask(value: string): string {
    return value.replace(/\D/g, '');
}

export function ClientForm({ initialData, onSuccess, onCancel }: ClientFormProps) {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [cpf, setCpf] = useState(formatCPF(initialData?.cpf || ''));
    const [phone, setPhone] = useState(formatPhone(initialData?.contactNumber || ''));
    const [isNewClient, setIsNewClient] = useState(initialData?.isNewClient ?? false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const rawCpf = stripMask(cpf);
        if (rawCpf.length !== 11) {
            toast.error("CPF deve conter 11 dígitos.");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData(e.currentTarget);
            const clientData: ClientCreateInput | ClientUpdateInput = {
                name: String(formData.get('name') ?? ''),
                cpf: rawCpf,
                contactNumber: stripMask(phone) || null,
                overdueInstallments: Number(formData.get('overdueInstallments') ?? 0),
                address: String(formData.get('address') ?? '') || null,
                responsible: String(formData.get('responsible') ?? '') || null,
                observation: String(formData.get('observation') ?? '') || null,
                consultationDate: String(formData.get('consultationDate') || '') || null,
                fileUrl: initialData?.fileUrl || null,
                isNewClient: isNewClient,
            };

            if (file) {
                const response = await appwriteStorage.createFile(
                    BUCKET_ID,
                    ID.unique(),
                    file
                );

                const fileUrlResult = appwriteStorage.getFileView(BUCKET_ID, response.$id);
                clientData.fileUrl = fileUrlResult.toString();
            }

            if (initialData?.id) {
                await updateClient(String(initialData.id), clientData as ClientUpdateInput);
                toast.success("Cliente atualizado com sucesso!");
            } else {
                await createClient(clientData as ClientCreateInput);
                toast.success("Cliente registrado com sucesso!");
            }

            onSuccess();
        } catch (error) {
            console.error(error);
            const err = error as Error & { response?: { data?: { error?: string } } };
            const errMsg = err.response?.data?.error || err.message || 'Erro desconhecido';
            toast.error(`Erro ao salvar cliente: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" name="name" required defaultValue={initialData?.name} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                        id="cpf"
                        name="cpf"
                        required
                        value={cpf}
                        onChange={(e) => setCpf(formatCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contactNumber">WhatsApp</Label>
                    <Input
                        id="contactNumber"
                        name="contactNumber"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="overdueInstallments">Parcelas Atrasadas</Label>
                    <Input id="overdueInstallments" name="overdueInstallments" type="number" min="0" required defaultValue={initialData?.overdueInstallments || 0} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input id="address" name="address" defaultValue={initialData?.address ?? ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="isNewClient">Tipo de Cliente</Label>
                    <Select 
                        value={isNewClient ? "true" : "false"} 
                        onValueChange={(val) => setIsNewClient(val === "true")}
                    >
                        <SelectTrigger id="isNewClient" className="w-full h-10 border-slate-200">
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="false">Cliente Antigo</SelectItem>
                            <SelectItem value="true">Cliente Novo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="responsible">Responsável</Label>
                    <Input id="responsible" name="responsible" defaultValue={initialData?.responsible ?? ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="consultationDate">Data da Consulta Manual</Label>
                    <Input id="consultationDate" name="consultationDate" type="date" defaultValue={initialData?.consultationDate?.split('T')[0] ?? ''} />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="file">Contrato (PDF ou Imagem) {initialData?.fileUrl && '(Novo arquivo substituirá atual)'}</Label>
                    <Input id="file" name="file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,image/*" />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="observation">Observações</Label>
                    <Textarea id="observation" name="observation" rows={3} defaultValue={initialData?.observation ?? ''} />
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={onCancel} disabled={loading} className="rounded-lg">
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Atualizar Cliente' : 'Registrar Cliente'}
                </Button>
            </div>
        </form>
    );
}
