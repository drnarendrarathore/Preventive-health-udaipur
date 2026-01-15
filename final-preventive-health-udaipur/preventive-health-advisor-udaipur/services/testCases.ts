
import { UserData } from '../types.ts';
import { DISEASE_CONDITIONS } from '../constants.ts';

const baseProfile: UserData = {
    name: '',
    age: 30,
    gender: 'male',
    waistCircumference: 32,
    cookingFuelType: 'lpg',
    hasOralSigns: false,
    smokingStatus: 'never',
    smokingSticksPerDay: 0,
    smokingYears: 0,
    usesSmokelessTobacco: false,
    smokelessTobaccoProducts: [],
    alcoholFrequency: 'none',
    saltIntake: 'moderate',
    physicalActivity: 'moderate',
    hpvVaccineStatus: 'none',
    hepatitisHistory: 'none',
    marbleMiningExposure: false,
    familyHistory: [],
    familyHistoryUnsure: false,
    personalConditions: [],
    height: 170,
    weight: 65,
};

export const TEST_CASES: { id: string; name: string; description: string; data: UserData }[] = [
    {
        id: '01',
        name: 'Metabolic Syndrome Protocol',
        description: 'Male, 45, Obese, High BP, Smoker. Should trigger Metabolic Protocol.',
        data: {
            ...baseProfile,
            name: 'Rajesh Metabolic',
            age: 45,
            gender: 'male',
            height: 170,
            weight: 90, // BMI ~31 (Obese)
            waistCircumference: 40, // High Risk
            smokingStatus: 'current',
            smokingSticksPerDay: 20, // 1 pack = 20 sticks
            smokingYears: 20,
            personalConditions: [DISEASE_CONDITIONS.HIGH_BLOOD_PRESSURE],
        }
    },
    {
        id: '02',
        name: 'Occupational Lung Risk',
        description: 'Miner, Biomass Fuel. Should trigger Comprehensive Lung Assessment.',
        data: {
            ...baseProfile,
            name: 'Kishan Miner',
            age: 52,
            gender: 'male',
            cookingFuelType: 'biomass',
            marbleMiningExposure: true,
            smokingStatus: 'former',
            smokingSticksPerDay: 20, // 1 pack = 20 sticks
            smokingYears: 15,
            quitSmokingYear: 2020,
        }
    },
    {
        id: '03',
        name: 'Hereditary Breast Risk',
        description: 'Female, 32, Mother Breast Ca @ 40. Early screening check.',
        data: {
            ...baseProfile,
            name: 'Anjali Genetic',
            age: 32,
            gender: 'female',
            familyHistory: [
                { condition: DISEASE_CONDITIONS.BREAST_CANCER, relativeAgeAtDiagnosis: 40 }
            ]
        }
    },
    {
        id: '04',
        name: 'Lynch Syndrome Suspect',
        description: 'Male, 42. Family Colon & Uterine Ca. Early Colon screening.',
        data: {
            ...baseProfile,
            name: 'Vikram Lynch',
            age: 42,
            gender: 'male',
            familyHistory: [
                { condition: DISEASE_CONDITIONS.COLON_CANCER, relativeAgeAtDiagnosis: 45 },
                { condition: DISEASE_CONDITIONS.UTERINE_CANCER, relativeAgeAtDiagnosis: 50 }
            ]
        }
    },
    {
        id: '05',
        name: 'Diabetic Management',
        description: 'Female, 55, Diabetic. Eye/Foot/Kidney checks.',
        data: {
            ...baseProfile,
            name: 'Sunita Diabetic',
            age: 55,
            gender: 'female',
            height: 160,
            weight: 80,
            personalConditions: [DISEASE_CONDITIONS.DIABETES_TYPE_2],
        }
    },
    {
        id: '06',
        name: 'Oral Cancer High Risk',
        description: 'Male, 28, Gutka, Oral Patches. Immediate screening.',
        data: {
            ...baseProfile,
            name: 'Rahul Gutka',
            age: 28,
            gender: 'male',
            usesSmokelessTobacco: true,
            smokelessTobaccoProducts: ['gutka'],
            hasOralSigns: true,
        }
    },
    {
        id: '07',
        name: 'Liver & Alcohol',
        description: 'Male, 38, Hep B, High Alcohol.',
        data: {
            ...baseProfile,
            name: 'Suresh Liver',
            age: 38,
            gender: 'male',
            alcoholFrequency: 'high',
            hepatitisHistory: 'hep_b',
        }
    },
    {
        id: '08',
        name: 'Lung CT Eligible (USPSTF)',
        description: 'Male, 60, Heavy Smoker (60 pack-years). Lung CT trigger.',
        data: {
            ...baseProfile,
            name: 'Bheru Smoker',
            age: 60,
            gender: 'male',
            smokingStatus: 'current',
            smokingSticksPerDay: 40, // 2 packs = 40 sticks
            smokingYears: 30,
        }
    },
    {
        id: '09',
        name: 'Borderline Risk',
        description: 'Female, 45. Borderline BMI/Waist. Lifestyle alert check.',
        data: {
            ...baseProfile,
            name: 'Meena Borderline',
            age: 45,
            gender: 'female',
            height: 160,
            weight: 60, // BMI 23.4 (Borderline)
            waistCircumference: 32, // Borderline for female (Asian)
            saltIntake: 'high',
        }
    },
    {
        id: '10',
        name: 'Max Load (Multi-Morbid)',
        description: 'Male, 72. Many conditions. PDF Pagination Stress Test.',
        data: {
            ...baseProfile,
            name: 'Daulat Senior',
            age: 72,
            gender: 'male',
            smokingStatus: 'current',
            alcoholFrequency: 'high',
            waistCircumference: 42,
            personalConditions: [
                DISEASE_CONDITIONS.DIABETES_TYPE_2, 
                DISEASE_CONDITIONS.HIGH_BLOOD_PRESSURE,
                DISEASE_CONDITIONS.HEART_DISEASE
            ],
            familyHistory: [
                { condition: DISEASE_CONDITIONS.COLON_CANCER, relativeAgeAtDiagnosis: 60 }
            ],
            cookingFuelType: 'biomass',
            marbleMiningExposure: true
        }
    }
];
