import React, { useState } from 'react';
import { 
  Radio, 
  Heart, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Send,
  Flame,
  ShieldCheck
} from 'lucide-react';
import './PhoneMockup.css';

export default function PhoneMockup() {
  const [activeTab, setActiveTab] = useState('stream');
  const [prayedCount, setPrayedCount] = useState(84);
  const [hasPrayed, setHasPrayed] = useState(false);
  const [reactions, setReactions] = useState(['🙏 Amen!', '🕊️ Glory', '❤️ Praying for you']);

  const handlePrayClick = () => {
    if (!hasPrayed) {
      setPrayedCount(prev => prev + 1);
      setHasPrayed(true);
      setReactions(prev => ['🙏 Prayed with you!', ...prev.slice(0, 3)]);
    } else {
      setPrayedCount(prev => prev - 1);
      setHasPrayed(false);
    }
  };

  return (
    <div className="mockup-container">
      {/* Ambient background glow behind device */}
      <div className="mockup-halo" aria-hidden="true" />

      {/* Floating Widget 1: Live Prayer Notification */}
      <div className="floating-widget widget-top-left animate-float">
        <div className="widget-icon emerald">
          <Heart size={18} />
        </div>
        <div className="widget-text">
          <p className="widget-title">Prayer Answered</p>
          <p className="widget-sub">48 believers prayed for Sarah</p>
        </div>
      </div>

      {/* Floating Widget 2: Scripture Highlight */}
      <div className="floating-widget widget-bottom-right animate-float-gentle">
        <div className="widget-icon gold">
          <Sparkles size={18} />
        </div>
        <div className="widget-text">
          <p className="widget-title">Daily Fellowship</p>
          <p className="widget-sub">"Encourage one another daily"</p>
        </div>
      </div>

      {/* Floating Widget 3: Live Service */}
      <div className="floating-widget widget-top-right animate-float">
        <div className="widget-icon dark">
          <Radio size={18} className="pulse-icon" />
        </div>
        <div className="widget-text">
          <p className="widget-title">Grace Chapel Live</p>
          <p className="widget-sub">3,820 tuning in</p>
        </div>
      </div>

      {/* iPhone Device Shell */}
      <div className="phone-device-frame">
        {/* Titanium Outer Edge */}
        <div className="phone-bezel">
          {/* Dynamic Island / Speaker */}
          <div className="phone-island">
            <div className="island-camera" />
            <div className="island-sensor" />
          </div>

          {/* Screen Content */}
          <div className="phone-screen">
            {/* Status Bar */}
            <div className="phone-status-bar">
              <span className="status-time">9:41</span>
              <div className="status-icons">
                <span className="status-signal">●●●●</span>
                <span className="status-wifi">5G</span>
                <span className="status-battery">100%</span>
              </div>
            </div>

            {/* App Header */}
            <div className="app-header">
              <div className="app-brand">
                <div className="app-mini-logo">G</div>
                <div>
                  <div className="app-title">GraceGrid</div>
                  <div className="app-sub">Grace Fellowship • Live</div>
                </div>
              </div>
              <div className="app-avatar-badge">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" 
                  alt="User avatar" 
                  className="mockup-avatar" 
                />
                <span className="online-indicator" />
              </div>
            </div>

            {/* Screen View Mode Switcher */}
            <div className="phone-tab-nav" role="tablist" aria-label="Mockup Screen Modes">
              <button 
                type="button"
                className={`phone-tab-btn ${activeTab === 'stream' ? 'active' : ''}`}
                onClick={() => setActiveTab('stream')}
              >
                <Radio size={12} />
                <span>Stream</span>
              </button>
              <button 
                type="button"
                className={`phone-tab-btn ${activeTab === 'prayer' ? 'active' : ''}`}
                onClick={() => setActiveTab('prayer')}
              >
                <Heart size={12} />
                <span>Prayer</span>
              </button>
              <button 
                type="button"
                className={`phone-tab-btn ${activeTab === 'bible' ? 'active' : ''}`}
                onClick={() => setActiveTab('bible')}
              >
                <BookOpen size={12} />
                <span>Bible</span>
              </button>
              <button 
                type="button"
                className={`phone-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <FileText size={12} />
                <span>Notes</span>
              </button>
            </div>

            {/* Tab 1: Live Streaming Feed View */}
            {activeTab === 'stream' && (
              <div className="mockup-screen-view animate-fade-in">
                <div className="stream-video-card">
                  <div className="stream-badge-live">
                    <span className="live-pulse" /> LIVE • 4.2k
                  </div>
                  <div className="stream-content-overlay">
                    <span className="stream-category">SUNDAY WORSHIP</span>
                    <h4 className="stream-title">Walking in Unshakeable Grace</h4>
                    <p className="stream-speaker">Pastor Marcus Vance</p>
                  </div>
                  {/* Floating hearts animation */}
                  <div className="floating-reactions">
                    <span className="reaction-bubble r1">🙏</span>
                    <span className="reaction-bubble r2">🕊️</span>
                    <span className="reaction-bubble r3">❤️</span>
                  </div>
                </div>

                <div className="stream-chat-preview">
                  <div className="chat-pill">
                    <span className="chat-user">Daniel K:</span>
                    <span className="chat-msg">"Amen! So timely!"</span>
                  </div>
                  <div className="chat-pill">
                    <span className="chat-user">Hannah M:</span>
                    <span className="chat-msg">"Praying together from London 🕊️"</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Prayer Wall View */}
            {activeTab === 'prayer' && (
              <div className="mockup-screen-view animate-fade-in">
                <div className="prayer-request-card">
                  <div className="prayer-header">
                    <div className="prayer-author">
                      <div className="prayer-avatar-initial">E</div>
                      <div>
                        <div className="prayer-name">Elena Rostova</div>
                        <div className="prayer-time">12 mins ago • Youth Group</div>
                      </div>
                    </div>
                    <span className="prayer-tag">Healing & Guidance</span>
                  </div>

                  <p className="prayer-body">
                    "Please join in prayer for my mother's upcoming surgery this Tuesday and for peace over our entire family."
                  </p>

                  <div className="prayer-actions">
                    <button 
                      type="button"
                      className={`btn-pray-action ${hasPrayed ? 'active' : ''}`}
                      onClick={handlePrayClick}
                    >
                      <Heart size={14} fill={hasPrayed ? '#16A34A' : 'none'} />
                      <span>{hasPrayed ? 'Prayed' : 'I Prayed'} ({prayedCount})</span>
                    </button>
                    <button type="button" className="btn-pray-share">
                      <Share2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="recent-activity-strip">
                  <Flame size={12} className="flame-icon" />
                  <span>34 believers prayed for this in the last hour</span>
                </div>
              </div>
            )}

            {/* Tab 3: Bible Reader View */}
            {activeTab === 'bible' && (
              <div className="mockup-screen-view animate-fade-in">
                <div className="bible-reader-card">
                  <div className="bible-header">
                    <span className="bible-ref">Hebrews 10:24-25</span>
                    <span className="bible-version">ESV</span>
                  </div>

                  <div className="bible-verses">
                    <p className="verse-line">
                      <span className="verse-num">24</span>
                      <span className="verse-highlight">
                        And let us consider how to stir up one another to love and good works,
                      </span>
                    </p>
                    <p className="verse-line">
                      <span className="verse-num">25</span>
                      not neglecting to meet together, as is the habit of some, but encouraging one another, and all the more as you see the Day drawing near.
                    </p>
                  </div>

                  <div className="bible-audio-bar">
                    <Volume2 size={14} className="audio-icon" />
                    <div className="audio-progress">
                      <div className="audio-fill" style={{ width: '45%' }} />
                    </div>
                    <span className="audio-time">02:14 / 04:30</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Sermon Notes View */}
            {activeTab === 'notes' && (
              <div className="mockup-screen-view animate-fade-in">
                <div className="notes-card">
                  <div className="notes-meta">
                    <span className="notes-date">Aug 30, 2026 • Live Sync</span>
                    <CheckCircle2 size={13} className="notes-saved" />
                  </div>
                  <h4 className="notes-title">Walking in Kingdom Purpose</h4>
                  <ul className="notes-bullets">
                    <li>1. Alignment precedes assignment (Proverbs 3:5-6)</li>
                    <li>2. Fellowship guards your spiritual vitality</li>
                    <li>3. Faith operates through sincere love</li>
                  </ul>
                  <div className="notes-scripture-tag">
                    <BookOpen size={11} />
                    <span>Auto-linked 3 verses to Bible reader</span>
                  </div>
                </div>
              </div>
            )}

            {/* Phone Bottom Navigation Bar */}
            <div className="phone-bottom-nav">
              <div className="bottom-nav-item active">
                <Radio size={16} />
                <span>Live</span>
              </div>
              <div className="bottom-nav-item">
                <Heart size={16} />
                <span>Prayer</span>
              </div>
              <div className="bottom-nav-item">
                <BookOpen size={16} />
                <span>Bible</span>
              </div>
              <div className="bottom-nav-item">
                <MessageSquare size={16} />
                <span>Fellowship</span>
              </div>
            </div>

            {/* iPhone Home Indicator */}
            <div className="phone-home-indicator" />
          </div>
        </div>
      </div>
    </div>
  );
}
