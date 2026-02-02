import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Trash, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface DeleteNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const DeleteNode = ({ data, selected }: DeleteNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[180px] bg-red-50 relative shadow-sm transition-all duration-200 group ${selected ? 'border-red-500 ring-2 ring-red-200' : 'border-red-200 hover:border-red-300'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-5 h-5 bg-red-500" />
            <Handle type="source" position={Position.Right} className="w-5 h-5 bg-red-500" />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onEdit) data.onEdit();
                    }}
                    title="Edit Delete"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onDelete) data.onDelete();
                    }}
                    title="Delete Node"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex items-center gap-2 mb-1 pr-10">
                <Trash className="w-4 h-4 text-red-600" />
                <div className="font-semibold text-sm text-red-900">Delete Document</div>
            </div>

            <div className="text-xs text-red-700 bg-white border border-red-100 rounded px-2 py-1 mt-1">
                {data.softDelete !== false ? 'Soft delete (recoverable)' : 'Permanent delete'}
            </div>
        </div>
    );
};

export default memo(DeleteNode);
