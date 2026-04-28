/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { createPortal } from "react-dom";

// ── Notification Detail Modal ─────────────────────────────────────────────────
const NotificationModal = ({
  notification,
  onClose,
  onDelete,
  getIcon,
  getTimeAgo,
}) => {
  if (!notification) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              {getIcon(notification.type)}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>
              Notification Detail
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              fontSize: 20,
              width: 36,
              height: 36,
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24 }}>
          {/* Title */}
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 12,
              lineHeight: 1.4,
            }}
          >
            {notification.title || "Notification"}
          </div>

          {/* Message */}
          {notification.message && (
            <div
              style={{
                fontSize: 14,
                color: "#374151",
                lineHeight: 1.7,
                background: "#f9fafb",
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                marginBottom: 16,
              }}
            >
              {notification.message}
            </div>
          )}

          {/* Time */}
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>
            🕐 {getTimeAgo(notification.createdAt)}
          </div>

          {/* Status badge */}
          <div style={{ marginBottom: 20 }}>
            {notification.isRead ? (
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: "#f3f4f6",
                  color: "#6b7280",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                ✓ Read
              </span>
            ) : (
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: "#eef2ff",
                  color: "#667eea",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                ● Unread
              </span>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                onDelete(notification._id);
                onClose();
              }}
              style={{
                padding: "10px 20px",
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🗑️ Delete
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main NotificationCenter ───────────────────────────────────────────────────
const NotificationCenter = ({ userType = "employee" }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null); // ← Modal ke liye
  const dropdownRef = useRef(null);

  const API_URL =
    process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

  const viewAllPath =
    userType === "admin"
      ? "/admin/notifications"
      : userType === "manager"
        ? "/manager/notifications"
        : "/employee/notifications";

  const getToken = () =>
    localStorage.getItem(`${userType}_token`) || localStorage.getItem("token");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;
      const res = await fetch(
        `${API_URL}/notifications/my-notifications?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        const notifs = data.data?.notifications || data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error("❌ Notification fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = getToken();
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("❌ Mark read error:", err);
    }
  };

  const markAllRead = async () => {
    try {
      const token = getToken();
      await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("❌ Mark all read error:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = getToken();
      await fetch(`${API_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => {
        const notif = notifications.find((n) => n._id === id);
        return notif && !notif.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {
      console.error("❌ Delete error:", err);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userType]);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  // ── Notification click → Modal ──
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) await markAsRead(notif._id);
    setSelectedNotif({ ...notif, isRead: true });
    setIsOpen(false);
  };

  const displayed = showUnreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const getIcon = (type) => {
    if (!type) return "🔔";
    if (type.includes("leave")) return "🏖️";
    if (type.includes("attendance")) return "✅";
    if (type.includes("broadcast")) return "📢";
    if (type.includes("correction")) return "⚠️";
    if (type.includes("overtime")) return "⏰";
    return "🔔";
  };

  return (
    <>
      {selectedNotif &&
        createPortal(
          <NotificationModal
            notification={selectedNotif}
            onClose={() => setSelectedNotif(null)}
            onDelete={deleteNotification}
            getIcon={getIcon}
            getTimeAgo={getTimeAgo}
          />,
          document.body,
        )}

      <div style={{ position: "relative" }} ref={dropdownRef}>
        {/* Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={S.bellBtn}
          title="Notifications"
        >
          🔔
          {unreadCount > 0 && (
            <span style={S.badge}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div style={S.dropdown}>
            {/* Header */}
            <div style={S.dropHeader}>
              <span style={S.dropTitle}>Notifications</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  style={{
                    ...S.filterBtn,
                    background: showUnreadOnly ? "#667eea" : "white",
                    color: showUnreadOnly ? "white" : "#6b7280",
                  }}
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                >
                  Unread
                </button>
                {unreadCount > 0 && (
                  <button style={S.markAllBtn} onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div style={S.listBox}>
              {loading ? (
                <div style={S.emptyBox}>
                  <div style={S.spinner}></div>
                </div>
              ) : displayed.length === 0 ? (
                <div style={S.emptyBox}>
                  <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>
                    📭
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>
                    No notifications
                  </p>
                </div>
              ) : (
                displayed.map((notif) => (
                  <div
                    key={notif._id}
                    style={{
                      ...S.notifItem,
                      background: notif.isRead ? "white" : "#f0f4ff",
                      borderLeft: notif.isRead
                        ? "3px solid transparent"
                        : "3px solid #667eea",
                    }}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div style={S.notifIcon}>{getIcon(notif.type)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.notifTitle}>
                        {notif.title || "Notification"}
                      </div>
                      {notif.message && (
                        <div style={S.notifMsg}>{notif.message}</div>
                      )}
                      <div style={S.notifTime}>
                        {getTimeAgo(notif.createdAt)}
                      </div>
                    </div>
                    {!notif.isRead && <div style={S.unreadDot}></div>}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <button
              style={S.viewAllBtn}
              onClick={() => {
                setIsOpen(false);
                navigate(viewAllPath);
              }}
            >
              View All Notifications
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </>
  );
};

const S = {
  bellBtn: {
    position: "relative",
    background: "none",
    border: "none",
    fontSize: 22,
    cursor: "pointer",
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    background: "#ef4444",
    color: "white",
    fontSize: 10,
    fontWeight: 700,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    lineHeight: 1,
    border: "2px solid white",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    width: 360,
    background: "white",
    borderRadius: 16,
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    border: "1px solid #e5e7eb",
    zIndex: 9999,
    overflow: "hidden",
    marginTop: 8,
  },
  dropHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #f3f4f6",
  },
  dropTitle: { fontSize: 16, fontWeight: 700, color: "#111827" },
  filterBtn: {
    padding: "4px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  markAllBtn: {
    padding: "4px 12px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  listBox: { maxHeight: 320, overflowY: "auto" },
  emptyBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  notifItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "14px 20px",
    cursor: "pointer",
    borderBottom: "1px solid #f9fafb",
    transition: "background 0.2s",
  },
  notifIcon: {
    fontSize: 20,
    flexShrink: 0,
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111827",
    marginBottom: 2,
  },
  notifMsg: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
    lineHeight: 1.4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  notifTime: { fontSize: 11, color: "#9ca3af" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#667eea",
    flexShrink: 0,
    marginTop: 4,
  },
  viewAllBtn: {
    width: "100%",
    padding: "14px",
    background: "#f9fafb",
    color: "#374151",
    border: "none",
    borderTop: "1px solid #f3f4f6",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default NotificationCenter;

