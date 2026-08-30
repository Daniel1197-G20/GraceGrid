import React, { memo, useMemo } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { Users, Church, Compass, HeartHandshake, ShieldCheck } from 'lucide-react';
import './StatsSection.css';

export const StatsSection = memo(function StatsSection() {
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  const stats = useMemo(() => [
    {
      id: 'believers',
      value: '5,000+',
      label: 'Believers Joining',
      subtext: 'Individuals and families seeking spiritually enriching fellowship',
      icon: <Users size={24} aria-hidden="true" />,
      accentBg: 'rgba(22, 163, 74, 0.12)',
      accentColor: '#16A34A'
    },
    {
      id: 'churches',
      value: '120+',
      label: 'Churches Interested',
      subtext: 'Congregations adopting next-generation digital worship tools',
      icon: <Church size={24} aria-hidden="true" />,
      accentBg: 'rgba(212, 175, 55, 0.15)',
      accentColor: '#D4AF37'
    },
    {
      id: 'communities',
      value: '40+',
      label: 'Campus & Life Groups',
      subtext: 'Youth ministries, prayer circles, and active Bible studies',
      icon: <Compass size={24} aria-hidden="true" />,
      accentBg: 'rgba(14, 165, 233, 0.12)',
      accentColor: '#0284C7'
    }
  ], []);

  return (
    <section 
      id="community" 
      ref={sectionRef} 
      className="stats-overlap-section" 
      aria-label="Community Statistics"
    >
      <div className="container">
        {/* Floating Glass Card Overlapping the Hero */}
        <div className={`stats-glass-card glass-card-frosted ${isVisible ? 'animate-fade-in-up' : ''}`}>
          <div className="stats-card-header">
            <Badge variant="emerald" pulse={true}>
              Global Body of Christ
            </Badge>
            <h2 className="stats-title">Uniting The Faithful Worldwide</h2>
          </div>

          <div className="stats-metrics-row">
            {stats.map((stat, idx) => (
              <article key={stat.id} className="stat-metric-block">
                <div 
                  className="stat-icon-halo" 
                  style={{ backgroundColor: stat.accentBg, color: stat.accentColor }}
                  aria-hidden="true"
                >
                  {stat.icon}
                </div>
                <div className="stat-number">{stat.value}</div>
                <h3 className="stat-heading">{stat.label}</h3>
                <p className="stat-explanation">{stat.subtext}</p>
                {idx < stats.length - 1 && <div className="stat-divider-line" aria-hidden="true" />}
              </article>
            ))}
          </div>

          {/* Frosted Sanctuary Footnote */}
          <div className="stats-bottom-ribbon">
            <div className="ribbon-left">
              <HeartHandshake size={18} className="ribbon-icon" aria-hidden="true" />
              <span>A sanctuary engineered for peace, free of secular algorithm noise and outrage.</span>
            </div>
            <div className="ribbon-tag">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>Biblically Centered</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default StatsSection;
