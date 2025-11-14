"use client";

import React, { useEffect, useState } from "react";
import workflowService from "@/api/services/workflowService";
import { WorkflowStatus } from "@/types/workflow";
import WorkflowStatusBadge from "@/components/workflow/WorkflowStatusBadge";

interface DocumentWorkflowBadgeProps {
  documentId: number;
  compact?: boolean;
}

/**
 * Component that fetches and displays workflow status for a document
 * Uses lazy loading to avoid API calls for all documents at once
 */
const DocumentWorkflowBadge: React.FC<DocumentWorkflowBadgeProps> = ({
  documentId,
  compact = false
}) => {
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchWorkflowStatus = async () => {
      try {
        setLoading(true);
        const instance = await workflowService.getWorkflowInstanceByDocumentId(documentId);
        if (mounted) {
          setStatus(instance.status);
        }
      } catch (error) {
        // No workflow found - this is okay, not all documents have workflows
        if (mounted) {
          setStatus(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Only fetch if we don't already have status
    if (status === null && !loading) {
      fetchWorkflowStatus();
    }

    return () => {
      mounted = false;
    };
  }, [documentId]);

  if (loading || status === null) {
    return null;
  }

  return (
    <WorkflowStatusBadge
      status={status}
      showIcon={!compact}
      className={compact ? "text-xs" : ""}
    />
  );
};

export default DocumentWorkflowBadge;


