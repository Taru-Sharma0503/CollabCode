import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi';
import { setAccessToken } from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      // Check if user has an existing session cookie
      const hasSession = localStorage.getItem('has_session') === 'true';
      if (!hasSession) {
        setLoading(false);
        return;
      }

      try {
        const refreshData = await authApi.refresh();
        if (refreshData?.accessToken) {
          const meData = await authApi.getMe();
          setUser(meData?.user || null);
        }
      } catch (err) {
        console.warn('[Auth] Session restoration failed:', err.message);
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const data = await authApi.login(credentials);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || 'Login failed.');
      throw err;
    }
  }, []);

  const register = useCallback(async (formData) => {
    setError(null);
    try {
      const data = await authApi.register(formData);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || 'Registration failed.');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('[Auth] Logout warning:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      return data.user;
    } catch (err) {
      setUser(null);
      throw err;
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
