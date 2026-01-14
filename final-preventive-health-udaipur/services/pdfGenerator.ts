
import { jsPDF } from 'jspdf';
import type { AnalysisResponse, UserData, Recommendation, BiometricAnalysis } from '../types.ts';
import { calculateRadarData } from './chartUtils.ts';
import { getBiometricAnalysis } from './analysisUtils.ts';
import { t } from '../locales/index.ts';

// --- Constants ---
const MARGIN = 15;
const PAGE_HEIGHT = 297; // A4 Height in mm
const PAGE_WIDTH = 210;  // A4 Width in mm
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

interface PDFTheme {
    primary: string;
    primarySoft: string;
    danger: string;
    warning: string;
    success: string;
}

/**
 * Helper to draw a semi-circle gauge for the risk score
 */
const drawRiskGauge = (doc: jsPDF, cx: number, cy: number, r: number, score: number, theme: PDFTheme) => {
    const startAngle = Math.PI; // 180 degrees (Left)
    const endAngle = 0; // 0 degrees (Right)
    
    // Draw Background Arc (Grey)
    doc.setDrawColor('#e0e0e0');
    doc.setLineWidth(3);
    // Approximate arc with bezier curves or simple lines for small segments if jsPDF arc is tricky
    // jsPDF has an arc method in newer versions, but we'll use a reliable polyline approximation for compatibility
    
    const drawArc = (sAngle: number, eAngle: number, color: string) => {
        doc.setDrawColor(color);
        const steps = 30;
        const stepSize = (eAngle - sAngle) / steps;
        const points: number[] = [];
        
        // Move to start
        const xStart = cx + r * Math.cos(sAngle);
        const yStart = cy - r * Math.sin(sAngle); // PDF Y axis is inverted relative to standard cartesian for sin
        
        // Note: In PDF kit, Y increases downwards.
        // Math: x = cx + r * cos(a), y = cy - r * sin(a) works if 0 is right, PI is left, and we want UP arc
        
        let lx = xStart;
        let ly = yStart;

        for (let i = 1; i <= steps; i++) {
            const a = sAngle + (i * stepSize);
            const x = cx + r * Math.cos(a);
            const y = cy + r * Math.sin(a) * -1; // Flip Y for PDF coord system
            doc.line(lx, ly, x, y);
            lx = x;
            ly = y;
        }
    };

    // Background (180 to 0)
    drawArc(Math.PI, 0, '#e0e0e0');

    // Foreground (Score based)
    // Map score 0-10 to angle PI to 0
    const maxScore = 10;
    const scoreRatio = Math.min(score, maxScore) / maxScore;
    const scoreAngleEnd = Math.PI - (scoreRatio * Math.PI); // Start at PI, subtract to go clockwise towards 0
    
    let scoreColor = theme.success;
    if (score >= 4) scoreColor = theme.warning;
    if (score >= 7) scoreColor = theme.danger;

    drawArc(Math.PI, scoreAngleEnd, scoreColor);
    
    // Needle Pivot
    doc.setFillColor('#263238');
    doc.circle(cx, cy, 2, 'F');
};

