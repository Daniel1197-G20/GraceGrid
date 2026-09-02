import React, { useState, useEffect, useCallback, memo } from 'react';
import Button from './Button';
import { ArrowRight, Sparkles } from 'lucide-react';
import './FloatingMobileCTA.css';

export const FloatingMobileCTA = memo(function FloatingMobileCTA() {
  const [isPastHero, setIsPastHero] = useState(false);
  const [isWaitlistVisible, setIsWaitlistVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsPastHero(true);
      return;
    }

    // Observer for Hero leaving viewport
    const heroEl = document.getElementById('hero');
    let heroObserver;
    if (heroEl) {
      heroObserver = new IntersectionObserver(
        ([entry]) => {
          setIsPastHero(!entry.isIntersecting);
        },
        { threshold: 0.1, rootMargin: '-80px 0px 0px 0px' }
      );
      heroObserver.observe(heroEl);
    } else {
      setIsPastHero(true);
    }

    // Observer for Waitlist entering viewport
    const waitlistEl = document.getElementById('waitlist');
    let waitlistObserver;
    if (waitlistEl) {
      waitlistObserver = new IntersectionObserver(
        ([entry]) => {
          setIsWaitlistVisible(entry.isIntersecting);
        },
        { threshold: 0.05, rootMargin: '100px 0px 0px 0px' }
      );
      waitlistObserver.observe(waitlistEl);
    }

    return () => {
      if (heroObserver && heroEl) heroObserver.unobserve(heroEl);
      if (waitlistObserver && waitlistEl) waitlistObserver.unobserve(waitlistEl);
    };
  }, []);

  const handleScrollToWaitlist = useCallback((e) => {
    e.preventDefault();
    const waitlist = document.getElementById('waitlist');
    if (waitlist) {
      waitlist.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const isVisible = isPastHero && !isWaitlistVisible;

  if (!isVisible) return null;

  return (
    <aside className="floating-mobile-bar animate-fade-in-up" aria-label="Quick Access Waitlist">
      <div className="mobile-bar-inner">
        <div className="mobile-bar-text">
          <span className="bar-tag">BETA ACCESS</span>
          <span className="bar-title">5,000+ Believers Joined</span>
        </div>
        <Button
          href="#waitlist"
          onClick={handleScrollToWaitlist}
          variant="primary"
          size="md"
          className="mobile-bar-btn"
          rightIcon={<ArrowRight size={16} />}
        >
          Join Waitlist
        </Button>
      </div>
    </aside>
  );
});

export default FloatingMobileCTA;
