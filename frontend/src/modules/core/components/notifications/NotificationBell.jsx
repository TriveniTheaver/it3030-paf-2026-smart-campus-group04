import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- polling fetch updates local state */
  useEffect(() => {
    if (!currentUser) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser, fetchNotifications]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readStatus: true } : n)));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  if (!currentUser) return null;

  const unreadCount = notifications.filter((n) => !n.readStatus).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="relative p-2 text-sliit-blue hover:text-sliit-navy transition-all transform active:scale-95"
        aria-label="Open notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-500 rounded-full ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 w-96 mt-4 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden z-[100] border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-5 bg-slate-50 flex justify-between items-center gap-3 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <span className="sc-label truncate">Notifications</span>
              {unreadCount > 0 && <span className="text-xs font-semibold text-red-600 shrink-0">{unreadCount} unread</span>}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 transition-colors shrink-0"
              aria-label="Close notifications"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                  <Bell size={32} />
                </div>
                <p className="sc-meta">All clear for now.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.readStatus && markAsRead(notif.id)}
                  className={`p-6 border-b border-slate-50 transition-all cursor-pointer hover:bg-slate-50 ${notif.readStatus ? 'opacity-60' : 'bg-blue-50/30'}`}
                >
                  <div className="flex gap-4">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.readStatus ? 'bg-slate-300' : 'bg-red-500'}`}></div>
                    <div className="space-y-1">
                      <p className={`text-sm ${notif.readStatus ? 'font-medium text-slate-600' : 'font-semibold text-sliit-blue'}`}>
                        {notif.message}
                      </p>
                      <p className="sc-label">
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-slate-50 flex items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={fetchNotifications}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className={[
                'text-xs font-semibold transition-colors',
                unreadCount === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-sliit-blue hover:text-sliit-navy',
              ].join(' ')}
            >
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

