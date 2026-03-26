import { useState, useCallback, useEffect } from 'react';
import api from '../lib/api';

interface Notification {
  id: string;
  type: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  deepLink?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPreferences {
  bookingUpdates: boolean;
  promotional: boolean;
  reminders: boolean;
}

export function useNotifications(page = 1) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: json } = await api.get(`/notifications?page=${page}&limit=20`);
      const result = json.data ?? json;
      if (Array.isArray(result)) {
        setNotifications(result);
      } else if (json.success) {
        setNotifications(json.data);
      }
      setTotalPages(json.meta?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data: json } = await api.get('/notifications/unread-count');
      const result = json.data ?? json;
      setUnreadCount(result.count ?? 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    isLoading,
    unreadCount,
    totalPages,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    bookingUpdates: true,
    promotional: true,
    reminders: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: json } = await api.get('/notifications/preferences');
        const result = json.data ?? json;
        setPreferences(result);
      } catch (err) {
        console.error('Failed to fetch notification preferences:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const updatePreferences = useCallback(
    async (data: Partial<NotificationPreferences>) => {
      try {
        const { data: json } = await api.put('/notifications/preferences', data);
        const result = json.data ?? json;
        setPreferences(result);
      } catch (err) {
        console.error('Failed to update notification preferences:', err);
      }
    },
    [],
  );

  return { preferences, isLoading, updatePreferences };
}

export type { Notification, NotificationPreferences };
