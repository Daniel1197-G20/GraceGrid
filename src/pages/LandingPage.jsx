import React, { useState, lazy, Suspense, useCallback } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../sections/HeroSection';
import StatsSection from '../sections/StatsSection';
import WaitlistSection from '../sections/WaitlistSection';
import FloatingMobileCTA from '../components/FloatingMobileCTA';
import Toast from '../components/Toast';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';
import { FeaturesSkeleton } from '../components/Skeleton/FeaturesSkeleton';
import { AboutSkeleton } from '../components/Skeleton/AboutSkeleton';
import './LandingPage.css';

// Lazy load non-critical sections for performance and optimal initial chunk size
const FeaturesSection = lazy(() => import('../sections/FeaturesSection'));
const AboutSection = lazy(() => import('../sections/AboutSection'));
const FooterSection = lazy(() => import('../sections/FooterSection'));

export default function LandingPage() {
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  return (
    <div className="gracegrid-app">
      {/* Sticky Cinematic Navbar */}
      <Navbar />

      {/* Main Landing Surface */}
      <main id="main-content" role="main">
        {/* Above-the-fold Hero Introduction with 2 CTA Buttons */}
        <HeroSection />
        <StatsSection />

        {/* Lazy Loaded Features Section with Skeleton Fallback and Error Boundary */}
        <ErrorBoundary>
          <Suspense fallback={<FeaturesSkeleton />}>
            <FeaturesSection />
          </Suspense>
        </ErrorBoundary>

        {/* Lazy Loaded About Section with Skeleton Fallback and Error Boundary */}
        <ErrorBoundary>
          <Suspense fallback={<AboutSkeleton />}>
            <AboutSection />
          </Suspense>
        </ErrorBoundary>

        {/* Dedicated Single Waitlist Section: 'Be the First to Know' */}
        <ErrorBoundary>
          <WaitlistSection onShowToast={showToast} />
        </ErrorBoundary>
      </main>

      {/* Lazy Loaded Footer Section */}
      <ErrorBoundary>
        <Suspense fallback={<div style={{ height: '240px', background: '#052E16' }} />}>
          <FooterSection />
        </Suspense>
      </ErrorBoundary>

      {/* Floating CTA for Mobile Viewports */}
      <FloatingMobileCTA />

      {/* Global Notification Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
