
import React, { useMemo, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { track } from '@vercel/analytics';

import type { AnalysisResponse, UserData, Recommendation } from '../types.ts';
import RecommendationCard from './RecommendationCard.tsx';
import KeyInsightsCard from './KeyInsightsCard.tsx';
import ArogyaClinicCard from './ArogyaClinicCard.tsx';
import ShareReportCard from './ShareReportCard.tsx';
import RadarChart from './RadarChart.tsx';
import { t } from '../locales/index.ts';
import { getRecommendationDetails } from '../locales/recommendations.ts';
import { calculateRadarData } from '../services/chartUtils.ts';
import { getBiometricAnalysis } from '../services/analysisUtils.ts';
import { lowRiskTheme, moderateRiskTheme, highRiskTheme } from '../themes.ts';
import { generateHealthReportPDF } from '../services/pdfGenerator.ts';

interface ResultsDisplayProps {
  results: AnalysisResponse;
  onReset: () => void;
  userData: UserData;
}

const ArrowLeft: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onReset, userData }) => {
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const { theme, themeClass } = useMemo(() => {
    const score = results.cbacScore;
    if (score <= 3) return { theme: lowRiskTheme, themeClass: 'theme-low-risk' };
    if (score >= 4 && score <= 6) return { theme: moderateRiskTheme, themeClass: 'theme-moderate-risk' };
    return { theme: highRiskTheme, themeClass: 'theme-high-risk' };
  }, [results.cbacScore]);

  const biometricAnalysis = useMemo(() => getBiometricAnalysis(userData), [userData]);

  useEffect(() => {
    if (results && results.cbacScore <= 3) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: [theme.primary, theme.accent] });
    }
  }, [results, theme]);

  const highPriorityRecs = useMemo(() => results.recommendations.filter(r => r.priority === 'high'), [results.recommendations]);
  const routineRecs = useMemo(() => results.recommendations.filter(r => r.priority === 'normal'), [results.recommendations]);
  const radarData = useMemo(() => calculateRadarData(userData, t), [userData]);
  
  const handleGeneratePDF = async () => {
    setIsSharing(true);
    try {
        const pdfBlob = await generateHealthReportPDF(userData, results, theme);
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${userData.name.replace(/\s+/g, '_')}_Health_Report.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    } finally {
        setIsSharing(false);
    }
  };

  const handleSharePdfReport = async () => {
    setIsSharing(true);
    try {
        const pdfBlob = await generateHealthReportPDF(userData, results, theme);
        if (pdfBlob) {
            const pdfFile = new File([pdfBlob], `${userData.name}_Report.pdf`, { type: 'application/pdf' });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({ files: [pdfFile], title: 'Health Report', text: `Clinical assessment for ${userData.name}` });
            } else {
                handleGeneratePDF();
            }
        }
    } finally {
        setIsSharing(false);
    }
  };

  if (selectedRec) {
    const details = getRecommendationDetails(selectedRec.key);
    return (
        <div className={`step-content reader-view ${themeClass}`}>
            <button onClick={() => setSelectedRec(null)} className="btn-link" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft /> {t('back')}
            </button>
            <div className="professional-summary-box animate-fade-in" style={{ borderTop: `6px solid var(--primary)` }}>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{selectedRec.test}</h1>
                <p style={{ fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>{selectedRec.frequency}</p>
                <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border-color)', borderTop: 0 }} />
                {details.map((d, i) => 'title' in d && (
                    <div key={i} style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>{d.title}</h4>
                        <p style={{ color: 'var(--text-muted)' }}>{d.content}</p>
                    </div>
                ))}
            </div>
            <button onClick={() => setSelectedRec(null)} className="btn btn-primary" style={{ marginTop: '2rem' }}>{t('close_modal')}</button>
        </div>
    );
  }

  return (
    <div className={`results-dashboard-wrapper ${themeClass}`}>
      
      {/* SECTION 1: OVERVIEW */}
      <section>
        <span className="section-chip">1. {t('pdf_patient_summary')}</span>
        <h2 className="step-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>{t('results_title_for')} <span style={{color: 'var(--primary)'}}>{userData.name}</span></h2>
        <KeyInsightsCard userData={userData} cbacScore={results.cbacScore} />
      </section>

      {/* SECTION 2: CLINICAL DATA */}
      <section className="animate-fade-in stagger-1">
        <span className="section-chip">2. {t('pdf_key_indicators')}</span>
        <div className="key-indicators-list" style={{ marginBottom: '3rem' }}>
            <div className="indicator-item">
                <strong>{t('pdf_bmi_status')}</strong>
                <span>{biometricAnalysis.bmi.value}</span>
            </div>
            <div className="indicator-item">
                <strong>{t('waist_label')}</strong>
                <span>{biometricAnalysis.waist.value}</span>
            </div>
             <div className="indicator-item">
                <strong>{t('pdf_tobacco_smoking')}</strong>
                <span>{t(`smoking_status_${userData.smokingStatus}`)}</span>
            </div>
             <div className="indicator-item">
                <strong>{t('alcohol_frequency_label')}</strong>
                <span>{t(`alcohol_frequency_${userData.alcoholFrequency}`)}</span>
            </div>
        </div>
        
        <div className="radar-chart-container" style={{ margin: '4rem 0' }}>
            <h3 style={{fontSize: '1.1rem', marginBottom: '2rem', textAlign: 'center', fontWeight: 800}}>{t('radar_title')}</h3>
            <RadarChart data={radarData} />
        </div>

        <div className="professional-summary-box">
             {results.cbacScore >= 4 
                ? "Your assessment indicates an elevated risk for Non-Communicable Diseases (NCDs). Following the NP-NCD protocol, prioritized clinical evaluation at a specialized clinic is strongly recommended to validate these markers."
                : "Your assessment indicates a low immediate risk for major NCDs. Continued focus on maintaining healthy BMI, balanced salt intake, and regular physical activity is advised to preserve this profile."}
        </div>
      </section>

      {/* SECTION 3: ACTION PLAN */}
      <section className="animate-fade-in stagger-2">
        <span className="section-chip">3. {t('pdf_action_plan_title')}</span>
        
        {highPriorityRecs.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ color: 'var(--danger)', fontSize: '1rem', marginBottom: '1.5rem', fontWeight: 900 }}>{t('rec_group_high_priority')}</h3>
            <div className="recommendation-group">
              {highPriorityRecs.map(rec => (
                <RecommendationCard key={rec.key} recommendation={rec} onLearnMore={() => setSelectedRec(rec)} />
              ))}
            </div>
          </div>
        )}
        
        <div className="recommendation-group">
          <h3 style={{ color: 'var(--primary)', fontSize: '1rem', marginBottom: '1.5rem', fontWeight: 900 }}>{t('rec_group_routine')}</h3>
          {routineRecs.map(rec => (
            <RecommendationCard key={rec.key} recommendation={rec} onLearnMore={() => setSelectedRec(rec)} />
          ))}
        </div>
      </section>

      {/* SECTION 4: CLINIC & EXPORT */}
      <section className="animate-fade-in stagger-3">
        <span className="section-chip">4. {t('pdf_time_immediate')}</span>
        <ArogyaClinicCard />
        <ShareReportCard onShare={handleSharePdfReport} isSharing={isSharing} />
        
        <div className="dashboard-actions">
            <button onClick={handleGeneratePDF} disabled={isSharing} className="btn btn-primary">
                {isSharing ? t('loader_generating') : t('export_pdf')}
            </button>
            <button onClick={onReset} className="btn-link">{t('start_over')}</button>
        </div>
      </section>

      <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {t('results_footer_text')}
      </footer>
    </div>
  );
};

export default ResultsDisplay;
