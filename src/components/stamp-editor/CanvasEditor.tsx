'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { CanvasElement } from '@/types/stamp-editor';
import { RichTextElement } from './RichTextElement';
import { ImageElement } from './ImageElement';
import { IconElement } from './IconElement';
import { InlineToolbar } from './InlineToolbar';

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

/**
 * Manual drag implementation.
 * We stopped using @dnd-kit because the PointerSensor could not receive events
 * from child components that call stopPropagation() on mouseDown (which is
 * necessary for text-editing, resize handles, etc.).  A manual approach gives
 * us full control: mouseDown on the wrapper starts a drag, mousemove on the
 * document updates position, mouseup ends it.
 */
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

  // --- Active text editor instance (for toolbar rendered outside canvas) ---
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const editorMapRef = useRef<Map<string, Editor | null>>(new Map());

  const handleEditorReady = useCallback((elementId: string, editor: Editor | null) => {
    if (editor) {
      editorMapRef.current.set(elementId, editor);
    } else {
      editorMapRef.current.delete(elementId);
    }
    // Update active editor if this element is being edited
    if (elementId === editingElementId) {
      setActiveEditor(editor);
    }
  }, [editingElementId]);

  // Sync active editor when editingElementId changes
  useEffect(() => {
    if (editingElementId) {
      const ed = editorMapRef.current.get(editingElementId) || null;
      setActiveEditor(ed);
    } else {
      setActiveEditor(null);
    }
  }, [editingElementId]);

  // Drag state stored in a ref so the mousemove handler never goes stale.
  const dragRef = useRef<{
    active: boolean;
    id: string;
    startMouseX: number;
    startMouseY: number;
    startElX: number;
    startElY: number;
  } | null>(null);
  // Mutable position used during drag to avoid per-pixel re-renders of ALL elements
  const [dragOffset, setDragOffset] = useState<{ id: string; dx: number; dy: number } | null>(null);

  // --- Stable refs so handlers never go stale ---
  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const onElementUpdateRef = useRef(onElementUpdate);
  onElementUpdateRef.current = onElementUpdate;
  const canvasDimsRef = useRef({ w: canvasWidth, h: canvasHeight });
  canvasDimsRef.current = { w: canvasWidth, h: canvasHeight };
  const dragOffsetRef = useRef(dragOffset);
  dragOffsetRef.current = dragOffset;

  // ---- handlers (stable via useCallback with NO external deps) ----

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const d = dragRef.current;
    if (!d || !d.active) return;
    setDragOffset({
      id: d.id,
      dx: e.clientX - d.startMouseX,
      dy: e.clientY - d.startMouseY,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    const d = dragRef.current;
    if (d && d.active) {
      const off = dragOffsetRef.current;
      const finalX = d.startElX + (off?.dx ?? 0);
      const finalY = d.startElY + (off?.dy ?? 0);
      const { w: cw, h: ch } = canvasDimsRef.current;
      const el = elementsRef.current.find(e => e.id === d.id);
      const elW = el?.width || 100;
      const elH = el?.height || 50;
      onElementUpdateRef.current(d.id, {
        x: Math.max(0, Math.min(cw - elW, finalX)),
        y: Math.max(0, Math.min(ch - elH, finalY)),
      });
    }
    dragRef.current = null;
    setDragOffset(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const startDrag = (elementId: string, e: React.MouseEvent) => {
    // Don't start drag if user clicked a resize handle, button, toolbar, or is editing text
    const target = e.target as HTMLElement;
    if (
      target.closest('.resize-handle') ||
      target.closest('button') ||
      target.closest('.inline-toolbar') ||
      target.closest('select') ||
      editingElementId === elementId
    ) {
      return;
    }

    e.preventDefault();
    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    onElementSelect(elementId);

    dragRef.current = {
      active: true,
      id: elementId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startElX: element.x,
      startElY: element.y,
    };
    setDragOffset(null);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onElementSelect(null);
      onElementStopEdit();
    }
  };

  // Find the editing text element for the toolbar
  const editingTextElement = editingElementId
    ? elements.find(el => el.id === editingElementId && el.type === 'text')
    : null;

  // Helper: clamp drag position so elements can't visually leave the canvas
  const clampPos = (rawX: number, rawY: number, elW: number, elH: number) => ({
    x: Math.max(0, Math.min(canvasWidth - elW, rawX)),
    y: Math.max(0, Math.min(canvasHeight - elH, rawY)),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Toolbar rendered OUTSIDE and ABOVE the canvas — never overflows */}
      {editingTextElement && activeEditor && (
        <div className="mb-2" style={{ maxWidth: '100%' }}>
          <InlineToolbar editor={activeEditor} onInsertImage={onInsertImage} />
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative bg-white border-2 border-gray-300 rounded-lg overflow-hidden cursor-default"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
        }}
        onClick={handleCanvasClick}
      >
        {elements.map((element) => {
          const isDragging = dragOffset?.id === element.id;
          const rawX = isDragging ? element.x + dragOffset.dx : element.x;
          const rawY = isDragging ? element.y + dragOffset.dy : element.y;
          const elW = element.width || 100;
          const elH = element.height || 50;
          const { x: displayX, y: displayY } = clampPos(rawX, rawY, elW, elH);

          if (element.type === 'text') {
            return (
              <div
                key={element.id}
                onMouseDown={(e) => startDrag(element.id, e)}
                style={{
                  position: 'absolute',
                  left: `${displayX}px`,
                  top: `${displayY}px`,
                  zIndex: element.zIndex,
                  opacity: isDragging ? 0.7 : 1,
                  cursor: editingElementId === element.id ? 'text' : 'move',
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
                  onDelete={() => onElementDelete(element.id)}
                  onResize={(width, height) => onElementUpdate(element.id, { width, height })}
                  onInsertImage={onInsertImage}
                  onEditorReady={(editor) => handleEditorReady(element.id, editor)}
                />
              </div>
            );
          } else if (element.type === 'icon') {
            return (
              <div
                key={element.id}
                onMouseDown={(e) => startDrag(element.id, e)}
                style={{
                  position: 'absolute',
                  left: `${displayX}px`,
                  top: `${displayY}px`,
                  zIndex: element.zIndex,
                  opacity: isDragging ? 0.7 : 1,
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
                onMouseDown={(e) => startDrag(element.id, e)}
                style={{
                  position: 'absolute',
                  left: `${displayX}px`,
                  top: `${displayY}px`,
                  zIndex: element.zIndex,
                  opacity: isDragging ? 0.7 : 1,
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
      </div>
    </div>
  );
}
