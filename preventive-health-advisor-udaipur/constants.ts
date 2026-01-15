

export const STEPS = [
    { id: 1, nameKey: 'step_welcome' },
    { id: 2, nameKey: 'step_basics' },
    { id: 3, nameKey: 'step_habits' },
    { id: 4, nameKey: 'step_risk_factors' },
    { id: 5, nameKey: 'step_results' }
];

export const DISEASE_CONDITIONS = {
    DIABETES_TYPE_2: 'Diabetes (Type 2)',
    HIGH_BLOOD_PRESSURE: 'High Blood Pressure',
    HIGH_CHOLESTEROL: 'High Cholesterol',
    HEART_DISEASE: 'Heart Disease',
    STROKE: 'Stroke',
    OBESITY: 'Obesity',
    CHRONIC_KIDNEY_DISEASE: 'Chronic Kidney Disease',
    
    BREAST_CANCER: 'Breast Cancer',
    MALE_BREAST_CANCER: 'Male Breast Cancer',
    COLON_CANCER: 'Colon Cancer',
    PROSTATE_CANCER: 'Prostate Cancer',
    OVARIAN_CANCER: 'Ovarian Cancer',
    PANCREATIC_CANCER: 'Pancreatic Cancer',
    MELANOMA: 'Melanoma',
    UTERINE_CANCER: 'Uterine Cancer'
};


export const CANCER_HISTORY_OPTIONS = [
    DISEASE_CONDITIONS.BREAST_CANCER,
    DISEASE_CONDITIONS.MALE_BREAST_CANCER,
    DISEASE_CONDITIONS.COLON_CANCER,
    DISEASE_CONDITIONS.PROSTATE_CANCER,
    DISEASE_CONDITIONS.OVARIAN_CANCER,
    DISEASE_CONDITIONS.PANCREATIC_CANCER,
    DISEASE_CONDITIONS.MELANOMA,
    DISEASE_CONDITIONS.UTERINE_CANCER
];

export const FAMILY_HISTORY_OPTIONS = {
    'Cancers': CANCER_HISTORY_OPTIONS,
    'Heart & Circulation': [
        DISEASE_CONDITIONS.HEART_DISEASE,
        DISEASE_CONDITIONS.STROKE,
        DISEASE_CONDITIONS.HIGH_BLOOD_PRESSURE,
        DISEASE_CONDITIONS.HIGH_CHOLESTEROL
    ],
    'Metabolic Conditions': [
        DISEASE_CONDITIONS.DIABETES_TYPE_2
    ]
};

export const PERSONAL_CONDITIONS_OPTIONS = {
    'Heart & Circulation': [
        DISEASE_CONDITIONS.HIGH_BLOOD_PRESSURE,
        DISEASE_CONDITIONS.HIGH_CHOLESTEROL
    ],
    'Metabolic Conditions': [
        DISEASE_CONDITIONS.DIABETES_TYPE_2,
        DISEASE_CONDITIONS.OBESITY
    ],
    'Other': [
        DISEASE_CONDITIONS.CHRONIC_KIDNEY_DISEASE,
    ]
};

export const RELATIONSHIP_OPTIONS = [
    { value: 'parent', labelKey: 'rel_parent' },
    { value: 'sibling', labelKey: 'rel_sibling' },
    { value: 'child', labelKey: 'rel_child' },
    { value: 'extended', labelKey: 'rel_extended' },
];

// FIX: Centralized all clinical logic thresholds and magic numbers to ensure a single source of truth.
export const CLINICAL_THRESHOLDS = {
    CBAC_SCORE_MAX: 10,
    
    // Age thresholds for CBAC score calculation
    CBAC_AGE_BRACKETS: {
        LOW: 39, // up to 39
        MEDIUM: 49,
        HIGH: 59,
    },
    
    // Waist circumference thresholds in cm (Asian standards)
    WAIST_MALE_HIGH: 90,
    WAIST_FEMALE_HIGH: 80,
    
    // Smoking-related thresholds for lung cancer screening (USPSTF)
    LUNG_SCREENING_MIN_AGE: 50,
    LUNG_SCREENING_MAX_AGE: 80,
    LUNG_SCREENING_MIN_PACK_YEARS: 20,
    LUNG_SCREENING_YEARS_SINCE_QUIT: 15,
    
    // Age ranges for various screenings
    CERVICAL_SCREENING_MIN_AGE: 30,
    CERVICAL_SCREENING_MAX_AGE: 65,
    BREAST_SCREENING_MIN_AGE: 40,
    BREAST_SCREENING_MAX_AGE: 74,
    BREAST_SCREENING_HIGH_RISK_MIN_AGE: 30,
    COLON_SCREENING_MIN_AGE: 45,
    COLON_SCREENING_MAX_AGE: 75,
    COLON_SCREENING_HIGH_RISK_MIN_AGE: 40,
    PROSTATE_SCREENING_MIN_AGE: 45,
    PROSTATE_SCREENING_HIGH_RISK_MIN_AGE: 40,
    
    // BMI thresholds for Asian populations
    BMI_NORMAL_UPPER: 23,
    BMI_OVERWEIGHT_UPPER: 25,

    // General
    MINIMUM_PATIENT_AGE: 18,
    MAXIMUM_PATIENT_AGE: 120,

    EARLY_ONSET_CANCER_AGE: 50,
    ABSOLUTE_MIN_HIGH_RISK_SCREENING_AGE: 25,

    // Thresholds for the Lifestyle & Genetic Risk Alert
    LIFESTYLE_ALERT_MAX_AGE: 40,
    LIFESTYLE_ALERT_MIN_PACK_YEARS: 15,

    // Thresholds for the Holistic Lung Health Pathway
    PULMONOLOGIST_CONSULT_MIN_PACK_YEARS: 10,
};
