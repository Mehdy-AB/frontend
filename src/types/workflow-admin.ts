/**
 * Enhanced workflow types for admin workflow management
 */

export type AssigneeType = 'USER' | 'ROLE' | 'GROUP';
export type ActionType = 'APPROVER' | 'REVIEWER' | 'NOTIFIED' | 'OPTIONAL';

export interface WorkflowTaskAssignment {
  id?: number;
  assigneeType: AssigneeType;
  userId?: string;
  userName?: string;
  roleId?: string;
  roleName?: string;
  groupId?: string;
  groupName?: string;
  actionType: ActionType;
  canApprove: boolean;
  canReject: boolean;
  canComment: boolean;
  canRequestRevision: boolean;
  notes?: string;
}

export interface WorkflowTaskDetail {
  id?: number;
  name: string;
  sequence: number;
  approverRole?: string;
  assigneeAlias?: string;
  description?: string;
  assignments: WorkflowTaskAssignment[];
}

export interface WorkflowDetail {
  id?: number;
  name: string;
  description?: string;
  conditional: boolean;
  definitionJson?: string;
  tasks: WorkflowTaskDetail[];
  totalInstances?: number;
  activeInstances?: number;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  conditional: boolean;
  definitionJson?: string;
  tasks: Omit<WorkflowTaskDetail, 'id'>[];
}

export interface UpdateWorkflowRequest {
  name: string;
  description?: string;
  conditional: boolean;
  definitionJson?: string;
  tasks: Omit<WorkflowTaskDetail, 'id'>[];
}

export interface EntitySearchResult {
  id: string;
  name: string;
  displayName: string;
  type: 'USER' | 'ROLE' | 'GROUP';
  email?: string;
  description?: string;
}

// For xyflow node data
export interface WorkflowNodeData {
  id?: number;
  label: string;
  sequence: number;
  description?: string;
  assignments: WorkflowTaskAssignment[];
  status?: 'default' | 'active' | 'completed' | 'error';
  onEdit?: (stepId: number | string) => void;
  onDelete?: (stepId: number | string) => void;
}

// Action type options for UI
export const ACTION_TYPE_OPTIONS: { value: ActionType; label: string; description: string }[] = [
  {
    value: 'APPROVER',
    label: 'Approver',
    description: 'Can approve or reject the workflow step',
  },
  {
    value: 'REVIEWER',
    label: 'Reviewer',
    description: 'Can only review and comment',
  },
  {
    value: 'NOTIFIED',
    label: 'Observer',
    description: 'Receives notifications but cannot interact',
  },
  {
    value: 'OPTIONAL',
    label: 'Optional Reviewer',
    description: 'Optional reviewer that can provide feedback',
  },
];

// Assignee type options for UI
export const ASSIGNEE_TYPE_OPTIONS: { value: AssigneeType; label: string; icon: string }[] = [
  { value: 'USER', label: 'User', icon: '👤' },
  { value: 'ROLE', label: 'Role', icon: '🎭' },
  { value: 'GROUP', label: 'Group', icon: '👥' },
];

