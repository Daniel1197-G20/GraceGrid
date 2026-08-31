import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import Badge from '../components/Badge';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { 
  getWaitlistCount, 
  subscribeToWaitlistUpdates, 
  TARGET_WAITLIST_USERS, 
  DEFAULT_INITIAL_COUNT 
} from '../services/waitlist';
import { 
  Sparkles, 
  Users, 
  TrendingUp, 
  Flame, 
  Clock 
} from 'lucide-react';
import './CommunityProgressSection.css';

const DEFAULT_ACTIVITY_FEED = [
  { id: 'act-1', name: 'Sarah', city: 'Lagos', time: '1m ago' },
  { id: 'act-2', name: 'David', city: 'Abuja', time: '3m ago' },
  { id: 'act-3', name: 'Esther', city: 'Accra', time: '6m ago' },
  { id: 'act-4', name: 'Michael', city: 'Nairobi', time: '9m ago' },
  { id: 'act-5', name: 'Grace', city: 'Port Harcourt', time: '12m ago' },
  { id: 'act-6', name: 'Emmanuel', city: 'London', time: '15m ago' },
  { id: 'act-7', name: 'Deborah', city: 'Atlanta', time: '18m ago' },
  { id: 'act-8', name: 'Samuel', city: 'Houston', time: '24m ago' },
];

