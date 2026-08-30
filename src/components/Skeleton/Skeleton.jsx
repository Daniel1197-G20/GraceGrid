import React, { memo } from 'react';
import './Skeleton.css';

export const Skeleton = memo(function Skeleton({
  variant = 'rectangular', // 'text', 'circular', 'rectangular', 'rounded'
  width,
  height,
  borderRadius,
  className = '',
  style = {},
  dark = false,
  ...props
}) {
  const customStyles = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1rem' : undefined),
    borderRadius: borderRadius || undefined,
    ...style
  };

  return (
    <div
      className={`skeleton-shimmer skeleton-${variant} ${dark ? 'skeleton-dark' : ''} ${className}`}
      style={customStyles}
      aria-hidden="true"
      {...props}
    />
  );
});

export const SkeletonText = memo(function SkeletonText({ lines = 3, gap = '0.5rem', lastLineWidth = '70%', dark = false }) {
  return (
    <div className="skeleton-text-group" style={{ gap }} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          dark={dark}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height="1rem"
        />
      ))}
    </div>
  );
});

export const SkeletonCard = memo(function SkeletonCard({ height = '320px', dark = false, className = '' }) {
  return (
    <div className={`skeleton-card-container ${dark ? 'dark' : ''} ${className}`} style={{ height }} aria-hidden="true">
      <div className="skeleton-card-top">
        <Skeleton variant="circular" width="52px" height="52px" dark={dark} />
        <Skeleton variant="rounded" width="80px" height="24px" dark={dark} />
      </div>
      <div className="skeleton-card-body">
        <Skeleton variant="text" width="60%" height="1.5rem" dark={dark} />
        <SkeletonText lines={3} dark={dark} />
      </div>
      <div className="skeleton-card-footer">
        <Skeleton variant="rounded" width="110px" height="20px" dark={dark} />
      </div>
    </div>
  );
});
