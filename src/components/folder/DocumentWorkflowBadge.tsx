"use client";

import React, { useState } from "react";
import { DocumentWorkflowInstanceDto } from "@/types/api";
import { WorkflowInstanceResponse } from "@/types/workflow";
import { workflowAdminService } from "@/api/services/workflowAdminService";
import { Circle, CheckCircle2, XCircle, Clock, GitBranch } from "lucide-react";
import DocumentWorkflowPanel from "@/components/document/DocumentWorkflowPanel";

interface DocumentWorkflowBadgeProps {
  documentId: number;
  workflowInstance?: DocumentWorkflowInstanceDto | null;
  compact?: boolean;
}

/**
 * Component that displays workflow status for a document in the table view.
 * Clickable — opens the full workflow instances panel on click.
 */
const DocumentWorkflowBadge: React.FC<DocumentWorkflowBadgeProps> = ({
  documentId,
  workflowInstance,
  compact = false
}) => {
  const [showPanel, setShowPanel] = useState(false);
  const [instances, setInstances] = useState<WorkflowInstanceResponse[]>([]);
  const [loading, setLoading] = useState(false);

  if (!workflowInstance) {
    return null;
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'CANCELLED':
        return 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100';
      case 'FAILED':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Circle className="h-2.5 w-2.5 fill-current animate-pulse" />;
      case 'COMPLETED':
        return <CheckCircle2 className="h-2.5 w-2.5" />;
      case 'CANCELLED':
      case 'FAILED':
        return <XCircle className="h-2.5 w-2.5" />;
      default:
        return <Clock className="h-2.5 w-2.5" />;
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setShowPanel(true);
    if (instances.length === 0) {
      setLoading(true);
      try {
        const data = await workflowAdminService.getAllWorkflowInstancesForDocument(documentId);
        setInstances(data);
      } catch (err) {
        console.error('Failed to fetch workflow instances:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${getStatusClass(workflowInstance.workflowStatus)}`}
        title={`${workflowInstance.workflowName}${workflowInstance.currentStepName ? ' — ' + workflowInstance.currentStepName : ''}`}
      >
        <GitBranch className="h-2.5 w-2.5" />
        {getStatusIcon(workflowInstance.workflowStatus)}
        {!compact && (
          <span className="max-w-[120px] truncate">{workflowInstance.workflowName}</span>
        )}
      </button>

      <DocumentWorkflowPanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        workflowInstances={instances}
        loading={loading}
      />
    </>
  );
};

export default DocumentWorkflowBadge;
