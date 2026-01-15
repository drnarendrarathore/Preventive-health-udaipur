
import React from 'react';
import { track } from '@vercel/analytics';
import { t } from '../locales/index.ts';

const MapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width: 28, height: 28}}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
);

const ArogyaClinicCard: React.FC = () => {
    return (
        <div className="arogya-clinic-card animate-fade-in">
            <div className="clinic-icon-wrapper">
                <MapIcon />
            </div>
            <div className="clinic-content">
                <h3>{t('visit_clinic_title')}</h3>
                <p>{t('visit_clinic_desc')}</p>
                <a 
                    href="https://www.google.com/maps/search/?api=1&query=super+speciality+hospital+Udaipur" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-map"
                    onClick={() => track('clinic_map_clicked')}
                >
                    {t('get_directions')}
                </a>
            </div>
        </div>
    );
};

export default ArogyaClinicCard;
