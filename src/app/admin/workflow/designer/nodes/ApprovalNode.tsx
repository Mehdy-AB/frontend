import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle, Edit, Trash2, XCircle, Clock, Users } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface ApprovalNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

/**
 * ApprovalNode - Multi-user approval with configurable policies
 * Backend: APPROVAL type, ApprovalNodeHandler
 * Alias: workflowStep (WorkflowStepNode)
 */
const ApprovalNode = ({ data, selected, id }: ApprovalNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[260px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-blue-500 ring-4 ring-blue-100 shadow-lg' : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-4 h-4 bg-blue-500 border-2 border-white transition-transform hover:scale-125"
                style={{ left: -10 }}
            />

            {/* Priority Indicator */}
            {data.priority && (
                <div
                    className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl opacity-80 ${data.priority === 'HIGH' ? 'bg-red-500' :
                            data.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                />
            )}

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
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
            <div className="mb-2 pr-10">
                <div className="font-bold text-sm text-gray-900 leading-tight">{data.label || 'Approval'}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-0.5">Approval</div>
            </div>

            {/* Description */}
            {data.description && (
                <div className="text-xs text-gray-500 line-clamp-2 mb-3 bg-gray-50 p-2 rounded-md border border-gray-100 italic">
                    "{data.description}"
                </div>
            )}

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2 mt-auto">
                {data.expirationDays && data.expirationDays > 0 && (
                    <div className="text-[10px] font-medium text-orange-700 bg-orange-50 border border-orange-100 px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {data.expirationDays}d limit
                    </div>
                )}
                {data.minApprovalsNeeded && data.minApprovalsNeeded > 1 && (
                    <div className="text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded-full flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {data.minApprovalsNeeded} needed
                    </div>
                )}
            </div>

            {/* Output Handles - Approved (Top) and Rejected (Bottom) */}
            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center items-end pr-0" style={{ right: -12 }}>
                {/* Approved Handle */}
                <div className="flex items-center gap-1 mb-4">
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        Approved
                    </span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        className="w-4 h-4 bg-green-500 border-2 border-white"
                        id="approved"
                    />
                </div>
                {/* Rejected Handle */}
                <div className="flex items-center gap-1 mt-4">
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        Rejected
                    </span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        className="w-4 h-4 bg-red-500 border-2 border-white"
                        id="rejected"
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(ApprovalNode);