export const generateHealthReportPDF = async (
    userData: UserData, 
    results: AnalysisResponse, 
    theme: PDFTheme
): Promise<Blob | void> => {
    
    // Simulate async delay for UI loader
    await new Promise(r => setTimeout(r, 50));

    const doc = new jsPDF();
    let cursorY = 0;

    // --- Biometrics Calc ---
    const biometricAnalysis = getBiometricAnalysis(userData);
    const bmiStatusKey = (parseFloat(biometricAnalysis.bmi.value) < 18.5) ? 'bmi_underweight' :
                         (parseFloat(biometricAnalysis.bmi.value) < 23) ? 'bmi_normal' :
                         (parseFloat(biometricAnalysis.bmi.value) < 25) ? 'bmi_overweight' : 'bmi_obese';


    // --- Colors ---
    const C_PRIMARY = theme.primary;
    const C_LIGHT = theme.primarySoft;
    const C_TEXT = '#263238';
    const C_MUTED = '#546e7a';
    const C_BORDER = '#cfd8dc';
    const C_HIGH = theme.danger;

    // --- Helper Functions ---
    const addPage = () => {
        doc.addPage();
        cursorY = 20;
    };

    const drawHeader = () => {
        doc.setFillColor(C_PRIMARY);
        doc.rect(0, 0, PAGE_WIDTH, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(t('app_title').toUpperCase(), MARGIN, 20);

        doc.setFontSize(10);
        doc.setFont('Helvetica', 'normal');
        doc.text(t('welcome_institution'), MARGIN, 30);
        
        // Date Pill
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(PAGE_WIDTH - MARGIN - 40, 12, 40, 10, 5, 5, 'F');
        doc.setTextColor(C_PRIMARY);
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'bold');
        doc.text(new Date().toLocaleDateString(), PAGE_WIDTH - MARGIN - 20, 18, { align: 'center' });

        cursorY = 60;
    };

    const drawFooter = () => {
        const pageCount = doc.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const footerY = PAGE_HEIGHT - 20;
            
            doc.setDrawColor(C_BORDER);
            doc.line(MARGIN, footerY, PAGE_WIDTH - MARGIN, footerY);

            doc.setFontSize(8);
            doc.setTextColor(C_MUTED);
            doc.setFont('Helvetica', 'normal');
            doc.text(t('pdf_footer_title'), MARGIN, footerY + 8);
            doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH - MARGIN, footerY + 8, { align: 'right' });
            
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(C_PRIMARY);
            doc.text("Dr. Narendra Rathore (MD), RNT Medical College", PAGE_WIDTH / 2, footerY + 14, { align: 'center' });
        }
    };

    const drawSectionHeader = (title: string) => {
        if (cursorY > PAGE_HEIGHT - 40) addPage();
        
        doc.setFontSize(12);
        doc.setTextColor(C_PRIMARY);
        doc.setFont('Helvetica', 'bold');
        doc.text(title.toUpperCase(), MARGIN, cursorY);
        
        doc.setDrawColor(C_PRIMARY);
        doc.setLineWidth(0.5);
        doc.line(MARGIN, cursorY + 3, MARGIN + 40, cursorY + 3);
        
        cursorY += 15;
    };

    const drawPatientProfile = () => {
        doc.setFillColor(C_LIGHT);
        doc.setDrawColor(C_BORDER);
        doc.roundedRect(MARGIN, cursorY, CONTENT_WIDTH, 45, 3, 3, 'FD');
        
        const contentY = cursorY + 15;
        
        // Name & Details
        doc.setTextColor(C_TEXT);
        doc.setFontSize(16);
        doc.setFont('Helvetica', 'bold');
        doc.text(userData.name, MARGIN + 10, contentY);
        
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(C_MUTED);
        doc.text(`${userData.age} ${t('years')}  |  ${t(`gender_${userData.gender}`)}`, MARGIN + 10, contentY + 7);

        // Vector Gauge
        const scoreX = PAGE_WIDTH - MARGIN - 30;
        const scoreY = cursorY + 35; // Base of the semi-circle
        const r = 15;

        drawRiskGauge(doc, scoreX, scoreY, r, results.cbacScore, theme);

        // Score Text
        doc.setFontSize(14);
        doc.setTextColor(C_TEXT);
        doc.setFont('Helvetica', 'bold');
        doc.text(String(results.cbacScore), scoreX, scoreY - 2, { align: 'center' });
        
        doc.setFontSize(7);
        doc.setTextColor(C_MUTED);
        doc.text("NCD RISK", scoreX, scoreY + 6, { align: 'center' });

        cursorY += 60;
    };

    const drawStaticRadar = (cx: number, cy: number, radius: number) => {
        const chartData = calculateRadarData(userData, t);
        const sides = chartData.length;
        const angle = (Math.PI * 2) / sides;
        const maxVal = 5;
        
        // Grid
        doc.setLineWidth(0.1);
        doc.setDrawColor(C_BORDER);
        for (let i = 1; i <= maxVal; i++) {
            const r = radius * (i / maxVal);
            const points: [number, number][] = Array.from({ length: sides }, (_, j) => [ cx + r * Math.sin(j * angle), cy - r * Math.cos(j * angle) ]);
            if (points.length > 0) {
                doc.moveTo(points[0][0], points[0][1]);
                for (let k = 1; k < points.length; k++) doc.lineTo(points[k][0], points[k][1]);
                doc.lineTo(points[0][0], points[0][1]);
                doc.stroke();
            }
        }
        
        // Data Poly
        const dataPoints: [number, number][] = chartData.map((d, i) => {
            const r = radius * (d.value / maxVal);
            return [ cx + r * Math.sin(i * angle), cy - r * Math.cos(i * angle) ];
        });
        
        doc.setFillColor(C_PRIMARY);
        doc.setDrawColor(C_PRIMARY);
        doc.setLineWidth(0.5);
        if (dataPoints.length > 0) {
            doc.moveTo(dataPoints[0][0], dataPoints[0][1]);
            for (let i = 1; i < dataPoints.length; i++) doc.lineTo(dataPoints[i][0], dataPoints[i][1]);
            doc.lineTo(dataPoints[0][0], dataPoints[0][1]);
            doc.stroke();
        }

        // Labels
        doc.setFontSize(7);
        doc.setTextColor(C_MUTED);
        chartData.forEach((d, i) => {
             const r = radius + 6;
             const x = cx + r * Math.sin(i * angle);
             const y = cy - r * Math.cos(i * angle);
             doc.text(d.label, x, y, { align: 'center', maxWidth: 20 });
        });
    };

    const drawKeyIndicatorsAndRadar = () => {
        drawSectionHeader(t('pdf_key_indicators'));

        const startY = cursorY;
        const colWidth = (CONTENT_WIDTH / 2) - 5;
        
        const packYears = ((userData.smokingPacksPerDay || 0) * (userData.smokingYears || 0));
        let smokingStatusInfo = t(`smoking_status_${userData.smokingStatus}`);
        if (userData.smokingStatus !== 'never' && packYears > 0) {
            smokingStatusInfo += ` (${packYears} py)`;
        }

        const indicators = [
            { label: "BMI Status", value: `${biometricAnalysis.bmi.value} (${t(bmiStatusKey)})` },
            { label: t('waist_label'), value: biometricAnalysis.waist.value },
            { label: t('smoking_status_label'), value: smokingStatusInfo },
            { label: t('alcohol_frequency_label'), value: t(`alcohol_frequency_${userData.alcoholFrequency}`) },
            { label: t('diet_habits_label'), value: userData.saltIntake === 'high' ? 'High Salt' : 'Healthy Salt' },
            { label: t('physical_activity_label'), value: t(`activity_${userData.physicalActivity}`) },
        ];

        let indY = startY;
        indicators.forEach(ind => {
            doc.setFontSize(9);
            doc.setTextColor(C_MUTED);
            doc.setFont('Helvetica', 'bold');
            doc.text(ind.label, MARGIN, indY);
            
            doc.setTextColor(C_TEXT);
            doc.setFont('Helvetica', 'normal');
            doc.text(ind.value, MARGIN + 60, indY); 
            indY += 10;
        });

        // Radar
        const radarCenterX = MARGIN + colWidth + 5 + (colWidth / 2);
        const radarCenterY = startY + 25;
        const radarRadius = 30;
        
        drawStaticRadar(radarCenterX, radarCenterY, radarRadius);
        
        cursorY = Math.max(indY, radarCenterY + radarRadius + 15) + 15;
    };

    const drawRecommendations = () => {
        drawSectionHeader(t('pdf_screening_recommendations'));
        
        const colGap = 10;
        const colWidth = (CONTENT_WIDTH - colGap) / 2;
        
        let col1Y = cursorY;
        let col2Y = cursorY;
        let currentCol = 0; // 0=Left, 1=Right

        const highPriorityRecs = results.recommendations.filter(r => r.priority === 'high');
        const routineRecs = results.recommendations.filter(r => r.priority === 'normal');
        const allRecs = [...highPriorityRecs, ...routineRecs];

        if (allRecs.length === 0) {
            doc.setFont('Helvetica', 'italic');
            doc.setTextColor(C_MUTED);
            doc.text("No specific recommendations found.", MARGIN, cursorY);
            return;
        }

        allRecs.forEach(rec => {
            // Determine X/Y based on column
            const x = currentCol === 0 ? MARGIN : MARGIN + colWidth + colGap;
            const y = currentCol === 0 ? col1Y : col2Y;
            
            // Text Calculation
            doc.setFontSize(10); doc.setFont('Helvetica', 'bold');
            const titleLines = doc.splitTextToSize(rec.test, colWidth - 10);
            
            doc.setFontSize(9); doc.setFont('Helvetica', 'italic');
            const freqLines = doc.splitTextToSize(rec.frequency, colWidth - 10);
            
            doc.setFontSize(9); doc.setFont('Helvetica', 'normal');
            const reasonLines = doc.splitTextToSize(rec.reason, colWidth - 10);
            
            // Dynamic Height
            const cardHeight = 10 + (titleLines.length * 4) + 4 + (freqLines.length * 4) + 4 + (reasonLines.length * 4) + 10;
            
            // Page Break Check
            if (y + cardHeight > PAGE_HEIGHT - 30) {
                addPage();
                col1Y = cursorY;
                col2Y = cursorY;
                currentCol = 0;
            }

            const finalY = currentCol === 0 ? col1Y : col2Y;
            const finalX = currentCol === 0 ? MARGIN : MARGIN + colWidth + colGap;

            const borderColor = rec.priority === 'high' ? C_HIGH : C_PRIMARY;
            const bgColor = rec.priority === 'high' ? '#fff5f5' : '#f8f9fa';
            
            // Card Background
            doc.setFillColor(bgColor);
            doc.setDrawColor(C_BORDER);
            doc.rect(finalX, finalY, colWidth, cardHeight, 'F');
            // Side Border
            doc.setFillColor(borderColor);
            doc.rect(finalX, finalY, 2, cardHeight, 'F');
            
            let innerY = finalY + 10;
            const textX = finalX + 8;
            
            if (rec.priority === 'high') {
                doc.setTextColor(C_HIGH);
                doc.setFontSize(7);
                doc.setFont('Helvetica', 'bold');
                doc.text(t('priority_high').toUpperCase(), textX, innerY - 3);
            }

            doc.setTextColor(C_TEXT);
            doc.setFontSize(10);
            doc.setFont('Helvetica', 'bold');
            doc.text(titleLines, textX, innerY);
            innerY += (titleLines.length * 4) + 4;

            doc.setTextColor(C_MUTED);
            doc.setFontSize(9);
            doc.setFont('Helvetica', 'italic');
            doc.text(freqLines, textX, innerY);
            innerY += (freqLines.length * 4) + 4;

            doc.setTextColor(C_TEXT);
            doc.setFontSize(9);
            doc.setFont('Helvetica', 'normal');
            doc.text(reasonLines, textX, innerY);
            
            // Update column cursor
            if (currentCol === 0) {
                col1Y += cardHeight + 8;
                currentCol = 1;
            } else {
                col2Y += cardHeight + 8;
                currentCol = 0;
            }
        });
        
        cursorY = Math.max(col1Y, col2Y) + 20;
    };

    const drawReferralBox = () => {
        if (cursorY > PAGE_HEIGHT - 50) addPage();

        doc.setDrawColor(C_PRIMARY);
        doc.setLineWidth(0.5);
        doc.setLineDash([2, 2], 0);
        doc.rect(MARGIN, cursorY, CONTENT_WIDTH, 35);
        doc.setLineDash([], 0);

        doc.setFontSize(11);
        doc.setTextColor(C_PRIMARY);
        doc.setFont('Helvetica', 'bold');
        doc.text("NEXT STEP: VISIT AROGYA CLINIC", MARGIN + 10, cursorY + 12);

        doc.setFontSize(9);
        doc.setTextColor(C_TEXT);
        doc.setFont('Helvetica', 'normal');
        doc.text("Room No. 5, Super Speciality Hospital, RNT Medical College, Udaipur.", MARGIN + 10, cursorY + 22);
    };

    // --- Execution Pipeline ---
    drawHeader();
    drawPatientProfile();
    drawKeyIndicatorsAndRadar();
    drawRecommendations();
    drawReferralBox();
    drawFooter();

    return doc.output('blob');
};
