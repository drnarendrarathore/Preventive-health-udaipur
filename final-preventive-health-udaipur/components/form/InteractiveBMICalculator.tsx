
import React, { useMemo } from 'react';
import type { UserData, Action } from '../../types.ts';
import { t } from '../../locales/index.ts';
import InteractiveFigure from '../svg/InteractiveFigure.tsx';

interface BMICalculatorProps {
  data: UserData;
  dispatch: React.Dispatch<Action>;
}

const InteractiveBMICalculator: React.FC<BMICalculatorProps> = ({ data, dispatch }) => {
    const { height = 0, weight = 0, waistCircumference = 0 } = data;

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
                <div className="bmi-sliders-wrapper">
                    <div className="form-group slider-group vertical">
                        <label htmlFor="height" className="form-label">{t('height_label')} ({height ? `${height} cm` : '--'})</label>
                        <input type="range" id="height" min="120" max="220" value={height || 120} onChange={e => dispatch({type: 'UPDATE_FIELD', field: 'height', value: Number(e.target.value)})} className="form-slider slider-vertical" aria-label="Height Slider"/>
                    </div>
                    <div className="slider-group-horizontal">
                         <div className="form-group slider-group">
                            <label htmlFor="weight" className="form-label">{t('weight_label')} ({weight ? `${weight} kg` : '--'})</label>
                            <input type="range" id="weight" min="30" max="150" value={weight || 30} onChange={e => dispatch({type: 'UPDATE_FIELD', field: 'weight', value: Number(e.target.value)})} className="form-slider" aria-label="Weight Slider"/>
                        </div>
                        <div className="form-group slider-group">
                            <label htmlFor="waist" className="form-label">{t('waist_label')} ({waistCircumference ? `${waistCircumference} cm` : '--'})</label>
                            <input type="range" id="waist" min="40" max="160" value={waistCircumference || 40} onChange={e => dispatch({type: 'UPDATE_FIELD', field: 'waistCircumference', value: Number(e.target.value)})} className="form-slider" aria-label="Waist Circumference Slider"/>
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