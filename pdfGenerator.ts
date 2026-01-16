
import type { AnalysisResponse, UserData, Recommendation } from '../types.ts';
import { t } from '../locales/index.ts';
import { DISEASE_CONDITIONS } from '../constants.ts';

// --- Constants ---
const MARGIN = 20; 
const PAGE_HEIGHT = 297; 
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

type jsPDFInstance = any; 

/**
 * Draws a simplified radar chart on the PDF
 */
const drawRadarChartPDF = (doc: jsPDFInstance, cx: number, cy: number, r: number, userData: UserData, theme: any) => {
    const sides = 5;
    const angleSlice = (Math.PI * 2) / sides;
    const maxVal = 5;

    // Grid
    doc.setDrawColor('#cbd5e1');
    doc.setLineWidth(0.1);
    for (let level = 1; level <= maxVal; level++) {
        const lr = r * (level / maxVal);
        for (let i = 0; i < sides; i++) {
            const x1 = cx + lr * Math.sin(i * angleSlice);
            const y1 = cy - lr * Math.cos(i * angleSlice);
            const x2 = cx + lr * Math.sin((i + 1) * angleSlice);
            const y2 = cy - lr * Math.cos((i + 1) * angleSlice);
            doc.line(x1, y1, x2, y2);
        }
    }

    // Data Calculation Logic
    const bmiVal = (userData.height && userData.weight) ? userData.weight / ((userData.height / 100) ** 2) : 0;
    const biometricsVal = bmiVal >= 25 ? 5 : (bmiVal >= 23 ? 3 : 1);
    const habitsVal = (userData.smokingStatus !== 'never' || userData.usesSmokelessTobacco) ? 5 : (userData.alcoholFrequency !== 'none' ? 3 : 1);
    const lifestyleVal = userData.physicalActivity === 'sedentary' ? 4 : 1;
    const familyVal = (userData.familyHistory.length > 0) ? 4 : 1;
    const envVal = userData.cookingFuelType === 'biomass' ? 4 : 1;
    
    const values = [biometricsVal, habitsVal, lifestyleVal, familyVal, envVal];
    
    doc.setFillColor(theme.primary);
    doc.setDrawColor(theme.primary);
    doc.setLineWidth(1);
    
    const points: [number, number][] = values.map((v, i) => {
        const vr = r * (v / maxVal);
        return [cx + vr * Math.sin(i * angleSlice), cy - vr * Math.cos(i * angleSlice)];
    });

    doc.setAlpha(0.2);
    doc.fill();
    doc.setAlpha(1.0);
    
    for (let i = 0; i < points.length; i++) {
        const next = points[(i + 1) % points.length];
        doc.line(points[i][0], points[i][1], next[0], next[1]);
    }
    
    // Labels
    doc.setFontSize(7);
    doc.setTextColor('#64748b');
    const labels = ["Biometrics", "Habits", "Lifestyle", "Family", "Env"];
    labels.forEach((l, i) => {
        const lx = cx + (r + 8) * Math.sin(i * angleSlice);
        const ly = cy - (r + 8) * Math.cos(i * angleSlice);
        doc.text(l, lx, ly, { align: 'center' });
    });
};

