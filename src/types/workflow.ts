/**
 * TypeScript types for Workflow System
 */

export enum WorkflowStatus {
  // Initial States
  DRAFT = "DRAFT",
  IN_REVISION = "IN_REVISION",
  
  // Submission Stage
  SUBMITTED = "SUBMITTED",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  
  // Review Stages
  IN_REVIEW = "IN_REVIEW",
  IN_MANAGER_REVIEW = "IN_MANAGER_REVIEW",
  IN_ACCOUNTING_REVIEW = "IN_ACCOUNTING_REVIEW",
  
  // Approval States
  APPROVED_BY_MANAGER = "APPROVED_BY_MANAGER",
  APPROVED_BY_ACCOUNTING = "APPROVED_BY_ACCOUNTING",
  APPROVED = "APPROVED",
  
  // Hold/Pause States
  ON_HOLD = "ON_HOLD",
  REVISION_REQUESTED = "REVISION_REQUESTED",
  
  // Terminal States
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  ARCHIVED = "ARCHIVED",
  
  // Error States
  FAILED = "FAILED"
}

export enum WorkflowAction {
  // Employee Actions
  SUBMIT = "SUBMIT",
  CANCEL = "CANCEL",
  REVISE = "REVISE",
  
  // Approver Actions
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  REQUEST_REVISION = "REQUEST_REVISION",
  
  // Accounting Specific Actions
  HOLD = "HOLD",
  RESUME = "RESUME",
  
  // System Actions
  ARCHIVE = "ARCHIVE",
  AUTO_PROGRESS = "AUTO_PROGRESS"
}

export interface WorkflowStep {
  id: number;
  name: string;
  order: number;
  approverRole: string;
  status?: WorkflowStatus;
  description?: string;
  assignedTo?: string;
}

export interface Workflow {
  id: number;
  name: string;
  definitionJson?: string;
  conditional: boolean;
  steps: WorkflowStep[];
}

export interface WorkflowHistoryEntry {
  id: number;
  action: WorkflowAction;
  fromStatus?: WorkflowStatus;
  toStatus: WorkflowStatus;
  performedByUsername: string;
  performedByFullName?: string;
  performedAt: string;
  comment?: string;
  stepName?: string;
}

export interface WorkflowInstance {
  id: number;
  documentId: number;
  documentName?: string;
  workflow: Workflow;
  currentStep?: WorkflowStep;
  status: WorkflowStatus;
  startedAt: string;
  completedAt?: string;
  notes?: string;
  history: WorkflowHistoryEntry[];
}

export interface CreateWorkflowInstanceRequest {
  documentId: number;
  workflowId: number;
  notes?: string;
}

export interface WorkflowActionRequest {
  action: WorkflowAction;
  comment?: string;
  assignedTo?: string;
  metadata?: string;
}

// UI-specific types
export interface WorkflowNodeData {
  step: WorkflowStep;
  status: WorkflowStatus;
  isCurrent: boolean;
}

export interface WorkflowVisualizationProps {
  workflowInstance: WorkflowInstance;
  onAction?: (action: WorkflowAction, comment?: string) => void;
}

// Helper functions
export const getStatusColor = (status: WorkflowStatus): string => {
  switch (status) {
    case WorkflowStatus.APPROVED:
    case WorkflowStatus.ARCHIVED:
    case WorkflowStatus.APPROVED_BY_MANAGER:
    case WorkflowStatus.APPROVED_BY_ACCOUNTING:
      return "GREEN"; // 🟢
    case WorkflowStatus.IN_REVIEW:
    case WorkflowStatus.IN_MANAGER_REVIEW:
    case WorkflowStatus.IN_ACCOUNTING_REVIEW:
    case WorkflowStatus.PENDING_APPROVAL:
      return "YELLOW"; // 🟡
    case WorkflowStatus.DRAFT:
    case WorkflowStatus.SUBMITTED:
    case WorkflowStatus.ON_HOLD:
    case WorkflowStatus.REVISION_REQUESTED:
    case WorkflowStatus.IN_REVISION:
      return "GRAY"; // ⚪️
    case WorkflowStatus.REJECTED:
    case WorkflowStatus.CANCELLED:
    case WorkflowStatus.FAILED:
      return "RED"; // 🔴
    default:
      return "GRAY";
  }
};

export const getStatusBadgeClass = (status: WorkflowStatus): string => {
  const color = getStatusColor(status);
  const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
  
  switch (color) {
    case "GREEN":
      return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
    case "YELLOW":
      return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
    case "GRAY":
      return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
    case "RED":
      return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

export const getStatusIcon = (status: WorkflowStatus): string => {
  const color = getStatusColor(status);
  switch (color) {
    case "GREEN":
      return "🟢";
    case "YELLOW":
      return "🟡";
    case "GRAY":
      return "⚪";
    case "RED":
      return "🔴";
    default:
      return "⚪";
  }
};

export const getStatusDisplayName = (status: WorkflowStatus): string => {
  return status
    .split("_")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export const isTerminalStatus = (status: WorkflowStatus): boolean => {
  return [
    WorkflowStatus.ARCHIVED,
    WorkflowStatus.REJECTED,
    WorkflowStatus.CANCELLED,
    WorkflowStatus.FAILED
  ].includes(status);
};

export const isEditableStatus = (status: WorkflowStatus): boolean => {
  return [
    WorkflowStatus.DRAFT,
    WorkflowStatus.IN_REVISION
  ].includes(status);
};


