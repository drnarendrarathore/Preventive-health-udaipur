
import React from 'react';

interface InteractiveFigureProps {
  bmi: number;
  height: number;
}

const InteractiveFigure: React.FC<InteractiveFigureProps> = ({ bmi, height }) => {
    // Utility to map a value from one range to another
    const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
        const mapped = ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
        return Math.max(outMin, Math.min(mapped, outMax)); // Clamp value to the output range
    };
    
    // Define the ranges for mapping
    const bmiRange = { inMin: 15, inMax: 40 }; // Realistic BMI range
    const heightRange = { inMin: 120, inMax: 220 }; // Realistic height range in cm
    const scaleXRange = { outMin: 0.75, outMax: 1.25 }; // Visual width scale
    const scaleYRange = { outMin: 0.8, outMax: 1.2 }; // Visual height scale

    const scaleX = mapRange(bmi, bmiRange.inMin, bmiRange.inMax, scaleXRange.outMin, scaleXRange.outMax);
    const scaleY = mapRange(height, heightRange.inMin, heightRange.inMax, scaleYRange.outMin, scaleYRange.outMax);
    
    return (
        <svg viewBox="0 0 100 200" preserveAspectRatio="xMidYMax meet" style={{ width: '100%', height: '100%', maxHeight: '250px' }}>
            <g 
                style={{ 
                    transform: `scale(${scaleX}, ${scaleY})`,
                    transformOrigin: '50% 100%',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                <path
                    d="M 50,20 C 35,20 30,35 30,50 L 30,110 C 30,110 20,120 20,150 L 20,195 L 35,195 L 35,150 C 35,130 40,120 40,110 L 40,50 C 40,40 45,30 50,30 C 55,30 60,40 60,50 L 60,110 C 60,120 65,130 65,150 L 65,195 L 80,195 L 80,150 C 80,120 70,110 70,110 L 70,50 C 70,35 65,20 50,20 Z"
                    fill="var(--primary-soft)"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            </g>
        </svg>
    );
};

export default InteractiveFigure;
