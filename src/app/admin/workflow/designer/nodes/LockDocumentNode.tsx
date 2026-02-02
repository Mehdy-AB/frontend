import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Lock, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface LockDocumentNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

/**
 * LockDocumentNode - Locks document to prevent edits
 * Backend: LOCK_DOCUMENT type, LockDocumentNodeHandler
 */
const LockDocumentNode = ({ data, selected, id }: LockDocumentNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[180px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-amber-500 ring-4 ring-amber-100 shadow-lg' : 'border-gray-200 hover:border-amber-400 hover:shadow-md'
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-4 h-4 bg-amber-500 border-2 border-white"
                style={{ left: -10 }}
            />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors"
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
            <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                    <Lock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                    <div className="font-bold text-sm text-gray-900">{data.label || 'Lock'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Document</div>
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-4 h-4 bg-amber-500 border-2 border-white"
                style={{ right: -10 }}
            />
        </div>
    );
};

export default memo(LockDocumentNode);
