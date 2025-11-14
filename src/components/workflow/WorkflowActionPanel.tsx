"use client";

import React, { useState } from "react";
import {
  WorkflowInstance,
  WorkflowAction,
  WorkflowActionRequest,
  getStatusDisplayName,
  getStatusBadgeClass,
  getStatusIcon,
  isTerminalStatus
} from "@/types/workflow";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Pause,
  Play,
  MessageSquare,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface WorkflowActionPanelProps {
  workflowInstance: WorkflowInstance;
  onAction: (request: WorkflowActionRequest) => Promise<void>;
  loading?: boolean;
  userRoles?: string[];
}

const WorkflowActionPanel: React.FC<WorkflowActionPanelProps> = ({
  workflowInstance,
  onAction,
  loading = false,
  userRoles = []
}) => {
  const [comment, setComment] = useState("");
  const [actionInProgress, setActionInProgress] = useState(false);

  const handleAction = async (action: WorkflowAction) => {
    setActionInProgress(true);
    try {
      const request: WorkflowActionRequest = {
        action,
        comment: comment.trim() || undefined
      };
      await onAction(request);
      setComment(""); // Clear comment after successful action
    } finally {
      setActionInProgress(false);
    }
  };

  const canPerformAction = (action: WorkflowAction): boolean => {
    // Check if workflow is in terminal state
    if (isTerminalStatus(workflowInstance.status)) {
      return false;
    }

    // Check role-based permissions
    const currentStep = workflowInstance.currentStep;
    if (!currentStep) {
      return false;
    }

    // For approver actions, check if user has the required role
    if ([WorkflowAction.APPROVE, WorkflowAction.REJECT, WorkflowAction.REQUEST_REVISION, WorkflowAction.HOLD, WorkflowAction.RESUME].includes(action)) {
      return currentStep.approverRole ? userRoles.includes(currentStep.approverRole) : false;
    }

    return true;
  };

  const getActionButton = (action: WorkflowAction, label: string, icon: React.ReactNode, variant: "default" | "destructive" | "outline" = "default") => {
    const isDisabled = !canPerformAction(action) || loading || actionInProgress;
    
    return (
      <Button
        onClick={() => handleAction(action)}
        disabled={isDisabled}
        variant={variant}
        className="w-full justify-start gap-2"
      >
        {icon}
        {label}
      </Button>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Workflow Actions</CardTitle>
        <CardDescription>
          Current step: {workflowInstance.currentStep?.name || "N/A"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Status */}
        <div>
          <h4 className="text-sm font-medium mb-2">Current Status</h4>
          <Badge className={getStatusBadgeClass(workflowInstance.status)}>
            {getStatusIcon(workflowInstance.status)} {getStatusDisplayName(workflowInstance.status)}
          </Badge>
        </div>

        <Separator />

        {/* Current Step Details */}
        {workflowInstance.currentStep && (
          <div>
            <h4 className="text-sm font-medium mb-2">Step Details</h4>
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">Role:</span>{" "}
                <Badge variant="outline">{workflowInstance.currentStep.approverRole}</Badge>
              </p>
              {workflowInstance.currentStep.description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {workflowInstance.currentStep.description}
                </p>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Comment Field */}
        {!isTerminalStatus(workflowInstance.status) && (
          <div>
            <label htmlFor="comment" className="text-sm font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comment
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (optional)"
              rows={3}
              className="resize-none"
              disabled={loading || actionInProgress}
            />
          </div>
        )}

        {/* Action Buttons */}
        {!isTerminalStatus(workflowInstance.status) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-2">Available Actions</h4>
            
            {/* Approve */}
            {canPerformAction(WorkflowAction.APPROVE) && (
              getActionButton(
                WorkflowAction.APPROVE,
                "Approve",
                <CheckCircle className="w-4 h-4" />,
                "default"
              )
            )}

            {/* Reject */}
            {canPerformAction(WorkflowAction.REJECT) && (
              getActionButton(
                WorkflowAction.REJECT,
                "Reject",
                <XCircle className="w-4 h-4" />,
                "destructive"
              )
            )}

            {/* Request Revision */}
            {canPerformAction(WorkflowAction.REQUEST_REVISION) && (
              getActionButton(
                WorkflowAction.REQUEST_REVISION,
                "Request Revision",
                <RefreshCw className="w-4 h-4" />,
                "outline"
              )
            )}

            {/* Hold */}
            {canPerformAction(WorkflowAction.HOLD) && (
              getActionButton(
                WorkflowAction.HOLD,
                "Put On Hold",
                <Pause className="w-4 h-4" />,
                "outline"
              )
            )}

            {/* Resume */}
            {canPerformAction(WorkflowAction.RESUME) && (
              getActionButton(
                WorkflowAction.RESUME,
                "Resume",
                <Play className="w-4 h-4" />,
                "default"
              )
            )}

            {/* Submit */}
            {canPerformAction(WorkflowAction.SUBMIT) && (
              getActionButton(
                WorkflowAction.SUBMIT,
                "Submit for Approval",
                <Send className="w-4 h-4" />,
                "default"
              )
            )}

            {/* Cancel */}
            {canPerformAction(WorkflowAction.CANCEL) && (
              getActionButton(
                WorkflowAction.CANCEL,
                "Cancel Workflow",
                <XCircle className="w-4 h-4" />,
                "destructive"
              )
            )}
          </div>
        )}

        {/* Terminal Status Message */}
        {isTerminalStatus(workflowInstance.status) && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This workflow has been completed and no further actions can be taken.
            </p>
          </div>
        )}

        {/* Workflow History */}
        {workflowInstance.history && workflowInstance.history.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3">History</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {workflowInstance.history.map((entry) => (
                  <div
                    key={entry.id}
                    className="text-xs p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">{entry.action}</span>
                      <span className="text-gray-500">
                        {new Date(entry.performedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      By: {entry.performedByFullName || entry.performedByUsername}
                    </p>
                    {entry.stepName && (
                      <p className="text-gray-600 dark:text-gray-400">
                        Step: {entry.stepName}
                      </p>
                    )}
                    {entry.comment && (
                      <p className="mt-1 text-gray-700 dark:text-gray-300 italic">
                        "{entry.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowActionPanel;


