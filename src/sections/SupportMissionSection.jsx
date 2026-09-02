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
  CheckCircle2,
  Mail,
  User,
  Loader2
} from 'lucide-react';
import { openPaystackInlineCheckout } from '../services/paystack';
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

  // Donor contact state (auto-prefilled from waitlist if user previously joined)
  const [donorEmail, setDonorEmail] = useState(() => {
    try {
      return localStorage.getItem('gracegrid_user_email') || '';
    } catch (_) {
      return '';
    }
  });
  const [donorName, setDonorName] = useState(() => {
    try {
      return localStorage.getItem('gracegrid_user_name') || '';
    } catch (_) {
      return '';
    }
  });
  const [emailError, setEmailError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  // Currency Formatter Helper
  const formatNaira = useCallback((val) => {
    return '₦' + Number(val).toLocaleString('en-NG');
  }, []);

  const effectiveAmount = customAmount !== '' ? Number(customAmount) : selectedAmount;

  // Paystack Public Key for inline modal & fallback payment URL
  const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
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

  const validateDonorEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleGiveSubmit = useCallback(async () => {
    if (!effectiveAmount || isNaN(effectiveAmount) || effectiveAmount <= 0) {
      if (onShowToast) onShowToast('Please select or enter a donation amount.', 'error');
      return;
    }

    if (!donorEmail.trim()) {
      setEmailError('Please enter your email address for your payment receipt.');
      if (onShowToast) onShowToast('Please provide your email address for your payment receipt.', 'info');
      const inputEl = document.getElementById('donor-giving-email');
      if (inputEl) inputEl.focus();
      return;
    }

    if (!validateDonorEmail(donorEmail)) {
      setEmailError('Please provide a valid email address (e.g., name@domain.com).');
      if (onShowToast) onShowToast('Please provide a valid email address.', 'error');
      const inputEl = document.getElementById('donor-giving-email');
      if (inputEl) inputEl.focus();
      return;
    }

    setEmailError('');

    // Persist for subsequent visits
    try {
      localStorage.setItem('gracegrid_user_email', donorEmail.trim());
      if (donorName.trim()) {
        localStorage.setItem('gracegrid_user_name', donorName.trim());
      }
    } catch (_) {}

    // 1. In-App Paystack Inline Modal (if public key is configured)
    if (paystackPublicKey && paystackPublicKey.trim() !== '') {
      setIsProcessing(true);
      if (onShowToast) {
        onShowToast(`Opening secure checkout for ${formatNaira(effectiveAmount)}...`, 'info');
      }

      try {
        await openPaystackInlineCheckout({
          publicKey: paystackPublicKey.trim(),
          email: donorEmail.trim(),
          amount: effectiveAmount,
          donorName: donorName.trim(),
          onSuccess: (response) => {
            setIsProcessing(false);
            setPaymentSuccess({
              reference: response.reference,
              amount: effectiveAmount,
              email: donorEmail.trim(),
              donorName: donorName.trim(),
            });

            // Trigger mobile-safe celebratory confetti
            const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (!isReduced) {
              import('canvas-confetti').then((confettiModule) => {
                const confettiFn = confettiModule.default || confettiModule;
                const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
                confettiFn({
                  particleCount: isMobile ? 40 : 80,
                  spread: isMobile ? 60 : 85,
                  origin: { y: 0.6 },
                  colors: ['#16A34A', '#22C55E', '#D4AF37', '#FEF08A', '#052E16']
                });
              }).catch(() => {});
            }

            if (onShowToast) {
              onShowToast(`Blessings! Your seed of ${formatNaira(effectiveAmount)} was received. Reference: ${response.reference}`, 'success');
            }
          },
          onClose: () => {
            setIsProcessing(false);
            if (onShowToast) {
              onShowToast('Giving session closed. You can complete your seed anytime.', 'info');
            }
          },
        });
      } catch (err) {
        setIsProcessing(false);
        console.error('Paystack Inline checkout error:', err);
        if (onShowToast) {
          onShowToast(`Notice: ${err.message}. Opening payment checkout page...`, 'error');
        }
        // Fallback to URL
        const sep = paystackUrl.includes('?') ? '&' : '?';
        const fallbackUrl = `${paystackUrl}${sep}amount=${effectiveAmount * 100}&email=${encodeURIComponent(donorEmail.trim())}`;
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      // 2. Fallback to Paystack Hosted Payment Page
      if (onShowToast) {
        onShowToast(`Opening checkout for ${formatNaira(effectiveAmount)}... (Tip: Add VITE_PAYSTACK_PUBLIC_KEY in .env for in-app popup modal)`, 'info');
      }
      const sep = paystackUrl.includes('?') ? '&' : '?';
      const targetUrl = `${paystackUrl}${sep}amount=${effectiveAmount * 100}&email=${encodeURIComponent(donorEmail.trim())}`;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  }, [effectiveAmount, donorEmail, donorName, paystackPublicKey, paystackUrl, formatNaira, onShowToast]);

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
            {paymentSuccess ? (
              <div className="giving-success-card animate-fade-in" role="alert">
                <div className="giving-success-badge">
                  <CheckCircle2 size={44} className="success-badge-icon" aria-hidden="true" />
                </div>
                <h3 className="giving-success-title">Thank You For Sowing Into GraceGrid!</h3>
                <p className="giving-success-desc">
                  Your seed of <strong>{formatNaira(paymentSuccess.amount)}</strong> has been received with deep gratitude and dedicated directly towards our technical launch milestones.
                </p>
                <div className="giving-receipt-box">
                  <div className="receipt-row">
                    <span className="receipt-k">Transaction Ref:</span>
                    <span className="receipt-v">{paymentSuccess.reference}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-k">Receipt Sent To:</span>
                    <span className="receipt-v">{paymentSuccess.email}</span>
                  </div>
                </div>
                <p className="giving-receipt-tip">
                  A comprehensive payment receipt has been dispatched to your email by Paystack.
                </p>
                <button
                  type="button"
                  onClick={() => setPaymentSuccess(null)}
                  className="btn-give-again"
                >
                  <Heart size={16} aria-hidden="true" />
                  <span>Sow Another Seed</span>
                </button>
              </div>
            ) : (
              <>
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

                {/* Donor Details for Receipt & In-App Checkout */}
                <div className="donor-fields-section">
                  <div className="donor-fields-grid">
                    <div className="donor-field-item">
                      <label htmlFor="donor-giving-email" className="donor-field-label">
                        Email Address <span className="req-star">*</span>
                      </label>
                      <div className={`donor-input-container ${emailError ? 'donor-input-has-error' : ''}`}>
                        <Mail size={16} className="donor-field-icon" aria-hidden="true" />
                        <input
                          id="donor-giving-email"
                          type="email"
                          autoComplete="email"
                          placeholder="your.email@example.com (for receipt)"
                          value={donorEmail}
                          onChange={(e) => {
                            setDonorEmail(e.target.value);
                            if (emailError) setEmailError('');
                          }}
                          className="donor-text-input"
                          aria-required="true"
                          aria-invalid={!!emailError}
                        />
                      </div>
                      {emailError && <span className="donor-error-hint">{emailError}</span>}
                    </div>

                    <div className="donor-field-item">
                      <label htmlFor="donor-giving-name" className="donor-field-label">
                        Your Name <span className="opt-tag">(Optional)</span>
                      </label>
                      <div className="donor-input-container">
                        <User size={16} className="donor-field-icon" aria-hidden="true" />
                        <input
                          id="donor-giving-name"
                          type="text"
                          autoComplete="name"
                          placeholder="Your name or anonymous"
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                          className="donor-text-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="giving-action-wrapper">
                  <button
                    type="button"
                    onClick={handleGiveSubmit}
                    disabled={isProcessing}
                    className={`btn-give-primary ${isProcessing ? 'btn-giving-loading' : ''}`}
                    aria-label={buttonLabel}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={18} className="btn-giving-spinner" aria-hidden="true" />
                        <span>Opening Secure Checkout...</span>
                      </>
                    ) : (
                      <>
                        <Heart size={18} className="btn-heart-give" aria-hidden="true" />
                        <span>{buttonLabel}</span>
                        <Lock size={16} className="btn-lock-icon" aria-hidden="true" />
                      </>
                    )}
                  </button>

                  <p className="giving-instant-caption">
                    <Lock size={12} aria-hidden="true" />
                    <span>In-app checkout opens directly on this page via Paystack — Card, Bank Transfer, USSD & Apple Pay accepted.</span>
                  </p>
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
              </>
            )}
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
