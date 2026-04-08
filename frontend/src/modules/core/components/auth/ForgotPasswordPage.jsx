import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Send plain string. Content-Type is text/plain by default if passed as string directly.
      await axios.post('/api/auth/forgot-password', email, {
        headers: { 'Content-Type': 'text/plain' }
      });
      setSubmitted(true);
    } catch {
      // In a security-conscious enterprise application, we always report success
      // to prevent email enumeration attacks.
      setSubmitted(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-sliit-light flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-sliit-blue rounded-full flex items-center justify-center mx-auto mb-4">
            {submitted ? <CheckCircle2 className="w-8 h-8" /> : <Mail className="w-8 h-8" />}
          </div>
          <h1 className="sc-page-title text-sliit-navy mb-2">
            {submitted ? 'Check Your Email' : 'Forgot Password?'}
          </h1>
          <p className="sc-meta">
            {submitted 
              ? 'If an account exists with that email, we have sent a password reset link.' 
              : 'Enter your registered email address and we\'ll send you a link to reset your password.'}
          </p>
        </div>

        {!submitted && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sliit-orange outline-none transition-all" 
                  placeholder="name@sliit.lk"
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white bg-sliit-orange hover:bg-orange-600 transition-all shadow ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm">
          <Link to="/login" className="sc-link text-slate-500 hover:text-sliit-navy transition-colors flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
        
      </div>
    </div>
  );
}
