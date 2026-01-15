import type { UserData, BiometricAnalysis, BiometricResult } from '../types.ts';
import { CLINICAL_THRESHOLDS } from '../constants.ts';
import { t } from '../locales/index.ts';

/**
 * Analyzes key biometrics (BMI, Waist Circumference) to determine risk status and provide contextual notes.
 * @param userData - The user's input data.
 * @returns An object containing detailed analysis for BMI and waist circumference.
 */
export function getBiometricAnalysis(userData: UserData): BiometricAnalysis {
    const { height, weight, waistCircumference, gender } = userData;

    // --- BMI Analysis ---
    const bmiValue = (height && weight) ? weight / ((height / 100) ** 2) : 0;
    const bmiThreshold = CLINICAL_THRESHOLDS.BMI_NORMAL_UPPER;
    const bmiBorderlineThreshold = bmiThreshold * 0.95;
    let bmiStatus: BiometricResult['status'] = 'healthy';
    let bmiNote: string | undefined;

    if (bmiValue >= bmiThreshold) {
        bmiStatus = 'high_risk';
    } else if (bmiValue >= bmiBorderlineThreshold && bmiValue < bmiThreshold) {
        bmiStatus = 'borderline';
        bmiNote = t('borderline_note_bmi').replace('{threshold}', String(bmiThreshold));
    }
    
    // --- Waist Circumference Analysis ---
    const waistInCm = waistCircumference * 2.54;
    const isMale = gender === 'male';
    const waistThresholdCm = isMale ? CLINICAL_THRESHOLDS.WAIST_MALE_HIGH : CLINICAL_THRESHOLDS.WAIST_FEMALE_HIGH;
    const waistThresholdInch = (waistThresholdCm / 2.54).toFixed(1);
    const waistBorderlineThresholdCm = waistThresholdCm * 0.95;

    let waistStatus: BiometricResult['status'] = 'healthy';
    let waistNote: string | undefined;

    if (waistInCm >= waistThresholdCm) {
        waistStatus = 'high_risk';
    } else if (waistInCm >= waistBorderlineThresholdCm && waistInCm < waistThresholdCm) {
        waistStatus = 'borderline';
        waistNote = t('borderline_note_waist').replace('{threshold}', String(waistThresholdInch));
    }
    
    return {
        bmi: {
            value: bmiValue.toFixed(1),
            status: bmiStatus,
            note: bmiNote,
        },
        waist: {
            value: `${waistCircumference} inch`,
            status: waistStatus,
            note: waistNote,
        }
    };
}
