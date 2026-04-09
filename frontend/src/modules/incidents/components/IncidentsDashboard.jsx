import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../core/contexts/AuthContext';
import { AlertTriangle, MessageSquare, Image as ImageIcon, Paperclip, Shield, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const ADMIN_TRIAGE_STATUSES = [
  { value: 'REJECTED', label: 'Rejected — invalid or duplicate request' },
  { value: 'CLOSED', label: 'Closed — administratively closed' },
];

const TECH_WORKFLOW_STATUSES = [
  { value: 'IN_PROGRESS', label: 'In progress — actively working' },
  { value: 'RESOLVED', label: 'Resolved — fix complete' },
  { value: 'CLOSED', label: 'Closed — job complete / handed off' },
];

const IncidentsDashboard = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });

  const [formData, setFormData] = useState({
    resourceId: '',
    category: 'Hardware',
    priority: 'LOW',
    description: '',
    preferredContact: '',
    attachments: ['', '', ''],
  });

  const isUser = currentUser?.role === 'USER';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isTechnician = currentUser?.role === 'TECHNICIAN';

  const pageCopy = useMemo(() => {
    if (isAdmin) {
      return {
        title: 'Incident triage queue',
        subtitle:
          'Review every campus ticket, reject invalid requests, assign technicians, and close cases administratively. Field status (in progress / resolved) is owned by technicians.',
      };
    }
    if (isTechnician) {
      return {
        title: 'My assigned tickets',
        subtitle:
          'Only tickets assigned to you by an administrator appear here. Update status as you work; you cannot reject tickets or reassign them.',
      };
    }
    return {
      title: 'My incident reports',
      subtitle:
        'Submit issues and track tickets you have raised. Administrators triage the queue and assign technicians; you will see updates here.',
    };
  }, [isAdmin, isTechnician]);

  const fetchTickets = useCallback(async () => {
    if (!currentUser?.role) return;
    setLoading(true);
    try {
      let url = '/api/tickets';
      if (isTechnician) url = '/api/tickets/assigned-to-me';
      else if (isUser) url = '/api/tickets/mine';
      const res = await axios.get(url);
      setTickets(res.data);
    } catch (err) {
      console.error(err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.role, isTechnician, isUser]);

  const fetchTechnicians = useCallback(async () => {
    try {
      const res = await axios.get('/api/users/technicians');
      setTechnicians(res.data);
    } catch (err) {
      console.error('Failed to fetch technicians', err);
    }
  }, []);

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await axios.get('/api/facilities');
      setFacilities(res.data);
    } catch (err) {
      console.error('Failed to fetch facilities', err);
      setFacilities([]);
    }
  }, []);

  const fetchComments = useCallback(async (ticketId) => {
    try {
      const res = await axios.get(`/api/tickets/${ticketId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
      setComments([]);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- load list on mount/role; sync detail panel when ticket changes */
  useEffect(() => {
    fetchTickets();
    if (isAdmin) fetchTechnicians();
    if (isUser) fetchFacilities();
  }, [fetchTickets, fetchTechnicians, fetchFacilities, isAdmin, isUser]);

  useEffect(() => {
    if (selectedTicket) {
      fetchComments(selectedTicket.id);
      if (isAdmin) {
        setStatusUpdate({
          status: ADMIN_TRIAGE_STATUSES[0].value,
          notes: selectedTicket.resolutionNotes || '',
        });
      } else if (isTechnician) {
        const allowed = TECH_WORKFLOW_STATUSES.map((o) => o.value);
        const next =
          allowed.includes(selectedTicket.status) ? selectedTicket.status : 'IN_PROGRESS';
        setStatusUpdate({ status: next, notes: selectedTicket.resolutionNotes || '' });
      }
    }
  }, [selectedTicket, fetchComments, isAdmin, isTechnician]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handlePostTicket = async (e) => {
    e.preventDefault();
    if (!formData.resourceId) {
      alert('Please choose a facility or resource.');
      return;
    }
    try {
      const payload = {
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
        preferredContact: formData.preferredContact,
        resource: { id: Number(formData.resourceId) },
        attachments: formData.attachments.filter((a) => a.trim() !== ''),
      };
      await axios.post('/api/tickets', payload);
      setFormData({
        resourceId: '',
        category: 'Hardware',
        priority: 'LOW',
        description: '',
        preferredContact: '',
        attachments: ['', '', ''],
      });
      setShowForm(false);
      fetchTickets();
      alert('Incident reported successfully!');
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : 'Failed to submit ticket');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;
    try {
      await axios.post(`/api/tickets/${selectedTicket.id}/comments`, { content: newComment });
      setNewComment('');
      fetchComments(selectedTicket.id);
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : 'Failed to post comment');
    }
  };

  const handleAssign = async (techIdStr) => {
    const techId = Number(techIdStr);
    if (!selectedTicket || !techId) return;
    try {
      await axios.put(`/api/tickets/${selectedTicket.id}/assign`, {}, {
        params: { technicianId: techId },
      });
      setSelectedTicket(null);
      fetchTickets();
      alert('Technician assigned. The ticket is now in progress.');
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : 'Assignment failed');
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !statusUpdate.status) return;
    try {
      await axios.put(`/api/tickets/${selectedTicket.id}/status`, {}, {
        params: {
          status: statusUpdate.status,
          resolutionNotes: statusUpdate.notes || undefined,
        },
      });
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : 'Failed to update status');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'MEDIUM':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'LOW':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'IN_PROGRESS':
        return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'RESOLVED':
        return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case 'CLOSED':
        return 'text-gray-700 bg-gray-100 border-gray-200';
      case 'REJECTED':
        return 'text-rose-700 bg-rose-100 border-rose-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const techCanActOnTicket =
    isTechnician &&
    selectedTicket?.assignee?.id != null &&
    selectedTicket.assignee.id === currentUser?.id;

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-8 relative">
      {isUser ? (
        <div className={`w-full md:w-1/3 transition-all ${showForm ? 'block' : 'hidden md:block'}`}>
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-6 max-h-[90vh] overflow-y-auto no-scrollbar">
            <h2 className="sc-section-title text-sliit-blue mb-8 flex items-center gap-3">
              <AlertTriangle className="text-sliit-orange" size={28} /> Report an incident
            </h2>
            <p className="sc-meta text-slate-500 mb-6">
              Your ticket goes to campus operations. An administrator triages it and assigns a technician; you will
              receive notifications when the status changes.
            </p>
            <form className="space-y-6" onSubmit={handlePostTicket}>
              <div>
                <label className="block sc-label mb-2">Facility / resource</label>
                <select
                  value={formData.resourceId}
                  onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 border font-semibold text-slate-800 focus:ring-2 focus:ring-sliit-orange outline-none transition-all"
                  required
                >
                  <option value="">Select a resource…</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.location ? `— ${f.location}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block sc-label mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 border font-semibold text-slate-800 outline-none"
                  >
                    <option>Hardware</option>
                    <option>Software</option>
                    <option>Facility</option>
                  </select>
                </div>
                <div>
                  <label className="block sc-label mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 border font-semibold text-slate-800 outline-none"
                  >
                    <option>LOW</option>
                    <option>MEDIUM</option>
                    <option>HIGH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block sc-label mb-2">Preferred contact (phone / email)</label>
                <input
                  type="text"
                  value={formData.preferredContact}
                  onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 border font-semibold text-slate-800 outline-none"
                  placeholder="e.g. 077 123 4567"
                />
              </div>

              <div>
                <label className="block sc-label mb-2">Issue description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 border font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-sliit-orange"
                  placeholder="Describe the issue…"
                  required
                />
              </div>

              <div>
                <label className="block sc-label mb-2">Evidence URLs (max 3)</label>
                {formData.attachments.map((val, i) => (
                  <input
                    key={i}
                    type="text"
                    value={val}
                    onChange={(e) => {
                      const newArr = [...formData.attachments];
                      newArr[i] = e.target.value;
                      setFormData({ ...formData, attachments: newArr });
                    }}
                    className="w-full bg-slate-50 border-slate-100 rounded-xl p-3 border font-semibold text-slate-800 text-xs mb-2 outline-none"
                    placeholder={`Image URL ${i + 1}`}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-sliit-navy text-white font-semibold rounded-2xl hover:bg-sliit-blue transition-all shadow-xl shadow-sliit-blue/20 text-sm"
              >
                Submit ticket
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <div className={isUser ? 'w-full md:w-2/3' : 'w-full'}>
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="sc-page-title text-slate-900 flex items-center gap-3">
              {isAdmin ? <Shield className="text-sliit-orange shrink-0" size={32} /> : null}
              {isTechnician ? <Wrench className="text-sliit-orange shrink-0" size={32} /> : null}
              {pageCopy.title}
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-2xl">{pageCopy.subtitle}</p>
          </div>
          {isUser ? (
            <button
              type="button"
              className="md:hidden px-6 py-3 bg-sliit-navy text-white font-semibold rounded-xl text-sm"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'View list' : '+ Report'}
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="p-32 text-center sc-meta text-slate-400 animate-pulse">Syncing tickets…</div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border border-dashed border-slate-200 bg-white/60">
            <p className="sc-section-title text-slate-700 mb-2">Nothing to show yet</p>
            <p className="sc-meta text-slate-500 max-w-md mx-auto">
              {isTechnician
                ? 'When an administrator assigns you to a ticket, it will appear here.'
                : isUser
                  ? 'You have not submitted any incident reports, or your list is empty.'
                  : 'No tickets in the system yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="group sc-interactive-card p-8 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="sc-label bg-slate-100 px-3 py-1 rounded-full group-hover:bg-white/15 group-hover:text-slate-200 transition-colors">
                        #{ticket.id}
                      </span>
                      <h3 className="sc-section-title text-sliit-blue group-hover:text-sliit-orange transition-colors">
                        {ticket.resource?.name || 'Asset ID: ' + ticket.id}
                      </h3>
                    </div>
                    <div className="sc-meta flex flex-wrap items-center gap-x-2 gap-y-1 group-hover:text-slate-300 transition-colors">
                      <Paperclip size={14} className="text-sliit-orange shrink-0" />
                      <span>
                        By {ticket.reporter?.name || 'Reporter'} •{' '}
                        {format(new Date(ticket.createdAt), 'MMM d, h:mm a')}
                      </span>
                      {isAdmin ? (
                        <span className="text-slate-400">• Reporter email: {ticket.reporter?.email || '—'}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-4 py-1.5 text-xs font-semibold rounded-full border shadow-sm ${getStatusColor(ticket.status)}`}
                    >
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm border ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                <p className="sc-body text-slate-600 mb-8 leading-snug group-hover:text-slate-200 transition-colors">
                  {ticket.description}
                </p>

                {ticket.assignee && (
                  <div className="mb-8 flex items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group-hover:bg-white/10 group-hover:border-white/20 transition-colors">
                    <div className="w-8 h-8 bg-sliit-blue text-white rounded-full flex items-center justify-center font-semibold text-xs">
                      T
                    </div>
                    <div className="text-xs">
                      <span className="block sc-label">Assigned technician</span>
                      <span className="font-semibold text-sliit-blue">{ticket.assignee.name}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-100 group-hover:border-slate-500/50 pt-8 transition-colors">
                  <div className="flex items-center gap-6 sc-label text-slate-500 group-hover:text-slate-300">
                    <span className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-sliit-orange" /> {ticket.comments?.length || 0} logs
                    </span>
                    <span className="flex items-center gap-2">
                      <ImageIcon size={16} className="text-slate-300" /> {ticket.attachments?.length || 0} files
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTicket(ticket)}
                    className="px-8 py-4 text-sliit-blue bg-blue-50/50 font-semibold text-sm rounded-2xl hover:bg-sliit-blue hover:text-white transition-all transform active:scale-95"
                  >
                    Open details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 bg-sliit-navy/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="w-full md:w-1/2 p-12 overflow-y-auto border-r border-slate-100 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="sc-label mb-8 hover:text-sliit-orange transition-colors"
              >
                ← Back to list
              </button>

              <div className="mb-8">
                <span
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full border shadow-sm ${getStatusColor(selectedTicket.status)}`}
                >
                  {selectedTicket.status}
                </span>
                <h2 className="sc-page-title text-slate-900 mt-6 leading-tight">
                  {selectedTicket.resource?.name || 'Incident details'}
                </h2>
                <div className="sc-label mt-2">
                  Preferred contact:{' '}
                  <span className="text-sliit-blue font-semibold">
                    {selectedTicket.preferredContact || 'Not specified'}
                  </span>
                </div>
                {isUser ? (
                  <p className="sc-meta text-slate-500 mt-4">
                    You can add comments below. Status changes are handled by administrators and assigned technicians.
                  </p>
                ) : null}
              </div>

              <div className="space-y-8">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 sc-body text-slate-700 leading-relaxed">
                  {selectedTicket.description}
                </div>

                {selectedTicket.attachments?.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedTicket.attachments.map((url, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200"
                      >
                        <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {selectedTicket.resolutionNotes && (
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <span className="block sc-label text-emerald-600 mb-2">Notes</span>
                    <p className="font-semibold text-emerald-800">{selectedTicket.resolutionNotes}</p>
                  </div>
                )}

                {isAdmin ? (
                  <div className="pt-8 border-t border-slate-100 space-y-3">
                    <h4 className="sc-section-title text-sliit-blue text-sm mb-1">Assign technician</h4>
                    <p className="sc-meta text-slate-500 text-xs mb-4">
                      Assigning notifies the technician and the reporter and moves an open ticket to{' '}
                      <strong>In progress</strong>.
                    </p>
                    <select
                      key={selectedTicket.id}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) handleAssign(v);
                      }}
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-semibold text-sm outline-none focus:border-sliit-orange"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Choose technician…
                      </option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {isAdmin ? (
                  <div className="pt-8 border-t border-slate-100">
                    <h4 className="sc-section-title text-sliit-blue text-sm mb-1">Administrator triage</h4>
                    <p className="sc-meta text-slate-500 text-xs mb-4">
                      Reject requests that are invalid or duplicate, or close tickets administratively. Use technician
                      assignment for normal repair workflow.
                    </p>
                    <form onSubmit={handleStatusUpdate} className="space-y-4">
                      <select
                        value={statusUpdate.status}
                        onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-semibold text-sm outline-none focus:border-sliit-blue"
                      >
                        {ADMIN_TRIAGE_STATUSES.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={statusUpdate.notes}
                        onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                        placeholder="Reason for rejection or closure (shown to the reporter)…"
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-semibold text-sm outline-none focus:border-sliit-blue min-h-[100px]"
                      />
                      <button
                        type="submit"
                        className="w-full py-4 bg-sliit-orange text-white font-semibold rounded-2xl hover:bg-orange-600 transition-all text-sm"
                      >
                        Apply triage decision
                      </button>
                    </form>
                  </div>
                ) : null}

                {isTechnician ? (
                  <div className="pt-8 border-t border-slate-100">
                    <h4 className="sc-section-title text-sliit-blue text-sm mb-1">Field workflow</h4>
                    {!techCanActOnTicket ? (
                      <p className="sc-meta text-rose-600 text-sm">
                        This ticket is not assigned to you. Only your assigned jobs can be updated here.
                      </p>
                    ) : (
                      <>
                        <p className="sc-meta text-slate-500 text-xs mb-4">
                          Update progress on tickets assigned to you. You cannot reject tickets—ask an administrator to
                          triage if needed.
                        </p>
                        <form onSubmit={handleStatusUpdate} className="space-y-4">
                          <select
                            value={statusUpdate.status}
                            onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-semibold text-sm outline-none focus:border-sliit-blue"
                          >
                            {TECH_WORKFLOW_STATUSES.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <textarea
                            value={statusUpdate.notes}
                            onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                            placeholder="Work log / resolution notes for the reporter…"
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-semibold text-sm outline-none focus:border-sliit-blue min-h-[100px]"
                          />
                          <button
                            type="submit"
                            className="w-full py-4 bg-sliit-navy text-white font-semibold rounded-2xl hover:bg-sliit-blue transition-all text-sm"
                          >
                            Save field status
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="w-full md:w-1/2 bg-slate-50 p-12 flex flex-col">
              <h4 className="sc-label mb-8 block">Thread ({comments.length})</h4>

              <div className="flex-1 overflow-y-auto space-y-6 mb-8 no-scrollbar">
                {comments.length === 0 ? (
                  <div className="text-center py-10 text-slate-300 font-semibold italic">No messages yet.</div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-4">
                      <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shrink-0 border border-slate-100 font-semibold text-sliit-blue text-xs">
                        {c.author?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-800">{c.author?.name || 'User'}</span>
                            <span className="sc-meta text-slate-400">{format(new Date(c.createdAt), 'MMM d, p')}</span>
                          </div>
                        </div>
                        <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-none border border-slate-100 text-sm font-medium text-slate-600 shadow-sm leading-snug">
                          {c.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handlePostComment} className="relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={
                    isUser ? 'Add an update for staff…' : 'Add an operational note…'
                  }
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl p-5 pr-16 font-medium text-sm outline-none focus:border-sliit-orange transition-all shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-3 bottom-3 px-4 bg-sliit-blue text-white rounded-xl hover:bg-sliit-navy transition-all transform active:scale-95"
                >
                  <MessageSquare size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentsDashboard;
