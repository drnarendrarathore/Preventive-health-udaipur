
import React, { useState, useReducer, useEffect } from 'react';
import type { UserData, AnalysisResponse, Action } from './types.ts';
import { Analytics } from '@vercel/analytics/react';
import { track } from '@vercel/analytics';

import WelcomeStep from './components/WelcomeStep.tsx';
import BasicInfoStep from './components/BasicInfoStep.tsx';
import HabitsStep from './components/HabitsStep.tsx';
import RiskFactorsStep from './components/RiskFactorsStep.tsx';
import ResultsDisplay from './components/ResultsDisplay.tsx';
import SkeletonLoader from './components/SkeletonLoader.tsx';
import StepIndicator from './components/StepIndicator.tsx';

import { generateRecommendations } from './services/rulesEngine.ts';
import { t } from './locales/index.ts';

const initialUserData: UserData = {
    name: '',
    age: undefined,
    gender: 'male',
    womenHealthStatus: 'default',
    waistCircumference: 0, // 0 triggers smart default logic
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
    height: 0, // 0 triggers smart default logic
    weight: 0, // 0 triggers smart default logic
};

/**
 * Sanitizes data loaded from localStorage to match the current UserData structure.
 * This prevents stale or old keys from previous app versions from corrupting the state.
 * @param stored - The parsed object from localStorage.
 * @param defaults - The current initialUserData object, which serves as the schema.
 * @returns A clean UserData object.
 */
// FIX: Fortified data sanitization to prevent state corruption from malformed or outdated localStorage data by adding type-checking against the default schema.
const sanitizeStoredData = (stored: object, defaults: UserData): UserData => {
    const sanitizedData: Partial<UserData> = {};
    const defaultKeys = Object.keys(defaults) as Array<keyof UserData>;
    
    // Handle legacy pack conversion if migrating old data
    // We check stored object directly because smokingPacksPerDay is not in defaults (UserData)
    if ('smokingPacksPerDay' in stored && !(stored as any)['smokingSticksPerDay']) {
        const packs = (stored as any)['smokingPacksPerDay'];
        if (typeof packs === 'number') {
            sanitizedData.smokingSticksPerDay = packs * 20;
        }
    }

    for (const key of defaultKeys) {
        if (Object.prototype.hasOwnProperty.call(stored, key)) {
            const storedValue = (stored as any)[key];
            const defaultValue = defaults[key];

            // Basic type validation: ensure stored value type matches default value type.
            // This prevents issues like a string being loaded for an age (number) field.
            if (typeof storedValue === typeof defaultValue) {
                // Additional check for arrays, since typeof [] is 'object'.
                if (Array.isArray(defaultValue) && !Array.isArray(storedValue)) {
                    continue; // Skip if default is an array but the stored value is not.
                }
                 // Allow dynamic property assignment.
                (sanitizedData as any)[key] = storedValue;
            }
        }
    }
    // Merge the sanitized, stored data over the defaults to ensure a complete and valid state.
    return { ...defaults, ...sanitizedData };
};


function userDataReducer(state: UserData, action: Action): UserData {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'REPLACE_STATE':
        return action.payload;
    case 'RESET_STATE':
      return initialUserData;
    default:
      return state;
  }
}

const getInitialState = (): {step: number, userData: UserData} => {
    try {
        const storedStep = localStorage.getItem('health-app-step');
        const storedDataString = localStorage.getItem('health-app-data');
        const step = storedStep ? parseInt(storedStep, 10) : 1;

        if (storedDataString) {
            const parsedData = JSON.parse(storedDataString);
            if (typeof parsedData === 'object' && parsedData !== null) {
                const userData = sanitizeStoredData(parsedData, initialUserData);
                return { step, userData };
            }
        }
        
        return { step: 1, userData: initialUserData };
    } catch (error) {
        console.error("Failed to restore session, starting fresh:", error);
        return { step: 1, userData: initialUserData };
    }
}

function App() {
    const initialState = getInitialState();

    const [step, setStep] = useState(initialState.step);
    const [userData, dispatch] = useReducer(userDataReducer, initialState.userData);
    
    const [results, setResults] = useState<AnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [direction, setDirection] = useState<'forward' | 'backward' | 'fade'>('fade');
    
    // BUG FIX: Ensure each new step view starts at the top of the page.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    useEffect(() => {
        // Persist the current step and user data to localStorage
        // Stability Fix: Wrapped in try-catch to prevent quota exceeded errors crashing the app
        try {
            localStorage.setItem('health-app-step', String(step));
            localStorage.setItem('health-app-data', JSON.stringify(userData));
        } catch (e) {
            console.warn("Storage quota exceeded or disabled. Session persistence may be lost.");
        }
    }, [step, userData]);

    const trackResults = (response: AnalysisResponse) => {
        track('screening_completed', { score: response.cbacScore });
        if (response.cbacScore >= 6) {
            track('high_risk_detected', { score: response.cbacScore });
        }
    };

    // If the app loads directly on the results step (e.g., after a refresh),
    // and we have user data but no results yet, generate them.
    useEffect(() => {
        if (step === 5 && !results && userData.name) {
             try {
                const response = generateRecommendations(userData);
                setResults(response);
                trackResults(response);
            } catch (e: any) {
                setError(e.message || "An unknown error occurred.");
            }
        }
    }, []); // Run only on initial mount

    const handleNext = () => {
        setDirection('forward');
        setStep(prev => prev + 1);
    };
    const handleBack = () => {
        setDirection('backward');
        setStep(prev => prev - 1);
    };

    const handleSubmit = () => {
        setDirection('fade');
        setIsLoading(true);
        setError(null);
        setStep(5);
        // Explicitly set step to 5 in storage to allow reloading on the results page.
        try {
            localStorage.setItem('health-app-step', '5'); 
        } catch(e) { /* Ignore storage errors */ }

        setTimeout(() => {
            try {
                const response = generateRecommendations(userData);
                setResults(response);
                trackResults(response);
            } catch (e: any) {
                setError(e.message || "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        }, 1800);
    };
    
    const handleReset = () => {
        setDirection('fade');
        dispatch({ type: 'RESET_STATE' });
        setStep(1);
        setResults(null);
        setError(null);
        setIsLoading(false);
        try {
            localStorage.removeItem('health-app-data');
            localStorage.removeItem('health-app-step');
        } catch(e) { /* Ignore storage errors */ }
    };

    const renderStep = () => {
        switch (step) {
            case 1: return <WelcomeStep onNext={handleNext} />;
            case 2: return <BasicInfoStep data={userData} dispatch={dispatch} onNext={handleNext} onBack={handleBack} />;
            case 3: return <HabitsStep data={userData} dispatch={dispatch} onNext={handleNext} onBack={handleBack} />;
            case 4: return <RiskFactorsStep data={userData} dispatch={dispatch} onSubmit={handleSubmit} onBack={handleBack} />;
            case 5:
                if (isLoading || !results) return <SkeletonLoader />;
                if (error) return <div className="error-display"><h2>{t('error_title')}</h2><p>{error}</p><button onClick={handleReset} className="btn btn-primary">{t('error_try_again')}</button></div>;
                return <ResultsDisplay results={results} onReset={handleReset} userData={userData} />;
            default: return <WelcomeStep onNext={handleNext} />;
        }
    }

    return (
        <div className="app-container">
            <main className="content-wrapper">
                <div className="content-inner">
                    {step > 1 && step < 5 && <StepIndicator currentStep={step} />}
                    <div key={step} className={`step-wrapper ${direction}`}>
                        {renderStep()}
                    </div>
                </div>
            </main>
            <Analytics />
        </div>
    );
}

export default App;
