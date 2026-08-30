import React, { memo } from 'react';
import { Skeleton, SkeletonText } from './Skeleton';
import './Skeleton.css';

export const StatsSkeleton = memo(function StatsSkeleton() {
  return (
    <div className="container" style={{ margin: '-3.5rem auto 3rem auto', position: 'relative', zIndex: 10 }}>
      <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '2.5rem', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <Skeleton variant="circular" width="54px" height="54px" />
              <Skeleton variant="text" width="90px" height="2.5rem" />
              <Skeleton variant="text" width="140px" height="1.2rem" />
              <Skeleton variant="text" width="180px" height="0.9rem" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
