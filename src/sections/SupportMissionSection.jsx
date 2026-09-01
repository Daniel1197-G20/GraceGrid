import React, { useState, useCallback, memo } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { LeafPattern } from '../components/DecorativeAssets';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  Building2, 
  UserCheck, 
  Heart, 
  Sparkles,
  Lock
} from 'lucide-react';
import './SupportMissionSection.css';

export const SupportMissionSection = memo(function SupportMissionSection({ onShowToast }) {
  const [copied, setCopied] = useState(false);
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.15 });

  const bankDetails = {
    bankName: 'PalmPay',
    accountName: 'PRAISE VICTOR EGBAUNU',
    accountNumber: '7084027105',
    formattedAccountNumber: '7084 027 105',
  };

  const handleCopyAccountNumber = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(bankDetails.accountNumber).then(() => {
        setCopied(true);
        if (onShowToast) {
          onShowToast('Account number copied to clipboard! Thank you for supporting the mission.', 'success');
        }
        setTimeout(() => setCopied(false), 3500);
      }).catch(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3500);
      });
    }
  }, [bankDetails.accountNumber, onShowToast]);

  return (
    <section 
      id="support" 
      ref={sectionRef} 
      className="support-mission-section"
      aria-label="Support the GraceGrid Mission"
    >
      <LeafPattern position="top-left" opacity={0.15} size={130} />
      <LeafPattern position="bottom-right" opacity={0.15} size={130} />

      <div className="container container-narrow">
        <div className={`support-glass-card glass-card-frosted ${isVisible ? 'animate-fade-in-up' : ''}`}>
          
          {/* Header */}
          <div className="support-card-header">
            <Badge variant="gold" pulse={true} className="support-pill">
              <Heart size={13} className="heart-icon-gold" aria-hidden="true" />
              <span>Kingdom Stewardship</span>
            </Badge>

            <h2 className="support-main-title">
              Help Build GraceGrid
            </h2>

            <p className="support-mission-statement">
              GraceGrid is an independent, faith-driven initiative dedicated to providing a peaceful, algorithm-free digital sanctuary for live worship, prayer circles, and biblical fellowship. Your seed support helps build robust server infrastructure, audio-video streaming, and keeps this sanctuary free and safe for the global body of Christ.
            </p>
          </div>

          {/* Direct Bank Transfer Box */}
          <div className="support-bank-card" role="region" aria-label="Official Bank Details">
            <div className="bank-card-badge-row">
              <span className="bank-transfer-type-tag">
                <Building2 size={14} aria-hidden="true" /> Direct Bank Transfer
              </span>
              <span className="currency-badge">NGN / International Wire</span>
            </div>

            <div className="bank-details-grid">
              {/* Bank Name */}
              <div className="bank-detail-item">
                <span className="bank-detail-label">Bank Name</span>
                <span className="bank-detail-value bank-name-text">
                  <Building2 size={16} className="detail-icon" aria-hidden="true" />
                  {bankDetails.bankName}
                </span>
              </div>

              {/* Account Name */}
              <div className="bank-detail-item">
                <span className="bank-detail-label">Account Name</span>
                <span className="bank-detail-value account-name-text">
                  <UserCheck size={16} className="detail-icon" aria-hidden="true" />
                  {bankDetails.accountName}
                </span>
              </div>
            </div>

            {/* Account Number Display */}
            <div className="account-number-hero-box">
              <div className="account-number-meta">
                <span className="account-number-label">Official Account Number</span>
                <div className="account-number-display" aria-label={`Account Number: ${bankDetails.accountNumber}`}>
                  {bankDetails.formattedAccountNumber}
                </div>
              </div>

              <Button
                variant={copied ? 'secondary' : 'primary'}
                size="md"
                onClick={handleCopyAccountNumber}
                leftIcon={copied ? <Check size={17} /> : <Copy size={17} />}
                className="btn-copy-account"
                ariaLabel={copied ? 'Account number copied' : 'Copy account number to clipboard'}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Account Number'}
              </Button>
            </div>

            {/* Security Guarantee with Shield Icon */}
            <div className="support-security-banner">
              <div className="shield-icon-halo" aria-hidden="true">
                <ShieldCheck size={20} className="shield-icon-green" />
              </div>
              <div className="security-text-group">
                <span className="security-title">Verified & Secure Bank Transfer</span>
                <span className="security-desc">
                  This is the official GraceGrid dedicated treasury account. All contributions are audited and directly allocated toward server infrastructure and technology development.
                </span>
              </div>
            </div>
          </div>

          {/* Scripture Benediction */}
          <div className="support-scripture-footer">
            <Sparkles size={16} className="sparkle-gold" aria-hidden="true" />
            <p className="scripture-verse">
              "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
            </p>
            <span className="scripture-ref">— 2 Corinthians 9:7</span>
          </div>

        </div>
      </div>
    </section>
  );
});

export default SupportMissionSection;
