import React, { memo } from 'react';
import './Logo.css';

export const Logo = memo(function Logo({ size = 'md', showBadge = false, inverted = false }) {
  const sizeClass = `logo-${size}`;
  const themeClass = inverted ? 'logo-inverted' : '';

  return (
    <div className={`gracegrid-logo ${sizeClass} ${themeClass}`}>
      <div className="logo-icon-wrapper" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none" className="logo-svg" aria-hidden="true">
          <defs>
            <linearGradient id="logoEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
            <linearGradient id="logoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D4AF37" />
            </linearGradient>
            <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#16A34A" floodOpacity="0.3" />
            </filter>
          </defs>
          
          <rect width="40" height="40" rx="10" className="logo-bg-rect" />
          <path d="M10 20H30M20 10V30" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="logo-grid-lines" />
          <rect x="18" y="8" width="4" height="24" rx="2" fill="url(#logoEmeraldGrad)" filter="url(#logoGlow)" />
          <rect x="10" y="15" width="20" height="4" rx="2" fill="url(#logoEmeraldGrad)" filter="url(#logoGlow)" />
          <circle cx="20" cy="17" r="2.8" fill="url(#logoGoldGrad)" />
        </svg>
      </div>

      <div className="logo-text-group">
        <span className="logo-brand-name">
          Grace<span className="logo-accent-text">Grid</span>
        </span>
        {showBadge && (
          <span className="logo-pill-badge">Pre-launch</span>
        )}
      </div>
    </div>
  );
});

export default Logo;
