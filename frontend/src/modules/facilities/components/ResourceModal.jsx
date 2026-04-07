import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Clock, ImageIcon, Globe } from 'lucide-react';

const ResourceModal = ({ isOpen, onClose, onSave, resource }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'LECTURE_HALL',
    capacity: 0,
    location: '',
    availableFrom: '08:00',
    availableTo: '18:00',
    imageUrl: '',
    status: 'ACTIVE'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (resource) {
      // Ensure time format is HH:mm for HTML time input
      const formattedResource = {
        ...resource,
        availableFrom: resource.availableFrom ? resource.availableFrom.substring(0, 5) : '08:00',
        availableTo: resource.availableTo ? resource.availableTo.substring(0, 5) : '18:00',
        imageUrl: resource.imageUrl || ''
      };
      setFormData(formattedResource);
    } else {
      setFormData({
        name: '',
        type: 'LECTURE_HALL',
        capacity: 0,
        location: '',
        availableFrom: '08:00',
        availableTo: '18:00',
        imageUrl: '',
        status: 'ACTIVE'
      });
    }
  }, [resource, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'capacity' ? parseInt(value) || 0 : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location) {
      setError('Please fill in all required fields.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="bg-sliit-navy p-6 flex justify-between items-center text-white shrink-0">
          <h2 className="text-xl font-extrabold flex items-center gap-3">
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
          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-rose-100 animate-in slide-in-from-top-2">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          {/* Core Info Section */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Identity & Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Asset Name *</label>
                <input 
                  type="text" name="name" required
                  value={formData.name} onChange={handleChange}
                  placeholder="e.g. Computing Lab 01 (Advanced Networking)"
                  className="w-full bg-slate-50 border-slate-100 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange focus:bg-white p-4 border-2 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Category</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    name="type" value={formData.type} onChange={handleChange}
                    className="w-full bg-slate-50 border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange pl-12 pr-4 py-4 border-2 outline-none cursor-pointer font-black text-slate-700 transition-all"
                  >
                    <option value="LECTURE_HALL">Lecture Hall</option>
                    <option value="LAB">Laboratory</option>
                    <option value="MEETING_ROOM">Meeting Room</option>
                    <option value="EQUIPMENT">Technical Equipment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Capacity (Pax)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">#</span>
                  <input 
                    type="number" name="capacity" min="0"
                    value={formData.capacity} onChange={handleChange}
                    className="w-full bg-slate-50 border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange pl-12 pr-4 py-4 border-2 outline-none font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Operational Rules Section */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-sliit-blue uppercase tracking-[0.2em] mb-4">Availability & Visuals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Location *</label>
                <input 
                  type="text" name="location" required
                  value={formData.location} onChange={handleChange}
                  placeholder="e.g. Block A, Level 2, Room 204"
                  className="w-full bg-slate-50 border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange p-4 border-2 outline-none transition-all font-bold text-slate-700"
                />
              </div>

              <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50">
                <label className="block text-xs font-black text-sliit-blue mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} /> Operational Hours
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="time" name="availableFrom"
                    value={formData.availableFrom} onChange={handleChange}
                    className="flex-1 bg-white border-slate-100 rounded-xl p-3 border-2 font-black text-slate-700"
                  />
                  <span className="text-slate-400 font-black shrink-0">to</span>
                  <input 
                    type="time" name="availableTo"
                    value={formData.availableTo} onChange={handleChange}
                    className="flex-1 bg-white border-slate-100 rounded-xl p-3 border-2 font-black text-slate-700"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <label className="block text-xs font-black text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} /> Showcase Image URL
                </label>
                <input 
                  type="url" name="imageUrl"
                  value={formData.imageUrl} onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white border-slate-100 rounded-xl p-3 border-2 font-bold text-slate-700 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Operational Status Toggle */}
          <div className="pt-4 flex flex-col gap-4">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Asset Lifecycle Status</label>
            <div className="flex gap-4">
              {['ACTIVE', 'OUT_OF_SERVICE'].map(s => (
                <button
                  key={s} type="button"
                  onClick={() => setFormData({...formData, status: s})}
                  className={`flex-1 py-4 rounded-2xl font-black border-2 transition-all text-xs tracking-widest uppercase flex items-center justify-center gap-3 ${formData.status === s ? 'bg-white border-sliit-orange text-sliit-orange shadow-xl shadow-orange-500/5' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-slate-200'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${formData.status === s ? 'bg-sliit-orange animate-pulse' : 'bg-slate-300'}`}></div>
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex gap-4">
            <button onClick={onClose} type="button" className="flex-1 py-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-500 hover:bg-slate-50 active:scale-95 transition-all text-sm uppercase tracking-widest">
              Discard Changes
            </button>
            <button type="submit" className="flex-2 grow-[2] py-5 bg-sliit-orange text-white rounded-2xl font-black hover:bg-orange-600 flex items-center justify-center gap-3 shadow-2xl shadow-orange-500/30 active:scale-95 transition-all text-sm uppercase tracking-widest">
              <Save size={20} /> Deploy Artifact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceModal;
