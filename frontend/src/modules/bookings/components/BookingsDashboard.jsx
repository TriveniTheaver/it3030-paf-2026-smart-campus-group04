import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, Ban, History, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, subMonths, addMonths } from 'date-fns';
import axios from 'axios';

const BookingsDashboard = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

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
    } else if (status === 'APPROVED') {
      const input = window.prompt('Please provide an optional note for approval:');
      if (input === null) return;
      reason = input;
    }

    setProcessingId(id);
    try {
      await axios.put(`/api/bookings/${id}/status`, null, {
        params: {
          status,
          ...(reason !== undefined && reason !== '' ? { reason } : {}),
        },
      });
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
      APPROVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-emerald-500/10',
      PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-amber-500/10',
      REJECTED: 'bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-rose-500/10',
      CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20 shadow-slate-500/10'
    };
    const dotColors = {
      APPROVED: 'bg-emerald-500',
      PENDING: 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]',
      REJECTED: 'bg-rose-500',
      CANCELLED: 'bg-slate-400'
    };
    return (
      <span className={`px-4 py-2 text-[10px] font-black rounded-full border shadow-sm uppercase tracking-widest flex items-center gap-2 backdrop-blur-sm ${styles[status]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`}></span>
        {status}
      </span>
    );
  };

  const renderCalendar = () => {
    if (currentUser?.role !== 'ADMIN') return null;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        days.push(
          <div
            key={day.toString()}
            className={`w-[2.75rem] h-[2.75rem] mx-auto flex justify-center items-center cursor-pointer transition-all duration-400 rounded-full text-sm transform active:scale-90
              ${!isSameMonth(day, monthStart)
                ? "text-slate-300/60 font-bold"
                : isSameDay(day, selectedDate)
                  ? "bg-slate-900 border-2 border-slate-900 text-white shadow-xl shadow-slate-900/20 -translate-y-1 scale-105 font-black"
                  : "text-slate-700 bg-white border-2 border-slate-100 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 font-bold hover:text-slate-900"
              }
            `}
            onClick={() => setSelectedDate(isSameDay(selectedDate, cloneDay) ? null : cloneDay)}
          >
            <span>{formattedDate}</span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7 gap-y-3" key={day.toString()}>{days}</div>);
      days = [];
    }

    return (
      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[3rem] shadow-xl shadow-orange-500/10 border-[3px] border-orange-400/80 w-full xl:w-[24rem] shrink-0 xl:sticky xl:top-8 animate-in slide-in-from-right-4 duration-700 delay-100">
        <div className="flex justify-between items-center mb-8 px-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-700 hover:border-slate-300 active:scale-95 shadow-sm">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-900 rounded-full transition-all text-slate-900 shadow-md hover:bg-slate-50 active:scale-95">
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-6 mt-2">
          {weekDays.map(wd => (
            <div key={wd} className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] text-center">{wd}</div>
          ))}
        </div>
        <div className="grid gap-y-2">{rows}</div>

        {selectedDate && (
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Filter size={14} className="text-slate-300" /> Date Filter Active
              </span>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-500 rounded-full transition-all active:scale-90"
                title="Clear Filter"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white font-bold p-5 rounded-3xl shadow-xl shadow-slate-900/20 flex flex-col justify-center transform transition-all hover:scale-[1.02] border border-slate-800/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <CalendarIcon size={80} />
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-1">Showing results for</span>
              <div className="text-lg tracking-tight relative z-10">
                {format(selectedDate, 'EEEE, MMMM do, yyyy')}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const displayedBookings = bookings.filter(booking => {
    if (!selectedDate) return true;
    return isSameDay(new Date(booking.startTime), selectedDate);
  });

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
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-3.5 px-6 rounded-full shadow-xl shadow-slate-200/40 border border-white transition-all hover:shadow-2xl">
            <Filter size={18} className="text-sliit-orange drop-shadow-sm" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-black text-xs uppercase tracking-widest text-slate-700 cursor-pointer outline-none appearance-none pr-4"
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

      <div className="flex flex-col-reverse xl:flex-row gap-8 items-start">
        <div className="flex-1 grid gap-6 w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-300 gap-4">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-sliit-orange rounded-full animate-spin"></div>
              <span className="font-black text-xs uppercase tracking-[0.2em]">Synchronizing Stream...</span>
            </div>
          ) : displayedBookings.length === 0 ? (
            <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-32 flex flex-col items-center justify-center border-4 border-dashed border-slate-200/60 transition-all animate-in zoom-in-95 duration-500">
              <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/30 mb-6 border border-slate-50">
                <CalendarIcon size={48} className="text-slate-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">No Reservations Found</h3>
              <p className="text-sm font-bold text-slate-400">There are no records matching your current filters.</p>
            </div>
          ) : (
            displayedBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white/90 backdrop-blur-xl rounded-lg p-10 border border-slate-100 border-t-4 border-t-slate-200 shadow-xl shadow-slate-300/30 flex flex-col xl:flex-row gap-10 items-start xl:items-center relative animate-in slide-in-from-bottom-4 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:border-t-sliit-orange hover:bg-sliit-navy group"
              >

                <div className="flex-1 space-y-6">
                  <div className="flex flex-wrap items-center gap-5">
                    <h3 className="text-2xl font-black text-sliit-blue tracking-tight group-hover:text-sliit-orange transition-colors">
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
                    <p className="text-slate-600 font-bold text-lg leading-snug group-hover:text-slate-200 transition-colors">"{booking.purpose}"</p>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-slate-400">
                      <History size={14} /> Expected Scale: {booking.expectedAttendees || 1} PAX
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-3 bg-white border-2 border-slate-100/80 px-6 py-4 rounded-2xl text-slate-700 font-black text-[13px] shadow-[0_4px_0_rgb(241,245,249)] transition-all hover:-translate-y-0.5 group-hover:bg-white/10 group-hover:border-white/25 group-hover:text-slate-100 group-hover:shadow-none w-full">
                      <CalendarIcon size={20} className="text-sliit-blue drop-shadow-sm shrink-0 group-hover:text-sliit-orange" />
                      <span className="truncate">{format(new Date(booking.startTime), 'EEEE, MMMM do')}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white border-2 border-slate-100/80 px-6 py-4 rounded-2xl text-slate-700 font-black text-[13px] shadow-[0_4px_0_rgb(241,245,249)] transition-all hover:-translate-y-0.5 group-hover:bg-white/10 group-hover:border-white/25 group-hover:text-slate-100 group-hover:shadow-none w-full">
                      <Clock size={20} className="text-emerald-500 drop-shadow-sm shrink-0 group-hover:text-sliit-orange" />
                      <span className="truncate">{format(new Date(booking.startTime), 'hh:mm a')} – {format(new Date(booking.endTime), 'hh:mm a')}</span>
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
                {((processingId === booking.id) ||
                  (currentUser?.role !== 'ADMIN' && (booking.status === 'PENDING' || booking.status === 'APPROVED')) ||
                  (currentUser?.role === 'ADMIN' && booking.status === 'PENDING')) && (
                    <div className="xl:border-l border-slate-100/60 xl:pl-10 flex flex-col justify-center gap-4 w-full xl:w-[260px] shrink-0 self-stretch">
                      {processingId === booking.id ? (
                        <div className="flex items-center justify-center py-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                          <div className="w-6 h-6 border-4 border-slate-200 border-t-sliit-blue rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <>
                          {/* User Cancellation Logic */}
                          {currentUser?.role !== 'ADMIN' && (booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                            <button
                              onClick={() => handleCancel(booking.id)}
                              className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-white border-2 border-slate-100 text-slate-500 font-black rounded-3xl shadow-[0_6px_0_rgb(226,232,240)] active:shadow-[0_0px_0_rgb(226,232,240)] active:translate-y-[6px] transition-all duration-150 text-[11px] tracking-[0.2em] uppercase hover:text-rose-500 hover:border-rose-100"
                            >
                              <Ban size={18} strokeWidth={2.5} /> Revoke Request
                            </button>
                          )}

                          {/* Admin Approval Workflow */}
                          {currentUser?.role === 'ADMIN' && booking.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 'APPROVED')}
                                className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-emerald-500 text-white font-black rounded-3xl shadow-[0_8px_0_rgb(5,150,105)] active:shadow-[0_0px_0_rgb(5,150,105)] active:translate-y-[8px] transition-all duration-150 text-[11px] tracking-[0.2em] uppercase hover:bg-emerald-400"
                              >
                                <CheckCircle size={18} strokeWidth={2.5} /> Confirm
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 'REJECTED')}
                                className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-slate-800 text-white font-black rounded-3xl shadow-[0_8px_0_rgb(15,23,42)] active:shadow-[0_0px_0_rgb(15,23,42)] active:translate-y-[8px] transition-all duration-150 text-[11px] tracking-[0.2em] uppercase hover:bg-slate-700"
                              >
                                <XCircle size={18} strokeWidth={2.5} /> Decline
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
        {renderCalendar()}
      </div>
    </div>
  );
};

export default BookingsDashboard;
