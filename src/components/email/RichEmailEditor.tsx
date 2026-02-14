'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Link as LinkIcon,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Code,
    Undo,
    Redo,
    Variable,
    Eye,
    FileCode,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { VariablePicker, type VariableDefinition } from './VariablePicker';

export interface RichEmailEditorProps {
    value: string;
    onChange: (html: string) => void;
    availableVariables?: VariableDefinition[];
    placeholder?: string;
    className?: string;
    onPreview?: () => void;
    error?: boolean;
}

/**
 * TipTap-based WYSIWYG editor for email composition.
 * Designed for non-technical users - no HTML knowledge required.
 */
export function RichEmailEditor({
    value,
    onChange,
    availableVariables = [],
    placeholder = 'Start writing your email...',
    className,
    onPreview,
    error = false,
}: RichEmailEditorProps) {
    const [showVariablePicker, setShowVariablePicker] = useState(false);
    const [showHtml, setShowHtml] = useState(false);

    const editor = useEditor({
        immediatelyRender: false, // Required for Next.js SSR
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline cursor-pointer',
                },
            }),
            Underline,
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
            },
        },
    });

    // Update editor content when value changes externally
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [editor, value]);

    const insertVariable = useCallback((variable: VariableDefinition) => {
        if (editor) {
            // Insert variable as text that will be rendered as a styled badge
            editor.commands.insertContent(`{{${variable.key}}}`);
            setShowVariablePicker(false);
        }
    }, [editor]);

    const [linkUrl, setLinkUrl] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);

    const openLinkInput = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href || '';
        setLinkUrl(previousUrl);
        setShowLinkInput(true);
    }, [editor]);

    const applyLink = useCallback(() => {
        if (!editor) return;
        if (linkUrl === '') {
            editor.chain().focus().unsetLink().run();
        } else {
            // Add https:// if no protocol specified
            const url = linkUrl.match(/^https?:\/\//) ? linkUrl : `https://${linkUrl}`;

            // Check if text is selected
            const { from, to } = editor.state.selection;
            if (from === to) {
                // No text selected — insert the URL as clickable link text
                editor.chain().focus()
                    .insertContent(`<a href="${url}">${url}</a>`)
                    .run();
            } else {
                // Text is selected — wrap it with the link
                editor.chain().focus().setLink({ href: url }).run();
            }
        }
        setShowLinkInput(false);
        setLinkUrl('');
    }, [editor, linkUrl]);

    const cancelLink = useCallback(() => {
        setShowLinkInput(false);
        setLinkUrl('');
        editor?.chain().focus().run();
    }, [editor]);

    if (!editor) {
        return (
            <div className={cn("border rounded-lg p-4 min-h-[300px] animate-pulse bg-muted", className)}>
                Loading editor...
            </div>
        );
    }

    return (
        <div className={cn(
            "border rounded-lg overflow-hidden",
            error && "border-red-500",
            className
        )}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
                {/* Text formatting */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn(editor.isActive('bold') && 'bg-accent')}
                    title="Bold"
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn(editor.isActive('italic') && 'bg-accent')}
                    title="Italic"
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={cn(editor.isActive('underline') && 'bg-accent')}
                    title="Underline"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Headings */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={cn(editor.isActive('heading', { level: 1 }) && 'bg-accent')}
                    title="Heading 1"
                >
                    <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={cn(editor.isActive('heading', { level: 2 }) && 'bg-accent')}
                    title="Heading 2"
                >
                    <Heading2 className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Lists */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn(editor.isActive('bulletList') && 'bg-accent')}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={cn(editor.isActive('orderedList') && 'bg-accent')}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Link */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={openLinkInput}
                    className={cn(editor.isActive('link') && 'bg-accent')}
                    title="Add Link"
                >
                    <LinkIcon className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Variable picker */}
                <div className="relative">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowVariablePicker(!showVariablePicker)}
                        className={cn(showVariablePicker && 'bg-accent', 'gap-1')}
                        title="Insert Variable"
                    >
                        <Variable className="h-4 w-4" />
                        <span className="text-xs hidden sm:inline">Insert Variable</span>
                    </Button>
                    {showVariablePicker && (
                        <VariablePicker
                            variables={availableVariables}
                            onSelect={insertVariable}
                            onClose={() => setShowVariablePicker(false)}
                        />
                    )}
                </div>

                <div className="flex-1" />

                {/* Undo/Redo */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
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
                    title="Redo"
                >
                    <Redo className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                {/* View HTML (for advanced users) */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHtml(!showHtml)}
                    className={cn(showHtml && 'bg-accent')}
                    title="View HTML"
                >
                    <FileCode className="h-4 w-4" />
                </Button>

                {/* Preview button */}
                {onPreview && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onPreview}
                        className="gap-1"
                        title="Preview Email"
                    >
                        <Eye className="h-4 w-4" />
                        <span className="text-xs hidden sm:inline">Preview</span>
                    </Button>
                )}
            </div>

            {/* Link URL input bar — rendered inline so it's never clipped by overflow-hidden */}
            {showLinkInput && (
                <div
                    className="flex items-center gap-2 px-3 py-2 border-b bg-blue-50 dark:bg-blue-950/30"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <LinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <input
                        type="url"
                        placeholder="https://example.com"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                            if (e.key === 'Escape') { cancelLink(); }
                        }}
                        className="flex-1 h-8 px-2 border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        autoFocus
                    />
                    <Button type="button" size="sm" onClick={applyLink} className="h-8">
                        Apply
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={cancelLink} className="h-8">
                        ✕
                    </Button>
                </div>
            )}

            {/* Editor Content or HTML View */}
            {showHtml ? (
                <textarea
                    value={editor.getHTML()}
                    onChange={(e) => {
                        editor.commands.setContent(e.target.value, { emitUpdate: false });
                        onChange(e.target.value);
                    }}
                    className="w-full min-h-[200px] p-4 font-mono text-sm bg-muted/30 focus:outline-none resize-y"
                    placeholder="<p>HTML content...</p>"
                />
            ) : (
                <EditorContent editor={editor} className="min-h-[200px]" />
            )}

            {/* Variable hint */}
            {availableVariables.length > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/30">
                    💡 Use the "Insert Variable" button to personalize your email. Variables like <code className="bg-muted px-1 rounded">{'{{recipient.firstName}}'}</code> will be replaced with actual values.
                </div>
            )}
        </div>
    );
}
