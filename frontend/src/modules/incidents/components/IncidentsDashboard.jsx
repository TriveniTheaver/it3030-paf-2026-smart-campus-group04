import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../core/contexts/AuthContext';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  MessageSquare,
  Image as ImageIcon,
  Pencil,
  Shield,
  Trash2,
  Upload,
  Wrench,
} from 'lucide-react';
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

const TICKET_STATUS_CHIPS = [
  { id: 'ALL', label: 'All tickets' },
  { id: 'OPEN', label: 'Open' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'RESOLVED', label: 'Resolved' },
  { id: 'CLOSED', label: 'Closed' },
  { id: 'REJECTED', label: 'Rejected' },
];

const SORT_FIELDS = [
  { id: 'DATE', label: 'Date' },
  { id: 'PRIORITY', label: 'Priority' },
];

const PRIORITY_ORDER = { HIGH: 3, MEDIUM: 2, LOW: 1 };

function sortTicketsCopy(list, sortBy, sortDir) {
  const mul = sortDir === 'ASC' ? 1 : -1;
  return [...list].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'PRIORITY') {
      const pa = PRIORITY_ORDER[a.priority] ?? 0;
      const pb = PRIORITY_ORDER[b.priority] ?? 0;
      cmp = pa - pb;
    } else {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      cmp = da === db ? 0 : da < db ? -1 : 1;
    }
    return cmp * mul;
  });
}

const FORM_LABEL =
  'block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2';

