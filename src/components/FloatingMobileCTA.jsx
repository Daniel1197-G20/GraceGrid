import React, { useState, useEffect, memo } from 'react';
import Button from './Button';
import { ArrowRight, Sparkles } from 'lucide-react';
import './FloatingMobileCTA.css';

export const FloatingMobileCTA = memo(function FloatingMobileCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const checkVisibility = () => {
      const scrollY = window.scrollY;
      const waitlistSection = document.getElementById('waitlist');
      
      let isNearWaitlist = false;
      if (waitlistSection) {
        const rect = waitlistSection.getBoundingClientRect();
        // If waitlist is visible on screen, hide floating CTA
        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
          isNearWaitlist = true;
        }
      }

      // Show after user scrolls down 400px, but hide if already at waitlist section
      if (scrollY > 400 && !isNearWaitlist) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(checkVisibility);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToWaitlist = (e) => {
    e.preventDefault();
    const waitlist = document.getElementById('waitlist');
    if (waitlist) {
      waitlist.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
