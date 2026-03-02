import React, { memo, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { List, Edit, Trash2, Clock, Users, User, Shield, AlertTriangle, Building2, Crown, UserCog } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface MultiChoiceNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

// Color palette for choices
const CHOICE_COLORS = [
    { bg: 'bg-blue-500', text: 'text-blue-600', label: 'bg-blue-50', border: 'border-blue-200' },
    { bg: 'bg-green-500', text: 'text-green-600', label: 'bg-green-50', border: 'border-green-200' },
    { bg: 'bg-amber-500', text: 'text-amber-600', label: 'bg-amber-50', border: 'border-amber-200' },
    { bg: 'bg-purple-500', text: 'text-purple-600', label: 'bg-purple-50', border: 'border-purple-200' },
    { bg: 'bg-pink-500', text: 'text-pink-600', label: 'bg-pink-50', border: 'border-pink-200' },
    { bg: 'bg-cyan-500', text: 'text-cyan-600', label: 'bg-cyan-50', border: 'border-cyan-200' },
    { bg: 'bg-orange-500', text: 'text-orange-600', label: 'bg-orange-50', border: 'border-orange-200' },
    { bg: 'bg-indigo-500', text: 'text-indigo-600', label: 'bg-indigo-50', border: 'border-indigo-200' },
    { bg: 'bg-rose-500', text: 'text-rose-600', label: 'bg-rose-50', border: 'border-rose-200' },
    { bg: 'bg-teal-500', text: 'text-teal-600', label: 'bg-teal-50', border: 'border-teal-200' },
];

/**
 * MultiChoiceNode - Multi-choice decision with dynamic exit paths
 * Backend: MULTI_CHOICE type, MultiChoiceNodeHandler
 */
const MultiChoiceNode = ({ data, selected, id }: MultiChoiceNodeProps) => {
    const updateNodeInternals = useUpdateNodeInternals();

    // Get configured choices (default + custom)
    const choices: { id: number; label: string }[] = data.choices || [
        { id: 1, label: 'Continue' }
    ];

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
    }, [id, updateNodeInternals, choices.length, assigneeCount, data.timeoutEnabled, data.useTimeoutExit, data.description]);

    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[260px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-teal-500 ring-4 ring-teal-100 shadow-lg' : 'border-gray-200 hover:border-teal-400 hover:shadow-md'
                } ${hasWarning ? 'border-amber-400' : ''}`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-6 h-6 bg-teal-500 border-[3px] border-blue-300 ring-3 ring-blue-300 hover:scale-125 transition-transform"
                style={{ left: -10 }}
            />

            {/* Priority Indicator */}
            {data.priority && (
                <div
                    className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl opacity-80 ${data.priority === 'HIGH' ? 'bg-red-500' :
                        data.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-teal-500'
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
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition-colors"
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
                <div className="p-2 bg-teal-100 rounded-lg shrink-0">
                    <List className="w-4 h-4 text-teal-600" />
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-sm text-gray-900 leading-tight truncate">{data.label || 'Multi-Choice'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Choice</div>
                </div>
            </div>

            {/* Description */}
            {data.description && (
                <div className="text-xs text-gray-500 line-clamp-2 mb-2 bg-gray-50 p-2 rounded-md border border-gray-100 italic">
                    "{data.description}"
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
            <div className="flex flex-wrap gap-2 mt-auto mb-2">
                {data.timeoutEnabled && (
                    <div className="text-[10px] font-medium text-orange-700 bg-orange-50 border border-orange-100 px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {data.timeoutValue}{data.timeoutUnit === 'DAYS' ? 'd' : 'h'} limit
                    </div>
                )}
                <div className="text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-100 px-2 py-1 rounded-full">
                    {choices.length} choice{choices.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Output Labels & Handles - Dynamic per choice */}
            <div className="flex flex-col gap-2 absolute right-0 top-1/2 -translate-y-1/2" style={{ right: -8 }}>
                {choices.map((choice, index) => {
                    const color = CHOICE_COLORS[index % CHOICE_COLORS.length];
                    return (
                        <div key={choice.id} className="flex items-center gap-1">
                            <span className={`text-[9px] font-bold ${color.text} ${color.label} px-1.5 py-0.5 rounded max-w-[60px] truncate`}>
                                {choice.label}
                            </span>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={`choice_${choice.id}`}
                                className={`!relative !transform-none w-6 h-6 ${color.bg} border-[3px] border-blue-300 ring-3 ring-blue-300 hover:scale-125 transition-transform`}
                            />
                        </div>
                    );
                })}
                {/* Timeout handle - Only when enabled */}
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

export default memo(MultiChoiceNode);
