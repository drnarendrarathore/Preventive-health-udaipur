
import type { UserData, AnalysisResponse, Recommendation, FamilyHistoryCondition } from '../types.ts';
import { getRecommendationContent, getDisclaimer } from '../locales/recommendations.ts';
import { DISEASE_CONDITIONS, CLINICAL_THRESHOLDS, CANCER_HISTORY_OPTIONS } from '../constants.ts';
import { t } from '../locales/index.ts';

function calculateCBACScore(patient: UserData): number {
    let score = 0;
    
    // Guard Clause: Handle missing age safely
    // If age is undefined/null, we treat it as 0 to avoid false positive high-risk scoring
    const age = patient.age || 0;

    // 1. Age (NP-NCD Scale)
    if (age < 30) score += 0;
    else if (age >= 30 && age <= CLINICAL_THRESHOLDS.CBAC_AGE_BRACKETS.LOW) score += 1;
    else if (age >= 40 && age <= CLINICAL_THRESHOLDS.CBAC_AGE_BRACKETS.MEDIUM) score += 2;
    else if (age >= 50 && age <= CLINICAL_THRESHOLDS.CBAC_AGE_BRACKETS.HIGH) score += 3;
    else score += 4;

    // 2. Tobacco Usage (NP-NCD Scale)
    const isCurrentSmoker = patient.smokingStatus === 'current' || patient.usesSmokelessTobacco;
    const isFormerSmoker = patient.smokingStatus === 'former';
    if (isCurrentSmoker) score += 2;
    else if (isFormerSmoker) score += 1;

    // 3. Alcohol Consumption
    if (patient.alcoholFrequency === 'high') score += 1;

    // 4. Waist Circumference (Indian Metabolic Thresholds)
    const waistInCm = patient.waistCircumference * 2.54; // Convert inches to cm
    const isMale = patient.gender === 'male';
    if (isMale) {
        if (waistInCm > CLINICAL_THRESHOLDS.WAIST_MALE_HIGH) score += 2;
    } else { // Stricter threshold for female and 'other' genders
        if (waistInCm > CLINICAL_THRESHOLDS.WAIST_FEMALE_HIGH) score += 2;
    }

    // 5. Physical Activity (NP-NCD Scale)
    if (patient.physicalActivity === 'sedentary') score += 1;

    const ncdConditions = [
        DISEASE_CONDITIONS.HEART_DISEASE, 
        DISEASE_CONDITIONS.STROKE, 
        DISEASE_CONDITIONS.HIGH_BLOOD_PRESSURE, 
        DISEASE_CONDITIONS.DIABETES_TYPE_2, 
        DISEASE_CONDITIONS.HIGH_CHOLESTEROL, 
        DISEASE_CONDITIONS.OBESITY, 
        DISEASE_CONDITIONS.CHRONIC_KIDNEY_DISEASE
    ];

    // 6. Family History (Lifestyle NCDs)
    if (!patient.familyHistoryUnsure) {
        const hasFamilyHistory = patient.familyHistory.some(h => ncdConditions.includes(h.condition));
        if (hasFamilyHistory) score += 1;
    }

    // 7. Personal Medical History
    // A personal diagnosis is a much stronger risk factor than family history alone.
    if (patient.personalConditions.some(c => ncdConditions.includes(c))) {
        score += 2;
    }

    // Ensure score does not exceed the maximum displayable value of 10.
    return Math.min(score, CLINICAL_THRESHOLDS.CBAC_SCORE_MAX);
}