export const generateHealthReportPDF = async (
    userData: UserData, 
    results: AnalysisResponse, 
    theme: any
): Promise<Blob | void> => {
    
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let cursorY = 0;

    const C_PRIMARY = theme.primary;
    const C_TEXT = '#1e293b';
    const C_TEXT_LIGHT = '#64748b';
    const C_BORDER = '#e2e8f0';
    const C_BG_SECTION = '#f8fafc';

    const addPage = () => {
        doc.addPage();
        cursorY = 20;
    };

    const drawHeader = () => {
        doc.setFillColor(C_PRIMARY);
        doc.rect(0, 0, 6, PAGE_HEIGHT, 'F');
        doc.setFontSize(22);
        doc.setTextColor(C_PRIMARY);
        doc.setFont('Helvetica', 'bold');
        doc.text(t('app_title').toUpperCase(), MARGIN, 25);
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(C_TEXT_LIGHT);
        doc.text(t('welcome_institution'), MARGIN, 32);
        const dateStr = new Date().toLocaleDateString();
        doc.text(`Date: ${dateStr}`, PAGE_WIDTH - MARGIN, 25, { align: 'right' });
        doc.setDrawColor(C_BORDER);
        doc.setLineWidth(0.5);
        doc.line(MARGIN, 40, PAGE_WIDTH - MARGIN, 40);
        cursorY = 50;
    };

    const drawFooter = () => {
        const pageCount = doc.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const footerY = PAGE_HEIGHT - 15;
            doc.setDrawColor(C_BORDER);
            doc.line(MARGIN, footerY, PAGE_WIDTH - MARGIN, footerY);
            doc.setFontSize(8);
            doc.setTextColor(C_TEXT_LIGHT);
            doc.text(t('footer_init_by') + " | " + t('footer_partner_1'), MARGIN, footerY + 5);
            doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH - MARGIN, footerY + 5, { align: 'right' });
        }
    };

    const drawSectionHeader = (title: string) => {
        if (cursorY > PAGE_HEIGHT - 50) addPage();
        cursorY += 5;
        doc.setFontSize(14);
        doc.setTextColor(C_PRIMARY);
        doc.setFont('Helvetica', 'bold');
        doc.text(title.toUpperCase(), MARGIN, cursorY);
        doc.setDrawColor(C_BORDER);
        doc.line(MARGIN, cursorY + 3, PAGE_WIDTH - MARGIN, cursorY + 3);
        cursorY += 12;
    };

    // --- PAGE 1: CLINICAL DASHBOARD ---
    drawHeader();
    
    // Patient Profile Box
    doc.setFillColor(C_BG_SECTION);
    doc.roundedRect(MARGIN, cursorY, CONTENT_WIDTH, 45, 3, 3, 'F');
    doc.setTextColor(C_TEXT);
    doc.setFontSize(18);
    doc.setFont('Helvetica', 'bold');
    doc.text(userData.name, MARGIN + 10, cursorY + 15);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(C_TEXT_LIGHT);
    doc.text(`${userData.age} Yrs | ${t(`gender_${userData.gender}`)}`, MARGIN + 10, cursorY + 23);
    
    // Key Radar Visual
    drawRadarChartPDF(doc, PAGE_WIDTH - MARGIN - 40, cursorY + 22, 18, userData, theme);
    cursorY += 55;

    // CBAC Score Breakdown Box
    drawSectionHeader(t('pdf_score_breakdown_title'));
    doc.setFillColor('#ffffff');
    doc.setDrawColor(C_BORDER);
    doc.roundedRect(MARGIN, cursorY, CONTENT_WIDTH, 90, 4, 4, 'FD');
    
    const factors = [
        { label: "Age Grouping", pts: (userData.age || 0) >= 60 ? 4 : ((userData.age || 0) >= 50 ? 3 : ((userData.age || 0) >= 40 ? 2 : 1)) },
        { label: "Tobacco Usage", pts: (userData.smokingStatus === 'current' || userData.usesSmokelessTobacco) ? 2 : (userData.smokingStatus === 'former' ? 1 : 0) },
        { label: "Alcohol Consumption", pts: userData.alcoholFrequency === 'high' ? 1 : 0 },
        { label: "Waist Circumference", pts: results.cbacScore >= 4 ? 1 : 0 },
        { label: "Physical Activity", pts: userData.physicalActivity === 'sedentary' ? 1 : 0 },
        { label: "Family History (NCDs)", pts: userData.familyHistory.length > 0 ? 2 : 0 },
        { label: "Personal Medical History", pts: userData.personalConditions.length > 0 ? 2 : 0 }
    ];

    let fy = cursorY + 12;
    factors.forEach((f) => {
        doc.setFontSize(10);
        doc.setTextColor(C_TEXT);
        doc.setFont('Helvetica', 'normal');
        doc.text(f.label, MARGIN + 10, fy);
        
        const ptsColor = f.pts > 0 ? theme.danger : theme.success;
        doc.setFillColor(ptsColor);
        doc.roundedRect(PAGE_WIDTH - MARGIN - 30, fy - 4, 20, 6, 3, 3, 'F');
        doc.setTextColor('#ffffff');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`+${f.pts} pts`, PAGE_WIDTH - MARGIN - 20, fy, { align: 'center' });
        fy += 11;
    });

    fy += 5;
    doc.setTextColor(C_TEXT);
    doc.setFontSize(12);
    doc.text(`TOTAL CBAC RISK SCORE: ${results.cbacScore}/10`, MARGIN + 10, fy);
    
    cursorY += 100;

    // --- PAGE 2+: RECOMMENDATIONS ---
    addPage();
    drawHeader();
    drawSectionHeader(t('pdf_screening_recommendations'));
    
    results.recommendations.forEach(rec => {
        const reasonLines = doc.splitTextToSize(rec.reason, CONTENT_WIDTH - 20);
        const cardH = 25 + (reasonLines.length * 5); 
        
        // Dynamic Page Break Check
        if (cursorY + cardH > PAGE_HEIGHT - 45) {
            addPage();
            drawHeader();
            cursorY += 10;
        }
        
        doc.setFillColor('#ffffff');
        doc.setDrawColor(rec.priority === 'high' ? theme.danger : C_BORDER);
        doc.setLineWidth(0.5);
        doc.roundedRect(MARGIN, cursorY, CONTENT_WIDTH, cardH, 2, 2, 'S');
        
        doc.setTextColor(C_TEXT);
        doc.setFontSize(11);
        doc.setFont('Helvetica', 'bold');
        doc.text(rec.test, MARGIN + 8, cursorY + 10);
        
        doc.setTextColor(C_PRIMARY);
        doc.setFontSize(9);
        doc.text(rec.frequency, MARGIN + 8, cursorY + 17);
        
        doc.setTextColor(C_TEXT_LIGHT);
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'normal');
        doc.text(reasonLines, MARGIN + 8, cursorY + 23);
        
        cursorY += cardH + 5;
    });

    // --- MANDATORY PROFESSIONAL DISCLAIMER BOX ---
    const disclaimerBody = t('pdf_clinical_disclaimer_body');
    const disclaimerLines = doc.splitTextToSize(disclaimerBody, CONTENT_WIDTH - 20);
    const boxH = 25 + (disclaimerLines.length * 5);

    // Ensure space for the box or push to next page
    if (cursorY + boxH > PAGE_HEIGHT - 45) {
        addPage();
        drawHeader();
        cursorY += 10;
    }

    doc.setFillColor('#fffafa'); 
    doc.setDrawColor(theme.danger);
    doc.setLineWidth(1.2);
    doc.roundedRect(MARGIN, cursorY, CONTENT_WIDTH, boxH, 4, 4, 'FD');

    doc.setTextColor(theme.danger);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text(t('pdf_clinical_disclaimer_title'), MARGIN + 10, cursorY + 10);

    doc.setTextColor(C_TEXT);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(disclaimerLines, MARGIN + 10, cursorY + 18, { lineHeightFactor: 1.25 });
    
    cursorY += boxH + 15;

    // --- LAST PAGE: PROFESSIONAL REFERRAL LETTER ---
    addPage();
    
    // Header for Referral
    doc.setFontSize(9); 
    doc.setTextColor(C_TEXT_LIGHT);
    const dateStrReferral = new Date().toLocaleDateString();
    doc.text(`Date: ${dateStrReferral}`, MARGIN, 15);
    const refId = `REF-${Math.floor(Date.now() / 1000).toString(36).toUpperCase()}`;
    doc.text(`Ref ID: ${refId}`, PAGE_WIDTH - MARGIN, 15, { align: 'right' });

    cursorY = 30;

    // Formal Title
    doc.setFontSize(16); 
    doc.setFont('Helvetica', 'bold'); 
    doc.setTextColor(C_TEXT);
    doc.text(t('pdf_referral_title'), MARGIN, cursorY);
    doc.setDrawColor(C_TEXT); 
    doc.setLineWidth(0.7);
    doc.line(MARGIN, cursorY + 1.5, MARGIN + 98, cursorY + 1.5);
    cursorY += 20;

    // Recipient Address
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(t('pdf_referral_to'), MARGIN, cursorY);
    cursorY += 25;

    // Subject
    doc.setFont('Helvetica', 'bold');
    doc.text(t('pdf_referral_subject'), MARGIN, cursorY);
    cursorY += 15;

    // Body
    doc.setFont('Helvetica', 'normal');
    const bodyText = t('pdf_referral_intro');
    const bodyLines = doc.splitTextToSize(bodyText, CONTENT_WIDTH);
    doc.text(bodyLines, MARGIN, cursorY);
    cursorY += 20;

    // Patient Info
    doc.setFont('Helvetica', 'bold');
    doc.text(t('pdf_referral_patient'), MARGIN, cursorY);
    doc.setFont('Helvetica', 'normal');
    doc.text(`: ${userData.name} , ${userData.age} yrs, ${t(`gender_${userData.gender}`)}`, MARGIN + 45, cursorY);
    cursorY += 12;

    // Clinical Findings
    doc.setFont('Helvetica', 'bold');
    doc.text(t('pdf_referral_findings'), MARGIN, cursorY);
    doc.setFont('Helvetica', 'normal');
    const bmiVal = (userData.height && userData.weight) ? (userData.weight / ((userData.height / 100) ** 2)).toFixed(1) : "N/A";
    const findingsSummary = `CBAC Score: ${results.cbacScore}/10 (${results.cbacScore >= 4 ? 'High Risk' : 'Low Risk'}). BMI: ${bmiVal}. Tobacco: ${userData.smokingStatus === 'never' ? 'No' : 'Yes'}. Reported History: ${userData.personalConditions.length > 0 ? userData.personalConditions.join(", ") : 'None'}.`;
    const findingLines = doc.splitTextToSize(findingsSummary, CONTENT_WIDTH - 50);
    doc.text(findingLines, MARGIN + 45, cursorY);
    cursorY += (findingLines.length * 5) + 8;

    if (userData.personalConditions.includes(DISEASE_CONDITIONS.DIABETES_TYPE_2)) {
        doc.setTextColor(theme.danger);
        doc.setFont('Helvetica', 'bold');
        doc.text(`HIGH RISK MEDICAL HISTORY: ${DISEASE_CONDITIONS.DIABETES_TYPE_2}`, MARGIN + 45, cursorY);
        doc.setTextColor(C_TEXT);
        cursorY += 15;
    }

    // Requested Checklist
    doc.setFont('Helvetica', 'bold');
    doc.text(t('pdf_referral_req'), MARGIN, cursorY);
    cursorY += 10;
    const priorityTests = results.recommendations.filter(r => r.priority === 'high').slice(0, 6);
    priorityTests.forEach(testObj => {
        if (cursorY > PAGE_HEIGHT - 90) return; 
        doc.setFont('Helvetica', 'normal');
        doc.text(`• ${testObj.test}`, MARGIN + 12, cursorY);
        cursorY += 7;
    });

    // Signature Area
    cursorY = PAGE_HEIGHT - 95;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("Professional Advisor Tool", PAGE_WIDTH - MARGIN, cursorY, { align: 'right' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    const signOffLines = t('pdf_referral_sign').split('\n');
    signOffLines.forEach((line, i) => {
        doc.text(line, PAGE_WIDTH - MARGIN, cursorY + 6 + (i * 4.5), { align: 'right' });
    });
    
    // Final Clinic Use Section
    cursorY = PAGE_HEIGHT - 65;
    doc.setDrawColor(C_BORDER);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);
    cursorY += 12;
    doc.setFontSize(11); doc.setFont('Helvetica', 'bold');
    doc.text(t('pdf_clinic_use_title'), MARGIN, cursorY);
    cursorY += 15;
    
    doc.setFontSize(9); doc.setFont('Helvetica', 'normal'); doc.setTextColor(C_TEXT_LIGHT);
    const clinicFields = [t('pdf_clinic_bp'), t('pdf_clinic_sugar'), t('pdf_clinic_weight'), t('pdf_clinic_height')];
    clinicFields.forEach((f, i) => {
        const xPos = MARGIN + (i % 2 === 0 ? 0 : 90);
        const yPos = cursorY + (Math.floor(i / 2) * 12);
        doc.text(`${f}: ________________`, xPos, yPos);
    });

    drawFooter();
    return doc.output('blob');
};
