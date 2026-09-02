import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import './styles/global.css';

// Lazy load admin context and pages for optimal bundle separation
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAuthProvider = lazy(() => import('./context/AdminAuthContext').then(m => ({ default: m.AdminAuthProvider })));
const AdminProtectedRoute = lazy(() => import('./context/AdminAuthContext').then(m => ({ default: m.AdminProtectedRoute })));

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
      <Routes>
        {/* Public GraceGrid Landing Page (Zero Admin Overhead) */}
        <Route path="/" element={<LandingPage />} />

        {/* Admin Portal Authentication */}
        <Route 
          path="/gracegrid-admin" 
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminAuthProvider>
                <AdminLogin />
              </AdminAuthProvider>
            </Suspense>
          } 
        />

        {/* Protected Admin Control Center */}
        <Route 
          path="/gracegrid-admin/dashboard" 
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminAuthProvider>
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              </AdminAuthProvider>
            </Suspense>
          } 
        />

        {/* Catch-all: Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

