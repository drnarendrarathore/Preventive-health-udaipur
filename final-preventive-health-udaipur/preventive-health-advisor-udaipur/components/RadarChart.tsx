import React, { useState, useEffect, useRef } from 'react';
import type { RadarData } from '../services/chartUtils.ts';

interface RadarChartProps {
  data: RadarData[];
}

const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  const size = 320; // Slightly larger for better detail
  const center = size / 2;
  const radius = size * 0.38; // Use about 38% of container for chart radius
  const sides = data.length;
  const angleSlice = (Math.PI * 2) / sides;
  const maxVal = 5;
  
  // Animation state
  const [isLoaded, setIsLoaded] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    // Trigger animation after mount
    requestAnimationFrame(() => {
        if (isMounted.current) {
            setIsLoaded(true)
        }
    });

    return () => {
        isMounted.current = false;
    };
  }, []);

  const [tooltip, setTooltip] = useState<{ visible: boolean; content: string; value: number; x: number; y: number } | null>(null);

  // --- Helpers ---
  const getPoint = (value: number, index: number): { x: number, y: number } => {
    const r = radius * (value / maxVal);
    const x = center + r * Math.sin(index * angleSlice);
    const y = center - r * Math.cos(index * angleSlice);
    return { x, y };
  };
  
  const getPointString = (value: number, index: number): string => {
    const { x, y } = getPoint(value, index);
    return `${x},${y}`;
  }

  // --- Drawing Elements ---

  // 1. Grid (Concentric Polygons)
  const gridLevels = Array.from({ length: maxVal }, (_, i) => i + 1);
  const gridPolygons = gridLevels.map(level => {
    const points = Array.from({ length: sides }, (_, i) => getPointString(level, i)).join(' ');
    const isOuter = level === maxVal;
    return (
        <polygon 
            key={`grid-${level}`} 
            points={points} 
            className={`radar-grid-polygon ${isOuter ? 'outer' : 'inner'}`} 
        />
    );
  });

  // 2. Axes (Lines from center)
  const axisLines = data.map((_, i) => {
    const {x, y} = getPoint(maxVal, i);
    return <line key={`axis-${i}`} x1={center} y1={center} x2={x} y2={y} className="radar-axis-line" />
  });
  
  // 3. Labels
  const labelElements = data.map((d, i) => {
    // Push labels out a bit further than the radius
    const r = radius + 25; 
    const x = center + r * Math.sin(i * angleSlice);
    const y = center - r * Math.cos(i * angleSlice);
    
    // Adjust anchor based on position to prevent cutting off text
    let textAnchor = 'middle';
    if (Math.abs(x - center) > 10) {
        textAnchor = x > center ? 'start' : 'end';
    }

    return (
      <text 
        key={`label-${i}`} 
        x={x} 
        y={y} 
        className="radar-label" 
        textAnchor={textAnchor} 
        dominantBaseline="middle"
      >
        {d.label}
      </text>
    );
  });

  // 4. Data Shape (The actual value polygon)
  const dataPointsString = data.map((d, i) => getPointString(d.value, i)).join(' ');

  // 5. Interactive Points
  const interactivePoints = data.map((d, i) => {
    const { x, y } = getPoint(d.value, i);
    const isHovered = tooltip?.x === x && tooltip?.y === y;

    return (
      <g key={`point-group-${i}`}>
        {/* Invisible larger hit area for easier hovering */}
        <circle
          cx={x}
          cy={y}
          r="12"
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setTooltip({ 
              visible: true, 
              content: d.label, 
              value: d.value,
              x, 
              y 
          })}
          onMouseLeave={() => setTooltip(null)}
        />
        {/* Visible decorative point */}
        <circle
          cx={x}
          cy={y}
          r={isHovered ? 6 : 4}
          className={`radar-point-visible ${isHovered ? 'active' : ''}`}
        />
      </g>
    );
  });

  return (
    <div className="radar-chart-container">
        <svg viewBox={`0 0 ${size} ${size}`} className="radar-chart-svg">
        <defs>
            {/* Gradient for the polygon fill */}
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.05" />
            </radialGradient>
            
            {/* Glow filter for the stroke/points */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        <g className="radar-background">
            {gridPolygons}
            {axisLines}
        </g>

        {/* Animated Data Layer */}
        <g 
            className={`radar-data-layer ${isLoaded ? 'animate' : ''}`} 
            style={{ transformOrigin: `${center}px ${center}px` }}
        >
            <polygon 
                points={dataPointsString} 
                className="radar-data-polygon"
                fill="url(#radarGradient)"
            />
            {interactivePoints}
        </g>

        {/* Labels drawn on top */}
        <g className="radar-labels">
            {labelElements}
        </g>

        {/* Tooltip Layer */}
        {tooltip && tooltip.visible && (
            <g className="radar-tooltip" transform={`translate(${tooltip.x}, ${tooltip.y - 35})`} style={{ pointerEvents: 'none' }}>
                 {/* Tooltip Shadow/Background */}
                 <rect 
                    x="-65" y="-15" 
                    width="130" height="30" 
                    rx="15" ry="15" 
                    className="tooltip-bg"
                />
                 {/* Tooltip Text */}
                 <text x="0" y="5" textAnchor="middle" className="tooltip-text">
                    {tooltip.content}: <tspan fontWeight="bold" fill="var(--primary)">{tooltip.value}/5</tspan>
                 </text>
                 {/* Little Triangle Pointer */}
                 <path d="M -5 15 L 0 20 L 5 15" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="0.5" />
            </g>
        )}
        </svg>
    </div>
  );
};

export default RadarChart;