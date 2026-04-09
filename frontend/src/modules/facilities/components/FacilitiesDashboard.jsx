import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, MapPin, Users, Edit2, Trash2, Plus, LayoutGrid, LogIn, CheckCircle2, Clock, Image as ImageIcon, Monitor } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import { Link } from 'react-router-dom';
import ResourceModal from './ResourceModal';
import BookingModal from '../../bookings/components/BookingModal';

const FacilitiesDashboard = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', location: '', minCapacity: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingResource, setBookingResource] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [saveError, setSaveError] = useState('');

  const clearSaveError = useCallback(() => setSaveError(''), []);

  const { currentUser } = useAuth();

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const cleanedFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null && v !== ''));
      const params = new URLSearchParams(cleanedFilters);
      const res = await axios.get(`/api/facilities?${params.toString()}`);
      setResources(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch resources', error);
      setLoading(false);
    }
  }, [filters]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const handleSave = async (payload) => {
    try {
      if (selectedResource) {
        await axios.put(`/api/facilities/${selectedResource.id}`, payload);
      } else {
        await axios.post('/api/facilities', payload);
      }
      setSaveError('');
      setIsModalOpen(false);
      fetchResources();
    } catch (error) {
      console.error('Error saving resource', error);
      const d = error.response?.data;
      if (d?.errors && typeof d.errors === 'object') {
        setSaveError(Object.entries(d.errors).map(([k, v]) => `${k}: ${v}`).join(' · '));
      } else if (d?.message) {
        setSaveError(d.detail ? `${d.message} (${d.detail})` : d.message);
      } else {
        setSaveError('Failed to save resource. Ensure you have Admin permissions.');
      }
    }
  };

  const handleDelete = async (id) => {
    console.log('Initiating deletion for resource ID:', id);
    if (!window.confirm('Are you sure you want to decommission this asset? This action is permanent.')) {
      console.log('Deletion cancelled by user.');
      return;
    }
    
    try {
      console.log('Executing DELETE request to /api/facilities/' + id);
      const res = await axios.delete(`/api/facilities/${id}`);
      console.log('Delete response:', res.status);
      fetchResources();
    } catch (error) {
      console.error('Error deleting resource', error);
      alert('Delete operation failed. Please check your permissions or network.');
    }
  };

  const openAddModal = () => {
    setSaveError('');
    setSelectedResource(null);
    setIsModalOpen(true);
  };

  const openEditModal = (res) => {
    setSaveError('');
    setSelectedResource(res);
    setIsModalOpen(true);
  };

  const openBookingModal = (res) => {
    setBookingResource(res);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const getPlaceholderImage = (type) => {
    const images = {
      'LECTURE_HALL': 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200',
      'LAB': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200',
      'MEETING_ROOM': 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=1200',
      'EQUIPMENT': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=1200'
    };
    return images[type] || images['LECTURE_HALL'];
  };

  return (
    <div className="p-8 max-w-[1700px] mx-auto animate-in fade-in duration-700 relative text-slate-900">
      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-24 right-8 z-[200] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-full duration-500">
          <CheckCircle2 size={24} />
          <div>
            <p className="font-semibold text-sm">Request sent</p>
            <p className="text-xs opacity-90 font-medium">Awaiting administrative confirmation.</p>
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div className="relative">
          <div className="absolute -left-12 top-0 bottom-0 w-2 bg-sliit-orange rounded-full hidden md:block"></div>
          <h1 className="sc-page-title mb-2">Campus Infrastructure</h1>
          <p className="sc-body text-slate-600">Next-generation resource management for the modern learner.</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <button 
            onClick={openAddModal}
            className="group flex items-center gap-4 px-8 py-5 bg-sliit-orange text-white rounded-2xl hover:bg-orange-600 shadow-2xl shadow-orange-500/30 font-semibold transition-all hover:-translate-y-1 active:scale-95 text-sm"
          >
            <Plus size={24} className="transition-transform group-hover:rotate-90" />
            New Strategic Asset
          </button>
        )}
      </div>

      {/* Advanced Search Bar */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 mb-12 overflow-hidden relative">
        <form onSubmit={handleSearch} className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-500 ml-2">Classification</label>
            <select name="type" onChange={handleFilterChange} className="w-full bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange p-5 border-2 outline-none transition-all font-semibold text-slate-700 text-sm">
              <option value="">All</option>
              <option value="LECTURE_HALL">Lecture Hall</option>
              <option value="LAB">Laboratory</option>
              <option value="MEETING_ROOM">Meeting Room</option>
              <option value="EQUIPMENT">Technical Equipment</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-500 ml-2">Zone / Building</label>
            <div className="relative">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" name="location" onChange={handleFilterChange} placeholder="Search by sector..." className="w-full bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange pl-14 pr-4 py-5 border-2 outline-none transition-all font-semibold text-slate-700 text-sm" />
            </div>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-500 ml-2">Capacity Threshold</label>
            <div className="relative">
              <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="number" name="minCapacity" onChange={handleFilterChange} placeholder="Min PAX..." className="w-full bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-sliit-orange pl-14 pr-4 py-5 border-2 outline-none transition-all font-semibold text-slate-700 text-sm" />
            </div>
          </div>
          <button type="submit" className="px-10 py-5 bg-sliit-navy text-white font-semibold flex items-center justify-center gap-4 rounded-2xl hover:bg-sliit-blue shadow-xl shadow-blue-900/10 transition-all transform active:scale-95 text-sm">
            <Search size={22} /> Execute Scan
          </button>
        </form>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-48 text-slate-300 gap-6">
          <div className="w-20 h-20 border-[6px] border-slate-100 border-t-sliit-orange rounded-full animate-spin"></div>
          <span className="font-semibold text-xs">Synchronizing master registry…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
          {resources.length > 0 ? resources.map(res => (
            <div key={res.id} className="bg-white rounded-[2.25rem] overflow-hidden shadow-xl hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 border border-slate-100 group flex flex-col relative transform hover:-translate-y-2">
              {/* Image Header with Visual State */}
              <div className="relative h-40 overflow-hidden">
                <img 
                  src={res.imageUrl || getPlaceholderImage(res.type)} 
                  alt={res.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute top-5 left-5 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md border border-white/20 shadow-lg ${res.status === 'ACTIVE' ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'}`}>
                   {res.status.replace(/_/g, ' ')}
                </div>
                {currentUser?.role === 'ADMIN' && (
                  <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditModal(res); }} 
                      className="p-3 bg-white/90 backdrop-blur text-sliit-blue rounded-2xl hover:bg-white shadow-xl transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }} 
                      className="p-3 bg-white/90 backdrop-blur text-rose-500 rounded-2xl hover:bg-white shadow-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <span className="sc-label text-sliit-blue border-2 border-blue-50 bg-blue-50/30 px-4 py-1.5 rounded-full">
                    {res.type.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2 sc-meta text-slate-500">
                     <Clock size={14} className="text-sliit-orange" />
                     {res.availableFrom ? `${res.availableFrom.substring(0,5)}–${res.availableTo.substring(0,5)}` : '24/7'}
                  </div>
                </div>

                <h3 className="sc-card-title text-slate-800 mb-3 group-hover:text-sliit-blue transition-colors">
                  {res.name}
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 p-3.5 rounded-3xl flex flex-col border border-slate-100">
                    <span className="sc-label block mb-2">Location</span>
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                      <MapPin size={16} className="text-sliit-orange" /> {res.location || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-3xl flex flex-col border border-slate-100">
                    <span className="sc-label block mb-2">Occupancy</span>
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                      <Users size={16} className="text-sliit-blue" /> {res.capacity || '0'} Limit
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-end">
                  {currentUser ? (
                    <>
                      {currentUser.role === 'ADMIN' ? (
                        <div className="flex gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEditModal(res); }}
                            className="px-5 py-3 bg-emerald-600 text-white font-semibold text-sm rounded-2xl hover:bg-emerald-700 transition-all transform active:scale-95 shadow-xl shadow-emerald-600/20 flex items-center gap-2"
                          >
                            <Edit2 size={14} /> Update
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }}
                            className="px-4 py-3 bg-white border-2 border-rose-100 text-rose-500 font-semibold text-sm rounded-2xl hover:bg-rose-50 hover:border-rose-200 transition-all transform active:scale-95 flex items-center gap-2 shadow-sm"
                          >
                            <Trash2 size={14} /> <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      ) : currentUser.role === 'TECHNICIAN' ? (
                        <button 
                          className="px-7 py-3 bg-slate-200 text-slate-500 font-semibold text-sm rounded-2xl cursor-not-allowed flex items-center gap-2"
                          disabled
                        >
                          <Monitor size={14} /> Operational View
                        </button>
                      ) : (
                        <button 
                          onClick={() => openBookingModal(res)}
                          className="px-7 py-3 bg-slate-900 text-white font-semibold text-sm rounded-2xl hover:bg-sliit-navy transition-all transform active:scale-95 shadow-xl shadow-slate-900/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                          disabled={res.status !== 'ACTIVE'}
                        >
                          {res.status === 'ACTIVE' ? 'Reserve Slot' : 'Unavailable'}
                        </button>
                      )}
                    </>
                  ) : (
                    <Link 
                      to="/login"
                      className="px-6 py-3 bg-sliit-orange text-white font-semibold text-sm rounded-2xl hover:bg-orange-600 transition-all flex items-center gap-3 shadow-xl shadow-orange-500/20"
                    >
                      <LogIn size={16} /> Authenticate to Book
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full flex flex-col items-center justify-center py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200">
               <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl mb-8 text-slate-200">
                  <LayoutGrid size={50} />
               </div>
               <h3 className="sc-section-title text-slate-800 mb-3">No Assets Synchronized</h3>
               <p className="sc-body text-slate-600 max-w-md text-center">Adjust your filters or scan a different campus sector for available infrastructure.</p>
            </div>
          )}
        </div>
      )}

      {/* Management Modal Container */}
      <ResourceModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSaveError(''); }} 
        onSave={handleSave} 
        resource={selectedResource}
        serverError={saveError}
        onClearServerError={clearSaveError}
      />

      {/* Booking Modal Container */}
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        resource={bookingResource}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
};

export default FacilitiesDashboard;
