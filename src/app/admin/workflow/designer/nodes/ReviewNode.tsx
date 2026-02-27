import React, { memo, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { Eye, Edit, Trash2, User, Users, Shield, AlertTriangle } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface ReviewNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

/**
 * ReviewNode - Review task without strict approve/reject decision
 * Backend: REVIEW type, ReviewNodeHandler
 */
const ReviewNode = ({ data, selected, id }: ReviewNodeProps) => {
    const updateNodeInternals = useUpdateNodeInternals();

    // Count assigned entities
    const assigneeCount = data.assignmentEntities?.length || data.assignments?.length || 0;
    const userCount = data.assignmentEntities?.filter((a: any) => a.assigneeType === 'USER').length || 0;
    const groupCount = data.assignmentEntities?.filter((a: any) => a.assigneeType === 'GROUP').length || 0;
    const roleCount = data.assignmentEntities?.filter((a: any) => a.assigneeType === 'ROLE').length || 0;

    // Check for validation issues
    const hasWarning = assigneeCount === 0;
    const warningMessage = 'No assignees configured';

    // Update React Flow handle positions when node content changes height
    useEffect(() => {
        updateNodeInternals(id);
    }, [id, updateNodeInternals, assigneeCount, data.timeoutEnabled, data.useTimeoutExit, data.description]);

    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[220px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-indigo-500 ring-4 ring-indigo-100 shadow-lg' : 'border-gray-200 hover:border-indigo-400 hover:shadow-md'
                } ${hasWarning ? 'border-amber-400' : ''}`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-4 h-4 bg-indigo-500 border-2 border-white"
                style={{ left: -10 }}
            />

            {/* Warning Icon */}
            {hasWarning && (
                <div
                    className="absolute top-2 left-8 z-10"
                    title={warningMessage}
                >
                    <div className="p-1 bg-amber-100 rounded-full animate-pulse">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                </div>
            )}

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
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
                <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
                    <Eye className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-sm text-gray-900 truncate">{data.label || 'Review'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Review Task</div>
                </div>
            </div>

            {data.description && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md mb-2 line-clamp-2">{data.description}</div>
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
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        ✓
                    </span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="completed"
                        className="!relative !transform-none w-5 h-5 bg-indigo-500 border-[3px] border-blue-300 ring-2 ring-blue-100 hover:scale-125 transition-transform"
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
                            className="!relative !transform-none w-5 h-5 bg-orange-500 border-[3px] border-blue-300 ring-2 ring-blue-100 hover:scale-125 transition-transform"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(ReviewNode);
