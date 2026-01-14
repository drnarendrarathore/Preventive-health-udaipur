import type { UserData } from '../types.ts';
import { CLINICAL_THRESHOLDS } from '../constants.ts';
import { t } from '../locales/index.ts';

interface Insight {
    key: string;
    label: string;
    Icon: string;
}

export interface PrimaryInsights {
    positiveFinding: Insight | null;
    focusAreas: Insight[];
}

// These strings contain full SVG elements. 
// The regex in generateShareableCardDataUrl will extract the 'd' attributes for Canvas Path2D.
const ICONS = {
    ThumbsUp: `<path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.5c.806 0 1.533-.425 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0118 4.5v1.546a8.998 8.998 0 01-2.356 6.164l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06l3.5-3.5a.75.75 0 011.06 0l1.25 1.25a.75.75 0 001.06 0l3.5-3.5a.75.75 0 00-1.06-1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 00-1.06 0l-3.5 3.5a.75.75 0 001.06 1.06l3.5-3.5a.75.75 0 001.06 0l1.062 1.062a.75.75 0 011.06 0l3.5 3.5a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 00-1.06 0l-3.5 3.5a.75.75 0 001.06 1.06l3.5-3.5a.75.75 0 001.06 0l1.062 1.062a.75.75 0 011.06 0l3.5 3.5" />`,
    Smoking: `<path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636l-3.536 3.536m0 0a2.25 2.25 0 01-3.182 0l-1.06-1.061a2.25 2.25 0 010-3.182l3.535-3.536m-2.121 6.364l-3.536-3.536m0 0a2.25 2.25 0 01-3.182 0l-1.06-1.061a2.25 2.25 0 010-3.182l3.535-3.536M15.75 12.75l-3.536-3.536" /><path d="M9 15a6 6 0 016-6" /><path d="M15 15v5.25a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V15" />`,
    Weight: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.186.24c-1.908 0-3.824-.42-5.546-1.257l-2.65-1.325a1.125 1.125 0 01-.527-1.175l.91-3.64a1.125 1.125 0 011.175-.91l3.64.91a1.125 1.125 0 011.175-.527l1.325-2.65c.42-.84 1.122-1.5 1.908-1.908a5.988 5.988 0 012.186-.24c.482-.174 1.09-.378 1.202-.589L18.75 4.971z" />`,
    Waist: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /><path d="M12 9.75a3 3 0 11-3 3h6a3 3 0 11-3-3zM3 9.75a9.75 9.75 0 1119.5 0" />`,
    Sedentary: `<path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0L21 18.75m-11.963 0h11.963M4.5 15.75l-2.42-2.42a1.5 1.5 0 010-2.12l2.42-2.42M21 15.75l-2.42-2.42a1.5 1.5 0 000-2.12l2.42-2.42" />`,
    Alcohol: `<path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.75a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V6.75z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.092 1.209-.138 2.43-.138 3.662v4.448c0 4.309 3.491 7.8 7.8 7.8s7.8-3.491 7.8-7.8V12z" />`,
    Salt: `<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h3m-3 3h3m-3 3h3M3.75 6a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v10.5a.75.75 0 01-.75-.75h-15a.75.75 0 01-.75-.75V6z" />`,
    Dna: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />`,
    Biomass: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.45z" />`,
};

export function getPrimaryInsights(data: UserData): PrimaryInsights {
    const POSITIVE_FINDINGS_RANKED = [
        { key: 'activity', labelKey: 'positive_finding_activity', Icon: ICONS.ThumbsUp, condition: (d: UserData) => d.physicalActivity === 'active' || d.physicalActivity === 'moderate' },
        { key: 'no_smoking', labelKey: 'positive_finding_no_smoking', Icon: ICONS.ThumbsUp, condition: (d: UserData) => d.smokingStatus === 'never' && !d.usesSmokelessTobacco },
        { key: 'low_salt', labelKey: 'positive_finding_low_salt', Icon: ICONS.ThumbsUp, condition: (d: UserData) => d.saltIntake === 'low' },
        { key: 'no_alcohol', labelKey: 'positive_finding_no_alcohol', Icon: ICONS.ThumbsUp, condition: (d: UserData) => d.alcoholFrequency === 'none' },
        { key: 'healthy_bmi', labelKey: 'positive_finding_healthy_bmi', Icon: ICONS.ThumbsUp, condition: (d: UserData) => { if (!d.height || !d.weight) return false; const bmi = d.weight / ((d.height / 100) ** 2); return bmi >= 18.5 && bmi < CLINICAL_THRESHOLDS.BMI_NORMAL_UPPER; }},
    ];

    const RISK_FACTORS_RANKED = [
      { key: 'smoking', labelKey: 'risk_insight_smoking', Icon: ICONS.Smoking, condition: (d: UserData) => d.smokingStatus === 'current' || d.usesSmokelessTobacco },
      { key: 'obesity', labelKey: 'risk_insight_obesity', Icon: ICONS.Weight, condition: (d: UserData) => { if (!d.height || !d.weight) return false; const bmi = d.weight / ((d.height / 100) ** 2); return bmi >= CLINICAL_THRESHOLDS.BMI_OVERWEIGHT_UPPER; }},
      { key: 'high_waist', labelKey: 'risk_insight_waist', Icon: ICONS.Waist, condition: (d: UserData) => { const isMale = d.gender === 'male'; return (isMale && d.waistCircumference > CLINICAL_THRESHOLDS.WAIST_MALE_HIGH) || (!isMale && d.waistCircumference > CLINICAL_THRESHOLDS.WAIST_FEMALE_HIGH); }},
      { key: 'sedentary', labelKey: 'risk_insight_sedentary', Icon: ICONS.Sedentary, condition: (d: UserData) => d.physicalActivity === 'sedentary' },
      { key: 'alcohol', labelKey: 'risk_insight_alcohol', Icon: ICONS.Alcohol, condition: (d: UserData) => d.alcoholFrequency === 'high' },
      { key: 'salt', labelKey: 'risk_insight_salt', Icon: ICONS.Salt, condition: (d: UserData) => d.saltIntake === 'high' },
      { key: 'dna', labelKey: 'risk_insight_family_history', Icon: ICONS.Dna, condition: (d: UserData) => !d.familyHistoryUnsure && d.familyHistory.length > 0 },
      { key: 'biomass', labelKey: 'risk_insight_biomass', Icon: ICONS.Biomass, condition: (d: UserData) => d.cookingFuelType === 'biomass' },
    ];

    const positiveFinding = POSITIVE_FINDINGS_RANKED.find(p => p.condition(data)) || null;
    const focusAreas = RISK_FACTORS_RANKED.filter(r => r.condition(data)).slice(0, 2);

    return {
        positiveFinding: positiveFinding ? { key: positiveFinding.key, label: t(positiveFinding.labelKey), Icon: positiveFinding.Icon } : null,
        focusAreas: focusAreas.map(r => ({ key: r.key, label: t(r.labelKey), Icon: r.Icon }))
    };
}

