
import type { UserData, AnalysisResponse, Recommendation, FamilyHistoryCondition } from '../types.ts';
import { getRecommendationContent, getDisclaimer } from '../locales/recommendations.ts';
import { DISEASE_CONDITIONS, CLINICAL_THRESHOLDS, CANCER_HISTORY_OPTIONS } from '../constants.ts';
import { t } from '../locales/index.ts';

function calculateCBACScore(patient: UserData): number {
    let score = 0;
    const age = patient.age || 0;

    // 1. Age (NP-NCD Scale)
    if (age >= 30 && age <= CLINICAL_THRESHOLDS.CBAC_AGE_BRACKETS.LOW) score += 1;
    else if (age >= 40 && age <= CLINICAL_THRESHOLDS.CBAC_AGE_BRACKETS.MEDIUM) score += 2;
    else if (age >= 50 && age <= CLINICAL_THRESHOLDS.CBAC_AGE_BRACKETS.HIGH) score += 3;
    else if (age >= 60) score += 4;

    // 2. Tobacco Usage
    if (patient.smokingStatus === 'current' || patient.usesSmokelessTobacco) score += 2;
    else if (patient.smokingStatus === 'former') score += 1;

    // 3. Alcohol Consumption
    if (patient.alcoholFrequency === 'high') score += 1;

    // 4. Waist Circumference
    const waistInCm = patient.waistCircumference * 2.54;
    const isMale = patient.gender === 'male';
    if (isMale) {
        if (waistInCm >= CLINICAL_THRESHOLDS.WAIST_MALE_HIGH) score += 1;
    } else { 
        if (waistInCm >= CLINICAL_THRESHOLDS.WAIST_FEMALE_HIGH) score += 1;
    }

    // 5. Physical Activity
    if (patient.physicalActivity === 'sedentary') score += 1;

    const ncdConditions = [
        DISEASE_CONDITIONS.HEART_DISEASE, 
        DISEASE_CONDITIONS.STROKE, 
        DISEASE_CONDITIONS.HIGH_BLOOD_PRESSURE, 
        DISEASE_CONDITIONS.DIABETES_TYPE_2, 
        DISEASE_CONDITIONS.HIGH_CHOLESTEROL, 
        DISEASE_CONDITIONS.CHRONIC_KIDNEY_DISEASE
    ];

    // 6. Family History (NP-NCD: 2 Points)
    if (!patient.familyHistoryUnsure) {
        if (patient.familyHistory.some(h => ncdConditions.includes(h.condition))) score += 2;
    }

    // 7. Personal Medical History
    if (patient.personalConditions.some(c => ncdConditions.includes(c))) score += 2;

    return Math.min(score, CLINICAL_THRESHOLDS.CBAC_SCORE_MAX);
}

function consolidateRecommendations(recommendations: Recommendation[], patient: UserData, cbacScore: number): Recommendation[] {
    let consolidatedRecs = [...recommendations];
    const recKeys = new Set(consolidatedRecs.map(r => r.key));

    // Consolidate Lung Health
    if (recKeys.has('occupational_lung') && recKeys.has('pulmonologist_consult')) {
        consolidatedRecs = consolidatedRecs.filter(rec => rec.key !== 'occupational_lung' && rec.key !== 'pulmonologist_consult');
        const content = getRecommendationContent('comprehensive_lung_assessment', 'comprehensive_lung_assessment_reason');
        consolidatedRecs.push({ key: 'comprehensive_lung_assessment', ...content, priority: 'high' });
    }

    // Consolidate Metabolic Syndrome
    const waistInCm = patient.waistCircumference * 2.54;
    const isMale = patient.gender === 'male';
    const hasHighRiskWaist = (isMale && waistInCm >= CLINICAL_THRESHOLDS.WAIST_MALE_HIGH) || (!isMale && waistInCm >= CLINICAL_THRESHOLDS.WAIST_FEMALE_HIGH);
    
    if (cbacScore >= 4 && recKeys.has('bp') && recKeys.has('sugar') && hasHighRiskWaist) {
        const content = getRecommendationContent('metabolic_syndrome_protocol', 'metabolic_syndrome_protocol_reason');
        consolidatedRecs.push({ key: 'metabolic_syndrome_protocol', ...content, priority: 'high' });
    }

    // Resolve conflicts: If specialist consult exists, remove general screening
    if (recKeys.has('gastro_consult')) {
        consolidatedRecs = consolidatedRecs.filter(rec => rec.key !== 'colon_general');
    }

    return consolidatedRecs.sort((a, b) => (a.priority === 'high' ? -1 : 1));
}

const isFDR = (item: FamilyHistoryCondition) => item.relationship !== 'extended' && item.relationship !== undefined;

