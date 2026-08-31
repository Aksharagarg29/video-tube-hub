import { useCallback, useEffect, useState } from "react";
import {
  getNotifications as fetchNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/notification.api";
import { useAuth } from "../context/AuthContext";

const POLL_INTERVAL_MS = 30000;

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.data.count);
    } catch {
      // Silently ignore; the badge just won't update this cycle.
    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetchNotifications();
      setNotifications(res.data.data || []);
    } catch {
      // Ignore; keep showing whatever we last had.
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Poll the unread count every 30s so the badge stays fresh even
  // if the user never opens the dropdown.
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, refreshUnreadCount]);

  async function markAsRead(notificationId) {
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));
    try {
      await markNotificationAsRead(notificationId);
    } catch {
      // Worst case the badge is briefly wrong until the next poll corrects it.
    }
  }

  async function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsAsRead();
    } catch {
      // Next poll will correct the count if this failed.
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}