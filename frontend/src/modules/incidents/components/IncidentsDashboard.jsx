import React, { useState, useEffect } from 'react';
import { useAuth } from '../../core/contexts/AuthContext';
import { AlertTriangle, MessageSquare, Image as ImageIcon, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const IncidentsDashboard = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
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
    attachments: ['', '', '']
  });

  useEffect(() => {
    fetchTickets();
    if (currentUser?.role === 'ADMIN') {
      fetchTechnicians();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedTicket) {
      fetchComments(selectedTicket.id);
      setStatusUpdate({ status: selectedTicket.status, notes: selectedTicket.resolutionNotes || '' });
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tickets');
      setTickets(res.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await axios.get('/api/users/technicians');
      setTechnicians(res.data);
    } catch (error) {
      console.error("Failed to fetch technicians", error);
    }
  };

  const fetchComments = async (ticketId) => {
    try {
      const res = await axios.get(`/api/tickets/${ticketId}/comments`);
      setComments(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePostTicket = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        resource: { id: 1 }, // Fallback for demo, in real app would match selection
        reporter: { id: currentUser.id },
        attachments: formData.attachments.filter(a => a.trim() !== '')
      };
      await axios.post('/api/tickets', payload);
      setFormData({
        resourceId: '',
        category: 'Hardware',
        priority: 'LOW',
        description: '',
        preferredContact: '',
        attachments: ['', '', '']
      });
      setShowForm(false);
      fetchTickets();
      alert('Incident reported successfully!');
    } catch (error) {
      alert('Failed to submit ticket');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await axios.post(`/api/tickets/${selectedTicket.id}/comments`, { 
        content: newComment,
        author: { id: currentUser?.id }
      });
      setNewComment('');
      fetchComments(selectedTicket.id);
    } catch (error) {
      alert('Failed to post comment');
    }
  };

  const handleAssign = async (techId) => {
    try {
      await axios.put(`/api/tickets/${selectedTicket.id}/assign?technicianId=${techId}`);
      setSelectedTicket(null);
      fetchTickets();
      alert('Technician assigned!');
    } catch (error) {
      alert('Assignment failed');
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/tickets/${selectedTicket.id}/status?status=${statusUpdate.status}&resolutionNotes=${statusUpdate.notes}`);
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'MEDIUM': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'LOW': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'IN_PROGRESS': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'RESOLVED': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case 'CLOSED': return 'text-gray-700 bg-gray-100 border-gray-200';
      case 'REJECTED': return 'text-rose-700 bg-rose-100 border-rose-200';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-8 relative">
      
      {/* Sidebar: Submitting a new issue */}
      <div className={`w-full md:w-1/3 transition-all ${showForm ? 'block' : 'hidden md:block'}`}>
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-6 max-h-[90vh] overflow-y-auto no-scrollbar">
          <h2 className="text-2xl font-black text-sliit-blue mb-8 flex items-center gap-3">
            <AlertTriangle className="text-sliit-orange" size={28} /> Report Incident
          </h2>
          <form className="space-y-6" onSubmit={handlePostTicket}>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Asset</label>
              <select className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 border font-bold text-slate-800 focus:ring-2 focus:ring-sliit-orange outline-none transition-all">
                <option value="1">Computing Lab 4</option>
                <option value="2">Main Auditorium</option>
                <option value="3">Meeting Room C</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 border font-bold text-slate-800 outline-none"
                >
                  <option>Hardware</option>
                  <option>Software</option>
                  <option>Facility</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 border font-bold text-slate-800 outline-none"
                >
                  <option>LOW</option>
                  <option>MEDIUM</option>
                  <option>HIGH</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preffered Contact (Phone/Email)</label>
              <input 
                type="text"
                value={formData.preferredContact}
                onChange={(e) => setFormData({...formData, preferredContact: e.target.value})}
                className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 border font-bold text-slate-800 outline-none" 
                placeholder="e.g. 077 123 4567"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Issue Description</label>
              <textarea 
                rows="3" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 border font-bold text-slate-800 outline-none focus:ring-2 focus:ring-sliit-orange" 
                placeholder="Log details..."
              ></textarea>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Evidence URLs (Max 3)</label>
              {formData.attachments.map((val, i) => (
                <input 
                  key={i}
                  type="text"
                  value={val}
                  onChange={(e) => {
                    const newArr = [...formData.attachments];
                    newArr[i] = e.target.value;
                    setFormData({...formData, attachments: newArr});
                  }}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl p-3 border font-bold text-slate-800 text-xs mb-2 outline-none" 
                  placeholder={`Image URL ${i+1}`}
                />
              ))}
            </div>

            <button type="submit" className="w-full py-5 bg-sliit-navy text-white font-black rounded-2xl hover:bg-sliit-blue transition-all shadow-xl shadow-sliit-blue/20 uppercase tracking-widest text-xs">
              Broadcast Alert
            </button>
          </form>
        </div>
      </div>

      {/* Main Area: Ticket Tracking */}
      <div className="w-full md:w-2/3">
        <div className="flex justify-between items-center mb-10">
           <div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">Incident Stream</h1>
             <p className="text-slate-500 font-medium mt-1">Live tracking of campus maintenance and technical issues.</p>
           </div>
           <button className="md:hidden px-6 py-3 bg-sliit-navy text-white font-black rounded-xl" onClick={() => setShowForm(!showForm)}>
             {showForm ? 'View Stream' : '+ Report'}
           </button>
        </div>

        {loading ? (
          <div className="p-32 text-center text-slate-300 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Syncing Tickets...</div>
        ) : (
          <div className="space-y-6">
            {tickets.map(ticket => (
               <div key={ticket.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 hover:shadow-2xl transition-all group relative overflow-hidden">
                 <div className={`absolute left-0 top-0 bottom-0 w-2 ${ticket.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-sliit-orange'}`}></div>
                 
                 <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                         <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">#{ticket.id}</span>
                         <h3 className="text-2xl font-black text-slate-900 group-hover:text-sliit-blue transition-colors tracking-tight">{ticket.resource?.name || 'Asset ID: ' + ticket.id}</h3>
                      </div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Paperclip size={14} className="text-sliit-orange" />
                        By {ticket.reporter?.name || 'Staff'} • {format(new Date(ticket.createdAt), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-full border shadow-sm tracking-widest ${getStatusColor(ticket.status)}`}>{ticket.status.replace(/_/g, ' ')}</span>
                       <span className={`px-3 py-1 text-[8px] font-black tracking-[0.2em] uppercase rounded-full shadow-sm border ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                    </div>
                 </div>

                 <p className="text-slate-600 font-bold text-lg mb-8 leading-snug">
                   {ticket.description}
                 </p>

                 {ticket.assignee && (
                   <div className="mb-8 flex items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <div className="w-8 h-8 bg-sliit-blue text-white rounded-full flex items-center justify-center font-black text-[10px]">T</div>
                      <div className="text-[10px]">
                        <span className="block font-black text-slate-400 uppercase tracking-tighter">Assigned Staff</span>
                        <span className="font-bold text-sliit-blue">{ticket.assignee.name}</span>
                      </div>
                   </div>
                 )}

                 <div className="flex justify-between items-center border-t border-slate-50 pt-8">
                    <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                       <span className="flex items-center gap-2"><MessageSquare size={16} className="text-sliit-orange" /> {ticket.comments?.length || 0} LOGS</span>
                       <span className="flex items-center gap-2"><ImageIcon size={16} className="text-slate-300" /> {ticket.attachments?.length || 0} FILES</span>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedTicket(ticket)}
                      className="px-8 py-4 text-sliit-blue bg-blue-50/50 font-black rounded-2xl hover:bg-sliit-blue hover:text-white transition-all transform active:scale-95 uppercase tracking-widest text-[10px]"
                    >
                      Detail Console
                    </button>
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-sliit-navy/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Left side: Ticket Info */}
            <div className="w-full md:w-1/2 p-12 overflow-y-auto border-r border-slate-100 no-scrollbar">
              <button 
                onClick={() => setSelectedTicket(null)}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 hover:text-sliit-orange transition-colors"
              >
                ← Back to Stream
              </button>
              
              <div className="mb-8">
                <span className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-full border shadow-sm tracking-widest ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
                <h2 className="text-4xl font-black text-slate-900 mt-6 tracking-tighter leading-none">
                  {selectedTicket.resource?.name || 'Incident Details'}
                </h2>
                <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
                  Preferred Contact: <span className="text-sliit-blue">{selectedTicket.preferredContact || 'Not specified'}</span>
                </div>
              </div>

              <div className="space-y-8">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 font-bold text-slate-700 leading-relaxed">
                  {selectedTicket.description}
                </div>

                {selectedTicket.attachments?.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedTicket.attachments.map((url, i) => (
                      <div key={i} className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                        <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedTicket.resolutionNotes && (
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <span className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Resolution Script</span>
                    <p className="font-bold text-emerald-800">{selectedTicket.resolutionNotes}</p>
                  </div>
                )}

                {/* Technician Assignment (Admin Only) */}
                {currentUser?.role === 'ADMIN' && (
                  <div className="pt-8 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Personnel Assignment</h4>
                    <select 
                      onChange={(e) => handleAssign(e.target.value)}
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-black text-xs uppercase outline-none focus:border-sliit-orange"
                      defaultValue=""
                    >
                      <option value="" disabled>Choose Technician</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Staff Actions (Admin/Technician) */}
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'TECHNICIAN') && (
                  <div className="pt-8 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Workflow console</h4>
                    <form onSubmit={handleStatusUpdate} className="space-y-4">
                      <select 
                        value={statusUpdate.status}
                        onChange={(e) => setStatusUpdate({...statusUpdate, status: e.target.value})}
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-black text-xs uppercase outline-none focus:border-sliit-blue"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                      <textarea 
                        value={statusUpdate.notes}
                        onChange={(e) => setStatusUpdate({...statusUpdate, notes: e.target.value})}
                        placeholder="Add resolution notes or reason for status change..."
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold text-sm outline-none focus:border-sliit-blue min-h-[100px]"
                      />
                      <button type="submit" className="w-full py-4 bg-sliit-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all uppercase tracking-widest text-[10px]">
                        Save Progress
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Comments */}
            <div className="w-full md:w-1/2 bg-slate-50 p-12 flex flex-col">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Operational Logs ({comments.length})</h4>
              
              <div className="flex-1 overflow-y-auto space-y-6 mb-8 no-scrollbar">
                {comments.length === 0 ? (
                  <div className="text-center py-10 text-slate-300 font-bold italic">No logs recorded yet.</div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-4">
                      <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shrink-0 border border-slate-100 font-black text-sliit-blue text-xs">
                        {c.author?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800">{c.author?.name || 'Anonymous'}</span>
                            <span className="text-[8px] font-bold text-slate-400">{format(new Date(c.createdAt), 'MMM d, p')}</span>
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
                  placeholder="Type operational note..."
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl p-5 pr-16 font-medium text-sm outline-none focus:border-sliit-orange transition-all shadow-sm"
                />
                <button type="submit" className="absolute right-3 top-3 bottom-3 px-4 bg-sliit-blue text-white rounded-xl hover:bg-sliit-navy transition-all transform active:scale-95">
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

