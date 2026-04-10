import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, ShieldAlert, ArrowRight, Activity, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { login, overrideToken, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [portalType, setPortalType] = useState('CLIENT'); // 'CLIENT' | 'STAFF'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  /** null = loading; backend /api/auth/google-oauth-status */
  const [googleOAuthConfigured, setGoogleOAuthConfigured] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/google-oauth-status')
      .then((r) => (r.ok ? r.json() : Promise.resolve({ configured: false })))
      .then((data) => {
        if (!cancelled) setGoogleOAuthConfigured(!!data.configured);
      })
      .catch(() => {
        if (!cancelled) setGoogleOAuthConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- derive UI error state from URL params */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const err = params.get('error');
    if (token) {
      overrideToken(token);
      navigate('/dashboard');
    }
    if (err === 'InvalidDomain') {
      setError('Google Sign-In is restricted to SLIIT university emails only (@my.sliit.lk or @sliit.lk).');
    }
    if (err === 'OAuthEmailMissing') {
      setError('Google did not return an email for this account. Try another Google account or use SLIIT login.');
    }
  }, [location, overrideToken, navigate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email, password);
      const role = u?.role;

      const allowed =
        portalType === 'CLIENT'
          ? role === 'USER'
          : role === 'ADMIN' || role === 'TECHNICIAN';

      if (!allowed) {
        logout();
        setError(
          portalType === 'CLIENT'
            ? 'Please use the Admin / Technician portal to sign in with this account.'
            : 'Please use the Student / Staff portal to sign in with this account.'
        );
        return;
      }

      navigate('/dashboard');
    } catch {
      setError('Invalid credentials. Please verify your email and password.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-sliit-light flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Branding Side */}
        <div className="bg-sliit-blue text-white p-12 flex flex-col justify-center items-start md:w-5/12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sliit-orange rounded-bl-full opacity-10 transform translate-x-12 -translate-y-12"></div>
          <Activity className="w-16 h-16 text-sliit-orange mb-6" />
          <h1 className="sc-page-title text-white mb-4">SLIIT<br/>SmartCampus Hub</h1>
          <p className="text-slate-300 sc-body">Integrated Campus Operations & Facilities Management</p>
        </div>

        {/* Login Form Side */}
        <div className="p-12 md:w-7/12">

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-sliit-navy transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          
          <div className="flex bg-slate-100 p-1 rounded-lg mb-8">
            <button 
              type="button"
              onClick={() => { setPortalType('CLIENT'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${portalType === 'CLIENT' ? 'bg-white shadow text-sliit-blue' : 'text-slate-500 hover:text-sliit-navy'}`}
            >
              Student / Staff Portal
            </button>
            <button 
              type="button"
              onClick={() => { setPortalType('STAFF'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${portalType === 'STAFF' ? 'bg-white shadow text-sliit-orange' : 'text-slate-500 hover:text-sliit-orange'}`}
            >
              <ShieldAlert className="w-4 h-4" /> Admin / Technician
            </button>
          </div>

          <h2 className="sc-section-title text-sliit-navy mb-2">
            {portalType === 'CLIENT' ? 'Welcome Back' : 'Authorized Personnel Only'}
          </h2>
          <p className="sc-meta mb-8">
            {portalType === 'CLIENT' ? 'Sign in to book resources and report issues.' : 'Access administrative controls and operational tickets.'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 border border-red-100 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sliit-orange focus:border-sliit-orange outline-none transition-all" 
                  placeholder="name@sliit.lk"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-sm font-semibold text-sliit-orange hover:text-orange-700">Forgot Password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sliit-orange focus:border-sliit-orange outline-none transition-all" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white flex justify-center items-center gap-2 transition-all shadow-md hover:shadow-lg ${portalType === 'CLIENT' ? 'bg-sliit-blue hover:bg-sliit-navy' : 'bg-sliit-orange hover:bg-orange-600'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {portalType === 'CLIENT' && googleOAuthConfigured === true && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-white px-3 text-slate-400 font-semibold">Or continue with</span>
                </div>
              </div>
              <a
                href="/oauth2/authorization/google"
                className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-slate-200 bg-white py-3 px-4 font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </a>
            </>
          )}

          {portalType === 'CLIENT' && googleOAuthConfigured === false && (
            <p className="mt-6 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
              Google Sign-In is off until the backend has real OAuth credentials. Copy{' '}
              <code className="rounded bg-white px-1 font-mono text-[11px]">application-local.yml.example</code> to{' '}
              <code className="rounded bg-white px-1 font-mono text-[11px]">application-local.yml</code> and add your Google
              Web client ID and secret, then restart the API.
            </p>
          )}

          {portalType === 'CLIENT' && (
            <div className="mt-8 text-center text-sm text-slate-500">
              Don't have an account? <Link to="/register" className="sc-link text-sliit-blue hover:text-sliit-orange transition-colors">Register here</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
