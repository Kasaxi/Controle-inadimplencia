import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Clients
export const getClients = async () => {
    const { data } = await api.get('/clients');
    return data;
};

export const createClient = async (clientData: any) => {
    const { data } = await api.post('/clients', clientData);
    return data;
};

export const updateClient = async (id: string, clientData: any) => {
    const { data } = await api.put(`/clients/${id}`, clientData);
    return data;
};

export const deleteClient = async (id: string) => {
    const { data } = await api.delete(`/clients/${id}`);
    return data;
};

// Event trigger
const triggerNotificationUpdate = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('caixaflow-notifications-updated'));
    }
};

// Notifications
export const getNotifications = async (filters?: { type?: string; read?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.read !== undefined) params.set('read', filters.read);
    const { data } = await api.get(`/notifications?${params.toString()}`);
    return data;
};

export const getUnreadCount = async () => {
    const { data } = await api.get('/notifications/unread-count');
    return data.count as number;
};

export const markNotificationAsRead = async (id: string) => {
    const { data } = await api.put(`/notifications/${id}/read`);
    triggerNotificationUpdate();
    return data;
};

export const markNotificationAsUnread = async (id: string) => {
    const { data } = await api.put(`/notifications/${id}/unread`);
    triggerNotificationUpdate();
    return data;
};

export const markAllNotificationsAsRead = async () => {
    const { data } = await api.put('/notifications/read-all');
    triggerNotificationUpdate();
    return data;
};

export const deleteNotification = async (id: string) => {
    const { data } = await api.delete(`/notifications/${id}`);
    triggerNotificationUpdate();
    return data;
};

export const generateNotifications = async () => {
    const { data } = await api.post('/notifications/generate');
    triggerNotificationUpdate();
    return data;
};

export default api;
