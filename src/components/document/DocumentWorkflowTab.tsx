'use client';

import React, { useEffect, useState } from 'react';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import {
  WorkflowInstanceResponse,
  WorkflowTimelineResponse,
  ReassignStepRequest
} from '@/types/workflow';
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline';
import { ReassignStepDialog } from '@/components/workflow/ReassignStepDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Play,
  CheckCircle2,
  Users,
  Clock,
  AlertCircle,
  ChevronDown,
  Calendar,
  FileText,
  UserCheck,
  Info,
  Zap,
  Lock,
  XCircle,
  Ban,
  ArrowRight,
  GitBranch,
  Timer,
  RotateCcw
} from 'lucide-react';
import StartWorkflowModal from '@/components/modals/StartWorkflowModal';
import { useNotifications } from '@/hooks/useNotifications';
import UserAvatar from '@/components/main/UserAvatar';
import { formatDate } from '@/lib/dateFormatter';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DocumentWorkflowTabProps {
  documentId: number;
  documentName: string;
  canEdit?: boolean;
  onRefreshDocument?: () => void;
}

// Status configuration
const STATUS_CONFIG: Record<string, {
  label: string;
  className: string;
  bgClass: string;
  icon: React.ReactNode;
}> = {
  ACTIVE: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    bgClass: 'from-blue-50 to-blue-100/30',
    icon: <Clock className="w-3.5 h-3.5" />
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bgClass: 'from-emerald-50 to-emerald-100/30',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    bgClass: 'from-gray-50 to-gray-100/30',
    icon: <Ban className="w-3.5 h-3.5" />
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-red-100 text-red-700 border-red-200',
    bgClass: 'from-red-50 to-red-100/30',
    icon: <XCircle className="w-3.5 h-3.5" />
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    bgClass: 'from-orange-50 to-orange-100/30',
    icon: <Timer className="w-3.5 h-3.5" />
  },
};

