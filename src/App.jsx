import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { AdminAuthProvider, AdminProtectedRoute } from './context/AdminAuthContext';
import './styles/global.css';

// Lazy load admin pages for optimal bundle separation
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function AdminLoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#021C0D',
      color: '#86EFAC',
      fontFamily: 'var(--font-heading, sans-serif)',
      fontSize: '0.95rem'
    }}>
      Loading Sanctuary Admin...
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          {/* Public GraceGrid Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Admin Portal Authentication */}
          <Route 
            path="/gracegrid-admin" 
            element={
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminLogin />
              </Suspense>
            } 
          />

          {/* Protected Admin Control Center */}
          <Route 
            path="/gracegrid-admin/dashboard" 
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<AdminLoadingFallback />}>
                  <AdminDashboard />
                </Suspense>
              </AdminProtectedRoute>
            } 
          />

          {/* Catch-all: Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

