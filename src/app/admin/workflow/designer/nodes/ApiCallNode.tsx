import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface ApiCallNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const ApiCallNode = ({ data, selected }: ApiCallNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[200px] bg-cyan-50 relative shadow-sm transition-all duration-200 group ${selected ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-cyan-200 hover:border-cyan-300'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-5 h-5 bg-cyan-500" />
            <Handle type="source" position={Position.Right} className="w-5 h-5 bg-cyan-500" />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-cyan-100 text-cyan-400 hover:text-cyan-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onEdit) data.onEdit();
                    }}
                    title="Edit API Call"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-cyan-400 hover:text-red-600 transition-colors"
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
                <Globe className="w-4 h-4 text-cyan-600" />
                <div className="font-semibold text-sm text-cyan-900">API Call</div>
            </div>

            <div className="text-xs text-cyan-700 bg-white border border-cyan-100 rounded px-2 py-1 mt-1 font-mono truncate">
                {data.apiMethod || 'GET'} {data.apiUrl ? new URL(data.apiUrl).pathname : '/...'}
            </div>
        </div>
    );
};

export default memo(ApiCallNode);
