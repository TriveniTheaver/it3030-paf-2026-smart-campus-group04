import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Clock, ImageIcon, Globe } from 'lucide-react';

const buildPayload = (formData, availabilityMode) => {
  const name = (formData.name || '').trim();
  const location = (formData.location || '').trim();
  const cap = Number(formData.capacity);

  if (!name) {
    throw new Error('Asset name is required.');
  }
  if (!location) {
    throw new Error('Location is required.');
  }
  if (!Number.isFinite(cap) || cap < 1) {
    throw new Error('Capacity must be a number of at least 1.');
  }

  let availableFrom = null;
  let availableTo = null;
  if (availabilityMode === 'hours') {
    const from = (formData.availableFrom || '').trim();
    const to = (formData.availableTo || '').trim();
    if (!from || !to) {
      throw new Error('Set both start and end times, or switch to 24/7 access.');
    }
    const [fh, fm] = from.split(':').map(Number);
    const [th, tm] = to.split(':').map(Number);
    const fromM = fh * 60 + (fm || 0);
    const toM = th * 60 + (tm || 0);
    if (toM < fromM) {
      throw new Error('End time must be the same as or after start time.');
    }
    availableFrom = from;
    availableTo = to;
  }

  return {
    name,
    type: formData.type,
    capacity: cap,
    location,
    availableFrom,
    availableTo,
    imageUrl: (formData.imageUrl || '').trim() || null,
    status: formData.status,
  };
};

