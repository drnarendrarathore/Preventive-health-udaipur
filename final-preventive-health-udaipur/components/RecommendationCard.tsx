
import React from 'react';
import type { Recommendation } from '../types.ts';
import { t } from '../locales/index.ts';
import { getRecommendationDetails } from '../locales/recommendations.ts';

const IconBase: React.FC<{children: React.ReactNode}> = ({children}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">{children}</svg>;

const GeneralHealthIcon: React.FC = () => <IconBase><path fill="var(--primary-soft)" d="M4 4.5A2.5 2.5 0 0 1 6.5 2H18a2.5 2.5 0 0 1 2.5 2.5v14A2.5 2.5 0 0 1 18 21.5H6.5A2.5 2.5 0 0 1 4 19V4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" /></IconBase>;
const CardiovascularIcon: React.FC = () => <IconBase><path fill="var(--primary-soft)" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 10.5l2.25 2.25 4.5-4.5" /></IconBase>;
const CancerIcon: React.FC = () => <IconBase><path fill="var(--primary-soft)" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /><path strokeLinecap="round" strokeLinejoin="round" d="m13.5 10.5-3 3m0-3 3 3" /></IconBase>;
const DiabetesIcon: React.FC = () => <IconBase><path fill="var(--primary-soft)" d="M4.5 12.75l6 6 9-13.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.002 9.002 0 0 0 8.035-5.912" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.965 15.088A9.002 9.002 0 0 0 12 21" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 0 1 9-9 8.999 8.999 0 0 1 8.388 5.612" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9" /></IconBase>;
const RespiratoryIcon: React.FC = () => <IconBase><path fill="var(--primary-soft)" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 12c0-3.14 2.585-5.69 5.733-5.69 3.147 0 5.733 2.55 5.733 5.69" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.267 6.31c3.148 0 5.733 2.55 5.733 5.69" /></IconBase>;
const DefaultIcon: React.FC = () => <IconBase><path fill="var(--primary-soft)" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></IconBase>;

const ICONS_MAP: { [key: string]: React.FC } = {
    'rec_cat_cardio': CardiovascularIcon,
    'rec_cat_metabolic': DiabetesIcon,
    'rec_cat_cancer': CancerIcon,
    'rec_cat_womens': GeneralHealthIcon,
    'rec_cat_liver': GeneralHealthIcon,
    'rec_cat_preventive': GeneralHealthIcon,
    'rec_cat_digestive': GeneralHealthIcon,
    'rec_cat_respiratory': RespiratoryIcon,
    'rec_cat_wellbeing': DefaultIcon,
    'info': DefaultIcon,
};

const RecommendationCard: React.FC<{ recommendation: Recommendation, onLearnMore: () => void }> = ({ recommendation, onLearnMore }) => {
    const Icon = ICONS_MAP[recommendation.categoryKey] || DefaultIcon;
    const hasDetails = getRecommendationDetails(recommendation.key).length > 0;

    return (
        <div className="recommendation-card animate-fade-in">
            <div className="recommendation-card-icon">
               <Icon />
            </div>
            <div className="recommendation-card-content">
                <div className="rec-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>{recommendation.category}</p>
                    {recommendation.priority === 'high' && <span className="priority-tag">{t('priority_high')}</span>}
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{recommendation.test}</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{recommendation.frequency}</p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-main)', marginBottom: '1rem' }}>{recommendation.reason}</p>
                {hasDetails && (
                    <button onClick={onLearnMore} className="btn-link" style={{ padding: '0.25rem 0', fontWeight: 700, fontSize: '0.875rem' }}>{t('learn_more')} →</button>
                )}
            </div>
        </div>
    );
};

export default RecommendationCard;
