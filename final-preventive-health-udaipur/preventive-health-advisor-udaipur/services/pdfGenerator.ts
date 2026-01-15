
import type { AnalysisResponse, UserData, Recommendation } from '../types.ts';
import { calculateRadarData } from './chartUtils.ts';
import { getBiometricAnalysis } from './analysisUtils.ts';
import { t } from '../locales/index.ts';
import { getRecommendationDetails } from '../locales/recommendations.ts';

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

// We define the jsPDF type locally or use 'any' to avoid top-level import types causing bundling issues
type jsPDFInstance = any; 

/**
 * Helper to draw a semi-circle gauge for the risk score
 */
const drawRiskGauge = (doc: jsPDFInstance, cx: number, cy: number, r: number, score: number, theme: PDFTheme) => {
    // Draw Background Arc (Grey)
    doc.setDrawColor('#e0e0e0');
    doc.setLineWidth(3);
    
    const drawArc = (sAngle: number, eAngle: number, color: string) => {
        doc.setDrawColor(color);
        const steps = 30;
        const stepSize = (eAngle - sAngle) / steps;
        
        let lx = cx + r * Math.cos(sAngle);
        let ly = cy - r * Math.sin(sAngle); // PDF Y axis is inverted relative to standard cartesian for sin

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
    
    // DYNAMIC IMPORT: Load the heavy PDF library only when this function is actually called
    const { jsPDF } = await import('jspdf');

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
        doc.text(t('app_title').toUpperCase(), MARGIN, 18);

        doc.setFontSize(9);
        doc.setFont('Helvetica', 'normal');
        doc.text(t('welcome_institution'), MARGIN, 26);
        
        // Right Side Slogans
        doc.setFontSize(8);
        doc.setFont('Helvetica', 'bolditalic');
        doc.text(`"${t('header_slogan_1')}"`, PAGE_WIDTH - MARGIN, 16, { align: 'right' });
        doc.text(`"${t('header_slogan_2')}"`, PAGE_WIDTH - MARGIN, 22, { align: 'right' });
        
        // Date Pill (Moved slightly down)
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(PAGE_WIDTH - MARGIN - 40, 30, 40, 8, 4, 4, 'F');
        doc.setTextColor(C_PRIMARY);
        doc.setFontSize(8);
        doc.setFont('Helvetica', 'bold');
        doc.text(new Date().toLocaleDateString(), PAGE_WIDTH - MARGIN - 20, 35, { align: 'center' });

        cursorY = 60;
    };

    const drawFooter = () => {
        const pageCount = doc.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Draw Medical Legal Disclaimer ONLY on Page 1 at the very bottom
            if (i === 1) {
                const disclaimerY = PAGE_HEIGHT - 32;
                doc.setFontSize(7);
                doc.setTextColor('#78909c'); // Light Grey for disclaimer
                doc.setFont('Helvetica', 'italic');
                const disclaimerLines = doc.splitTextToSize(t('pdf_disclaimer_page1'), CONTENT_WIDTH);
                doc.text(disclaimerLines, MARGIN, disclaimerY);
            }

            const footerY = PAGE_HEIGHT - 22;
            
            // Footer Separator
            doc.setDrawColor(C_BORDER);
            doc.line(MARGIN, footerY, PAGE_WIDTH - MARGIN, footerY);

            // Left Side: Initiative & Doctor
            doc.setFontSize(8);
            doc.setTextColor(C_TEXT);
            doc.setFont('Helvetica', 'bold');
            doc.text(t('footer_init_by'), MARGIN, footerY + 5);
            
            doc.setFontSize(7);
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(C_MUTED);
            doc.text(t('footer_role_1'), MARGIN, footerY + 9);
            doc.text(t('footer_role_2'), MARGIN, footerY + 13);

            // Right Side: Partners
            doc.setFontSize(8);
            doc.setTextColor(C_TEXT);
            doc.setFont('Helvetica', 'bold');
            doc.text(t('footer_partner_1'), PAGE_WIDTH - MARGIN, footerY + 5, { align: 'right' });

            doc.setFontSize(7);
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(C_MUTED);
            const partner2Lines = doc.splitTextToSize(t('footer_partner_2'), 80);
            doc.text(partner2Lines, PAGE_WIDTH - MARGIN, footerY + 9, { align: 'right' });

            // Center Slogan
            doc.setFontSize(8);
            doc.setTextColor(C_PRIMARY);
            doc.setFont('Helvetica', 'bolditalic');
            doc.text(`"${t('footer_slogan_1')}"`, PAGE_WIDTH / 2, footerY + 18, { align: 'center' });
            
            // Page Number (Bottom Right Corner)
            doc.setFontSize(7);
            doc.setTextColor(C_MUTED);
            doc.setFont('Helvetica', 'normal');
            doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 5, { align: 'right' });
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
        
        const packYears = (((userData.smokingSticksPerDay || 0) / 20) * (userData.smokingYears || 0));
        let smokingStatusInfo = t(`smoking_status_${userData.smokingStatus}`);
        if (userData.smokingStatus !== 'never' && packYears > 0) {
            smokingStatusInfo += ` (${packYears.toFixed(1)} py)`;
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
        
        const highPriorityRecs = results.recommendations.filter(r => r.priority === 'high');
        const routineRecs = results.recommendations.filter(r => r.priority === 'normal');

        if (highPriorityRecs.length === 0 && routineRecs.length === 0) {
            doc.setFont('Helvetica', 'italic');
            doc.setTextColor(C_MUTED);
            doc.text("No specific recommendations found.", MARGIN, cursorY);
            return;
        }

        // --- PART A: Draw High Priority (Full Width with Scientific Details) ---
        if (highPriorityRecs.length > 0) {
            highPriorityRecs.forEach(rec => {
                // 1. Fetch Scientific Details
                const details = getRecommendationDetails(rec.key);
                
                // 2. Prepare Text Wrapping
                doc.setFontSize(11); doc.setFont('Helvetica', 'bold');
                const titleLines = doc.splitTextToSize(rec.test, CONTENT_WIDTH - 20);
                
                doc.setFontSize(9); doc.setFont('Helvetica', 'bold');
                const freqLines = doc.splitTextToSize(rec.frequency, CONTENT_WIDTH - 20);

                doc.setFontSize(10); doc.setFont('Helvetica', 'normal');
                const reasonLines = doc.splitTextToSize(rec.reason, CONTENT_WIDTH - 20);

                // 3. Prepare Detail Text Blocks
                let detailsHeight = 0;
                type ProcessedDetail = { tLines: string[], cLines: string[], blockHeight: number };
                const processedDetails: ProcessedDetail[] = [];
                
                details.forEach(d => {
                    if ('title' in d) {
                        doc.setFontSize(8); doc.setFont('Helvetica', 'bold');
                        const tLines = doc.splitTextToSize(d.title.toUpperCase(), CONTENT_WIDTH - 20);
                        doc.setFontSize(9); doc.setFont('Helvetica', 'normal');
                        const cLines = doc.splitTextToSize(d.content, CONTENT_WIDTH - 20);
                        const blockHeight = (tLines.length * 3.5) + (cLines.length * 4) + 4; // Spacing
                        detailsHeight += blockHeight;
                        processedDetails.push({ tLines, cLines, blockHeight });
                    }
                });

                // 4. Calculate Total Card Height
                // TopPad(10) + Title + Gap(4) + Freq + Gap(4) + Reason + Gap(6)
                const headerHeight = 10 + (titleLines.length * 5) + 4 + (freqLines.length * 4) + 4 + (reasonLines.length * 4.5) + 6;
                let totalCardHeight = headerHeight + 5; // Base height
                
                if (processedDetails.length > 0) {
                    totalCardHeight += 5 + detailsHeight; // Divider space + details
                }

                // 5. Page Break Check
                if (cursorY + totalCardHeight > PAGE_HEIGHT - 35) addPage();

                // 6. Draw Card Background (Red tint for High Risk)
                doc.setFillColor('#fff5f5'); // Light red bg
                doc.setDrawColor(C_BORDER);
                doc.rect(MARGIN, cursorY, CONTENT_WIDTH, totalCardHeight, 'F');
                // Left Border
                doc.setFillColor(theme.danger);
                doc.rect(MARGIN, cursorY, 2, totalCardHeight, 'F');
                doc.setDrawColor(C_BORDER);
                doc.rect(MARGIN, cursorY, CONTENT_WIDTH, totalCardHeight, 'S'); // Outline

                // 7. Render Text
                let textY = cursorY + 10;
                const textX = MARGIN + 8;
                
                // Priority Tag
                doc.setTextColor(theme.danger);
                doc.setFontSize(7); doc.setFont('Helvetica', 'bold');
                doc.text(t('priority_high').toUpperCase(), textX, textY - 3);

                // Title
                doc.setTextColor(C_TEXT);
                doc.setFontSize(11); doc.setFont('Helvetica', 'bold');
                doc.text(titleLines, textX, textY);
                textY += (titleLines.length * 5) + 4;

                // Frequency
                doc.setTextColor(C_MUTED);
                doc.setFontSize(9); doc.setFont('Helvetica', 'bold');
                doc.text(freqLines, textX, textY);
                textY += (freqLines.length * 4) + 4;
                
                // Reason
                doc.setTextColor(C_TEXT);
                doc.setFontSize(10); doc.setFont('Helvetica', 'normal');
                doc.text(reasonLines, textX, textY);
                textY += (reasonLines.length * 4.5) + 6;

                // Scientific Details
                if (processedDetails.length > 0) {
                    // Divider
                    doc.setDrawColor('#e0e0e0');
                    doc.setLineWidth(0.5);
                    doc.line(textX, textY, MARGIN + CONTENT_WIDTH - 10, textY);
                    textY += 6;

                    processedDetails.forEach(d => {
                        // Detail Title
                        doc.setTextColor(C_MUTED);
                        doc.setFontSize(8); doc.setFont('Helvetica', 'bold');
                        doc.text(d.tLines, textX, textY);
                        textY += (d.tLines.length * 3.5);

                        // Detail Content
                        doc.setTextColor(C_TEXT);
                        doc.setFontSize(9); doc.setFont('Helvetica', 'normal');
                        doc.text(d.cLines, textX, textY);
                        textY += (d.cLines.length * 4) + 4; 
                    });
                }

                cursorY += totalCardHeight + 8; // Move cursor for next card
            });
        }

        // --- PART B: Draw Routine (2-Column Grid) ---
        if (routineRecs.length > 0) {
            // Need a bit of separation if we just drew high priority items
            if (highPriorityRecs.length > 0) cursorY += 5;

            const colGap = 10;
            const colWidth = (CONTENT_WIDTH - colGap) / 2;
            let col1Y = cursorY;
            let col2Y = cursorY;
            let currentCol = 0; // 0=Left, 1=Right

            routineRecs.forEach(rec => {
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
                if (y + cardHeight > PAGE_HEIGHT - 35) {
                    addPage();
                    col1Y = cursorY;
                    col2Y = cursorY;
                    currentCol = 0;
                }

                // Recalculate Y after potential page break
                const finalY = currentCol === 0 ? col1Y : col2Y;
                const finalX = currentCol === 0 ? MARGIN : MARGIN + colWidth + colGap;

                // Card Background
                doc.setFillColor('#f8f9fa');
                doc.setDrawColor(C_BORDER);
                doc.rect(finalX, finalY, colWidth, cardHeight, 'F');
                // Side Border (Primary Color)
                doc.setFillColor(C_PRIMARY);
                doc.rect(finalX, finalY, 2, cardHeight, 'F');
                
                let innerY = finalY + 10;
                const textX = finalX + 8;

                // Title
                doc.setTextColor(C_TEXT);
                doc.setFontSize(10); doc.setFont('Helvetica', 'bold');
                doc.text(titleLines, textX, innerY);
                innerY += (titleLines.length * 4) + 4;

                // Freq
                doc.setTextColor(C_MUTED);
                doc.setFontSize(9); doc.setFont('Helvetica', 'italic');
                doc.text(freqLines, textX, innerY);
                innerY += (freqLines.length * 4) + 4;

                // Reason
                doc.setTextColor(C_TEXT);
                doc.setFontSize(9); doc.setFont('Helvetica', 'normal');
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
            
            // Sync main cursor to the bottom of the longest column
            cursorY = Math.max(col1Y, col2Y) + 20;
        }
    };

    const drawReferralBox = () => {
        // Referral Box Height approx 40mm
        if (cursorY > PAGE_HEIGHT - 65) addPage();

        // Background
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(C_PRIMARY);
        doc.setLineWidth(1);
        doc.roundedRect(MARGIN, cursorY, CONTENT_WIDTH, 40, 2, 2, 'S'); // Stroke only with border

        let innerY = cursorY + 10;
        const col1X = MARGIN + 10;
        const col2X = PAGE_WIDTH / 2 + 5;

        // Title
        doc.setFontSize(12);
        doc.setTextColor(C_PRIMARY);
        doc.setFont('Helvetica', 'bold');
        doc.text(t('clinic_title'), col1X, innerY);
        
        // Location
        doc.setFontSize(9);
        doc.setTextColor(C_TEXT);
        doc.setFont('Helvetica', 'normal');
        const locLines = doc.splitTextToSize(t('clinic_location'), (CONTENT_WIDTH / 2) - 20);
        doc.text(locLines, col1X, innerY + 6);
        
        // --- Right Column: Timings & Services ---
        innerY = cursorY + 10;
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.text("OPD TIMINGS:", col2X, innerY);
        
        doc.setFont('Helvetica', 'normal');
        doc.text(t('clinic_timings'), col2X, innerY + 5);
        doc.text(t('clinic_closed'), col2X, innerY + 9);
        
        doc.setFont('Helvetica', 'bold');
        doc.text("SERVICES:", col2X, innerY + 16);
        
        doc.setFont('Helvetica', 'normal');
        const serviceLines = doc.splitTextToSize(t('clinic_services'), (CONTENT_WIDTH / 2) - 15);
        doc.text(serviceLines, col2X, innerY + 21);
    };

    // --- Execution Pipeline ---
    drawHeader();
    drawPatientProfile();
    drawKeyIndicatorsAndRadar();
    drawRecommendations();
    drawReferralBox();
    drawFooter(); // Draws footer on all pages

    return doc.output('blob');
};
