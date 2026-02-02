import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Square, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface EndNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

/**
 * EndNode - Normal workflow termination
 * Backend: END type, EndNodeHandler
 */
const EndNode = ({ data, selected, id }: EndNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[140px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-gray-500 ring-4 ring-gray-100 shadow-lg' : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-4 h-4 bg-gray-500 border-2 border-white"
                style={{ left: -10 }}
            />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}
                    title="Delete"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                    <Square className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                    <div className="font-bold text-sm text-gray-900">{data.label || 'End'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Terminal</div>
                </div>
            </div>
        </div>
    );
};

export default memo(EndNode);
