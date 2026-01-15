
import React from 'react';
import { t } from '../locales/index.ts';

const WelcomeIllustration: React.FC = () => (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="welcome-illustration-title" className="welcome-svg">
        <title id="welcome-illustration-title">Abstract illustration of flowing lines and shapes representing health and technology.</title>
        <defs>
            <linearGradient id="grad-indigo" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-light)" />
                <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0" result="glow" />
                <feComposite in="glow" in2="SourceGraphic" operator="over" />
            </filter>
        </defs>

        {/* Background Flow */}
        <path d="M -50 150 C 100 50, 250 250, 450 150" stroke="url(#grad-indigo)" strokeWidth="60" fill="none" opacity="0.05" strokeLinecap="round" />
        
        {/* Decorative Circle */}
        <circle cx="90" cy="90" r="60" fill="var(--primary-soft)" opacity="0.5" />

        {/* Connecting Line */}
        <path d="M 50 250 C 150 350, 300 100, 400 200" stroke="var(--border-color)" strokeWidth="2" fill="none" strokeDasharray="4 4" />

        {/* Main Flow Line */}
        <path d="M 20,150 Q 200,50 380,150" stroke="url(#grad-indigo)" strokeWidth="6" fill="none" strokeLinecap="round" filter="url(#softGlow)" style={{ animation: 'flow 6s ease-in-out infinite' }} />

        {/* Floating Medical Icons */}
        <g style={{ animation: 'float 4s ease-in-out infinite' }}>
            {/* Cross Icon */}
            <circle cx="320" cy="80" r="18" fill="#fff" filter="url(#softGlow)" />
            <rect x="316" y="70" width="8" height="20" rx="2" fill="var(--primary)" />
            <rect x="310" y="76" width="20" height="8" rx="2" fill="var(--primary)" />
        </g>
        
        <g style={{ animation: 'float 5s ease-in-out infinite', animationDelay: '1s' }}>
             {/* Heart Icon */}
             <path transform="translate(50, 210) scale(0.8)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="var(--danger)" opacity="0.8" />
        </g>
        
        <style>
            {`
                @keyframes flow {
                    0% { stroke-dasharray: 0 1000; }
                    50% { stroke-dasharray: 1000 1000; }
                    100% { stroke-dasharray: 1000 0; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}
        </style>
    </svg>
);

const ShieldIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16, marginRight: 6, color: 'var(--primary)' }}>
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
    </svg>
);

const WelcomeStep: React.FC<{onNext: () => void}> = ({ onNext }) => {

  return (
    <div className="welcome-step enhanced">
      <div className="welcome-bg-pattern"></div>
      
      <div className="welcome-glass-card">
        {/* Trust Badge */}
        <div className="trust-badge stagger-1">
            <ShieldIcon />
            <span className="trust-text">{t('welcome_institution')}</span>
        </div>

        <h1 className="stagger-2">{t('welcome_title')}</h1>
        
        {/* Mobile Illustration (Visible only on small screens via CSS) */}
        <div className="welcome-illustration mobile-only stagger-2">
            <WelcomeIllustration />
        </div>

        <p className="intro-text stagger-3">
          {t('welcome_subtitle')}
        </p>
        
        <div className="stagger-4 action-area">
          <button
            onClick={onNext}
            className="btn btn-primary btn-pulse"
          >
            {t('get_started')}
            <span style={{ marginLeft: '8px', fontSize: '1.2em' }}>&rarr;</span>
          </button>
        </div>
      </div>

      {/* Desktop Illustration */}
      <div className="welcome-illustration desktop-only animate-fade-in">
        <WelcomeIllustration />
      </div>

      {/* Expert Verification Pill (Footer) */}
      <div className="expert-pill stagger-4">
          <span className="expert-icon">🩺</span>
          <div className="expert-content">
              {t('welcome_disclaimer')}
          </div>
      </div>
    </div>
  );
};

export default WelcomeStep;
