import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { UserData, Action, UserDataErrors } from '../types.ts';
import { t } from '../locales/index.ts';
import TextInput from './form/TextInput.tsx';
import InteractiveBMICalculator from './form/InteractiveBMICalculator.tsx';
import { CLINICAL_THRESHOLDS } from '../constants.ts';
import RadioGroup from './form/RadioGroup.tsx';

interface BasicInfoStepProps {
  data: UserData;
  dispatch: React.Dispatch<Action>;
  onNext: () => void;
  onBack: () => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, dispatch, onNext, onBack }) => {
  const [errors, setErrors] = useState<UserDataErrors>({name: null, age: null});
  const [touched, setTouched] = useState<{name: boolean; age: boolean}>({ name: false, age: false });

  const lastWomenHealthStatus = useRef(data.womenHealthStatus);
  useEffect(() => {
    if (data.gender === 'female' && data.womenHealthStatus !== 'default') {
        lastWomenHealthStatus.current = data.womenHealthStatus;
    }
  }, [data.womenHealthStatus, data.gender]);

  const validateField = (field: keyof UserData, value: any): string | null => {
      if (field === 'name') return value.trim().length < 2 ? t('validation_name_required') : null;
      if (field === 'age') {
          if (value === undefined || value === null) return t('validation_age_required');
          if (value < CLINICAL_THRESHOLDS.MINIMUM_PATIENT_AGE || value > CLINICAL_THRESHOLDS.MAXIMUM_PATIENT_AGE) return t('validation_age_invalid');
          return null;
      }
      return null;
  }

  // Effect to re-validate only already-touched fields when data changes
  useEffect(() => {
    if (touched.name) {
        setErrors(prev => ({...prev, name: validateField('name', data.name)}));
    }
    if (touched.age) {
        setErrors(prev => ({...prev, age: validateField('age', data.age)}));
    }
  }, [data.name, data.age, touched]);

  const handleFieldChange = (field: keyof UserData, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
    // If field is already in error state, clear it immediately on change (good UX)
    if (errors[field as keyof UserDataErrors]) {
         setErrors(prev => ({...prev, [field]: null}));
    }
  }

  const handleBlur = (field: 'name' | 'age') => {
      setTouched(prev => ({ ...prev, [field]: true }));
      // Trigger immediate validation on blur
      if (field === 'name') setErrors(prev => ({...prev, name: validateField('name', data.name)}));
      if (field === 'age') setErrors(prev => ({...prev, age: validateField('age', data.age)}));
  }
  
  const handleGenderChange = (gender: 'male' | 'female' | 'other' | '') => {
      const previousGender = data.gender;
      dispatch({ type: 'UPDATE_FIELD', field: 'gender', value: gender });

      if (previousGender === 'female' && gender !== 'female') {
          dispatch({ type: 'UPDATE_FIELD', field: 'womenHealthStatus', value: 'default' });
      } else if (gender === 'female' && previousGender !== 'female') {
          dispatch({ type: 'UPDATE_FIELD', field: 'womenHealthStatus', value: lastWomenHealthStatus.current });
      }
  };

  const isFormValid = useMemo(() => {
    return data.name.trim() !== '' && data.age !== undefined && data.age >= CLINICAL_THRESHOLDS.MINIMUM_PATIENT_AGE && data.age <= CLINICAL_THRESHOLDS.MAXIMUM_PATIENT_AGE && data.gender !== '' && !!data.height && !!data.weight && !!data.waistCircumference
  }, [data]);

  const genderOptions = [
      { value: 'male', label: t('gender_male') },
      { value: 'female', label: t('gender_female') },
      { value: 'other', label: t('gender_other') },
  ] as { value: 'male' | 'female' | 'other'; label: string }[];
  
  const womenHealthOptions = [
      { value: 'default', label: t('women_health_status_default') },
      { value: 'pregnant', label: t('women_health_status_pregnant') },
      { value: 'menopause', label: t('women_health_status_menopause') },
  ] as { value: 'default' | 'pregnant' | 'menopause'; label: string }[];

  return (
    <div className="step-content">
        <h2 className="step-header">{t('basics_title')}</h2>
        <p className="step-subheader">{t('basics_subtitle')}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Added a Grid for larger screens to place Name/Age side-by-side */}
            <div className="slider-group-horizontal">
                <div className="slider-group">
                    <TextInput 
                        id="name" 
                        label={t('name_label')} 
                        value={data.name || ''} 
                        onChange={(val) => handleFieldChange('name', val)} 
                        onBlur={() => handleBlur('name')}
                        placeholder={t('name_placeholder')} 
                        error={errors.name} 
                    />
                </div>
                <div className="slider-group">
                    <TextInput
                        id="age"
                        type="number"
                        label={t('age_label')}
                        value={data.age ?? ''}
                        onChange={(val) => {
                            const num = parseInt(val, 10);
                            handleFieldChange('age', isNaN(num) ? undefined : num);
                        }}
                        onBlur={() => handleBlur('age')}
                        placeholder={t('age_placeholder')}
                        error={errors.age}
                    />
                </div>
            </div>
            
            <InteractiveBMICalculator data={data} dispatch={dispatch} />

            <RadioGroup
                label={t('gender_label')}
                options={genderOptions}
                selectedValue={data.gender || 'male'}
                onChange={handleGenderChange}
            />
            
            {data.gender === 'female' && (
                <div className="conditional-form-group animate-fade-in">
                    <RadioGroup
                        label={t('women_health_status_label')}
                        options={womenHealthOptions}
                        selectedValue={data.womenHealthStatus || 'default'}
                        onChange={(val) => dispatch({ type: 'UPDATE_FIELD', field: 'womenHealthStatus', value: val })}
                    />
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