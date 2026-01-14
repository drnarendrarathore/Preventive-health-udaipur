import React, { useMemo } from 'react';
import type { UserData } from '../types.ts';
import { t } from '../locales/index.ts';
import { getPrimaryInsights } from '../services/shareService.ts';

interface KeyInsightsCardProps {
  userData: UserData;
  cbacScore: number;
}

const KeyInsightsCard: React.FC<KeyInsightsCardProps> = ({ userData, cbacScore }) => {
    const { focusArea1, focusArea2 } = useMemo(() => {
        const insights = getPrimaryInsights(userData);
        return { focusArea1: insights.focusAreas[0] || null, focusArea2: insights.focusAreas[1] || null };
    }, [userData]);
    
    const { color, label } = useMemo(() => {
        if (cbacScore >= 7) return { color: 'var(--danger)', label: t('cbac_high') };
        if (cbacScore >= 4) return { color: 'var(--warning)', label: t('cbac_high') };
        return { color: 'var(--success)', label: t('cbac_low') };
    }, [cbacScore]);

    return (
        <div className="key-insights-card animate-fade-in">
            <h3 className="insights-header">{t('key_insights_title')}</h3>
            <h2 className="insights-name">{userData.name}</h2>
            <div className="insights-main-content">
                <div className="insights-score-circle" style={{ borderColor: color }}>
                    <div className="insights-score-value">{cbacScore}</div>
                    <div className="insights-score-label" style={{ color }}>{label}</div>
                </div>
                <div className="insights-risk-factors">
                    <h4>{t('key_insights_risk_factors_title')}</h4>
                    <div className="insight-factors-grid">
                        {focusArea1 ? (
                            <>
                                <div className="insight-factor" key={focusArea1.key}>
                                    {/* FIX: Render SVG path string correctly within an SVG element */}
                                    <div className="insight-factor-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" dangerouslySetInnerHTML={{ __html: focusArea1.Icon }} />
                                    </div>
                                    <div className="insight-factor-label">{focusArea1.label}</div>
                                </div>
                                {focusArea2 && (
                                     <div className="insight-factor" key={focusArea2.key}>
                                        {/* FIX: Render SVG path string correctly within an SVG element */}
                                        <div className="insight-factor-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" dangerouslySetInnerHTML={{ __html: focusArea2.Icon }} />
                                        </div>
                                        <div className="insight-factor-label">{focusArea2.label}</div>
                                    </div>
                                )}
                            </>
                        ) : (
                           <div className="insight-factor">
                                {/* FIX: Ensure the fallback icon is a valid SVG element */}
                                <div className="insight-factor-icon" style={{width: 36, height: 36}}>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                </div>
                                <div className="insight-factor-label">Maintain Healthy Lifestyle</div>
                           </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KeyInsightsCard;