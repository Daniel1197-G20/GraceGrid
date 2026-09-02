import React, { memo } from 'react';
import { Skeleton, SkeletonText } from './Skeleton';
import './Skeleton.css';

export const SupportSkeleton = memo(function SupportSkeleton() {
  return (
    <div className="container container-narrow section-spacing" aria-label="Loading support mission section...">
      <div style={{
        padding: '3rem',
        borderRadius: '32px',
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', textAlign: 'center' }}>
          <Skeleton variant="rounded" width="160px" height="28px" borderRadius="9999px" />
          <Skeleton variant="text" width="65%" height="2.5rem" />
          <Skeleton variant="text" width="80%" height="1.1rem" />
        </div>
        <div style={{
          background: '#F8FAFC',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Skeleton variant="rounded" height="60px" borderRadius="12px" />
            <Skeleton variant="rounded" height="60px" borderRadius="12px" />
          </div>
          <Skeleton variant="rounded" height="80px" borderRadius="16px" />
        </div>
      </div>
    </div>
  );
});

export default SupportSkeleton;
