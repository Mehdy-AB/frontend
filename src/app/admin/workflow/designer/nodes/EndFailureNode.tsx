import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { XCircle } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface EndFailureNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const EndFailureNode = ({ data, selected }: EndFailureNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[140px] bg-gradient-to-br from-red-100 to-rose-100 relative shadow-sm transition-all duration-200 ${selected ? 'border-red-600 ring-2 ring-red-200' : 'border-red-400 hover:border-red-500'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-5 h-5 bg-red-600" />

            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                    <div className="font-semibold text-sm text-red-900">End</div>
                    <div className="text-xs text-red-600">Failure</div>
                </div>
            </div>

            {data.endMessage && (
                <div className="mt-2 text-xs text-red-700 bg-white/50 p-1.5 rounded">
                    {data.endMessage}
                </div>
            )}
        </div>
    );
};

export default memo(EndFailureNode);
