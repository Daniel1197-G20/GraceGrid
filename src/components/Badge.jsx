import React, { memo } from 'react';
import './Badge.css';

export const Badge = memo(function Badge({
  children,
  variant = 'emerald',
  pulse = false,
  icon,
  className = '',
  onClick,
  ...props
}) {
  const classes = [
    'badge-pill',
    `badge-${variant}`,
    pulse ? 'badge-has-pulse' : '',
    onClick ? 'badge-clickable' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classes} 
      onClick={onClick} 
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {pulse && (
        <span className="badge-pulse-wrapper" aria-hidden="true">
          <span className="badge-pulse-ring" />
          <span className="badge-pulse-dot" />
        </span>
      )}
      {icon && !pulse && <span className="badge-icon-left">{icon}</span>}
      <span className="badge-content">{children}</span>
    </div>
  );
});

export default Badge;