/**
 * Helper to draw an SVG Path on Canvas.
 * Extracts the 'd' attribute from an SVG string and draws it.
 */
function drawPath(ctx: CanvasRenderingContext2D, svgString: string, x: number, y: number, scale: number, color: string) {
    const dMatch = svgString.match(/d="([^"]+)"/g);
    if (dMatch) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = "transparent"; // Icons are stroked in the design
        ctx.strokeStyle = color;
        ctx.lineWidth = 2; // Relative to scale
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        dMatch.forEach(match => {
            const d = match.replace('d="', '').replace('"', '');
            const path = new Path2D(d);
            ctx.stroke(path);
        });
        ctx.restore();
    } else {
        // Fallback if parsing fails
        ctx.fillStyle = color;
        ctx.font = '20px sans-serif';
        ctx.fillText('•', x, y);
    }
}

export function generateShareableCardDataUrl(userData: UserData, cbacScore: number, theme: { primary: string; primaryDark: string; accent: string }): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    // --- Background ---
    const grad = ctx.createLinearGradient(0, 0, 800, 500);
    grad.addColorStop(0, theme.primary);
    grad.addColorStop(1, theme.primaryDark);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // Decorative circle top-right
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.arc(700, 100, 250, 0, Math.PI * 2);
    ctx.fill();

    // --- Header ---
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Lato", sans-serif';
    ctx.fillText('HEALTH ASSESSMENT SUMMARY', 50, 60);
    
    // Sub-header (Date)
    ctx.font = '16px "Lato", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(new Date().toLocaleDateString(), 50, 90);

    // --- User Name ---
    ctx.font = 'bold 48px "Playfair Display", serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(userData.name, 50, 160);

    // --- Score Circle (Right Side) ---
    const cx = 650, cy = 250, r = 100;
    
    // Outer glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    
    // Circle background
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow

    // Border ring
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Score Value
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 90px sans-serif';
    ctx.fillText(String(cbacScore), cx, cy + 30);
    
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('RISK SCORE', cx, cy + 60);

    // --- Insights Section (Left Side) ---
    const insights = getPrimaryInsights(userData);
    let yPos = 240;
    ctx.textAlign = 'left';
    
    // Helper to draw an insight row
    const drawInsightRow = (label: string, iconSvg: string, color: string) => {
        // Draw Icon Background
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.roundRect(50, yPos - 30, 50, 50, 12);
        ctx.fill();
        
        // Draw Icon Path
        drawPath(ctx, iconSvg, 63, yPos - 17, 1, '#ffffff');

        // Draw Text
        ctx.font = 'bold 22px "Lato", sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(label, 120, yPos + 2);
        
        yPos += 70;
    };

    // 1. Positive Finding
    if (insights.positiveFinding) {
         drawInsightRow(insights.positiveFinding.label, insights.positiveFinding.Icon, '#a5d6a7'); // Light green text
    }

    // 2. Risk Areas
    insights.focusAreas.forEach(area => {
        drawInsightRow(area.label, area.Icon, '#ffffff');
    });

    // --- Footer ---
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '16px sans-serif';
    ctx.fillText('Preventive Health Advisor - Udaipur', 50, 460);
    
    // Doctor Credit
    ctx.textAlign = 'right';
    ctx.fillText('Dr. Narendra Rathore', 750, 460);

    resolve(canvas.toDataURL('image/png'));
  });
}
