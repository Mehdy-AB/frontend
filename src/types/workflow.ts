import { PageResponse } from './api';

// ==================== ENUMS ====================

export enum WorkflowNodeType {
  END = 'END',
  CANCEL = 'CANCEL',
  APPROVAL = 'APPROVAL',
  REVIEW = 'REVIEW',
  MANUAL_TASK = 'MANUAL_TASK',
  CONDITION = 'CONDITION',
  SPLIT = 'SPLIT',
  JOIN = 'JOIN',
  DELAY = 'DELAY',
  SLA_TIMEOUT = 'SLA_TIMEOUT',
  SLA = 'SLA',
  MOVE_DOCUMENT = 'MOVE_DOCUMENT',
  UPDATE_METADATA = 'UPDATE_METADATA',
  CHANGE_STATUS = 'CHANGE_STATUS',
  NEW_VERSION = 'NEW_VERSION',
  LOCK_DOCUMENT = 'LOCK_DOCUMENT',
  UNLOCK_DOCUMENT = 'UNLOCK_DOCUMENT',
  ARCHIVE_DOCUMENT = 'ARCHIVE_DOCUMENT',
  DELETE_DOCUMENT = 'DELETE_DOCUMENT',
  NOTIFICATION = 'NOTIFICATION',
  API_CALL = 'API_CALL',
  SCRIPT = 'SCRIPT',
  OCR_PROCESS = 'OCR_PROCESS',
  SUB_WORKFLOW = 'SUB_WORKFLOW',
  ERROR_HANDLER = 'ERROR_HANDLER',
  SET_VARIABLE = 'SET_VARIABLE',
  GET_CONTEXT = 'GET_CONTEXT',
  // Aliases
  TASK = 'TASK',
  CHANGE_LIFECYCLE = 'CHANGE_LIFECYCLE',
  SET_METADATA = 'SET_METADATA',
  ARCHIVE = 'ARCHIVE',
  LOCK = 'LOCK',
  START = 'START',
  VERSION_DOCUMENT = 'VERSION_DOCUMENT'
}

export enum NodeStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED'
}

