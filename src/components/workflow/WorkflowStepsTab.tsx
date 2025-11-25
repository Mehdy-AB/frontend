import React from 'react';
import {
    GitBranch,
    Users,
    Clock,
    Shield,
    CheckCircle,
    FolderInput,
    AlertCircle,
    ArrowRight,
    MousePointerClick
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowDetailResponse, WorkflowStepResponse } from '@/types/api';
import { Separator } from '@/components/ui/separator';

interface WorkflowStepsTabProps {
    workflow: WorkflowDetailResponse;
}

export default function WorkflowStepsTab({ workflow }: WorkflowStepsTabProps) {
    if (!workflow.steps || workflow.steps.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No steps defined</p>
                <p className="text-sm mt-1">This workflow has no steps configured yet.</p>
            </div>
        );
    }

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
            case 'LOW': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        }
    };

    const getPriorityBadge = (priority?: string) => {
        switch (priority) {
            case 'HIGH': return 'bg-red-100 text-red-700 hover:bg-red-100/80';
            case 'LOW': return 'bg-blue-100 text-blue-700 hover:bg-blue-100/80';
            default: return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80';
        }
    };

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <GitBranch className="h-5 w-5 text-primary" />
                    Workflow Steps Timeline
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <div className="relative space-y-0 pb-8">
                    {/* Vertical Line */}
                    <div className="absolute left-8 top-4 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent" />

                    {workflow.steps.map((step, index) => (
                        <div key={step.id} className="relative flex gap-6 group mb-8 last:mb-0">
                            {/* Step Number Bubble */}
                            <div className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm border-4 border-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${step.priority === 'HIGH' ? 'bg-red-100 text-red-600' :
                                    step.priority === 'LOW' ? 'bg-blue-100 text-blue-600' :
                                        'bg-yellow-100 text-yellow-600'
                                }`}>
                                {step.stepOrder}
                            </div>

                            {/* Content Card */}
                            <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            {step.name}
                                            {step.isRequired && (
                                                <Badge variant="outline" className="ml-2 text-xs font-normal">Required</Badge>
                                            )}
                                        </h4>
                                        {step.description && (
                                            <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                                        )}
                                    </div>
                                    {step.priority && (
                                        <Badge className={`${getPriorityBadge(step.priority)} border-none`}>
                                            {step.priority} Priority
                                        </Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Assignments Section */}
                                    <div className="space-y-3">
                                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <Users className="h-3 w-3" /> Assignments
                                        </h5>
                                        <div className="flex flex-wrap gap-2">
                                            {step.assignments && step.assignments.length > 0 ? (
                                                step.assignments.map((assignment, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                                        {assignment.assigneeType === 'USER' ?
                                                            <Users className="w-3 h-3 text-blue-500" /> :
                                                            <Shield className="w-3 h-3 text-purple-500" />
                                                        }
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {assignment.user?.displayName || assignment.user?.username ||
                                                                assignment.role?.name || assignment.group?.name || 'Unknown'}
                                                        </span>
                                                        {assignment.canEdit && (
                                                            <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-gray-200">Edit</Badge>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">No assignments configured</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Configuration Section */}
                                    <div className="space-y-3">
                                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <SettingsIcon className="h-3 w-3" /> Configuration
                                        </h5>
                                        <div className="space-y-2">
                                            {step.expirationDays ? (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Clock className="w-4 h-4 text-orange-500" />
                                                    <span>Expires in <span className="font-medium">{step.expirationDays} days</span></span>
                                                </div>
                                            ) : null}

                                            {step.minApprovalsNeeded && step.minApprovalsNeeded > 1 && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span>Requires <span className="font-medium">{step.minApprovalsNeeded} approvals</span></span>
                                                </div>
                                            )}

                                            {step.allowParallelApproval && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Users className="w-4 h-4 text-blue-500" />
                                                    <span>Parallel approval allowed</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Section */}
                                {(step.onCompleteAction !== 'NONE' || step.targetFolderId) && (
                                    <>
                                        <Separator className="my-4" />
                                        <div className="space-y-3">
                                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                                <MousePointerClick className="h-3 w-3" /> On Completion
                                            </h5>
                                            <div className="flex flex-wrap gap-4">
                                                {step.onCompleteAction === 'MOVE_TO_FOLDER' && (
                                                    <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
                                                        <FolderInput className="w-4 h-4" />
                                                        <span>Moves document to <span className="font-semibold">{step.targetFolderName || 'Target Folder'}</span></span>
                                                    </div>
                                                )}
                                                {step.onCompleteAction === 'NOTIFY_USERS' && (
                                                    <div className="flex items-center gap-2 text-sm bg-purple-50 text-purple-700 px-3 py-2 rounded-lg">
                                                        <AlertCircle className="w-4 h-4" />
                                                        <span>Notifies users</span>
                                                    </div>
                                                )}
                                                {step.onCompleteAction === 'COMPLETE_WORKFLOW' && (
                                                    <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>Completes the workflow</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* End Node */}
                    <div className="relative flex gap-6 group">
                        <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center bg-gray-100 border-4 border-white shadow-sm">
                            <CheckCircle className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">End of Workflow</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function SettingsIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