export const CommunityProgressSection = memo(function CommunityProgressSection() {
  const [target] = useState(TARGET_WAITLIST_USERS);
  const [joinedCount, setJoinedCount] = useState(DEFAULT_INITIAL_COUNT);
  const [activities, setActivities] = useState(DEFAULT_ACTIVITY_FEED);
  const [hasAnimated, setHasAnimated] = useState(false);
  const processedMembersRef = useRef(new Set());

  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.15 });

  // Fetch initial count from database and listen for real-time signups
  useEffect(() => {
    let isMounted = true;

    // Load initial count
    getWaitlistCount().then((count) => {
      if (isMounted && typeof count === 'number') {
        setJoinedCount(count);
      }
    });

    // Subscribe to live signups with deduplication to prevent double-counting
    const unsubscribe = subscribeToWaitlistUpdates((newMember) => {
      if (!isMounted || !newMember) return;

      // Extract unique identifier (ID or normalized email)
      const memberKey = 
        newMember.id || 
        (newMember.email ? String(newMember.email).toLowerCase().trim() : null) ||
        (newMember.fullName || newMember.full_name || null);

      if (memberKey) {
        if (processedMembersRef.current.has(memberKey)) {
          // Already counted from local submission or previous event
          return;
        }
        processedMembersRef.current.add(memberKey);
      }

      setJoinedCount((prev) => prev + 1);

      if (newMember?.fullName || newMember?.full_name) {
        const rawName = newMember.fullName || newMember.full_name;
        const firstName = String(rawName).trim().split(/\s+/)[0] || 'Believer';
        const newActivity = {
          id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: firstName,
          city: 'GraceGrid Fellowship',
          time: 'just now',
        };

        setActivities((prev) => [newActivity, ...prev.slice(0, 11)]);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Trigger smooth progress animation once visible
  useEffect(() => {
    if (isVisible && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isVisible, hasAnimated]);

  const remaining = useMemo(() => {
    return Math.max(0, target - joinedCount);
  }, [target, joinedCount]);

  const fillPercentage = useMemo(() => {
    const rawPct = (joinedCount / target) * 100;
    return Math.min(100, Math.max(0, Math.round(rawPct)));
  }, [joinedCount, target]);

  return (
    <section 
      id="community-progress" 
      ref={sectionRef} 
      className="community-progress-section"
      aria-label="Community Progress and Waitlist Target"
    >
      <div className="container">
        {/* Floating Premium Glassmorphism Card */}
        <div 
          className={`community-progress-card glass-card-frosted ${isVisible ? 'animate-fade-in-up' : ''}`}
        >
          {/* Card Header with Early Access Badge */}
          <div className="progress-card-header">
            <div className="badge-row">
              <Badge variant="emerald" pulse={true} className="early-access-badge">
                Early Access
              </Badge>
              <span className="live-pulse-tag">
                <span className="pulse-dot" aria-hidden="true" />
                <span className="pulse-text">Live Cohort Status</span>
              </span>
            </div>

            {/* Dynamic Large Heading: e.g. "27 of 50 believers have joined" */}
            <h2 className="progress-main-heading">
              <span className="highlight-number">{joinedCount}</span> of{' '}
              <span className="target-number">{target}</span> believers have joined
            </h2>

            {/* Dynamic Subtext: e.g. "Only 23 early access spots remaining." */}
            <p className="progress-subtext">
              <em>Only {remaining} early access spots remaining.</em>
            </p>
          </div>

          {/* Horizontal Animated Progress Bar */}
          <div className="progress-bar-container" role="region" aria-label="Waitlist Cohort Progress">
            <div className="progress-meta-row">
              <span className="progress-label-left">
                <TrendingUp size={15} className="meta-icon" aria-hidden="true" />
                <span>Cohort Goal Progress</span>
              </span>
              <div className="progress-stat-pill">
                <span className="progress-ratio-text">
                  <strong>{joinedCount}</strong> / {target}
                </span>
                <span className="progress-percent-badge">{fillPercentage}%</span>
              </div>
            </div>

            {/* Progress Track & Animated Emerald Fill */}
            <div 
              className="progress-track"
              role="progressbar"
              aria-valuenow={joinedCount}
              aria-valuemin={0}
              aria-valuemax={target}
              aria-label={`${joinedCount} of ${target} believers joined (${fillPercentage}%)`}
            >
              <div 
                className="progress-fill-bar"
                style={{
                  width: hasAnimated ? `${fillPercentage}%` : '0%',
                }}
              >
                <div className="progress-fill-glow" />
                <div className="progress-fill-shine" />
              </div>
            </div>

            {/* Scale Markers */}
            <div className="progress-markers-row" aria-hidden="true">
              <span className="marker-step">0</span>
              <span className="marker-step">25</span>
              <span className="marker-step target-marker">50 (Target)</span>
            </div>
          </div>

          {/* Live Activity Ticker */}
          <div className="ticker-wrapper" aria-label="Recent Waitlist Registrations">
            <div className="ticker-header-bar">
              <div className="ticker-title-group">
                <Flame size={15} className="flame-icon" aria-hidden="true" />
                <span className="ticker-title">Live Activity</span>
              </div>
              <span className="ticker-sub">Real-time fellowship invites</span>
            </div>

            {/* Auto-scrolling Vertical Activity Ticker Container */}
            <div className="ticker-scroll-viewport">
              <div className="ticker-scroll-track animate-ticker-loop">
                {/* First set of activities */}
                {activities.map((item) => (
                  <div key={`primary-${item.id}`} className="ticker-item-card">
                    <span className="ticker-status-dot" aria-hidden="true" />
                    <span className="ticker-item-text">
                      <strong className="member-name">{item.name}</strong> joined from{' '}
                      <span className="member-city">{item.city}</span>
                    </span>
                    <span className="ticker-time">
                      <Clock size={12} className="time-icon" aria-hidden="true" />
                      {item.time}
                    </span>
                  </div>
                ))}

                {/* Duplicate set to enable seamless infinite loop */}
                {activities.map((item) => (
                  <div key={`dup-${item.id}`} className="ticker-item-card" aria-hidden="true">
                    <span className="ticker-status-dot" />
                    <span className="ticker-item-text">
                      <strong className="member-name">{item.name}</strong> joined from{' '}
                      <span className="member-city">{item.city}</span>
                    </span>
                    <span className="ticker-time">
                      <Clock size={12} className="time-icon" />
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default CommunityProgressSection;
