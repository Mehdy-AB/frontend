'use client';

import React, { useState } from 'react';
import { X, Move, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CanvasElement } from '@/types/stamp-editor';

interface ImageElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (element: Partial<CanvasElement>) => void;
  onResize: (width: number, height: number) => void;
}

export function ImageElement({
  element,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
  onResize,
}: ImageElementProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    if (target.closest('.resize-handle') || target.closest('button')) {
      return;
    }
    onSelect();
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.width || 100,
      height: element.height || 100,
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    const newWidth = Math.max(50, resizeStart.width + deltaX);
    const newHeight = Math.max(50, resizeStart.height + deltaY);

    onResize(newWidth, newHeight);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStart]);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width || 100}px`,
    height: `${element.height || 100}px`,
    border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
    borderRadius: '4px',
    cursor: 'move',
    zIndex: element.zIndex,
  };

  return (
    <div
      style={style}
      onClick={handleMouseDown}
      className="image-element"
    >
      <img
        src={element.content}
        alt="Stamp image"
        className="w-full h-full object-contain rounded"
        draggable={false}
      />
      
      {isSelected && (
        <>
          {/* Delete Button */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Resize Handle */}
          <div
            className="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-blue-500 border-2 border-white rounded-tl-lg cursor-nwse-resize"
            onMouseDown={handleResizeStart}
          >
            <Maximize2 className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
          </div>

          {/* Selection Indicator */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
        </>
      )}
    </div>
  );
}

