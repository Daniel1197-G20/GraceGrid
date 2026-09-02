import React, { memo } from 'react';
import './Skeleton.css';

export const FooterSkeleton = memo(function FooterSkeleton() {
  return (
    <footer 
      style={{ 
        height: '320px', 
        background: '#052E16', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'rgba(255, 255, 255, 0.4)',
        fontFamily: 'var(--font-heading, sans-serif)',
        fontSize: '0.875rem'
      }} 
      aria-label="Loading footer..."
    >
      <div style={{ textAlign: 'center' }}>
        <p style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.75rem', color: '#D4AF37' }}>
          GraceGrid Sanctuary
        </p>
        <p style={{ marginTop: '0.25rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          Faith. Fellowship. Feed.
        </p>
      </div>
    </footer>
  );
});

export default FooterSkeleton;
