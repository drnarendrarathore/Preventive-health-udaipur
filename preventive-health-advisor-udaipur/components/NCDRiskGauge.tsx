
import React, { useState, useEffect } from 'react';
import { t } from '../locales/index.ts';

interface NCDRiskGaugeProps {
  score: number;
}

const NCDRiskGauge: React.FC<NCDRiskGaugeProps> = ({ score }) => {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        const animationTimeout = setTimeout(() => {
            setAnimatedScore(score);
        }, 100);
        return () => clearTimeout(animationTimeout);
    }, [score]);

    const MAX_SCORE = 10;
    const percentage = animatedScore / MAX_SCORE;

    const radius = 40;
    const circumference = Math.PI * radius;
    const strokeDashoffset = circumference * (1 - percentage);
    const rotation = percentage * 180 - 90;

    let color = 'var(--success)';
    if (animatedScore >= 4 && animatedScore < 7) color = 'var(--warning)';
    if (animatedScore >= 7) color = 'var(--danger)';
    
    const riskLabel = score >= 4 ? t('cbac_high') : t('cbac_low');

    return (
        <div className="ncd-gauge-container animate-fade-in">
            <svg viewBox="0 0 100 65" className="ncd-gauge-svg">
                <path
                    className="gauge-bg"
                    d="M10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                />
                <path
                    className="gauge-fg"
                    d="M10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={color}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                />
                <line
                    className="gauge-needle"
                    x1="50" y1="50" x2="50" y2="18"
                    transform={`rotate(${rotation} 50 50)`}
                />
                <circle cx="50" cy="50" r="4" className="gauge-needle-pivot" />
                <text x="50" y="38" textAnchor="middle" className="gauge-score-text">
                    {animatedScore.toFixed(0)}
                    <tspan className="gauge-score-total">/10</tspan>
                </text>
                <text x="50" y="52" textAnchor="middle" className="gauge-label-text" fill={color}>
                    {riskLabel}
                </text>
            </svg>
        </div>
    );
};

export default NCDRiskGauge;