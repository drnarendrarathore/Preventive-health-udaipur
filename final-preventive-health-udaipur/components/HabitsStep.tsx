import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { UserData, Action } from '../types.ts';
import { t } from '../locales/index.ts';
import TextInput from './form/TextInput.tsx';

interface HabitsStepProps {
  data: UserData;
  dispatch: React.Dispatch<Action>;
  onNext: () => void;
  onBack: () => void;
}

const HabitsStep: React.FC<HabitsStepProps> = ({ data, dispatch, onNext, onBack }) => {
  const showSmokingDetails = data.smokingStatus === 'current' || data.smokingStatus === 'former';
  const [animatedRisk, setAnimatedRisk] = useState<{ id: string | null; level: 'high' | 'moderate' | null }>({ id: null, level: null });
  const animationTimeoutRef = useRef<number | null>(null);
  
  // Local state for the controlled input to improve UX
  const [quitYearInput, setQuitYearInput] = useState<string>(() => data.quitSmokingYear?.toString() || '');
  const [quitYearError, setQuitYearError] = useState<string | null>(null);

  // --- Data Integrity Enhancement ---
  // Store the last valid smoking data to prevent accidental data loss on misclick.
  const lastSmokingData = useRef({ packs: data.smokingPacksPerDay, years: data.smokingYears });
  
  useEffect(() => {
    if (data.smokingStatus !== 'never' && (data.smokingPacksPerDay || 0) > 0 && (data.smokingYears || 0) > 0) {
      lastSmokingData.current = { packs: data.smokingPacksPerDay, years: data.smokingYears };
    }
  }, [data.smokingPacksPerDay, data.smokingYears, data.smokingStatus]);

  const packYears = useMemo(() => {
    return (data.smokingPacksPerDay || 0) * (data.smokingYears || 0);
  }, [data.smokingPacksPerDay, data.smokingYears]);

  const triggerHapticFeedback = () => {
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const triggerRiskAnimation = (id: string, level: 'high' | 'moderate') => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    setAnimatedRisk({ id, level });
    animationTimeoutRef.current = window.setTimeout(() => {
      setAnimatedRisk({ id: null, level: null });
    }, 750);
  };
  
  const smokelessProducts = [
    { id: 'gutka', label: t('smokeless_product_gutka') },
    { id: 'khaini', label: t('smokeless_product_khaini') },
    { id: 'mawa', label: t('smokeless_product_mawa') },
    { id: 'pan_tobacco', label: t('smokeless_product_pan_tobacco') }
  ];

  const handleQuitYearChange = (val: string) => {
      // Update local state immediately for a responsive input field
      setQuitYearInput(val);
      
      if (val.trim() === '') {
          setQuitYearError(null);
          dispatch({type: 'UPDATE_FIELD', field: 'quitSmokingYear', value: undefined});
          return;
      }
      
      const year = parseInt(val, 10);
      
      // Validate the input and update global state only if valid
      if (val.length <= 4 && year > 1950 && year <= new Date().getFullYear()) {
          setQuitYearError(null);
          dispatch({type: 'UPDATE_FIELD', field: 'quitSmokingYear', value: year});
      } else {
          setQuitYearError(t('validation_quit_year_invalid'));
          // Ensure global state doesn't hold a stale valid value if input becomes invalid
          if (data.quitSmokingYear !== undefined) {
            dispatch({type: 'UPDATE_FIELD', field: 'quitSmokingYear', value: undefined});
          }
      }
  };

  const handleSmokingStatusChange = (status: 'never' | 'former' | 'current') => {
      triggerHapticFeedback();
      const previousStatus = data.smokingStatus;
      dispatch({ type: 'UPDATE_FIELD', field: 'smokingStatus', value: status });

      if (status === 'current') {
          dispatch({ type: 'UPDATE_FIELD', field: 'quitSmokingYear', value: undefined });
          setQuitYearInput('');
          setQuitYearError(null);
          triggerRiskAnimation(`smoking-${status}`, 'high');
      }

      if (status === 'never') {
          // Clear the data, but it's preserved in lastSmokingData.current
          dispatch({ type: 'UPDATE_FIELD', field: 'smokingPacksPerDay', value: 0 });
          dispatch({ type: 'UPDATE_FIELD', field: 'smokingYears', value: 0 });
          dispatch({ type: 'UPDATE_FIELD', field: 'quitSmokingYear', value: undefined });
          setQuitYearInput('');
          setQuitYearError(null);
      } else if (previousStatus === 'never' && (status === 'current' || status === 'former')) {
          // If toggling back from 'Never', restore the remembered values instead of hardcoded defaults.
          const packsToRestore = lastSmokingData.current.packs > 0 ? lastSmokingData.current.packs : 1;
          const yearsToRestore = lastSmokingData.current.years > 0 ? lastSmokingData.current.years : 10;
          dispatch({ type: 'UPDATE_FIELD', field: 'smokingPacksPerDay', value: packsToRestore });
          dispatch({ type: 'UPDATE_FIELD', field: 'smokingYears', value: yearsToRestore });
      }
  };

  return (
    <div className="step-content">
        <h2 className="step-header">{t('habits_title')}</h2>
        <p className="step-subheader">{t('habits_subtitle')}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="form-group">
                <label className="form-label">{t('cooking_fuel_label')}</label>
                <div className="radio-group">
                    {(['lpg', 'biomass', 'electric'] as const).map((option) => (
                        <button key={option} type="button" onClick={() => {
                            triggerHapticFeedback();
                            dispatch({type: 'UPDATE_FIELD', field: 'cookingFuelType', value: option});
                            if (option === 'biomass') triggerRiskAnimation(`fuel-${option}`, 'high');
                        }} className={`radio-label ${data.cookingFuelType === option ? 'selected' : ''} ${animatedRisk.id === `fuel-${option}` ? `risk-glow-${animatedRisk.level}` : ''}`}>
                            {t(`cooking_fuel_${option}`)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">{t('oral_signs_label')}</label>
                <p className="step-subheader" style={{marginBottom: '0.75rem', fontSize: '0.9rem'}}>{t('oral_signs_desc')}</p>
                <div className="radio-group">
                    <button type="button" onClick={() => {
                        triggerHapticFeedback();
                        dispatch({type: 'UPDATE_FIELD', field: 'hasOralSigns', value: true});
                        triggerRiskAnimation('oral-signs-yes', 'high');
                    }} className={`radio-label ${data.hasOralSigns ? 'selected' : ''} ${animatedRisk.id === 'oral-signs-yes' ? `risk-glow-${animatedRisk.level}` : ''}`}>
                        {t('oral_signs_yes')}
                    </button>
                    <button type="button" onClick={() => {
                        triggerHapticFeedback();
                        dispatch({type: 'UPDATE_FIELD', field: 'hasOralSigns', value: false});
                    }} className={`radio-label ${!data.hasOralSigns ? 'selected' : ''}`}>
                        {t('oral_signs_no')}
                    </button>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">{t('smoking_status_label')}</label>
                <div className="radio-group">
                    {(['never', 'former', 'current'] as const).map((option) => (
                         <button key={option} type="button" onClick={() => handleSmokingStatusChange(option)} className={`radio-label ${data.smokingStatus === option ? 'selected' : ''} ${animatedRisk.id === `smoking-${option}` ? `risk-glow-${animatedRisk.level}` : ''}`}>
                            {t(`smoking_status_${option}`)}
                        </button>
                    ))}
                </div>
            </div>
            
            {showSmokingDetails && (
                <div className="conditional-form-group animate-fade-in">
                     <div className="form-group">
                        <label className="form-label">{t('smoking_packs_per_day_label')}: {data.smokingPacksPerDay}</label>
                        <input type="range" min="0.5" max="4" step="0.5" value={data.smokingPacksPerDay || 0} onChange={e => dispatch({type: 'UPDATE_FIELD', field: 'smokingPacksPerDay', value: Number(e.target.value)})} className="form-slider"/>
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('smoking_years_label')}: {data.smokingYears} {t('years')}</label>
                        <input type="range" min="1" max="60" value={data.smokingYears || 0} onChange={e => dispatch({type: 'UPDATE_FIELD', field: 'smokingYears', value: Number(e.target.value)})} className="form-slider"/>
                    </div>
                     <div style={{ textAlign: 'center', margin: '1rem 0', fontWeight: 700 }}>
                        {t('pack_years_total')}: <span style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>{packYears}</span>
                    </div>
                    {data.smokingStatus === 'former' && (
                        <TextInput id="quitYear" type="number" label={t('smoking_quit_year_label')} value={quitYearInput} onChange={handleQuitYearChange} placeholder={t('year_placeholder')} error={quitYearError} />
                    )}
                </div>
            )}
            
            <div className="risk-factor-section">
                <label className="form-label">{t('smokeless_label')}</label>
                <div className="checkbox-group">
                    {smokelessProducts.map(product => (
                        <label key={product.id} className={`checkbox-label ${data.smokelessTobaccoProducts?.includes(product.id) ? 'selected' : ''} ${animatedRisk.id === `smokeless-${product.id}` ? `risk-glow-${animatedRisk.level}` : ''}`}>
                            <input type="checkbox" checked={data.smokelessTobaccoProducts?.includes(product.id)} onChange={() => {
                                triggerHapticFeedback();
                                const isSelected = data.smokelessTobaccoProducts.includes(product.id);
                                const products = isSelected ? data.smokelessTobaccoProducts.filter(p => p !== product.id) : [...data.smokelessTobaccoProducts, product.id];
                                if (!isSelected) triggerRiskAnimation(`smokeless-${product.id}`, 'high');
                                dispatch({ type: 'UPDATE_FIELD', field: 'smokelessTobaccoProducts', value: products });
                                dispatch({ type: 'UPDATE_FIELD', field: 'usesSmokelessTobacco', value: products.length > 0 });
                            }} className="sr-only" />
                            <span className="checkbox-text">{product.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="risk-factor-section inset">
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontWeight: '700' }}>{t('diet_habits_label')}</h4>
                <div className="form-group">
                    <label className="form-label">{t('salt_intake_label')}</label>
                    <div className="radio-group">
                        {(['low', 'moderate', 'high'] as const).map((level) => (
                            <button key={level} type="button" onClick={() => {
                                triggerHapticFeedback();
                                dispatch({type: 'UPDATE_FIELD', field: 'saltIntake', value: level});
                                if (level === 'high') triggerRiskAnimation(`salt-${level}`, 'moderate');
                            }} className={`radio-label ${data.saltIntake === level ? 'selected' : ''} ${animatedRisk.id === `salt-${level}` ? `risk-glow-${animatedRisk.level}` : ''}`}>
                                {t(`salt_${level}`)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">{t('physical_activity_label')}</label>
                    <div className="radio-group">
                        {(['sedentary', 'moderate', 'active'] as const).map((level) => (
                            <button key={level} type="button" onClick={() => {
                                triggerHapticFeedback();
                                dispatch({type: 'UPDATE_FIELD', field: 'physicalActivity', value: level});
                                if (level === 'sedentary') triggerRiskAnimation(`activity-${level}`, 'moderate');
                            }} className={`radio-label ${data.physicalActivity === level ? 'selected' : ''} ${animatedRisk.id === `activity-${level}` ? `risk-glow-${animatedRisk.level}` : ''}`}>
                                {t(`activity_${level}`)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">{t('alcohol_frequency_label')}</label>
                    <div className="radio-group">
                        {(['none', 'moderate', 'high'] as const).map((level) => (
                            <button key={level} type="button" onClick={() => {
                                triggerHapticFeedback();
                                dispatch({type: 'UPDATE_FIELD', field: 'alcoholFrequency', value: level});
                                if (level === 'high') triggerRiskAnimation(`alcohol-${level}`, 'moderate');
                            }} className={`radio-label ${data.alcoholFrequency === level ? 'selected' : ''} ${animatedRisk.id === `alcohol-${level}` ? `risk-glow-${animatedRisk.level}` : ''}`}>
                                {t(`alcohol_frequency_${level}`)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="step-actions">
            <button onClick={onBack} className="btn-link">{t('back')}</button>
            <button onClick={onNext} className="btn btn-primary">{t('next')}</button>
        </div>
    </div>
  );
};

export default HabitsStep;