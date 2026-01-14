import React, { useState } from 'react';
import type { RadarData } from '../services/chartUtils.ts';

interface RadarChartProps {
  data: RadarData[];
}

const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  const size = 280;
  const center = size / 2;
  const radius = size * 0.35;
  const sides = data.length;
  const angle = (Math.PI * 2) / sides;
  const maxVal = 5;

  const [tooltip, setTooltip] = useState<{ visible: boolean; content: string; x: number; y: number } | null>(null);

  // Function to calculate point coordinates
  const getPoint = (value: number, index: number): { x: number, y: number } => {
    const r = radius * (value / maxVal);
    const x = center + r * Math.sin(index * angle);
    const y = center - r * Math.cos(index * angle);
    return { x, y };
  };
  
  const getPointString = (value: number, index: number): string => {
    const { x, y } = getPoint(value, index);
    return `${x},${y}`;
  }

  // Grid lines
  const gridLevels = Array.from({ length: maxVal }, (_, i) => i + 1);
  const gridLines = gridLevels.map(level => {
    const points = Array.from({ length: sides }, (_, i) => getPointString(level, i)).join(' ');
    return <polygon key={level} points={points} className="radar-grid" />;
  });

  // Axes lines
  const axes = data.map((_, i) => {
    const {x, y} = getPoint(maxVal, i);
    return <line key={i} x1={center} y1={center} x2={x} y2={y} className="radar-grid" />
  });
  
  // Data polygon points
  const dataPoints = data.map((d, i) => getPointString(d.value, i)).join(' ');

  // Labels
  const labels = data.map((d, i) => {
    const r = radius + 20;
    const x = center + r * Math.sin(i * angle);
    const y = center - r * Math.cos(i * angle);
    return (
      <text key={i} x={x} y={y} className="radar-label" textAnchor="middle" dominantBaseline="middle">
        {d.label}
      </text>
    );
  });

  // Event handlers for tooltips
  const handleMouseEnter = (dataPoint: RadarData, pointCoords: {x: number, y: number}) => {
    setTooltip({
        visible: true,
        content: `${dataPoint.label}: ${dataPoint.value}/${maxVal}`,
        x: pointCoords.x,
        y: pointCoords.y
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };
  
  // Hover points for tooltips
  const hoverPoints = data.map((d, i) => {
      const pointCoords = getPoint(d.value, i);
      return (
          <circle 
              key={`hover-${i}`}
              cx={pointCoords.x}
              cy={pointCoords.y}
              r="10" // larger hover radius
              fill="transparent"
              onMouseEnter={() => handleMouseEnter(d, pointCoords)}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: 'pointer' }}
          />
      );
  });
  
  // The actual visible points on the graph
  const visiblePoints = data.map((d, i) => {
    const pointCoords = getPoint(d.value, i);
    return (
      <circle
        key={`point-${i}`}
        cx={pointCoords.x}
        cy={pointCoords.y}
        r="4"
        className="radar-point"
      />
    );
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar-chart-svg">
      <g>
        {gridLines}
        {axes}
        {labels}
        <polygon points={dataPoints} className="radar-polygon" />
        {visiblePoints}
        {hoverPoints}
        {tooltip && tooltip.visible && (
            <g className="radar-tooltip" transform={`translate(${tooltip.x}, ${tooltip.y - 20})`}>
                 <rect rx="4" ry="4" width="120" height="25" x="-60" y="-18" />
                 <text textAnchor="middle">{tooltip.content}</text>
            </g>
        )}
      </g>
    </svg>
  );
};

export default RadarChart;