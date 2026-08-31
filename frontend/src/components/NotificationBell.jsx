import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";

function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);

  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [name, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value} ${name}${value > 1 ? "s" : ""} ago`;
  }

  return "just now";
}

function notificationText(notification) {
  const senderName = notification.sender?.userName || "Someone";

  switch (notification.type) {
    case "subscribe":
      return `${senderName} subscribed to your channel`;
    case "comment":
      return `${senderName} commented on your video "${notification.video?.title || "your video"}"`;
    case "like":
      if (notification.video) return `${senderName} liked your video "${notification.video.title}"`;
      if (notification.comment) return `${senderName} liked your comment`;
      if (notification.tweet) return `${senderName} liked your post`;
      return `${senderName} liked your content`;
    case "newVideo":
      return `${senderName} uploaded a new video: "${notification.video?.title || ""}"`;
    default:
      return `${senderName} interacted with your content`;
  }
}

function notificationLink(notification) {
  if (notification.video?._id) return `/watch/${notification.video._id}`;
  if (notification.type === "subscribe" && notification.sender?.userName) {
    return `/channel/${notification.sender.userName}`;
  }
  return null;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // --------------------------------
  // CLOSE ON OUTSIDE CLICK
  // --------------------------------

  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) loadNotifications();
  }

  async function handleNotificationClick(notification) {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    const link = notificationLink(notification);
    setOpen(false);
    if (link) navigate(link);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface transition"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-surface shadow-xl z-30 max-h-96 flex flex-col">

          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Notifications</p>

            {notifications.some((n) => !n.isRead) && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-primary font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading && (
              <p className="text-xs text-muted text-center py-6">Loading...</p>
            )}

            {!loading && notifications.length === 0 && (
              <p className="text-xs text-muted text-center py-6">
                No notifications yet.
              </p>
            )}

            {!loading &&
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left flex gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-bg transition ${
                    notification.isRead ? "" : "bg-primary/5"
                  }`}
                >
                  <img
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    src={notification.sender?.avatar || "https://placehold.co/32x32"}
                    alt=""
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text leading-snug line-clamp-2">
                      {notificationText(notification)}
                    </p>
                    <p className="text-[11px] text-muted mt-1">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {!notification.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}