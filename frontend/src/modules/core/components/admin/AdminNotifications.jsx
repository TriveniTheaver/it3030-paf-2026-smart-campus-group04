import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Send, Trash2, ShieldAlert, CheckCircle, Mail } from 'lucide-react';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [sendingPersonal, setSendingPersonal] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');
  const [personalSuccess, setPersonalSuccess] = useState('');
  const [personalError, setPersonalError] = useState('');

  const [campusUsers, setCampusUsers] = useState([]);
  /** Prefer selecting user id from directory so the notification targets the correct account. */
  const [personalRecipientId, setPersonalRecipientId] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [broadcastError, setBroadcastError] = useState('');

  useEffect(() => {
    fetchNotifications();
    const loadUsers = async () => {
      try {
        const res = await axios.get('/api/users');
        setCampusUsers(res.data || []);
      } catch {
        setCampusUsers([]);
      }
    };
    loadUsers();
  }, []);

  const axiosErrMessage = (err, fallback) => {
    const status = err.response?.status;
    const data = err.response?.data;
    if (status === 403) {
      return 'This action requires an administrator account. Use Admin / Technician portal and sign in as ADMIN.';
    }
    if (status === 401) {
      return 'Session expired. Please sign in again.';
    }
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.message) return data.message;
    return fallback;
  };

  const fetchNotifications = async () => {
    setLoadError('');
    try {
      const res = await axios.get('/api/notifications/admin/all');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch all notifications', err);
      setLoadError(axiosErrMessage(err, 'Could not load the notification list.'));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setSendingBroadcast(true);
    setBroadcastSuccess('');
    setBroadcastError('');
    try {
      await axios.post(`/api/notifications/broadcast?message=${encodeURIComponent(broadcastMessage)}`);
      setBroadcastMessage('');
      setBroadcastSuccess('Broadcast sent successfully to all users!');
      await fetchNotifications();
    } catch (err) {
      console.error('Broadcast failed', err);
      setBroadcastError(axiosErrMessage(err, 'Broadcast failed. Check that you are logged in as an administrator.'));
    }
    setSendingBroadcast(false);
  };

  const handlePersonal = async (e) => {
    e.preventDefault();
    if (!personalMessage.trim()) return;
    const idNum = personalRecipientId ? Number(personalRecipientId) : NaN;
    const hasUserId = Number.isInteger(idNum) && idNum > 0;
    const emailUsed = personalEmail.trim();
    if (!hasUserId && !emailUsed) return;
    setSendingPersonal(true);
    setPersonalSuccess('');
    setPersonalError('');
    try {
      const payload = { message: personalMessage.trim() };
      const selected = campusUsers.find((u) => Number(u.id) === idNum);
      if (hasUserId) {
        payload.recipientUserId = idNum;
        // Always send canonical email too: older API builds validated @NotBlank on recipientEmail
        // when only recipientUserId was sent; the current backend accepts either or both.
        const emailForRecipient = selected?.email || emailUsed;
        if (emailForRecipient) payload.recipientEmail = emailForRecipient;
      } else {
        payload.recipientEmail = emailUsed;
      }
      await axios.post('/api/notifications/personal', payload);
      setPersonalMessage('');
      setPersonalRecipientId('');
      setPersonalEmail('');
      setPersonalSuccess(
        hasUserId
          ? selected
            ? `Sent to ${selected.name} (${selected.email}). They will see it under the bell icon after refresh or within 30 seconds.`
            : `Sent to user #${idNum}. They will see it under the bell icon after refresh or within 30 seconds.`
          : `Sent to ${emailUsed}. They will see it under the bell icon after refresh or within 30 seconds.`
      );
      await fetchNotifications();
    } catch (err) {
      const data = err.response?.data;
      let msg =
        (typeof data === 'string' && data) ||
        data?.message ||
        data?.detail ||
        null;
      if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
        const parts = Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`);
        if (parts.length) msg = parts.join(' · ');
      }
      if (!msg && Array.isArray(data?.errors)) {
        msg = data.errors.map((x) => x.defaultMessage).join(' ');
      }
      setPersonalError(msg || 'Could not send the message. Pick a user from the list or check the email is registered.');
    }
    setSendingPersonal(false);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const notifKind = (msg) => {
    if (!msg) return 'other';
    if (msg.includes('[SYSTEM BROADCAST]')) return 'broadcast';
    return 'other';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-sliit-blue text-white rounded-2xl shadow-lg">
          <Bell size={32} />
        </div>
        <div>
          <h1 className="sc-page-title text-sliit-navy">System Notifications</h1>
          <p className="sc-meta">Campus-wide broadcasts, direct messages to one user, and full history</p>
        </div>
      </div>

      {loadError && (
        <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8 sticky top-8 self-start">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h2 className="sc-section-title text-sliit-blue mb-6 flex items-center gap-2">
              <Send size={20} className="text-sliit-orange" /> Broadcast update
            </h2>
            <form onSubmit={handleBroadcast} className="space-y-6">
              <div>
                <label className="block sc-label mb-3">Message to all users</label>
                <textarea
                  className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sliit-orange rounded-2xl outline-none transition-all resize-none min-h-[150px] font-semibold text-slate-700"
                  placeholder="Important announcement for everyone…"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  disabled={sendingBroadcast}
                />
              </div>
              {broadcastError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm font-medium border border-rose-100">
                  {broadcastError}
                </div>
              )}
              <button
                type="submit"
                disabled={sendingBroadcast || !broadcastMessage.trim()}
                className={`w-full py-4 rounded-2xl font-semibold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-3 ${sendingBroadcast || !broadcastMessage.trim() ? 'bg-slate-300' : 'bg-sliit-orange hover:bg-orange-600 active:scale-95'}`}
              >
                {sendingBroadcast ? 'Broadcasting…' : 'Dispatch to all'}
                <Send size={18} />
              </button>
            </form>
            {broadcastSuccess && (
              <div className="mt-6 p-4 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-3 border border-emerald-100 font-semibold text-sm animate-in slide-in-from-top scale-95">
                <CheckCircle size={18} /> {broadcastSuccess}
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h2 className="sc-section-title text-sliit-blue mb-2 flex items-center gap-2">
              <Mail size={20} className="text-sliit-orange" /> Message one user
            </h2>
            <p className="sc-meta text-xs mb-6">
              Delivers to that person’s bell panel only (not a campus-wide broadcast). Pick them from the list so the
              message goes to the right account.
            </p>
            <form onSubmit={handlePersonal} className="space-y-5">
              <div>
                <label className="block sc-label mb-2">Recipient</label>
                <select
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-sliit-blue rounded-2xl outline-none transition-all font-semibold text-slate-700 text-sm"
                  value={personalRecipientId}
                  onChange={(e) => setPersonalRecipientId(e.target.value)}
                  disabled={sendingPersonal}
                >
                  <option value="">Select user…</option>
                  {campusUsers.map((u) => (
                    <option key={u.id} value={String(u.id)}>
                      {u.name} — {u.email} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block sc-label mb-2">Or enter email only</label>
                <input
                  type="email"
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-sliit-blue rounded-2xl outline-none transition-all font-semibold text-slate-700 text-sm"
                  placeholder="Use only if they are not in the list above"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  disabled={sendingPersonal}
                />
              </div>
              <div>
                <label className="block sc-label mb-2">Message</label>
                <textarea
                  className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sliit-blue rounded-2xl outline-none transition-all resize-none min-h-[120px] font-semibold text-slate-700 text-sm"
                  placeholder="Your message…"
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  disabled={sendingPersonal}
                />
              </div>
              {personalError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm font-medium border border-rose-100">
                  {personalError}
                </div>
              )}
              <button
                type="submit"
                disabled={
                  sendingPersonal ||
                  !personalMessage.trim() ||
                  (!personalRecipientId && !personalEmail.trim())
                }
                className={`w-full py-4 rounded-2xl font-semibold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-3 ${sendingPersonal || !personalMessage.trim() || (!personalRecipientId && !personalEmail.trim()) ? 'bg-slate-300' : 'bg-sliit-blue hover:bg-sliit-navy active:scale-95'}`}
              >
                {sendingPersonal ? 'Sending…' : 'Send personal notification'}
                <Mail size={18} />
              </button>
            </form>
            {personalSuccess && (
              <div className="mt-6 p-4 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-3 border border-emerald-100 font-semibold text-sm">
                <CheckCircle size={18} /> {personalSuccess}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
              <h2 className="sc-section-title text-sliit-navy">Live notification stream</h2>
              <p className="sc-label mt-1">All notifications (broadcasts, direct, and automated)</p>
            </div>

            <div className="divide-y divide-slate-50 max-h-[700px] overflow-y-auto no-scrollbar">
              {loading ? (
                <div className="p-20 text-center sc-meta text-slate-300">Gathering alert data…</div>
              ) : loadError ? (
                <div className="p-20 text-center text-amber-800 text-sm font-medium">Fix the issue above to load history.</div>
              ) : notifications.length > 0 ? (
                notifications.map((notif) => {
                  const kind = notifKind(notif.message);
                  return (
                    <div
                      key={notif.id}
                      className="p-6 hover:bg-slate-50 transition-colors group flex items-start justify-between gap-4"
                    >
                      <div className="flex gap-4 min-w-0">
                        <div
                          className={`mt-1 p-2 rounded-lg shrink-0 ${kind === 'broadcast' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}
                        >
                          {kind === 'broadcast' ? <ShieldAlert size={16} /> : <Mail size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 leading-snug break-words">{notif.message}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                            <span className="sc-label">
                              To: {notif.recipientName || '—'}
                              {notif.recipientEmail ? (
                                <span className="text-slate-400 font-normal"> · {notif.recipientEmail}</span>
                              ) : null}
                            </span>
                            <span className="h-1 w-1 bg-slate-200 rounded-full hidden sm:inline" />
                            <span className="sc-label text-slate-400">
                              {new Date(notif.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(notif.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-20 text-center space-y-2">
                  <p className="sc-meta text-slate-400">No notifications recorded in history.</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    A successful broadcast creates one row per user account. If you have no users besides yourself, you will
                    see one new notification after dispatch.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
