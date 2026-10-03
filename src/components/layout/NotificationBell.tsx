import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, AlertTriangle, ExternalLink, X } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../types';

export const NotificationBell: React.FC = () => {
  const { token, currentUser } = useAuth();
  const { navigate } = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // Poll notifications every 30 seconds while logged in
  useEffect(() => {
    if (!currentUser || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser, token]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAsRead = async (id: string, link?: string | null) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        setIsOpen(false);
        navigate(link);
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      setLoading(true);
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        id="notification-bell-btn"
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors focus:outline-hidden"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            id="notification-badge"
            className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="notification-dropdown-panel"
          className="fixed inset-x-3 top-16 w-auto bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 tracking-wide">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[10px]">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  You will be notified when your reserved books become ready to borrow.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isReady = notif.type === 'reservation_ready';
                const isExpired = notif.type === 'reservation_expired';

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors ${
                      notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50/70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isReady && (
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </div>
                        )}
                        {isExpired && (
                          <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        )}
                        {!isReady && !isExpired && (
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                            <Bell className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4
                            className={`text-xs ${
                              notif.isRead ? 'font-semibold text-slate-800' : 'font-bold text-slate-950'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="mt-2 flex items-center gap-3">
                          {notif.link && (
                            <button
                              type="button"
                              onClick={() => markAsRead(notif.id, notif.link)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900"
                            >
                              <span>View Book</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          {!notif.isRead && (
                            <button
                              type="button"
                              onClick={() => markAsRead(notif.id)}
                              className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800"
                            >
                              <Check className="w-3 h-3" />
                              <span>Mark read</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
