import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface ReviewNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

/**
 * ReviewNode - Review task without strict approve/reject decision
 * Backend: REVIEW type, ReviewNodeHandler
 */
const ReviewNode = ({ data, selected, id }: ReviewNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[220px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-indigo-500 ring-4 ring-indigo-100 shadow-lg' : 'border-gray-200 hover:border-indigo-400 hover:shadow-md'
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-4 h-4 bg-indigo-500 border-2 border-white"
                style={{ left: -10 }}
            />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
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
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <Eye className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                    <div className="font-bold text-sm text-gray-900">{data.label || 'Review'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Review Task</div>
                </div>
            </div>

            {data.description && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md mb-2">{data.description}</div>
            )}

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-4 h-4 bg-indigo-500 border-2 border-white"
                style={{ right: -10 }}
                id="completed"
            />
        </div>
    );
};

export default memo(ReviewNode);
