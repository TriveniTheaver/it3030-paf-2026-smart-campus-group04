import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function OAuthCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { overrideToken } = useAuth();
  const [error, setError] = useState('');

  /* eslint-disable react-hooks/set-state-in-effect -- token is derived from URL params */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      overrideToken(token);
      navigate('/dashboard', { replace: true });
      return;
    }
    setError('OAuth login failed: missing token.');
  }, [location.search, overrideToken, navigate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="min-h-screen bg-sliit-light flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        {error ? (
          <>
            <h1 className="sc-section-title text-sliit-navy mb-2">Sign-in error</h1>
            <p className="sc-meta text-red-600">{error}</p>
          </>
        ) : (
          <>
            <h1 className="sc-section-title text-sliit-navy mb-2">Signing you in…</h1>
            <p className="sc-meta">Completing Google authentication and opening your dashboard.</p>
          </>
        )}
      </div>
    </div>
  );
}

