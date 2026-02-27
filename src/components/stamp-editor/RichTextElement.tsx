'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { FontSize } from './extensions/FontSize';
import { CanvasElement } from '@/types/stamp-editor';
import { X, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RichTextElementProps {
  element: CanvasElement;
  isSelected: boolean;
  isEditing: boolean;
  onUpdate: (content: string) => void;
  onSelect: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onDelete: () => void;
  onResize: (width: number, height: number) => void;
  onInsertImage: (url: string) => void;
  /** Expose editor instance to parent so toolbar can render outside the canvas */
  onEditorReady?: (editor: Editor | null) => void;
  style?: React.CSSProperties;
}

export function RichTextElement({
  element,
  isSelected,
  isEditing,
  onUpdate,
  onSelect,
  onStartEdit,
  onStopEdit,
  onDelete,
  onResize,
  onInsertImage,
  onEditorReady,
  style
}: RichTextElementProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

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
    const newWidth = Math.max(60, r.startW + (e.clientX - r.startX));
    const newHeight = Math.max(24, r.startH + (e.clientY - r.startY));
    onResizeRef.current(newWidth, newHeight);
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizeRef.current.active = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

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
      startW: element.width || 200,
      startH: element.height || 50,
    };
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: { class: 'stamp-editor-image' },
      }),
      TextStyle,
      FontSize,
      Color,
      Underline,
      FontFamily.configure({ types: ['textStyle'] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'stamp-link' },
      }),
    ],
    content: element.content || '<p></p>',
    editable: isEditing,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onUpdate(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[20px] p-1',
      },
    },
  });

  // Expose editor to parent
  useEffect(() => {
    if (onEditorReady) onEditorReady(editor);
    return () => { if (onEditorReady) onEditorReady(null); };
  }, [editor, onEditorReady]);

  // Sync content when not editing
  useEffect(() => {
    if (editor && element.content && !isEditing) {
      const currentContent = editor.getHTML();
      if (currentContent !== element.content) {
        editor.commands.setContent(element.content);
      }
    }
  }, [element.content, editor, isEditing]);

  // Toggle editable
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
      if (isEditing) setTimeout(() => editor.commands.focus(), 50);
    }
  }, [isEditing, editor]);

  useEffect(() => {
    return () => { if (editor) editor.destroy(); };
  }, [editor]);

  // Single click = select.  Double click = edit.
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSelected) onSelect();
  }, [isSelected, onSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) onStartEdit();
  }, [isEditing, onStartEdit]);

  // Close editing on click outside
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (wrapperRef.current?.contains(target)) return;
      // Don't close if clicking the toolbar (which is now outside the canvas)
      if (target.closest('.inline-toolbar')) return;
      if (
        target.closest('[data-radix-portal]') ||
        target.closest('[data-radix-popover-content]') ||
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest('[role="listbox"]') ||
        target.closest('[role="dialog"]')
      ) return;
      onStopEdit();
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler, true), 50);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler, true); };
  }, [isEditing, onStopEdit]);

  const combinedStyle: React.CSSProperties = {
    position: 'relative',
    width: element.width || 'auto',
    height: element.height || 'auto',
    minWidth: '60px',
    minHeight: '24px',
    border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
    borderRadius: '4px',
    backgroundColor: element.style?.backgroundColor || 'transparent',
    cursor: isEditing ? 'text' : 'move',
    overflow: 'hidden',
    ...style,
  };

  if (!editor) return null;

  return (
    <div ref={wrapperRef} className="stamp-text-element" style={{ position: 'relative' }}>
      <div
        style={combinedStyle}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
      >
        <EditorContent editor={editor} />
      </div>
      {isSelected && !isEditing && (
        <>
          {/* Delete button */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full z-10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Selection indicator */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />

          {/* Resize handle */}
          <div
            className="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-blue-500 border-2 border-white rounded-tl-lg cursor-nwse-resize z-10"
            onMouseDown={handleResizeStart}
          >
            <Maximize2 className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
          </div>
        </>
      )}
    </div>
  );
}
