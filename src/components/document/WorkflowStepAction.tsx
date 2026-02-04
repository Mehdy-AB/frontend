'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Info
} from 'lucide-react';
import { WorkflowNodeInstanceResponse, CompleteStepRequest, RejectStepRequest } from '@/types/workflow';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/main/UserAvatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WorkflowStepActionProps {
  stepInstance: WorkflowNodeInstanceResponse;
  onComplete?: () => void;
}

// Get node type badge styling
const getNodeTypeBadge = (nodeType?: string) => {
  switch (nodeType) {
    case 'APPROVAL':
      return { label: 'Approval Required', className: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 'REVIEW':
      return { label: 'Review Required', className: 'bg-purple-100 text-purple-700 border-purple-200' };
    case 'MANUAL_TASK':
      return { label: 'Task', className: 'bg-amber-100 text-amber-700 border-amber-200' };
    default:
      return { label: 'Action Required', className: 'bg-gray-100 text-gray-700 border-gray-200' };
  }
};

// Calculate duration from startedAt to now
const getDuration = (startedAt?: string) => {
  if (!startedAt) return null;

  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  } else if (diffMins > 0) {
    return `${diffMins}m`;
  }
  return 'Just started';
};

export default function WorkflowStepAction({ stepInstance, onComplete }: WorkflowStepActionProps) {
  const { showSuccess, showError } = useNotifications();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    try {
      setLoading(true);
      const request: CompleteStepRequest = { comment: comment || undefined };
      await workflowAdminService.completeNode(stepInstance.id, request);
      showSuccess('Step completed successfully');
      setShowCompleteDialog(false);
      setComment('');
      onComplete?.();
    } catch (error: any) {
      showError('Failed to complete step', error?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showError('Rejection reason is required');
      return;
    }

    try {
      setLoading(true);
      const request: RejectStepRequest = {
        rejectionReason: rejectionReason.trim(),
      };
      await workflowAdminService.rejectNode(stepInstance.id, request);
      showSuccess('Step rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
      setComment('');
      onComplete?.();
    } catch (error: any) {
      showError('Failed to reject step', error?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (stepInstance.status !== 'ACTIVE') {
    return null;
  }

  const isOverdue = stepInstance.isOverdue;
  const nodeType = stepInstance.nodeType;
  const typeBadge = getNodeTypeBadge(nodeType);
  const duration = getDuration(stepInstance.startedAt);

  // Only APPROVAL nodes have Approve/Reject. REVIEW and MANUAL_TASK only have "Done"
  const isApprovalNode = nodeType === 'APPROVAL';

  return (
    <>
      {/* Notification Banner under document title */}
      <div className={`w-full rounded-lg border-2 mb-4 ${isOverdue
        ? 'border-red-300 bg-gradient-to-r from-red-50 to-white'
        : 'border-blue-300 bg-gradient-to-r from-blue-50 to-white'
        }`}>
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            {/* Left side: Icon, Type, Name, Description */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {isOverdue ? (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                {/* Header row with type badge and name */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={typeBadge.className}>
                    {typeBadge.label}
                  </Badge>
                  <span className="font-semibold text-gray-900 truncate">
                    {stepInstance.nodeName}
                  </span>
                  {stepInstance.workflowName && (
                    <span className="text-xs text-gray-500">
                      ({stepInstance.workflowName})
                    </span>
                  )}
                </div>

                {/* Description/Instructions */}
                {stepInstance.description && (
                  <div className="mt-1.5 text-sm text-gray-700 bg-white/60 rounded px-2 py-1 border border-gray-100">
                    <Info className="h-3.5 w-3.5 inline-block mr-1 text-blue-500" />
                    {stepInstance.description}
                  </div>
                )}

                {/* Info row: Duration, Due date, Assignees */}
                <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-gray-600">
                  {/* Duration */}
                  {duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Active: {duration}</span>
                    </div>
                  )}

                  {/* Due date */}
                  {stepInstance.dueDate && (
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                      <Calendar className="h-3 w-3" />
                      <span>Due: {new Date(stepInstance.dueDate).toLocaleDateString()}</span>
                      {isOverdue && <span className="ml-1">(Overdue)</span>}
                    </div>
                  )}

                  {/* Assignees with UserAvatar */}
                  {stepInstance.assignments && stepInstance.assignments.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Assigned to:</span>
                      <div className="flex items-center gap-1.5">
                        <TooltipProvider>
                          {stepInstance.assignments.slice(0, 3).map((assignment) => (
                            <Tooltip key={assignment.id}>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-pointer">
                                  <UserAvatar
                                    user={assignment.user ? {
                                      id: assignment.user.id,
                                      username: assignment.user.username,
                                      email: assignment.user.email,
                                      firstName: assignment.user.firstName,
                                      lastName: assignment.user.lastName,
                                      displayName: assignment.user.displayName,
                                      imgUrl: assignment.user.imgUrl,
                                      imageUrl: assignment.user.imageUrl,
                                    } : null}
                                    size="xs"
                                  />
                                  <span className="text-gray-700 font-medium">
                                    {assignment.assigneeName || assignment.user?.displayName || 'Unknown'}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">
                                <div className="space-y-0.5">
                                  <div className="font-semibold">
                                    {assignment.assigneeName || assignment.user?.displayName || 'Unknown'}
                                  </div>
                                  {assignment.user?.username && (
                                    <div className="text-gray-400">@{assignment.user.username}</div>
                                  )}
                                  {assignment.user?.email && (
                                    <div className="text-gray-400">{assignment.user.email}</div>
                                  )}
                                  {assignment.role && (
                                    <div className="text-purple-400">Role: {assignment.role.name}</div>
                                  )}
                                  {assignment.group && (
                                    <div className="text-green-400">Group: {assignment.group.name}</div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                        {stepInstance.assignments.length > 3 && (
                          <span className="text-gray-500 text-xs">
                            +{stepInstance.assignments.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isApprovalNode ? (
                <>
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => setShowCompleteDialog(true)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowCompleteDialog(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Done
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              {isApprovalNode ? 'Approve Step' : 'Complete Step'}
            </DialogTitle>
            <DialogDescription>
              {isApprovalNode
                ? 'Approve this workflow step and proceed to the next step.'
                : 'Mark this step as completed.'
              }
              <br />
              <span className="font-medium text-gray-700">{stepInstance.nodeName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Processing...' : (isApprovalNode ? 'Approve' : 'Done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog - Only for APPROVAL nodes */}
      {isApprovalNode && (
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Reject Step
              </DialogTitle>
              <DialogDescription>
                Reject this step and provide a reason.
                <br />
                <span className="font-medium text-gray-700">{stepInstance.nodeName}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="rejectionReason">Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={3}
                  required
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                variant="destructive"
              >
                {loading ? 'Processing...' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