export enum InstanceStatus {
  CREATED = 'CREATED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

export enum AssignmentAction {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVIEWED = 'REVIEWED',
  COMPLETED = 'COMPLETED',
  DELEGATED = 'DELEGATED',
  SEND_BACK = 'SEND_BACK',
  ABSTAINED = 'ABSTAINED',
  NOTIFIED = 'NOTIFIED',
  EMAILED = 'EMAILED'
}

export enum HistoryAction {
  INSTANCE_STARTED = 'INSTANCE_STARTED',
  INSTANCE_COMPLETED = 'INSTANCE_COMPLETED',
  INSTANCE_CANCELLED = 'INSTANCE_CANCELLED',
  INSTANCE_FAILED = 'INSTANCE_FAILED',
  WORKFLOW_STARTED = 'WORKFLOW_STARTED',
  WORKFLOW_COMPLETED = 'WORKFLOW_COMPLETED',
  WORKFLOW_CANCELLED = 'WORKFLOW_CANCELLED',
  STEP_STARTED = 'STEP_STARTED',
  STEP_ACTIVATED = 'STEP_ACTIVATED',
  STEP_COMPLETED = 'STEP_COMPLETED',
  STEP_REJECTED = 'STEP_REJECTED',
  STEP_FAILED = 'STEP_FAILED',
  STEP_EXPIRED = 'STEP_EXPIRED',
  STEP_SKIPPED = 'STEP_SKIPPED',
  STEP_ROLLBACK = 'STEP_ROLLBACK',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_REASSIGNED = 'TASK_REASSIGNED',
  TASK_DELEGATED = 'TASK_DELEGATED',
  TASK_APPROVED = 'TASK_APPROVED',
  TASK_REJECTED = 'TASK_REJECTED',
  TASK_REVIEWED = 'TASK_REVIEWED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_ESCALATED = 'TASK_ESCALATED',
  SLA_TRIGGERED = 'SLA_TRIGGERED',
  DOCUMENT_MOVED = 'DOCUMENT_MOVED',
  DOCUMENT_UPDATED = 'DOCUMENT_UPDATED',
  DOCUMENT_LOCKED = 'DOCUMENT_LOCKED',
  DOCUMENT_UNLOCKED = 'DOCUMENT_UNLOCKED',
  DOCUMENT_VERSIONED = 'DOCUMENT_VERSIONED',
  DOCUMENT_ARCHIVED = 'DOCUMENT_ARCHIVED',
  VARIABLE_SET = 'VARIABLE_SET',
  COMMENT_ADDED = 'COMMENT_ADDED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RETRY_SCHEDULED = 'RETRY_SCHEDULED'
}

// ==================== GRAPH TYPES ====================

export interface ReactFlowGraphDto {
  nodes: WorkflowNodeDto[];
  edges: WorkflowEdgeDto[];
  viewport: ViewportDto;
}

export interface WorkflowNodeDto {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any; // Flexible JSON data
  width?: number;
  height?: number;
  selected?: boolean;
  dragging?: boolean;
}

export interface WorkflowEdgeDto {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  label?: string;
  data?: any;
}

export interface ViewportDto {
  x: number;
  y: number;
  zoom: number;
}


// ==================== RESPONSES (DTOs) ====================

export interface WorkflowResponse {
  id: number;
  name: string;
  description?: string;
  version: number;
  isActive: boolean;
  activeInstancesCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // UUID or Name
}

export interface WorkflowDetailResponse extends WorkflowResponse {
  definitionJson: any; // Raw JSON definition if needed
  graph: ReactFlowGraphDto;
  triggers: WorkflowTriggerResponse[];
  adminUserIds: string[]; // UUIDs
}

export interface WorkflowTriggerResponse {
  id: number;
  workflowId: number;
  eventType: string; // 'DOCUMENT_CREATED', etc.
  folderId?: number;
  folderName?: string;
  documentTypeId?: number;
  documentTypeName?: string;
  conditionJson?: any;
  isActive: boolean;
}

export interface WorkflowInstanceResponse {
  id: number;
  workflowId: number;
  workflowName: string;
  documentId: number;
  documentName: string;
  status: InstanceStatus;
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  startedBy?: string; // Name or UUID
  activeNodeNames: string[];
  currentNodeName?: string; // @deprecated
  progress: number; // 0-100
  variables?: Record<string, any>;
}

export interface WorkflowNodeInstanceResponse {
  id: number;
  workflowInstanceId: number;
  nodeId: string; // UI Node ID
  nodeName: string;
  nodeType: WorkflowNodeType;
  status: NodeStatus;
  startedAt: string;
  completedAt?: string;
  dueDate?: string;
  isOverdue?: boolean; // Derivable or from backend
  assignees: string[]; // Names or descriptions
  assignments: WorkflowInstanceAssignmentResponse[];
  workflowName?: string; // Name of the parent workflow
  description?: string; // Node description/instructions
}

export interface WorkflowInstanceAssignmentResponse {
  id: number;
  assigneeType: 'USER' | 'ROLE' | 'GROUP';
  userId?: string; // UUID (matches backend field name)
  assigneeName?: string; // Display name
  user?: {
    id: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    imgUrl?: string;
    imageUrl?: string;
  };
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
  status: string; // 'PENDING', 'COMPLETED', etc.
  action?: AssignmentAction;
  comment?: string;
  actedAt?: string;
}

export interface WorkflowHistoryResponse {
  id: number;
  workflowInstanceId: number;
  action: HistoryAction;
  performedBy?: string; // Name
  performedByUserId?: string; // UUID
  performedAt: string;
  comment?: string;
  details?: string;
  nodeName?: string;
}

export interface WorkflowTimelineResponse {
  instanceId: number;
  workflowName: string;
  status: InstanceStatus;
  startedAt: string;
  completedAt?: string;
  totalNodes: number;
  completedNodes: number;
  progressPercentage: number;
  nodes: WorkflowNodeInstanceResponse[];
  recentHistory: WorkflowHistoryResponse[];
}

export interface WorkflowInstanceStateResponse {
  instanceId: number;
  workflowId: number;
  status: InstanceStatus;
  startedAt: string;
  completedAt?: string;
  nodeStates: NodeStateDto[];
  activeNodeIds: string[];
  completedNodeIds: string[];
  scheduledNodeIds: string[];
  errorNodeIds: string[];
}

export interface NodeStateDto {
  nodeInstanceId: number;
  nodeId: string;
  nodeType: string;
  nodeName: string;
  status: NodeStatus;
  startedAt: string;
  completedAt?: string;
  dueDate?: string;
}

export interface WorkflowNodeInstanceDetailResponse {
  id: number;
  workflowInstanceId: number;
  nodeId: string;
  nodeName: string;
  nodeType: WorkflowNodeType;
  status: NodeStatus;
  startedAt: string;
  completedAt?: string;
  config: any; // Node configuration
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  logs: WorkflowHistoryResponse[];
}

export interface WorkflowAdminResponse {
  workflowId: number;
  userId: string;
  canEdit: boolean;
  canViewHistory: boolean;
  canCancel: boolean;
  canForceComplete: boolean;
  canReassign: boolean;
}

export interface BatchOperationResult {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  errors: { itemId: number; errorMessage: string }[];
}

export interface NodeStatisticsResponse {
  nodeId: string;
  nodeName: string;
  totalExecutions: number;
  avgDurationMs: number;
  failureRate: number;
}

export interface NodeDocumentResponse {
  documentId: number;
  documentName: string;
  folderId?: number;
  instanceId: number;
  nodeInstanceId: number;
  arrivedAt: string;
  dueDate?: string;
  assignedTo: string[];
}

export interface WorkflowStatisticsResponse {
  workflowId: number;
  totalInstances: number;
  activeInstances: number;
  completedInstances: number;
  failedInstances: number;
  avgCompletionTimeSeconds: number;
}

// ==================== REQUESTS (DTOs) ====================

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  definitionJson?: any;
  steps?: any[];
  trigger?: any;
  admins?: string[]; // IDs
  workflowDefinitionJson?: string;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  definitionJson?: any;
  isActive?: boolean;
  steps?: any[];
  trigger?: any;
  admins?: string[]; // IDs
  workflowDefinitionJson?: string;
}

