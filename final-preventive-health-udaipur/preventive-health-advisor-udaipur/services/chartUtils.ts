import type { UserData } from '../types.ts';
import { DISEASE_CONDITIONS, CLINICAL_THRESHOLDS } from '../constants.ts';
import { t } from '../locales/index.ts';

export interface RadarData {
    label: string;
    value: number;
}

const MAX_SCORE = 5;

export const calculateRadarData = (data: UserData, t: (key: string) => string): RadarData[] => {
    // 1. Biometrics Score (BMI, Waist, & Personal Conditions)
    let biometricsScore = 0;
    const bmi = data.height && data.weight ? data.weight / ((data.height / 100) ** 2) : 0;
    if (bmi >= CLINICAL_THRESHOLDS.BMI_NORMAL_UPPER && bmi < CLINICAL_THRESHOLDS.BMI_OVERWEIGHT_UPPER) biometricsScore += 2;
    if (bmi >= CLINICAL_THRESHOLDS.BMI_OVERWEIGHT_UPPER) biometricsScore += 4;
    
    const waistInCm = data.waistCircumference * 2.54; // Convert inches to cm
    const isMale = data.gender === 'male';
    if ((isMale && waistInCm > CLINICAL_THRESHOLDS.WAIST_MALE_HIGH) || (!isMale && waistInCm > CLINICAL_THRESHOLDS.WAIST_FEMALE_HIGH)) {
        biometricsScore += 2; // Add 2 points, not just set to 2
    }
    
    // This fix aligns the visual "Biometrics" score with the clinical risk assessment.
    const highImpactPersonalConditions = [
        DISEASE_CONDITIONS.HEART_DISEASE,
        DISEASE_CONDITIONS.STROKE,
        DISEASE_CONDITIONS.HIGH_BLOOD_PRESSURE, 
        DISEASE_CONDITIONS.DIABETES_TYPE_2, 
        DISEASE_CONDITIONS.HIGH_CHOLESTEROL, 
        DISEASE_CONDITIONS.OBESITY, 
        DISEASE_CONDITIONS.CHRONIC_KIDNEY_DISEASE
    ];
    const hasPersonalNCD = data.personalConditions.some(c => highImpactPersonalConditions.includes(c));
    if (hasPersonalNCD) {
        // Add a significant score, as a diagnosed condition is a major biometric risk factor.
        biometricsScore += 3;
    }
    
    biometricsScore = Math.min(biometricsScore, MAX_SCORE);

    // 2. Habits Score (Tobacco/Alcohol)
    let habitsScore = 0;
    if (data.smokingStatus === 'current' || data.usesSmokelessTobacco) {
        habitsScore = 5; // Max score for current use
    } else if (data.smokingStatus === 'former') {
        habitsScore = 2;
    }

    if (data.alcoholFrequency === 'high') habitsScore += 3;
    if (data.alcoholFrequency === 'moderate') habitsScore += 1;
    
    habitsScore = Math.min(habitsScore, MAX_SCORE);

    // 3. Lifestyle Score (Diet/Activity)
    let lifestyleScore = 0;
    if (data.physicalActivity === 'sedentary') lifestyleScore += 3;
    if (data.saltIntake === 'high') lifestyleScore += 2;
    lifestyleScore = Math.min(lifestyleScore, MAX_SCORE);

    // 4. Family History Score
    let familyHistoryScore = 0;
    if (!data.familyHistoryUnsure) {
        // This list MUST be kept in sync with all high-risk cancer conditions from the rules engine.
        const highRiskCancers = [
            DISEASE_CONDITIONS.BREAST_CANCER, 
            DISEASE_CONDITIONS.OVARIAN_CANCER, 
            DISEASE_CONDITIONS.COLON_CANCER, 
            DISEASE_CONDITIONS.MALE_BREAST_CANCER, 
            DISEASE_CONDITIONS.UTERINE_CANCER, 
            DISEASE_CONDITIONS.PANCREATIC_CANCER, 
            DISEASE_CONDITIONS.PROSTATE_CANCER
        ];
        const hasHighRiskCancer = data.familyHistory.some(h => highRiskCancers.includes(h.condition));
        
        // The radar chart must reflect the same high-risk factors as the rules engine.
        if (hasHighRiskCancer) {
            familyHistoryScore = MAX_SCORE; // Assign max score for high-impact cancer history or genetic risk
        } else {
            const ncdConditions = [
                DISEASE_CONDITIONS.HEART_DISEASE, 
                DISEASE_CONDITIONS.STROKE, 
                DISEASE_CONDITIONS.HIGH_BLOOD_PRESSURE, 
                DISEASE_CONDITIONS.DIABETES_TYPE_2, 
                DISEASE_CONDITIONS.HIGH_CHOLESTEROL, 
                DISEASE_CONDITIONS.OBESITY, 
                DISEASE_CONDITIONS.CHRONIC_KIDNEY_DISEASE
            ];
            const hasNCDHistory = data.familyHistory.some(h => ncdConditions.includes(h.condition));
            if (hasNCDHistory) {
                familyHistoryScore = 4; // High score for other NCDs
            }
        }
    }
    familyHistoryScore = Math.min(familyHistoryScore, MAX_SCORE);

    // 5. Environment Score
    let environmentScore = 0;
    if (data.cookingFuelType === 'biomass') environmentScore += 3;
    if (data.marbleMiningExposure) environmentScore += 3; // Risk is additive
    environmentScore = Math.min(environmentScore, MAX_SCORE);
    
    return [
        { label: t('radar_biometrics'), value: biometricsScore },
        { label: t('radar_habits'), value: habitsScore },
        { label: t('radar_lifestyle'), value: lifestyleScore },
        { label: t('radar_family_history'), value: familyHistoryScore },
        { label: t('radar_environment'), value: environmentScore }
    ];
};