import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Users, Send, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';

const BookingModal = ({ isOpen, onClose, resource, onBookingSuccess }) => {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    duration: '1',
    purpose: '',
    expectedAttendees: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        duration: '1',
        purpose: '',
        expectedAttendees: resource?.capacity ? Math.floor(resource.capacity / 2).toString() : '1'
      });
      setError('');
    }
  }, [isOpen, resource]);

  if (!isOpen || !resource) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endHour = parseInt(formData.startTime.split(':')[0]) + parseInt(formData.duration);
      const endMinutes = formData.startTime.split(':')[1];
      const endDateTime = `${formData.date}T${endHour.toString().padStart(2, '0')}:${endMinutes}:00`;

      const payload = {
        resourceId: resource.id,
        startTime: startDateTime,
        endTime: endDateTime,
        purpose: formData.purpose,
        expectedAttendees: parseInt(formData.expectedAttendees) || 0
      };

      await axios.post('/api/bookings', payload);
      onBookingSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data || 'Failed to submit booking request. Please check availability windows.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="bg-slate-900 p-8 flex justify-between items-center text-white relative">
          <div className="relative z-10">
            <h2 className="sc-section-title mb-1 text-white">Reserve space</h2>
            <p className="text-slate-400 text-sm font-medium">{resource.name}</p>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all relative z-10">
            <X size={20} />
          </button>
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <CalendarIcon size={100} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {/* Availability Info Banner */}
          <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-100/50 flex items-start gap-4">
            <Info size={20} className="text-amber-600 mt-1 shrink-0" />
            <div>
              <span className="block sc-label text-amber-700 mb-1">Facility availability</span>
              <p className="text-sm font-semibold text-amber-900">
                Open Daily: {resource.availableFrom?.substring(0,5) || '08:00'} — {resource.availableTo?.substring(0,5) || '18:00'}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-5 rounded-3xl text-sm font-medium flex items-center gap-4 border border-rose-100 animate-in slide-in-from-top-2">
              <AlertCircle size={22} className="shrink-0" /> 
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block sc-label mb-3 ml-2">Reservation date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date" name="date" required
                  value={formData.date} onChange={handleChange}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange pl-14 pr-4 py-4 border-2 outline-none transition-all font-semibold text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block sc-label mb-1 ml-2">Start time</label>
              <div className="relative">
                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="time" name="startTime" required
                  value={formData.startTime} onChange={handleChange}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange pl-14 pr-4 py-4 border-2 outline-none transition-all font-semibold text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block sc-label mb-1 ml-2">Duration (hours)</label>
              <select 
                name="duration" value={formData.duration} onChange={handleChange}
                className="w-full bg-slate-50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange p-4 border-2 outline-none cursor-pointer font-semibold text-slate-700"
              >
                <option value="1">1 Hour Block</option>
                <option value="2">2 Hour Block</option>
                <option value="3">3 Hour Block</option>
                <option value="4">4 Hour Session</option>
                <option value="8">Full Day Access</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block sc-label mb-3 ml-2">Request purpose</label>
              <input 
                type="text" name="purpose" required
                value={formData.purpose} onChange={handleChange}
                placeholder="e.g. SEM 2 Tutorial / Group Project Work"
                className="w-full bg-slate-50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange p-4 border-2 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300"
              />
            </div>

            <div className="col-span-2">
              <label className="block sc-label mb-3 ml-2">Expected attendees</label>
              <div className="relative">
                <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" name="expectedAttendees" required
                  value={formData.expectedAttendees} onChange={handleChange}
                  min="1" max={resource.capacity}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange pl-14 pr-4 py-4 border-2 outline-none transition-all font-semibold text-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-4">
            <button onClick={onClose} type="button" className="flex-1 py-5 border-2 border-slate-100 rounded-2xl font-semibold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all text-sm">
              Stay Browsing
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[2] py-5 bg-sliit-orange text-white rounded-2xl font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 shadow-2xl shadow-orange-500/30 active:scale-95 transition-all text-sm"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Send size={18} /> Dispatch Request</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
