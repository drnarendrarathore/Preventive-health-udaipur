
import React, { useState, useRef, useMemo } from 'react';
import type { UserData, Action } from '../types.ts';
import { FAMILY_HISTORY_OPTIONS, PERSONAL_CONDITIONS_OPTIONS, CANCER_HISTORY_OPTIONS, DISEASE_CONDITIONS, CLINICAL_THRESHOLDS, RELATIONSHIP_OPTIONS } from '../constants.ts';
import { t } from '../locales/index.ts';
import ToggleButton from './form/ToggleButton.tsx';
import RadioGroup from './form/RadioGroup.tsx';

interface RiskFactorsStepProps {
  data: UserData;
  dispatch: React.Dispatch<Action>;
  onSubmit: () => void;
  onBack: () => void;
}

const generateTranslationKey = (text: string) => {
    return text.toLowerCase().replace(/\s*&\s*/g, '_&_').replace(/\s+/g, '_').replace(/[()]/g, '');
};

const InfoIcon = ({ tooltip }: { tooltip: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
        <span className="info-icon-wrapper" onClick={(e) => { e.stopPropagation(); setIsVisible(!isVisible); }}>
            <span className="info-icon">i</span>
            {isVisible && <span className="info-tooltip animate-fade-in">{tooltip}</span>}
        </span>
    );
};

