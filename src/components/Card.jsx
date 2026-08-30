import React, { memo } from 'react';
import './Card.css';

export const Card = memo(function Card({
  children,
  variant = 'default',
  hoverable = true,
  interactive = false,
  className = '',
  onClick,
  role,
  tabIndex,
  ...props
}) {
  const classes = [
    'custom-card',
    `card-${variant}`,
    hoverable ? 'card-hoverable' : '',
    interactive ? 'card-interactive' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classes} 
      onClick={onClick} 
      role={role || (interactive ? 'button' : undefined)}
      tabIndex={tabIndex || (interactive ? 0 : undefined)}
      {...props}
    >
      <div className="card-inner-glow" aria-hidden="true" />
      <div className="card-content-wrapper">
        {children}
      </div>
    </div>
  );
});

export default Card;
