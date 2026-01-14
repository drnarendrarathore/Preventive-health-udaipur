
import React from 'react';
import { t } from '../locales/index.ts';

const WelcomeIllustration: React.FC = () => (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="welcome-illustration-title">
        <title id="welcome-illustration-title">Abstract illustration of health and science elements like a heart, EKG line, and cells.</title>
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: 'var(--primary)', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: 'var(--accent)', stopOpacity: 1}} />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        
        {/* Background shapes */}
        <circle cx="100" cy="100" r="80" fill="var(--primary-soft)" />
        <path d="M 250,50 Q 350,50 350,150 T 250,250 Z" fill="rgba(20, 184, 166, 0.08)" />

        {/* EKG Line */}
        <path d="M 50 150 L 120 150 L 140 120 L 160 180 L 180 140 L 200 150 L 350 150" stroke="url(#grad1)" strokeWidth="4" fill="none" strokeLinecap="round" filter="url(#glow)" />

        {/* Heart shape */}
        <path 
            d="M293.3,73.8c-20.8-20.8-54.6-20.8-75.4,0L200,91.7l-17.9-17.9c-20.8-20.8-54.6-20.8-75.4,0   c-20.8,20.8-20.8,54.6,0,75.4l93.3,93.3l93.3-93.3C314.1,128.4,314.1,94.6,293.3,73.8z" 
            fill="none" 
            stroke="var(--primary)" 
            strokeWidth="3"
            transform="translate(-90, 80) scale(0.4)"
        />

        {/* Abstract dots */}
        <circle cx="320" cy="80" r="5" fill="var(--accent)" />
        <circle cx="340" cy="220" r="8" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="2" />
        <circle cx="80" cy="230" r="10" fill="var(--accent)" opacity="0.5" />
    </svg>
);


const WelcomeStep: React.FC<{onNext: () => void}> = ({ onNext }) => {

  return (
    <div className="welcome-step">
      <div className="welcome-content">
        <h1>{t('welcome_title')}</h1>
        <p className="intro-text">
          {t('welcome_subtitle')}
        </p>
        <div>
          <button
            onClick={onNext}
            className="btn btn-primary"
          >
            {t('get_started')}
          </button>
        </div>
        <div className="welcome-disclaimer">
          {t('welcome_disclaimer')}
        </div>
      </div>
      <div className="welcome-illustration">
        <WelcomeIllustration />
      </div>
    </div>
  );
};

export default WelcomeStep;