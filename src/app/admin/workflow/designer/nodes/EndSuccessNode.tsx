import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface EndSuccessNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const EndSuccessNode = ({ data, selected }: EndSuccessNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[140px] bg-gradient-to-br from-green-100 to-emerald-100 relative shadow-sm transition-all duration-200 ${selected ? 'border-green-600 ring-2 ring-green-200' : 'border-green-400 hover:border-green-500'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-5 h-5 bg-green-600" />

            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                    <div className="font-semibold text-sm text-green-900">End</div>
                    <div className="text-xs text-green-600">Success</div>
                </div>
            </div>

            {data.endMessage && (
                <div className="mt-2 text-xs text-green-700 bg-white/50 p-1.5 rounded">
                    {data.endMessage}
                </div>
            )}
        </div>
    );
};

export default memo(EndSuccessNode);
