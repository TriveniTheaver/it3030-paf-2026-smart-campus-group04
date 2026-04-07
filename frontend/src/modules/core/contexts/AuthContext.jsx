import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setCurrentUser({
          id: decoded.id,
          name: decoded.name,
          email: decoded.sub,
          role: decoded.role
        });
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token } = res.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const decoded = decodeJwt(token);
    setCurrentUser({
      id: decoded.id, name: decoded.name, email: decoded.sub, role: decoded.role
    });
  };

  const register = async (name, email, password, role = 'USER') => {
    const res = await axios.post('/api/auth/register', { name, email, password, role });
    const { token } = res.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const decoded = decodeJwt(token);
    setCurrentUser({
      id: decoded.id, name: decoded.name, email: decoded.sub, role: decoded.role
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  const overrideToken = (token) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const decoded = decodeJwt(token);
    setCurrentUser({
      id: decoded.id, name: decoded.name, email: decoded.sub, role: decoded.role
    });
  };

  const loginWithGoogle = () => {
    window.location.href = '/mock-google-login';
  };

  const value = { currentUser, login, register, logout, overrideToken, loginWithGoogle };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
