import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Variable, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface SetVariableNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const SetVariableNode = ({ data, selected }: SetVariableNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[180px] bg-teal-50 relative shadow-sm transition-all duration-200 group ${selected ? 'border-teal-500 ring-2 ring-teal-200' : 'border-teal-200 hover:border-teal-300'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-5 h-5 bg-teal-500" />
            <Handle type="source" position={Position.Right} className="w-5 h-5 bg-teal-500" />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-teal-100 text-teal-400 hover:text-teal-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onEdit) data.onEdit();
                    }}
                    title="Edit Variable"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-teal-400 hover:text-red-600 transition-colors"
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
                <Variable className="w-4 h-4 text-teal-600" />
                <div className="font-semibold text-sm text-teal-900">Set Variable</div>
            </div>

            <div className="text-xs text-teal-700 bg-white border border-teal-100 rounded px-2 py-1 mt-1 font-mono truncate">
                {data.variableName ? `${data.variableName} = ${data.variableValue || '...'}` : 'Not configured'}
            </div>
        </div>
    );
};

export default memo(SetVariableNode);
