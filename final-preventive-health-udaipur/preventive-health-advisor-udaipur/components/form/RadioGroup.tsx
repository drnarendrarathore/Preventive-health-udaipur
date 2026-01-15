import React, { useRef, useEffect } from 'react';

// Use a generic type T that extends a string or boolean for the value
type Option<T> = {
  value: T;
  label: string;
};

interface RadioGroupProps<T> {
  label: string;
  options: Option<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  getAnimationClass?: (value: T) => string;
  gridColumns?: number;
}

const RadioGroup = <T extends string | boolean>({
  label,
  options,
  selectedValue,
  onChange,
  getAnimationClass,
  gridColumns,
}: RadioGroupProps<T>) => {
  const groupRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    buttonsRef.current = buttonsRef.current.slice(0, options.length);
  }, [options]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let newIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      newIndex = (index + 1) % options.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      newIndex = (index - 1 + options.length) % options.length;
    }
    
    if (newIndex !== index) {
      const newSelectedValue = options[newIndex].value;
      onChange(newSelectedValue);
      // Focus the new button after the state updates
      setTimeout(() => {
        buttonsRef.current[newIndex]?.focus();
      }, 0);
    }
  };

  const triggerHapticFeedback = () => {
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const style = gridColumns ? { gridTemplateColumns: `repeat(${gridColumns}, 1fr)` } : {};

  return (
    <div className="form-group">
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label={label}
        className="form-label"
      >
        {label}
      </div>
      <div className="radio-group" style={style}>
        {options.map((option, index) => {
          const isSelected = selectedValue === option.value;
          return (
            <button
              key={String(option.value)}
              ref={(el) => (buttonsRef.current[index] = el)}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => {
                triggerHapticFeedback();
                onChange(option.value);
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`radio-label ${isSelected ? 'selected' : ''} ${getAnimationClass ? getAnimationClass(option.value) : ''}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RadioGroup;