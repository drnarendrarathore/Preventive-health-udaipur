
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { UserData, Action, UserDataErrors } from '../types.ts';
import { t } from '../locales/index.ts';
import TextInput from './form/TextInput.tsx';
import InteractiveBMICalculator from './form/InteractiveBMICalculator.tsx';
import { CLINICAL_THRESHOLDS } from '../constants.ts';

interface BasicInfoStepProps {
  data: UserData;
  dispatch: React.Dispatch<Action>;
  onNext: () => void;
  onBack: () => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, dispatch, onNext, onBack }) => {
  const [errors, setErrors] = useState<UserDataErrors>({name: null, age: null});

  // FIX: Preserve women's health status to prevent data loss when toggling gender.
  const lastWomenHealthStatus = useRef(data.womenHealthStatus);
  useEffect(() => {
    if (data.gender === 'female' && data.womenHealthStatus !== 'default') {
        lastWomenHealthStatus.current = data.womenHealthStatus;
    }
  }, [data.womenHealthStatus, data.gender]);


  const triggerHapticFeedback = () => {
    if (navigator.vibrate) navigator.vibrate(50);
  };
  
  const validateField = (field: keyof UserData, value: any): string | null => {
      if (field === 'name') return value.trim().length < 2 ? t('validation_name_required') : null;
      if (field === 'age') {
          if (!value) return t('validation_age_required');
          if (value < CLINICAL_THRESHOLDS.MINIMUM_PATIENT_AGE || value > CLINICAL_THRESHOLDS.MAXIMUM_PATIENT_AGE) return t('validation_age_invalid');
          return null;
      }
      return null;
  }

  const handleFieldChange = (field: keyof UserData, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
    const error = validateField(field, value);
    setErrors(prev => ({...prev, [field]: error}));
  }
  
  const handleGenderChange = (gender: 'male' | 'female' | 'other') => {
      triggerHapticFeedback();
      const previousGender = data.gender;
      dispatch({ type: 'UPDATE_FIELD', field: 'gender', value: gender });

      // If gender was female and is now something else, reset women's health status
      if (previousGender === 'female' && gender !== 'female') {
          dispatch({ type: 'UPDATE_FIELD', field: 'womenHealthStatus', value: 'default' });
      } else if (gender === 'female' && previousGender !== 'female') {
          // If toggling back to female, restore the last known selection.
          dispatch({ type: 'UPDATE_FIELD', field: 'womenHealthStatus', value: lastWomenHealthStatus.current });
      }
  };

  const isFormValid = useMemo(() => {
    return data.name.trim() !== '' && data.age >= CLINICAL_THRESHOLDS.MINIMUM_PATIENT_AGE && data.age <= CLINICAL_THRESHOLDS.MAXIMUM_PATIENT_AGE && data.gender !== '' && !!data.height && !!data.weight && !!data.waistCircumference
  }, [data]);

  return (
    <div className="step-content">
        <h2 className="step-header">{t('basics_title')}</h2>
        <p className="step-subheader">{t('basics_subtitle')}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <TextInput id="name" label={t('name_label')} value={data.name || ''} onChange={(val) => handleFieldChange('name', val)} placeholder={t('name_placeholder')} error={errors.name} />
            <TextInput id="age" type="number" label={t('age_label')} value={data.age || ''} onChange={(val) => handleFieldChange('age', parseInt(val) || 0)} placeholder={t('age_placeholder')} error={errors.age} />
            
            <InteractiveBMICalculator data={data} dispatch={dispatch} />

            <div className="form-group">
                <label className="form-label">{t('gender_label')}</label>
                <div className="radio-group">
                    {(['male', 'female', 'other'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            className={`radio-label ${data.gender === option ? 'selected' : ''}`}
                            onClick={() => handleGenderChange(option)}
                        >
                            {t(`gender_${option}`)}
                        </button>
                    ))}
                </div>
            </div>
            
            {data.gender === 'female' && (
                <div className="conditional-form-group animate-fade-in">
                    <label className="form-label">{t('women_health_status_label')}</label>
                    <div className="radio-group">
                        {(['default', 'pregnant', 'menopause'] as const).map((option) => (
                             <button
                                key={option}
                                type="button"
                                className={`radio-label ${data.womenHealthStatus === option ? 'selected' : ''}`}
                                onClick={() => {
                                    triggerHapticFeedback();
                                    dispatch({ type: 'UPDATE_FIELD', field: 'womenHealthStatus', value: option });
                                }}
                            >
                                {t(`women_health_status_${option}`)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="step-actions">
            <button onClick={onBack} className="btn-link">{t('back')}</button>
            <button onClick={onNext} disabled={!isFormValid} className="btn btn-primary">{t('next')}</button>
        </div>
    </div>
  );
};

export default BasicInfoStep;
