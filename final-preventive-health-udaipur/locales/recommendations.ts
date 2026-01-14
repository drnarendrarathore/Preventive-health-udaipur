import type { Recommendation } from '../types.ts';
import { t } from './index.ts';

type BaseRec = { category: string; test: string; frequency: string; };
type DetailItem = 
  | { title: string; content: string; }
  | { interactiveComponent: 'AnimatedHeart' | 'AnimatedBloodSugar'; };
type Details = DetailItem[];

type LocalizedDetails = Record<string, Details>;

const baseRecommendations: Record<string, BaseRec> = {
    bp: { category: 'rec_cat_cardio', test: 'rec_test_bp', frequency: 'rec_freq_bp_normal' },
    sugar: { category: 'rec_cat_metabolic', test: 'rec_test_sugar', frequency: 'rec_freq_sugar' },
    oral: { category: 'rec_cat_cancer', test: 'rec_test_oral', frequency: 'rec_freq_oral' },
    cervix: { category: 'rec_cat_womens', test: 'rec_test_cervix', frequency: 'rec_freq_cervix' },
    lung: { category: 'rec_cat_cancer', test: 'rec_test_lung', frequency: 'rec_freq_lung'},
    liver_hep: { category: 'rec_cat_liver', test: 'rec_test_liver_hep', frequency: 'rec_freq_liver_hep' },
    hpv_prevention: { category: 'rec_cat_preventive', test: 'rec_test_hpv_prevention', frequency: 'rec_freq_hpv_prevention' },
    gastric_screening: { category: 'rec_cat_digestive', test: 'rec_test_gastric_screening', frequency: 'rec_freq_gastric_screening' },
    occupational_lung: { category: 'rec_cat_respiratory', test: 'rec_test_occupational_lung', frequency: 'rec_freq_occupational_lung' },
    breast_cbe: { category: 'rec_cat_womens', test: 'rec_test_breast_cbe', frequency: 'rec_freq_breast_cbe' },
    breast_general: { category: 'rec_cat_womens', test: 'rec_test_breast_general', frequency: 'rec_freq_breast_general'},
    colon_general: { category: 'rec_cat_digestive', test: 'rec_test_colon_general', frequency: 'rec_freq_colon_general'},
    prostate: { category: 'rec_cat_mens', test: 'rec_test_prostate', frequency: 'rec_freq_prostate'},
    lifestyle: { category: 'rec_cat_wellbeing', test: 'rec_test_lifestyle', frequency: 'rec_freq_lifestyle' },
    diabetic_retinopathy: { category: 'rec_cat_metabolic', test: 'rec_test_diabetic_retinopathy', frequency: 'rec_freq_diabetic_retinopathy' },
    diabetic_foot: { category: 'rec_cat_metabolic', test: 'rec_test_diabetic_foot', frequency: 'rec_freq_diabetic_foot' },
    diabetic_kidney: { category: 'rec_cat_metabolic', test: 'rec_test_diabetic_kidney', frequency: 'rec_freq_diabetic_kidney' },
    pulmonologist_consult: { category: 'rec_cat_respiratory', test: 'rec_test_pulmonologist_consult', frequency: 'rec_freq_pulmonologist_consult' },
    comprehensive_lung_assessment: { category: 'rec_cat_respiratory', test: 'rec_test_comprehensive_lung_assessment', frequency: 'rec_freq_comprehensive_lung_assessment' },
    metabolic_syndrome_protocol: { category: 'rec_cat_metabolic', test: 'rec_test_metabolic_syndrome_protocol', frequency: 'rec_freq_metabolic_syndrome_protocol' },
};

