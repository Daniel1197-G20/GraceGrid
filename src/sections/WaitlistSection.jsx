import React, { useState, useMemo, useCallback, memo } from 'react';
import confetti from 'canvas-confetti';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { LeafPattern, GlowingCrossSilhouette } from '../components/DecorativeAssets';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  Share2, 
  Mail, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  MessageCircle, 
  ExternalLink, 
  Lock,
  AlertCircle
} from 'lucide-react';
import './WaitlistSection.css';

export const WaitlistSection = memo(function WaitlistSection({ onShowToast, onSubmitWaitlist }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'believer'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [queueNumber, setQueueNumber] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  const roles = useMemo(() => [
    { id: 'believer', label: 'Believer / Disciple' },
    { id: 'leader', label: 'Pastor / Minister' },
    { id: 'group', label: 'Small Group Leader' },
    { id: 'student', label: 'Student / Youth' }
  ], []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter your full name.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address (e.g., name@domain.com).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    setErrors((prev) => {
      if (prev[field]) {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      }
      return prev;
    });

    if (generalError) setGeneralError('');
  }, [generalError]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setGeneralError('');

    const targetName = formData.fullName.trim();
    const targetEmail = formData.email.trim();
    const targetRole = formData.role;
    const generatedQueue = Math.floor(5120 + Math.random() * 260);

    try {
      if (onSubmitWaitlist) {
        await onSubmitWaitlist({
          fullName: targetName,
          email: targetEmail,
          role: targetRole,
          timestamp: new Date().toISOString()
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 650));
      }

      setQueueNumber(generatedQueue);
      setIsSubmitting(false);
      setIsSubmitted(true);

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#16A34A', '#22C55E', '#D4AF37', '#FEF08A', '#052E16']
        });
      } catch (err) {}

      if (onShowToast) {
        onShowToast(`Welcome to GraceGrid, ${targetName.split(' ')[0]}! You are spot #${generatedQueue}.`);
      }
    } catch (err) {
      setIsSubmitting(false);
      setIsSubmitted(false);
      setGeneralError(err.message || 'We could not reserve your spot right now. Please check your connection and try again.');
    }
  }, [formData, validateForm, onSubmitWaitlist, onShowToast]);

  const handleCopyInviteLink = useCallback(() => {
    const inviteUrl = `${window.location.origin}/?ref=${encodeURIComponent(formData.fullName.replace(/\s+/g, '').toLowerCase() || 'early')}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedLink(true);
      if (onShowToast) {
        onShowToast('Personal invite link copied to clipboard!');
      }
      setTimeout(() => setCopiedLink(false), 3000);
    }).catch(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  }, [formData.fullName, onShowToast]);

  const handleResetForm = useCallback(() => {
    setIsSubmitted(false);
    setFormData({
      fullName: '',
      email: '',
      role: 'believer'
    });
    setErrors({});
    setGeneralError('');
  }, []);

  return (
    <section 
      id="waitlist" 
      ref={sectionRef} 
      className="cinematic-waitlist-section"
      aria-label="Be the First to Know — GraceGrid Waitlist"
    >
      {/* Background Cinematic Wallpaper: Rolling Green Hills */}
      <div className="waitlist-wallpaper-media" aria-hidden="true">
        <img 
          src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1920&auto=format&fit=crop&q=80" 
          alt="Rolling green hills with morning mist" 
          className="waitlist-wallpaper-img"
          loading="lazy"
          decoding="async"
          width="1920"
          height="1080"
        />
        <div className="waitlist-forest-gradient" />
        <div className="waitlist-vignette" />
        <GlowingCrossSilhouette />
      </div>

      <LeafPattern position="top-right" opacity={0.2} size={150} />
      <LeafPattern position="bottom-left" opacity={0.2} size={150} />

      <div className={`container container-narrow waitlist-content-container ${isVisible ? 'animate-fade-in-up' : ''}`}>
        {/* Header: "Be the First to Know" */}
        <div className="waitlist-header-group">
          <Badge variant="gold" pulse={true} className="waitlist-pill">
            Pre-Launch Waitlist
          </Badge>
          <h2 className="display-hero waitlist-headline">
            Be the First to Know
          </h2>
          <p className="lead-text-white waitlist-subheading">
            Join 5,000+ believers and 120+ churches stepping into a peaceful, Christ-centered digital community.
          </p>
        </div>

        {/* Floating Glass Container - Single Dedicated Form */}
        <div className="floating-glass-container glass-card-frosted">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="cinematic-waitlist-form" noValidate>
              {generalError && (
                <div className="waitlist-general-error" role="alert">
                  <AlertCircle size={16} />
                  <span>{generalError}</span>
                </div>
              )}

              <div className="form-fields-grid">
                {/* Full Name Field */}
                <div className="field-group">
                  <label htmlFor="finalFullName" className="cinematic-field-label">
                    Full Name <span className="req-star">*</span>
                  </label>
                  <div className={`cinematic-input-box ${errors.fullName ? 'has-error' : ''}`}>
                    <User size={18} className="field-icon" aria-hidden="true" />
                    <input
                      id="finalFullName"
                      type="text"
                      placeholder="e.g. David Sterling"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="cinematic-input"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(errors.fullName)}
                      aria-describedby={errors.fullName ? 'finalFullName-error' : undefined}
                      required
                    />
                  </div>
                  {errors.fullName && (
                    <p id="finalFullName-error" className="field-error-text" role="alert">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div className="field-group">
                  <label htmlFor="finalEmail" className="cinematic-field-label">
                    Email Address <span className="req-star">*</span>
                  </label>
                  <div className={`cinematic-input-box ${errors.email ? 'has-error' : ''}`}>
                    <Mail size={18} className="field-icon" aria-hidden="true" />
                    <input
                      id="finalEmail"
                      type="email"
                      placeholder="david@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="cinematic-input"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'finalEmail-error' : undefined}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p id="finalEmail-error" className="field-error-text" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Role Selector */}
              <div className="field-group">
                <label className="cinematic-field-label">
                  Your Primary Community Role:
                </label>
                <div className="cinematic-roles-grid" role="radiogroup" aria-label="Community role">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      role="radio"
                      aria-checked={formData.role === role.id}
                      className={`role-glass-pill ${formData.role === role.id ? 'selected' : ''}`}
                      onClick={() => handleInputChange('role', role.id)}
                      disabled={isSubmitting}
                    >
                      <span className="role-check-dot" aria-hidden="true" />
                      <span>{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="form-submit-row">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth={true}
                  loading={isSubmitting}
                  rightIcon={<ArrowRight size={18} />}
                  className="btn-join-waitlist"
                  ariaLabel="Join waitlist and get early access"
                >
                  {isSubmitting ? 'Joining Waitlist…' : 'Join Waitlist & Get Early Access'}
                </Button>

                {/* Privacy Guarantee */}
                <div className="cinematic-privacy-guarantee">
                  <Lock size={15} className="lock-icon" aria-hidden="true" />
                  <span>Your information is safe with us. We never sell your data or send spam.</span>
                </div>
              </div>
            </form>
          ) : (
            /* Success State */
            <div className="waitlist-success-display animate-scale-in" role="status" aria-live="polite">
              <div className="success-halo-icon" aria-hidden="true">
                <CheckCircle2 size={44} />
              </div>

              <span className="success-subheading">WELCOME TO THE BODY</span>
              <h3 className="success-main-title">You're On The Early Access List!</h3>

              <div className="queue-spot-banner">
                <span className="spot-title">YOUR PRIORITY SPOT IN LINE</span>
                <span className="spot-value">#{queueNumber?.toLocaleString() || '5,140'}</span>
                <span className="spot-confirmed">Confirmation recorded for {formData.email}</span>
              </div>

              <p className="success-paragraph">
                God bless you, <strong>{formData.fullName}</strong>. We are preparing a quiet, sacred space where fellowship and faith thrive together. Keep an eye on your inbox for early access.
              </p>

              {/* Referral Invite Link */}
              <div className="invite-box-card">
                <div className="invite-label">
                  <Share2 size={16} className="share-icon-green" aria-hidden="true" />
                  <span>Invite fellowship members to move up in line:</span>
                </div>

                <div className="invite-input-row">
                  <input 
                    type="text" 
                    readOnly 
                    value={`https://gracegrid.app/join?ref=${encodeURIComponent(formData.fullName.replace(/\s+/g, '').toLowerCase())}`} 
                    className="invite-readonly-input"
                    aria-label="Your personal referral invite link"
                  />
                  <Button 
                    variant={copiedLink ? "secondary" : "primary"} 
                    size="sm"
                    onClick={handleCopyInviteLink}
                    leftIcon={copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    ariaLabel={copiedLink ? "Link copied" : "Copy invite link"}
                  >
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>

                <div className="social-share-row">
                  <a 
                    href={`https://wa.me/?text=Join%20me%20on%20the%20GraceGrid%20early%20access%20waitlist!%20A%20Christian%20social%20platform%20for%20livestreaming,%20prayer,%20and%20fellowship:%20https://gracegrid.app`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-pill-link"
                    aria-label="Share waitlist invite to WhatsApp"
                  >
                    <MessageCircle size={14} aria-hidden="true" /> WhatsApp
                  </a>
                  <a 
                    href={`https://twitter.com/intent/tweet?text=Excited%20to%20join%20the%20waitlist%20for%20@GraceGridApp%20—%20Faith.%20Fellowship.%20Feed.%20https://gracegrid.app`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-pill-link"
                    aria-label="Share waitlist invite on X"
                  >
                    <ExternalLink size={14} aria-hidden="true" /> Share on X
                  </a>
                </div>
              </div>

              <button 
                type="button" 
                className="btn-link-reset"
                onClick={handleResetForm}
              >
                Register another email address
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

export default WaitlistSection;
