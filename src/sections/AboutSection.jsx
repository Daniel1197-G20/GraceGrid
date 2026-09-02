import React, { useMemo, useCallback, memo } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { LeafPattern } from '../components/DecorativeAssets';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import './AboutSection.css';

export const AboutSection = memo(function AboutSection() {
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  const scrollToWaitlist = useCallback((e) => {
    e.preventDefault();
    const waitlist = document.getElementById('waitlist');
    if (waitlist) {
      waitlist.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const coreValues = useMemo(() => [
    {
      title: 'Christ-Centered Architecture',
      description: 'Zero outrage algorithms or vanity metrics. Every interaction is designed to cultivate the Fruit of the Spirit.'
    },
    {
      title: 'Digital Sanctuary of Peace',
      description: 'A tranquil digital environment where you can open Scripture and worship without commercial noise.'
    },
    {
      title: 'Guarded & Authentic Fellowship',
      description: 'End-to-end respect for your prayer requests, small group vulnerability, and spiritual reflections.'
    }
  ], []);

  return (
    <section 
      id="about" 
      ref={sectionRef} 
      className="cinematic-about-section section-spacing"
      aria-label="About GraceGrid Mission and Values"
    >
      <LeafPattern position="top-left" opacity={0.15} size={130} />

      <div className={`container ${isVisible ? 'animate-fade-in-up' : ''}`}>
        <div className="about-split-layout">
          {/* LEFT SIDE: Heading, Mission, Values, Learn More CTA */}
          <div className="about-left-col">
            <Badge variant="gold" pulse={true} className="about-badge">
              Our Sacred Calling
            </Badge>

            <h2 className="heading-section about-title">
              Strengthening Christian Fellowship Through Technology
            </h2>

            {/* Mission Statement Box */}
            <div className="about-mission-card">
              <span className="mission-label">THE GRACEGRID MISSION</span>
              <blockquote className="mission-quote-highlight">
                “GraceGrid exists to strengthen Christian fellowship through technology while keeping Christ at the center.”
              </blockquote>
            </div>

            {/* 3 Core Values List */}
            <div className="about-values-list">
              {coreValues.map((val, idx) => (
                <div key={idx} className="about-value-item">
                  <div className="value-check-icon">
                    <CheckCircle2 size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="value-title">{val.title}</h3>
                    <p className="value-desc">{val.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Learn More Button */}
            <div className="about-actions-row">
              <Button
                href="#waitlist"
                onClick={scrollToWaitlist}
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight size={18} />}
                ariaLabel="Join the mission on the waitlist"
              >
                Join Our Mission
              </Button>
            </div>
          </div>

          {/* RIGHT SIDE: Cinematic Photograph with Overlaid Handwritten Script */}
          <div className="about-right-col">
            <figure className="cinematic-photo-frame">
              {/* Photo Background */}
              <img 
                src="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop&q=80&fm=webp" 
                srcSet="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=400&auto=format&fit=crop&q=75&fm=webp 400w,
                        https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop&q=80&fm=webp 800w,
                        https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&auto=format&fit=crop&q=80&fm=webp 1200w"
                sizes="(max-width: 1024px) 90vw, 520px"
                alt="Folded hands praying over an open Bible overlooking mountain vista during sunset" 
                className="cinematic-photo-img"
                loading="lazy"
                decoding="async"
                width="600"
                height="650"
              />

              {/* Overlays */}
              <div className="photo-sunset-overlay" aria-hidden="true" />
              <div className="photo-vignette" aria-hidden="true" />

              {/* Glowing Cross Watermark */}
              <div className="photo-cross-watermark" aria-hidden="true">✝</div>

              {/* Overlaid Handwritten Script */}
              <figcaption className="photo-script-overlay">
                <span className="handwritten-script">
                  “Better Together in Christ”
                </span>
                <p className="photo-verse-quote">
                  “For where two or three gather in my name, there am I with them.”
                </p>
                <span className="photo-verse-reference">— Matthew 18:20</span>
              </figcaption>

              {/* Subtle Floating Gold Badge */}
              <div className="photo-floating-pill">
                <Sparkles size={14} className="sparkle-gold" aria-hidden="true" />
                <span>One Faith • One Body</span>
              </div>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
});

export default AboutSection;