const enData = {
    reasons: {
        'colon_general_reason': "Recommended for adults aged 45-75 to screen for colorectal cancer.",
        'colon_general_high_risk_reason': "Earlier screening is recommended due to a family history of colon cancer.",
        'colon_general_high_risk_reason_age': "Earlier screening is critical due to a close relative being diagnosed under age 50.",
        'colon_general_high_risk_reason_uterine': "Earlier screening is recommended. A family history of uterine cancer can increase colorectal cancer risk (Lynch syndrome).",
        'breast_general_reason': "Recommended for women aged 40-74 to screen for breast cancer.",
        'breast_general_high_risk_reason': "Earlier screening is recommended due to family history, genetic ancestry, or other risk factors.",
        'breast_general_high_risk_reason_age': "Earlier screening is critical due to a close relative being diagnosed under age 50.",
        'breast_cbe_reason': "Recommended as part of an annual check-up for women over 30.",
        'cervix_reason': "Recommended for women aged 30-65 to screen for cervical cancer.",
        'lung_reason': "Recommended for current or former heavy smokers aged 50-80 to screen for lung cancer.",
        'bp_reason': "Recommended for all adults over 30 to monitor for high blood pressure.",
        'sugar_reason': "Recommended for all adults over 30 to screen for diabetes and pre-diabetes.",
        'oral_reason': "High risk due to tobacco use or observed oral patches.",
        'prostate_reason': "Recommended for men to discuss with their doctor, typically starting at age 45.",
        'prostate_high_risk_reason': "Earlier screening is critical due to a family history of prostate cancer, especially if diagnosed at a young age.",
        'liver_hep_reason': "Regular monitoring is crucial for individuals with a history of Hepatitis B or C.",
        'hpv_prevention_reason': "Vaccination can prevent HPV-related cancers. Recommended if not fully vaccinated.",
        'gastric_screening_reason': "A baseline check is advised due to a high-salt diet, a risk factor for stomach issues.",
        'occupational_lung_reason': "Recommended due to occupational exposure to dust (biomass fuel, marble/mining).",
        'lifestyle_reason': "General advice for improving diet, activity, and habits to reduce long-term health risks.",
        'reason_diabetic_retinopathy': "Essential for detecting diabetic retinopathy, a leading cause of vision loss in diabetics.",
        'reason_diabetic_foot': "Crucial for early detection of ulcers and nerve damage, preventing serious complications.",
        'reason_diabetic_kidney': "Necessary to monitor for diabetic nephropathy, a major cause of kidney failure.",
        'pulmonologist_consult_reason': "Recommended because a combination of factors (like past smoking, occupational exposure, or domestic smoke) increases your overall lung health risk, even if you don't qualify for a CT scan.",
        'comprehensive_lung_assessment_reason': "Due to your combined occupational exposure and use of biomass fuel, a consultation with a lung specialist (Pulmonologist) is advised to determine the best course of action, which may include tests like a chest X-ray and spirometry.",
        'metabolic_syndrome_protocol_reason': "Your results indicate multiple risk factors for metabolic syndrome (high blood pressure, high blood sugar risk, and high waist circumference). A holistic approach to managing diet, exercise, and weight is crucial."
    },
    details: {
        bp: [
            { interactiveComponent: 'AnimatedHeart' },
            { title: "Why it's important", content: "Uncontrolled high blood pressure can lead to severe complications like heart attacks, strokes, kidney failure, and vision problems. It's often called a 'silent killer' because it has no symptoms." },
            { title: "Who is this for?", content: "Everyone over 30 should be screened. Those with a high CBAC score, family history, or lifestyle risk factors need more frequent monitoring." },
            { title: "What to expect", content: "A simple, painless test using an inflatable cuff around your arm. Results are immediate. A reading below 120/80 mmHg is considered normal." }
        ],
        sugar: [
            { interactiveComponent: 'AnimatedBloodSugar' },
            { title: "Why it's important", content: "Early detection of pre-diabetes and diabetes allows for lifestyle changes or treatment that can prevent or delay serious health problems, such as heart disease, vision loss, and kidney disease." },
            { title: "Who is this for?", content: "Screening is crucial for all adults over 30 in India, especially those who are overweight (BMI > 23), have a family history, or have high blood pressure." },
            { title: "What to expect", content: "Tests include a fasting blood sugar test or an HbA1c test, which provides an average blood sugar level over the past 2-3 months. Both require a simple blood draw." }
        ],
        oral: [
            { title: "Why it's important", content: "Oral cancer is one of the most common cancers in India, largely due to tobacco use. Early detection dramatically increases survival rates." },
            { title: "Who is this for?", content: "This is a critical screening for anyone who uses any form of tobacco (smoking or chewing) or drinks alcohol heavily. Also important if you notice any non-healing ulcers or patches in your mouth." },
            { title: "What to expect", content: "A healthcare professional will visually inspect your entire mouth, including gums, tongue, and cheeks, for any abnormalities. It is quick and painless." }
        ],
        cervix: [
            { title: "Why it's important", content: "Cervical cancer is almost always caused by the Human Papillomavirus (HPV). Regular screening can find abnormal cells before they turn into cancer." },
            { title: "Who is this for?", content: "All women aged 30 to 65. The NP-NCD program in India focuses on this age group for maximum impact." },
            { title: "What to expect", content: "Screening can be a Pap test, an HPV test, or a combination. In many public health settings in India, Visual Inspection with Acetic Acid (VIA) is used, which is a quick and effective method." }
        ],
        lung: [
            { title: "Why it's important", content: "Lung cancer is the leading cause of cancer death, but if caught early with an LDCT scan, it is often treatable. This screening can reduce the risk of dying from lung cancer." },
            { title: "Who is this for?", content: "Adults aged 50 to 80 who have a 20 pack-year or more smoking history and currently smoke or have quit within the past 15 years." },
            { title: "What to expect", content: "An LDCT scan is a special type of X-ray that takes multiple pictures as you lie on a table that slides in and out of the machine. It is fast and painless." }
        ],
        breast_general: [
            { title: "Why it's important", content: "Mammograms are the best way to find breast cancer early, sometimes up to three years before it can be felt. Early detection leads to more effective treatment." },
            { title: "Who is this for?", content: "Generally for women aged 40-74. Women with a strong family history or other risk factors may need to start earlier and should discuss a personal screening plan with their doctor." },
            { title: "What to expect", content: "A mammogram is an X-ray of the breast. Each breast is compressed for a few seconds to get a clear picture. Some discomfort is normal but temporary." }
        ],
        diabetic_retinopathy: [
            { title: "Why it's important", content: "Diabetes can damage the blood vessels in the retina, the light-sensitive tissue at the back of the eye. This condition, diabetic retinopathy, often has no early symptoms but is a leading cause of blindness. Annual screening can detect it early enough for effective treatment." },
            { title: "Who is this for?", content: "This is a mandatory annual check-up for all individuals with a diagnosis of Type 2 Diabetes." },
            { title: "What to expect", content: "An ophthalmologist will dilate your pupils with eye drops and examine your retina using a special magnifying lens. The procedure is painless, but your vision may be blurry for a few hours afterwards." }
        ],
        diabetic_foot: [
            { title: "Why it's important", content: "Diabetes can cause nerve damage (neuropathy) and reduced blood flow to the feet. This can lead to a loss of sensation, making it easy to miss minor injuries, which can then develop into serious ulcers or infections, potentially requiring amputation. Regular exams can catch issues early." },
            { title: "Who is this for?", content: "This is a mandatory annual check-up for all individuals with a diagnosis of Type 2 Diabetes." },
            { title: "What to expect", content: "A doctor will visually inspect your feet for sores, blisters, and calluses. They will also check the pulses in your feet and test for loss of sensation using a soft nylon filament (monofilament test)." }
        ],
        diabetic_kidney: [
            { title: "Why it's important", content: "High blood sugar can damage the kidneys' filtering units over time, a condition called diabetic nephropathy. It is a leading cause of kidney failure. Early stages have no symptoms, so annual testing is crucial to detect damage and slow its progression." },
            { title: "Who is this for?", content: "This is a mandatory annual check-up for all individuals with a diagnosis of Type 2 Diabetes." },
            { title: "What to expect", content: "This involves two simple tests: a urine test (Urine Albumin-to-Creatinine Ratio or UACR) to check for a protein called albumin in the urine, and a blood test (eGFR) to see how well your kidneys are filtering waste." }
        ],
        pulmonologist_consult: [
            { title: "Why it's important", content: "While you may not meet the strict criteria for a lung cancer screening CT scan, having multiple risk factors warrants a specialist's evaluation. A pulmonologist can assess your overall lung health, discuss any symptoms, and determine if further testing like spirometry is needed." },
            { title: "Who is this for?", content: "Individuals with a combination of lung-related risk factors, such as a history of smoking, significant occupational dust exposure, or long-term use of biomass fuels in the home." },
            { title: "What to expect", content: "The consultation will involve a detailed discussion of your history and any respiratory symptoms. The doctor will listen to your breathing and may recommend a pulmonary function test (spirometry), which involves breathing into a small machine to measure lung capacity." }
        ],
        comprehensive_lung_assessment: [
            { title: "Why it's important", content: "You have multiple risk factors that affect your lung health. Instead of addressing them separately, a specialist can create a single, comprehensive plan. This ensures a more efficient and effective approach to monitoring and prevention, catching potential issues like COPD or other lung diseases early." },
            { title: "Who is this for?", content: "Individuals with a combination of lung-related risk factors, such as occupational dust exposure (mining, stone work) and long-term use of biomass fuels, who may not fit into standard screening categories." },
            { title: "What to expect", content: "A pulmonologist will review all your risk factors, discuss any symptoms, and perform a physical exam. They will then recommend the most appropriate next steps, which could include a breathing test (spirometry), a chest X-ray, or other monitoring." }
        ],
        metabolic_syndrome_protocol: [
            { title: "What is Metabolic Syndrome?", content: "Metabolic syndrome is not a single disease, but a cluster of conditions that occur together, increasing your risk of heart disease, stroke, and type 2 diabetes. These conditions include high blood pressure, high blood sugar, excess body fat around the waist, and abnormal cholesterol levels." },
            { title: "Why this is important for you", content: "Your assessment shows you have several key risk factors. By addressing them together through a coordinated plan with your doctor, you can significantly lower your long-term risk of major health events. Management focuses heavily on lifestyle changes." },
            { title: "What to expect", content: "Your doctor will likely confirm the diagnosis with a lipid profile (cholesterol test). The cornerstone of treatment is a commitment to a healthy lifestyle: heart-healthy eating (like the DASH diet), regular physical activity, and achieving a healthy weight. Medication may also be prescribed." }
        ]
    } as LocalizedDetails,
    disclaimer: "Privacy First: No data is stored. Consult a nearby doctor for clinical advice. Developed by Dr. Narendra Rathore (MD, MBBS)."
};

export const getRecommendationContent = (key: string, reasonKey: string): Omit<Recommendation, 'key' | 'priority'> => {
    const recTpl = baseRecommendations[key];
    if (!recTpl) {
        return { categoryKey: 'info', category: 'Info', test: key, frequency: '', reason: 'Reason not available' };
    }
    const reasonText = enData.reasons[reasonKey as keyof typeof enData.reasons];
    
    return { 
        categoryKey: recTpl.category,
        category: t(recTpl.category),
        test: t(recTpl.test),
        frequency: t(recTpl.frequency),
        reason: reasonText,
    };
};

export const getRecommendationDetails = (key: string): Details => {
    const details = enData.details[key];
    if (!details) return [];
    return details;
}

export const getDisclaimer = (): string => enData.disclaimer;