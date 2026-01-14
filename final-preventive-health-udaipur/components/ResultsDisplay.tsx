import React, { useMemo, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

import type { AnalysisResponse, UserData, Recommendation } from '../types.ts';
import RecommendationCard from './RecommendationCard.tsx';
import KeyInsightsCard from './KeyInsightsCard.tsx';
import ArogyaClinicCard from './ArogyaClinicCard.tsx';
import RadarChart from './RadarChart.tsx';
import Modal from './Modal.tsx';
import { t } from '../locales/index.ts';
import { getRecommendationDetails } from '../locales/recommendations.ts';
import { calculateRadarData } from '../services/chartUtils.ts';
import { getBiometricAnalysis } from '../services/analysisUtils.ts';
import { lowRiskTheme, moderateRiskTheme, highRiskTheme } from '../themes.ts';
import { generateShareableCardDataUrl } from '../services/shareService.ts';
import { generateHealthReportPDF } from '../services/pdfGenerator.ts';

interface ResultsDisplayProps {
  results: AnalysisResponse;
  onReset: () => void;
  userData: UserData;
}

const WhatsAppIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
        <path d="M12.01,2.02c-5.5,0-9.98,4.48-9.98,9.98c0,1.75,0.46,3.42,1.29,4.89l-1.32,4.83l4.95-1.3c1.45,0.77,3.08,1.22,4.78,1.22c5.51,0,9.98-4.48,9.98-9.98C21.99,6.5,17.52,2.02,12.01,2.02z M17.02,14.61c-0.12,0.34-0.45,0.64-0.93,0.76c-0.48,0.12-1.02,0.18-1.54-0.05c-0.52-0.23-1.12-0.59-2.12-1.38c-1.01-0.79-1.88-1.78-2.6-2.93c-0.72-1.15-0.56-1.78,0.11-2.45c0.18-0.18,0.39-0.24,0.59-0.24c0.2,0,0.39,0.01,0.53,0.02c0.26,0.02,0.41,0.04,0.62,0.51c0.21,0.47,0.71,1.72,0.78,1.85c0.07,0.13,0.02,0.29-0.06,0.42c-0.08,0.13-0.13,0.18-0.26,0.31c-0.13,0.13-0.26,0.29-0.39,0.39c-0.13,0.1-0.21,0.18-0.06,0.38c0.15,0.2,0.66,1.04,1.4,1.72c0.97,0.89,1.72,1.14,1.98,1.25c0.26,0.11,0.4,0.09,0.56-0.07c0.16-0.16,0.69-0.78,0.88-1.04c0.19-0.26,0.37-0.21,0.61-0.11c0.24,0.1,1.49,0.7,1.74,0.83c0.25,0.13,0.42,0.2,0.47,0.31C17.14,14.27,17.14,14.27,17.02,14.61z" />
    </svg>
);

const AlertIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '24px', height: '24px', flexShrink: 0, marginRight: '1rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

