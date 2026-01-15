
export interface FamilyHistoryCondition {
  condition: string;
  relativeAgeAtDiagnosis?: number;
  relationship?: 'parent' | 'sibling' | 'child' | 'extended';
}

export interface UserData {
  name: string;
  age: number | undefined;
  gender: 'male' | 'female' | 'other' | '';
  womenHealthStatus?: 'default' | 'pregnant' | 'menopause';

  // NP-NCD Core
  waistCircumference: number; // in inch
  cookingFuelType: 'lpg' | 'biomass' | 'electric'; // Biomass = High COPD risk
  hasOralSigns: boolean; // White/red patches
  
  smokingStatus: 'never' | 'former' | 'current';
  smokingSticksPerDay?: number; // Changed from packs to sticks (Bidi/Cigarette)
  smokingYears?: number;
  quitSmokingYear?: number;
  
  alcoholFrequency: 'none' | 'moderate' | 'high';
  
  saltIntake: 'low' | 'moderate' | 'high';
  physicalActivity: 'sedentary' | 'moderate' | 'active';
  hpvVaccineStatus: 'none' | 'partial' | 'complete';
  hepatitisHistory: 'none' | 'hep_b' | 'hep_c' | 'both';
  marbleMiningExposure: boolean;

  smokelessTobaccoProducts: string[];
  usesSmokelessTobacco: boolean;
  
  familyHistory: FamilyHistoryCondition[];
  familyHistoryUnsure?: boolean;
  personalConditions: string[];
  
  height?: number; // in cm
  weight?: number; 
}

export interface UserDataErrors {
  name: string | null;
  age: string | null;
}

export interface Recommendation {
  key: string;
  categoryKey: string;
  category: string;
  test: string;
  frequency: string;
  reason: string;
  priority: 'high' | 'normal';
}

export interface AnalysisResponse {
  recommendations: Recommendation[];
  disclaimer: string;
  cbacScore: number;
  hasLifestyleRiskAlert?: boolean;
}

export type Action =
  | { type: 'UPDATE_FIELD'; field: keyof UserData; value: any }
  | { type: 'REPLACE_STATE'; payload: UserData }
  | { type: 'RESET_STATE' };

// --- Enhancement 4: Biometric Analysis Types ---
export interface BiometricResult {
    value: string;
    status: 'healthy' | 'borderline' | 'high_risk';
    note?: string;
}

export interface BiometricAnalysis {
    bmi: BiometricResult;
    waist: BiometricResult;
}
