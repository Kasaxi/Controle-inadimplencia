import axios from 'axios';
import type { Client, ClientCreateInput, ClientUpdateInput, Notification, NotificationFilters } from '@/types';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'all' | 'overdue' | 'current' | 'critical';
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Clients
export const getClients = async (params?: PaginationParams): Promise<PaginatedResponse<Client>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    
    const { data } = await api.get<PaginatedResponse<Client>>(`/clients?${searchParams.toString()}`);
    return data;
};

export const createClient = async (clientData: ClientCreateInput): Promise<Client> => {
    const { data } = await api.post<Client>('/clients', clientData);
    return data;
};

export const updateClient = async (id: string, clientData: ClientUpdateInput): Promise<Client> => {
    const { data } = await api.put<Client>(`/clients/${id}`, clientData);
    return data;
};

export const deleteClient = async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
};

// Event trigger
const triggerNotificationUpdate = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('contr-inad-notifications-updated'));
    }
};

// Notifications
export const getNotifications = async (filters?: NotificationFilters): Promise<Notification[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.read) params.set('read', filters.read);
    const { data } = await api.get<Notification[]>(`/notifications?${params.toString()}`);
    return data;
};

export const getUnreadCount = async (): Promise<number> => {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count');
    return data.count;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
    triggerNotificationUpdate();
};

export const markNotificationAsUnread = async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/unread`);
    triggerNotificationUpdate();
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
    await api.put('/notifications/read-all');
    triggerNotificationUpdate();
};

export const deleteNotification = async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
    triggerNotificationUpdate();
};

export const generateNotifications = async (): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/notifications/generate');
    triggerNotificationUpdate();
    return data;
};

export default api;
