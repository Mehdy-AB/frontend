'use client';

import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo, Redo
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
}

export function RichTextEditor({ value, onChange, style }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Only update if content is different to avoid cursor jumping
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      editorRef.current.innerHTML = value || '';
      
      // Try to restore cursor position
      if (range && selection) {
        try {
          range.setStart(editorRef.current, Math.min(range.startOffset, editorRef.current.textContent?.length || 0));
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          // Ignore errors restoring cursor
        }
      }
    }
  }, [value]);

  const saveToHistory = (content: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(content);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      saveToHistory(content);
      onChange(content);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        onChange(history[newIndex]);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        onChange(history[newIndex]);
      }
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title, 
    active = false 
  }: { 
    onClick: () => void; 
    icon: React.ComponentType<{ className?: string }>; 
    title: string; 
    active?: boolean;
  }) => (
    <Button
      type="button"
      variant={active ? 'default' : 'ghost'}
      size="sm"
      onClick={onClick}
      title={title}
      className="h-8 w-8 p-0"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex items-center gap-1 flex-wrap">
        <ToolbarButton 
          onClick={() => execCommand('bold')} 
          icon={Bold} 
          title="Bold (Ctrl+B)" 
        />
        <ToolbarButton 
          onClick={() => execCommand('italic')} 
          icon={Italic} 
          title="Italic (Ctrl+I)" 
        />
        <ToolbarButton 
          onClick={() => execCommand('underline')} 
          icon={Underline} 
          title="Underline (Ctrl+U)" 
        />
        <ToolbarButton 
          onClick={() => execCommand('strikeThrough')} 
          icon={Strikethrough} 
          title="Strikethrough" 
        />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <ToolbarButton 
          onClick={() => execCommand('justifyLeft')} 
          icon={AlignLeft} 
          title="Align Left" 
        />
        <ToolbarButton 
          onClick={() => execCommand('justifyCenter')} 
          icon={AlignCenter} 
          title="Align Center" 
        />
        <ToolbarButton 
          onClick={() => execCommand('justifyRight')} 
          icon={AlignRight} 
          title="Align Right" 
        />
        <ToolbarButton 
          onClick={() => execCommand('justifyFull')} 
          icon={AlignJustify} 
          title="Justify" 
        />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <ToolbarButton 
          onClick={() => execCommand('insertUnorderedList')} 
          icon={List} 
          title="Bullet List" 
        />
        <ToolbarButton 
          onClick={() => execCommand('insertOrderedList')} 
          icon={ListOrdered} 
          title="Numbered List" 
        />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <ToolbarButton 
          onClick={handleUndo} 
          icon={Undo} 
          title="Undo (Ctrl+Z)" 
          active={historyIndex > 0}
        />
        <ToolbarButton 
          onClick={handleRedo} 
          icon={Redo} 
          title="Redo (Ctrl+Y)" 
          active={historyIndex < history.length - 1}
        />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
        }}
        style={{
          minHeight: '150px',
          padding: '12px',
          outline: 'none',
          overflow: 'auto',
          ...style
        }}
        className="prose max-w-none focus:outline-none"
      />
    </div>
  );
}

