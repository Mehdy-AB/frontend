import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface DelayNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const DelayNode = ({ data, selected }: DelayNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[180px] bg-slate-50 relative shadow-sm transition-all duration-200 group ${selected ? 'border-slate-500 ring-2 ring-slate-200' : 'border-slate-200 hover:border-slate-300'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-5 h-5 bg-slate-500" />
            <Handle type="source" position={Position.Right} className="w-5 h-5 bg-slate-500" />

            {/* Action Icons - Top Right (Visible on Hover/Selected) */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onEdit) data.onEdit();
                    }}
                    title="Edit Delay"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
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
                <Clock className="w-4 h-4 text-slate-600" />
                <div className="font-semibold text-sm text-slate-900">Delay</div>
            </div>

            <div className="text-center py-1 rounded bg-white border border-slate-100 mt-1">
                <span className="font-mono text-sm font-medium text-slate-700">
                    {data.delayDuration || '0h 0m'}
                </span>
            </div>
        </div>
    );
};

export default memo(DelayNode);
