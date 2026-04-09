import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './modules/core/contexts/AuthContext';
import NotificationBell from './modules/core/components/notifications/NotificationBell';
import FacilitiesDashboard from './modules/facilities/components/FacilitiesDashboard';
import BookingsDashboard from './modules/bookings/components/BookingsDashboard';
import IncidentsDashboard from './modules/incidents/components/IncidentsDashboard';
import AdminNotifications from './modules/core/components/admin/AdminNotifications';
import AdminFacilitiesAnalytics from './modules/facilities/components/AdminFacilitiesAnalytics';

import LoginPage from './modules/core/components/auth/LoginPage';
import RegisterPage from './modules/core/components/auth/RegisterPage';
import ForgotPasswordPage from './modules/core/components/auth/ForgotPasswordPage';
import MockGoogleLogin from './modules/core/components/auth/MockGoogleLogin';
import OAuthCallbackPage from './modules/core/components/auth/OAuthCallbackPage';
import ProtectedRoute from './modules/core/components/auth/ProtectedRoute';
import HomePage from './modules/core/components/public/HomePage';
import { sliitAudienceFromEmail } from './modules/core/utils/sliitAudience';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [opsOpen, setOpsOpen] = useState(false);
  const [campusOpen, setCampusOpen] = useState(false);
  const opsMenuRef = useRef(null);
  const campusMenuRef = useRef(null);

  const opsItems = useMemo(() => {
    if (currentUser?.role !== 'ADMIN') return [];
    return [
      { to: '/dashboard', label: 'Central Command Overview', desc: 'Back to admin dashboard' },
      { to: '/facilities', label: 'Manage Catalogue', desc: 'Resources & assets catalogue' },
      { to: '/bookings', label: 'Booking Queue', desc: 'Approve / reject requests' },
      { to: '/incidents', label: 'System Triage', desc: 'Assign & resolve tickets' },
      { to: '/admin/notifications', label: 'Notifications', desc: 'Broadcast announcements' },
      { to: '/admin/facilities-analytics', label: 'Facilities Analytics', desc: 'Usage insights & trends' },
    ];
  }, [currentUser?.role]);

  const campusItems = useMemo(() => {
    if (currentUser?.role !== 'USER') return [];
    return [
      { to: '/dashboard', label: 'Campus overview', desc: 'Your services home' },
      { to: '/resources', label: 'Browse resources', desc: 'Facilities & equipment catalogue' },
      { to: '/bookings', label: 'My bookings', desc: 'Reservations & calendar' },
      { to: '/incidents', label: 'Support & incidents', desc: 'Report maintenance issues' },
    ];
  }, [currentUser?.role]);

  const techItems = useMemo(() => {
    if (currentUser?.role !== 'TECHNICIAN') return [];
    return [
      { to: '/dashboard', label: 'Workflow overview', desc: 'Technician home' },
      { to: '/incidents', label: 'Service queue', desc: 'Tickets & assignments' },
    ];
  }, [currentUser?.role]);

  useEffect(() => {
    const open = opsOpen || campusOpen;
    if (!open) return;
    const onDown = (e) => {
      if (opsMenuRef.current?.contains(e.target)) return;
      if (campusMenuRef.current?.contains(e.target)) return;
      setOpsOpen(false);
      setCampusOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [opsOpen, campusOpen]);

  const campusAudience =
    currentUser?.role === 'USER' ? sliitAudienceFromEmail(currentUser.email) : null;

  const renderDropdown = (items, open, setOpen, menuRef, label) => (
    <div className="relative z-[100]" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          'px-4 py-3 text-xs font-semibold transition-all flex items-center gap-1',
          open ? 'text-white bg-white/10' : 'text-slate-200 hover:text-white hover:bg-white/5',
        ].join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}{' '}
        <span className={['opacity-40 ml-1 transition-transform', open ? 'rotate-180' : ''].join(' ')}>⌄</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 w-[min(100vw-2rem,340px)] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-[9999]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100">
            <p className="sc-label text-slate-600">Shortcuts</p>
          </div>
          <div className="py-2 max-h-[70vh] overflow-y-auto">
            {items.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-5 py-3 hover:bg-sliit-light/70 transition-colors"
              >
                <p className="font-semibold text-slate-800">{it.label}</p>
                <p className="sc-meta text-slate-500">{it.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <header className="flex flex-col relative z-50">
      <div className="bg-white px-8 py-4 flex justify-between items-center border-b border-slate-200 shadow-sm">
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

        <div className="flex items-center gap-6">
          {currentUser ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-500">Logged in as</p>
                {campusAudience ? (
                  <p className="text-xs font-bold text-sliit-orange uppercase tracking-wide mt-0.5">{campusAudience}</p>
                ) : null}
                <p className="text-base font-semibold text-sliit-blue">{currentUser.name}</p>
              </div>
              <div className="h-10 w-10 bg-sliit-light rounded-full flex items-center justify-center border-2 border-sliit-orange shadow-inner">
                <span className="font-semibold text-sliit-blue">{currentUser.name.charAt(0)}</span>
              </div>
              <NotificationBell />
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-sm font-semibold text-sliit-orange hover:text-orange-600 underline decoration-2 underline-offset-4"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-slate-500 mb-1">Log in using your account on:</span>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded border border-slate-200 font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
              >
                <div className="w-4 h-4 bg-sliit-orange rounded-sm" />
                SLIIT Login
              </button>
              <Link to="/forgot-password" className="sc-link text-sliit-orange mt-1 hover:underline">
                Forgotten your password?
              </Link>
            </div>
          )}
        </div>
      </div>

      <nav className="bg-sliit-grey border-t-4 border-sliit-orange px-8 flex items-center shadow-lg overflow-visible relative z-50">
        <Link to="/" title="Home" className="p-3 bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0">
          <div className="w-5 h-5 flex items-center justify-center">🏠</div>
        </Link>
        <div className="flex items-center px-4 space-x-2 min-w-0 overflow-visible">
          {currentUser?.role === 'ADMIN' ? (
            renderDropdown(opsItems, opsOpen, setOpsOpen, opsMenuRef, 'Operations')
          ) : currentUser?.role === 'USER' ? (
            renderDropdown(campusItems, campusOpen, setCampusOpen, campusMenuRef, 'Campus services')
          ) : currentUser?.role === 'TECHNICIAN' ? (
            renderDropdown(techItems, campusOpen, setCampusOpen, campusMenuRef, 'Service desk')
          ) : (
            <Link
              to="/resources"
              className="px-4 py-3 text-xs font-semibold text-yellow-400 hover:text-yellow-300 hover:bg-white/5 transition-all"
            >
              Resources
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

const dashboardCardClass =
  'bg-white p-8 rounded-lg shadow border border-slate-100 hover:shadow-xl transition-all border-t-4 border-t-slate-200 hover:border-t-sliit-orange h-full hover:bg-sliit-navy group';

/** Width of one column in a md:grid-cols-3 + gap-8 row (keeps bottom pair aligned with top cards) */
const dashboardGridThird =
  'w-full md:w-[calc((100%-4rem)/3)] md:max-w-[calc((100%-4rem)/3)]';

const Dashboard = () => {
  const { currentUser } = useAuth();

  const UserPanel = (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <Link to="/facilities" className="block outline-none min-w-0">
        <div className={dashboardCardClass}>
          <h2 className="sc-card-title mb-2 text-sliit-blue group-hover:text-sliit-orange">Browse &amp; Book Resources</h2>
          <p className="sc-meta group-hover:text-slate-200">Request access to lecture halls, meeting rooms, or equipment.</p>
        </div>
      </Link>
      <Link to="/bookings" className="block outline-none min-w-0">
        <div className={dashboardCardClass}>
          <h2 className="sc-card-title mb-2 text-sliit-blue group-hover:text-sliit-orange">My Active Bookings</h2>
          <p className="sc-meta group-hover:text-slate-200">Manage and view your accepted/pending campus reservations.</p>
        </div>
      </Link>
      <Link to="/incidents" className="block outline-none min-w-0">
        <div className={dashboardCardClass}>
          <h2 className="sc-card-title mb-2 text-sliit-blue group-hover:text-sliit-orange">Report an Incident</h2>
          <p className="sc-meta group-hover:text-slate-200">Log tickets for damaged hardware or facility maintenance requests.</p>
        </div>
      </Link>
    </div>
  );

  const adminCardClass = dashboardCardClass;

  const AdminPanel = (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <Link to="/facilities" className="block outline-none min-w-0">
        <div className={adminCardClass}>
          <h2 className="sc-card-title mb-2 text-sliit-blue group-hover:text-sliit-orange">Manage Catalogue</h2>
          <p className="sc-meta group-hover:text-slate-200">Create brand new campus resources and modify inventory capacities dynamically.</p>
        </div>
      </Link>
      <Link to="/bookings" className="block outline-none min-w-0">
        <div className={adminCardClass}>
          <h2 className="sc-card-title mb-2 text-sliit-blue group-hover:text-sliit-orange">Booking Queue</h2>
          <p className="sc-meta group-hover:text-slate-200">Review, approve, or reject incoming reservations requested by Students &amp; Staff.</p>
        </div>
      </Link>
      <Link to="/incidents" className="block outline-none min-w-0">
        <div className={adminCardClass}>
          <h2 className="sc-card-title mb-2 text-sliit-blue group-hover:text-sliit-orange">System Triage</h2>
          <p className="sc-meta group-hover:text-slate-200">Assign maintenance technicians to open operational tickets facility-wide.</p>
        </div>
      </Link>
      <div className="md:col-span-3 flex flex-col md:flex-row flex-wrap justify-center gap-8">
        <Link to="/admin/notifications" className={`block outline-none min-w-0 shrink-0 ${dashboardGridThird}`}>
          <div className={adminCardClass}>
            <h2 className="sc-card-title mb-2 text-sliit-blue group-hover:text-sliit-orange">Manage Notifications</h2>
            <p className="sc-meta group-hover:text-slate-200">Broadcast campus-wide announcements and audit all system-generated alerts.</p>
          </div>
        </Link>
        <Link to="/admin/facilities-analytics" className={`block outline-none min-w-0 shrink-0 ${dashboardGridThird}`}>
          <div className={adminCardClass}>
            <h2 className="sc-card-title mb-2 text-sliit-blue group-hover:text-sliit-orange">Facilities Analytics</h2>
            <p className="sc-meta group-hover:text-slate-200">See top resources, peak booking hours, and utilization insights.</p>
          </div>
        </Link>
      </div>
    </div>
  );

  const TechnicianPanel = (
    <div className="max-w-2xl mx-auto">
      <Link to="/incidents" className="block outline-none">
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-slate-700 hover:border-sliit-orange transition-colors">
          <h2 className="sc-section-title mb-4 text-sliit-blue text-center">Open Service Console</h2>
          <p className="sc-meta text-center mb-6">
            Review your assigned maintenance tickets, add operational logs, and resolve ongoing hardware or structural facility incidents.
          </p>
          <div className="w-full py-3 bg-slate-800 text-white rounded font-semibold text-center text-sm">Launch Job Queue</div>
        </div>
      </Link>
    </div>
  );

  return (
    <div className="p-8">
      <h1 className="sc-page-title mb-8 text-slate-800">
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
        <div className="min-h-screen bg-transparent font-sans text-slate-800">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/mock-google-login" element={<MockGoogleLogin />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

            <Route
              element={
                <>
                  <Navbar />
                  <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
                    <div className="bg-white border border-slate-200/70 rounded-3xl shadow-sm w-full max-w-6xl mx-auto">
                      <Outlet />
                    </div>
                  </main>
                </>
              }
            >
              <Route path="/resources" element={<FacilitiesDashboard />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/facilities" element={<FacilitiesDashboard />} />
                <Route path="/bookings" element={<BookingsDashboard />} />
                <Route path="/incidents" element={<IncidentsDashboard />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/facilities-analytics" element={<AdminFacilitiesAnalytics />} />
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