const LifestyleRiskAlert: React.FC = () => (
    <div className="lifestyle-risk-alert">
        <AlertIcon />
        <div>
            <strong>{t('risk_alert_title')}</strong>
            <p>{t('risk_alert_message')}</p>
        </div>
    </div>
);


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onReset, userData }) => {
  const [modalRec, setModalRec] = useState<Recommendation | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const { theme, themeClass } = useMemo(() => {
    const score = results.cbacScore;
    if (score <= 3) return { theme: lowRiskTheme, themeClass: 'theme-low-risk' };
    if (score >= 4 && score <= 6) return { theme: moderateRiskTheme, themeClass: 'theme-moderate-risk' };
    return { theme: highRiskTheme, themeClass: 'theme-high-risk' };
  }, [results.cbacScore]);

  const biometricAnalysis = useMemo(() => getBiometricAnalysis(userData), [userData]);

  useEffect(() => {
    let interval: number;
    if (results && results.cbacScore <= 2) {
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 0, particleCount: 50 };

      interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
            return clearInterval(interval);
        }
        
        confetti({ ...defaults, origin: { x: Math.random() }, colors: [theme.primary, theme.accent, '#ffffff'] });
      }, 200);
    }

    // Cleanup interval on unmount to prevent memory leaks
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [results, theme]);

  const highPriorityRecs = useMemo(() => {
    return results.recommendations.filter(r => r.priority === 'high');
  }, [results.recommendations]);

  const routineRecs = useMemo(() => {
    return results.recommendations.filter(r => r.priority === 'normal');
  }, [results.recommendations]);
  
  const radarData = useMemo(() => calculateRadarData(userData, t), [userData]);

  const getBmiStatusKey = (bmiValue: number) => {
    if (bmiValue < 18.5) return 'bmi_underweight';
    if (bmiValue < 23) return 'bmi_normal';
    if (bmiValue < 25) return 'bmi_overweight';
    return 'bmi_obese';
  };
  const bmiStatusKey = getBmiStatusKey(parseFloat(biometricAnalysis.bmi.value));

  const handleGeneratePDF = async () => {
    setIsSharing(true);
    try {
        const pdfBlob = await generateHealthReportPDF(userData, results, theme);
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            const sanitizeFilename = (name: string) => name.replace(/[\/\\?%*:|"<>]/g, '_');
            link.download = `${sanitizeFilename(userData.name)}_Health_Report.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error("PDF Generation failed", error);
        alert(t('error_generic'));
    } finally {
        setIsSharing(false);
    }
  };

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  const handleShare = async () => {
    setIsSharing(true);
    // Add delay to allow UI state to render 'Generating...'
    await new Promise(r => setTimeout(r, 50));
    
    const riskLabel = results.cbacScore >= 4 ? t('cbac_high') : t('cbac_low');
    
    const summary = `*My Health Screening Summary*\n\n` +
                    `*Name:* ${userData.name}\n` +
                    `*NCD Risk Score:* ${results.cbacScore}/10 (${riskLabel})\n\n` +
                    `_Generated by the Preventive Health Advisor app._\n`;

    try {
        const cardDataUrl = await generateShareableCardDataUrl(userData, results.cbacScore, theme);
        const imageBlob = cardDataUrl ? dataURLtoBlob(cardDataUrl) : null;
        
        if (imageBlob && navigator.share && navigator.canShare && navigator.canShare({ files: [new File([imageBlob], 'summary.png', { type: 'image/png' })] })) {
            const imageFile = new File([imageBlob], `${userData.name}_Health_Summary.png`, { type: 'image/png' });
            await navigator.share({
                title: `Health Summary for ${userData.name}`,
                text: summary,
                files: [imageFile],
            });
        } else {
            const encodedText = encodeURIComponent(summary);
            window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        }
    } catch (error) {
        console.error('Error generating or sharing content:', error);
        const encodedText = encodeURIComponent(summary);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    } finally {
        setIsSharing(false);
    }
  };

  const handleOpenModal = (rec: Recommendation) => {
    setModalRec(rec);
  };
  
  const handleCloseModal = () => {
    setModalRec(null);
  };

  const details = modalRec ? getRecommendationDetails(modalRec.key) : [];
  const packYears = ((userData.smokingPacksPerDay || 0) * (userData.smokingYears || 0));

  return (
    <div className={`step-content ${themeClass}`}>
      <h2 className="step-header">{t('results_title_for')} {userData.name}</h2>
      <p className="step-subheader">{t('results_subtitle')}</p>
      
      {results.hasLifestyleRiskAlert && <LifestyleRiskAlert />}
      
      <KeyInsightsCard userData={userData} cbacScore={results.cbacScore} />

      <div className="key-indicators-container">
        <h3 className="results-subheader">{t('key_indicators_title')}</h3>
        <div className="key-indicators-list">
            <div className="indicator-item">
                <strong>{t('pdf_bmi_status')}</strong>
                <span>
                    {biometricAnalysis.bmi.value} ({t(bmiStatusKey)})
                    {biometricAnalysis.bmi.note && <em className="borderline-note">{biometricAnalysis.bmi.note}</em>}
                </span>
            </div>
            <div className="indicator-item">
                <strong>{t('waist_label')}</strong>
                <span>
                    {biometricAnalysis.waist.value}
                    {biometricAnalysis.waist.note && <em className="borderline-note">{biometricAnalysis.waist.note}</em>}
                </span>
            </div>
             <div className="indicator-item">
                <strong>{t('pdf_tobacco_smoking')}</strong>
                <span>
                    {t(`smoking_status_${userData.smokingStatus}`)}
                    {packYears > 0 && ` (${packYears} ${t('pack_years')})`}
                </span>
            </div>
             <div className="indicator-item">
                <strong>{t('alcohol_frequency_label')}</strong>
                <span>{t(`alcohol_frequency_${userData.alcoholFrequency}`)}</span>
            </div>
        </div>
      </div>

      <div className="radar-chart-container">
        <h3 className="results-subheader">{t('radar_title')}</h3>
        <RadarChart data={radarData} />
      </div>

      <div className="recommendations-container">
        {highPriorityRecs.length > 0 && (
          <details className="collapsible-section" open>
            <summary>{t('rec_group_high_priority')}</summary>
            <div className="recommendation-group">
              {highPriorityRecs.map(rec => (
                <RecommendationCard 
                  key={rec.key} 
                  recommendation={rec}
                  onLearnMore={() => handleOpenModal(rec)}
                />
              ))}
            </div>
          </details>
        )}
        
        {routineRecs.length > 0 && (
           <details className="collapsible-section" open>
            <summary>{t('rec_group_routine')}</summary>
            <div className="recommendation-group">
              {routineRecs.map(rec => (
                <RecommendationCard 
                  key={rec.key} 
                  recommendation={rec}
                  onLearnMore={() => handleOpenModal(rec)}
                />
              ))}
            </div>
          </details>
        )}
      </div>

      <ArogyaClinicCard />
      
      <div className="results-actions">
          <button onClick={onReset} className="btn btn-secondary">{t('start_over')}</button>
          <button onClick={handleGeneratePDF} disabled={isSharing} className="btn btn-primary">
            {isSharing ? t('loader_generating') : t('export_pdf')}
          </button>
          <button onClick={handleShare} disabled={isSharing} className="btn btn-whatsapp">
            <WhatsAppIcon /> {isSharing ? t('loader_generating') : t('share_summary')}
          </button>
      </div>

      <footer className="results-footer">
          <p>{t('results_footer_text')}</p>
      </footer>

      <Modal isOpen={!!modalRec} onClose={handleCloseModal}>
        {modalRec && (
            <>
                <div className="modal-header">
                    <p className="modal-category">{modalRec.category}</p>
                    <h2>{modalRec.test}</h2>
                    <p className="modal-frequency">{modalRec.frequency}</p>
                </div>
                <div className="modal-body">
                    {details.map((detail, index) => {
                        if ('title' in detail) {
                            return (
                                <div key={index} style={{ marginBottom: '1rem' }}>
                                    <h4>{detail.title}</h4>
                                    <p>{detail.content}</p>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
                <div className="modal-footer">
                    <button onClick={handleCloseModal} className="btn btn-primary">{t('close_modal')}</button>
                </div>
            </>
        )}
      </Modal>
    </div>
  );
};

export default ResultsDisplay;