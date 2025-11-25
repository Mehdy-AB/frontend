"use client";

import React from "react";
import { DocumentWorkflowInstanceDto } from "@/types/api";
import { Workflow, Circle, CheckCircle2, XCircle, Clock } from "lucide-react";

interface DocumentWorkflowBadgeProps {
  documentId: number;
  workflowInstance?: DocumentWorkflowInstanceDto | null;
  compact?: boolean;
}

/**
 * Component that displays workflow status for a document
 * Uses workflowInstance from document response to avoid separate API calls
 */
const DocumentWorkflowBadge: React.FC<DocumentWorkflowBadgeProps> = ({
  documentId,
  workflowInstance,
  compact = false
}) => {
  // If no workflow instance provided, don't show anything
  if (!workflowInstance) {
    return null;
  }

  // Get status badge styling
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'COMPLETED':
        return 'bg-success/20 text-success border-success/30';
      case 'CANCELLED':
        return 'bg-error/20 text-error border-error/30';
      default:
        return 'bg-neutral-ui text-neutral-text-light border-ui';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Circle className="h-3 w-3 fill-current animate-pulse" />;
      case 'COMPLETED':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'CANCELLED':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  if (compact) {
    // Compact version: just show workflow name and status indicator
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${getStatusClass(workflowInstance.workflowStatus)}`}>
        {getStatusIcon(workflowInstance.workflowStatus)}
        <span className="font-medium">{workflowInstance.workflowName}</span>
        {workflowInstance.currentStepName && (
          <span className="text-neutral-text-light">• {workflowInstance.currentStepName}</span>
        )}
      </span>
    );
  }

  // Full version: show more details
  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs border ${getStatusClass(workflowInstance.workflowStatus)}`}>
      <Workflow className="h-3 w-3" />
      <span className="font-medium">{workflowInstance.workflowName}</span>
      {workflowInstance.currentStepName && (
        <>
          <span className="text-neutral-text-light">•</span>
          <span className="text-neutral-text-light">{workflowInstance.currentStepName}</span>
        </>
      )}
      {getStatusIcon(workflowInstance.workflowStatus)}
    </div>
  );
};

export default DocumentWorkflowBadge;


