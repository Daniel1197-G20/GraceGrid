import React, { memo, useCallback } from 'react';
import DualPhoneMockup from '../components/DualPhoneMockup';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { LeafPattern, GlowingCrossSilhouette } from '../components/DecorativeAssets';
import { 
  ArrowRight, 
  Play, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import './HeroSection.css';

export const HeroSection = memo(function HeroSection() {
  const scrollToWaitlist = useCallback((e) => {
    e.preventDefault();
    const waitlist = document.getElementById('waitlist');
    if (waitlist) {
      waitlist.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const scrollToLearnMore = useCallback((e) => {
    e.preventDefault();
    const features = document.getElementById('features');
    if (features) {
      features.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <section id="hero" className="cinematic-hero-section" aria-label="GraceGrid Introduction">
      {/* Full-width Cinematic Nature Wallpaper Media */}
      <div className="hero-wallpaper-media" aria-hidden="true">
        <img 
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&auto=format&fit=crop&q=80" 
          alt="Sunrise over majestic mountains with morning mist" 
          className="hero-wallpaper-img"
          fetchPriority="high"
          decoding="async"
          width="1920"
          height="1080"
        />
        {/* Dark Forest Green Gradient Overlays */}
        <div className="hero-forest-gradient" />
        <div className="hero-vignette-overlay" />
        <div className="hero-light-rays" />
        
        <GlowingCrossSilhouette />
      </div>

      {/* Decorative Minimal Botanical Leaves */}
      <LeafPattern position="top-right" opacity={0.18} size={150} />
      <LeafPattern position="top-left" opacity={0.12} size={130} />

      <div className="container hero-layout-container">
        {/* LEFT COLUMN: Headline, sanctuary description, two CTA buttons, social proof */}
        <div className="hero-left-content animate-fade-in-up">
          <Badge variant="gold" pulse={true} className="hero-pill-badge">
            A Christian Social Platform
          </Badge>

          <h1 className="hero-massive-headline">
            <span className="hero-word">Faith.</span>{' '}
            <span className="hero-word">Fellowship.</span>{' '}
            <span className="hero-word hero-word-accent">Feed.</span>
          </h1>

          <p className="hero-subdescription lead-text-white">
            GraceGrid is a faith-centered digital sanctuary where believers connect through live worship, shared prayer, Scripture meditation, and genuine Christ-centered fellowship.
          </p>

          {/* Two CTA Buttons Only */}
          <div className="hero-buttons-group">
            <Button
              href="#waitlist"
              onClick={scrollToWaitlist}
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight size={18} />}
              className="hero-btn-primary"
              ariaLabel="Join the waitlist"
            >
              Join the Waitlist
            </Button>
            <Button
              href="#features"
              onClick={scrollToLearnMore}
              variant="secondary"
              size="lg"
              leftIcon={<Play size={16} />}
              className="hero-btn-secondary"
              ariaLabel="Learn more about features"
            >
              Learn More
            </Button>
          </div>

          {/* Social Proof */}
          <div className="hero-social-proof">
            <div className="proof-avatars" aria-hidden="true">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" 
                alt="Believer member" 
                width="34"
                height="34"
                loading="lazy"
                decoding="async"
              />
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" 
                alt="Believer member" 
                width="34"
                height="34"
                loading="lazy"
                decoding="async"
              />
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80" 
                alt="Believer member" 
                width="34"
                height="34"
                loading="lazy"
                decoding="async"
              />
              <div className="proof-count">+5k</div>
            </div>
            <p className="proof-text">
              <strong>5,000+ Believers & 120+ Churches</strong> waiting for early access
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Dual Floating iPhone Mockups */}
        <div className="hero-right-mockups animate-fade-in">
          <DualPhoneMockup />
        </div>
      </div>

      {/* Floating Scroll Cue */}
      <a 
        href="#community" 
        onClick={scrollToLearnMore} 
        className="hero-scroll-cue" 
        aria-label="Scroll down to learn more"
      >
        <span>Discover Fellowship</span>
        <ChevronDown size={18} className="bounce-arrow" aria-hidden="true" />
      </a>
    </section>
  );
});

export default HeroSection;
