import React, { memo } from 'react';
import { Skeleton, SkeletonCard, SkeletonText } from './Skeleton';
import './Skeleton.css';

export const FeaturesSkeleton = memo(function FeaturesSkeleton() {
  return (
    <div className="container section-spacing" aria-label="Loading features...">
      <div className="section-header" style={{ alignItems: 'center' }}>
        <Skeleton variant="rounded" width="160px" height="28px" borderRadius="9999px" />
        <Skeleton variant="text" width="65%" height="2.5rem" style={{ margin: '0.75rem auto' }} />
        <Skeleton variant="text" width="45%" height="1.2rem" style={{ margin: '0 auto' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
        <SkeletonCard height="320px" />
        <SkeletonCard height="320px" />
        <SkeletonCard height="320px" />
      </div>
    </div>
  );
});
