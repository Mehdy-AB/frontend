import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Stamp } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface StampNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const StampNode = ({ data, selected }: StampNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[200px] bg-indigo-50 relative shadow-sm transition-all duration-200 ${selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-indigo-200 hover:border-indigo-300'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-5 h-5 bg-indigo-500" />
            <Handle type="source" position={Position.Right} className="w-5 h-5 bg-indigo-500" />

            <div className="flex items-center gap-2 mb-1">
                <Stamp className="w-4 h-4 text-indigo-600" />
                <div className="font-semibold text-sm text-indigo-900">Apply Stamp</div>
            </div>

            <div className="text-xs text-indigo-700 bg-white/50 p-1.5 rounded">
                {data.stampName || 'Select a stamp...'}
            </div>
        </div>
    );
};

export default memo(StampNode);
