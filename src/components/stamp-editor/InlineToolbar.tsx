'use client';

import React, { useRef } from 'react';
import { useEditor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered,
  Undo, Redo, Code, Heading1, Heading2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface InlineToolbarProps {
  editor: ReturnType<typeof useEditor>;
  onInsertImage: (url: string) => void;
}

const FONT_FAMILIES = [
  'Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Verdana',
  'Courier New', 'Trebuchet MS', 'Tahoma',
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96];

const COLOR_PRESETS = [
  '#000000', '#FFFFFF', '#DC2626', '#059669', '#2563EB',
  '#7C3AED', '#D97706', '#475569', '#EC4899', '#14B8A6'
];

export function InlineToolbar({ editor, onInsertImage }: InlineToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  if (!editor) return null;

  const getCurrentColor = () => {
    return editor.getAttributes('textStyle').color || '#000000';
  };

  const getCurrentFontFamily = () => {
    return editor.getAttributes('textStyle').fontFamily || 'Arial';
  };

  const getCurrentFontSize = (): number => {
    const attrs = editor.getAttributes('textStyle');
    if (attrs.fontSize) {
      const match = attrs.fontSize.toString().match(/(\d+)/);
      if (match) return parseInt(match[1]);
    }
    try {
      const domSelection = window.getSelection();
      if (domSelection && domSelection.rangeCount > 0) {
        const range = domSelection.getRangeAt(0);
        const node = range.commonAncestorContainer;
        const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element;
        if (element) return parseInt(window.getComputedStyle(element).fontSize) || 16;
      }
    } catch { /* fallback */ }
    return 16;
  };

  const handleColorChange = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const handleFontSizeChange = (size: number) => {
    const clamped = Math.max(6, Math.min(200, size));
    editor.chain().focus().setFontSize(`${clamped}px`).run();
  };

  const handleFontFamilyChange = (fontFamily: string) => {
    editor.chain().focus().setFontFamily(fontFamily).run();
  };

  // Stop propagation only (don't preventDefault — that breaks native <select>)
  const stopProp = (e: React.MouseEvent | React.FocusEvent) => {
    e.stopPropagation();
  };

  const ToolBtn = ({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
    <Button
      type="button"
      variant={active ? 'default' : 'ghost'}
      size="sm"
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="h-7 w-7 p-0"
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div
      ref={toolbarRef}
      className="inline-toolbar bg-white border border-gray-200 rounded-lg shadow-lg flex flex-wrap items-center gap-0.5 p-1.5"
      style={{ minWidth: 'max-content', pointerEvents: 'auto' }}
      onMouseDown={stopProp}
      onClick={stopProp}
    >
      {/* Row 1: Formatting buttons */}
      <div className="flex items-center gap-0.5">
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>
        <Separator orientation="vertical" className="h-5 mx-0.5" />
        <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <Underline className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Code">
          <Code className="h-3.5 w-3.5" />
        </ToolBtn>
        <Separator orientation="vertical" className="h-5 mx-0.5" />
        <ToolBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
          <Heading1 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <Separator orientation="vertical" className="h-5 mx-0.5" />
        <ToolBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center">
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right">
          <AlignRight className="h-3.5 w-3.5" />
        </ToolBtn>
        <Separator orientation="vertical" className="h-5 mx-0.5" />
        <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      {/* Row 2: Font, Size, Color */}
      <div className="flex items-center gap-1.5 w-full pt-1 border-t border-gray-100 mt-1">
        {/* Font Family — native select, NO preventDefault so dropdown opens */}
        <select
          value={getCurrentFontFamily()}
          onChange={(e) => {
            handleFontFamilyChange(e.target.value);
            // Re-focus editor after change
            setTimeout(() => editor.commands.focus(), 10);
          }}
          onClick={stopProp}
          className="h-7 text-xs border rounded px-1 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          style={{ maxWidth: '110px' }}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>

        {/* Font Size — native select, NO preventDefault */}
        <select
          value={getCurrentFontSize()}
          onChange={(e) => {
            handleFontSizeChange(parseInt(e.target.value));
            setTimeout(() => editor.commands.focus(), 10);
          }}
          onClick={stopProp}
          className="h-7 text-xs border rounded px-1 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          style={{ width: '55px' }}
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>

        {/* Color Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="h-7 w-7 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer"
              title="Text Color"
            >
              <div
                className="w-4 h-4 rounded-sm border border-gray-300"
                style={{ backgroundColor: getCurrentColor() }}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 p-3"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={stopProp}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-2 block">Color Presets</label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={() => handleColorChange(color)}
                      className={`w-7 h-7 rounded border-2 cursor-pointer ${getCurrentColor() === color ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Custom</label>
                <Input
                  type="color"
                  value={getCurrentColor()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="h-8 w-full cursor-pointer"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