/** Loads ticket evidence: public URLs as-is; uploaded files via authenticated blob fetch (JWT). */
function AuthenticatedTicketImage({ src, alt, className }) {
  const [displayUrl, setDisplayUrl] = useState(null);

  useEffect(() => {
    if (!src) {
      setDisplayUrl(null);
      return undefined;
    }
    if (src.startsWith('http://') || src.startsWith('https://') || !src.startsWith('/api/tickets/files/')) {
      setDisplayUrl(src);
      return undefined;
    }
    let cancelled = false;
    let objectUrl;
    (async () => {
      try {
        const res = await axios.get(src, { responseType: 'blob' });
        objectUrl = URL.createObjectURL(res.data);
        if (!cancelled) setDisplayUrl(objectUrl);
      } catch {
        if (!cancelled) setDisplayUrl(null);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!displayUrl) {
    return <div className={`${className} bg-slate-100 animate-pulse min-h-[4rem]`} />;
  }
  return <img src={displayUrl} alt={alt} className={className} />;
}

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
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });

  const [formData, setFormData] = useState({
    resourceId: '',
    category: 'Hardware',
    priority: 'LOW',
    description: '',
    preferredContact: '',
  });
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState([]);
  const attachmentInputRef = useRef(null);

  useEffect(() => {
    const urls = attachmentFiles.map((f) => URL.createObjectURL(f));
    setAttachmentPreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [attachmentFiles]);

  const isUser = currentUser?.role === 'USER';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isTechnician = currentUser?.role === 'TECHNICIAN';

  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState('DATE');
  const [sortDir, setSortDir] = useState('DESC');
  const sortDropdownRef = useRef(null);

  const filteredTickets = useMemo(() => {
    if (!tickets?.length) return [];
    if (ticketStatusFilter === 'ALL') return tickets;
    return tickets.filter((t) => t.status === ticketStatusFilter);
  }, [tickets, ticketStatusFilter]);

  const displayedTickets = useMemo(
    () => sortTicketsCopy(filteredTickets, sortBy, sortDir),
    [filteredTickets, sortBy, sortDir]
  );

  useEffect(() => {
    if (!sortMenuOpen) return undefined;
    const close = (e) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [sortMenuOpen]);

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
    setEditingCommentId(null);
    setEditDraft('');
  }, [selectedTicket?.id]);

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
    if (attachmentFiles.length > 3) {
      alert('You can attach at most 3 images.');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('resourceId', formData.resourceId);
      fd.append('category', formData.category);
      fd.append('priority', formData.priority);
      fd.append('description', formData.description);
      fd.append('preferredContact', formData.preferredContact || '');
      attachmentFiles.forEach((file) => fd.append('files', file));
      await axios.post('/api/tickets', fd);
      setFormData({
        resourceId: '',
        category: 'Hardware',
        priority: 'LOW',
        description: '',
        preferredContact: '',
      });
      setAttachmentFiles([]);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      setShowForm(false);
      fetchTickets();
      alert('Incident reported successfully!');
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : 'Failed to submit ticket');
    }
  };

  const onAttachmentFilesChange = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (picked.length === 0) return;

    setAttachmentFiles((prev) => {
      const combined = [...prev, ...picked];
      const seen = new Set();
      const out = [];
      for (const f of combined) {
        const k = `${f.name}|${f.size}|${f.lastModified}`;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(f);
        if (out.length === 3) break;
      }
      if (combined.length > out.length) {
        queueMicrotask(() =>
          alert(
            'Maximum 3 images. Extra files were skipped.\n\nTip: in the file dialog use Ctrl+click (Windows) or Cmd+click (Mac) to select several files at once — or add more using “Choose file” again.'
          )
        );
      }
      return out;
    });
  };

  const removeAttachmentAt = (index) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
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

  const startEditComment = (c) => {
    setEditingCommentId(c.id);
    setEditDraft(c.content ?? '');
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditDraft('');
  };

  const handleSaveCommentEdit = async (e, commentId) => {
    e.preventDefault();
    if (!editDraft.trim() || !selectedTicket) return;
    try {
      await axios.put(`/api/tickets/${selectedTicket.id}/comments/${commentId}`, {
        content: editDraft.trim(),
      });
      setEditingCommentId(null);
      setEditDraft('');
      fetchComments(selectedTicket.id);
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;
    if (!selectedTicket) return;
    try {
      await axios.delete(`/api/tickets/${selectedTicket.id}/comments/${commentId}`);
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditDraft('');
      }
      fetchComments(selectedTicket.id);
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : 'Failed to delete comment');
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

  /** Left accent bar on cards — priority at a glance (red / amber / green). */
  const getPriorityAccentClass = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-rose-500';
      case 'MEDIUM':
        return 'bg-amber-400';
      case 'LOW':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-300';
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
            <h2 className="sc-section-title text-sliit-blue mb-2 flex items-center gap-3">
              <AlertTriangle className="text-sliit-orange shrink-0" size={28} /> New incident report
            </h2>
            <p className="sc-meta text-slate-500 mb-8">
              Submit a maintenance or fault report.
            </p>
            <form className="space-y-7" onSubmit={handlePostTicket}>
              <div>
                <label className={FORM_LABEL}>Facility / resource</label>
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

              <div>
                <label className={`${FORM_LABEL} mb-3`}>Category &amp; priority</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
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
              </div>

              <div>
                <label className={FORM_LABEL}>Preferred contact</label>
                <input
                  type="text"
                  value={formData.preferredContact}
                  onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 border font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                  placeholder="Phone or email"
                />
              </div>

              <div>
                <label className={FORM_LABEL}>Issue description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 border font-medium text-slate-800 outline-none focus:ring-2 focus:ring-sliit-orange placeholder:text-slate-400 leading-relaxed"
                  placeholder="Describe the fault or issue in detail "
                  required
                />
              </div>

              <div>
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">Evidence photos</span>
                    <span className="shrink-0 text-right text-[11px] font-medium leading-tight text-slate-500">
                      Up to 3 · 5 MB each
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-slate-500">JPEG, PNG or WebP. Ctrl+click to select multiple.</p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-sliit-blue px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sliit-navy">
                    <Upload size={15} strokeWidth={2.5} />
                    Choose files
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={onAttachmentFilesChange}
                      className="sr-only"
                    />
                  </label>
                </div>
                {attachmentFiles.length > 0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {attachmentFiles.map((file, i) => (
                      <div key={`${file.name}-${file.size}-${file.lastModified}-${i}`} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                          <img
                            src={attachmentPreviewUrls[i] || ''}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachmentAt(i)}
                          className="absolute top-1 right-1 rounded-full bg-rose-600 text-white text-[10px] font-bold w-6 h-6 opacity-90 hover:opacity-100"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
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
          <>
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                {TICKET_STATUS_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setTicketStatusFilter(chip.id)}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold border transition-all ${
                      ticketStatusFilter === chip.id
                        ? 'border-sliit-navy bg-sliit-navy text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-sliit-orange/40 hover:text-slate-900'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <div className="relative shrink-0 self-end sm:self-center" ref={sortDropdownRef}>
                <button
                  type="button"
                  onClick={() => setSortMenuOpen((o) => !o)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                    sortMenuOpen
                      ? 'border-sliit-navy bg-slate-50 text-sliit-navy shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                  aria-expanded={sortMenuOpen}
                  aria-haspopup="listbox"
                >
                  <ArrowUpDown size={15} strokeWidth={2.5} className="shrink-0 text-slate-500" aria-hidden />
                  Sort
                </button>
                {sortMenuOpen ? (
                  <div
                    className="absolute right-0 top-full z-30 mt-2 w-[min(100vw-2rem,17rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
                    role="dialog"
                    aria-label="Sort tickets"
                  >
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sort by</p>
                    <div className="flex flex-col gap-1">
                      {SORT_FIELDS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSortBy(opt.id)}
                          className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                            sortBy === opt.id
                              ? 'bg-sliit-navy text-white'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="my-3 border-t border-slate-100" />
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Direction</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSortDir('ASC')}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                          sortDir === 'ASC'
                            ? 'bg-slate-800 text-white'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Ascending
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortDir('DESC')}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                          sortDir === 'DESC'
                            ? 'bg-slate-800 text-white'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Descending
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-white">
                <p className="sc-section-title text-slate-700 mb-1">No tickets match this filter</p>
                <p className="sc-meta text-slate-500">Try another status or choose &quot;All tickets&quot;.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedTickets.map((ticket) => {
                  const fileCount = ticket.attachments?.length ?? 0;
                  const isActive = selectedTicket?.id === ticket.id;
                  return (
                    <div
                      key={ticket.id}
                      className={`group relative flex overflow-hidden rounded-xl border bg-white transition-all duration-200 ${isActive
                          ? 'border-sliit-orange shadow-lg ring-2 ring-sliit-orange/30'
                          : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'
                        }`}
                    >
                      <div
                        className={`w-1 shrink-0 self-stretch ${getPriorityAccentClass(ticket.priority)}`}
                        aria-hidden
                        title={`Priority: ${ticket.priority}`}
                      />
                      <div className="min-w-0 flex-1 p-4 md:p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                #{ticket.id}
                              </span>
                              <h3 className="text-base font-bold text-sliit-blue transition-colors group-hover:text-sliit-orange md:text-lg">
                                {ticket.resource?.name || 'Asset ID: ' + ticket.id}
                              </h3>
                            </div>
                            <span className="inline-block w-fit rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                              {ticket.category || 'General'}
                            </span>
                            <div className="sc-meta flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
                              <span className="font-medium text-slate-700">
                                {ticket.reporter?.name || 'Reporter'}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span>{format(new Date(ticket.createdAt), 'MMM d · h:mm a')}</span>
                              {isAdmin ? (
                                <>
                                  <span className="text-slate-300">·</span>
                                  <span className="max-w-[12rem] truncate text-slate-400">{ticket.reporter?.email || '—'}</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border shadow-sm ${getStatusColor(ticket.status)}`}
                            >
                              {ticket.status.replace(/_/g, ' ')}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border shadow-sm ${getPriorityColor(ticket.priority)}`}
                            >
                              {ticket.priority}
                            </span>
                          </div>
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm text-slate-600 leading-snug">
                          {ticket.description}
                        </p>

                        {ticket.assignee ? (
                          <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sliit-blue text-[10px] font-semibold text-white">
                              T
                            </div>
                            <div className="min-w-0 text-[11px] leading-tight">
                              <span className="block font-semibold uppercase tracking-wider text-slate-500">Technician</span>
                              <span className="font-semibold text-sliit-blue">{ticket.assignee.name}</span>
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare size={13} className="text-sliit-orange" strokeWidth={2} />
                              {ticket.comments?.length ?? 0} comments
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 ${fileCount > 0 ? 'font-semibold text-amber-600' : 'text-slate-400'
                                }`}
                            >
                              <ImageIcon size={13} strokeWidth={2} />
                              {fileCount} {fileCount === 1 ? 'file' : 'files'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(ticket)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2 text-xs font-semibold text-sliit-blue transition-all hover:bg-sliit-blue hover:text-white sm:min-w-[9rem]"
                          >
                            Open details
                            <ArrowRight size={14} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
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
                        <AuthenticatedTicketImage
                          src={url}
                          alt="Evidence"
                          className="w-full h-full object-cover"
                        />
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
                  comments.map((c) => {
                    const isOwner =
                      currentUser != null &&
                      c.author?.id != null &&
                      Number(c.author.id) === Number(currentUser.id);
                    const isEditing = editingCommentId === c.id;
                    return (
                      <div key={c.id} className="flex gap-4">
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shrink-0 border border-slate-100 font-semibold text-sliit-blue text-xs">
                          {c.author?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <span className="text-xs font-semibold text-slate-800">{c.author?.name || 'User'}</span>
                              <span className="sc-meta text-slate-400">
                                {format(new Date(c.createdAt), 'MMM d, p')}
                              </span>
                              {c.updatedAt && !isEditing ? (
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                  Edited
                                </span>
                              ) : null}
                            </div>
                            {isOwner && !isEditing ? (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => startEditComment(c)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/80 hover:text-sliit-blue transition-colors"
                                  title="Edit comment"
                                  aria-label="Edit comment"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  title="Delete comment"
                                  aria-label="Delete comment"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ) : null}
                          </div>
                          {isEditing ? (
                            <form
                              onSubmit={(e) => handleSaveCommentEdit(e, c.id)}
                              className="space-y-2"
                            >
                              <textarea
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value)}
                                rows={3}
                                className="w-full bg-white border-2 border-slate-100 rounded-2xl p-3 text-sm font-medium text-slate-700 outline-none focus:border-sliit-orange"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={cancelEditComment}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-200/80"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-sliit-blue text-white hover:bg-sliit-navy"
                                >
                                  Save
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-none border border-slate-100 text-sm font-medium text-slate-600 shadow-sm leading-snug break-words">
                              {c.content}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
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