export function generateRecommendations(patient: UserData): AnalysisResponse {
  const recs = new Map<string, string>(); 
  const highRiskFlags = new Set<string>(); 
  const patientAge = patient.age || 0;
  const familyHistory = patient.familyHistoryUnsure ? [] : patient.familyHistory;
  const cbacScore = calculateCBACScore(patient);

  // 1. Lifestyle Risk Alert
  let hasLifestyleRiskAlert = false;
  if (patientAge < CLINICAL_THRESHOLDS.LIFESTYLE_ALERT_MAX_AGE) {
      const earlyOnsetConditions = [...CANCER_HISTORY_OPTIONS, DISEASE_CONDITIONS.HEART_DISEASE, DISEASE_CONDITIONS.STROKE];
      const hasEarlyOnsetHistory = familyHistory.some(h => earlyOnsetConditions.includes(h.condition) && h.relativeAgeAtDiagnosis && h.relativeAgeAtDiagnosis < CLINICAL_THRESHOLDS.EARLY_ONSET_CANCER_AGE);
      if (hasEarlyOnsetHistory || (cbacScore >= 4 && patientAge < 35)) {
          hasLifestyleRiskAlert = true;
      }
  }

  // 2. Base Metabolic Screenings
  if (patientAge >= 30) {
      recs.set("bp", "bp_reason");
      if (!patient.personalConditions.includes(DISEASE_CONDITIONS.DIABETES_TYPE_2)) recs.set("sugar", "sugar_reason");
  }

  // 3. Diabetic Complications
  if (patient.personalConditions.includes(DISEASE_CONDITIONS.DIABETES_TYPE_2)) {
      recs.set('diabetic_retinopathy', 'reason_diabetic_retinopathy');
      recs.set('diabetic_foot', 'reason_diabetic_foot');
      recs.set('diabetic_kidney', 'reason_diabetic_kidney');
  }

  // 4. Cancer Logic: Breast (HBOC Pattern)
  if (patient.gender === "female") {
      const highRiskBreastConditions = [
          DISEASE_CONDITIONS.BREAST_CANCER, 
          DISEASE_CONDITIONS.OVARIAN_CANCER, 
          DISEASE_CONDITIONS.MALE_BREAST_CANCER, 
          DISEASE_CONDITIONS.PANCREATIC_CANCER
      ];
      const fdrBreastHistory = familyHistory.filter(h => highRiskBreastConditions.includes(h.condition) && isFDR(h));
      
      let breastStartAge = CLINICAL_THRESHOLDS.BREAST_SCREENING_MIN_AGE;
      if (fdrBreastHistory.length > 0) {
          highRiskFlags.add('breast_general');
          const ages = fdrBreastHistory.map(h => h.relativeAgeAtDiagnosis).filter((a): a is number => !!a);
          breastStartAge = ages.length > 0 
              ? Math.max(CLINICAL_THRESHOLDS.ABSOLUTE_MIN_HIGH_RISK_SCREENING_AGE, Math.min(40, Math.min(...ages) - 10))
              : CLINICAL_THRESHOLDS.BREAST_SCREENING_HIGH_RISK_MIN_AGE;
      }

      if (patientAge >= breastStartAge && patientAge <= CLINICAL_THRESHOLDS.BREAST_SCREENING_MAX_AGE) {
          const isHigh = highRiskFlags.has('breast_general');
          const hasEarly = fdrBreastHistory.some(h => h.relativeAgeAtDiagnosis && h.relativeAgeAtDiagnosis < 50);
          recs.set('breast_general', isHigh ? (hasEarly ? 'breast_general_high_risk_reason_age' : 'breast_general_high_risk_reason') : 'breast_general_reason');
      }
      if (patientAge >= 30) recs.set("breast_cbe", "breast_cbe_reason");
  }

  // 5. Cancer Logic: Colorectal (Lynch Syndrome Pattern)
  const highRiskColonConditions = [DISEASE_CONDITIONS.COLON_CANCER, DISEASE_CONDITIONS.UTERINE_CANCER];
  const fdrColonHistory = familyHistory.filter(h => highRiskColonConditions.includes(h.condition) && isFDR(h));
  
  let colonStartAge = CLINICAL_THRESHOLDS.COLON_SCREENING_MIN_AGE;
  if (fdrColonHistory.length > 0 || patient.personalConditions.includes(DISEASE_CONDITIONS.COLON_POLYPS)) {
      highRiskFlags.add('colon_general');
      const ages = fdrColonHistory.map(h => h.relativeAgeAtDiagnosis).filter((a): a is number => !!a);
      colonStartAge = ages.length > 0 
          ? Math.max(CLINICAL_THRESHOLDS.ABSOLUTE_MIN_HIGH_RISK_SCREENING_AGE, Math.min(45, Math.min(...ages) - 10))
          : CLINICAL_THRESHOLDS.COLON_SCREENING_HIGH_RISK_MIN_AGE;
  }

  if (patientAge >= colonStartAge && patientAge <= CLINICAL_THRESHOLDS.COLON_SCREENING_MAX_AGE) {
      if (patient.personalConditions.includes(DISEASE_CONDITIONS.COLON_POLYPS) || patient.personalConditions.includes(DISEASE_CONDITIONS.INFLAMMATORY_BOWEL_DISEASE)) {
          recs.set('gastro_consult', 'gastro_consult_reason');
          highRiskFlags.add('gastro_consult');
      } else {
          const isHigh = highRiskFlags.has('colon_general');
          const hasUterine = fdrColonHistory.some(h => h.condition === DISEASE_CONDITIONS.UTERINE_CANCER);
          recs.set('colon_general', isHigh ? (hasUterine ? 'colon_general_high_risk_reason_uterine' : 'colon_general_high_risk_reason') : 'colon_general_reason');
      }
  }

  // 6. Cancer Logic: Prostate
  if (patient.gender === 'male') {
      const fdrProstateConditions = [DISEASE_CONDITIONS.PROSTATE_CANCER, DISEASE_CONDITIONS.MALE_BREAST_CANCER];
      const fdrProstateHistory = familyHistory.filter(h => fdrProstateConditions.includes(h.condition) && isFDR(h));
      let prostateStartAge = CLINICAL_THRESHOLDS.PROSTATE_SCREENING_MIN_AGE;
      if (fdrProstateHistory.length > 0) {
          highRiskFlags.add('prostate');
          const ages = fdrProstateHistory.map(h => h.relativeAgeAtDiagnosis).filter((a): a is number => !!a);
          prostateStartAge = ages.length > 0 
              ? Math.max(CLINICAL_THRESHOLDS.ABSOLUTE_MIN_HIGH_RISK_SCREENING_AGE, Math.min(45, Math.min(...ages) - 10))
              : CLINICAL_THRESHOLDS.PROSTATE_SCREENING_HIGH_RISK_MIN_AGE;
      }
      if (patientAge >= prostateStartAge) {
          recs.set('prostate', highRiskFlags.has('prostate') ? 'prostate_high_risk_reason' : 'prostate_reason');
      }
  }

  // 7. Oral Health
  if (patient.usesSmokelessTobacco || patient.hasOralSigns || patient.smokingStatus === 'current') recs.set("oral", "oral_reason");
  
  // 8. Women's Health: Cervix
  if (patient.gender === "female" && patientAge >= 30 && patientAge <= 65) recs.set("cervix", "cervix_reason");
  
  // 9. Lung Health (USPSTF)
  const packsPerDay = (patient.smokingSticksPerDay || 0) / 20;
  const packYears = (patient.smokingStatus !== 'never') ? (packsPerDay * (patient.smokingYears || 0)) : 0;
  if (patientAge >= 50 && patientAge <= 80 && packYears >= 20) recs.set('lung', 'lung_reason');
  
  // 10. Environmental & Occupational
  if (patient.cookingFuelType === 'biomass' || patient.marbleMiningExposure) recs.set('occupational_lung', 'occupational_lung_reason');
  
  // Pulmonary specialist check (Regional Udaipur context: Silicosis + NCDs)
  const lungRiskCount = [
      (patient.smokingStatus !== 'never' && packYears >= 10),
      patient.marbleMiningExposure,
      patient.cookingFuelType === 'biomass',
      patient.personalConditions.includes(DISEASE_CONDITIONS.TUBERCULOSIS)
  ].filter(Boolean).length;

  if (lungRiskCount >= 2 && !recs.has('lung')) recs.set('pulmonologist_consult', 'pulmonologist_consult_reason');

  // 11. Generic/Lifestyle
  if (patient.saltIntake === 'high' && patientAge >= 35) recs.set('gastric_screening', 'gastric_screening_reason');
  if (patient.hepatitisHistory !== 'none') recs.set('liver_hep', 'liver_hep_reason');
  if (patient.alcoholFrequency === 'high' && patientAge >= 40) recs.set('liver_alcohol', 'liver_alcohol_reason');
  if (patient.hpvVaccineStatus !== 'complete' && patientAge <= 45) recs.set('hpv_prevention', 'hpv_prevention_reason');
  recs.set("lifestyle", "lifestyle_reason");

  const recommendations: Recommendation[] = Array.from(recs.entries()).map(([key, reasonKey]) => {
      const recContent = getRecommendationContent(key, reasonKey);
      const rec: Recommendation = { key, ...recContent, priority: 'normal' };
      const intrinsicallyHigh = ['lung', 'gastro_consult', 'oral', 'diabetic_retinopathy', 'diabetic_foot', 'diabetic_kidney', 'pulmonologist_consult'];
      if (cbacScore >= 4 || highRiskFlags.has(key) || intrinsicallyHigh.includes(key)) rec.priority = 'high';
      return rec;
  });

  return {
    recommendations: consolidateRecommendations(recommendations, patient, cbacScore),
    disclaimer: getDisclaimer(),
    cbacScore,
    hasLifestyleRiskAlert,
  };
}
