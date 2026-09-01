import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AdminAuthContext = createContext(null);

const STORAGE_KEY = 'gracegrid_admin_session';

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authProvider, setAuthProvider] = useState('none'); // 'supabase' | 'env' | 'none'

  // Read environment configured credentials with sensible defaults for MVP
  const configuredEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'gracegrid4@gmail.com').trim().toLowerCase();
  const configuredPassword = (import.meta.env.VITE_ADMIN_PASSWORD || 'gracegrid2026').trim();

  // Initialize session from Supabase Auth or Local/Session Storage
  useEffect(() => {
    let mounted = true;

    async function checkInitialAuth() {
      try {
        // 1. Check active Supabase Auth session if Supabase is configured
        if (isSupabaseConfigured) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (!sessionError && session?.user && mounted) {
            setIsAuthenticated(true);
            setAuthProvider('supabase');
            setAdminUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || 'GraceGrid Administrator',
              role: session.user.user_metadata?.role || 'Super Admin',
              authType: 'Supabase Auth',
              authenticatedAt: session.user.last_sign_in_at || new Date().toISOString(),
            });
            setIsLoading(false);
            return;
          }
        }

        // 2. Check stored session (for env or remembered sessions)
        const rawSession = 
          sessionStorage.getItem(STORAGE_KEY) || 
          localStorage.getItem(STORAGE_KEY);

        if (rawSession && mounted) {
          const session = JSON.parse(rawSession);
          if (session && session.expiresAt && Date.now() < session.expiresAt) {
            setIsAuthenticated(true);
            setAuthProvider(session.authProvider || 'env');
            setAdminUser({
              email: session.email || configuredEmail,
              name: session.name || 'GraceGrid Administrator',
              role: session.role || 'Super Admin',
              authType: session.authType || 'Environment MVP',
              authenticatedAt: session.authenticatedAt,
            });
          } else {
            sessionStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_KEY);
            setIsAuthenticated(false);
            setAdminUser(null);
          }
        }
      } catch (err) {
        console.warn('[GraceGrid Admin Auth] Error restoring session:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkInitialAuth();

    // 3. Listen to Supabase Auth state changes in real-time
    let authListener = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setIsAuthenticated(true);
          setAuthProvider('supabase');
          setAdminUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || 'GraceGrid Administrator',
            role: session.user.user_metadata?.role || 'Super Admin',
            authType: 'Supabase Auth',
            authenticatedAt: session.user.last_sign_in_at || new Date().toISOString(),
          });
        } else if (event === 'SIGNED_OUT') {
          // If signed out from Supabase, reset unless currently under an active env session
          const rawEnvSession = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
          if (!rawEnvSession) {
            setIsAuthenticated(false);
            setAdminUser(null);
            setAuthProvider('none');
          }
        }
      });
      authListener = data?.subscription;
    }

    return () => {
      mounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, [configuredEmail]);

  // Login action: Attempts Supabase Auth first, then falls back to configured env credentials
  const login = useCallback(async ({ email, password, remember = false }) => {
    const inputEmail = String(email || '').trim().toLowerCase();
    const inputPassword = String(password || '').trim();

    let supabaseAuthSuccess = false;
    let supabaseAuthError = null;

    // 1. Try Supabase Auth if client is configured
    if (isSupabaseConfigured && inputEmail.includes('@')) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: inputEmail,
          password: inputPassword,
        });

        if (!error && data?.user) {
          supabaseAuthSuccess = true;
          setIsAuthenticated(true);
          setAuthProvider('supabase');
          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || 'GraceGrid Administrator',
            role: data.user.user_metadata?.role || 'Super Admin',
            authType: 'Supabase Auth',
            authenticatedAt: new Date().toISOString(),
          };
          setAdminUser(userData);

          const sessionData = {
            ...userData,
            authProvider: 'supabase',
            expiresAt: Date.now() + (remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
          };

          if (remember) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
          } else {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
          }

          return { success: true, provider: 'supabase' };
        } else {
          supabaseAuthError = error;
        }
      } catch (err) {
        supabaseAuthError = err;
      }
    }

    // 2. Fallback: Check against configured environment credentials
    const isEnvEmailValid = inputEmail === configuredEmail || inputEmail === 'admin' || inputEmail === 'gracegrid4@gmail.com' || inputEmail === 'admin@gracegrid.app';
    const isEnvPasswordValid = inputPassword === configuredPassword;

    if (isEnvEmailValid && isEnvPasswordValid) {
      const sessionData = {
        email: inputEmail.includes('@') ? inputEmail : configuredEmail,
        name: 'GraceGrid Administrator',
        role: 'Super Admin',
        authType: 'Environment MVP',
        authProvider: 'env',
        authenticatedAt: new Date().toISOString(),
        expiresAt: Date.now() + (remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
      };

      if (remember) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        localStorage.removeItem(STORAGE_KEY);
      }

      setIsAuthenticated(true);
      setAuthProvider('env');
      setAdminUser({
        email: sessionData.email,
        name: sessionData.name,
        role: sessionData.role,
        authType: sessionData.authType,
        authenticatedAt: sessionData.authenticatedAt,
      });

      return { success: true, provider: 'env' };
    }

    // If both failed, throw error with helpful context
    if (supabaseAuthError && !isEnvPasswordValid) {
      throw new Error(supabaseAuthError.message || 'Invalid administrative credentials. Please verify your email and password.');
    }

    throw new Error('Invalid administrative credentials. Please verify your email and password.');
  }, [configuredEmail, configuredPassword]);

  // Logout action
  const logout = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[GraceGrid Admin Auth] Supabase signOut warning:', err);
    } finally {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      setIsAuthenticated(false);
      setAdminUser(null);
      setAuthProvider('none');
    }
  }, []);

  const value = {
    isAuthenticated,
    adminUser,
    isLoading,
    authProvider,
    isSupabaseConfigured,
    login,
    logout,
    configuredEmail,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

export function AdminProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#021C0D',
        color: '#F0FDF4',
        fontFamily: 'var(--font-heading, sans-serif)',
        gap: '1.25rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(34, 197, 94, 0.2)',
          borderTopColor: '#22C55E',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ fontSize: '0.95rem', color: '#86EFAC', letterSpacing: '0.05em' }}>
          Connecting to Sanctuary Admin...
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/gracegrid-admin" state={{ from: location }} replace />;
  }

  return children;
}

export default AdminAuthContext;
