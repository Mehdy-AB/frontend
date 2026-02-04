'use client';

import React, { useEffect, useState } from 'react';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import {
  WorkflowInstanceResponse,
  WorkflowNodeInstanceResponse,
  WorkflowTimelineResponse,
  ReassignStepRequest
} from '@/types/workflow';
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline';
import { WorkflowHistory } from '@/components/workflow/WorkflowHistory';
import { ReassignStepDialog } from '@/components/workflow/ReassignStepDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Play,
  CheckCircle2,
  Users,
  Clock,
  AlertCircle,
  ChevronRight,
  Calendar,
  FileText,
  UserCheck,
  Info,
  Zap
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
  onRefreshDocument?: () => void;
}

// Get node type styling
const getNodeTypeInfo = (nodeType?: string) => {
  const types: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    APPROVAL: { label: 'Approval', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: <UserCheck className="w-3 h-3" /> },
    REVIEW: { label: 'Review', className: 'bg-purple-100 text-purple-700 border-purple-200', icon: <FileText className="w-3 h-3" /> },
    MANUAL_TASK: { label: 'Task', className: 'bg-amber-100 text-amber-700 border-amber-200', icon: <FileText className="w-3 h-3" /> },
    START: { label: 'Start', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Zap className="w-3 h-3" /> },
    END: { label: 'End', className: 'bg-gray-100 text-gray-700 border-gray-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  };
  return types[nodeType || ''] || { label: nodeType || 'Unknown', className: 'bg-gray-100 text-gray-700', icon: <FileText className="w-3 h-3" /> };
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
  onRefreshDocument,
}: DocumentWorkflowTabProps) {
  const [workflows, setWorkflows] = useState<WorkflowInstanceResponse[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [timeline, setTimeline] = useState<WorkflowTimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStartWorkflowModal, setShowStartWorkflowModal] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    fetchAllWorkflows();
  }, [documentId]);

  const fetchAllWorkflows = async () => {
    setLoading(true);
    try {
      const instances = await workflowAdminService.getAllWorkflowInstancesForDocument(documentId);
      setWorkflows(instances);

      if (instances.length > 0) {
        const activeWorkflow = instances.find(w => w.status === 'ACTIVE');
        const workflowToSelect = activeWorkflow || instances[0];
        setSelectedWorkflowId(workflowToSelect.id);
        if (workflowToSelect.id) {
          await fetchTimeline(workflowToSelect.id);
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

  const fetchTimeline = async (instanceId: number) => {
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
    await fetchTimeline(instanceId);
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

      await fetchTimeline(timeline.instanceId);
    } catch (error: any) {
      console.error('Failed to reassign:', error);
      showError('Failed to reassign step');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700 border-green-200' },
      CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 border-gray-200' },
      FAILED: { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200' },
      EXPIRED: { label: 'Expired', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    };
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return (
      <Badge variant="outline" className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);
  const currentStep = timeline?.nodes.find((s) => s.status === 'ACTIVE');
  const isTerminal = timeline?.status === 'COMPLETED' || timeline?.status === 'CANCELLED' || timeline?.status === 'FAILED';

  // Loading state
  if (loading && workflows.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading workflows...</p>
        </div>
      </div>
    );
  }

  // No workflows state
  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Play className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No Workflows</h3>
        <p className="text-sm text-gray-600 text-center mb-6 max-w-xs">
          Start a workflow to automate document processing, approvals, and reviews.
        </p>
        <Button onClick={() => setShowStartWorkflowModal(true)} size="default" className="gap-2">
          <Play className="w-4 h-4" />
          Start Workflow
        </Button>
        <StartWorkflowModal
          isOpen={showStartWorkflowModal}
          onClose={() => setShowStartWorkflowModal(false)}
          documentId={documentId}
          documentName={documentName}
          onWorkflowStarted={fetchAllWorkflows}
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Workflow Selector */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Workflows</CardTitle>
              <Button onClick={() => setShowStartWorkflowModal(true)} size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Play className="w-3 h-3" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {workflows.map((workflow) => {
                const isSelected = selectedWorkflowId === workflow.id;
                const duration = getDuration(workflow.startedAt, workflow.completedAt);

                return (
                  <div
                    key={workflow.id}
                    onClick={() => handleWorkflowSelect(workflow.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${isSelected
                        ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                        : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {workflow.workflowName}
                          </h4>
                          {getStatusBadge(workflow.status)}
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
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Workflow Details */}
        {selectedWorkflow && timeline && (
          <>
            {/* Current Step Highlight */}
            {currentStep && (
              <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-white border-l-4 border-l-blue-500">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep.isOverdue
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                        }`}>
                        <Clock className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={getNodeTypeInfo(currentStep.nodeType).className}>
                          {getNodeTypeInfo(currentStep.nodeType).icon}
                          <span className="ml-1">{getNodeTypeInfo(currentStep.nodeType).label}</span>
                        </Badge>
                        {currentStep.isOverdue && (
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{currentStep.nodeName}</h3>

                      {/* Description */}
                      {currentStep.description && (
                        <div className="flex items-start gap-1.5 mt-2 p-2 bg-white/70 rounded-lg border border-blue-100">
                          <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-700">{currentStep.description}</p>
                        </div>
                      )}

                      {/* Assignees */}
                      {currentStep.assignments && currentStep.assignments.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Users className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs text-gray-500">Assigned to:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentStep.assignments.map((a) => (
                              <Tooltip key={a.id}>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50 transition-colors">
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
                                    <span className="text-xs text-gray-700">
                                      {a.assigneeName || a.user?.displayName || 'Unknown'}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs p-2">
                                  <div className="space-y-0.5">
                                    <div className="font-semibold">
                                      {a.assigneeName || a.user?.displayName || 'Unknown'}
                                    </div>
                                    {a.user?.username && (
                                      <div className="text-gray-400">@{a.user.username}</div>
                                    )}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                setSelectedStepId(currentStep.id);
                                setShowReassignDialog(true);
                              }}
                            >
                              <Users className="w-3 h-3 mr-1" />
                              Reassign
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Due date and duration */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        {currentStep.dueDate && (
                          <span className={currentStep.isOverdue ? 'text-red-600 font-medium' : ''}>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Due: {formatDate(currentStep.dueDate)}
                          </span>
                        )}
                        {getDuration(currentStep.startedAt) && (
                          <span>
                            <Clock className="w-3 h-3 inline mr-1" />
                            Active: {getDuration(currentStep.startedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Summary */}
            <Card className="border-0 shadow-sm">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">
                    {timeline.completedNodes} of {timeline.totalNodes} steps completed
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.round(timeline.progressPercentage)}%
                  </span>
                </div>
                <Progress value={timeline.progressPercentage} className="h-2" />
              </CardContent>
            </Card>

            {/* Terminal status message */}
            {isTerminal && (
              <Card className={`border-0 shadow-sm ${timeline.status === 'COMPLETED'
                  ? 'bg-gradient-to-r from-green-50 to-white border-l-4 border-l-green-500'
                  : 'bg-gradient-to-r from-gray-50 to-white border-l-4 border-l-gray-400'
                }`}>
                <CardContent className="py-6">
                  <div className="text-center space-y-2">
                    {timeline.status === 'COMPLETED' ? (
                      <>
                        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                        <h3 className="font-semibold text-base text-gray-900">Workflow Completed</h3>
                        <p className="text-sm text-gray-600">
                          All steps have been completed successfully
                        </p>
                        {timeline.completedAt && (
                          <p className="text-xs text-gray-500">
                            Finished on {formatDate(timeline.completedAt)}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
                        <h3 className="font-semibold text-base text-gray-900">
                          Workflow {timeline.status.charAt(0) + timeline.status.slice(1).toLowerCase()}
                        </h3>
                        <p className="text-sm text-gray-600">
                          No further actions can be taken on this workflow
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline and History Tabs */}
            <Card className="border-0 shadow-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <CardHeader className="pb-2">
                  <TabsList className="grid w-full grid-cols-2 h-9">
                    <TabsTrigger value="timeline" className="text-xs gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-xs gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      History
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="pt-4">
                  <TabsContent value="timeline" className="mt-0">
                    <WorkflowTimeline
                      workflowInstanceId={timeline.instanceId}
                      documentId={documentId}
                    />
                  </TabsContent>
                  <TabsContent value="history" className="mt-0">
                    <WorkflowHistory
                      workflowInstanceId={timeline.instanceId}
                      documentId={documentId}
                    />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </>
        )}

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
          onWorkflowStarted={fetchAllWorkflows}
        />
      </div>
    </TooltipProvider>
  );
}
