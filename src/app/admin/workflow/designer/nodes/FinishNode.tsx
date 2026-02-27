import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Square } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface FinishNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

/**
 * FinishNode - Simple classic workflow termination point
 */
const FinishNode = ({ data, selected }: FinishNodeProps) => {
    return (
        <div
            className={`flex items-center justify-center w-16 h-16 rounded-full bg-slate-600 shadow-lg transition-all duration-200 ${selected ? 'ring-4 ring-slate-300 scale-110' : 'hover:scale-105'
                }`}
            style={{ boxShadow: '0 4px 12px rgba(71, 85, 105, 0.4)' }}
        >
            <Square className="w-5 h-5 text-white" fill="white" />

            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-4 h-4 bg-white border-2 border-slate-600"
                style={{ left: -8 }}
            />
        </div>
    );
};

export default memo(FinishNode);
