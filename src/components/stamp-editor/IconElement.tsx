'use client';

import React, { useRef, useCallback, useEffect } from 'react';
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

  // --- Stable resize handler (same pattern as ImageElement) ---
  const resizeRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
  });
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  const handleResizeMove = useCallback((e: MouseEvent) => {
    const r = resizeRef.current;
    if (!r.active) return;
    const newWidth = Math.max(24, r.startW + (e.clientX - r.startX));
    const newHeight = Math.max(24, r.startH + (e.clientY - r.startY));
    onResizeRef.current(newWidth, newHeight);
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizeRef.current.active = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startW: element.width || 48,
      startH: element.height || 48,
    };
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

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
          {/* Resize handle — stable ref-based handler, no closure leak */}
          <div
            className="resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-se-resize"
            onMouseDown={handleResizeStart}
          />
        </>
      )}
    </div>
  );
}
