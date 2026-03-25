import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getClients,
  getClientStats,
  createClient,
  updateClient,
  deleteClient,
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  deleteNotification,
  generateNotifications,
  getWhatsAppContacts,
  createWhatsAppContact,
  deleteWhatsAppContact,
  type PaginationParams,
} from "@/services/api";
import type { ClientCreateInput, ClientUpdateInput, NotificationFilters } from "@/types";

export const queryKeys = {
  clients: (params?: PaginationParams) => ["clients", params] as const,
  clientsAll: ["clients"] as const,
  notifications: (filters?: NotificationFilters) => ["notifications", filters] as const,
  unreadCount: ["unreadCount"] as const,
};

export function useClients(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.clients(params),
    queryFn: () => getClients(params),
  });
}

export function useClientStats(search?: string, criticalThreshold?: number) {
  return useQuery({
    queryKey: ['clientStats', search, criticalThreshold] as const,
    queryFn: () => getClientStats(search, criticalThreshold),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientCreateInput) => createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clientsAll });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientUpdateInput }) =>
      updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clientsAll });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clientsAll });
    },
  });
}

export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: queryKeys.notifications(filters),
    queryFn: () => getNotifications(filters),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: getUnreadCount,
    refetchInterval: 300000,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });
}

export function useMarkNotificationAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });
}

export function useGenerateNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings?: { criticalThreshold?: number; alertThreshold?: number; reminderDays?: number }) => 
      generateNotifications(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });
}

export function useWhatsAppContacts() {
  return useQuery({
    queryKey: ['whatsAppContacts'],
    queryFn: getWhatsAppContacts,
  });
}

export function useCreateWhatsAppContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, number }: { name: string; number: string }) => 
      createWhatsAppContact(name, number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsAppContacts'] });
    },
  });
}

export function useDeleteWhatsAppContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWhatsAppContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsAppContacts'] });
    },
  });
}
