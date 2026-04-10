import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sliitAudienceFromEmail } from '../../utils/sliitAudience';
import axios from 'axios';
import { Monitor, ArrowRight, MapPin, Users, LayoutGrid, Clock, Image as ImageIcon } from 'lucide-react';

export default function HomePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);



  const heroImages = [
    '/images/hero/hero-1.png',
    '/images/hero/hero-2.png',
  ];
  const heroImagesLength = heroImages.length;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImagesLength);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImagesLength]);

  useEffect(() => {
    // Fetch public dynamic facilities catalogue
    axios.get('/api/facilities')
      .then(res => {
        setFacilities(res.data);
      })
      .catch(err => console.error("Could not fetch public facilities", err))
      .finally(() => setLoading(false));
  }, []);

  const campusAudience =
    currentUser?.role === 'USER' ? sliitAudienceFromEmail(currentUser.email) : null;

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans animate-in fade-in duration-700">
      {/* Navbar Overlay Base - Matching official white header */}
      <nav className="bg-white border-b border-slate-100 px-8 py-3.5 flex justify-between items-center text-sliit-blue relative z-20 shadow-sm">
        <div className="flex items-center gap-5 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="flex items-start gap-4">
            <div className="flex flex-col">
              <span className="text-sliit-logo sc-brand leading-none">SLIIT UNI</span>
              <span className="text-xs font-medium text-sliit-logo/90 mt-1 leading-none border-t border-sliit-logo/25 pt-1">
                The Knowledge University
              </span>
            </div>
            <div className="h-12 w-px bg-sliit-logo/25" />
            <span className="text-sliit-blue sc-brand leading-none pt-[1px]">SmartCampus Hub</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
           {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-0.5 text-right">
                  {campusAudience ? (
                    <span className="text-xs font-bold text-sliit-orange uppercase tracking-wide">{campusAudience}</span>
                  ) : null}
                  <span className="text-sm font-medium text-sliit-blue">Hi, {currentUser.name}</span>
                </div>
                <Link
                  to="/dashboard"
                  className="text-sm font-semibold bg-sliit-orange hover:bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg transition-all active:scale-95"
                >
                  Go to Dashboard
                </Link>
              </div>
           ) : (
              <Link
                to="/login"
                className="text-sm font-semibold bg-sliit-orange hover:bg-orange-500 text-white px-7 py-3.5 rounded-lg shadow-xl transition-all active:scale-95"
              >
                Sign In
              </Link>
           )}
        </div>
      </nav>

      {/* Hero Section with Dynamic Carousel */}
      <div className="relative h-[640px] overflow-hidden">
        {heroImages.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] ease-linear scale-100"
              style={{ 
                backgroundImage: `url(${img})`,
                transform: idx === currentImageIndex ? 'scale(1.05)' : 'scale(1)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
          </div>
        ))}
        
        <div className="relative h-full max-w-7xl mx-auto px-8 flex flex-col justify-center items-start">
          <div className="max-w-2xl animate-in slide-in-from-left duration-1000">
            <h1 className="text-sliit-navy mb-5 leading-[1.1] text-5xl sm:text-6xl font-semibold tracking-[0.08em]">
              EVOLVE BEYOND
            </h1>
            <div className="w-28 h-2 bg-sliit-orange mb-8"></div>
            <p className="text-lg font-medium text-slate-700 mb-10 leading-relaxed max-w-xl">
              Access the official SLIIT facility management gateway.<br/>
              Securely book resources, track campus activities, and<br/>
              report incidents with real-time transparency.
            </p>
            <div className="flex gap-4">
              <Link 
                to="/resources" 
                className="px-11 py-5 bg-sliit-navy text-white rounded-2xl font-semibold hover:bg-sliit-blue transition-all shadow-2xl flex items-center gap-3 group text-base"
              >
                Browse Assets <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
              {!currentUser && (
                <Link 
                  to="/login" 
                  className="px-11 py-5 bg-white text-sliit-navy border-2 border-slate-100 rounded-2xl font-semibold hover:bg-slate-50 transition-all flex items-center gap-3 text-base"
                >
                  SLIIT Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Catalogue Preview */}
      <section className="max-w-7xl mx-auto py-32 px-8 w-full z-10 relative">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16 px-4">
          <div className="max-w-2xl">
            <h2 className="sc-section-title text-slate-900 mb-6">University Infrastructure</h2>
            <p className="sc-body text-slate-600 leading-relaxed">
              Explore the SLIIT campus asset catalogue. From high-performance computing labs to standard lecture halls, all resources are tracked with real-time availability.
            </p>
          </div>
          <Link to="/resources" className="sc-link flex items-center gap-3 text-sliit-blue hover:gap-5 transition-all group pb-2 border-b-2 border-transparent hover:border-sliit-blue">
            Explore more <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-32 gap-6">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-sliit-orange rounded-full animate-spin"></div>
            <span className="font-semibold text-xs text-slate-300">Synchronizing live data…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch">
            {facilities.length > 0 ? facilities.slice(0, 3).map(fac => {
              const hasImage = fac.imageUrl && String(fac.imageUrl).trim() !== '';
              return (
              <div key={fac.id} className="min-w-0 flex justify-center h-full">
                <div className="group sc-resource-card flex w-full flex-col overflow-hidden h-full active:scale-[0.98]">
                <div className="relative h-40 min-h-[10rem] max-h-[10rem] flex-none overflow-hidden bg-slate-100">
                  {hasImage ? (
                    <img
                      src={fac.imageUrl}
                      alt={fac.name}
                      className="absolute inset-0 block h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 pointer-events-none">
                      <ImageIcon size={36} strokeWidth={1.25} aria-hidden />
                      <span className="text-xs font-semibold tracking-wide uppercase">No photo</span>
                    </div>
                  )}
                  <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md border border-white/20 shadow-lg ${fac.status === 'ACTIVE' ? 'bg-emerald-500/85 text-white' : 'bg-rose-500/85 text-white'}`}>
                    {fac.status.replace(/_/g, ' ')}
                  </div>
                </div>
                <div className="p-7 flex flex-col flex-1 min-h-0">
                  <div className="flex justify-between items-center gap-3 mb-4">
                    <span className="sc-label text-sliit-blue border-2 border-blue-50 bg-blue-50/30 px-3 py-1 rounded-full">
                      {(fac.type || 'RESOURCE').replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-1.5 sc-meta text-slate-500 shrink-0">
                      <Clock size={14} className="text-sliit-orange" />
                      {fac.availableFrom && fac.availableTo
                        ? `${fac.availableFrom.substring(0, 5)}–${fac.availableTo.substring(0, 5)}`
                        : '24/7'}
                    </div>
                  </div>
                  <h3 className="sc-card-title text-slate-900 mb-5 line-clamp-2">{fac.name}</h3>
                  <div className="grid grid-cols-1 gap-3 mb-8 flex-1">
                    <div className="flex items-start gap-3 sc-meta bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-slate-100/80 transition-colors">
                      <MapPin className="w-5 h-5 text-sliit-orange shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{fac.location || 'Distributed'}</span>
                    </div>
                    <div className="flex items-center gap-3 sc-meta bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-slate-100/80 transition-colors">
                      <Users className="w-5 h-5 text-sliit-blue shrink-0" />
                      <span>{fac.capacity ?? 'N/A'} seats</span>
                    </div>
                  </div>
                  <Link
                    to="/resources"
                    className="mt-auto block w-full text-center py-3.5 bg-slate-900 hover:bg-sliit-orange text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-slate-900/20"
                  >
                    Book & Request
                  </Link>
                </div>
                </div>
              </div>
            );}) : (
              <div className="col-span-full text-center py-24 bg-white rounded-[3rem] border-4 border-slate-100 border-dashed">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
                  <Monitor size={40} />
                </div>
                <p className="sc-section-title text-slate-800 mb-3">Catalogue offline</p>
                <p className="sc-meta max-w-sm mx-auto">No operational assets were found. Please verify backend connectivity.</p>
              </div>
            )}
          </div>
        )}
      </section>
      
      {/* Premium Footer */}
      <footer className="bg-sliit-navy text-slate-400 py-16 text-center mt-auto border-t-8 border-sliit-orange z-10 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="sc-section-title text-white mb-6">
            <span className="text-sliit-orange">SmartCampus</span> HUB
          </div>
          <p className="sc-meta text-slate-300 mb-4">Developed for Campus Operations & Resource Optimization.</p>
          <p className="text-xs opacity-50 font-medium">© {new Date().getFullYear()} Sri Lanka Institute of Information Technology</p>
        </div>
      </footer>
    </div>
  );
}
