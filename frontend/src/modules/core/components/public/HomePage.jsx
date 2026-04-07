import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Monitor, ArrowRight, Activity, MapPin, Users, LayoutGrid } from 'lucide-react';

export default function HomePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);



  const heroImages = [
    '/assets/images/hero-1.png',
    '/assets/images/hero-2.png',
    '/assets/images/hero-3.png'
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch public dynamic facilities catalogue
    axios.get('/api/facilities')
      .then(res => {
        setFacilities(res.data);
      })
      .catch(err => console.error("Could not fetch public facilities", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans animate-in fade-in duration-700">
      {/* Navbar Overlay Base - Matching official white header */}
      <nav className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center text-sliit-blue relative z-20 shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="flex flex-col">
            <span className="text-sliit-blue font-black text-2xl tracking-tighter leading-none">SLIIT UNI</span>
            <span className="text-[7px] uppercase tracking-[0.2em] font-bold text-slate-400 mt-1">The Knowledge University</span>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          <span className="text-sliit-blue font-serif text-2xl italic">SmartCampus Hub</span>
        </div>
        <div className="flex items-center gap-8">
           <Link to="/resources" className="text-xs font-black text-slate-500 hover:text-sliit-blue transition-colors uppercase tracking-widest">Resources</Link>
           {currentUser ? (
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-sliit-blue">Hi, {currentUser.name}</span>
                <Link to="/dashboard" className="text-xs font-black bg-sliit-orange hover:bg-orange-500 text-white px-5 py-2.5 rounded shadow-lg transition-all active:scale-95">Go to Dashboard</Link>
              </div>
           ) : (
              <Link to="/login" className="text-xs font-black bg-sliit-orange hover:bg-orange-500 text-white px-6 py-3 rounded shadow-xl transition-all active:scale-95 uppercase tracking-tighter">Sign In</Link>
           )}
        </div>
      </nav>

      {/* Hero Section with Dynamic Carousel */}
      <div className="relative h-[650px] overflow-hidden">
        {heroImages.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] ease-linear scale-100"
              style={{ 
                backgroundImage: `url(${img})`,
                transform: idx === currentImageIndex ? 'scale(1.1)' : 'scale(1)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
          </div>
        ))}
        
        <div className="relative h-full max-w-7xl mx-auto px-8 flex flex-col justify-center items-start">
          <div className="max-w-2xl animate-in slide-in-from-left duration-1000">
            <h1 className="text-8xl font-black text-sliit-navy mb-4 leading-none tracking-tighter">
              EVOLVE<br/>BEYOND
            </h1>
            <div className="w-24 h-2 bg-sliit-orange mb-8"></div>
            <p className="text-xl text-slate-700 font-bold mb-10 leading-relaxed">
              Access the official SLIIT facility management gateway.<br/>
              Securely book resources, track campus activities, and<br/>
              report incidents with real-time transparency.
            </p>
            <div className="flex gap-4">
              <Link 
                to="/resources" 
                className="px-10 py-5 bg-sliit-navy text-white rounded-2xl font-black hover:bg-sliit-blue transition-all shadow-2xl flex items-center gap-3 group uppercase tracking-widest text-sm"
              >
                Browse Assets <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
              {!currentUser && (
                <Link 
                  to="/login" 
                  className="px-10 py-5 bg-white text-sliit-navy border-2 border-slate-100 rounded-2xl font-black hover:bg-slate-50 transition-all flex items-center gap-3 uppercase tracking-widest text-sm"
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
            <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">University Infrastructure</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Explore the SLIIT campus asset catalogue. From high-performance computing labs to standard lecture halls, all resources are tracked with real-time availability.
            </p>
          </div>
          <Link to="/resources" className="flex items-center gap-3 text-sliit-blue font-black hover:gap-5 transition-all group pb-2 border-b-2 border-transparent hover:border-sliit-blue">
            Launch Full Explorer <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-32 gap-6">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-sliit-orange rounded-full animate-spin"></div>
            <span className="font-black uppercase tracking-widest text-xs text-slate-300">Synchronizing Live Data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {facilities.length > 0 ? facilities.slice(0, 6).map(fac => (
              <div key={fac.id} className="bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:border-orange-500/20 transition-all group flex flex-col h-full active:scale-[0.98]">
                <div className={`h-2.5 w-full transition-all group-hover:h-4 ${fac.type === 'LAB' ? 'bg-sliit-blue' : fac.type === 'LECTURE_HALL' ? 'bg-sliit-orange' : 'bg-slate-800'}`}></div>
                <div className="p-10 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-2xl font-black text-slate-800 group-hover:text-sliit-blue transition-colors leading-tight">{fac.name}</h3>
                    <span className={`px-4 py-1.5 text-[9px] uppercase tracking-widest font-black rounded-full shadow-sm border ${fac.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {fac.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 mb-10">
                    <div className="flex items-center text-slate-500 text-sm font-bold bg-slate-50 p-4 rounded-2xl group-hover:bg-slate-100/80 transition-colors">
                      <MapPin className="w-5 h-5 mr-4 text-sliit-orange" /> {fac.location || 'Distributed'}
                    </div>
                    <div className="flex items-center text-slate-500 text-sm font-bold bg-slate-50 p-4 rounded-2xl group-hover:bg-slate-100/80 transition-colors">
                      <Users className="w-5 h-5 mr-4 text-sliit-blue" /> {fac.capacity || 'N/A'} Seats Available
                    </div>
                  </div>
                  <Link to="/resources" className="block w-full text-center py-4 bg-slate-900 hover:bg-sliit-navy text-white font-black rounded-xl transition-all shadow-lg shadow-slate-900/20 transform group-hover:-translate-y-1">
                    Book & Request
                  </Link>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-24 bg-white rounded-[3rem] border-4 border-slate-100 border-dashed">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
                  <Monitor size={40} />
                </div>
                <p className="text-slate-800 font-black text-xl mb-3 uppercase tracking-tight">Catalogue Offline</p>
                <p className="text-slate-400 font-medium max-w-sm mx-auto">No operational assets were found. Please verify backend connectivity.</p>
              </div>
            )}
          </div>
        )}
      </section>
      
      {/* Premium Footer */}
      <footer className="bg-sliit-navy text-slate-400 py-16 text-center mt-auto border-t-8 border-sliit-orange z-10 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="font-black text-2xl text-white mb-6 tracking-tighter">
            <span className="text-sliit-orange">SmartCampus</span> HUB
          </div>
          <p className="font-bold text-sm mb-4">Developed for Campus Operations & Resource Optimization.</p>
          <p className="text-[11px] opacity-40 uppercase tracking-[0.3em] font-black">© {new Date().getFullYear()} Sri Lanka Institute of Information Technology</p>
        </div>
      </footer>
    </div>
  );
}
