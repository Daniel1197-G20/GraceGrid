import React, { useState, useMemo, useCallback, memo } from 'react';
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
  CheckCircle2,
  TrendingUp,
  Target
} from 'lucide-react';
import './SupportMissionSection.css';

// Two Transparent Campaign Targets
const DEFAULT_CAMPAIGN_TARGETS = [
  {
    id: 'domain',
    title: 'GraceGrid .com Domain',
    purpose: 'Global Web Domain',
    amount: 10000,
    raised: 6500, // Dynamic initial amount, can be updated via prop or live integration
    icon: Globe,
    badgeText: 'Milestone 1',
    description: 'Purchase the official permanent gracegrid.com domain and configure secure SSL encryption for worldwide fellowship access.',
  },
  {
    id: 'playstore',
    title: 'Google Play Store Release',
    purpose: 'Android Mobile Sanctuary',
    amount: 37000,
    raised: 14500, // Dynamic initial amount, can be updated via prop or live integration
    icon: Smartphone,
    badgeText: 'Milestone 2',
    description: 'Publish GraceGrid on the Google Play Store by funding the official Google Play Console developer license registration.',
  },
];

const TOTAL_CAMPAIGN_GOAL = 47000;

export const SupportMissionSection = memo(function SupportMissionSection({ 
  onShowToast,
  campaignTargets = DEFAULT_CAMPAIGN_TARGETS 
}) {
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.15 });

  // Dynamic campaign state
  const [campaigns] = useState(campaignTargets);

  // Automatic calculation of totals, percentages, and remaining amounts
  const { totalGoal, totalRaised, totalPercentage, totalRemaining, items } = useMemo(() => {
    const goal = TOTAL_CAMPAIGN_GOAL;
    const currentRaised = campaigns.reduce((sum, item) => sum + (Number(item.raised) || 0), 0);
    const percentage = Math.min(100, Math.round((currentRaised / goal) * 100));
    const remaining = Math.max(0, goal - currentRaised);

    const calculatedItems = campaigns.map((c) => {
      const itemRaised = Number(c.raised) || 0;
      const itemGoal = Number(c.amount) || 1;
      const itemPct = Math.min(100, Math.round((itemRaised / itemGoal) * 100));
      const itemRem = Math.max(0, itemGoal - itemRaised);

      return {
        ...c,
        calculatedRaised: itemRaised,
        percentage: itemPct,
        remaining: itemRem,
      };
    });

    return {
      totalGoal: goal,
      totalRaised: currentRaised,
      totalPercentage: percentage,
      totalRemaining: remaining,
      items: calculatedItems,
    };
  }, [campaigns]);

  // Currency Formatter Helper (Nigerian Naira)
  const formatNaira = useCallback((val) => {
    return '₦' + Number(val).toLocaleString('en-NG');
  }, []);

  // Payment gateway URLs
  const paystackUrl = import.meta.env.VITE_PAYSTACK_PAYMENT_URL || 'https://paystack.com/pay/gracegrid';
  const flutterwaveUrl = import.meta.env.VITE_FLUTTERWAVE_PAYMENT_URL || 'https://flutterwave.com/pay/gracegrid';

  const handlePaystackClick = useCallback(() => {
    if (onShowToast) {
      onShowToast('Opening secure Paystack giving gateway...', 'info');
    }
  }, [onShowToast]);

  const handleFlutterwaveClick = useCallback(() => {
    if (onShowToast) {
      onShowToast('Opening secure Flutterwave giving gateway...', 'info');
    }
  }, [onShowToast]);

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
              <span>Kingdom Crowdfunding</span>
            </Badge>

            <h2 className="support-main-title">
              Support GraceGrid
            </h2>

            <p className="support-tagline">
              Help us launch Faith. Fellowship. Feed.
            </p>

            <p className="support-mission-statement">
              GraceGrid is an independent, non-commercial digital sanctuary built for live worship, daily scripture feeds, and prayer circles. To launch this sanctuary freely to the global body of Christ, we are raising transparent seed support for our two immediate pre-launch infrastructure milestones.
            </p>
          </div>

          {/* Master Campaign Progress Box */}
          <div className="crowdfund-master-hero" role="region" aria-label="Crowdfunding Total Progress">
            <div className="master-hero-top">
              <div className="master-stat-group">
                <span className="master-stat-label">Total Campaign Goal</span>
                <div className="master-stat-value">
                  <span className="master-amount-goal">{formatNaira(totalGoal)}</span>
                </div>
              </div>

              <div className="master-progress-badge-group">
                <span className="master-badge-pill">
                  <TrendingUp size={14} aria-hidden="true" />
                  <span>{totalPercentage}% Funded</span>
                </span>
                <span className="master-sub-metric">
                  <strong>{formatNaira(totalRaised)}</strong> raised &bull; <strong>{formatNaira(totalRemaining)}</strong> remaining
                </span>
              </div>
            </div>

            {/* Master Progress Bar */}
            <div 
              className="master-progress-track"
              role="progressbar"
              aria-valuenow={totalPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Overall crowdfunding progress: ${totalPercentage}% funded`}
            >
              <div 
                className="master-progress-fill"
                style={{ width: `${totalPercentage}%` }}
              >
                <div className="master-progress-shimmer" />
              </div>
            </div>
          </div>

          {/* Two Campaign Cards Grid */}
          <div className="campaign-cards-grid" role="region" aria-label="Fundraising Targets">
            {items.map((item) => {
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

                  <div className="campaign-amount-box">
                    <div className="campaign-amount-row">
                      <span className="campaign-target-label">Target</span>
                      <span className="campaign-target-val">{formatNaira(item.amount)}</span>
                    </div>

                    <div className="campaign-mini-track" role="progressbar" aria-valuenow={item.percentage} aria-valuemin={0} aria-valuemax={100}>
                      <div 
                        className="campaign-mini-fill"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    <div className="campaign-progress-meta">
                      <span className="campaign-raised-text">
                        <strong>{formatNaira(item.calculatedRaised)}</strong> raised ({item.percentage}%)
                      </span>
                      <span className="campaign-remaining-text">
                        {item.remaining === 0 ? 'Goal Reached!' : `${formatNaira(item.remaining)} to go`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Options (Paystack & Flutterwave) */}
          <div className="payment-options-section" role="region" aria-label="Support Payment Options">
            <div className="payment-header-row">
              <span className="payment-section-title">
                <CreditCard size={16} aria-hidden="true" /> Select Your Giving Method
              </span>
              <span className="payment-security-pill">
                <Lock size={12} aria-hidden="true" /> 256-Bit SSL Encrypted
              </span>
            </div>

            <div className="payment-buttons-grid">
              {/* Paystack Primary Button */}
              <a
                href={paystackUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handlePaystackClick}
                className="btn-pay-option btn-paystack-primary"
                aria-label="Support GraceGrid using Paystack (Cards, Bank Transfer, USSD, Apple Pay)"
              >
                <div className="btn-pay-content">
                  <div className="btn-pay-lead">
                    <Heart size={18} className="btn-icon-gold" aria-hidden="true" />
                    <span className="btn-pay-name">Give with Paystack</span>
                  </div>
                  <span className="btn-pay-hint">Cards &bull; Bank Transfer &bull; USSD</span>
                </div>
                <ExternalLink size={16} className="btn-external-icon" aria-hidden="true" />
              </a>

              {/* Flutterwave Secondary Button */}
              <a
                href={flutterwaveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleFlutterwaveClick}
                className="btn-pay-option btn-flutterwave-secondary"
                aria-label="Support GraceGrid using Flutterwave (Debit Cards, Wire, Mobile Money)"
              >
                <div className="btn-pay-content">
                  <div className="btn-pay-lead">
                    <Zap size={18} className="btn-icon-amber" aria-hidden="true" />
                    <span className="btn-pay-name">Give with Flutterwave</span>
                  </div>
                  <span className="btn-pay-hint">Cards &bull; Mobile Money &bull; Transfer</span>
                </div>
                <ExternalLink size={16} className="btn-external-icon" aria-hidden="true" />
              </a>
            </div>

            <div className="payment-channels-row" aria-label="Accepted payment methods">
              <span className="channel-pill">
                <CreditCard size={13} aria-hidden="true" /> Visa &bull; Mastercard &bull; Verve
              </span>
              <span className="channel-pill">
                <Building2 size={13} aria-hidden="true" /> Direct Bank Transfer
              </span>
              <span className="channel-pill">
                <Zap size={13} aria-hidden="true" /> USSD &bull; QR
              </span>
              <span className="channel-pill">
                <Lock size={13} aria-hidden="true" /> PCI-DSS Certified
              </span>
            </div>
          </div>

          {/* Transparency: What your support funds */}
          <div className="transparency-breakdown-card" role="region" aria-label="What your support funds">
            <div className="transparency-header">
              <div className="transparency-title-lead">
                <ShieldCheck size={20} className="shield-icon-green" aria-hidden="true" />
                <h3 className="transparency-heading">What your support funds</h3>
              </div>
              <span className="transparency-pill">100% Transparent Stewardship</span>
            </div>

            <p className="transparency-intro">
              We operate with total kingdom transparency. Every single naira donated is audited and deployed directly to clear these two technical milestones:
            </p>

            <div className="transparency-items-list">
              {/* Item 1 */}
              <div className="transparency-item">
                <div className="transparency-item-main">
                  <span className="transparency-item-icon" aria-hidden="true">🌐</span>
                  <div className="transparency-item-details">
                    <span className="transparency-item-name">Domain (.com)</span>
                    <span className="transparency-item-desc">
                      Official permanent gracegrid.com domain registration and worldwide DNS routing.
                    </span>
                  </div>
                </div>
                <div className="transparency-item-cost">
                  <span className="cost-tag">₦10,000</span>
                </div>
              </div>

              {/* Item 2 */}
              <div className="transparency-item">
                <div className="transparency-item-main">
                  <span className="transparency-item-icon" aria-hidden="true">📱</span>
                  <div className="transparency-item-details">
                    <span className="transparency-item-name">Google Play Store Developer Account</span>
                    <span className="transparency-item-desc">
                      One-time Google Play Console developer registration ($25 USD) to publish the Android APK globally.
                    </span>
                  </div>
                </div>
                <div className="transparency-item-cost">
                  <span className="cost-tag">₦37,000</span>
                </div>
              </div>
            </div>

            <div className="transparency-guarantee">
              <CheckCircle2 size={16} className="guarantee-check-icon" aria-hidden="true" />
              <span>
                Zero administrative cuts or platform fees taken. 100% of proceeds go directly to these two milestone requirements.
              </span>
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
