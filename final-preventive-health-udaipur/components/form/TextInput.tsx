import React from 'react';

interface TextInputProps {
    id: string;
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    onBlur?: () => void;
    type?: 'text' | 'number';
    placeholder?: string; // This is no longer visually rendered but kept for prop compatibility
    error?: string | null;
}

const TextInput: React.FC<TextInputProps> = ({ id, label, value, onChange, onBlur, type = 'text', error }) => {
    const hasError = !!error;
    
    // The placeholder=" " is key for the CSS :not(:placeholder-shown) selector to work.
    return (
        <div className="form-group floating">
            <input
                type={type}
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                className={`form-input ${hasError ? 'error' : ''}`}
                placeholder=" "
                aria-invalid={hasError}
                aria-describedby={hasError ? `${id}-error` : undefined}
            />
            <label htmlFor={id} className="form-label">{label}</label>
            {hasError && <p id={`${id}-error`} className="error-message" role="alert">{error}</p>}
        </div>
    );
};

export default TextInput;