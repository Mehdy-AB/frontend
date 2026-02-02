'use client';

import React, { useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragMoveEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CanvasElement } from '@/types/stamp-editor';
import { RichTextElement } from './RichTextElement';
import { ImageElement } from './ImageElement';
import { IconElement } from './IconElement';

interface CanvasEditorProps {
  elements: CanvasElement[];
  selectedElementId: string | null;
  editingElementId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  onElementSelect: (id: string | null) => void;
  onElementStartEdit: (id: string) => void;
  onElementStopEdit: () => void;
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onElementDelete: (id: string) => void;
  onInsertImage: (url: string) => void;
}

export function CanvasEditor({
  elements,
  selectedElementId,
  editingElementId,
  canvasWidth,
  canvasHeight,
  onElementSelect,
  onElementStartEdit,
  onElementStopEdit,
  onElementUpdate,
  onElementDelete,
  onInsertImage,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const element = elements.find((e) => e.id === active.id);
    if (element) {
      setDragPosition({ x: element.x, y: element.y });
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!activeId || !canvasRef.current) return;
    
    const { delta } = event;
    const element = elements.find((e) => e.id === activeId);
    if (element && dragPosition) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(
        canvasWidth - (element.width || 100),
        dragPosition.x + delta.x
      ));
      const newY = Math.max(0, Math.min(
        canvasHeight - (element.height || 100),
        dragPosition.y + delta.y
      ));
      
      setDragPosition({ x: newX, y: newY });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (activeId && dragPosition) {
      const element = elements.find((e) => e.id === activeId);
      if (element) {
        onElementUpdate(activeId, { x: dragPosition.x, y: dragPosition.y });
      }
    }
    setActiveId(null);
    setDragPosition(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onElementSelect(null);
      onElementStopEdit();
    }
  };

  const activeElement = activeId ? elements.find((e) => e.id === activeId) : null;

  return (
    <div
      ref={canvasRef}
      className="relative bg-white border-2 border-gray-300 rounded-lg overflow-hidden cursor-default"
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
      }}
      onClick={handleCanvasClick}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {elements.map((element) => {
          const isDragging = activeId === element.id;
          const displayX = isDragging && dragPosition ? dragPosition.x : element.x;
          const displayY = isDragging && dragPosition ? dragPosition.y : element.y;

          if (element.type === 'text') {
            return (
              <div
                key={element.id}
                style={{
                  position: 'absolute',
                  left: `${displayX}px`,
                  top: `${displayY}px`,
                  zIndex: element.zIndex,
                  opacity: isDragging ? 0.5 : 1,
                }}
              >
                <RichTextElement
                  element={element}
                  isSelected={selectedElementId === element.id}
                  isEditing={editingElementId === element.id}
                  onSelect={() => onElementSelect(element.id)}
                  onStartEdit={() => onElementStartEdit(element.id)}
                  onStopEdit={onElementStopEdit}
                  onUpdate={(content) => onElementUpdate(element.id, { content })}
                  onInsertImage={onInsertImage}
                />
              </div>
            );
          } else if (element.type === 'icon') {
            return (
              <div
                key={element.id}
                style={{
                  position: 'absolute',
                  left: `${displayX}px`,
                  top: `${displayY}px`,
                  zIndex: element.zIndex,
                  opacity: isDragging ? 0.5 : 1,
                  cursor: isDragging ? 'grabbing' : 'move',
                }}
              >
                <IconElement
                  element={{ ...element, x: displayX, y: displayY }}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => onElementSelect(element.id)}
                  onDelete={() => onElementDelete(element.id)}
                  onUpdate={(updates) => onElementUpdate(element.id, updates)}
                  onResize={(width, height) => onElementUpdate(element.id, { width, height })}
                />
              </div>
            );
          } else {
            return (
              <div
                key={element.id}
                style={{
                  position: 'absolute',
                  left: `${displayX}px`,
                  top: `${displayY}px`,
                  zIndex: element.zIndex,
                  opacity: isDragging ? 0.5 : 1,
                  cursor: isDragging ? 'grabbing' : 'move',
                }}
              >
                <ImageElement
                  element={{ ...element, x: displayX, y: displayY }}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => onElementSelect(element.id)}
                  onDelete={() => onElementDelete(element.id)}
                  onUpdate={(updates) => onElementUpdate(element.id, updates)}
                  onResize={(width, height) => onElementUpdate(element.id, { width, height })}
                />
              </div>
            );
          }
        })}
        <DragOverlay>
          {activeElement && (
            <div
              style={{
                width: `${activeElement.width || 100}px`,
                height: `${activeElement.height || 100}px`,
                opacity: 0.5,
                border: '2px dashed #3b82f6',
                backgroundColor: 'white',
              }}
            >
              {activeElement.type === 'text' ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: activeElement.content || '' }}
                  className="p-2"
                />
              ) : (
                <img src={activeElement.content} alt="Preview" className="w-full h-full object-contain" />
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

