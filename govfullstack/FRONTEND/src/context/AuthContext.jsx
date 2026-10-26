import React, { createContext, useContext, useState, useEffect } from 'react';
import { customerService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('banking_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('banking_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('banking_token');
      if (storedToken) {
        try {
          const res = await customerService.getProfile();
          if (res.data && res.data.customer) {
            setUser(res.data.customer);
            localStorage.setItem('banking_user', JSON.stringify(res.data.customer));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out.');
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await customerService.login({ email, password });
    const { token: newToken, customer } = res.data;
    localStorage.setItem('banking_token', newToken);
    localStorage.setItem('banking_user', JSON.stringify(customer));
    setToken(newToken);
    setUser(customer);
    return customer;
  };

  const register = async (customerData) => {
    const res = await customerService.register(customerData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('banking_token');
    localStorage.removeItem('banking_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await customerService.getProfile();
      if (res.data && res.data.customer) {
        setUser(res.data.customer);
        localStorage.setItem('banking_user', JSON.stringify(res.data.customer));
        return res.data.customer;
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
