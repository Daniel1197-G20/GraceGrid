import React, { memo } from 'react';
import './Button.css';

export const Button = memo(function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  type = 'button',
  ariaLabel,
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    loading ? 'btn-loading' : '',
    className
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {loading ? (
        <span className="btn-spinner" aria-hidden="true" />
      ) : (
        leftIcon && <span className="btn-icon btn-icon-left">{leftIcon}</span>
      )}
      <span className="btn-text">{children}</span>
      {!loading && rightIcon && <span className="btn-icon btn-icon-right">{rightIcon}</span>}
      <span className="btn-shine" aria-hidden="true" />
    </>
  );

  if (href && !disabled && !loading) {
    return (
      <a 
        href={href} 
        className={classes} 
        aria-label={ariaLabel}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-label={ariaLabel}
      {...props}
    >
      {content}
    </button>
  );
});

export default Button;
