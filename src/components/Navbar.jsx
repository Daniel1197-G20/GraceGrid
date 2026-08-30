import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import Logo from './Logo';
import Button from './Button';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import './Navbar.css';

export const Navbar = memo(function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 25);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleNavClick = useCallback((e, targetId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const navLinks = useMemo(() => [
    { id: 'hero', label: 'Home' },
    { id: 'community', label: 'Community' },
    { id: 'features', label: 'Features' },
    { id: 'about', label: 'About' },
    { id: 'waitlist', label: 'Waitlist' }
  ], []);

  return (
    <header className={`navbar-header ${isScrolled ? 'navbar-scrolled' : 'navbar-transparent'}`} role="banner">
      <div className="navbar-container">
        {/* Brand Logo */}
        <a 
          href="#hero" 
          onClick={(e) => handleNavClick(e, 'hero')} 
          className="navbar-logo-link" 
          aria-label="GraceGrid Home"
        >
          <Logo size="md" showBadge={true} inverted={true} />
        </a>

        {/* Desktop Navigation */}
        <nav className="navbar-desktop-nav" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => handleNavClick(e, link.id)}
              className="nav-link"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA */}
        <div className="navbar-cta-group">
          <Button
            href="#waitlist"
            onClick={(e) => handleNavClick(e, 'waitlist')}
            variant="primary"
            size="sm"
            rightIcon={<ArrowRight size={14} />}
            className="navbar-btn-cta"
            ariaLabel="Join the waitlist"
          >
            Join Waitlist
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div 
        id="mobile-navigation-drawer"
        className={`navbar-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`} 
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mobile-drawer-inner">
          <nav className="mobile-nav-links" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleNavClick(e, link.id)}
                className="mobile-nav-link"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mobile-drawer-footer">
            <Button
              href="#waitlist"
              onClick={(e) => handleNavClick(e, 'waitlist')}
              variant="primary"
              size="md"
              fullWidth={true}
              rightIcon={<Sparkles size={16} />}
              ariaLabel="Get early access"
            >
              Get Early Access
            </Button>
            <p className="mobile-drawer-slogan">Faith. Fellowship. Feed.</p>
          </div>
        </div>
      </div>
    </header>
  );
});

export default Navbar;
