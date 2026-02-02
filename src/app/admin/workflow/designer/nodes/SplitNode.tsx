import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitFork, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface SplitNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

/**
 * SplitNode - Parallel gateway (fork) - splits flow into parallel branches
 * Backend: SPLIT type, SplitNodeHandler
 */
const SplitNode = ({ data, selected, id }: SplitNodeProps) => {
    const branches = data.branches || 2;

    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[180px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-fuchsia-500 ring-4 ring-fuchsia-100 shadow-lg' : 'border-gray-200 hover:border-fuchsia-400 hover:shadow-md'
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-4 h-4 bg-fuchsia-500 border-2 border-white"
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
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-fuchsia-100 rounded-lg">
                    <GitFork className="w-4 h-4 text-fuchsia-600" />
                </div>
                <div>
                    <div className="font-bold text-sm text-gray-900">{data.label || 'Split'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Parallel Fork</div>
                </div>
            </div>

            <div className="text-xs text-fuchsia-600 bg-fuchsia-50 px-2 py-1 rounded text-center">
                {branches} branches
            </div>

            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-around" style={{ right: -12 }}>
                {Array.from({ length: branches }).map((_, i) => (
                    <Handle
                        key={`branch-${i}`}
                        type="source"
                        position={Position.Right}
                        className="w-3 h-3 bg-fuchsia-500 border-2 border-white"
                        id={`branch_${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default memo(SplitNode);
