import React from 'react';
import {
    GitBranch,
    Users,
    Clock,
    CheckCircle,
    Circle,
    AlertCircle,
    Calendar,
    User as UserIcon,
    Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowInstanceResponse } from '@/types/api';
import { formatDate } from '@/lib/dateFormatter';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/main/UserAvatar';
import { WorkflowInstanceActions } from './WorkflowInstanceActions';

interface WorkflowInstanceStepsTabProps {
    instance: WorkflowInstanceResponse;
    onReassign: (stepInstanceId: number) => void;
    onActionComplete: () => void;
}

export default function WorkflowInstanceStepsTab({
    instance,
    onReassign,
    onActionComplete
}: WorkflowInstanceStepsTabProps) {

    if (!instance.nodeInstances || instance.nodeInstances.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No steps found</p>
                <p className="text-sm mt-1">This workflow instance has no steps recorded.</p>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-600 border-green-200';
            case 'ACTIVE': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'SKIPPED': return 'bg-gray-100 text-gray-500 border-gray-200';
            case 'PENDING': return 'bg-yellow-50 text-yellow-600 border-yellow-100'; // Lighter for pending
            default: return 'bg-gray-50 text-gray-400 border-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle className="h-6 w-6" />;
            case 'ACTIVE': return <Clock className="h-6 w-6 animate-pulse" />;
            case 'SKIPPED': return <AlertCircle className="h-6 w-6" />;
            default: return <Circle className="h-6 w-6" />;
        }
    };

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <GitBranch className="h-5 w-5 text-primary" />
                    Workflow Progress
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <div className="relative space-y-0 pb-8">
                    {/* Vertical Line */}
                    <div className="absolute left-8 top-4 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent" />

                    {instance.nodeInstances.map((stepInstance, index) => {
                        const isCompleted = stepInstance.status === 'COMPLETED';
                        const isActive = stepInstance.status === 'ACTIVE';
                        const isPending = stepInstance.status === 'PENDING';

                        return (
                            <div key={stepInstance.id} className={`relative flex gap-6 group mb-8 last:mb-0 ${isPending ? 'opacity-70' : ''}`}>
                                {/* Step Status Bubble */}
                                <div className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border-4 border-white transition-all duration-300 ${getStatusColor(stepInstance.status)}`}>
                                    {getStatusIcon(stepInstance.status)}
                                </div>

                                {/* Content Card */}
                                <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs font-normal bg-gray-50">
                                                    Node {stepInstance.nodeId}
                                                </Badge>
                                                <h4 className="text-lg font-bold text-gray-900">
                                                    {stepInstance.nodeName || 'Unknown Node'}
                                                </h4>
                                            </div>
                                        </div>
                                        <Badge className={`${getStatusColor(stepInstance.status)} border-none`}>
                                            {stepInstance.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Assignments Section */}
                                        <div className="space-y-3">
                                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                                <Users className="h-3 w-3" /> Assigned To
                                            </h5>
                                            <div className="flex flex-wrap gap-2">
                                                {stepInstance.assignments && stepInstance.assignments.length > 0 ? (
                                                    stepInstance.assignments.map((assignment) => (
                                                        <div key={assignment.id} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                                            {assignment.assigneeType === 'USER' && assignment.user && (
                                                                <>
                                                                    <UserAvatar user={assignment.user} size="sm" />
                                                                    <span className="text-sm font-medium text-gray-700">
                                                                        {assignment.user.displayName || assignment.user.username}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {assignment.assigneeType === 'GROUP' && assignment.group && (
                                                                <>
                                                                    <Users className="h-3 w-3 text-gray-500" />
                                                                    <span className="text-sm font-medium text-gray-700">
                                                                        {assignment.group.name} (Group)
                                                                    </span>
                                                                </>
                                                            )}
                                                            {assignment.assigneeType === 'ROLE' && assignment.role && (
                                                                <>
                                                                    <Shield className="h-3 w-3 text-gray-500" />
                                                                    <span className="text-sm font-medium text-gray-700">
                                                                        {assignment.role.name} (Role)
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">No active assignments</span>
                                                )}
                                            </div>

                                            {isActive && instance.status === 'ACTIVE' && (
                                                <div className="mt-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs h-8"
                                                        onClick={() => onReassign(stepInstance.id)}
                                                    >
                                                        <Users className="h-3 w-3 mr-1.5" />
                                                        Reassign
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Timing & Actions Section */}
                                        <div className="space-y-3">
                                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> Timing & Actions
                                            </h5>
                                            <div className="space-y-2 text-sm text-gray-600">
                                                {stepInstance.completedAt ? (
                                                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg w-fit">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>Completed on <span className="font-medium">{formatDate(stepInstance.completedAt)}</span></span>
                                                    </div>
                                                ) : stepInstance.dueDate ? (
                                                    <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg w-fit">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>Due by <span className="font-medium">{formatDate(stepInstance.dueDate)}</span></span>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400 italic">No due date set</div>
                                                )}
                                            </div>

                                            {/* Actions Dropdown */}
                                            <div className="flex justify-end mt-4">
                                                <WorkflowInstanceActions
                                                    instanceId={instance.id}
                                                    stepInstanceId={stepInstance.id}
                                                    nodeId={stepInstance.nodeId}
                                                    stepName={stepInstance.nodeName || 'Unknown Node'}
                                                    status={stepInstance.status}
                                                    onActionComplete={onActionComplete}
                                                    isCompletedStep={isCompleted}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* End Node */}
                    {instance.status === 'COMPLETED' && (
                        <div className="relative flex gap-6 group">
                            <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center bg-green-100 border-4 border-white shadow-sm">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="flex items-center">
                                <span className="text-sm font-medium text-green-600 uppercase tracking-wider bg-green-50 px-3 py-1 rounded-full">
                                    Workflow Completed
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent >
        </Card >
    );
}
