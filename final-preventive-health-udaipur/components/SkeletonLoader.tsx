
import React from 'react';
import { t } from '../locales/index.ts';

const SkeletonLoader: React.FC = () => {
    return (
        <div className="skeleton-loader" aria-live="polite" aria-busy="true">
            <div className="skeleton-header">
                <div className="skeleton-line title"></div>
                <div className="skeleton-line subtitle"></div>
            </div>
            <div className="skeleton-gauge"></div>
            <div className="skeleton-card">
                <div className="skeleton-card-icon"></div>
                <div className="skeleton-card-content">
                    <div className="skeleton-line tag"></div>
                    <div className="skeleton-line heading"></div>
                    <div className="skeleton-line text"></div>
                    <div className="skeleton-line text short"></div>
                </div>
            </div>
            <div className="skeleton-card">
                <div className="skeleton-card-icon"></div>
                <div className="skeleton-card-content">
                    <div className="skeleton-line tag"></div>
                    <div className="skeleton-line heading"></div>
                    <div className="skeleton-line text"></div>
                    <div className="skeleton-line text short"></div>
                </div>
            </div>
            <div className="skeleton-card">
                <div className="skeleton-card-icon"></div>
                <div className="skeleton-card-content">
                    <div className="skeleton-line tag"></div>
                    <div className="skeleton-line heading"></div>
                    <div className="skeleton-line text"></div>
                    <div className="skeleton-line text short"></div>
                </div>
            </div>
            <div className="loader-text">
                <h2>{t('loader_title')}</h2>
                <p>{t('loader_subtitle')}</p>
            </div>
        </div>
    );
};

export default SkeletonLoader;