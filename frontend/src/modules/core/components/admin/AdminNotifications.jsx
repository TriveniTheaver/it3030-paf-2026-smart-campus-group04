import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Send, Trash2, ShieldAlert, CheckCircle } from 'lucide-react';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications/admin/all');
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch all notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setSending(true);
    setSuccess('');
    try {
      await axios.post(`/api/notifications/broadcast?message=${encodeURIComponent(broadcastMessage)}`);
      setBroadcastMessage('');
      setSuccess('Broadcast sent successfully to all users!');
      fetchNotifications();
    } catch (err) {
      console.error("Broadcast failed", err);
    }
    setSending(false);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-sliit-blue text-white rounded-2xl shadow-lg">
          <Bell size={32} />
        </div>
        <div>
          <h1 className="sc-page-title text-sliit-navy">System Notifications</h1>
          <p className="sc-meta">Administrative oversight and campus-wide broadcasting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Broadcast Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 sticky top-8">
            <h2 className="sc-section-title text-sliit-blue mb-6 flex items-center gap-2">
              <Send size={20} className="text-sliit-orange" /> Broadcast Update
            </h2>
            <form onSubmit={handleBroadcast} className="space-y-6">
              <div>
                <label className="block sc-label mb-3">Broadcast message</label>
                <textarea 
                  className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sliit-orange rounded-2xl outline-none transition-all resize-none min-h-[150px] font-semibold text-slate-700"
                  placeholder="Type important announcement here..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  disabled={sending}
                />
              </div>
              <button 
                type="submit"
                disabled={sending || !broadcastMessage.trim()}
                className={`w-full py-4 rounded-2xl font-semibold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-3 ${sending || !broadcastMessage.trim() ? 'bg-slate-300' : 'bg-sliit-orange hover:bg-orange-600 active:scale-95'}`}
              >
                {sending ? 'Broadcasting...' : 'Dispatch Alert'}
                <Send size={18} />
              </button>
            </form>
            {success && (
              <div className="mt-6 p-4 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-3 border border-emerald-100 font-semibold text-sm animate-in slide-in-from-top scale-95">
                <CheckCircle size={18} /> {success}
              </div>
            )}
          </div>
        </div>

        {/* Global Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
              <h2 className="sc-section-title text-sliit-navy">Live notification stream</h2>
              <p className="sc-label mt-1">All generated alerts system-wide</p>
            </div>
            
            <div className="divide-y divide-slate-50 max-h-[700px] overflow-y-auto no-scrollbar">
              {loading ? (
                <div className="p-20 text-center sc-meta text-slate-300">Gathering alert data…</div>
              ) : notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-6 hover:bg-slate-50 transition-colors group flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={`mt-1 p-2 rounded-lg ${notif.message.includes('[SYSTEM BROADCAST]') ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        <ShieldAlert size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 leading-snug">{notif.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="sc-label">Recipient: {notif.recipient?.name}</span>
                          <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                          <span className="sc-label text-slate-400">
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(notif.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center sc-meta text-slate-400">No notifications recorded in history.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
