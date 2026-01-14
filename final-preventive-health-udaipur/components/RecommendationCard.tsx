import React from 'react';
import type { Recommendation } from '../types.ts';
import { t } from '../locales/index.ts';
import { getRecommendationDetails } from '../locales/recommendations.ts';

const IconBase: React.FC<{children: React.ReactNode}> = ({children}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">{children}</svg>;

const CardiovascularIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></IconBase>;
const CancerIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.45z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></IconBase>;
const DiabetesIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></IconBase>;
const RespiratoryIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></IconBase>;
const GeneralHealthIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 1.5m1-1.5l1 1.5m0 0l.5 1.5m-1.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></IconBase>;
const DefaultIcon: React.FC = () => <IconBase><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></IconBase>;

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
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)' }}>{recommendation.category}</p>
                    {recommendation.priority === 'high' && <span className="priority-tag">{t('priority_high')}</span>}
                </div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{recommendation.test}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem' }}>{recommendation.frequency}</p>
                <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>{recommendation.reason}</p>
                {hasDetails && (
                    <button onClick={onLearnMore} className="btn-link" style={{ fontWeight: 700, fontSize: '0.875rem' }}>{t('learn_more')}</button>
                )}
            </div>
        </div>
    );
};

export default RecommendationCard;