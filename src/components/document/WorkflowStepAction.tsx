'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { WorkflowNodeInstanceResponse, CompleteStepRequest, RejectStepRequest } from '@/types/api';
import { workflowService } from '@/api/services';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WorkflowStepActionProps {
  stepInstance: WorkflowNodeInstanceResponse;
  onComplete?: () => void;
}

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
      await workflowService.completeStep(stepInstance.id, request);
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
        comment: comment || undefined,
      };
      await workflowService.rejectStep(stepInstance.id, request);
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

  return (
    <>
      <div className={`fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg ${isOverdue ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'
        }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {isOverdue ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <Clock className="h-5 w-5 text-blue-600" />
              )}
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {stepInstance.nodeName}
                </div>

                {stepInstance.dueDate && (
                  <div className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                    }`}>
                    Due: {new Date(stepInstance.dueDate).toLocaleString()}
                    {isOverdue && ' (Overdue)'}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectDialog(true)}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCompleteDialog(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Step</DialogTitle>
            <DialogDescription>
              Complete the step: {stepInstance.nodeName}
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={loading}>
              {loading ? 'Completing...' : 'Complete Step'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Step</DialogTitle>
            <DialogDescription>
              Reject the step: {stepInstance.nodeName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="rejectComment">Additional Comment (Optional)</Label>
              <Textarea
                id="rejectComment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any additional comments..."
                rows={2}
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
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Rejecting...' : 'Reject Step'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}





