'use client';

import { useState } from 'react';
import { EdgeProps, BaseEdge, getSmoothStepPath } from '@xyflow/react';
import { X, Plus } from 'lucide-react';

/**
 * Custom Edge Component with delete and add buttons on hover
 * Dispatches custom events for edge actions that are handled by the parent
 */
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, source, target }: EdgeProps) => {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 100, // Rounded corners for "straight then curve" look
    });
    const [isHovered, setIsHovered] = useState(false);

    // Check if this is the start-finish edge
    const isStartFinishEdge = source === 'start-node' && target === 'finish-node';

    return (
        <>
            {/* Invisible wider path for easier hover detection */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ cursor: 'pointer' }}
            />
            <BaseEdge
                id={id}
                path={edgePath}
                style={{ stroke: isHovered ? '#ef4444' : '#3b82f6', strokeWidth: isHovered ? 5 : 4, transition: 'stroke 0.2s, stroke-width 0.2s' }}
            />
            {/* Always visible delete button at center */}
            <foreignObject
                x={labelX - 12}
                y={labelY - 12}
                width={24}
                height={24}
                className="overflow-visible pointer-events-auto"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const event = new CustomEvent('deleteEdge', { detail: { edgeId: id } });
                        window.dispatchEvent(event);
                    }}
                    className={`w-6 h-6 flex items-center justify-center rounded-full transition-all shadow-sm ${isHovered
                        ? 'bg-red-500 text-white scale-110 shadow-md'
                        : 'bg-white text-gray-400 border border-gray-200 hover:bg-red-500 hover:text-white hover:border-red-500'
                        }`}
                    title="Delete connection"
                >
                    <X className="w-3 h-3" />
                </button>
            </foreignObject>
            {/* Add step button for start-finish edge */}
            {isStartFinishEdge && (
                <foreignObject
                    x={labelX - 40}
                    y={labelY - 12}
                    width={24}
                    height={24}
                    className="overflow-visible pointer-events-auto"
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const event = new CustomEvent('addStepToEdge', { detail: { edgeId: id } });
                            window.dispatchEvent(event);
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm hover:bg-blue-600 hover:scale-110 transition-all"
                        title="Add step"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </foreignObject>
            )}
        </>
    );
};

export default CustomEdge;
