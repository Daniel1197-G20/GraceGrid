import React, { memo } from 'react';
import { Skeleton } from './Skeleton';
import './Skeleton.css';

export const CommunityProgressSkeleton = memo(function CommunityProgressSkeleton() {
  return (
    <div className="container" style={{ position: 'relative', zIndex: 12, marginTop: '-3.5rem', marginBottom: '2.5rem' }} aria-label="Loading community progress...">
      <div style={{
        maxWidth: '880px',
        margin: '0 auto',
        padding: '2.5rem',
        borderRadius: '32px',
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
        boxShadow: '0 25px 60px -15px rgba(2, 28, 13, 0.1)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
          <Skeleton variant="rounded" width="120px" height="26px" borderRadius="9999px" />
          <Skeleton variant="text" width="60%" height="2.25rem" />
          <Skeleton variant="text" width="40%" height="1.1rem" />
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <Skeleton variant="text" width="140px" height="1rem" />
            <Skeleton variant="rounded" width="80px" height="22px" borderRadius="9999px" />
          </div>
          <Skeleton variant="rounded" width="100%" height="16px" borderRadius="9999px" />
        </div>
        <div style={{ height: '120px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton variant="rounded" width="100%" height="34px" borderRadius="9999px" />
          <Skeleton variant="rounded" width="100%" height="34px" borderRadius="9999px" />
        </div>
      </div>
    </div>
  );
});

export default CommunityProgressSkeleton;
