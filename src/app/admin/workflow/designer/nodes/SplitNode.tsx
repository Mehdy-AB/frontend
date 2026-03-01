import React, { memo, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { GitFork, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface SplitNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

// Color palette for branches
const BRANCH_COLORS = [
    { bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', label: 'bg-fuchsia-50', border: 'border-fuchsia-200' },
    { bg: 'bg-violet-500', text: 'text-violet-600', label: 'bg-violet-50', border: 'border-violet-200' },
    { bg: 'bg-indigo-500', text: 'text-indigo-600', label: 'bg-indigo-50', border: 'border-indigo-200' },
    { bg: 'bg-blue-500', text: 'text-blue-600', label: 'bg-blue-50', border: 'border-blue-200' },
    { bg: 'bg-cyan-500', text: 'text-cyan-600', label: 'bg-cyan-50', border: 'border-cyan-200' },
    { bg: 'bg-teal-500', text: 'text-teal-600', label: 'bg-teal-50', border: 'border-teal-200' },
    { bg: 'bg-emerald-500', text: 'text-emerald-600', label: 'bg-emerald-50', border: 'border-emerald-200' },
    { bg: 'bg-green-500', text: 'text-green-600', label: 'bg-green-50', border: 'border-green-200' },
    { bg: 'bg-amber-500', text: 'text-amber-600', label: 'bg-amber-50', border: 'border-amber-200' },
    { bg: 'bg-rose-500', text: 'text-rose-600', label: 'bg-rose-50', border: 'border-rose-200' },
];

/**
 * SplitNode - Parallel gateway (fork) - splits flow into parallel branches
 * Backend: SPLIT type, SplitNodeHandler
 * Uses same handle pattern as MultiChoiceNode for reliable exit points
 */
const SplitNode = ({ data, selected, id }: SplitNodeProps) => {
    const updateNodeInternals = useUpdateNodeInternals();
    const branches = data.branches || 2;

    // Update React Flow handle positions when branches count changes
    useEffect(() => {
        updateNodeInternals(id);
    }, [id, updateNodeInternals, branches]);

    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[220px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-fuchsia-500 ring-4 ring-fuchsia-100 shadow-lg' : 'border-gray-200 hover:border-fuchsia-400 hover:shadow-md'
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-6 h-6 bg-fuchsia-500 border-[3px] border-blue-300 ring-3 ring-blue-300 hover:scale-125 transition-transform"
                style={{ left: -10 }}
            />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-fuchsia-600 transition-colors"
                    onClick={(e) => { e.stopPropagation(); data.onEdit?.(); }}
                    title="Edit"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}
                    title="Delete"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 mb-2 pr-10">
                <div className="p-2 bg-fuchsia-100 rounded-lg shrink-0">
                    <GitFork className="w-4 h-4 text-fuchsia-600" />
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-sm text-gray-900 leading-tight truncate">{data.label || 'Split'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Parallel Fork</div>
                </div>
            </div>

            <div className="text-[10px] font-medium text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 px-2 py-1 rounded-full text-center mb-2">
                {branches} parallel branches
            </div>

            {/* Output Labels & Handles - Dynamic per branch (same pattern as MultiChoiceNode) */}
            <div className="flex flex-col gap-2 absolute right-0 top-1/2 -translate-y-1/2" style={{ right: -8 }}>
                {Array.from({ length: branches }).map((_, i) => {
                    const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
                    return (
                        <div key={`branch-${i}`} className="flex items-center gap-1">
                            <span className={`text-[9px] font-bold ${color.text} ${color.label} px-1.5 py-0.5 rounded max-w-[60px] truncate`}>
                                Branch {i + 1}
                            </span>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={`branch_${i + 1}`}
                                className={`!relative !transform-none w-6 h-6 ${color.bg} border-[3px] border-blue-300 ring-3 ring-blue-300 hover:scale-125 transition-transform`}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default memo(SplitNode);
