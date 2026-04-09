import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './modules/core/contexts/AuthContext';
import NotificationPanel from './modules/core/contexts/NotificationPanel';
import FacilitiesDashboard from './modules/facilities/components/FacilitiesDashboard';
import BookingsDashboard from './modules/bookings/components/BookingsDashboard';
import IncidentsDashboard from './modules/incidents/components/IncidentsDashboard';
import AdminNotifications from './modules/core/components/admin/AdminNotifications';

import LoginPage from './modules/core/components/auth/LoginPage';
import RegisterPage from './modules/core/components/auth/RegisterPage';
import ForgotPasswordPage from './modules/core/components/auth/ForgotPasswordPage';
import MockGoogleLogin from './modules/core/components/auth/MockGoogleLogin';
import ProtectedRoute from './modules/core/components/auth/ProtectedRoute';
import HomePage from './modules/core/components/public/HomePage';
const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getNavClass = (path) => {
    const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
    return `px-5 py-4 text-xs font-bold transition-all flex items-center gap-1 uppercase tracking-wider ${
      isActive 
        ? "text-yellow-400 hover:text-yellow-300 hover:bg-white/5 bg-white/5"
        : "text-slate-200 hover:text-white hover:bg-white/5"
    }`;
  };

  return (
    <header className="flex flex-col relative z-50">
      {/* Top Header - White */}
      <div className="bg-white px-8 py-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="flex flex-col">
            <span className="text-sliit-blue font-black text-3xl tracking-tighter leading-none">SLIIT UNI</span>
            <span className="text-[8px] uppercase tracking-[0.3em] font-bold text-slate-400 mt-1">The Knowledge University</span>
          </div>
          <div className="h-10 w-px bg-slate-200 mx-2"></div>
          <span className="text-sliit-blue font-serif text-3xl italic">SmartCampus Hub</span>
        </div>
        
        <div className="flex items-center gap-6">
          {currentUser ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Logged in as</p>
                <p className="text-sm font-black text-sliit-blue">{currentUser.name}</p>
              </div>
              <div className="h-10 w-10 bg-sliit-light rounded-full flex items-center justify-center border-2 border-sliit-orange shadow-inner">
                <span className="font-black text-sliit-blue">{currentUser.name.charAt(0)}</span>
              </div>
              <NotificationPanel />
              <button 
                onClick={() => { logout(); navigate('/login'); }} 
                className="text-xs font-black text-sliit-orange hover:text-orange-600 underline decoration-2 underline-offset-4 uppercase tracking-tighter"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Log in using your account on:</span>
              <button 
                onClick={() => navigate('/login')} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded border border-slate-200 font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
              >
                <div className="w-4 h-4 bg-sliit-orange rounded-sm"></div>
                SLIIT Login
              </button>
              <Link to="/forgot-password" size="sm" className="text-[10px] text-sliit-orange font-bold mt-1 hover:underline">Forgotten your password?</Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation - Dark Grey */}
      <nav className="bg-sliit-grey border-t-4 border-sliit-orange px-8 flex items-center overflow-x-auto no-scrollbar shadow-lg">
        <Link to="/" className="p-4 bg-white/10 hover:bg-white/20 text-white transition-colors">
          <div className="w-5 h-5 flex items-center justify-center">🏠</div>
        </Link>
        <div className="flex items-center px-4 space-x-2">
          <Link to="/" className={getNavClass('/')}>
            Home <span className="opacity-40 ml-1">⌄</span>
          </Link>
          <Link to="/dashboard" className={getNavClass('/dashboard')}>
            Programmes <span className="opacity-40 ml-1">⌄</span>
          </Link>
          <Link to="/resources" className={getNavClass('/resources')}>
            Resources <span className="opacity-40 ml-1">⌄</span>
          </Link>
          <Link to="/bookings" className={getNavClass('/bookings')}>
            My Bookings <span className="opacity-40 ml-1">⌄</span>
          </Link>
          <Link to="/incidents" className={getNavClass('/incidents')}>
             Support <span className="opacity-40 ml-1">⌄</span>
          </Link>
        </div>
      </nav>
    </header>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();

  const UserPanel = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Link to="/facilities" className="block outline-none">
        <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-all border-t-4 border-sliit-navy h-full">
          <h2 className="font-bold text-xl mb-2 text-sliit-blue">Browse & Book Resources</h2>
          <p className="text-slate-500">Request access to lecture halls, meeting rooms, or equipment.</p>
        </div>
      </Link>
      <Link to="/bookings" className="block outline-none">
        <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-all border-t-4 border-sliit-orange h-full">
          <h2 className="font-bold text-xl mb-2 text-sliit-blue">My Active Bookings</h2>
          <p className="text-slate-500">Manage and view your accepted/pending campus reservations.</p>
        </div>
      </Link>
      <Link to="/incidents" className="block outline-none md:col-span-2">
        <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-all border-t-4 border-slate-700 h-full">
          <h2 className="font-bold text-xl mb-2 text-sliit-blue">Report an Incident</h2>
          <p className="text-slate-500">Log tickets for damaged hardware or facility maintenance requests.</p>
        </div>
      </Link>
    </div>
  );

  const AdminPanel = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Link to="/facilities" className="block outline-none">
        <div className="bg-sliit-navy text-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-bl-full opacity-5 transform translate-x-8 -translate-y-8"></div>
          <h2 className="font-bold text-xl mb-2 text-sliit-orange">Manage Catalogue</h2>
          <p className="text-slate-300 text-sm">Create brand new campus resources and modify inventory capacities dynamically.</p>
        </div>
      </Link>
      <Link to="/bookings" className="block outline-none">
        <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-all border-t-4 border-sliit-orange h-full">
          <h2 className="font-bold text-xl mb-2 text-sliit-blue">Booking Queue</h2>
          <p className="text-slate-500 text-sm">Review, approve, or reject incoming reservations requested by Students & Staff.</p>
        </div>
      </Link>
      <Link to="/incidents" className="block outline-none">
        <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-all border-t-4 border-slate-700 h-full">
          <h2 className="font-bold text-xl mb-2 text-sliit-blue">System Triage</h2>
          <p className="text-slate-500 text-sm">Assign maintenance technicians to open operational tickets facility-wide.</p>
        </div>
      </Link>
      <Link to="/admin/notifications" className="block outline-none">
        <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-all border-t-4 border-sliit-orange h-full">
          <h2 className="font-bold text-xl mb-2 text-sliit-blue">Manage Notifications</h2>
          <p className="text-slate-500 text-sm">Broadcast campus-wide announcements and audit all system-generated alerts.</p>
        </div>
      </Link>
    </div>
  );

  const TechnicianPanel = (
    <div className="max-w-2xl mx-auto">
      <Link to="/incidents" className="block outline-none">
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-slate-700 hover:border-sliit-orange transition-colors">
          <h2 className="font-bold text-2xl mb-4 text-sliit-blue text-center">Open Service Console</h2>
          <p className="text-slate-500 text-center mb-6">Review your assigned maintenance tickets, add operational logs, and resolve ongoing hardware or structural facility incidents.</p>
          <div className="w-full py-3 bg-slate-800 text-white rounded font-bold text-center">Launch Job Queue</div>
        </div>
      </Link>
    </div>
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold mb-8 text-slate-800">
        {currentUser?.role === 'ADMIN' && 'Central Command Overview'}
        {currentUser?.role === 'TECHNICIAN' && 'Technician Workflow'}
        {currentUser?.role === 'USER' && 'Campus Services Portal'}
      </h1>
      {currentUser?.role === 'ADMIN' && AdminPanel}
      {currentUser?.role === 'TECHNICIAN' && TechnicianPanel}
      {currentUser?.role === 'USER' && UserPanel}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-sliit-light font-sans text-slate-800">
          <Routes>
            {/* Direct Public Access (No Navbar wrapper needed for Home/Login/Register) */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/mock-google-login" element={<MockGoogleLogin />} />
            
            {/* Application Shell with Navbar (Public and Protected) */}
            <Route element={
              <>
                <Navbar />
                <main className="max-w-7xl mx-auto py-6">
                  <Outlet />
                </main>
              </>
            }>
              {/* Public Catalogue Browse */}
              <Route path="/resources" element={<FacilitiesDashboard />} />
              
              {/* Internal Protected Application Space */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/facilities" element={<FacilitiesDashboard />} />
                <Route path="/bookings" element={<BookingsDashboard />} />
                <Route path="/incidents" element={<IncidentsDashboard />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
