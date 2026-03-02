import React, { memo, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { CheckCircle, Edit, Trash2, Clock, Users, User, Shield, UserCheck, AlertTriangle, Building2, Crown, UserCog } from 'lucide-react';
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
    const updateNodeInternals = useUpdateNodeInternals();

    // Count assigned entities
    const assigneeCount = data.assignmentEntities?.length || data.assignments?.length || 0;
    const userCount = data.assignmentEntities?.filter((a: any) => a.assigneeType === 'USER').length || 0;
    const groupCount = data.assignmentEntities?.filter((a: any) => a.assigneeType === 'GROUP').length || 0;
    const roleCount = data.assignmentEntities?.filter((a: any) => a.assigneeType === 'ROLE').length || 0;
    const orgUnitCount = data.assignmentEntities?.filter((a: any) => a.assigneeType === 'ORG_UNIT').length || 0;
    const orgUnitHeadCount = data.assignmentEntities?.filter((a: any) => a.assigneeType === 'ORG_UNIT_HEAD').length || 0;
    const creatorResponsibleCount = data.assignmentEntities?.filter((a: any) => a.assigneeType === 'CREATOR_RESPONSIBLE').length || 0;

    // Check for validation issues
    const hasWarning = assigneeCount === 0 || (data.validationErrors && data.validationErrors.length > 0);
    const warningMessage = assigneeCount === 0
        ? 'No assignees configured'
        : data.validationErrors?.[0]?.message || 'Configuration issue';

    // Update React Flow handle positions when node content changes height
    useEffect(() => {
        updateNodeInternals(id);
    }, [id, updateNodeInternals, assigneeCount, data.timeoutEnabled, data.useTimeoutExit, data.description, data.expirationDays, data.minApprovalsNeeded]);

    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[240px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-blue-500 ring-4 ring-blue-100 shadow-lg' : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
                } ${hasWarning ? 'border-amber-400' : ''}`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-6 h-6 bg-blue-500 border-[3px] border-blue-300 ring-3 ring-blue-300 hover:scale-125 transition-transform"
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

            {/* Header with Icon */}
            <div className="flex items-center gap-2 mb-2 pr-10">
                <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-sm text-gray-900 leading-tight truncate">{data.label || 'Approval'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Approval</div>
                </div>
            </div>

            {/* Description */}
            {data.description && (
                <div className="text-xs text-gray-500 line-clamp-2 mb-2 bg-gray-50 p-2 rounded-md border border-gray-100 italic">
                    &quot;{data.description}&quot;
                </div>
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
                    {orgUnitCount > 0 && (
                        <div className="text-[10px] font-medium text-orange-700 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            {orgUnitCount}
                        </div>
                    )}
                    {orgUnitHeadCount > 0 && (
                        <div className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5" />
                            {orgUnitHeadCount}
                        </div>
                    )}
                    {creatorResponsibleCount > 0 && (
                        <div className="text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <UserCog className="w-2.5 h-2.5" />
                            1
                        </div>
                    )}
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
                        <CheckCircle className="w-3 h-3" />
                        {data.minApprovalsNeeded} needed
                    </div>
                )}
            </div>

            {/* Output Labels & Handles */}
            <div className="flex flex-col gap-2 absolute right-0 top-1/2 -translate-y-1/2" style={{ right: -8 }}>
                {/* Approved */}
                <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        ✓
                    </span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="approved"
                        className="!relative !transform-none w-6 h-6 bg-green-500 border-[3px] border-blue-300 ring-3 ring-blue-300 hover:scale-125 transition-transform"
                    />
                </div>
                {/* Rejected */}
                <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        ✗
                    </span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="rejected"
                        className="!relative !transform-none w-6 h-6 bg-red-500 border-[3px] border-blue-300 ring-3 ring-blue-300 hover:scale-125 transition-transform"
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
                            className="!relative !transform-none w-6 h-6 bg-orange-500 border-[3px] border-blue-300 ring-3 ring-blue-300 hover:scale-125 transition-transform"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(ApprovalNode);
