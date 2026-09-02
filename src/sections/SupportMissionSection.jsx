import React, { useCallback, memo } from 'react';
import Badge from '../components/Badge';
import { LeafPattern } from '../components/DecorativeAssets';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { 
  ShieldCheck, 
  Heart, 
  Sparkles,
  ExternalLink,
  CreditCard,
  Building2,
  Zap,
  Lock
} from 'lucide-react';
import './SupportMissionSection.css';

export const SupportMissionSection = memo(function SupportMissionSection({ onShowToast }) {
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.15 });

  const paystackUrl = import.meta.env.VITE_PAYSTACK_PAYMENT_URL || 'https://paystack.com/pay/gracegrid';

  const handleGiveViaPaystack = useCallback(() => {
    if (onShowToast) {
      onShowToast('Redirecting to secure Paystack giving checkout...', 'info');
    }
  }, [onShowToast]);

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

          {/* Paystack Online Giving Box */}
          <div className="support-bank-card paystack-card" role="region" aria-label="Official Paystack Giving Channel">
            <div className="bank-card-badge-row">
              <span className="bank-transfer-type-tag paystack-tag">
                <ShieldCheck size={14} aria-hidden="true" /> Secured by Paystack
              </span>
              <span className="currency-badge">NGN · USD · International Cards</span>
            </div>

            <div className="paystack-cta-content">
              <div className="paystack-info-group">
                <h3 className="paystack-headline">Online Kingdom Giving</h3>
                <p className="paystack-subtext">
                  Give securely via debit/credit card, direct bank transfer, USSD, or Apple Pay. All contributions are audited and directly allocated toward server infrastructure, high-fidelity streaming, and sanctuary development.
                </p>
              </div>

              <div className="paystack-channels-row" aria-label="Supported payment channels">
                <span className="channel-pill">
                  <CreditCard size={13} aria-hidden="true" /> Cards
                </span>
                <span className="channel-pill">
                  <Building2 size={13} aria-hidden="true" /> Bank Transfer
                </span>
                <span className="channel-pill">
                  <Zap size={13} aria-hidden="true" /> USSD
                </span>
                <span className="channel-pill">
                  <Lock size={13} aria-hidden="true" /> 256-bit Encrypted
                </span>
              </div>

              <div className="paystack-action-hero">
                <a
                  href={paystackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleGiveViaPaystack}
                  className="btn-paystack-give"
                  aria-label="Give securely via Paystack"
                >
                  <Heart size={18} className="heart-give-icon" aria-hidden="true" />
                  <span>Give via Paystack</span>
                  <ExternalLink size={16} className="external-link-icon" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Security Guarantee with Shield Icon */}
            <div className="support-security-banner">
              <div className="shield-icon-halo" aria-hidden="true">
                <ShieldCheck size={20} className="shield-icon-green" />
              </div>
              <div className="security-text-group">
                <span className="security-title">Verified & PCI-DSS Level 1 Certified</span>
                <span className="security-desc">
                  Payments are processed directly by Paystack under banking-grade 256-bit SSL encryption. GraceGrid never stores your card details or financial information.
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
