'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { X, Maximize2, ImageOff } from 'lucide-react';
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
  const [imgError, setImgError] = useState(false);

  const resizeRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
  });
  // Keep onResize in a ref so the stable handler always calls the latest version
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  // Reset error state when content changes (e.g. image replaced)
  useEffect(() => {
    setImgError(false);
  }, [element.content]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    if (target.closest('.resize-handle') || target.closest('button')) {
      return;
    }
    onSelect();
  };

  // Stable handler — never changes identity
  const handleResizeMove = useCallback((e: MouseEvent) => {
    const r = resizeRef.current;
    if (!r.active) return;
    const newWidth = Math.max(20, r.startW + (e.clientX - r.startX));
    const newHeight = Math.max(20, r.startH + (e.clientY - r.startY));
    onResizeRef.current(newWidth, newHeight);
  }, []);

  const handleResizeEnd = useCallback((e: MouseEvent) => {
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
      startW: element.width || 100,
      startH: element.height || 100,
    };
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const style: React.CSSProperties = {
    position: 'relative',
    width: `${element.width || 100}px`,
    height: `${element.height || 100}px`,
    border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
    borderRadius: '4px',
    cursor: 'move',
  };

  return (
    <div
      style={style}
      onClick={handleMouseDown}
      className="image-element"
    >
      {imgError ? (
        /* Broken image fallback */
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded text-gray-400 gap-1">
          <ImageOff className="w-8 h-8" />
          <span className="text-xs">Image failed</span>
        </div>
      ) : (
        <img
          src={element.content}
          alt="Stamp image"
          className="w-full h-full object-contain rounded"
          draggable={false}
          onError={() => setImgError(true)}
        />
      )}

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
