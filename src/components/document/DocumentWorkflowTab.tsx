'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { workflowService } from '@/api/services/workflowService';
import {
  WorkflowInstanceResponse,
  WorkflowStepInstanceResponse,
  CompleteStepRequest,
  RejectStepRequest,
  UserDto
} from '@/types/api';
import {
  WorkflowTimelineResponse,
  ReassignStepRequest
} from '@/types/workflow';
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline';
import { WorkflowHistory } from '@/components/workflow/WorkflowHistory';
import { ReassignStepDialog } from '@/components/workflow/ReassignStepDialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Users,
  Clock,
  AlertCircle,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import StartWorkflowModal from '@/components/modals/StartWorkflowModal';
import { useNotifications } from '@/hooks/useNotifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/dateFormatter';

interface DocumentWorkflowTabProps {
  documentId: number;
  documentName: string;
  onRefreshDocument?: () => void;
}

export default function DocumentWorkflowTab({
  documentId,
  documentName,
  onRefreshDocument,
}: DocumentWorkflowTabProps) {
  const { data: session } = useSession();
  const [workflows, setWorkflows] = useState<WorkflowInstanceResponse[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [timeline, setTimeline] = useState<WorkflowTimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStartWorkflowModal, setShowStartWorkflowModal] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('timeline');
  const { showSuccess, showError } = useNotifications();

  // Get current user ID from session
  const currentUserId = session?.user?.id || null;

  useEffect(() => {
    fetchAllWorkflows();
  }, [documentId]);

  const fetchAllWorkflows = async () => {
    setLoading(true);
    try {
      const instances = await workflowService.getAllWorkflowInstancesForDocument(documentId);
      setWorkflows(instances);

      // Auto-select the first active workflow or the most recent one
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
      const data = await workflowService.getInstanceTimeline(instanceId);
      setTimeline(data);
    } catch (error: any) {
      console.error('Failed to fetch timeline:', error);
      showError('Failed to load workflow timeline');
    }
  };

  const handleWorkflowSelect = async (instanceId: number) => {
    setSelectedWorkflowId(instanceId);
    setComment('');
    await fetchTimeline(instanceId);
  };

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION') => {
    if (!timeline) return;

    const currentStep = timeline.steps.find((s) => s.status === 'ACTIVE');
    if (!currentStep) {
      showError('No active step found');
      return;
    }

    setActionLoading(true);
    try {
      if (action === 'APPROVE') {
        const request: CompleteStepRequest = { comment };
        await workflowService.completeStep(currentStep.stepInstanceId, request);
        showSuccess('Step completed successfully');
      } else if (action === 'REJECT') {
        const request: RejectStepRequest = { rejectionReason: comment || 'Rejected' };
        await workflowService.rejectStep(currentStep.stepInstanceId, request);
        showSuccess('Step rejected');
      }

      setComment('');

      // Refetch workflows and document
      await fetchAllWorkflows();
      if (onRefreshDocument) {
        onRefreshDocument();
      }
    } catch (error: any) {
      console.error('Failed to perform action:', error);
      showError(error?.response?.data?.message || 'Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassign = async (userIds: string[], reason: string) => {
    if (!timeline || !selectedStepId) return;

    const currentStep = timeline.steps.find((s) => s.stepInstanceId === selectedStepId);
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

      await workflowService.reassignStep(timeline.instanceId, selectedStepId, request);
      showSuccess('Step reassigned successfully');
      setShowReassignDialog(false);
      setSelectedStepId(null);

      // Refetch timeline
      await fetchTimeline(timeline.instanceId);
    } catch (error: any) {
      console.error('Failed to reassign:', error);
      showError('Failed to reassign step');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
      COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
      CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700' },
      FAILED: { label: 'Failed', className: 'bg-red-100 text-red-700' },
      EXPIRED: { label: 'Expired', className: 'bg-orange-100 text-orange-700' },
    };
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return (
      <Badge className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  // Check if current user is assigned to the current step
  const isUserAssignedToCurrentStep = (): boolean => {
    if (!timeline || !currentUserId) return false;

    const currentStep = timeline.steps.find((s) => s.status === 'ACTIVE');
    if (!currentStep) return false;

    // Check if user is in the assigned users list
    return currentStep.assignedUsers?.some(u => u.id === currentUserId) || false;
  };

  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);
  const currentStep = timeline?.steps.find((s) => s.status === 'ACTIVE');
  const isTerminal = timeline?.status === 'COMPLETED' || timeline?.status === 'CANCELLED' || timeline?.status === 'FAILED';
  const canTakeAction = isUserAssignedToCurrentStep();

  // Loading state
  if (loading && workflows.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  // No workflows state
  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Play className="w-12 h-12 text-gray-400 mb-3" />
        <h3 className="text-sm font-semibold text-gray-900 mb-1">No Workflows</h3>
        <p className="text-xs text-gray-600 text-center mb-4">
          This document is not part of any workflow yet
        </p>
        <Button onClick={() => setShowStartWorkflowModal(true)} size="sm">
          <Play className="w-3 h-3 mr-1" />
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
    <div className="space-y-3">
      {/* Workflow List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Workflows</CardTitle>
            <Button onClick={() => setShowStartWorkflowModal(true)} size="sm" variant="outline" className="h-7 text-xs">
              <Play className="w-3 h-3 mr-1" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-1.5">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => handleWorkflowSelect(workflow.id)}
                className={`p-2 rounded-lg cursor-pointer transition-all ${selectedWorkflowId === workflow.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50 border border-transparent'
                  }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-xs font-semibold text-gray-900 truncate">
                        {workflow.workflow.name}
                      </h4>
                      {getStatusBadge(workflow.status)}
                    </div>
                    <p className="text-[10px] text-gray-600">
                      Started {formatDate(workflow.startedAt)}
                      {workflow.completedAt && ` • Ended ${formatDate(workflow.completedAt)}`}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 ${selectedWorkflowId === workflow.id ? 'text-blue-600' : ''
                    }`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Workflow Details */}
      {selectedWorkflow && timeline && (
        <>
          {/* Workflow Summary */}
          <Card>
            <CardHeader className="pb-2">
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{timeline.workflowName}</CardTitle>
                  {getStatusBadge(timeline.status)}
                </div>
                <CardDescription className="text-[10px]">
                  Started {formatDate(timeline.startedAt)}
                  {timeline.completedAt && ` • Completed ${formatDate(timeline.completedAt)}`}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {timeline.completedSteps} of {timeline.totalSteps} steps
                  </span>
                  <span className="font-semibold text-gray-900">
                    {Math.round(timeline.progressPercentage)}%
                  </span>
                </div>
                <Progress value={timeline.progressPercentage} className="h-1.5" />
              </div>

              {/* Current step info */}
              {currentStep && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-gray-900">Current Step</h4>
                      <p className="text-xs text-gray-700 mt-0.5">{currentStep.stepName}</p>
                      {currentStep.stepDescription && (
                        <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-2">{currentStep.stepDescription}</p>
                      )}

                      {/* Assigned users */}
                      {currentStep.assignedUsers && currentStep.assignedUsers.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-gray-500" />
                            <span className="text-[10px] text-gray-600">Assigned:</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {currentStep.assignedUsers.slice(0, 2).map((u) => (
                              <div key={u.id} className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={u.imgUrl} />
                                  <AvatarFallback className="text-[8px]">
                                    {u.firstName?.[0]}{u.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] text-gray-700">
                                  {u.firstName} {u.lastName}
                                </span>
                              </div>
                            ))}
                            {currentStep.assignedUsers.length > 2 && (
                              <span className="text-[10px] text-gray-500">
                                +{currentStep.assignedUsers.length - 2}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px] ml-auto"
                              onClick={() => {
                                setSelectedStepId(currentStep.stepInstanceId);
                                setShowReassignDialog(true);
                              }}
                            >
                              <Users className="w-3 h-3 mr-1" />
                              Reassign
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Due date */}
                      {currentStep.dueDate && (
                        <div className={`text-[10px] mt-1.5 ${currentStep.isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {currentStep.isOverdue && <AlertCircle className="w-3 h-3 inline mr-1" />}
                          Due: {formatDate(currentStep.dueDate)}
                          {currentStep.isOverdue && ' (Overdue)'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Section - Only show if user is assigned to current step */}
          {!isTerminal && currentStep && canTakeAction && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Actions</CardTitle>
                <CardDescription className="text-[10px]">
                  Take action on the current step
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-2">
                {/* Comment textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">
                    <MessageSquare className="w-3 h-3 inline mr-1" />
                    Add Comment
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment or reason..."
                    rows={3}
                    className="resize-none text-xs"
                  />
                </div>

                {/* Action buttons */}
                <div className="space-y-1.5">
                  <Button
                    onClick={() => handleAction('APPROVE')}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-sm h-9"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 mr-2" />
                    )}
                    Approve
                  </Button>

                  <Button
                    onClick={() => handleAction('REJECT')}
                    disabled={actionLoading}
                    variant="destructive"
                    className="w-full text-sm h-9"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-2" />
                    )}
                    Reject
                  </Button>

                  <Button
                    onClick={() => handleAction('REQUEST_REVISION')}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full text-sm h-9"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-2" />
                    )}
                    Request Revision
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message if user is not assigned */}
          {!isTerminal && currentStep && !canTakeAction && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4 pb-3">
                <div className="text-center space-y-1">
                  <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto" />
                  <p className="text-xs text-gray-700 font-medium">You are not assigned to the current step</p>
                  <p className="text-[10px] text-gray-600">
                    Only assigned users can take action on this step
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terminal status message */}
          {isTerminal && (
            <Card className="bg-gray-50">
              <CardContent className="pt-4 pb-3">
                <div className="text-center space-y-2">
                  {timeline.status === 'COMPLETED' ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
                      <h3 className="font-semibold text-sm text-gray-900">Workflow Completed</h3>
                      <p className="text-xs text-gray-600">
                        All steps have been completed successfully
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-10 h-10 text-gray-600 mx-auto" />
                      <h3 className="font-semibold text-sm text-gray-900">Workflow {timeline.status}</h3>
                      <p className="text-xs text-gray-600">
                        No further actions can be taken
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline and History Section */}
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <CardHeader className="pb-2">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-3">
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
  );
}
