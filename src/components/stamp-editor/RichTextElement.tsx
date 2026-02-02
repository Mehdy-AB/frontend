'use client';

import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { CanvasElement } from '@/types/stamp-editor';
import { InlineToolbar } from './InlineToolbar';

interface RichTextElementProps {
  element: CanvasElement;
  isSelected: boolean;
  isEditing: boolean;
  onUpdate: (content: string) => void;
  onSelect: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onInsertImage: (url: string) => void;
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
  onInsertImage,
  style
}: RichTextElementProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'stamp-editor-image',
        },
      }),
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'stamp-link',
        },
      }),
    ],
    content: element.content || '<p></p>',
    editable: isEditing,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[40px] p-2',
      },
    },
  });

  useEffect(() => {
    if (editor && element.content && !isEditing) {
      const currentContent = editor.getHTML();
      if (currentContent !== element.content) {
        editor.commands.setContent(element.content);
      }
    }
  }, [element.content, editor, isEditing]);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      onSelect();
      onStartEdit();
      setTimeout(() => {
        editor?.commands.focus();
      }, 100);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if clicking on toolbar or popover/dialog
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && (
      relatedTarget.closest('.inline-toolbar') ||
      relatedTarget.closest('[role="dialog"]') ||
      relatedTarget.closest('[data-radix-portal]') ||
      relatedTarget.closest('[data-radix-popover-content]') ||
      relatedTarget.closest('[data-radix-select-content]') ||
      relatedTarget.closest('[data-radix-popper-content-wrapper]')
    )) {
      // Keep editor focused
      setTimeout(() => {
        editor?.commands.focus();
      }, 10);
      return;
    }
    if (isEditing) {
      // Longer delay to allow toolbar interactions
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && (
          activeElement.closest('.inline-toolbar') ||
          activeElement.closest('[role="dialog"]') ||
          activeElement.closest('[data-radix-portal]') ||
          activeElement.closest('[data-radix-popover-content]') ||
          activeElement.closest('[data-radix-select-content]') ||
          activeElement.closest('[data-radix-popper-content-wrapper]')
        )) {
          editor?.commands.focus();
          return;
        }
        // Double check if toolbar is still visible/hovered
        const toolbar = document.querySelector('.inline-toolbar');
        if (toolbar && (toolbar.matches(':hover') || toolbar.querySelector(':hover'))) {
          editor?.commands.focus();
          return;
        }
        onStopEdit();
      }, 500);
    }
  };

  const combinedStyle: React.CSSProperties = {
    position: 'relative',
    width: element.width || 'auto',
    minWidth: '100px',
    minHeight: '40px',
    border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
    borderRadius: '4px',
    backgroundColor: element.style?.backgroundColor || 'transparent',
    ...style,
  };

  if (!editor) {
    return null;
  }

  return (
    <div
      ref={editorRef}
      style={combinedStyle}
      onClick={handleClick}
      onBlur={handleBlur}
      className="stamp-text-element relative"
      onMouseDown={(e) => {
        if (!isEditing) {
          e.stopPropagation();
        }
      }}
    >
      <EditorContent editor={editor} />
      {isEditing && editor && (
        <div className="absolute" style={{ pointerEvents: 'auto', zIndex: 9999 }}>
          <InlineToolbar editor={editor} onInsertImage={onInsertImage} />
        </div>
      )}
      {isSelected && !isEditing && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
}

