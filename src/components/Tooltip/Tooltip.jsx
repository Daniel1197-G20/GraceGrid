import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import './Tooltip.css';

export const Tooltip = memo(function Tooltip({
  content,
  children,
  position = 'top', // 'top' | 'bottom' | 'left' | 'right'
  delay = 150,
  className = '',
  disabled = false
}) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substring(2, 9)}`);

  const showTooltip = useCallback(() => {
    if (disabled || !content) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [disabled, content, delay]);

  const hideTooltip = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  const toggleTooltip = useCallback((e) => {
    // For touch devices
    if (disabled || !content) return;
    setIsVisible(prev => !prev);
  }, [disabled, content]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div
      className={`tooltip-wrapper ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onClick={toggleTooltip}
      aria-describedby={isVisible ? tooltipId.current : undefined}
    >
      {children}

      {isVisible && (
        <div
          id={tooltipId.current}
          role="tooltip"
          className={`tooltip-bubble tooltip-${position} animate-tooltip-fade`}
        >
          <div className="tooltip-inner-content">
            {content}
          </div>
          <div className="tooltip-arrow" aria-hidden="true" />
        </div>
      )}
    </div>
  );
});

export default Tooltip;