const RiskFactorsStep: React.FC<RiskFactorsStepProps> = ({ data, dispatch, onSubmit, onBack }) => {
  const [animatedRisk, setAnimatedRisk] = useState<{ id: string | null; level: 'high' | 'moderate' | null }>({ id: null, level: null });
  const animationTimeoutRef = useRef<number | null>(null);

  const HIGH_RISK_CANCERS = [
      DISEASE_CONDITIONS.BREAST_CANCER, 
      DISEASE_CONDITIONS.OVARIAN_CANCER, 
      DISEASE_CONDITIONS.COLON_CANCER, 
      DISEASE_CONDITIONS.MALE_BREAST_CANCER
  ];
  const CBAC_IMPACT_CONDITIONS = [
      DISEASE_CONDITIONS.HEART_DISEASE, 
      DISEASE_CONDITIONS.STROKE, 
      DISEASE_CONDITIONS.HIGH_BLOOD_PRESSURE, 
      DISEASE_CONDITIONS.DIABETES_TYPE_2
  ];

  const isFormValid = useMemo(() => {
    return data.familyHistory.every(item => {
      const age = item.relativeAgeAtDiagnosis;
      return age === undefined || (age >= 1 && age <= CLINICAL_THRESHOLDS.MAXIMUM_PATIENT_AGE);
    });
  }, [data.familyHistory]);

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
  
  const handleFamilyHistoryChange = (condition: string) => {
      triggerHapticFeedback();
      const isSelected = data.familyHistory.some(item => item.condition === condition);
      
      let newHistory;
      if (isSelected) {
          // Remove the condition
          newHistory = data.familyHistory.filter(item => item.condition !== condition);
      } else {
          // Add the condition without removing others
          newHistory = [...data.familyHistory, { condition }];
      }

      if (!isSelected) {
          let riskLevel: 'high' | 'moderate' | null = null;
          
          if (HIGH_RISK_CANCERS.includes(condition)) {
              riskLevel = 'high';
          } else if (CBAC_IMPACT_CONDITIONS.includes(condition)) {
              riskLevel = 'moderate';
          }
          
          if (riskLevel) {
              triggerRiskAnimation(`family-${generateTranslationKey(condition)}`, riskLevel);
          }
      }
      
      dispatch({ type: 'UPDATE_FIELD', field: 'familyHistory', value: newHistory });
  };
  
  const handlePersonalConditionChange = (condition: string) => {
      triggerHapticFeedback();
      const isSelected = data.personalConditions.includes(condition);
      
      let newConditions;
      if (isSelected) {
          newConditions = data.personalConditions.filter(c => c !== condition);
      } else {
          newConditions = [...data.personalConditions, condition];
      }

      if (!isSelected) {
          triggerRiskAnimation(`personal-${generateTranslationKey(condition)}`, 'moderate');
      }
      dispatch({ type: 'UPDATE_FIELD', field: 'personalConditions', value: newConditions });
  };


  const handleFamilyHistoryAgeChange = (condition: string, age?: number) => {
      const newHistory = data.familyHistory.map(item =>
          item.condition === condition ? { ...item, relativeAgeAtDiagnosis: age } : item
      );
      dispatch({ type: 'UPDATE_FIELD', field: 'familyHistory', value: newHistory });
  };
  
  const handleRelationshipChange = (condition: string, relationship: any) => {
      const newHistory = data.familyHistory.map(item =>
          item.condition === condition ? { ...item, relationship } : item
      );
      dispatch({ type: 'UPDATE_FIELD', field: 'familyHistory', value: newHistory });
  };

  const handleUnsureToggle = (isUnsure: boolean) => {
    dispatch({type: 'UPDATE_FIELD', field: 'familyHistoryUnsure', value: isUnsure});
  };

  const radioOptions = {
    hepatitis: [
        { value: 'none', label: t('hep_none') },
        { value: 'hep_b', label: t('hep_b') },
        { value: 'hep_c', label: t('hep_c') },
        { value: 'both', label: t('hep_both') },
    ] as {value: 'none'|'hep_b'|'hep_c'|'both', label: string}[],
    hpv: [
        { value: 'none', label: t('hpv_none') },
        { value: 'partial', label: t('hpv_partial') },
        { value: 'complete', label: t('hpv_complete') },
    ] as {value: 'none'|'partial'|'complete', label: string}[],
  };

  return (
    <div className="step-content">
        <h2 className="step-header">{t('risk_factors_title')}</h2>
        <p className="step-subheader">{t('risk_factors_subtitle')}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="risk-factor-section inset">
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontWeight: '700' }}>{t('infectious_label')}</h4>
                <RadioGroup
                    label={t('hepatitis_label')}
                    options={radioOptions.hepatitis}
                    selectedValue={data.hepatitisHistory}
                    onChange={(val) => {
                        dispatch({type: 'UPDATE_FIELD', field: 'hepatitisHistory', value: val});
                        if (val !== 'none') triggerRiskAnimation(`hep-${val}`, 'high');
                    }}
                    getAnimationClass={(val) => animatedRisk.id === `hep-${val}` && val !== 'none' ? `risk-glow-high` : ''}
                    gridColumns={2}
                />
                <RadioGroup
                    label={t('hpv_vaccine_label')}
                    options={radioOptions.hpv}
                    selectedValue={data.hpvVaccineStatus}
                    onChange={(val) => dispatch({type: 'UPDATE_FIELD', field: 'hpvVaccineStatus', value: val})}
                    gridColumns={3}
                />
            </div>

            <div className="recommendation-card accent-risk">
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {t('marble_mining_label')}
                        <InfoIcon tooltip={t('mining_tooltip')} />
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>{t('marble_mining_desc')}</p>
                </div>
                <ToggleButton 
                    value={!!data.marbleMiningExposure} 
                    onChange={(val) => dispatch({type: 'UPDATE_FIELD', field: 'marbleMiningExposure', value: val})}
                    onToggle={() => {
                        triggerHapticFeedback();
                        if (!data.marbleMiningExposure) triggerRiskAnimation('marble-mining', 'high');
                    }}
                    className={animatedRisk.id === 'marble-mining' ? `risk-glow-${animatedRisk.level}` : ''} 
                />
            </div>

            <div className="risk-factor-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <legend className="form-label" style={{ marginBottom: 0 }}>{t('family_history_label')}</legend>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('family_history_unsure_label')}</label>
                        <ToggleButton 
                            value={!!data.familyHistoryUnsure} 
                            onChange={handleUnsureToggle}
                            onToggle={triggerHapticFeedback}
                        />
                    </div>
                </div>
                <fieldset disabled={data.familyHistoryUnsure}>
                    {Object.entries(FAMILY_HISTORY_OPTIONS).map(([category, options]) => {
                        const categoryKey = generateTranslationKey(category);
                        return (
                        <details key={category} className="collapsible-section" open>
                            <summary>{t(categoryKey)}</summary>
                            <div className="accordion-content-wrapper">
                                <div className="accordion-content">
                                    <div className="checkbox-group" style={{ padding: '0.5rem 0' }}>
                                        {options.map(option => {
                                            const isCancer = CANCER_HISTORY_OPTIONS.includes(option);
                                            const currentSelection = data.familyHistory.find(item => item.condition === option);
                                            const optionKey = generateTranslationKey(option);
                                            const age = currentSelection?.relativeAgeAtDiagnosis;
                                            const isAgeInvalid = age !== undefined && (age < 1 || age > CLINICAL_THRESHOLDS.MAXIMUM_PATIENT_AGE);

                                            return (
                                            <div key={option} className="checkbox-item-wrapper">
                                                <label className={`checkbox-label ${currentSelection ? 'selected' : ''} ${animatedRisk.id === `family-${optionKey}` ? `risk-glow-${animatedRisk.level}` : ''}`} htmlFor={`family-hist-${optionKey}`}>
                                                    <input type="checkbox" id={`family-hist-${optionKey}`} checked={!!currentSelection} onChange={() => handleFamilyHistoryChange(option)} className="sr-only" />
                                                    <span className="checkbox-text">{t(optionKey)}</span>
                                                </label>
                                                
                                                {currentSelection && (
                                                    <div className="contextual-input-container">
                                                        {/* Relationship Selector */}
                                                        <div className="segmented-control">
                                                            {RELATIONSHIP_OPTIONS.map(rel => (
                                                                <button 
                                                                    key={rel.value} 
                                                                    className={`segmented-btn ${currentSelection.relationship === rel.value ? 'active' : ''}`}
                                                                    onClick={() => handleRelationshipChange(option, rel.value)}
                                                                >
                                                                    {t(rel.labelKey)}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {isCancer && (
                                                            <input 
                                                                type="number" 
                                                                placeholder={t('relative_age_placeholder')} 
                                                                value={age || ''} 
                                                                min="1"
                                                                max="120"
                                                                onChange={(e) => handleFamilyHistoryAgeChange(option, e.target.value ? parseInt(e.target.value) : undefined)} 
                                                                className={`form-input ${isAgeInvalid ? 'error' : ''}`} 
                                                                style={{ padding: '0.6rem', fontSize: '0.9rem', textAlign: 'center', marginTop: '0.5rem' }} 
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </details>
                    )})}
                </fieldset>
            </div>

            <div className="risk-factor-section">
                <legend className="form-label">{t('personal_conditions_label')}</legend>
                <div className="checkbox-group">
                    {Object.values(PERSONAL_CONDITIONS_OPTIONS).flat().map(option => {
                        const optionKey = generateTranslationKey(option);
                        const isSelected = data.personalConditions.includes(option);
                        return (
                        <label key={option} className={`checkbox-label ${isSelected ? 'selected' : ''} ${animatedRisk.id === `personal-${optionKey}` ? `risk-glow-${animatedRisk.level}` : ''}`}>
                            <input type="checkbox" checked={isSelected} onChange={() => handlePersonalConditionChange(option)} className="sr-only" />
                            <span className="checkbox-text">{t(optionKey)}</span>
                        </label>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="step-actions">
            <button onClick={onBack} className="btn-link">{t('back')}</button>
            <button onClick={onSubmit} disabled={!isFormValid} className="btn btn-primary">{t('get_recommendations')}</button>
        </div>
    </div>
  );
};

export default RiskFactorsStep;
