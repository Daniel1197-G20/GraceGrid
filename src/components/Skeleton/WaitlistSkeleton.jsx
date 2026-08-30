import React, { memo } from 'react';
import { Skeleton, SkeletonText } from './Skeleton';
import './Skeleton.css';

export const WaitlistSkeleton = memo(function WaitlistSkeleton() {
  return (
    <div className="container container-narrow section-spacing" aria-label="Loading waitlist section...">
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Skeleton variant="rounded" width="160px" height="28px" borderRadius="9999px" dark={true} style={{ marginBottom: '1rem' }} />
        <Skeleton variant="text" width="70%" height="3rem" dark={true} style={{ marginBottom: '1rem' }} />
        <Skeleton variant="text" width="50%" height="1.2rem" dark={true} />
      </div>

      <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '32px', padding: '3rem', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <Skeleton variant="rounded" height="50px" borderRadius="12px" />
          <Skeleton variant="rounded" height="50px" borderRadius="12px" />
        </div>
        <Skeleton variant="rounded" height="80px" borderRadius="12px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton variant="rounded" height="52px" borderRadius="9999px" />
      </div>
    </div>
  );
});
