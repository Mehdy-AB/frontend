"use client";

import React, { useEffect, useState } from "react";
import { WorkflowInstance } from "@/types/workflow";
import workflowService from "@/api/services/workflowService";
import WorkflowVisualization from "@/components/workflow/WorkflowVisualization";
import WorkflowActionPanel from "@/components/workflow/WorkflowActionPanel";
import { WorkflowActionRequest } from "@/types/workflow";
import { Loader2 } from "lucide-react";

interface DocumentWorkflowTabProps {
  documentId: number;
  documentName: string;
}

const DocumentWorkflowTab: React.FC<DocumentWorkflowTabProps> = ({
  documentId,
  documentName
}) => {
  const [workflowInstance, setWorkflowInstance] = useState<WorkflowInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch workflow instance for document
  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        setLoading(true);
        setError(null);
        const instance = await workflowService.getWorkflowInstanceByDocumentId(documentId);
        setWorkflowInstance(instance);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load workflow";
        setError(errorMessage);
        console.error("Error fetching workflow:", err);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchWorkflow();
    }
  }, [documentId]);

  // Handle workflow action
  const handleWorkflowAction = async (request: WorkflowActionRequest) => {
    if (!workflowInstance) return;

    try {
      setActionLoading(true);
      const updatedInstance = await workflowService.performWorkflowAction(
        workflowInstance.id,
        request
      );
      setWorkflowInstance(updatedInstance);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to perform action";
      setError(errorMessage);
      console.error("Error performing workflow action:", err);
      throw err; // Re-throw to let the action panel handle it
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error && !workflowInstance) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No active workflow found for this document.
          </p>
        </div>
      </div>
    );
  }

  if (!workflowInstance) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No workflow has been started for this document.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full overflow-hidden">
      {/* Workflow Visualization - Takes 2/3 of space */}
      <div className="lg:col-span-2 h-full overflow-auto">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-4">Workflow Progress</h3>
          <WorkflowVisualization workflowInstance={workflowInstance} />
        </div>
      </div>

      {/* Action Panel - Takes 1/3 of space */}
      <div className="lg:col-span-1 h-full overflow-auto">
        <WorkflowActionPanel
          workflowInstance={workflowInstance}
          onAction={handleWorkflowAction}
          loading={actionLoading}
        />
      </div>
    </div>
  );
};

export default DocumentWorkflowTab;


