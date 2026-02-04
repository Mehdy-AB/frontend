import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ClipboardCheck, Edit, Trash2, User, Users, Shield } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface ManualTaskNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

/**
 * ManualTaskNode - Generic human confirmation task
 * Backend: MANUAL_TASK type, ManualTaskNodeHandler
 */
const ManualTaskNode = ({ data, selected, id }: ManualTaskNodeProps) => {
    // Count assigned entities
    const assigneeCount = data.assignmentEntities?.length || data.assignments?.length || 0;
    const userCount = data.assignmentEntities?.filter((a: any) => a.assigneeType === 'USER').length || 0;
    const groupCount = data.assignmentEntities?.filter((a: any) => a.assigneeType === 'GROUP').length || 0;
    const roleCount = data.assignmentEntities?.filter((a: any) => a.assigneeType === 'ROLE').length || 0;

    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[220px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-violet-500 ring-4 ring-violet-100 shadow-lg' : 'border-gray-200 hover:border-violet-400 hover:shadow-md'
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-4 h-4 bg-violet-500 border-2 border-white"
                style={{ left: -10 }}
            />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-violet-600 transition-colors"
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
            <div className="flex items-center gap-2 mb-2 pr-10">
                <div className="p-2 bg-violet-100 rounded-lg shrink-0">
                    <ClipboardCheck className="w-4 h-4 text-violet-600" />
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-sm text-gray-900 truncate">{data.label || 'Manual Task'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Human Task</div>
                </div>
            </div>

            {data.instructions && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md mb-2 line-clamp-2">{data.instructions}</div>
            )}

            {/* Assignees Summary */}
            {assigneeCount > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {userCount > 0 && (
                        <div className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <User className="w-2.5 h-2.5" />
                            {userCount}
                        </div>
                    )}
                    {groupCount > 0 && (
                        <div className="text-[10px] font-medium text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            {groupCount}
                        </div>
                    )}
                    {roleCount > 0 && (
                        <div className="text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" />
                            {roleCount}
                        </div>
                    )}
                </div>
            )}

            {/* Output Labels & Handles */}
            <div className="flex flex-col gap-2 absolute right-0 top-1/2 -translate-y-1/2" style={{ right: -8 }}>
                {/* Completed */}
                <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                        ✓
                    </span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="completed"
                        className="!relative !transform-none w-4 h-4 bg-violet-500 border-2 border-white"
                    />
                </div>
                {/* Timeout - Only when enabled */}
                {data.timeoutEnabled && data.useTimeoutExit && (
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                            ⏱
                        </span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="timeout"
                            className="!relative !transform-none w-4 h-4 bg-orange-500 border-2 border-white"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(ManualTaskNode);
