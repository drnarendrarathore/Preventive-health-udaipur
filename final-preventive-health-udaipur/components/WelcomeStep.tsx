import React from 'react';
import { t } from '../locales/index.ts';

const WelcomeIllustration: React.FC = () => (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="welcome-illustration-title">
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

        <path d="M -50 150 C 100 50, 250 250, 450 150" stroke="url(#grad-indigo)" strokeWidth="60" fill="none" opacity="0.1" strokeLinecap="round" />
        
        <circle cx="90" cy="90" r="70" fill="var(--primary-soft)" opacity="0.7" />

        <path d="M 50 250 C 150 350, 300 100, 400 200" stroke="var(--primary-soft)" strokeWidth="3" fill="none" />

        <path d="M 20,150 Q 200,50 380,150" stroke="url(#grad-indigo)" strokeWidth="8" fill="none" strokeLinecap="round" filter="url(#softGlow)" style={{ animation: 'flow 6s ease-in-out infinite' }} />

        <circle cx="320" cy="80" r="12" fill="url(#grad-indigo)" />
        <circle cx="60" cy="220" r="8" fill="var(--primary-light)" opacity="0.8" />
        
        <style>
            {`
                @keyframes flow {
                    0% { stroke-dasharray: 0 1000; }
                    50% { stroke-dasharray: 1000 1000; }
                    100% { stroke-dasharray: 1000 0; }
                }
            `}
        </style>
    </svg>
);


const WelcomeStep: React.FC<{onNext: () => void}> = ({ onNext }) => {

  return (
    <div className="welcome-step">
      <div className="welcome-content">
        <h1 className="stagger-1">{t('welcome_title')}</h1>
        
        <p className="stagger-2" style={{ 
            fontSize: '1rem', 
            fontWeight: 700, 
            color: 'var(--primary)', 
            marginBottom: '1.5rem',
            lineHeight: 1.4,
            maxWidth: '550px',
            marginInline: 'auto'
        }}>
            {t('welcome_institution')}
        </p>

        <p className="intro-text stagger-3">
          {t('welcome_subtitle')}
        </p>
        <div className="stagger-4">
          <button
            onClick={onNext}
            className="btn btn-primary"
          >
            {t('get_started')}
          </button>
        </div>
        <div className="welcome-disclaimer stagger-4" style={{ 
            marginTop: 'auto', 
            paddingTop: '2rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            opacity: 0.9,
            fontWeight: 500
        }}>
          {t('welcome_disclaimer')}
        </div>
      </div>
      <div className="welcome-illustration animate-fade-in">
        <WelcomeIllustration />
      </div>
    </div>
  );
};

export default WelcomeStep;