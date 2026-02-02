import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Archive, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface ArchiveNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const ArchiveNode = ({ data, selected }: ArchiveNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[180px] bg-stone-50 relative shadow-sm transition-all duration-200 group ${selected ? 'border-stone-500 ring-2 ring-stone-200' : 'border-stone-200 hover:border-stone-300'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-5 h-5 bg-stone-500" />
            <Handle type="source" position={Position.Right} className="w-5 h-5 bg-stone-500" />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onEdit) data.onEdit();
                    }}
                    title="Edit Archive"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
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
                <Archive className="w-4 h-4 text-stone-600" />
                <div className="font-semibold text-sm text-stone-900">Archive Document</div>
            </div>

            <div className="text-xs text-stone-700 bg-white border border-stone-100 rounded px-2 py-1 mt-1">
                Move to archive
            </div>
        </div>
    );
};

export default memo(ArchiveNode);
