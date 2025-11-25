import { UserDto } from './api';

// Workflow history

export interface WorkflowHistoryResponse {
  id: number;
  workflowInstanceId: number;
  workflowStepInstanceId?: number;
  stepName?: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  performedBy?: UserDto;
  performedAt: string;
  comment?: string;
  metadataJson?: string;
}

// Workflow instance assignments

export interface WorkflowInstanceAssignmentResponse {
  id: number;
  stepInstanceId: number;
  assigneeType: 'USER' | 'ROLE' | 'GROUP';
  user?: UserDto;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
  group?: {
    id: string;
    name: string;
    description?: string;
  };
  canEdit: boolean;
  assignedBy?: UserDto;
  assignedAt: string;
}

// Workflow timeline

export interface TimelineStep {
  stepInstanceId: number;
  stepName: string;
  stepDescription?: string;
  stepOrder: number;
  status: string;
  assignedUsers: UserDto[];
  startedAt: string;
  completedAt?: string;
  dueDate?: string;
  isOverdue: boolean;
  completedBy?: UserDto;
  comment?: string;
}

export interface WorkflowTimelineResponse {
  instanceId: number;
  workflowName: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  steps: TimelineStep[];
  recentHistory: WorkflowHistoryResponse[];
}

// Reassign request

export interface ReassignStepRequest {
  assignments: {
    assigneeType: 'USER' | 'ROLE' | 'GROUP';
    userId?: string;
    roleId?: string;
    groupId?: string;
    canEdit?: boolean;
  }[];
  reason?: string;
}
