import React, { useState, useEffect } from "react";
import api from "../utils/api";
import "./NotificationBell.css";

const NotificationBell = ({ userRole }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications on component mount and periodically
  useEffect(() => {
    if (userRole) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(
        "/notifications?unread_only=false&limit=10"
      );
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.counts.unread);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      // Update local state
      setNotifications(
        notifications.map((notif) =>
          notif.id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/mark-all-read");
      setNotifications(
        notifications.map((notif) => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const notifDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - notifDate) / (1000 * 60));

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "caution_validated":
        return "💰";
      case "consignation_validated":
        return "📦";
      case "deconsignation_agent_created":
        return "📋";
      case "deconsignation_chef_filled":
        return "⏳";
      case "deconsignation_pending":
        return "⏳";
      case "deconsignation_validated":
        return "✅";
      case "restitution_validated":
        return "💸";
      default:
        return "🔔";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "high":
        return "notification-high-priority";
      case "normal":
        return "notification-normal-priority";
      case "low":
        return "notification-low-priority";
      default:
        return "notification-normal-priority";
    }
  };

  const getNotificationData = (notification) => {
    try {
      return notification.data ? JSON.parse(notification.data) : {};
    } catch (error) {
      console.error("Error parsing notification data:", error);
      return {};
    }
  };

  return (
    <div className="notification-bell-container">
      <button
        className={`notification-bell ${unreadCount > 0 ? "has-unread" : ""}`}
        onClick={() => setShowDropdown(!showDropdown)}
        title="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                title="Tout marquer comme lu"
              >
                Tout lire
              </button>
            )}
          </div>

          <div className="notification-list">
            {isLoading ? (
              <div className="notification-loading">Chargement...</div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => {
                const notificationData = getNotificationData(notification);
                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${
                      !notification.is_read ? "unread" : "read"
                    } ${getPriorityClass(notification.priority)}`}
                    onClick={() =>
                      !notification.is_read && markAsRead(notification.id)
                    }
                  >
                    <div className="notification-content">
                      <div className="notification-header-item">
                        <span className="notification-icon">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <span className="notification-title">
                          {notification.title}
                        </span>
                        <span className="notification-time">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      {notificationData && (
                        <div className="notification-details">
                          {(notificationData.client_name ||
                            notificationData.client_code) && (
                            <span className="client-info">
                              Client:{" "}
                              {notificationData.client_name ||
                                notificationData.client_code}
                            </span>
                          )}
                          {notificationData.montant && (
                            <span className="amount-info">
                              Montant: {notificationData.montant} DH
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {!notification.is_read && (
                      <div className="unread-indicator"></div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="no-notifications">Aucune notification</div>
            )}
          </div>

          <div className="notification-footer">
            <button
              className="refresh-btn"
              onClick={fetchNotifications}
              disabled={isLoading}
            >
              {isLoading ? "Actualisation..." : "Actualiser"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