const ResourceModal = ({ isOpen, onClose, onSave, resource, serverError, onClearServerError }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'LECTURE_HALL',
    capacity: 1,
    location: '',
    availableFrom: '08:00',
    availableTo: '18:00',
    imageUrl: '',
    status: 'ACTIVE',
  });
  const [availabilityMode, setAvailabilityMode] = useState('hours');
  const [error, setError] = useState('');

  /* Reset form when opening for add vs edit (controlled modal; syncs props to local fields) */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) return;
    if (resource) {
      const hasHours = resource.availableFrom && resource.availableTo;
      setAvailabilityMode(hasHours ? 'hours' : 'always');
      const formattedResource = {
        ...resource,
        availableFrom: resource.availableFrom ? resource.availableFrom.substring(0, 5) : '08:00',
        availableTo: resource.availableTo ? resource.availableTo.substring(0, 5) : '18:00',
        imageUrl: resource.imageUrl || '',
      };
      setFormData(formattedResource);
    } else {
      setAvailabilityMode('hours');
      setFormData({
        name: '',
        type: 'LECTURE_HALL',
        capacity: 1,
        location: '',
        availableFrom: '08:00',
        availableTo: '18:00',
        imageUrl: '',
        status: 'ACTIVE',
      });
    }
    setError('');
    onClearServerError?.();
  }, [resource, isOpen, onClearServerError]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'capacity' ? parseInt(value, 10) || 0 : value });
    setError('');
    onClearServerError?.();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    onClearServerError?.();
    try {
      const payload = buildPayload(formData, availabilityMode);
      onSave(payload);
    } catch (err) {
      setError(err.message || 'Please check the form.');
    }
  };

  const displayError = error || serverError;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="bg-sliit-navy p-6 flex justify-between items-center text-white shrink-0">
          <h2 className="sc-section-title flex items-center gap-3 text-white">
            <span className="w-8 h-8 bg-sliit-orange rounded-lg flex items-center justify-center text-white text-lg">
              {resource ? '✎' : '+'}
            </span>
            {resource ? 'Enhance Asset Record' : 'Register New Campus Asset'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
          {displayError && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 border border-rose-100 animate-in slide-in-from-top-2">
              <AlertCircle size={20} /> {displayError}
            </div>
          )}

          {/* Core Info Section */}
          <div className="space-y-6">
            <h3 className="sc-label mb-4 block">Identity & classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block sc-label mb-2">Asset name *</label>
                <input 
                  type="text" name="name" required
                  value={formData.name} onChange={handleChange}
                  placeholder="e.g. Computing Lab 01 (Advanced Networking)"
                  className="w-full bg-slate-50 border-slate-100 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange focus:bg-white p-4 border-2 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="block sc-label mb-2">Category</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    name="type" value={formData.type} onChange={handleChange}
                    className="w-full bg-slate-50 border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange pl-12 pr-4 py-4 border-2 outline-none cursor-pointer font-semibold text-slate-700 transition-all"
                  >
                    <option value="LECTURE_HALL">Lecture Hall</option>
                    <option value="LAB">Laboratory</option>
                    <option value="MEETING_ROOM">Meeting Room</option>
                    <option value="EQUIPMENT">Technical Equipment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block sc-label mb-2">Capacity (pax)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">#</span>
                  <input 
                    type="number" name="capacity" min="1"
                    value={formData.capacity} onChange={handleChange}
                    className="w-full bg-slate-50 border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange pl-12 pr-4 py-4 border-2 outline-none font-semibold text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Operational Rules Section */}
          <div className="space-y-6">
            <h3 className="sc-label text-sliit-blue mb-4 block">Availability & visuals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block sc-label mb-2">Location *</label>
                <input 
                  type="text" name="location" required
                  value={formData.location} onChange={handleChange}
                  placeholder="e.g. Block A, Level 2, Room 204"
                  className="w-full bg-slate-50 border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange p-4 border-2 outline-none transition-all font-semibold text-slate-700"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-3">
                <label className="sc-label">Booking window</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-700">
                    <input
                      type="radio"
                      name="availMode"
                      checked={availabilityMode === 'hours'}
                      onChange={() => { setAvailabilityMode('hours'); setError(''); onClearServerError?.(); }}
                      className="accent-sliit-orange"
                    />
                    Operational hours
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-700">
                    <input
                      type="radio"
                      name="availMode"
                      checked={availabilityMode === 'always'}
                      onChange={() => { setAvailabilityMode('always'); setError(''); onClearServerError?.(); }}
                      className="accent-sliit-orange"
                    />
                    24/7 (no hourly restriction)
                  </label>
                </div>
              </div>

              {availabilityMode === 'hours' ? (
                <div className="md:col-span-2 bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50">
                  <label className="block sc-label text-sliit-blue mb-4 flex items-center gap-2">
                    <Clock size={14} /> Operational Hours
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="time" name="availableFrom"
                      value={formData.availableFrom} onChange={handleChange}
                      className="flex-1 bg-white border-slate-100 rounded-xl p-3 border-2 font-semibold text-slate-700"
                    />
                    <span className="text-slate-400 font-medium shrink-0">to</span>
                    <input 
                      type="time" name="availableTo"
                      value={formData.availableTo} onChange={handleChange}
                      className="flex-1 bg-white border-slate-100 rounded-xl p-3 border-2 font-semibold text-slate-700"
                    />
                  </div>
                </div>
              ) : (
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 sc-meta">
                  No start/end times are sent; the resource is treated as available around the clock for scheduling checks that use this metadata.
                </div>
              )}

              <div className="md:col-span-2 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <label className="block sc-label mb-4 flex items-center gap-2">
                  <ImageIcon size={14} /> Showcase Image URL
                </label>
                <input 
                  type="text" name="imageUrl"
                  value={formData.imageUrl} onChange={handleChange}
                  placeholder="e.g. /images/facilities/lab-2.jpg or https://images.unsplash.com/..."
                  className="w-full bg-white border-slate-100 rounded-xl p-3 border-2 font-semibold text-slate-700 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Operational Status Toggle */}
          <div className="pt-4 flex flex-col gap-4">
            <label className="block sc-label">Asset lifecycle status</label>
            <div className="flex gap-4">
              {['ACTIVE', 'OUT_OF_SERVICE'].map(s => (
                <button
                  key={s} type="button"
                  onClick={() => { setFormData({...formData, status: s}); setError(''); onClearServerError?.(); }}
                  className={`flex-1 py-4 rounded-2xl font-semibold border-2 transition-all text-sm flex items-center justify-center gap-3 ${formData.status === s ? 'bg-white border-sliit-orange text-sliit-orange shadow-xl shadow-orange-500/5' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-slate-200'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${formData.status === s ? 'bg-sliit-orange animate-pulse' : 'bg-slate-300'}`}></div>
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex gap-4">
            <button onClick={onClose} type="button" className="flex-1 py-5 bg-white border-2 border-slate-100 rounded-2xl font-semibold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all text-sm">
              Discard Changes
            </button>
            <button type="submit" className="flex-2 grow-[2] py-5 bg-sliit-orange text-white rounded-2xl font-semibold hover:bg-orange-600 flex items-center justify-center gap-3 shadow-2xl shadow-orange-500/30 active:scale-95 transition-all text-sm">
              <Save size={20} /> Deploy Artifact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceModal;
