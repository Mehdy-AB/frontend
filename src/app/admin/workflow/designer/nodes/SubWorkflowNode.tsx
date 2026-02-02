import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Workflow, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface SubWorkflowNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const SubWorkflowNode = ({ data, selected }: SubWorkflowNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[200px] bg-violet-50 relative shadow-sm transition-all duration-200 group ${selected ? 'border-violet-500 ring-2 ring-violet-200' : 'border-violet-200 hover:border-violet-300'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-5 h-5 bg-violet-500" />
            <Handle type="source" position={Position.Right} className="w-5 h-5 bg-violet-500" />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-violet-100 text-violet-400 hover:text-violet-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onEdit) data.onEdit();
                    }}
                    title="Edit Sub-Workflow"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-violet-400 hover:text-red-600 transition-colors"
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
                <Workflow className="w-4 h-4 text-violet-600" />
                <div className="font-semibold text-sm text-violet-900">Sub-Workflow</div>
            </div>

            <div className="text-xs text-violet-700 bg-white border border-violet-100 rounded px-2 py-1 mt-1 truncate">
                {data.subWorkflowName || 'Select workflow...'}
            </div>
        </div>
    );
};

export default memo(SubWorkflowNode);
