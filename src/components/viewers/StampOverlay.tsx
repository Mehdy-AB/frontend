'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Move, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StampResponse, StampApplicationResponse } from '@/types/api';

interface StampOverlayProps {
    stamp: StampResponse;
    application?: StampApplicationResponse;
    pageNumber: number;
    initialX: number;
    initialY: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onPositionChange: (x: number, y: number) => void;
    onRemove: () => void;
    isNew?: boolean;
}

export default function StampOverlay({
    stamp,
    application,
    pageNumber,
    initialX,
    initialY,
    containerRef,
    onPositionChange,
    onRemove,
    isNew = false
}: StampOverlayProps) {
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const stampRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Update position when props change
    useEffect(() => {
        setPosition({ x: initialX, y: initialY });
    }, [initialX, initialY]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!stampRef.current) return;

        e.preventDefault();
        e.stopPropagation();

        const rect = stampRef.current.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const stampWidth = stamp.width || 150;
            const stampHeight = stamp.height || 60;

            let newX = e.clientX - containerRect.left - dragOffset.current.x;
            let newY = e.clientY - containerRect.top - dragOffset.current.y;

            // Clamp to container bounds
            newX = Math.max(0, Math.min(newX, containerRect.width - stampWidth));
            newY = Math.max(0, Math.min(newY, containerRect.height - stampHeight));

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            onPositionChange(position.x, position.y);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, containerRef, onPositionChange, position, stamp.width, stamp.height]);

    const stampStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: stamp.width ? `${stamp.width}px` : 'auto',
        height: stamp.height ? `${stamp.height}px` : 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 100 : 10,
        userSelect: 'none',
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
        boxShadow: isHovered || isDragging
            ? '0 0 0 2px rgba(59, 130, 246, 0.5), 0 4px 12px rgba(0, 0, 0, 0.15)'
            : isNew
                ? '0 0 0 2px rgba(34, 197, 94, 0.5)'
                : 'none',
    };

    const contentStyle: React.CSSProperties = {
        color: stamp.color || '#000000',
        backgroundColor: stamp.backgroundColor || 'transparent',
        borderWidth: stamp.borderColor ? '2px' : '0',
        borderStyle: 'solid',
        borderColor: stamp.borderColor || 'transparent',
        borderRadius: '8px',
        fontSize: `${stamp.fontSize || 16}px`,
        fontFamily: stamp.fontFamily || 'Arial',
        fontWeight: stamp.fontWeight || 'bold',
        opacity: stamp.opacity || 1,
        transform: stamp.rotation ? `rotate(${stamp.rotation}deg)` : undefined,
        width: '100%',
        height: '100%',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center' as const,
        wordBreak: 'break-word' as const,
    };

    return (
        <div
            ref={stampRef}
            style={stampStyle}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Stamp Content */}
            {stamp.stampType === 'TEXT' ? (
                <div style={contentStyle}>
                    {stamp.content || stamp.name}
                </div>
            ) : stamp.stampType === 'IMAGE' && stamp.imageUrl ? (
                <img
                    src={stamp.imageUrl}
                    alt={stamp.name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        opacity: stamp.opacity || 1,
                        transform: stamp.rotation ? `rotate(${stamp.rotation}deg)` : undefined,
                        borderRadius: '8px',
                        border: stamp.borderColor ? `2px solid ${stamp.borderColor}` : 'none',
                    }}
                    draggable={false}
                />
            ) : (
                <div style={contentStyle}>
                    {stamp.name}
                </div>
            )}

            {/* Controls - show on hover */}
            {(isHovered || isDragging) && (
                <div
                    className="absolute -top-8 left-0 flex items-center gap-1 bg-background border rounded-md shadow-lg px-1 py-0.5"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-1 text-xs text-muted-foreground px-1">
                        <Move className="w-3 h-3" />
                        <span>Drag to move</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            )}
        </div>
    );
}
