import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface ConditionalNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const ConditionalNode = ({ data, selected }: ConditionalNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[220px] bg-gradient-to-br from-purple-50 to-indigo-50 relative shadow-sm transition-all duration-200 group ${selected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-purple-200 hover:border-purple-300'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-4 h-4 bg-purple-500 border-2 border-white" />

            {/* Action Icons - Top Right (Visible on Hover/Selected) */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-purple-100 text-purple-400 hover:text-purple-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onEdit) data.onEdit();
                    }}
                    title="Edit Condition"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-purple-400 hover:text-red-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onDelete) data.onDelete();
                    }}
                    title="Delete"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex items-center gap-2 mb-3 pr-12">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <GitBranch className="w-4 h-4 text-white" />
                </div>
                <div>
                    <div className="font-semibold text-sm text-purple-900">Condition</div>
                    <div className="text-[10px] text-purple-500">Branch Logic</div>
                </div>
            </div>

            <div className="text-xs text-gray-600 bg-white p-2 rounded border border-purple-100 mb-3 font-mono min-h-[32px]">
                {data.conditionExpression || 'Click edit to set condition...'}
            </div>

            {/* Output Labels */}
            <div className="flex flex-col gap-2 absolute right-0 top-1/2 -translate-y-1/2" style={{ right: -8 }}>
                <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        True
                    </span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="true"
                        className="!relative !transform-none w-4 h-4 bg-green-500 border-2 border-white"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        False
                    </span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="false"
                        className="!relative !transform-none w-4 h-4 bg-red-500 border-2 border-white"
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(ConditionalNode);
