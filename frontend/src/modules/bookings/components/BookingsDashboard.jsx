import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, Ban, History, Filter } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import { format } from 'date-fns';
import axios from 'axios';

const BookingsDashboard = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [currentUser, filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const endpoint = currentUser?.role === 'ADMIN' ? '/api/bookings/all' : '/api/bookings/my';
      const params = filter ? `?status=${filter}` : '';
      const res = await axios.get(`${endpoint}${params}`);
      setBookings(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    let reason = '';
    if (status === 'REJECTED') {
      reason = window.prompt('Please provide a reason for rejection:');
      if (reason === null) return;
    }

    setProcessingId(id);
    try {
      await axios.put(`/api/bookings/${id}/status?status=${status}&reason=${reason}`);
      fetchBookings();
    } catch (error) {
      alert('Operation failed. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setProcessingId(id);
    try {
      await axios.put(`/api/bookings/${id}/cancel`);
      fetchBookings();
    } catch (error) {
      alert('Failed to cancel. You may not be authorized.');
    } finally {
      setProcessingId(null);
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
      REJECTED: 'bg-rose-50 text-rose-600 border-rose-100',
      CANCELLED: 'bg-slate-50 text-slate-500 border-slate-200'
    };
    return (
      <span className={`px-4 py-1.5 text-[10px] font-black rounded-full border shadow-sm uppercase tracking-widest ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            {currentUser?.role === 'ADMIN' ? 'Reservations Command' : 'My Campus Activity'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {currentUser?.role === 'ADMIN' 
              ? 'Review and manage facility booking requests across the entire campus.' 
              : 'Track your pending requests and view your booking history.'}
          </p>
        </div>

        {currentUser?.role === 'ADMIN' && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
            <Filter size={18} className="ml-2 text-slate-400" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-black text-xs uppercase tracking-widest text-slate-600 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-300 gap-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-sliit-orange rounded-full animate-spin"></div>
            <span className="font-black text-xs uppercase tracking-[0.2em]">Synchronizing Stream...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-32 text-center border-4 border-dashed border-slate-100 italic font-medium text-slate-400">
             No reservation records found.
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-50 hover:shadow-2xl transition-all group flex flex-col xl:flex-row gap-10 items-start xl:items-center relative overflow-hidden">
              {/* Vertical Role Strip */}
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${booking.status === 'APPROVED' ? 'bg-emerald-500' : booking.status === 'PENDING' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>

              <div className="flex-1 space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-sliit-blue transition-colors">
                    {booking.resource?.name || 'Unknown Asset'}
                  </h3>
                  <StatusBadge status={booking.status} />
                  {currentUser?.role === 'ADMIN' && (
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                      Requested by: {booking.user?.name || booking.user?.email}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                   <p className="text-slate-600 font-bold text-lg leading-snug">"{booking.purpose}"</p>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <History size={14} /> Expected Scale: {booking.expectedAttendees || 1} PAX
                   </p>
                </div>
                
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-slate-700 font-black text-sm shadow-sm transition-transform active:scale-95">
                    <CalendarIcon size={18} className="text-sliit-orange" />
                    {format(new Date(booking.startTime), 'EEEE, MMMM do')}
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-slate-700 font-black text-sm shadow-sm transition-transform active:scale-95">
                    <Clock size={18} className="text-sliit-orange" />
                    {format(new Date(booking.startTime), 'hh:mm a')} – {format(new Date(booking.endTime), 'hh:mm a')}
                  </div>
                </div>
                
                {booking.adminReason && (
                  <div className="mt-4 flex items-start gap-3 bg-rose-50/50 p-5 rounded-3xl border border-rose-100/50 animate-in slide-in-from-top-2">
                    <AlertCircle size={20} className="text-rose-500 shrink-0 mt-1" />
                    <div>
                      <span className="block text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Administrator Feedback</span>
                      <p className="text-sm text-rose-700 font-bold">{booking.adminReason}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Panels */}
              <div className="xl:border-l border-slate-100 xl:pl-10 flex flex-col gap-3 w-full xl:w-56 shrink-0">
                {processingId === booking.id ? (
                  <div className="flex items-center justify-center py-4 bg-slate-50 rounded-2xl">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-sliit-blue rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    {/* User Cancellation Logic */}
                    {currentUser?.role !== 'ADMIN' && (booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                      <button 
                        onClick={() => handleCancel(booking.id)}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 text-slate-500 font-black rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-95 text-xs tracking-widest uppercase"
                      >
                        <Ban size={18} /> Revoke Request
                      </button>
                    )}

                    {/* Admin Approval Workflow */}
                    {currentUser?.role === 'ADMIN' && booking.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleUpdateStatus(booking.id, 'APPROVED')}
                          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all active:scale-95 text-xs tracking-widest uppercase"
                        >
                          <CheckCircle size={18} /> Confirm
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(booking.id, 'REJECTED')}
                          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black shadow-xl shadow-slate-900/20 transition-all active:scale-95 text-xs tracking-widest uppercase"
                        >
                          <XCircle size={18} /> Decline
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookingsDashboard;
