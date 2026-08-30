import React from 'react';
import './DecorativeAssets.css';

/* Minimal Decorative Leaf SVG for subtle corner botanical accents */
export function LeafPattern({ position = 'top-right', opacity = 0.15, size = 120 }) {
  return (
    <div className={`leaf-decoration leaf-${position}`} style={{ width: size, height: size, opacity }} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 90C10 90 20 50 50 30C80 10 90 10 90 10C90 10 90 20 70 50C50 80 10 90 10 90Z" fill="currentColor" />
        <path d="M25 75C25 75 45 45 75 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M40 55C48 48 55 46 55 46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M52 42C60 36 67 35 67 35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M30 68C38 62 44 61 44 61" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* Minimal Mountain & Glowing Cross Backdrop Silhouette */
export function GlowingCrossSilhouette() {
  return (
    <div className="glowing-cross-container" aria-hidden="true">
      <div className="cross-god-rays" />
      <div className="cross-beam vertical" />
      <div className="cross-beam horizontal" />
      <div className="cross-radiance-glow" />
    </div>
  );
}

/* Curved Wave Section Divider for blending between cinematic wallpapers and clean sections */
export function CurvedWaveDivider({ position = 'bottom', fillColor = '#F8FAFC', flip = false }) {
  return (
    <div className={`section-divider-curve divider-${position} ${flip ? 'flipped' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M0,40 C320,100 480,10 720,50 C960,90 1120,20 1440,60 L1440,100 L0,100 Z" 
          fill={fillColor} 
        />
      </svg>
    </div>
  );
}
