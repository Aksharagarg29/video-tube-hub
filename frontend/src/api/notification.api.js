import api from "./axios";

export const getNotifications = (page = 1, limit = 15) =>
  api.get("/notifications", { params: { page, limit } });

export const getUnreadCount = () => api.get("/notifications/unread-count");

export const markNotificationAsRead = (notificationId) =>
  api.patch(`/notifications/${notificationId}/read`);

export const markAllNotificationsAsRead = () =>
  api.patch("/notifications/read-all");