'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";

interface EmailPreviewPanelProps {
    subject: string;
    bodyHtml: string;
    onClose: () => void;
    onFetchPreview: (recipientId?: string) => Promise<{
        renderedSubject: string;
        renderedBodyHtml: string;
        resolvedVariables: Record<string, string>;
        warnings: string[];
        previewAsRecipient: string;
    }>;
    className?: string;
}

/**
 * Preview panel showing exactly what email will look like.
 * Fetches rendered content from backend to ensure accuracy.
 */
export function EmailPreviewPanel({
    subject,
    bodyHtml,
    onClose,
    onFetchPreview,
    className,
}: EmailPreviewPanelProps) {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<{
        renderedSubject: string;
        renderedBodyHtml: string;
        resolvedVariables: Record<string, string>;
        warnings: string[];
        previewAsRecipient: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchPreview = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await onFetchPreview();
            setPreview(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate preview');
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount
    useState(() => {
        fetchPreview();
    });

    // Need to check if document is available (SSR safety)
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const content = (
        <div
            className={cn(
                "fixed inset-0 flex items-center justify-center bg-black/50",
                className
            )}
            style={{ zIndex: 9999, pointerEvents: 'auto' }}
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col mx-4"
                style={{ pointerEvents: 'auto' }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <h2 className="text-lg font-semibold">Email Preview</h2>
                        {preview?.previewAsRecipient && (
                            <p className="text-sm text-muted-foreground">
                                Previewing as: <strong>{preview.previewAsRecipient}</strong>
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchPreview}
                            disabled={loading}
                        >
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onClose();
                            }}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading && !preview ? (
                        <div className="flex items-center justify-center h-48">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                            <p className="text-destructive">{error}</p>
                            <Button variant="outline" className="mt-4" onClick={fetchPreview}>
                                Try Again
                            </Button>
                        </div>
                    ) : preview ? (
                        <div className="space-y-6">
                            {/* Warnings */}
                            {preview.warnings.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-yellow-800">Variable Warnings</p>
                                            <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                                                {preview.warnings.map((w, i) => (
                                                    <li key={i}>{w}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Subject preview */}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Subject</label>
                                <div className="mt-1 p-3 bg-muted rounded-lg font-medium">
                                    {preview.renderedSubject || <span className="text-muted-foreground italic">No subject</span>}
                                </div>
                            </div>

                            {/* Body preview */}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Email Body</label>
                                <div
                                    className="mt-1 p-4 bg-white border rounded-lg prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: preview.renderedBodyHtml }}
                                />
                            </div>

                            {/* Resolved variables */}
                            {Object.keys(preview.resolvedVariables).length > 0 && (
                                <details className="group">
                                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                                        View resolved variables ({Object.keys(preview.resolvedVariables).length})
                                    </summary>
                                    <div className="mt-2 p-3 bg-muted rounded-lg">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {Object.entries(preview.resolvedVariables)
                                                .filter(([_, value]) => value) // Only show non-empty
                                                .map(([key, value]) => (
                                                    <div key={key} className="flex gap-2">
                                                        <code className="text-xs bg-background px-1 rounded">{`{{${key}}}`}</code>
                                                        <span className="text-muted-foreground truncate">{value}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </details>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Click refresh to load preview
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-muted/30">
                    <Button
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onClose();
                        }}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
