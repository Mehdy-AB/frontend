'use client';

import React from 'react';
import { CanvasElement } from '@/types/stamp-editor';
import * as LucideIcons from 'lucide-react';

interface IconElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onResize: (width: number, height: number) => void;
}

export function IconElement({
  element,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
  onResize,
}: IconElementProps) {
  const iconName = element.content;
  const IconComponent = (LucideIcons as any)[iconName];
  const iconSize = element.style?.iconSize || 24;
  const iconColor = element.style?.color || '#000000';

  if (!IconComponent) {
    return (
      <div
        className="border-2 border-red-500 p-2 text-red-500 text-xs"
        style={{
          width: element.width || 48,
          height: element.height || 48,
        }}
      >
        Icon not found: {iconName}
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  return (
    <div
      onClick={handleClick}
      className="relative cursor-move"
      style={{
        width: element.width || 48,
        height: element.height || 48,
        border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      }}
    >
      <IconComponent
        size={iconSize}
        color={iconColor}
        style={{
          width: iconSize,
          height: iconSize,
        }}
      />
      {isSelected && (
        <>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
          {/* Resize handles */}
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-se-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = element.width || 48;
              const startHeight = element.height || 48;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;
                const newWidth = Math.max(24, startWidth + deltaX);
                const newHeight = Math.max(24, startHeight + deltaY);
                onResize(newWidth, newHeight);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </>
      )}
    </div>
  );
}