function consolidateRecommendations(recommendations: Recommendation[], patient: UserData, cbacScore: number): Recommendation[] {
    let consolidatedRecs = [...recommendations];
    const recKeys = new Set(consolidatedRecs.map(r => r.key));

    // --- 1. Lung Health Consolidation ---
    const hasOccupationalLung = recKeys.has('occupational_lung');
    const hasPulmonologistConsult = recKeys.has('pulmonologist_consult');

    if (hasOccupationalLung && hasPulmonologistConsult) {
        consolidatedRecs = consolidatedRecs.filter(rec => rec.key !== 'occupational_lung' && rec.key !== 'pulmonologist_consult');
        
        const content = getRecommendationContent('comprehensive_lung_assessment', 'comprehensive_lung_assessment_reason');
        consolidatedRecs.push({
            key: 'comprehensive_lung_assessment',
            ...content,
            priority: 'high'
        });
    }

    // --- 2. Metabolic Syndrome Consolidation ---
    const hasBpRec = recKeys.has('bp');
    const hasSugarRec = recKeys.has('sugar');

    const waistInCm = patient.waistCircumference * 2.54;
    const isMale = patient.gender === 'male';
    const hasHighRiskWaist = (isMale && waistInCm >= CLINICAL_THRESHOLDS.WAIST_MALE_HIGH) || (!isMale && waistInCm >= CLINICAL_THRESHOLDS.WAIST_FEMALE_HIGH);
    
    if (cbacScore >= 4 && hasBpRec && hasSugarRec && hasHighRiskWaist) {
        const content = getRecommendationContent('metabolic_syndrome_protocol', 'metabolic_syndrome_protocol_reason');
        consolidatedRecs.push({
            key: 'metabolic_syndrome_protocol',
            ...content,
            priority: 'high'
        });
    }

    return consolidatedRecs.sort((a, b) => (a.priority === 'high' ? -1 : 1));
}

