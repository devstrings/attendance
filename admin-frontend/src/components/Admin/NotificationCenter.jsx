/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNotifications } from "../../context/NotificationContext";
import {
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../services/notificationService";
import {
  approveLeaveRequest,
  rejectLeaveRequest,
} from "../../services/leaveRequestService";
import {
  approveCorrectionRequest,
  rejectCorrectionRequest,
} from "../../services/correctionRequestService";
import { useNavigate } from "react-router-dom";
import "../../styles/NotificationStyles.css";

// ── Notification Detail Modal ─────────────────────────────────────────────────
const NotificationModal = ({ notification, onClose, onDelete, getIcon, getTimeAgo }) => {
  if (!notification) return null;
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {getIcon(notification.type)}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>Notification Detail</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", fontSize: 20, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 12, lineHeight: 1.4 }}>{notification.title || "Notification"}</div>
          {notification.message && (
            <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, background: "#f9fafb", padding: "14px 16px", borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: 16 }}>
              {notification.message}
            </div>
          )}
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>🕐 {getTimeAgo(notification.createdAt)}</div>
          <div style={{ marginBottom: 20 }}>
            {notification.isRead ? (
              <span style={{ padding: "4px 12px", borderRadius: 20, background: "#f3f4f6", color: "#6b7280", fontSize: 12, fontWeight: 600 }}>✓ Read</span>
            ) : (
              <span style={{ padding: "4px 12px", borderRadius: 20, background: "#eef2ff", color: "#667eea", fontSize: 12, fontWeight: 600 }}>● Unread</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => { onDelete(notification._id); onClose(); }} style={{ padding: "10px 20px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🗑️ Delete</button>
            <button onClick={onClose} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main NotificationCenter ───────────────────────────────────────────────────
const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { notifications, unreadCount, loading, fetchNotifications, refreshNotifications, broadcastRefresh } = useNotifications();


  useEffect(() => {
    if (isOpen) fetchNotifications(20, showUnreadOnly);
  }, [isOpen, showUnreadOnly]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification._id);
        await broadcastRefresh();
      }
      setSelectedNotif({ ...notification, isRead: true });
      setIsOpen(false);
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      await refreshNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      await refreshNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleDeleteFromDropdown = async (e, notificationId) => {
    e.stopPropagation();
    await handleDelete(notificationId);
  };

  // ✅ FIXED — Leave aur Correction dono handle karta hai
  const handleQuickApprove = async (e, notification) => {
    e.stopPropagation();

    const isCorrection = notification.type === "correction_request";

    if (!window.confirm(`Are you sure you want to approve this ${isCorrection ? "correction" : "leave"} request?`)) return;

    setActionLoading(notification._id);
    try {
      if (isCorrection) {
        // ✅ Correction request approve
        const correctionRequestId = notification.metadata?.correctionRequestId;
        if (!correctionRequestId) {
          alert("Correction request ID not found");
          return;
        }
        const response = await approveCorrectionRequest(
          correctionRequestId,
          "Approved by admin from notification",
          "",
          true
        );
        if (response.success) {
          try { await deleteNotification(notification._id); } catch (e) {}
          await refreshNotifications();
          alert("✅ Correction request approved and attendance updated!");
        }
      } else {
        // ✅ Leave request approve
        const leaveRequestId = notification.metadata?.leaveRequestId;
        if (!leaveRequestId) {
          alert("Leave request ID not found");
          return;
        }
        const response = await approveLeaveRequest(leaveRequestId);
        if (response.success) {
          try { await deleteNotification(notification._id); } catch (e) {}
          await refreshNotifications();
          alert("✅ Leave request approved successfully!");
        }
      }
    } catch (error) {
      alert(error.message || "Failed to approve request");
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ FIXED — Leave aur Correction dono handle karta hai
  const handleQuickReject = async (e, notification) => {
    e.stopPropagation();

    const isCorrection = notification.type === "correction_request";
    const reason = prompt(`Please enter rejection reason:`);
    if (!reason || !reason.trim()) return;

    setActionLoading(notification._id);
    try {
      if (isCorrection) {
        // ✅ Correction request reject
        const correctionRequestId = notification.metadata?.correctionRequestId;
        if (!correctionRequestId) {
          alert("Correction request ID not found");
          return;
        }
        const response = await rejectCorrectionRequest(correctionRequestId, reason, "");
        if (response.success) {
          try { await deleteNotification(notification._id); } catch (e) {}
          await refreshNotifications();
          alert("❌ Correction request rejected");
        }
      } else {
        // ✅ Leave request reject
        const leaveRequestId = notification.metadata?.leaveRequestId;
        if (!leaveRequestId) {
          alert("Leave request ID not found");
          return;
        }
        const response = await rejectLeaveRequest(leaveRequestId, reason);
        if (response.success) {
          try { await deleteNotification(notification._id); } catch (e) {}
          await refreshNotifications();
          alert("❌ Leave request rejected");
        }
      }
    } catch (error) {
      alert(error.message || "Failed to reject request");
    } finally {
      setActionLoading(null);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      leave_request: "🏖️",
      leave_approved: "✅",
      leave_rejected: "❌",
      correction_request: "⚠️",
      correction_approved: "✅",
      correction_rejected: "❌",
      system_update: "📢",
      attendance_marked: "✓",
      attendance_corrected: "✏️",
      warning: "⚡",
      announcement: "📣",
      overtime_request: "⏰",
      overtime_approved: "✅",
      overtime_rejected: "❌",
      overtime_added: "⏰",
    };
    return icons[type] || "🔔";
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
    for (const [unit, value] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / value);
      if (interval >= 1) return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
    }
    return "Just now";
  };

  const hasQuickActions = (notification) => {
    return (
      (notification.type === "leave_request" || notification.type === "correction_request") &&
      !notification.isProcessed &&
      !notification.actionTaken  // backend se processed flag
    );
  };

  return (
    <>
      {selectedNotif &&
        createPortal(
          <NotificationModal
            notification={selectedNotif}
            onClose={() => setSelectedNotif(null)}
            onDelete={handleDelete}
            getIcon={getNotificationIcon}
            getTimeAgo={getTimeAgo}
          />,
          document.body
        )}

      <div className="notification-center" ref={dropdownRef}>
        <button className="notification-bell" onClick={() => setIsOpen(!isOpen)} aria-label="Notifications">
          <span className="bell-icon">🔔</span>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>

        {isOpen && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              <div className="notification-actions">
                <button className="filter-btn" onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
                  {showUnreadOnly ? "All" : "Unread"}
                </button>
                {unreadCount > 0 && (
                  <button className="mark-all-btn" onClick={handleMarkAllRead}>Mark all read</button>
                )}
              </div>
            </div>

            <div className="notification-list">
              {loading ? (
                <div className="notification-loading">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <span className="empty-icon">📭</span>
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`notification-item ${!notification.isRead ? "unread" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">{getNotificationIcon(notification.type)}</div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">{getTimeAgo(notification.createdAt)}</span>

                      {hasQuickActions(notification) && (
                        <div className="notification-quick-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="quick-action-btn approve"
                            onClick={(e) => handleQuickApprove(e, notification)}
                            disabled={actionLoading === notification._id}
                          >
                            {actionLoading === notification._id ? "⏳" : "✅"} Approve
                          </button>
                          <button
                            className="quick-action-btn reject"
                            onClick={(e) => handleQuickReject(e, notification)}
                            disabled={actionLoading === notification._id}
                          >
                            {actionLoading === notification._id ? "⏳" : "❌"} Reject
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      className="notification-delete"
                      onClick={(e) => handleDeleteFromDropdown(e, notification._id)}
                      aria-label="Delete notification"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="notification-footer">
              <button
                className="view-all-btn"
                onClick={() => {
                  navigate("/admin/notifications");
                  setIsOpen(false);
                }}
              >
                View All Notifications
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationCenter;
