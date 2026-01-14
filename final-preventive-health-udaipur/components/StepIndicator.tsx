
import React from 'react';
import { STEPS } from '../constants.ts';
import { t } from '../locales/index.ts';

interface StepIndicatorProps {
  currentStep: number;
}

const CheckIcon: React.FC = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" style={{ width: '16px', height: '16px' }}>
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
    </svg>
);

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const formSteps = STEPS.slice(1, -1); 

  return (
    <nav className="step-indicator-journey">
        {formSteps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            const nodeClasses = `step-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`;
            const labelClasses = `step-label ${isCurrent ? 'current' : ''}`;
            const connectorClasses = `step-connector ${isCompleted ? 'filled' : ''}`;

            return (
                <React.Fragment key={step.id}>
                    <div className="step">
                        <div className={nodeClasses}>
                            {isCompleted ? <CheckIcon /> : step.id - 1}
                        </div>
                        <span className={labelClasses}>{t(step.nameKey)}</span>
                    </div>

                    {index < formSteps.length - 1 && (
                        <div className={connectorClasses}>
                            <div className="step-connector-fill" />
                        </div>
                    )}
                </React.Fragment>
            );
        })}
    </nav>
  );
};

export default StepIndicator;