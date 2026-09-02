import React, { useState, useCallback, memo } from 'react';
import Badge from '../components/Badge';
import { LeafPattern } from '../components/DecorativeAssets';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { 
  Globe, 
  Smartphone, 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink, 
  CreditCard, 
  Building2, 
  Zap, 
  Lock,
  CheckCircle2
} from 'lucide-react';
import './SupportMissionSection.css';

// Campaign Milestones (No attached amounts)
const CAMPAIGN_MILESTONES = [
  {
    id: 'domain',
    title: 'GraceGrid .com Domain',
    badgeText: 'Milestone 1',
    icon: Globe,
    description: 'Securing our permanent official gracegrid.com domain and dedicated SSL encryption for global fellowship, worship streaming, and community access.',
  },
  {
    id: 'playstore',
    title: 'Google Play Store Release',
    badgeText: 'Milestone 2',
    icon: Smartphone,
    description: 'Acquiring the Google Play Console developer license to publish and distribute the GraceGrid Android sanctuary app directly to believers worldwide.',
  },
];

// Preset gift amounts for standard giving app experience
const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000];

export const SupportMissionSection = memo(function SupportMissionSection({ onShowToast }) {
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.15 });

  // Giving amount state
  const [selectedAmount, setSelectedAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState('');

  // Currency Formatter Helper
  const formatNaira = useCallback((val) => {
    return '₦' + Number(val).toLocaleString('en-NG');
  }, []);

  const effectiveAmount = customAmount !== '' ? Number(customAmount) : selectedAmount;

  // Payment gateway URL (Paystack powered, without exposing processor branding)
  const paystackUrl = import.meta.env.VITE_PAYSTACK_PAYMENT_URL || 'https://paystack.com/pay/gracegrid';

  const handleSelectPreset = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(rawVal);
    if (rawVal !== '') {
      setSelectedAmount(null);
    }
  };

  const handleGiveSubmit = useCallback(() => {
    if (onShowToast) {
      const displayAmount = effectiveAmount && effectiveAmount > 0 ? formatNaira(effectiveAmount) : '';
      onShowToast(`Proceeding to secure checkout${displayAmount ? ` for ${displayAmount}` : ''}...`, 'info');
    }

    // Build URL with optional amount parameter
    let targetUrl = paystackUrl;
    if (effectiveAmount && effectiveAmount > 0) {
      const sep = paystackUrl.includes('?') ? '&' : '?';
      targetUrl = `${paystackUrl}${sep}amount=${effectiveAmount * 100}`;
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }, [paystackUrl, effectiveAmount, formatNaira, onShowToast]);

  const buttonLabel = effectiveAmount && !isNaN(effectiveAmount) && effectiveAmount > 0
    ? `Support GraceGrid (${formatNaira(effectiveAmount)})`
    : 'Support GraceGrid';

  return (
    <section 
      id="support" 
      ref={sectionRef} 
      className="support-mission-section"
      aria-label="Support GraceGrid Crowdfunding"
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
              Support GraceGrid
            </h2>

            <p className="support-tagline">
              Help us launch Faith. Fellowship. Feed.
            </p>

            <p className="support-mission-statement">
              GraceGrid is an independent, non-commercial digital sanctuary built for worship, daily scripture feeds, and biblical prayer circles. Your seed support clears our pre-launch milestones so we can make this sanctuary available to the global body of Christ.
            </p>
          </div>

          {/* Two Campaign Milestone Cards Grid (Without attached amounts) */}
          <div className="campaign-cards-grid" role="region" aria-label="Campaign Milestones">
            {CAMPAIGN_MILESTONES.map((item) => {
              const IconComponent = item.icon;
              return (
                <div key={item.id} className="campaign-target-card">
                  <div className="campaign-card-header">
                    <div className="campaign-icon-badge" aria-hidden="true">
                      <IconComponent size={22} className="campaign-icon" />
                    </div>
                    <div className="campaign-header-meta">
                      <span className="campaign-badge">{item.badgeText}</span>
                      <h3 className="campaign-title">{item.title}</h3>
                    </div>
                  </div>

                  <p className="campaign-description">
                    {item.description}
                  </p>

                  <div className="campaign-milestone-footer">
                    <span className="milestone-status-pill">
                      <CheckCircle2 size={13} aria-hidden="true" /> Launch Milestone
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Normal App Giving Box */}
          <div className="giving-checkout-box" role="region" aria-label="Make a Donation">
            <div className="giving-box-header">
              <div className="giving-header-lead">
                <Heart size={18} className="heart-icon-green" aria-hidden="true" />
                <span className="giving-header-title">Choose Your Seed Amount</span>
              </div>
              <span className="giving-secure-tag">
                <Lock size={12} aria-hidden="true" /> 256-Bit SSL Encrypted
              </span>
            </div>

            {/* Quick Amount Selector Chips */}
            <div className="amount-chips-grid" role="group" aria-label="Select giving amount">
              {PRESET_AMOUNTS.map((amt) => {
                const isSelected = selectedAmount === amt && customAmount === '';
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectPreset(amt)}
                    className={`amount-chip ${isSelected ? 'amount-chip-active' : ''}`}
                    aria-pressed={isSelected}
                  >
                    {formatNaira(amt)}
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Input */}
            <div className="custom-amount-row">
              <label htmlFor="custom-giving-input" className="custom-amount-label">
                Or enter custom amount:
              </label>
              <div className="custom-input-group">
                <span className="currency-prefix" aria-hidden="true">₦</span>
                <input
                  id="custom-giving-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="Other amount (e.g. 15000)"
                  value={customAmount}
                  onChange={handleCustomChange}
                  className="custom-amount-input"
                  aria-label="Enter custom giving amount in Naira"
                />
              </div>
            </div>

            {/* Primary Action Button (Without Paystack label) */}
            <div className="giving-action-wrapper">
              <button
                type="button"
                onClick={handleGiveSubmit}
                className="btn-give-primary"
                aria-label={buttonLabel}
              >
                <Heart size={18} className="btn-heart-give" aria-hidden="true" />
                <span>{buttonLabel}</span>
                <ExternalLink size={16} className="btn-ext-icon" aria-hidden="true" />
              </button>
            </div>

            {/* Supported Payment Channels */}
            <div className="payment-channels-row" aria-label="Accepted payment methods">
              <span className="channel-pill">
                <CreditCard size={13} aria-hidden="true" /> Debit / Credit Cards
              </span>
              <span className="channel-pill">
                <Building2 size={13} aria-hidden="true" /> Direct Bank Transfer
              </span>
              <span className="channel-pill">
                <Zap size={13} aria-hidden="true" /> USSD &bull; Apple Pay
              </span>
              <span className="channel-pill">
                <ShieldCheck size={13} aria-hidden="true" /> PCI-DSS Certified
              </span>
            </div>
          </div>

          {/* Transparency: What your support funds (Without price tags) */}
          <div className="transparency-breakdown-card" role="region" aria-label="What your support funds">
            <div className="transparency-header">
              <div className="transparency-title-lead">
                <ShieldCheck size={20} className="shield-icon-green" aria-hidden="true" />
                <h3 className="transparency-heading">What your support funds</h3>
              </div>
              <span className="transparency-pill">100% Transparent Stewardship</span>
            </div>

            <p className="transparency-intro">
              We operate with total kingdom transparency. Every gift is audited and channeled directly into our technical launch milestones:
            </p>

            <div className="transparency-items-list">
              {/* Item 1 */}
              <div className="transparency-item">
                <div className="transparency-item-main">
                  <span className="transparency-item-icon" aria-hidden="true">🌐</span>
                  <div className="transparency-item-details">
                    <span className="transparency-item-name">Official .com Web Domain</span>
                    <span className="transparency-item-desc">
                      Permanent web identity (gracegrid.com) and global HTTPS SSL routing for worldwide believers.
                    </span>
                  </div>
                </div>
                <div className="transparency-item-meta">
                  <span className="milestone-tag">Launch Milestone</span>
                </div>
              </div>

              {/* Item 2 */}
              <div className="transparency-item">
                <div className="transparency-item-main">
                  <span className="transparency-item-icon" aria-hidden="true">📱</span>
                  <div className="transparency-item-details">
                    <span className="transparency-item-name">Google Play Store Developer Account</span>
                    <span className="transparency-item-desc">
                      Google Play Console registration enabling immediate global download on Android devices.
                    </span>
                  </div>
                </div>
                <div className="transparency-item-meta">
                  <span className="milestone-tag">Launch Milestone</span>
                </div>
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
