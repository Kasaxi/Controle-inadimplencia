export interface Client {
  id: string;
  name: string;
  cpf: string;
  contactNumber: string | null;
  overdueInstallments: number;
  address: string | null;
  responsible: string | null;
  observation: string | null;
  fileUrl: string | null;
  consultationDate: string | null;
  alertStatus: string | null;
  isNewClient: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientCreateInput {
  name: string;
  cpf: string;
  contactNumber?: string | null;
  overdueInstallments?: number;
  address?: string | null;
  responsible?: string | null;
  observation?: string | null;
  consultationDate?: string | null;
  fileUrl?: string | null;
  isNewClient?: boolean;
}

export interface ClientUpdateInput {
  name?: string;
  cpf?: string;
  contactNumber?: string | null;
  overdueInstallments?: number;
  address?: string | null;
  responsible?: string | null;
  observation?: string | null;
  consultationDate?: string | null;
  fileUrl?: string | null;
  alertStatus?: string | null;
  isNewClient?: boolean;
}

export type NotificationType = 'critical' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  clientId: string | null;
  client: Pick<Client, 'id' | 'name' | 'cpf'> | null;
  createdAt: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  read?: 'true' | 'false';
}

export interface AppSettings {
  criticalThreshold: number;
  alertThreshold: number;
  defaultResponsible: string;
  notifyOnCritical: boolean;
  notifyEmail: string;
  notifyWhatsApp: string;
  reminderDays: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface UnreadCountResponse {
  count: number;
}
