import React, { useMemo, useState, useEffect } from 'react';
import type { AnalysisResponse, UserData, Recommendation } from '../types.ts';
import RecommendationCard from './RecommendationCard.tsx';
import NCDRiskGauge from './NCDRiskGauge.tsx';
import RadarChart from './RadarChart.tsx';
import Modal from './Modal.tsx';
import { t } from '../locales/index.ts';
import { getRecommendationDetails } from '../locales/recommendations.ts';
import { calculateRadarData } from '../services/chartUtils.ts';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';

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


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onReset, userData }) => {
  const [modalRec, setModalRec] = useState<Recommendation | null>(null);

  useEffect(() => {
    if (results && results.cbacScore <= 2) {
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 0, particleCount: 50 };
      const themeColors = ['#007aff', '#34c759', '#5856d6', '#ffffff'];

      const interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
            return clearInterval(interval);
        }
        
        confetti({ ...defaults, origin: { x: Math.random() }, colors: themeColors });
      }, 200);
    }
  }, [results]);

  const highPriorityRecs = useMemo(() => {
    return results.recommendations.filter(r => r.priority === 'high');
  }, [results.recommendations]);

  const routineRecs = useMemo(() => {
    return results.recommendations.filter(r => r.priority === 'normal');
  }, [results.recommendations]);
  
  const radarData = useMemo(() => calculateRadarData(userData, t), [userData]);

  const generatePDF = (outputType: 'blob' | 'save' = 'save') => {
    const doc = new jsPDF();
    const FONT = 'Helvetica'; // Default font
    const PRIMARY_COLOR = '#007aff';
    const TEXT_COLOR = '#1d1d1f';
    const MUTED_COLOR = '#86868b';
    const BORDER_COLOR = '#d2d2d7';
    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    const MARGIN = 15;
    let y = 0;
    
    // --- HELPER FUNCTIONS ---
    const sanitizeFilename = (name: string) => {
        return name.replace(/[\/\\?%*:|"<>]/g, '_');
    };
    
    const drawStyledText = (text: string | string[], x: number, y: number, options: {
        size: number;
        color: string;
        style?: 'normal' | 'bold';
        align?: 'left' | 'center' | 'right';
        maxWidth?: number;
    }) => {
        const { size, color, style = 'normal', align, maxWidth } = options;
        doc.setFontSize(size).setTextColor(color).setFont(FONT, style);
        doc.text(text, x, y, { align, maxWidth });
    };

    const drawHeader = () => {
        drawStyledText(t('app_title'), MARGIN, 15, { size: 16, color: TEXT_COLOR, style: 'bold' });
        drawStyledText(new Date().toLocaleDateString(), PAGE_WIDTH - MARGIN, 15, { size: 9, color: MUTED_COLOR, align: 'right' });
        y = 30;
    };
    
    const drawFooter = () => {
        const pageHeight = doc.internal.pageSize.getHeight();
        const footerLines = doc.splitTextToSize(t('welcome_disclaimer'), PAGE_WIDTH - (MARGIN * 2));
        drawStyledText(footerLines, MARGIN, pageHeight - 12, { size: 8, color: MUTED_COLOR });
    };

    const drawStaticGauge = (score: number) => {
        const centerX = 145, centerY = 70, radius = 25;
        let color = '#34c759'; // Success
        if (score >= 4 && score < 7) color = '#ff9500'; // Warning
        if (score >= 7) color = '#ff3b30'; // Danger
        const riskLabel = score >= 4 ? t('cbac_high') : t('cbac_low');

        const drawArcWithLines = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
            const segments = 50;
            const startRad = startDeg * Math.PI / 180;
            const endRad = endDeg * Math.PI / 180;
            const angleStep = (endRad - startRad) / segments;

            doc.moveTo( cx + r * Math.cos(startRad), cy + r * Math.sin(startRad) );
            for (let i = 1; i <= segments; i++) {
                const angle = startRad + i * angleStep;
                doc.lineTo( cx + r * Math.cos(angle), cy + r * Math.sin(angle) );
            }
            doc.stroke();
        };

        doc.setLineWidth(5);
        doc.setDrawColor(BORDER_COLOR);
        drawArcWithLines(centerX, centerY, radius, 180, 360);

        const scoreAngle = 180 + (score / 10 * 180);
        doc.setLineWidth(5);
        doc.setDrawColor(color);
        drawArcWithLines(centerX, centerY, radius, 180, scoreAngle);
        
        drawStyledText(String(score), centerX, centerY + 4, { size: 22, color: TEXT_COLOR, style: 'bold', align: 'center'});
        drawStyledText('/ 10', centerX + 12, centerY + 4, { size: 8, color: MUTED_COLOR });
        drawStyledText(riskLabel.toUpperCase(), centerX, centerY + 12, { size: 9, color: color, style: 'bold', align: 'center' });
    };

    const drawStaticRadar = (cx: number, cy: number, radius: number) => {
        const chartData = calculateRadarData(userData, t);
        const sides = chartData.length;
        const angle = (Math.PI * 2) / sides;
        const maxVal = 5;
        doc.setLineWidth(0.2).setDrawColor(BORDER_COLOR);
        for (let i = 1; i <= maxVal; i++) {
            const r = radius * (i / maxVal);
            const points: [number, number][] = Array.from({ length: sides }, (_, j) => [ cx + r * Math.sin(j * angle), cy - r * Math.cos(j * angle) ]);
            
            if (points.length > 0) {
                doc.moveTo(points[0][0], points[0][1]);
                for (let k = 1; k < points.length; k++) {
                    doc.lineTo(points[k][0], points[k][1]);
                }
                doc.lineTo(points[0][0], points[0][1]);
                doc.stroke();
            }
        }
        for(let i = 0; i < sides; i++) {
            doc.line(cx, cy, cx + radius * Math.sin(i * angle), cy - radius * Math.cos(i * angle));
            const labelPointX = cx + (radius + 5) * Math.sin(i * angle);
            const labelPointY = cy - (radius + 5) * Math.cos(i * angle);
            drawStyledText(chartData[i].label, labelPointX, labelPointY, { size: 8, color: MUTED_COLOR, align: 'center' });
        }
        const dataPoints: [number, number][] = chartData.map((d, i) => {
            const r = radius * (d.value / maxVal);
            return [ cx + r * Math.sin(i * angle), cy - r * Math.cos(i * angle) ];
        });
        doc.setFillColor(PRIMARY_COLOR).setDrawColor(PRIMARY_COLOR).setLineWidth(0.5);

        if (dataPoints.length > 0) {
            doc.moveTo(dataPoints[0][0], dataPoints[0][1]);
            for (let i = 1; i < dataPoints.length; i++) {
                doc.lineTo(dataPoints[i][0], dataPoints[i][1]);
            }
            doc.lineTo(dataPoints[0][0], dataPoints[0][1]);
            doc.fill();
            doc.stroke();
        }
    };
    
    const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > doc.internal.pageSize.getHeight() - 30) {
            drawFooter();
            doc.addPage();
            drawHeader();
        }
    };
    
    const drawKeyIndicators = () => {
        checkPageBreak(50);
        drawStyledText(t('pdf_key_indicators'), MARGIN, y, { size: 11, color: TEXT_COLOR, style: 'bold' });
        y += 5; doc.setDrawColor(BORDER_COLOR).line(MARGIN, y, PAGE_WIDTH - MARGIN, y); y += 8;

        const bmi = (userData.weight && userData.height) ? (userData.weight / ((userData.height / 100) ** 2)) : 0;
        let bmiStatusKey = 'bmi_obese';
        if (bmi < 18.5) bmiStatusKey = 'bmi_underweight';
        else if (bmi < 23) bmiStatusKey = 'bmi_normal';
        else if (bmi < 25) bmiStatusKey = 'bmi_overweight';
        
        const packYears = ((userData.smokingPacksPerDay || 0) * (userData.smokingYears || 0));
        let smokingStatusInfo = t(`smoking_status_${userData.smokingStatus}`);
        if (userData.smokingStatus !== 'never' && packYears > 0) {
            smokingStatusInfo += ` (${packYears} ${t('pack_years')})`;
        }
        
        const indicators = [
          { label: t('pdf_bmi_status'), value: `${bmi.toFixed(1)} (${t(bmiStatusKey)})` },
          { label: t('waist_label'), value: `${userData.waistCircumference} cm` },
          { label: t('pdf_tobacco_smoking'), value: smokingStatusInfo },
          { label: t('pdf_oral_tobacco'), value: userData.usesSmokelessTobacco ? t('yes') : t('no') },
          { label: t('alcohol_frequency_label'), value: t(`alcohol_frequency_${userData.alcoholFrequency}`) },
          { label: t('pdf_cooking_fuel'), value: t(`cooking_fuel_${userData.cookingFuelType}`) },
          { label: t('pdf_salt_intake_label'), value: t(`salt_${userData.saltIntake}`) },
          { label: t('pdf_physical_activity'), value: t(`activity_${userData.physicalActivity}`) },
        ];

        indicators.forEach(indicator => {
            drawStyledText(`${indicator.label}:`, MARGIN + 5, y, { size: 9, color: TEXT_COLOR, style: 'bold' });
            drawStyledText(indicator.value, MARGIN + 70, y, { size: 9, color: TEXT_COLOR });
            y += 7;
        });
        y += 5;
    };

    drawHeader();
    drawStyledText(t('pdf_patient_summary'), MARGIN, y, { size: 11, color: TEXT_COLOR, style: 'bold' });
    y += 5; doc.setDrawColor(BORDER_COLOR).line(MARGIN, y, PAGE_WIDTH - MARGIN, y); y += 10;
    
    const bmiVal = (userData.weight && userData.height) ? (userData.weight / ((userData.height / 100) ** 2)).toFixed(1) : 'N/A';
    
    drawStyledText(`${t('name_label')}:`, MARGIN, y, { size: 10, color: TEXT_COLOR, style: 'bold' });
    drawStyledText(userData.name, MARGIN + 35, y, { size: 10, color: TEXT_COLOR, maxWidth: 80 });
    drawStyledText(`${t('age_label')}:`, MARGIN, y + 7, { size: 10, color: TEXT_COLOR, style: 'bold' });
    drawStyledText(`${userData.age} ${t('years')}`, MARGIN + 35, y + 7, { size: 10, color: TEXT_COLOR });
    drawStyledText(`${t('gender_label')}:`, MARGIN, y + 14, { size: 10, color: TEXT_COLOR, style: 'bold' });
    drawStyledText(t(`gender_${userData.gender}`), MARGIN + 35, y + 14, { size: 10, color: TEXT_COLOR });
    drawStyledText('BMI:', MARGIN, y + 21, { size: 10, color: TEXT_COLOR, style: 'bold' });
    drawStyledText(String(bmiVal), MARGIN + 35, y + 21, { size: 10, color: TEXT_COLOR });
    drawStyledText(t('ncd_score'), 108, y-5, { size: 11, color: TEXT_COLOR, style: 'bold' });
    drawStaticGauge(results.cbacScore);
    y += 35;
    drawKeyIndicators();
    drawStyledText(t('radar_title'), PAGE_WIDTH / 2, y + 5, { size: 11, color: TEXT_COLOR, style: 'bold', align: 'center' });
    y += 10;
    drawStaticRadar(PAGE_WIDTH / 2, y + 45, 40);
    y += 95;
    checkPageBreak(20);
    drawStyledText(t('pdf_screening_recommendations'), MARGIN, y, { size: 11, color: TEXT_COLOR, style: 'bold' });
    y += 5; doc.setDrawColor(BORDER_COLOR).line(MARGIN, y, PAGE_WIDTH - MARGIN, y); y += 8;

    (results.recommendations || []).forEach(rec => {
        const priorityColor = rec.priority === 'high' ? PRIMARY_COLOR : MUTED_COLOR;
        checkPageBreak(25);
        doc.setFillColor(priorityColor).rect(MARGIN, y - 2, 2, 2, 'F');
        drawStyledText(rec.test, MARGIN + 5, y, { size: 10, color: TEXT_COLOR, style: 'bold' });
        if (rec.priority === 'high') {
            const tag = `[${t('priority_high')}]`;
            const titleWidth = doc.getTextWidth(rec.test);
            drawStyledText(tag, MARGIN + 8 + titleWidth, y, { size: 8, color: priorityColor, style: 'bold' });
        }
        y += 6;
        drawStyledText(`${rec.frequency}`, MARGIN + 5, y, { size: 9, color: MUTED_COLOR });
        y += 6;
        const reasonLines = doc.splitTextToSize(`Reason: ${rec.reason}`, PAGE_WIDTH - (MARGIN * 2) - 5);
        drawStyledText(reasonLines, MARGIN + 5, y, { size: 9, color: TEXT_COLOR });
        y += reasonLines.length * 5;
        y += 4;
    });

    drawFooter();
    
    if (outputType === 'save') {
        doc.save(`${sanitizeFilename(userData.name)}_Health_Report.pdf`);
    } else {
        return doc.output('blob');
    }
  };

  const handleShare = async () => {
    const riskLabel = results.cbacScore >= 4 ? t('cbac_high') : t('cbac_low');
    const highPriorityTests = highPriorityRecs.map(rec => `- ${rec.test}`).join('\n');

    const summary = `*My Health Screening Summary*\n\n` +
                    `*Name:* ${userData.name}\n` +
                    `*NCD Risk Score:* ${results.cbacScore}/10 (${riskLabel})\n\n` +
                    `*High-Priority Recommendations:*\n${highPriorityTests || 'None'}\n\n` +
                    `_Generated by the Preventive Health Advisor app._\n` +
                    `_${t('welcome_disclaimer')}_`;

    const pdfBlob = generatePDF('blob') as Blob;
    const pdfFile = new File([pdfBlob], `${userData.name}_Health_Report.pdf`, { type: 'application/pdf' });
    
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
            await navigator.share({
                title: `Health Report for ${userData.name}`,
                text: summary,
                files: [pdfFile],
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        // Fallback for desktop or unsupported browsers
        const encodedText = encodeURIComponent(summary);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    }
  };

  const handleOpenModal = (rec: Recommendation) => {
    setModalRec(rec);
  };
  
  const handleCloseModal = () => {
    setModalRec(null);
  };

  const details = modalRec ? getRecommendationDetails(modalRec.key) : [];

  return (
    <div className="step-content">
      <h2 className="step-header">{t('results_title_for')} {userData.name}</h2>
      <p className="step-subheader">{t('results_subtitle')}</p>
      
      <NCDRiskGauge score={results.cbacScore} />

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
      
      <div className="results-actions">
          <button onClick={onReset} className="btn btn-secondary">{t('start_over')}</button>
          <button onClick={() => generatePDF('save')} className="btn btn-primary">{t('export_pdf')}</button>
          <button onClick={handleShare} className="btn btn-whatsapp"><WhatsAppIcon /> Share</button>
      </div>

      <Modal isOpen={!!modalRec} onClose={handleCloseModal}>
        {modalRec && (
            <>
                <div className="modal-header">
                    <p className="modal-category">{modalRec.category}</p>
                    <h2>{modalRec.test}</h2>
                    <p className="modal-frequency">{modalRec.frequency}</p>
                </div>
                <div className="modal-body">
                    {details.map((detail, index) => (
                        <div key={index} style={{ marginBottom: '1rem' }}>
                            <h4>{detail.title}</h4>
                            <p>{detail.content}</p>
                        </div>
                    ))}
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