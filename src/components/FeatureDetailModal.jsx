import React, { useEffect } from 'react';
import { X, Check, ArrowRight, Sparkles, Shield, Lock, Radio, Heart, MessageSquare, BookOpen, FileText } from 'lucide-react';
import Button from './Button';
import Badge from './Badge';
import './FeatureDetailModal.css';

export default function FeatureDetailModal({ feature, isOpen, onClose, onJoinWaitlist }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !feature) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          type="button" 
          className="modal-close-btn" 
          onClick={onClose}
          aria-label="Close feature details"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-icon-badge" style={{ backgroundColor: feature.badgeBg, color: feature.badgeColor }}>
            {feature.icon}
          </div>
          <div>
            <Badge variant="emerald" pulse={true}>{feature.pillText || 'Core Pillar'}</Badge>
            <h3 id="modal-title" className="modal-title">{feature.title}</h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <p className="modal-lead-description">{feature.longDescription || feature.description}</p>

          {/* Scripture Foundation */}
          {feature.scripture && (
            <div className="modal-scripture-box">
              <span className="scripture-icon">✝</span>
              <div>
                <p className="scripture-text">"{feature.scripture.text}"</p>
                <p className="scripture-ref">— {feature.scripture.reference}</p>
              </div>
            </div>
          )}

          {/* Key Feature Capabilities */}
          <div className="modal-capabilities">
            <h4 className="capabilities-heading">What makes this special:</h4>
            <ul className="capabilities-list">
              {feature.capabilities?.map((item, index) => (
                <li key={index} className="capability-item">
                  <div className="check-icon-circle">
                    <Check size={14} />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <Button variant="ghost" size="md" onClick={onClose}>
            Back
          </Button>
          <Button 
            variant="primary" 
            size="md" 
            rightIcon={<ArrowRight size={16} />}
            onClick={() => {
              onClose();
              if (onJoinWaitlist) onJoinWaitlist();
            }}
          >
            Join Waitlist for {feature.title}
          </Button>
        </div>
      </div>
    </div>
  );
}
