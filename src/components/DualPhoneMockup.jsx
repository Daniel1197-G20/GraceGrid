import React, { useState, memo, useCallback } from 'react';
import { 
  Radio, 
  Heart, 
  BookOpen, 
  MessageSquare, 
  Share2, 
  Sparkles, 
  Flame, 
  Users, 
  Send, 
  Volume2, 
  ShieldCheck,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import Tooltip from './Tooltip/Tooltip';
import './DualPhoneMockup.css';

export const DualPhoneMockup = memo(function DualPhoneMockup() {
  const [prayedCount, setPrayedCount] = useState(92);
  const [hasPrayed, setHasPrayed] = useState(false);
  const [floatingHeart, setFloatingHeart] = useState(false);

  const handlePrayClick = useCallback(() => {
    setHasPrayed((prev) => {
      const nextState = !prev;
      setPrayedCount((count) => nextState ? count + 1 : count - 1);
      if (nextState) {
        setFloatingHeart(true);
        setTimeout(() => setFloatingHeart(false), 2000);
      }
      return nextState;
    });
  }, []);

  return (
    <div className="dual-mockup-stage" aria-label="Interactive GraceGrid Mobile App Preview">
      {/* Background Spiritual Light Halo */}
      <div className="dual-mockup-halo" aria-hidden="true" />

      {/* Floating Pill Badge: Live Service Notification */}
      <div className="floating-badge badge-top-stream animate-float">
        <div className="stream-live-indicator">
          <span className="live-dot" />
        </div>
        <div>
          <p className="badge-title">Sunday Service Live</p>
          <p className="badge-subtitle">4,280 Believers Worshipping</p>
        </div>
      </div>

      {/* Floating Pill Badge: Prayer Answered */}
      <div className="floating-badge badge-bottom-prayer animate-float-gentle">
        <div className="prayer-answered-icon">
          <Sparkles size={16} />
        </div>
        <div>
          <p className="badge-title">Answered Prayer</p>
          <p className="badge-subtitle">Elena gave a Praise Report ✨</p>
        </div>
      </div>

      <div className="dual-phones-wrapper">
        {/* PHONE 1 (Back / Right): LIVE WORSHIP */}
        <div className="mockup-phone phone-live-worship">
          <div className="phone-outer-frame">
            <div className="phone-island">
              <div className="island-dot" />
            </div>

            <div className="phone-screen-content">
              {/* Status Bar */}
              <div className="phone-top-bar">
                <span>9:41</span>
                <div className="phone-icons">
                  <span>●●●●</span>
                  <span>5G</span>
                </div>
              </div>

              {/* App Mini Header */}
              <div className="mockup-app-header dark">
                <div className="mockup-logo-mini">G</div>
                <div className="mockup-header-title">
                  <span className="title-bold">GraceGrid Live</span>
                  <span className="title-sub">Grace Fellowship Church</span>
                </div>
                <span className="live-pill-tag">● LIVE</span>
              </div>

              {/* Live Video Feed Card */}
              <div className="stream-card-view">
                <div className="stream-video-bg">
                  <div className="stream-overlay-content">
                    <span className="worship-badge">GLOBAL WORSHIP NIGHT</span>
                    <h4 className="worship-song">“Holy Forever & Abide in Grace”</h4>
                    <p className="worship-leader">Pastor Marcus Vance & Team</p>
                  </div>

                  {/* Floating Live Reactions */}
                  <div className="stream-reactions-column" aria-hidden="true">
                    <span className="reaction-bubble r1">🙏</span>
                    <span className="reaction-bubble r2">🕊️</span>
                    <span className="reaction-bubble r3">❤️</span>
                  </div>
                </div>

                {/* Live Chat Ticker */}
                <div className="stream-live-chat" aria-label="Live Worship Chat Stream">
                  <div className="chat-bubble-row">
                    <span className="chat-avatar a1">J</span>
                    <div className="chat-text-box">
                      <span className="chat-name">Jonathan P.</span>
                      <span className="chat-msg">Lifting our hands in prayer from Chicago! 🙏</span>
                    </div>
                  </div>
                  <div className="chat-bubble-row">
                    <span className="chat-avatar a2">S</span>
                    <div className="chat-text-box">
                      <span className="chat-name">Sarah Jenkins</span>
                      <span className="chat-msg">Glory to God! The presence of God is here.</span>
                    </div>
                  </div>
                </div>

                {/* Live Interactive Action */}
                <div className="stream-bottom-action">
                  <Tooltip content="Send an encouraging Amen to the stream" position="top">
                    <div 
                      className="stream-amen-btn" 
                      role="button" 
                      tabIndex={0}
                      aria-label="Send Amen to the stream"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Heart size={14} fill="#EF4444" color="#EF4444" />
                      <span>Send Amen (1.8k)</span>
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PHONE 2 (Front / Left): PRAYER WALL */}
        <div className="mockup-phone phone-prayer-wall">
          <div className="phone-outer-frame">
            <div className="phone-island">
              <div className="island-dot" />
            </div>

            <div className="phone-screen-content">
              {/* Status Bar */}
              <div className="phone-top-bar">
                <span>9:41</span>
                <div className="phone-icons">
                  <span>●●●●</span>
                  <span>100%</span>
                </div>
              </div>

              {/* App Header */}
              <div className="mockup-app-header light">
                <div className="mockup-logo-mini emerald">G</div>
                <div className="mockup-header-title">
                  <span className="title-bold">Prayer Wall</span>
                  <span className="title-sub">Interceding for the Body</span>
                </div>
                <Bookmark size={16} className="header-action-icon" />
              </div>

              {/* Prayer Card */}
              <div className="prayer-feed-view">
                <div className="prayer-main-card">
                  <div className="prayer-card-header">
                    <div className="prayer-user-info">
                      <img 
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=52&auto=format&fit=crop&q=75&fm=webp" 
                        alt="Elena Rostova" 
                        className="prayer-avatar-img"
                        loading="lazy"
                        decoding="async"
                        width="26"
                        height="26"
                      />
                      <div>
                        <div className="prayer-author-name">Elena Rostova</div>
                        <div className="prayer-meta">10m ago • Youth & Campus</div>
                      </div>
                    </div>
                    <span className="prayer-category-pill">Healing & Peace</span>
                  </div>

                  <p className="prayer-quote">
                    “Please stand in agreement with me for my mother’s medical results tomorrow. Believing for complete restoration and God's supernatural peace over our home.”
                  </p>

                  <Tooltip content="Scripture automatically anchored to this prayer" position="top">
                    <div className="prayer-scripture-anchor">
                      <BookOpen size={12} />
                      <span>Jeremiah 17:14 — “Heal me, Lord, and I will be healed...”</span>
                    </div>
                  </Tooltip>

                  {/* Interactive Pray Button */}
                  <div className="prayer-card-footer">
                    <Tooltip content="Click to stand in agreement in prayer" position="top">
                      <button 
                        type="button"
                        className={`btn-pray-interaction ${hasPrayed ? 'has-prayed' : ''}`}
                        onClick={handlePrayClick}
                        aria-pressed={hasPrayed}
                        aria-label={`Pray for Elena's request. Current count: ${prayedCount}`}
                      >
                        <Heart size={14} fill={hasPrayed ? '#16A34A' : 'none'} />
                        <span>{hasPrayed ? 'Prayed With You' : 'I Prayed'} ({prayedCount})</span>
                        {floatingHeart && <span className="floating-pray-heart">🙏 +1</span>}
                      </button>
                    </Tooltip>
                    <button type="button" className="btn-pray-icon" aria-label="Share prayer request">
                      <Share2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Prayer Wall Activity */}
                <div className="prayer-activity-badge">
                  <Flame size={12} className="flame-gold" />
                  <span>34 believers praying right now</span>
                </div>
              </div>

              {/* Bottom Nav Bar */}
              <div className="mockup-bottom-nav">
                <div className="nav-tab">
                  <Radio size={14} />
                  <span>Live</span>
                </div>
                <div className="nav-tab active">
                  <Heart size={14} />
                  <span>Prayer</span>
                </div>
                <div className="nav-tab">
                  <BookOpen size={14} />
                  <span>Bible</span>
                </div>
                <div className="nav-tab">
                  <MessageSquare size={14} />
                  <span>Fellowship</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default DualPhoneMockup;
