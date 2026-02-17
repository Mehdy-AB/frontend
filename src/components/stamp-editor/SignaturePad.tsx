'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Undo2, Pen, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface SignaturePadProps {
    open: boolean;
    onClose: () => void;
    onSave: (dataUrl: string) => void;
}

const PEN_COLORS = [
    '#000000', '#1E3A5F', '#1A1A2E', '#2C3E50',
    '#DC2626', '#2563EB', '#059669', '#7C3AED',
];

export function SignaturePad({ open, onClose, onSave }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [penColor, setPenColor] = useState('#000000');
    const [penWidth, setPenWidth] = useState(2);
    const [hasDrawn, setHasDrawn] = useState(false);
    const historyRef = useRef<ImageData[]>([]);

    // Sync canvas internal resolution with its CSS size via ResizeObserver
    // This avoids the dialog-animation timing issue where getBoundingClientRect()
    // returned a stale (smaller) rect during the open animation.
    useEffect(() => {
        if (!open) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const syncSize = () => {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const rect = canvas.getBoundingClientRect();
            const w = Math.round(rect.width);
            const h = Math.round(rect.height);
            if (canvas.width !== w || canvas.height !== h) {
                // Save current drawing before resize
                let saved: ImageData | null = null;
                if (canvas.width > 0 && canvas.height > 0) {
                    saved = ctx.getImageData(0, 0, canvas.width, canvas.height);
                }
                canvas.width = w;
                canvas.height = h;
                // Restore drawing
                if (saved) ctx.putImageData(saved, 0, 0);
                // Reapply drawing defaults (reset on resize)
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = penColor;
                ctx.lineWidth = penWidth;
            }
        };

        // Initial sync + clear
        syncSize();
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
        historyRef.current = [];
        setHasDrawn(false);

        const ro = new ResizeObserver(() => syncSize());
        ro.observe(canvas);
        return () => ro.disconnect();
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update pen style when color/width changes
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
    }, [penColor, penWidth]);

    // Map mouse position to canvas coordinates (1:1, no 2x scale needed)
    const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height),
        };
    }, []);

    const saveToHistory = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        // Keep only last 30 steps
        if (historyRef.current.length > 30) historyRef.current.shift();
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        saveToHistory();
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setHasDrawn(true);
    }, [getPos, saveToHistory]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    }, [isDrawing, getPos]);

    const handleMouseUp = useCallback(() => {
        setIsDrawing(false);
    }, []);

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        saveToHistory();
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
    };

    const handleUndo = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const prev = historyRef.current.pop();
        if (prev) {
            ctx.putImageData(prev, 0, 0);
        } else {
            const rect = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);
        }
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Trim transparent space to get tight bounding box
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = imageData;

        let minX = width, minY = height, maxX = 0, maxY = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const alpha = data[(y * width + x) * 4 + 3];
                if (alpha > 0) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        if (maxX <= minX || maxY <= minY) {
            // Nothing drawn
            return;
        }

        // Add a small padding
        const pad = 8;
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(width - 1, maxX + pad);
        maxY = Math.min(height - 1, maxY + pad);

        const trimW = maxX - minX + 1;
        const trimH = maxY - minY + 1;
        const trimmed = ctx.getImageData(minX, minY, trimW, trimH);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = trimW;
        tempCanvas.height = trimH;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.putImageData(trimmed, 0, 0);

        const dataUrl = tempCanvas.toDataURL('image/png');
        onSave(dataUrl);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pen className="w-5 h-5" />
                        Draw Signature
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Drawing canvas */}
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg bg-white cursor-crosshair relative overflow-hidden"
                        style={{ height: 200 }}
                    >
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />
                        {!hasDrawn && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 text-lg select-none">
                                Sign here...
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        {/* Pen color */}
                        <div className="flex items-center gap-1.5">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">Color</Label>
                            <div className="flex gap-1">
                                {PEN_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setPenColor(color)}
                                        className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-transform ${penColor === color ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : 'border-gray-300'
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Pen width */}
                        <div className="flex items-center gap-1.5 flex-1">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">Size</Label>
                            <Slider
                                value={[penWidth]}
                                onValueChange={([v]) => setPenWidth(v)}
                                min={1}
                                max={8}
                                step={0.5}
                                className="flex-1"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={handleUndo} className="gap-1">
                            <Undo2 className="w-4 h-4" /> Undo
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handleClear} className="gap-1">
                            <Eraser className="w-4 h-4" /> Clear
                        </Button>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={!hasDrawn}
                        className="gap-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        <Check className="w-4 h-4" /> Insert Signature
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
