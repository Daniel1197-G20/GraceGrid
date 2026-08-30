import React, { useCallback, memo } from 'react';
import Logo from '../components/Logo';
import { LeafPattern } from '../components/DecorativeAssets';
import { Heart, Sparkles, Send, ShieldCheck } from 'lucide-react';
import './FooterSection.css';

export const FooterSection = memo(function FooterSection() {
  const scrollTo = useCallback((e, id) => {
    e.preventDefault();
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <footer className="cinematic-footer" role="contentinfo" aria-label="GraceGrid Footer">
      {/* Subtle Leaf Patterns in the Corners */}
      <LeafPattern position="top-right" opacity={0.15} size={160} />
      <LeafPattern position="bottom-left" opacity={0.15} size={160} />

      <div className="container footer-content-box">
        {/* Top Grid */}
        <div className="footer-columns-grid">
          {/* Col 1: Brand & Slogan */}
          <div className="footer-main-brand">
            <Logo size="md" inverted={true} />
            <p className="footer-brand-slogan">Faith. Fellowship. Feed.</p>
            <p className="footer-mission-text">
              A peaceful, cinematic Christian social platform engineered to deepen your walk with God, unite believers in sincere prayer, and empower the global church.
            </p>

            {/* Social Links: Instagram, X, YouTube, Facebook */}
            <div className="footer-social-icons-row" aria-label="Social Media Links">
              <a href="#instagram" className="footer-social-btn" aria-label="Visit GraceGrid on Instagram">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              <a href="#x" className="footer-social-btn" aria-label="Visit GraceGrid on X">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#youtube" className="footer-social-btn" aria-label="Visit GraceGrid on YouTube">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
                  <polygon points="10 15 15 12 10 9 10 15" fill="currentColor"/>
                </svg>
              </a>
              <a href="#facebook" className="footer-social-btn" aria-label="Visit GraceGrid on Facebook">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.648 0-2.955.986-2.955 2.871v1.1h4.084l-.545 3.667h-3.539v7.98h-4.858z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <nav className="footer-nav-col" aria-label="Platform Links">
            <h4 className="footer-title">Navigation</h4>
            <ul className="footer-nav-links">
              <li><a href="#hero" onClick={(e) => scrollTo(e, 'hero')}>Home</a></li>
              <li><a href="#community" onClick={(e) => scrollTo(e, 'community')}>Community</a></li>
              <li><a href="#features" onClick={(e) => scrollTo(e, 'features')}>All Features</a></li>
              <li><a href="#about" onClick={(e) => scrollTo(e, 'about')}>About Mission</a></li>
              <li><a href="#waitlist" onClick={(e) => scrollTo(e, 'waitlist')}>Join Waitlist</a></li>
            </ul>
          </nav>

          {/* Col 3: Core Features */}
          <nav className="footer-nav-col" aria-label="Feature Links">
            <h4 className="footer-title">Features</h4>
            <ul className="footer-nav-links">
              <li><a href="#features" onClick={(e) => scrollTo(e, 'features')}>Live Streaming</a></li>
              <li><a href="#features" onClick={(e) => scrollTo(e, 'features')}>Prayer Wall</a></li>
              <li><a href="#features" onClick={(e) => scrollTo(e, 'features')}>Private Messaging</a></li>
              <li><a href="#features" onClick={(e) => scrollTo(e, 'features')}>Sermon Notes</a></li>
              <li><a href="#features" onClick={(e) => scrollTo(e, 'features')}>Bible Reader</a></li>
            </ul>
          </nav>

          {/* Col 4: Daily Blessing */}
          <aside className="footer-nav-col footer-blessing-column" aria-label="Daily Scripture Blessing">
            <h4 className="footer-title">Daily Blessing</h4>
            <div className="footer-scripture-glass-card">
              <p className="blessing-scripture-text">
                “The grace of the Lord Jesus Christ and the love of God and the fellowship of the Holy Spirit be with you all.”
              </p>
              <span className="blessing-citation">2 Corinthians 13:14</span>
            </div>
          </aside>
        </div>

        {/* Bottom Copyright & Legal Links */}
        <div className="footer-legal-bar">
          <p className="footer-copy-text">
            © {new Date().getFullYear()} GraceGrid. Faith. Fellowship. Feed. All rights reserved.
          </p>
          <div className="footer-legal-links">
            <a href="#privacy" className="legal-link">Privacy Policy</a>
            <span className="legal-dot" aria-hidden="true">•</span>
            <a href="#terms" className="legal-link">Terms of Service</a>
            <span className="legal-dot" aria-hidden="true">•</span>
            <span>A Pre-Launch Initiative for the Global Church</span>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default FooterSection;
