
import React, { useMemo } from 'react';
import type { UserData, Action } from '../../types.ts';
import { t } from '../../locales/index.ts';
import InteractiveFigure from '../svg/InteractiveFigure.tsx';

interface BMICalculatorProps {
  data: UserData;
  dispatch: React.Dispatch<Action>;
}

const cmToFeetAndInches = (cm: number) => {
    if (!cm) return { feet: 5, inches: 5 };
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    if (inches === 12) return { feet: feet + 1, inches: 0 };
    return { feet, inches };
};

const feetAndInchesToCm = (feet: number, inches: number) => {
    return (feet * 30.48) + (inches * 2.54);
};


const InteractiveBMICalculator: React.FC<BMICalculatorProps> = ({ data, dispatch }) => {
    const { height = 0, weight = 0, waistCircumference = 0 } = data;

    const { feet, inches } = useMemo(() => cmToFeetAndInches(height), [height]);

    const handleHeightChange = (newFeet?: number, newInches?: number) => {
        const currentFeet = newFeet ?? feet;
        const currentInches = newInches ?? inches;
        const totalCm = feetAndInchesToCm(currentFeet, currentInches);
        dispatch({ type: 'UPDATE_FIELD', field: 'height', value: totalCm });
        
        if (navigator.vibrate) navigator.vibrate(5);
    };
    
    const handleSliderChange = (field: keyof UserData, value: number) => {
        if (navigator.vibrate) navigator.vibrate(5);
        dispatch({ type: 'UPDATE_FIELD', field, value });
    };

    const bmi = useMemo(() => {
        if (!height || !weight) return 0;
        return weight / ((height / 100) ** 2);
    }, [height, weight]);

    const { status, color } = useMemo(() => {
        if (bmi < 18.5) return { status: t('bmi_underweight'), color: 'var(--warning)' };
        if (bmi < 23) return { status: t('bmi_normal'), color: 'var(--success)' };
        if (bmi < 25) return { status: t('bmi_overweight'), color: 'var(--warning)' };
        return { status: t('bmi_obese'), color: 'var(--danger)' };
    }, [bmi]);
    
    // BMI Guard Check
    const isOutlierBMI = (bmi > 0 && (bmi < 12 || bmi > 50));

    return (
        <div className="interactive-bmi-container">
            <div className="bmi-figure-container">
                <InteractiveFigure bmi={bmi} height={height} />
            </div>
            <div className="bmi-controls-container">
                <div className="bmi-display-text">
                    <div className="bmi-value" style={{ color }}>{bmi.toFixed(1)}</div>
                    <div className="bmi-status">{status}</div>
                </div>
                {isOutlierBMI && (
                    <div className="warning-toast animate-fade-in" style={{marginBottom: '1rem', textAlign: 'center'}}>
                        ⚠️ Unusually {bmi < 12 ? 'low' : 'high'} BMI. Please check height/weight inputs.
                    </div>
                )}
                <div className="bmi-sliders-wrapper">
                     <div className="slider-group-horizontal">
                         <div className="form-group slider-group">
                             <label htmlFor="height_feet" className="form-label">{t('height_label')} ({feet}' {inches}")</label>
                             <input type="range" id="height_feet" min="4" max="7" value={feet} onChange={e => handleHeightChange(Number(e.target.value), undefined)} className="form-slider" aria-label="Height in Feet"/>
                         </div>
                          <div className="form-group slider-group">
                             <label htmlFor="height_inches" className="form-label" style={{ opacity: 0 }}>Inches</label>
                             <input type="range" id="height_inches" min="0" max="11" value={inches} onChange={e => handleHeightChange(undefined, Number(e.target.value))} className="form-slider" aria-label="Height in Inches"/>
                         </div>
                     </div>
                    <div className="slider-group-horizontal">
                         <div className="form-group slider-group">
                            <label htmlFor="weight" className="form-label">{t('weight_label')} ({weight ? `${weight} kg` : '--'})</label>
                            <input type="range" id="weight" min="30" max="150" value={weight || 30} onChange={e => handleSliderChange('weight', Number(e.target.value))} className="form-slider" aria-label="Weight Slider"/>
                        </div>
                        <div className="form-group slider-group">
                            <label htmlFor="waist" className="form-label">{t('waist_label')} ({waistCircumference ? `${waistCircumference} inch` : '--'})</label>
                            <p className="helper-text">{t('waist_helper')}</p>
                            <input type="range" id="waist" min="20" max="60" value={waistCircumference || 20} onChange={e => handleSliderChange('waistCircumference', Number(e.target.value))} className="form-slider" aria-label="Waist Circumference Slider"/>
                        </div>
                    </div>
                </div>
                 <p style={{textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', marginBottom: 0}}>
                    {t('bmi_info_asian')}
                </p>
            </div>
        </div>
    );
};

export default InteractiveBMICalculator;
