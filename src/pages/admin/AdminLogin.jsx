import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import './AdminLogin.css';

export default function AdminLogin() {
  const { isAuthenticated, login, configuredEmail } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/gracegrid-admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your admin email or username.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your admin password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email, password, remember });
      const from = location.state?.from?.pathname || '/gracegrid-admin/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-surface">
      {/* Background Ambient Glows */}
      <div className="login-ambient-glow login-glow-1" />
      <div className="login-ambient-glow login-glow-2" />

      <div className="admin-login-container">
        
        {/* Navigation Back to Public Sanctuary */}
        <div className="login-top-nav">
          <Link to="/" className="back-sanctuary-link">
            <ArrowLeft size={16} />
            <span>Return to Public Sanctuary</span>
          </Link>
        </div>

        {/* Frosted Glass Login Card */}
        <div className="admin-login-card glass-card-dark">
          
          {/* Header & Emblem */}
          <div className="login-card-header">
            <div className="login-emblem-badge">
              <div className="emblem-inner-glow">
                <ShieldCheck size={28} className="shield-icon" />
              </div>
            </div>

            <div className="login-title-group">
              <div className="admin-pill-tag">
                <Sparkles size={13} className="gold-sparkle" />
                <span>Sanctuary Portal</span>
              </div>
              <h1 className="login-main-title">GraceGrid Admin</h1>
              <p className="login-subtitle">
                Enter your administrative credentials to manage waitlist registrations and cohort progress.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="login-error-banner" role="alert">
              <AlertCircle size={18} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
            
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="admin-email" className="form-label">
                Admin Email / Username
              </label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="field-icon" aria-hidden="true" />
                <input
                  id="admin-email"
                  type="text"
                  autoComplete="username"
                  placeholder={configuredEmail || "gracegrid4@gmail.com"}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="login-input"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="admin-password" className="form-label">
                  Admin Password
                </label>
              </div>
              <div className="input-icon-wrapper">
                <Lock size={18} className="field-icon" aria-hidden="true" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="login-input"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="form-options-row">
              <label className="remember-checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="custom-checkbox"
                />
                <span>Remember this session (7 days)</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="login-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="btn-spinner" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={18} className="submit-arrow" />
                </>
              )}
            </button>
          </form>

          {/* Security Guarantee Note */}
          <div className="login-footer-security">
            <CheckCircle2 size={15} className="green-check" />
            <span>Encrypted Session &bull; Row-Level Security Protected</span>
          </div>

        </div>

        {/* Quick Help / Default Credentials Note for Easy Access */}
        <div className="admin-help-box">
          <p className="admin-help-text">
            <span>Default Login:</span> <code>{configuredEmail}</code> / <code>gracegrid2026</code>
            <br />
            <span className="help-env-hint">(Configurable via <code>VITE_ADMIN_EMAIL</code> & <code>VITE_ADMIN_PASSWORD</code> in <code>.env.local</code>)</span>
          </p>
        </div>

      </div>
    </div>
  );
}
