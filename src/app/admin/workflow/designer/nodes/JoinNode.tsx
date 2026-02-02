import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Merge, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface JoinNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

/**
 * JoinNode - Synchronization gateway - waits for all branches
 * Backend: JOIN type, JoinNodeHandler
 */
const JoinNode = ({ data, selected, id }: JoinNodeProps) => {
    const joinMode = data.joinMode || 'ALL';

    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[180px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-pink-500 ring-4 ring-pink-100 shadow-lg' : 'border-gray-200 hover:border-pink-400 hover:shadow-md'
                }`}
        >
            {/* Multiple Input Handles */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-around" style={{ left: -12 }}>
                <Handle type="target" position={Position.Left} className="w-3 h-3 bg-pink-500 border-2 border-white" id="branch_1" />
                <Handle type="target" position={Position.Left} className="w-3 h-3 bg-pink-500 border-2 border-white" id="branch_2" />
                <Handle type="target" position={Position.Left} className="w-3 h-3 bg-pink-500 border-2 border-white" id="branch_3" />
            </div>

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-pink-600 transition-colors"
                    onClick={(e) => { e.stopPropagation(); data.onEdit?.(); }}
                    title="Edit"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}
                    title="Delete"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-pink-100 rounded-lg">
                    <Merge className="w-4 h-4 text-pink-600" />
                </div>
                <div>
                    <div className="font-bold text-sm text-gray-900">{data.label || 'Join'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Sync Gateway</div>
                </div>
            </div>

            <div className="text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded text-center">
                Mode: {joinMode}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-4 h-4 bg-pink-500 border-2 border-white"
                style={{ right: -10 }}
            />
        </div>
    );
};

export default memo(JoinNode);
