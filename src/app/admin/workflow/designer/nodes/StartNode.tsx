import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface StartNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

/**
 * StartNode - Simple classic workflow entry point
 */
const StartNode = ({ data, selected }: StartNodeProps) => {
    return (
        <div
            className={`flex items-center justify-center w-16 h-16 rounded-full bg-green-500 shadow-lg transition-all duration-200 ${selected ? 'ring-4 ring-green-200 scale-110' : 'hover:scale-105'
                }`}
            style={{ boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)' }}
        >
            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-4 h-4 bg-white border-2 border-green-500"
                style={{ right: -8 }}
            />
        </div>
    );
};

export default memo(StartNode);
