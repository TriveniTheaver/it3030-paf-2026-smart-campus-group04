import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, ShieldAlert, ArrowRight, Activity, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login, overrideToken, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [portalType, setPortalType] = useState('CLIENT'); // 'CLIENT' | 'STAFF'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
  }, [location, overrideToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
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
          <h1 className="text-4xl font-bold mb-4">SLIIT<br/>SmartCampus Hub</h1>
          <p className="text-slate-300 text-lg">Integrated Campus Operations & Facilities Management</p>
        </div>

        {/* Login Form Side */}
        <div className="p-12 md:w-7/12">
          
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

          <h2 className="text-2xl font-bold text-sliit-navy mb-2">
            {portalType === 'CLIENT' ? 'Welcome Back' : 'Authorized Personnel Only'}
          </h2>
          <p className="text-slate-500 mb-8">
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
              className={`w-full py-3 px-4 rounded-lg font-bold text-white flex justify-center items-center gap-2 transition-all shadow-md hover:shadow-lg ${portalType === 'CLIENT' ? 'bg-sliit-blue hover:bg-sliit-navy' : 'bg-sliit-orange hover:bg-orange-600'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {portalType === 'CLIENT' && (
            <div className="mt-8 text-center text-sm text-slate-500">
              Don't have an account? <Link to="/register" className="font-bold text-sliit-blue hover:text-sliit-orange transition-colors">Register here</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