export function generateRecommendations(patient: UserData): AnalysisResponse {
  const recs = new Map<string, string>(); // Map<recommendation_key, reason_key>
  const highRiskFlags = new Set<string>(); // Set of recommendation_keys that are high priority due to specific risks
  const currentYear = new Date().getFullYear();
  
  // LOGIC UPDATE: Conversion from Sticks to Packs (20 sticks = 1 pack)
  // Assumes patient data has been sanitized by App component if needed
  let packsPerDay = 0;
  if (patient.smokingSticksPerDay) {
      packsPerDay = patient.smokingSticksPerDay / 20;
  }

  const packYears = (patient.smokingStatus !== 'never') 
    ? (packsPerDay * (patient.smokingYears || 0)) 
    : 0;

  const yearsSinceQuit = (patient.smokingStatus === 'former' && patient.quitSmokingYear) 
    ? (currentYear - patient.quitSmokingYear) 
    : 0;

  const cbacScore = calculateCBACScore(patient);
  const isDiabetic = patient.personalConditions.includes(DISEASE_CONDITIONS.DIABETES_TYPE_2);
  const familyHistory = patient.familyHistoryUnsure ? [] : patient.familyHistory;

  // ENHANCEMENT 1: Mitigate Age-Related Risk Underestimation
  let hasLifestyleRiskAlert = false;
  if (patient.age && patient.age < CLINICAL_THRESHOLDS.LIFESTYLE_ALERT_MAX_AGE) {
      const earlyOnsetConditions = [
          ...CANCER_HISTORY_OPTIONS,
          DISEASE_CONDITIONS.HEART_DISEASE,
          DISEASE_CONDITIONS.STROKE,
      ];

      const hasEarlyOnsetHistory = !patient.familyHistoryUnsure && patient.familyHistory.some(h => 
          earlyOnsetConditions.includes(h.condition) && 
          h.relativeAgeAtDiagnosis && 
          h.relativeAgeAtDiagnosis < CLINICAL_THRESHOLDS.EARLY_ONSET_CANCER_AGE
      );

      const isHeavyDrinkerAndSmoker = patient.smokingStatus === 'current' && patient.alcoholFrequency === 'high';
      
      if ((packYears > CLINICAL_THRESHOLDS.LIFESTYLE_ALERT_MIN_PACK_YEARS) || isHeavyDrinkerAndSmoker || hasEarlyOnsetHistory) {
          hasLifestyleRiskAlert = true;
      }
  }

  if (patient.age && patient.age >= 30) {
      recs.set("bp", "bp_reason");
      if (!isDiabetic) {
          recs.set("sugar", "sugar_reason");
      }
  }

  if (isDiabetic) {
      recs.set('diabetic_retinopathy', 'reason_diabetic_retinopathy');
      recs.set('diabetic_foot', 'reason_diabetic_foot');
      recs.set('diabetic_kidney', 'reason_diabetic_kidney');
  }

  if (patient.usesSmokelessTobacco || patient.hasOralSigns || patient.smokingStatus === 'current') {
      recs.set("oral", "oral_reason");
  }

  const patientAge = patient.age || 0;
  const meetsLungCriteria = patientAge >= CLINICAL_THRESHOLDS.LUNG_SCREENING_MIN_AGE && patientAge <= CLINICAL_THRESHOLDS.LUNG_SCREENING_MAX_AGE && packYears >= CLINICAL_THRESHOLDS.LUNG_SCREENING_MIN_PACK_YEARS;
  const isEligibleLung = patient.smokingStatus === 'current' || (patient.smokingStatus === 'former' && patient.quitSmokingYear != null && yearsSinceQuit <= CLINICAL_THRESHOLDS.LUNG_SCREENING_YEARS_SINCE_QUIT);
  
  if (meetsLungCriteria && isEligibleLung) {
      recs.set('lung', 'lung_reason');
  }

  if (patient.gender === "female" && patientAge >= CLINICAL_THRESHOLDS.CERVICAL_SCREENING_MIN_AGE && patientAge <= CLINICAL_THRESHOLDS.CERVICAL_SCREENING_MAX_AGE) {
      recs.set("cervix", "cervix_reason");
  }

  // --- BREAST CANCER (Enhanced Logic for High Risk) ---
  if (patient.gender === "female") {
    const highRiskBreastConditions = [
        DISEASE_CONDITIONS.BREAST_CANCER, 
        DISEASE_CONDITIONS.OVARIAN_CANCER, 
        DISEASE_CONDITIONS.MALE_BREAST_CANCER, 
        DISEASE_CONDITIONS.PANCREATIC_CANCER
    ];
    const familyHistoryBreast = familyHistory.filter(h => highRiskBreastConditions.includes(h.condition));
    const hasHighRiskFamilyHistory = familyHistoryBreast.length > 0;
    const hasEarlyOnsetHistory = familyHistoryBreast.some(h => h.relativeAgeAtDiagnosis && h.relativeAgeAtDiagnosis < CLINICAL_THRESHOLDS.EARLY_ONSET_CANCER_AGE);
    const isHighRiskBreast = hasHighRiskFamilyHistory; // Removed Ashkenazi ancestry check

    let highRiskBreastScreeningStartAge = CLINICAL_THRESHOLDS.BREAST_SCREENING_HIGH_RISK_MIN_AGE;
    if (hasHighRiskFamilyHistory) {
        const agesOfDiagnosis = familyHistoryBreast
            .map(h => h.relativeAgeAtDiagnosis)
            .filter((age): age is number => age !== undefined && age > 0);
        
        if (agesOfDiagnosis.length > 0) {
            const youngestRelativeAge = Math.min(...agesOfDiagnosis);
            const dynamicStartAge = youngestRelativeAge - 10;
            highRiskBreastScreeningStartAge = Math.max(CLINICAL_THRESHOLDS.ABSOLUTE_MIN_HIGH_RISK_SCREENING_AGE, Math.min(highRiskBreastScreeningStartAge, dynamicStartAge));
        }
    }

    const isEligibleForMammogram = (patientAge >= CLINICAL_THRESHOLDS.BREAST_SCREENING_MIN_AGE && patientAge <= CLINICAL_THRESHOLDS.BREAST_SCREENING_MAX_AGE) || (isHighRiskBreast && patientAge >= highRiskBreastScreeningStartAge && patientAge <= CLINICAL_THRESHOLDS.BREAST_SCREENING_MAX_AGE);
    
    if (isEligibleForMammogram) {
        let reasonKey = 'breast_general_reason';
        if (isHighRiskBreast) {
            reasonKey = hasEarlyOnsetHistory ? 'breast_general_high_risk_reason_age' : 'breast_general_high_risk_reason';
            highRiskFlags.add('breast_general');
        }
        recs.set('breast_general', reasonKey);
    }
    
    if (patientAge >= 30) {
        recs.set("breast_cbe", "breast_cbe_reason");
    }
  }
  
  // --- PROSTATE CANCER ---
  if (patient.gender === 'male') {
      const familyHistoryProstate = familyHistory.filter(h => h.condition === DISEASE_CONDITIONS.PROSTATE_CANCER);
      const hasHighRiskProstate = familyHistoryProstate.length > 0;
      const hasEarlyOnsetProstate = familyHistoryProstate.some(h => h.relativeAgeAtDiagnosis && h.relativeAgeAtDiagnosis < CLINICAL_THRESHOLDS.EARLY_ONSET_CANCER_AGE);

      let highRiskProstateScreeningStartAge = CLINICAL_THRESHOLDS.PROSTATE_SCREENING_HIGH_RISK_MIN_AGE;
      if (hasHighRiskProstate) {
          const agesOfDiagnosis = familyHistoryProstate
              .map(h => h.relativeAgeAtDiagnosis)
              .filter((age): age is number => age !== undefined && age > 0);
          
          if (agesOfDiagnosis.length > 0) {
              const youngestRelativeAge = Math.min(...agesOfDiagnosis);
              const dynamicStartAge = youngestRelativeAge - 10;
              highRiskProstateScreeningStartAge = Math.max(CLINICAL_THRESHOLDS.ABSOLUTE_MIN_HIGH_RISK_SCREENING_AGE, Math.min(highRiskProstateScreeningStartAge, dynamicStartAge));
          }
      }

      const isEligible = (patientAge >= CLINICAL_THRESHOLDS.PROSTATE_SCREENING_MIN_AGE) || 
                          (hasHighRiskProstate && patientAge >= highRiskProstateScreeningStartAge);
      
      if (isEligible) {
          let reasonKey = 'prostate_reason';
          if(hasHighRiskProstate || hasEarlyOnsetProstate) {
              reasonKey = 'prostate_high_risk_reason';
              highRiskFlags.add('prostate');
          }
          recs.set('prostate', reasonKey);
      }
  }

  // --- COLORECTAL CANCER (Enhanced Logic for High Risk) ---
  const highRiskColonConditions = [DISEASE_CONDITIONS.COLON_CANCER, DISEASE_CONDITIONS.UTERINE_CANCER];
  const familyHistoryColon = familyHistory.filter(h => highRiskColonConditions.includes(h.condition));
  const hasUterineCancerHistory = familyHistoryColon.some(h => h.condition === DISEASE_CONDITIONS.UTERINE_CANCER);
  const hasEarlyOnsetColonHistory = familyHistoryColon.some(h => h.relativeAgeAtDiagnosis && h.relativeAgeAtDiagnosis < CLINICAL_THRESHOLDS.EARLY_ONSET_CANCER_AGE);
  const isHighRiskColon = familyHistoryColon.length > 0;
  
  let highRiskColonScreeningStartAge = CLINICAL_THRESHOLDS.COLON_SCREENING_HIGH_RISK_MIN_AGE;
  if (isHighRiskColon) {
      const familyHistoryOnlyColon = familyHistory.filter(h => h.condition === DISEASE_CONDITIONS.COLON_CANCER);
      const agesOfDiagnosis = familyHistoryOnlyColon
          .map(h => h.relativeAgeAtDiagnosis)
          .filter((age): age is number => age !== undefined && age > 0);
      
      if (agesOfDiagnosis.length > 0) {
          const youngestRelativeAge = Math.min(...agesOfDiagnosis);
          const dynamicStartAge = youngestRelativeAge - 10;
          highRiskColonScreeningStartAge = Math.max(CLINICAL_THRESHOLDS.ABSOLUTE_MIN_HIGH_RISK_SCREENING_AGE, Math.min(highRiskColonScreeningStartAge, dynamicStartAge));
      }
  }

  const isEligibleForColonScreening = (patientAge >= CLINICAL_THRESHOLDS.COLON_SCREENING_MIN_AGE && patientAge <= CLINICAL_THRESHOLDS.COLON_SCREENING_MAX_AGE) || (isHighRiskColon && patientAge >= highRiskColonScreeningStartAge && patientAge <= CLINICAL_THRESHOLDS.COLON_SCREENING_MAX_AGE);

  if (isEligibleForColonScreening) {
      let reasonKey = 'colon_general_reason';
      if (isHighRiskColon) {
          if(hasEarlyOnsetColonHistory) reasonKey = 'colon_general_high_risk_reason_age';
          else if (hasUterineCancerHistory) reasonKey = 'colon_general_high_risk_reason_uterine';
          else reasonKey = 'colon_general_high_risk_reason';
          highRiskFlags.add('colon_general');
      }
      recs.set('colon_general', reasonKey);
  }

  if (patient.cookingFuelType === 'biomass' || patient.marbleMiningExposure) {
      recs.set('occupational_lung', 'occupational_lung_reason');
  }

  // --- ENHANCEMENT 3: HOLISTIC LUNG HEALTH PATHWAY ---
  const lungHealthRiskFactors = [
      (patient.smokingStatus === 'former' && packYears >= CLINICAL_THRESHOLDS.PULMONOLOGIST_CONSULT_MIN_PACK_YEARS),
      patient.marbleMiningExposure,
      patient.cookingFuelType === 'biomass'
  ];
  const lungRiskFactorCount = lungHealthRiskFactors.filter(Boolean).length;

  if (lungRiskFactorCount >= 2 && !recs.has('lung')) {
      recs.set('pulmonologist_consult', 'pulmonologist_consult_reason');
  }


  if (patient.saltIntake === 'high' && patientAge >= 35) {
      recs.set('gastric_screening', 'gastric_screening_reason');
  }

  if (patient.hepatitisHistory !== 'none') recs.set('liver_hep', 'liver_hep_reason');
  if (patient.hpvVaccineStatus !== 'complete' && patientAge <= 45) recs.set('hpv_prevention', 'hpv_prevention_reason');

  recs.set("lifestyle", "lifestyle_reason");

  const recommendations: Recommendation[] = Array.from(recs.entries()).map(([key, reasonKey]) => {
      const recContent = getRecommendationContent(key, reasonKey);
      const rec: Recommendation = { key, ...recContent, priority: 'normal' };
      
      if (key === 'bp') {
          rec.frequency = cbacScore >= 4 
              ? t('rec_freq_bp_high')
              : t('rec_freq_bp_normal');
      }

      const criticalNcdTests = ['bp', 'sugar', 'oral', 'cervix', 'breast_general', 'breast_cbe'];
      const intrinsicallyHighPriority = ['lung', 'liver_hep', 'occupational_lung', 'oral', 'diabetic_retinopathy', 'diabetic_foot', 'diabetic_kidney'];

      if (
        (cbacScore >= 4 && criticalNcdTests.includes(key)) || 
        highRiskFlags.has(key) || 
        intrinsicallyHighPriority.includes(key)
      ) {
          rec.priority = 'high';
      }

      return rec;
  });

  const finalRecommendations = consolidateRecommendations(recommendations, patient, cbacScore);

  return {
    recommendations: finalRecommendations,
    disclaimer: getDisclaimer(),
    cbacScore,
    hasLifestyleRiskAlert,
  };
}
