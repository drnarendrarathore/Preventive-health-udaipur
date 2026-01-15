
import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { UserData, Action } from '../types.ts';
import { t } from '../locales/index.ts';
import TextInput from './form/TextInput.tsx';
import RadioGroup from './form/RadioGroup.tsx';

interface HabitsStepProps {
  data: UserData;
  dispatch: React.Dispatch<Action>;
  onNext: () => void;
  onBack: () => void;
}

const LockIcon = () => (
    <span className="privacy-lock-icon" title={t('privacy_notice')}>
        🔒
    </span>
);

const HabitsStep: React.FC<HabitsStepProps> = ({ data, dispatch, onNext, onBack }) => {
  const showSmokingDetails = data.smokingStatus === 'current' || data.smokingStatus === 'former';
  const [animatedRisk, setAnimatedRisk] = useState<{ id: string | null; level: 'high' | 'moderate' | null }>({ id: null, level: null });
  const animationTimeoutRef = useRef<number | null>(null);
  
  const [quitYearInput, setQuitYearInput] = useState<string>(() => data.quitSmokingYear?.toString() || '');
  const [quitYearError, setQuitYearError] = useState<string | null>(null);

  const lastSmokingData = useRef({ sticks: data.smokingSticksPerDay, years: data.smokingYears });
  
  useEffect(() => {
    if (data.smokingStatus !== 'never' && (data.smokingSticksPerDay || 0) > 0 && (data.smokingYears || 0) > 0) {
      lastSmokingData.current = { sticks: data.smokingSticksPerDay, years: data.smokingYears };
    }
  }, [data.smokingSticksPerDay, data.smokingYears, data.smokingStatus]);

  const packYears = useMemo(() => {
    // 20 sticks = 1 pack
    const packs = (data.smokingSticksPerDay || 0) / 20;
    return (packs * (data.smokingYears || 0)).toFixed(1);
  }, [data.smokingSticksPerDay, data.smokingYears]);

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
      setQuitYearInput(val);
      if (val.trim() === '') {
          setQuitYearError(null);
          dispatch({type: 'UPDATE_FIELD', field: 'quitSmokingYear', value: undefined});
          return;
      }
      const year = parseInt(val, 10);
      if (val.length <= 4 && year > 1950 && year <= new Date().getFullYear()) {
          setQuitYearError(null);
          dispatch({type: 'UPDATE_FIELD', field: 'quitSmokingYear', value: year});
      } else {
          setQuitYearError(t('validation_quit_year_invalid'));
          if (data.quitSmokingYear !== undefined) {
            dispatch({type: 'UPDATE_FIELD', field: 'quitSmokingYear', value: undefined});
          }
      }
  };

  const handleSmokingStatusChange = (status: 'never' | 'former' | 'current') => {
      const previousStatus = data.smokingStatus;
      dispatch({ type: 'UPDATE_FIELD', field: 'smokingStatus', value: status });

      if (status === 'current') {
          dispatch({ type: 'UPDATE_FIELD', field: 'quitSmokingYear', value: undefined });
          setQuitYearInput('');
          setQuitYearError(null);
          triggerRiskAnimation(`smoking-${status}`, 'high');
      }

      if (status === 'never') {
          dispatch({ type: 'UPDATE_FIELD', field: 'smokingSticksPerDay', value: 0 });
          dispatch({ type: 'UPDATE_FIELD', field: 'smokingYears', value: 0 });
          dispatch({ type: 'UPDATE_FIELD', field: 'quitSmokingYear', value: undefined });
          setQuitYearInput('');
          setQuitYearError(null);
      } else if (previousStatus === 'never' && (status === 'current' || status === 'former')) {
          const sticksToRestore = lastSmokingData.current.sticks && lastSmokingData.current.sticks > 0 ? lastSmokingData.current.sticks : 10;
          const yearsToRestore = lastSmokingData.current.years && lastSmokingData.current.years > 0 ? lastSmokingData.current.years : 10;
          dispatch({ type: 'UPDATE_FIELD', field: 'smokingSticksPerDay', value: sticksToRestore });
          dispatch({ type: 'UPDATE_FIELD', field: 'smokingYears', value: yearsToRestore });
      }
  };
  
  const handleSliderChange = (field: keyof UserData, value: number) => {
      if (navigator.vibrate) navigator.vibrate(5);
      dispatch({type: 'UPDATE_FIELD', field, value});
  };

  const radioOptions = {
    cookingFuel: [
        { value: 'lpg', label: t('cooking_fuel_lpg') },
        { value: 'biomass', label: t('cooking_fuel_biomass') },
        { value: 'electric', label: t('cooking_fuel_electric') },
    ] as {value: 'lpg'|'biomass'|'electric', label: string}[],
    oralSigns: [
        { value: true, label: t('oral_signs_yes') },
        { value: false, label: t('oral_signs_no') },
    ] as {value: boolean, label: string}[],
    smokingStatus: [
        { value: 'never', label: t('smoking_status_never') },
        { value: 'former', label: t('smoking_status_former') },
        { value: 'current', label: t('smoking_status_current') },
    ] as {value: 'never'|'former'|'current', label: string}[],
    saltIntake: [
        { value: 'low', label: t('salt_low') },
        { value: 'moderate', label: t('salt_moderate') },
        { value: 'high', label: t('salt_high') },
    ] as {value: 'low'|'moderate'|'high', label: string}[],
    physicalActivity: [
        { value: 'sedentary', label: t('activity_sedentary') },
        { value: 'moderate', label: t('activity_moderate') },
        { value: 'active', label: t('activity_active') },
    ] as {value: 'sedentary'|'moderate'|'active', label: string}[],
    alcoholFrequency: [
        { value: 'none', label: t('alcohol_frequency_none') },
        { value: 'moderate', label: t('alcohol_frequency_moderate') },
        { value: 'high', label: t('alcohol_frequency_high') },
    ] as {value: 'none'|'moderate'|'high', label: string}[],
  };

  return (
    <div className="step-content">
        <h2 className="step-header">{t('habits_title')}</h2>
        <p className="step-subheader">{t('habits_subtitle')}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <RadioGroup
                label={t('cooking_fuel_label')}
                options={radioOptions.cookingFuel}
                selectedValue={data.cookingFuelType}
                onChange={(val) => {
                    dispatch({type: 'UPDATE_FIELD', field: 'cookingFuelType', value: val});
                    if (val === 'biomass') triggerRiskAnimation(`fuel-biomass`, 'high');
                }}
                getAnimationClass={(val) => animatedRisk.id === `fuel-biomass` && val === 'biomass' ? `risk-glow-high` : ''}
            />

            <div className="form-group">
                 <p className="step-subheader" style={{marginBottom: '0.75rem', fontSize: '0.9rem'}}>{t('oral_signs_desc')}</p>
                 <RadioGroup
                    label={t('oral_signs_label')}
                    options={radioOptions.oralSigns}
                    selectedValue={data.hasOralSigns}
                    onChange={(val) => {
                        dispatch({type: 'UPDATE_FIELD', field: 'hasOralSigns', value: val});
                        if (val) triggerRiskAnimation('oral-signs-yes', 'high');
                    }}
                    getAnimationClass={(val) => animatedRisk.id === 'oral-signs-yes' && val ? `risk-glow-high` : ''}
                />
            </div>
           
            <RadioGroup
                label={t('smoking_status_label')}
                options={radioOptions.smokingStatus}
                selectedValue={data.smokingStatus}
                onChange={handleSmokingStatusChange}
                getAnimationClass={(val) => animatedRisk.id === `smoking-${val}` ? `risk-glow-${animatedRisk.level}` : ''}
            />
            
            {showSmokingDetails && (
                <div className="conditional-form-group animate-fade-in">
                     <div className="form-group">
                        <label className="form-label">
                            {t('smoking_sticks_per_day_label')}: <span style={{color: 'var(--primary)'}}>{data.smokingSticksPerDay || 0}</span>
                        </label>
                        <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-0.5rem'}}>{t('smoking_sticks_helper')}</p>
                        <input 
                            type="range" 
                            min="1" 
                            max="60" 
                            step="1" 
                            value={data.smokingSticksPerDay || 0} 
                            onChange={e => handleSliderChange('smokingSticksPerDay', Number(e.target.value))} 
                            className="form-slider"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('smoking_years_label')}: {data.smokingYears} {t('years')}</label>
                        <input 
                            type="range" 
                            min="1" 
                            max="60" 
                            value={data.smokingYears || 0} 
                            onChange={e => handleSliderChange('smokingYears', Number(e.target.value))} 
                            className="form-slider"
                        />
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
                <RadioGroup
                    label={t('salt_intake_label')}
                    options={radioOptions.saltIntake}
                    selectedValue={data.saltIntake}
                    onChange={(val) => {
                        dispatch({type: 'UPDATE_FIELD', field: 'saltIntake', value: val});
                        if (val === 'high') triggerRiskAnimation(`salt-high`, 'moderate');
                    }}
                    getAnimationClass={(val) => animatedRisk.id === `salt-high` && val === 'high' ? `risk-glow-moderate` : ''}
                />
                <RadioGroup
                    label={t('physical_activity_label')}
                    options={radioOptions.physicalActivity}
                    selectedValue={data.physicalActivity}
                    onChange={(val) => {
                        dispatch({type: 'UPDATE_FIELD', field: 'physicalActivity', value: val});
                        if (val === 'sedentary') triggerRiskAnimation(`activity-sedentary`, 'moderate');
                    }}
                    getAnimationClass={(val) => animatedRisk.id === `activity-sedentary` && val === 'sedentary' ? `risk-glow-moderate` : ''}
                />
                <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>{t('alcohol_frequency_label')}</span>
                        <LockIcon />
                    </div>
                     <RadioGroup
                        label=""
                        options={radioOptions.alcoholFrequency}
                        selectedValue={data.alcoholFrequency}
                        onChange={(val) => {
                            dispatch({type: 'UPDATE_FIELD', field: 'alcoholFrequency', value: val});
                            if (val === 'high') triggerRiskAnimation(`alcohol-high`, 'moderate');
                        }}
                        getAnimationClass={(val) => animatedRisk.id === `alcohol-high` && val === 'high' ? `risk-glow-moderate` : ''}
                    />
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
