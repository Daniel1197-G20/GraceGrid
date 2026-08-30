import React, { useState, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import Badge from '../components/Badge';
import Tooltip from '../components/Tooltip/Tooltip';
import { LeafPattern } from '../components/DecorativeAssets';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { 
  Radio, 
  Heart, 
  MessageSquare, 
  FileText, 
  BookOpen, 
  ArrowUpRight, 
  Check
} from 'lucide-react';
import './FeaturesSection.css';

// Lazy load detail modal for optimal initial load bundle
const FeatureDetailModal = lazy(() => import('../components/FeatureDetailModal'));

export const FeaturesSection = memo(function FeaturesSection() {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.08 });

  const features = useMemo(() => [
    {
      id: 'livestream',
      title: 'Live Streaming',
      icon: <Radio size={24} aria-hidden="true" />,
      pillText: 'Broadcast & Worship',
      tooltipText: 'High-definition worship broadcasting with live synchronized prayer reactions',
      description: 'Stream Sunday sermons, acoustic worship encounters, and live prayer rooms with low latency and synchronous fellowship reactions.',
      longDescription: 'GraceGrid Live Streaming enables churches and ministries of any size to broadcast high-definition services directly to their congregation. With integrated live prayer reaction triggers, synchronous chat moderation, and automatic sermon archive transcription, you can gather believers anywhere in real time.',
      highlights: ['Ultra-low latency streaming', 'Live interactive prayer reactions', 'Moderated sacred chat space'],
      capabilities: [
        'Stream Sunday services and midweek studies in 1080p60',
        'Believers can click "Praying Now" during altar calls',
        'Automatic sermon timestamps synced with Bible verses',
        'Small group audio breakout rooms immediately after service'
      ],
      scripture: {
        text: 'Where two or three gather in my name, there am I with them.',
        reference: 'Matthew 18:20'
      }
    },
    {
      id: 'prayer-wall',
      title: 'Prayer Wall',
      icon: <Heart size={24} aria-hidden="true" />,
      pillText: 'Intercession & Agreement',
      tooltipText: 'Share prayer requests, trigger church-wide intercession, and celebrate answered prayers',
      description: 'Share prayer requests publicly or anonymously with verified pastoral leaders, and watch real-time prayer counters lift your burdens.',
      longDescription: 'Turn prayer into an active, community-wide ministry. When you post a need or praise report, believers receive notification prompts to intercede. Watch real-time "Prayed" counters lift your burdens in faith.',
      highlights: ['One-tap "I Prayed" confirmations', 'Anonymous & circle privacy controls', 'Praise report timeline'],
      capabilities: [
        'Post prayer requests with customizable visibility settings',
        'Track answered prayers with celebratory praise milestones',
        'Weekly curated prayer chain prompts for your small group',
        'Pastoral priority flags for urgent counseling or hospital visits'
      ],
      scripture: {
        text: 'Pray for one another, that you may be healed. The prayer of a righteous person has great power.',
        reference: 'James 5:16'
      }
    },
    {
      id: 'private-messaging',
      title: 'Private Messaging',
      icon: <MessageSquare size={24} aria-hidden="true" />,
      pillText: 'Fellowship & Small Groups',
      tooltipText: 'Encrypted group channels and direct messaging for life groups and accountability',
      description: 'Clean, encrypted direct messaging and small group channels built specifically for discipleship, life groups, and accountability partners.',
      longDescription: 'Deepen your relationships beyond Sunday mornings. GraceGrid direct messages and group channels are structured for discipleship, prayer accountability, and small group logistics—without algorithm noise or intrusive advertisements.',
      highlights: ['Encrypted direct messages', 'Group scripture study channels', 'Accountability check-in reminders'],
      capabilities: [
        'Organize channels by Life Groups, Youth, Worship Team, or Elders',
        'Threaded Bible verse sharing with inline reader cards',
        'Prayer accountability partner pairing and daily check-ins',
        'Zero ads, zero data tracking, 100% sacred focus'
      ],
      scripture: {
        text: 'Two are better than one, because they have a good return for their labor.',
        reference: 'Ecclesiastes 4:9'
      }
    },
    {
      id: 'sermon-notes',
      title: 'Sermon Notes',
      icon: <FileText size={24} aria-hidden="true" />,
      pillText: 'Discipleship & Retention',
      tooltipText: 'Smart markdown editor that auto-links Bible verses in real time and exports PDF study guides',
      description: 'Take structured markdown notes during sermons that auto-link to Bible verses, cloud-sync, and export to printable PDF study guides.',
      longDescription: 'Never lose a sermon revelation again. Type scripture references like "Romans 8:28" and GraceGrid instantly embeds the full passage. Tag key themes, export formatted PDF study guides, and share notes with your small group.',
      highlights: ['Automatic Scripture auto-linking', 'Cloud sync & offline mode', 'PDF export & group sharing'],
      capabilities: [
        'Smart markdown editor with automatic Bible verse detection',
        'Preacher outline sync: follow along with your pastor’s official slides',
        'Tag sermon notes by topic (Faith, Marriage, Purpose, Hope)',
        'Full search indexing across years of personal spiritual notes'
      ],
      scripture: {
        text: 'Write the vision; make it plain on tablets, so he may run who reads it.',
        reference: 'Habakkuk 2:2'
      }
    },
    {
      id: 'bible-reader',
      title: 'Bible Reader',
      icon: <BookOpen size={24} aria-hidden="true" />,
      pillText: 'Scripture Sanctuary',
      tooltipText: 'Distraction-free Bible reading with multiple translations, highlights, and dramatized audio',
      description: 'A serene, distraction-free Scripture reading experience with multiple translations, golden highlighting, and dramatized audio narration.',
      longDescription: 'Experience God’s Word in an atmosphere of pure peace. Read the Bible in multiple translations (ESV, NIV, KJV, NLT, NASB) with side-by-side comparison, community commentary from trusted church fathers, and serene audio players.',
      highlights: ['Distraction-free typography', 'Multiple translations & audio', 'Community reading plans'],
      capabilities: [
        'Clean, typography-driven reader with customizable font sizes',
        'Side-by-side translation comparison tool',
        'Community daily reading plans with group discussion threads',
        'Golden bookmarking and prayer highlight tagging'
      ],
      scripture: {
        text: 'Your word is a lamp to my feet and a light to my path.',
        reference: 'Psalm 119:105'
      }
    }
  ], []);

  const handleJoinWaitlistFromModal = useCallback(() => {
    const waitlist = document.getElementById('waitlist');
    if (waitlist) {
      waitlist.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <section 
      id="features" 
      ref={sectionRef} 
      className="cinematic-features-section section-spacing"
      aria-label="Core Platform Features"
    >
      {/* Botanical Watermark Background */}
      <div className="botanical-watermark-bg" aria-hidden="true" />
      <LeafPattern position="top-right" opacity={0.12} size={140} />
      <LeafPattern position="bottom-left" opacity={0.12} size={140} />

      <div className={`container relative-content ${isVisible ? 'animate-fade-in-up' : ''}`}>
        <div className="section-header">
          <Badge variant="emerald" pulse={true}>
            Pillars of GraceGrid
          </Badge>
          <h2 className="heading-section">Designed for Deep Fellowship & Spiritual Vitality</h2>
          <p className="lead-text">
            Every feature is crafted to remove noise, deepen your walk with God, and bind the community in authentic Christian love.
          </p>
        </div>

        {/* 5 Elevated Cards Grid with 24px rounded corners & Green Circular Icons */}
        <div className="elevated-features-grid">
          {features.map((feature, idx) => (
            <article
              key={feature.id}
              className={`elevated-feature-card ${idx < 2 ? 'card-featured-half' : 'card-standard-third'}`}
              onClick={() => setSelectedFeature(feature)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedFeature(feature);
                }
              }}
              aria-label={`Explore details for ${feature.title}`}
            >
              <div className="feature-card-header">
                {/* Green Circular Icon with Tooltip */}
                <Tooltip content={feature.tooltipText} position="top">
                  <div className="green-circular-icon-badge">
                    {feature.icon}
                  </div>
                </Tooltip>
                <span className="feature-pill-badge">{feature.pillText}</span>
              </div>

              <div className="feature-body-content">
                <h3 className="feature-item-title">{feature.title}</h3>
                <p className="feature-item-desc">{feature.description}</p>
              </div>

              {/* Highlights */}
              <ul className="feature-bullet-list">
                {feature.highlights.map((h, i) => (
                  <li key={i} className="bullet-row">
                    <Check size={14} className="bullet-check" aria-hidden="true" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <div className="feature-card-action">
                <span className="feature-inspect-link">
                  Explore Feature <ArrowUpRight size={16} aria-hidden="true" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Lazy-Loaded Feature Detail Modal */}
      {selectedFeature && (
        <Suspense fallback={null}>
          <FeatureDetailModal
            feature={selectedFeature}
            isOpen={Boolean(selectedFeature)}
            onClose={() => setSelectedFeature(null)}
            onJoinWaitlist={handleJoinWaitlistFromModal}
          />
        </Suspense>
      )}
    </section>
  );
});

export default FeaturesSection;
