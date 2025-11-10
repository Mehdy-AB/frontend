"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
  className?: string;
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, onValueChange, min, max, step, className }, ref) => {
    const percentage = ((value[0] - min) / (max - min)) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange([parseFloat(e.target.value)]);
    };

    return (
      <div ref={ref} className={cn("relative flex items-center w-full", className)}>
        <input
          type="range"
          value={value[0]}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="w-full h-1.5 bg-primary/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary/50 [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow"
        />
        <div 
          className="absolute h-1.5 bg-primary rounded-full pointer-events-none"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";

