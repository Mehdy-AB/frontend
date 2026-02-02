'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Image as ImageIcon, Type, List, ListOrdered,
  Undo, Redo, Link, Code, Quote, Minus, Heading1, Heading2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface InlineToolbarProps {
  editor: ReturnType<typeof useEditor>;
  onInsertImage: (url: string) => void;
}

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
  { label: 'Tahoma', value: 'Tahoma' },
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96];

const COLOR_PRESETS = [
  '#000000', '#FFFFFF', '#DC2626', '#059669', '#2563EB', 
  '#7C3AED', '#D97706', '#475569', '#EC4899', '#14B8A6'
];

export function InlineToolbar({ editor, onInsertImage }: InlineToolbarProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, visible: false });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isToolbarHovered, setIsToolbarHovered] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateToolbarPosition = () => {
      const { from, to } = editor.state.selection;
      if (from === to && !isToolbarHovered) {
        setPosition({ top: 0, left: 0, visible: false });
        return;
      }

      if (from === to && isToolbarHovered) {
        // Keep toolbar visible if hovering
        return;
      }

      const { view } = editor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);

      const editorElement = editor.view.dom.closest('.stamp-text-element');
      
      if (editorElement) {
        const editorRect = (editorElement as HTMLElement).getBoundingClientRect();
        setPosition({
          top: start.top - editorRect.top - 60,
          left: (start.left + end.left) / 2 - editorRect.left,
          visible: true,
        });
      }
    };

    editor.on('selectionUpdate', updateToolbarPosition);
    editor.on('update', updateToolbarPosition);

    return () => {
      editor.off('selectionUpdate', updateToolbarPosition);
      editor.off('update', updateToolbarPosition);
    };
  }, [editor, isToolbarHovered]);

  if (!editor) {
    return null;
  }

  const getCurrentColor = () => {
    return editor.getAttributes('textStyle').color || '#000000';
  };

  const getCurrentFontFamily = () => {
    return editor.getAttributes('textStyle').fontFamily || 'Arial';
  };

  const getCurrentFontSize = () => {
    const attrs = editor.getAttributes('textStyle');
    if (attrs.fontSize) {
      const match = attrs.fontSize.toString().match(/(\d+)px/);
      if (match) return parseInt(match[1]);
    }
    
    try {
      const domSelection = window.getSelection();
      if (domSelection && domSelection.rangeCount > 0) {
        const range = domSelection.getRangeAt(0);
        const node = range.commonAncestorContainer;
        const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element;
        if (element) {
          const computedStyle = window.getComputedStyle(element);
          const fontSize = computedStyle.fontSize;
          return fontSize ? parseInt(fontSize) : 16;
        }
      }
    } catch (e) {
      // Fallback
    }
    return 16;
  };

  const handleColorChange = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const handleFontSizeChange = (size: number) => {
    const command = editor.chain().focus();
    command.setMark('textStyle', { fontSize: `${size}px` });
    command.updateAttributes('textStyle', { 'data-font-size': `${size}px` });
    command.run();
  };

  const handleFontFamilyChange = (fontFamily: string) => {
    editor.chain().focus().setFontFamily(fontFamily).run();
  };

  const handleImageInsert = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      onInsertImage(url);
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleLinkInsert = () => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  // Determine if toolbar should be visible
  const { from, to } = editor.state.selection;
  const hasSelection = from !== to;
  const shouldShow = position.visible || isToolbarHovered || hasSelection;

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className="inline-toolbar absolute z-[9999] bg-white border-2 border-gray-300 rounded-lg shadow-xl p-2 flex items-center gap-1 flex-nowrap overflow-x-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        minWidth: 'max-content',
        pointerEvents: 'auto',
      }}
      onMouseEnter={() => setIsToolbarHovered(true)}
      onMouseLeave={() => {
        // Delay hiding to allow clicking on toolbar items
        setTimeout(() => {
          if (!toolbarRef.current?.matches(':hover')) {
            const { from, to } = editor.state.selection;
            if (from === to) {
              setIsToolbarHovered(false);
            }
          }
        }, 300);
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        // Keep editor focused when clicking toolbar
        setTimeout(() => {
          editor.commands.focus();
        }, 10);
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        // Keep editor focused
        setTimeout(() => {
          editor.commands.focus();
        }, 10);
      }}
      onFocus={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Undo/Redo */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="h-8 w-8 p-0"
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="h-8 w-8 p-0"
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text Formatting */}
      <Button
        type="button"
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className="h-8 w-8 p-0"
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className="h-8 w-8 p-0"
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('underline') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className="h-8 w-8 p-0"
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('strike') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className="h-8 w-8 p-0"
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('code') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className="h-8 w-8 p-0"
        title="Code"
      >
        <Code className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Headings */}
      <Button
        type="button"
        variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className="h-8 w-8 p-0"
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="h-8 w-8 p-0"
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists */}
      <Button
        type="button"
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className="h-8 w-8 p-0"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className="h-8 w-8 p-0"
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className="h-8 w-8 p-0"
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="h-8 w-8 p-0"
        title="Horizontal Rule"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Alignment */}
      <Button
        type="button"
        variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className="h-8 w-8 p-0"
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className="h-8 w-8 p-0"
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className="h-8 w-8 p-0"
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className="h-8 w-8 p-0"
        title="Justify"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Font Family */}
      <Select
        value={getCurrentFontFamily()}
        onValueChange={handleFontFamilyChange}
      >
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((font) => (
            <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Font Size */}
      <Select
        value={getCurrentFontSize().toString()}
        onValueChange={(value) => handleFontSizeChange(parseInt(value))}
      >
        <SelectTrigger className="h-8 w-[70px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}px
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Color Picker with Presets */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Text Color"
          >
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: getCurrentColor() }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-2 block">Color Presets</label>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorChange(color)}
                    className={`w-8 h-8 rounded border-2 ${
                      getCurrentColor() === color ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-2 block">Custom Color</label>
              <Input
                type="color"
                value={getCurrentColor()}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-10 w-full cursor-pointer"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Insert Image */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleImageInsert}
        className="h-8 w-8 p-0"
        title="Insert Image"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      {/* Insert Link */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleLinkInsert}
        className="h-8 w-8 p-0"
        title="Insert Link"
      >
        <Link className="h-4 w-4" />
      </Button>
    </div>
  );
}
