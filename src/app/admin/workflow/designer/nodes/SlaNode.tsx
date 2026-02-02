import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Timer, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface SlaNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const SlaNode = ({ data, selected }: SlaNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[180px] bg-orange-50 relative shadow-sm transition-all duration-200 group ${selected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-orange-200 hover:border-orange-300'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-5 h-5 bg-orange-500" />
            <Handle type="source" position={Position.Right} className="w-5 h-5 bg-orange-500" />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-orange-100 text-orange-400 hover:text-orange-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onEdit) data.onEdit();
                    }}
                    title="Edit SLA"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-orange-400 hover:text-red-600 transition-colors"
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
                <Timer className="w-4 h-4 text-orange-600" />
                <div className="font-semibold text-sm text-orange-900">SLA Monitor</div>
            </div>

            <div className="text-center py-1 rounded bg-white border border-orange-100 mt-1">
                <span className="font-mono text-sm font-medium text-orange-700">
                    {data.slaDueHours ? `${data.slaDueHours}h limit` : 'Not configured'}
                </span>
            </div>
        </div>
    );
};

export default memo(SlaNode);
