
import React from 'react';
import { t } from '../../locales/index.ts';

interface ToggleButtonProps {
    value: boolean;
    onChange: (value: boolean) => void;
    className?: string;
    onToggle: () => void;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ value, onChange, className, onToggle }) => {
    return (
        <button 
            type="button" 
            role="switch"
            aria-checked={value}
            onClick={() => { onChange(!value); onToggle(); }} 
            className={`radio-label ${value ? 'selected' : ''} ${className}`} 
            style={{ width: '80px', padding: '0.5rem' }}
        >
            {value ? t('yes') : t('no')}
        </button>
    );
};

export default ToggleButton;