export interface StartWorkflowInstanceRequest {
  workflowId: number;
  documentId: number;
  variables?: Record<string, any>;
}

export interface CompleteStepRequest {
  action?: string; // 'APPROVE', 'REJECT', etc. (custom labels)
  comment?: string;
  variables?: Record<string, any>;
}

export interface RejectStepRequest {
  rejectionReason: string;
}

export interface ReassignStepRequest {
  assignments: {
    assigneeType: 'USER' | 'ROLE' | 'GROUP';
    userId?: string; // UUID
    roleId?: string; // UUID
    groupId?: string; // UUID
    canEdit?: boolean;
  }[];
  reason?: string;
}

export interface UpdateStepDueDateRequest {
  dueDate: string; // ISO-8601
}

export interface CancelWorkflowInstanceRequest {
  cancellationReason: string;
}

export interface ForceCompleteWorkflowRequest {
  comment?: string;
}

export interface RollbackStepRequest {
  targetNodeId: string;
  reason: string;
}

export interface AddWorkflowTriggerRequest {
  workflowId: number;
  eventType: string;
  folderId?: number;
  documentTypeId?: number;
  conditionJson?: any;
}

export interface UpdateWorkflowTriggerRequest {
  eventType?: string;
  folderId?: number;
  documentTypeId?: number;
  conditionJson?: any;
  isActive?: boolean;
}

export interface AddWorkflowAdminRequest {
  userId: string;
  canEdit?: boolean;
  canViewHistory?: boolean;
  canCancel?: boolean;
  canForceComplete?: boolean;
  canReassign?: boolean;
}

export interface BatchCancelInstancesRequest {
  instanceIds: number[];
  reason: string;
}

export interface BatchReassignStepsRequest {
  stepInstanceIds: number[];
  reassignRequest: ReassignStepRequest;
}

export interface ApplyWorkflowChangesRequest {
  applyToExistingInstances: boolean;
}

export interface SetVariableRequest {
  value: any;
}

export interface BulkInstanceOperationRequest {
  instanceIds: number[];
  reason?: string; // For cancel
  comment?: string; // For force complete
}

export interface BulkReassignRequest {
  userIds?: string[];
  groupIds?: string[];
}