// Node type config
const getNodeTypeInfo = (nodeType?: string) => {
  const types: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    APPROVAL: { label: 'Approval', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: <UserCheck className="w-3 h-3" /> },
    REVIEW: { label: 'Review', className: 'bg-purple-50 text-purple-700 border-purple-200', icon: <FileText className="w-3 h-3" /> },
    MANUAL_TASK: { label: 'Task', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: <FileText className="w-3 h-3" /> },
    START: { label: 'Start', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <Zap className="w-3 h-3" /> },
    END: { label: 'End', className: 'bg-gray-50 text-gray-700 border-gray-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  };
  return types[nodeType || ''] || { label: nodeType || 'Unknown', className: 'bg-gray-50 text-gray-700', icon: <FileText className="w-3 h-3" /> };
};

// Duration helper
const getDuration = (start?: string, end?: string) => {
  if (!start) return null;
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diffMs = endDate.getTime() - startDate.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
  if (diffMins > 0) return `${diffMins}m`;
  return 'Just started';
};

export default function DocumentWorkflowTab({
  documentId,
  documentName,
  canEdit = false,
  onRefreshDocument,
}: DocumentWorkflowTabProps) {
  const [workflows, setWorkflows] = useState<WorkflowInstanceResponse[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [timeline, setTimeline] = useState<WorkflowTimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStartWorkflowModal, setShowStartWorkflowModal] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState<number | null>(null);
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    loadWorkflows();
  }, [documentId]);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const instances = await workflowAdminService.getAllWorkflowInstancesForDocument(documentId);
      setWorkflows(instances);

      if (instances.length > 0) {
        const activeWorkflow = instances.find(w => w.status === 'ACTIVE');
        const workflowToSelect = activeWorkflow || instances[0];
        setSelectedWorkflowId(workflowToSelect.id);
        setExpandedWorkflow(workflowToSelect.id);
        if (workflowToSelect.id) {
          await loadTimeline(workflowToSelect.id);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch workflows:', error);
      if (error?.response?.status !== 404) {
        showError('Failed to load workflows');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async (instanceId: number) => {
    try {
      const data = await workflowAdminService.getInstanceTimeline(instanceId);
      setTimeline(data);
    } catch (error: any) {
      console.error('Failed to fetch timeline:', error);
      showError('Failed to load workflow timeline');
    }
  };

  const handleWorkflowSelect = async (instanceId: number) => {
    setSelectedWorkflowId(instanceId);
    setExpandedWorkflow(prev => prev === instanceId ? null : instanceId);
    await loadTimeline(instanceId);
  };

  const handleReassign = async (userIds: string[], reason: string) => {
    if (!timeline || !selectedStepId) return;

    const currentStep = timeline.nodes.find((s) => s.id === selectedStepId);
    if (!currentStep) {
      showError('Step not found');
      return;
    }

    try {
      const request: ReassignStepRequest = {
        assignments: userIds.map(userId => ({
          assigneeType: 'USER',
          userId: userId
        })),
        reason
      };

      await workflowAdminService.reassignNode(timeline.instanceId, selectedStepId, request);
      showSuccess('Step reassigned successfully');
      setShowReassignDialog(false);
      setSelectedStepId(null);

      await loadTimeline(timeline.instanceId);
    } catch (error: any) {
      console.error('Failed to reassign:', error);
      showError('Failed to reassign step');
    }
  };

  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);
  const currentStep = timeline?.nodes.find((s) => s.status === 'ACTIVE' || s.status === 'SCHEDULED');
  const isTerminal = timeline?.status === 'COMPLETED' || timeline?.status === 'CANCELLED' || timeline?.status === 'FAILED';

  // Loading state
  if (loading && workflows.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading workflows...</p>
        </div>
      </div>
    );
  }

  // No workflows state
  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center mb-5 shadow-sm">
          <GitBranch className="w-9 h-9 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No Workflows</h3>
        <p className="text-sm text-gray-500 text-center mb-6 max-w-xs leading-relaxed">
          No workflows have been started for this document yet.
        </p>
        {canEdit ? (
          <Button
            onClick={() => setShowStartWorkflowModal(true)}
            size="default"
            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Play className="w-4 h-4" />
            Start Workflow
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-500 cursor-not-allowed">
                <Lock className="w-4 h-4" />
                Start Workflow
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>You need edit permission on this document to start a workflow</p>
            </TooltipContent>
          </Tooltip>
        )}
        <StartWorkflowModal
          isOpen={showStartWorkflowModal}
          onClose={() => setShowStartWorkflowModal(false)}
          documentId={documentId}
          documentName={documentName}
          onWorkflowStarted={loadWorkflows}
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 p-1">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Workflows
              <span className="ml-1.5 text-xs font-normal text-gray-400">({workflows.length})</span>
            </h3>
          </div>
          {canEdit ? (
            <Button
              onClick={() => setShowStartWorkflowModal(true)}
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Play className="w-3 h-3" />
              New Workflow
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed">
                  <Lock className="w-3 h-3" />
                  New Workflow
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit permission required</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Workflow List */}
        <div className="space-y-3">
          {workflows.map((workflow) => {
            const isSelected = selectedWorkflowId === workflow.id;
            const isExpanded = expandedWorkflow === workflow.id;
            const duration = getDuration(workflow.startedAt, workflow.completedAt);
            const statusConfig = STATUS_CONFIG[workflow.status] || STATUS_CONFIG.ACTIVE;

            return (
              <div key={workflow.id} className="rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm">
                {/* Workflow Card Header */}
                <div
                  onClick={() => handleWorkflowSelect(workflow.id)}
                  className={`relative p-3.5 cursor-pointer transition-all ${isSelected
                      ? `bg-gradient-to-r ${statusConfig.bgClass}`
                      : 'bg-white hover:bg-gray-50/80'
                    }`}
                >
                  {/* Status indicator stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusConfig.className.split(' ')[0]}`} />

                  <div className="flex items-center gap-3 pl-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {workflow.workflowName}
                        </h4>
                        <Badge variant="outline" className={`${statusConfig.className} text-[10px] px-1.5 py-0 gap-1`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(workflow.startedAt)}
                        </span>
                        {duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {duration}
                          </span>
                        )}
                        {workflow.progress > 0 && (
                          <span className="flex items-center gap-1 font-medium">
                            <ArrowRight className="w-3 h-3" />
                            {Math.round(workflow.progress)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                        }`}
                    />
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && isSelected && timeline && (
                  <div className="border-t border-gray-100">
                    {/* Current Step Highlight */}
                    {currentStep && (
                      <div className={`p-4 border-b border-gray-100 ${currentStep.isOverdue
                          ? 'bg-gradient-to-r from-red-50/50 to-white'
                          : 'bg-gradient-to-r from-blue-50/50 to-white'
                        }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${currentStep.isOverdue
                              ? 'bg-red-100 text-red-600'
                              : 'bg-blue-100 text-blue-600'
                            }`}>
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Step</span>
                              <Badge variant="outline" className={getNodeTypeInfo(currentStep.nodeType).className + ' text-[10px] px-1.5 py-0 gap-0.5'}>
                                {getNodeTypeInfo(currentStep.nodeType).icon}
                                <span className="ml-0.5">{getNodeTypeInfo(currentStep.nodeType).label}</span>
                              </Badge>
                              {currentStep.isOverdue && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 py-0">
                                  <AlertCircle className="w-3 h-3 mr-0.5" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold text-gray-900 text-sm">{currentStep.nodeName}</h4>

                            {/* Description */}
                            {currentStep.description && (
                              <div className="flex items-start gap-1.5 mt-2 p-2 bg-white/70 rounded-lg border border-blue-100">
                                <Info className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-600 leading-relaxed">{currentStep.description}</p>
                              </div>
                            )}

                            {/* Assignees */}
                            {currentStep.assignments && currentStep.assignments.length > 0 && (
                              <div className="mt-2.5">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <span className="text-[11px] text-gray-500">Assigned to:</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {currentStep.assignments.map((a) => (
                                    <Tooltip key={a.id}>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50 transition-colors">
                                          <UserAvatar
                                            user={a.user ? {
                                              id: a.user.id,
                                              username: a.user.username,
                                              email: a.user.email,
                                              firstName: a.user.firstName,
                                              lastName: a.user.lastName,
                                              displayName: a.user.displayName,
                                              imgUrl: a.user.imgUrl,
                                              imageUrl: a.user.imageUrl,
                                            } : null}
                                            size="xs"
                                          />
                                          <span className="text-[11px] text-gray-700">
                                            {a.assigneeName || a.user?.displayName || 'Unknown'}
                                          </span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="text-xs p-2">
                                        <div className="space-y-0.5">
                                          <div className="font-semibold">
                                            {a.assigneeName || a.user?.displayName || 'Unknown'}
                                          </div>
                                          {a.user?.email && (
                                            <div className="text-gray-400">{a.user.email}</div>
                                          )}
                                          {a.role && (
                                            <div className="text-purple-500">Role: {a.role.name}</div>
                                          )}
                                          {a.group && (
                                            <div className="text-green-500">Group: {a.group.name}</div>
                                          )}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                  {canEdit && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={() => {
                                        setSelectedStepId(currentStep.id);
                                        setShowReassignDialog(true);
                                      }}
                                    >
                                      <RotateCcw className="w-3 h-3 mr-0.5" />
                                      Reassign
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Duration & Due Date */}
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                              {currentStep.dueDate && (
                                <span className={`flex items-center gap-1 ${currentStep.isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                  <Calendar className="w-3 h-3" />
                                  Due: {formatDate(currentStep.dueDate)}
                                </span>
                              )}
                              {getDuration(currentStep.startedAt) && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {getDuration(currentStep.startedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-gray-500">
                          {timeline.completedNodes} of {timeline.totalNodes} steps completed
                        </span>
                        <span className="text-xs font-semibold text-gray-700">
                          {Math.round(timeline.progressPercentage)}%
                        </span>
                      </div>
                      <Progress value={timeline.progressPercentage} className="h-1.5" />
                    </div>

                    {/* Terminal status */}
                    {isTerminal && (
                      <div className={`p-5 ${timeline.status === 'COMPLETED'
                          ? 'bg-gradient-to-r from-emerald-50 to-white'
                          : timeline.status === 'CANCELLED'
                            ? 'bg-gradient-to-r from-gray-50 to-white'
                            : 'bg-gradient-to-r from-red-50 to-white'
                        }`}>
                        <div className="text-center space-y-2">
                          {timeline.status === 'COMPLETED' ? (
                            <>
                              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                              <h4 className="font-semibold text-gray-900">Workflow Completed</h4>
                              <p className="text-xs text-gray-500">
                                All steps completed successfully
                              </p>
                              {timeline.completedAt && (
                                <p className="text-[11px] text-gray-400">
                                  Finished on {formatDate(timeline.completedAt)}
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              {timeline.status === 'CANCELLED' ? (
                                <Ban className="w-10 h-10 text-gray-400 mx-auto" />
                              ) : (
                                <XCircle className="w-10 h-10 text-red-400 mx-auto" />
                              )}
                              <h4 className="font-semibold text-gray-900">
                                Workflow {timeline.status === 'CANCELLED' ? 'Cancelled' : 'Failed'}
                              </h4>

                              {timeline.terminatedAtNodeName && (
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                                  <span>At step:</span>
                                  <Badge variant="outline" className={getNodeTypeInfo(timeline.terminatedAtNodeType).className + ' text-[10px]'}>
                                    {getNodeTypeInfo(timeline.terminatedAtNodeType).icon}
                                    <span className="ml-1">{timeline.terminatedAtNodeName}</span>
                                  </Badge>
                                </div>
                              )}

                              {timeline.cancellationReason && (
                                <div className="mt-1 p-2 bg-white/80 rounded-lg border border-gray-200 max-w-sm mx-auto">
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Reason: </span>
                                    {timeline.cancellationReason}
                                  </p>
                                </div>
                              )}

                              {!timeline.cancellationReason && (
                                <p className="text-xs text-gray-500">
                                  No further actions can be taken
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Steps Timeline
                        </h5>
                      </div>
                      <WorkflowTimeline
                        workflowInstanceId={timeline.instanceId}
                        documentId={documentId}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reassign dialog */}
        <ReassignStepDialog
          isOpen={showReassignDialog}
          onClose={() => {
            setShowReassignDialog(false);
            setSelectedStepId(null);
          }}
          onReassign={handleReassign}
          currentAssignments={[]}
        />

        {/* Start workflow modal */}
        <StartWorkflowModal
          isOpen={showStartWorkflowModal}
          onClose={() => setShowStartWorkflowModal(false)}
          documentId={documentId}
          documentName={documentName}
          onWorkflowStarted={loadWorkflows}
        />
      </div>
    </TooltipProvider>
  );
}
