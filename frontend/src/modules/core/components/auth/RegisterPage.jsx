import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requestedRole, setRequestedRole] = useState('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, requestedRole);
      navigate('/');
    } catch (err) {
      setError('Registration failed. The email might already be in use.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-sliit-light flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sliit-navy mb-2">Create Account</h1>
          <p className="text-slate-500">Join the SLIIT Operations Hub</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 border border-red-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="pl-10 w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sliit-blue outline-none transition-all" 
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">University / Staff Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sliit-blue outline-none transition-all" 
                placeholder="john.d@sliit.lk"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Account Type</label>
            <select 
              value={requestedRole} 
              onChange={(e) => setRequestedRole(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sliit-blue outline-none transition-all bg-white"
            >
              <option value="USER">Student / Staff Member</option>
              <option value="TECHNICIAN">Maintenance Technician</option>
              <option value="ADMIN">System Administrator</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">Note: Tech/Admin roles are auto-authorized in this demo environment.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sliit-blue outline-none transition-all" 
                placeholder="Create a strong password" minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white flex justify-center items-center gap-2 transition-all bg-sliit-blue hover:bg-sliit-navy shadow ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Creating Account...' : <><CheckCircle2 className="w-5 h-5" /> Register Now</>}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
          Already have an account? <Link to="/login" className="font-bold text-sliit-orange hover:underline transition-colors">Sign in here</Link>
        </div>
        
      </div>
    </div>
  );
}
