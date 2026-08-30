import React, { memo } from 'react';
import { Skeleton, SkeletonText } from './Skeleton';
import './Skeleton.css';

export const AboutSkeleton = memo(function AboutSkeleton() {
  return (
    <div className="container section-spacing" aria-label="Loading about section...">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
        <div>
          <Skeleton variant="rounded" width="140px" height="26px" borderRadius="9999px" style={{ marginBottom: '1.25rem' }} />
          <Skeleton variant="text" width="85%" height="2.5rem" style={{ marginBottom: '1.5rem' }} />
          <Skeleton variant="rounded" width="100%" height="120px" borderRadius="18px" style={{ marginBottom: '1.5rem' }} />
          <SkeletonText lines={4} gap="0.75rem" />
        </div>
        <div>
          <Skeleton variant="rounded" width="100%" height="480px" borderRadius="24px" />
        </div>
      </div>
    </div>
  );
});
