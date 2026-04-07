import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { Bell } from 'lucide-react';

const NotificationPanel = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, readStatus: true } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  if (!currentUser) return null;

  const unreadCount = notifications.filter(n => !n.readStatus).length;
  const togglePanel = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      <button onClick={togglePanel} className="relative p-2 text-sliit-blue hover:text-sliit-navy transition-all transform active:scale-95">
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-black leading-none text-white transform translate-x-1 -translate-y-1 bg-sliit-orange rounded-full ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 w-96 mt-4 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden z-[100] border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-5 bg-slate-50 flex justify-between items-center border-b border-slate-100">
            <span className="font-black text-xs uppercase tracking-widest text-slate-400">Hub Notifications</span>
            {unreadCount > 0 && <span className="text-[10px] font-black text-sliit-orange uppercase">{unreadCount} New</span>}
          </div>
          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                  <Bell size={32} />
                </div>
                <p className="text-slate-400 font-bold text-sm">All clear for now.</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => !notif.readStatus && markAsRead(notif.id)}
                  className={`p-6 border-b border-slate-50 transition-all cursor-pointer hover:bg-slate-50 ${notif.readStatus ? 'opacity-60' : 'bg-blue-50/30'}`}
                >
                  <div className="flex gap-4">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.readStatus ? 'bg-slate-300' : 'bg-sliit-orange animate-pulse'}`}></div>
                    <div className="space-y-1">
                      <p className={`text-sm ${notif.readStatus ? 'font-medium text-slate-600' : 'font-black text-sliit-blue'}`}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
            <button className="text-[10px] font-black uppercase tracking-widest text-sliit-blue hover:text-sliit-navy transition-colors">Clear All History</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
