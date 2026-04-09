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

  return (
    <div className="p-8 w-full animate-in fade-in duration-700 relative text-slate-900">
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
          <h1 className="sc-page-title mb-2">Facilities &amp; Assets Catalogue</h1>
          <p className="sc-body text-slate-600">Browse, filter, and manage campus resources for booking and support.</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <button 
            onClick={openAddModal}
            className="group flex items-center gap-4 px-8 py-5 bg-sliit-orange text-white rounded-2xl hover:bg-orange-600 shadow-2xl shadow-orange-500/30 font-semibold transition-all hover:-translate-y-1 active:scale-95 text-sm"
          >
            <Plus size={24} className="transition-transform group-hover:rotate-90" />
            Add New Resource
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8 items-stretch">
          {resources.length > 0 ? resources.map(res => {
            const hasImage = res.imageUrl && String(res.imageUrl).trim() !== '';
            return (
            <div key={res.id} className="min-w-0 h-full min-h-0 flex">
              <div className="group sc-resource-card sc-resource-card--fill-grid flex w-full flex-col relative overflow-hidden min-h-0">
              {/* Image header: fixed height; image + empty state both fill the same box (avoids img baseline gap vs placeholder layout) */}
              <div className="relative h-32 min-h-[8rem] max-h-[8rem] flex-none overflow-hidden bg-slate-100">
                {hasImage ? (
                <img 
                  src={res.imageUrl} 
                  alt={res.name}
                  className="absolute inset-0 block h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-1.5 pointer-events-none">
                  <ImageIcon size={32} strokeWidth={1.25} aria-hidden />
                  <span className="text-xs font-semibold tracking-wide uppercase">No photo</span>
                </div>
                )}
                <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md border border-white/20 shadow-lg ${res.status === 'ACTIVE' ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'}`}>
                   {res.status.replace(/_/g, ' ')}
                </div>
                {currentUser?.role === 'ADMIN' && (
                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditModal(res); }} 
                      className="p-2 bg-white/90 backdrop-blur text-sliit-blue rounded-xl hover:bg-white shadow-xl transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }} 
                      className="p-2 bg-white/90 backdrop-blur text-rose-500 rounded-xl hover:bg-white shadow-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <span className="sc-label text-sliit-blue border-2 border-blue-50 bg-blue-50/30 px-3 py-1 rounded-full">
                    {res.type.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2 sc-meta text-slate-500">
                     <Clock size={14} className="text-sliit-orange" />
                     {res.availableFrom ? `${res.availableFrom.substring(0,5)}–${res.availableTo.substring(0,5)}` : '24/7'}
                  </div>
                </div>

                <h3 className="text-base font-bold leading-tight text-slate-900 mb-2 line-clamp-2 min-h-[2.75rem]">
                  {res.name}
                </h3>
                
                <div className="grid grid-cols-2 gap-2 mb-3 min-h-0">
                  <div className="bg-slate-50 p-2.5 rounded-2xl flex flex-col border border-slate-100 group-hover:bg-slate-100/80 transition-colors min-h-[4.75rem]">
                    <span className="sc-label block mb-1 shrink-0">Location</span>
                    <div className="flex flex-1 items-start gap-2 text-slate-800 font-semibold text-sm min-h-0">
                      <MapPin size={16} className="text-sliit-orange shrink-0 mt-0.5" />
                      <span className="line-clamp-2 break-words">{res.location || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-2xl flex flex-col border border-slate-100 group-hover:bg-slate-100/80 transition-colors min-h-[4.75rem]">
                    <span className="sc-label block mb-1 shrink-0">Occupancy</span>
                    <div className="flex flex-1 items-start gap-2 text-slate-800 font-semibold text-sm">
                      <Users size={16} className="text-sliit-blue shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{res.capacity || '0'} Limit</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-center">
                  {currentUser ? (
                    <>
                      {currentUser.role === 'ADMIN' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEditModal(res); }}
                            className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-700 transition-all transform active:scale-95 shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                          >
                            <Edit2 size={13} /> Update
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }}
                            className="px-3 py-2 bg-white border-2 border-rose-100 text-rose-500 font-semibold text-xs rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all transform active:scale-95 flex items-center gap-1.5 shadow-sm"
                          >
                            <Trash2 size={14} /> <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      ) : currentUser.role === 'TECHNICIAN' ? (
                        <button 
                          className="px-5 py-2 bg-slate-200 text-slate-500 font-semibold text-xs rounded-xl cursor-not-allowed flex items-center gap-1.5"
                          disabled
                        >
                          <Monitor size={13} /> Operational View
                        </button>
                      ) : (
                        <button 
                          onClick={() => openBookingModal(res)}
                          className="px-5 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-sliit-navy transition-all transform active:scale-95 shadow-lg shadow-slate-900/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                          disabled={res.status !== 'ACTIVE'}
                        >
                          {res.status === 'ACTIVE' ? 'Reserve Slot' : 'Unavailable'}
                        </button>
                      )}
                    </>
                  ) : (
                    <Link 
                      to="/login"
                      className="px-4 py-2 bg-sliit-orange text-white font-semibold text-xs rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
                    >
                      <LogIn size={14} /> Authenticate to Book
                    </Link>
                  )}
                </div>
              </div>
              </div>
            </div>
          );}) : (
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
