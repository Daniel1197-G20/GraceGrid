import React, { useState, lazy, Suspense, useCallback, useRef, useEffect, memo } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../sections/HeroSection';
import FloatingMobileCTA from '../components/FloatingMobileCTA';
import Toast from '../components/Toast';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';
import {
  FeaturesSkeleton,
  AboutSkeleton,
  StatsSkeleton,
  WaitlistSkeleton,
  CommunityProgressSkeleton,
  SupportSkeleton,
  FooterSkeleton
} from '../components/Skeleton';
import './LandingPage.css';

// Lazy load non-critical below-the-fold sections for low-end device performance
const CommunityProgressSection = lazy(() => import('../sections/CommunityProgressSection'));
const StatsSection = lazy(() => import('../sections/StatsSection'));
const FeaturesSection = lazy(() => import('../sections/FeaturesSection'));
const AboutSection = lazy(() => import('../sections/AboutSection'));
const SupportMissionSection = lazy(() => import('../sections/SupportMissionSection'));
const WaitlistSection = lazy(() => import('../sections/WaitlistSection'));
const FooterSection = lazy(() => import('../sections/FooterSection'));

export const LandingPage = memo(function LandingPage() {
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  const handleCloseToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(null);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="gracegrid-app">
      {/* Sticky Cinematic Navbar */}
      <Navbar />

      {/* Main Landing Surface */}
      <main id="main-content" role="main">
        {/* Above-the-fold Hero Introduction with 2 CTA Buttons */}
        <HeroSection />

        {/* Live Community Progress and Cohort Goal Target */}
        <ErrorBoundary>
          <Suspense fallback={<CommunityProgressSkeleton />}>
            <CommunityProgressSection />
          </Suspense>
        </ErrorBoundary>

        {/* Stats Metrics Section */}
        <ErrorBoundary>
          <Suspense fallback={<StatsSkeleton />}>
            <StatsSection />
          </Suspense>
        </ErrorBoundary>

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

        {/* Support the Mission: Direct Bank Transfer Donation */}
        <ErrorBoundary>
          <Suspense fallback={<SupportSkeleton />}>
            <SupportMissionSection onShowToast={showToast} />
          </Suspense>
        </ErrorBoundary>

        {/* Dedicated Single Waitlist Section: 'Be the First to Know' */}
        <ErrorBoundary>
          <Suspense fallback={<WaitlistSkeleton />}>
            <WaitlistSection onShowToast={showToast} />
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Lazy Loaded Footer Section */}
      <ErrorBoundary>
        <Suspense fallback={<FooterSkeleton />}>
          <FooterSection />
        </Suspense>
      </ErrorBoundary>

      {/* Floating CTA for Mobile Viewports */}
      <FloatingMobileCTA />

      {/* Global Notification Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type || 'success'}
          onClose={handleCloseToast}
        />
      )}
    </div>
  );
});

export default LandingPage;
