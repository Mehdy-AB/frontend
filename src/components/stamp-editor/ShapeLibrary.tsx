'use client';

import React from 'react';
import { Square, Circle, Triangle, Hexagon, Star, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'star' | 'heart';

interface ShapeLibraryProps {
  onSelectShape: (shape: ShapeType) => void;
  selectedShape?: ShapeType;
}

const SHAPES: Array<{ type: ShapeType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { type: 'rectangle', label: 'Rectangle', icon: Square },
  { type: 'circle', label: 'Circle', icon: Circle },
  { type: 'triangle', label: 'Triangle', icon: Triangle },
  { type: 'diamond', label: 'Diamond', icon: Hexagon },
  { type: 'star', label: 'Star', icon: Star },
  { type: 'heart', label: 'Heart', icon: Heart },
];

export function ShapeLibrary({ onSelectShape, selectedShape }: ShapeLibraryProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SHAPES.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelectShape(type)}
          className={`
            relative p-4 border-2 rounded-lg transition-all hover:border-primary hover:bg-primary/5
            ${selectedShape === type ? 'border-primary bg-primary/10' : 'border-gray-200'}
          `}
          title={label}
        >
          <Icon className="w-6 h-6 mx-auto" />
          <span className="text-xs mt-2 block text-center">{label}</span>
        </button>
      ))}
    </div>
  );
}

export function renderShape(
  type: ShapeType,
  width: number,
  height: number,
  fillColor: string,
  strokeColor: string,
  strokeWidth: number
): React.ReactNode {
  const viewBox = `0 0 ${width} ${height}`;
  const centerX = width / 2;
  const centerY = height / 2;

  switch (type) {
    case 'rectangle':
      return (
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={width - strokeWidth}
          height={height - strokeWidth}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    case 'circle':
      return (
        <circle
          cx={centerX}
          cy={centerY}
          r={Math.min(width, height) / 2 - strokeWidth / 2}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    case 'triangle':
      return (
        <polygon
          points={`${centerX},${strokeWidth} ${width - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    case 'diamond':
      return (
        <polygon
          points={`${centerX},${strokeWidth} ${width - strokeWidth},${centerY} ${centerX},${height - strokeWidth} ${strokeWidth},${centerY}`}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    case 'star':
      const spikes = 5;
      const outerRadius = Math.min(width, height) / 2 - strokeWidth;
      const innerRadius = outerRadius * 0.4;
      const points: string[] = [];
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      return (
        <polygon
          points={points.join(' ')}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    case 'heart':
      return (
        <path
          d={`M ${centerX},${centerY + height * 0.15}
              C ${centerX},${centerY} ${centerX - width * 0.2},${centerY - height * 0.1} ${centerX - width * 0.3},${centerY}
              C ${centerX - width * 0.5},${centerY + height * 0.1} ${centerX},${centerY + height * 0.4} ${centerX},${centerY + height * 0.5}
              C ${centerX},${centerY + height * 0.4} ${centerX + width * 0.5},${centerY + height * 0.1} ${centerX + width * 0.3},${centerY}
              C ${centerX + width * 0.2},${centerY - height * 0.1} ${centerX},${centerY} ${centerX},${centerY + height * 0.15}
              Z`}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    default:
      return null;
  }
}


