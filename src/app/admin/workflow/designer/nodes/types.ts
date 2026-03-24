import { Node } from '@xyflow/react';

// Condition types for ConditionalNode
export type ConditionProperty =
  | 'documentName'
  | 'fileSize'
  | 'mimeType'
  | 'filingCategory'
  | 'metadata'
  | 'createdDate'
  | 'variable';

export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'in'
  | 'before'
  | 'after';

export interface WorkflowCondition {
  id: string;
  property: ConditionProperty;
  operator: ConditionOperator;
  value: string | number | string[];
  secondaryValue?: string | number; // For 'between' operator
  metadataFieldId?: number; // For metadata conditions
  metadataFieldName?: string;
  metadataDataType?: string; // e.g. STRING, NUMBER, DATE, DATETIME, BOOLEAN, LIST
  categoryId?: number;
  variableKey?: string;  // For workflow variable conditions
  variableType?: string; // e.g. STRING, NUMBER, DATE, BOOLEAN, etc.
}

export interface ConditionGroup {
  logic: 'AND' | 'OR';
  conditions: WorkflowCondition[];
}

// Recipient types for Notification/Email nodes
export interface NotificationRecipient {
  id: string;
  type: 'USER' | 'ROLE' | 'GROUP';
  name: string;
  entity?: any; // Full entity object
}

// Trigger configuration
export interface TriggerConfig {
  triggerType: 'FOLDER' | 'MODEL';
  folderId?: number;
  folderName?: string;
  categoryId?: number;
  categoryName?: string;
}

export interface WorkflowNodeData {
  label?: string;
  description?: string;
  isValid?: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  isFirstStep?: boolean;

  // For WorkflowStepNode (Approval)
  expirationDays?: number;
  allowParallelApproval?: boolean;
  minApprovalsNeeded?: number;
  assignments?: any[];
  assignmentEntities?: Array<{
    assigneeType: 'USER' | 'ROLE' | 'GROUP';
    assigneeId: string;
    entity: any;
  }>;
  onCompleteAction?: 'NONE' | 'MOVE_TO_FOLDER' | 'NOTIFY_USERS' | 'COMPLETE_WORKFLOW';
  targetFolderId?: number;
  targetFolderName?: string;
  isRequired?: boolean;

  // For TriggerNode / StartNode
  triggerConfig?: TriggerConfig;

  // For ConditionalNode
  conditionExpression?: string; // Human-readable expression
  conditionGroups?: ConditionGroup[];

  // For MoveDocumentNode
  destinationFolderId?: number;
  destinationFolderName?: string;
  destinationFolderPath?: string;

  // For StampNode
  stampId?: number;
  stampName?: string;
  stampPreviewUrl?: string;

  // For DelayNode
  delayDuration?: string; // Display format: "2h 30m"
  delayMinutes?: number;
  delayHours?: number;
  delayDays?: number;
  delayType?: 'MINUTES' | 'HOURS' | 'DAYS';
  delayValue?: number;

  // For NotificationNode
  recipients?: NotificationRecipient[];
  notificationTitle?: string;
  notificationMessage?: string;

  // For EmailNode
  emailRecipients?: NotificationRecipient[];
  emailSubject?: string;
  emailBody?: string;
  attachDocument?: boolean;
  ccRecipients?: NotificationRecipient[];

  // For EndNode
  endType?: 'SUCCESS' | 'FAILURE';
  endMessage?: string;

  // Timeout configuration (shared by human task nodes: APPROVAL, REVIEW, MANUAL_TASK)
  timeoutEnabled?: boolean;
  timeoutValue?: number;
  timeoutUnit?: 'HOURS' | 'DAYS';
  timeoutAction?: string;
  useTimeoutExit?: boolean;

  // Escalation target (when timeout action is ESCALATE)
  escalationTarget?: any[];
  escalationTargetEntities?: any[];
  // For ApiCallNode
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiUrl?: string;
  apiHeaders?: { key: string; value: string }[];
  apiBody?: string;
  apiTimeout?: number;
  apiRetryCount?: number;

  // For SubWorkflowNode
  subWorkflowId?: number | null;
  subWorkflowName?: string;
  waitForCompletion?: boolean;
  passDocument?: boolean;

  // For SetVariableNode
  variableName?: string;
  variableValue?: string;
  variableType?: string;
  variableScope?: string;

  // For ScriptNode
  scriptName?: string;
  scriptContent?: string;
  scriptLanguage?: string;
  scriptCode?: string;
  scriptTimeout?: number;
  scriptOutputVariable?: string;

  // For OcrNode
  ocrEngine?: string;
  ocrLanguage?: string;
  ocrLanguages?: string[];
  ocrOutputField?: string;
  ocrOutputVariable?: string;
  ocrSaveToMetadata?: boolean;
  ocrEnhanceImage?: boolean;

  // For ArchiveNode
  archiveFolderId?: number;
  archiveFolderName?: string;
  archivePolicy?: string;
  retentionValue?: number;
  retentionUnit?: string;
  archiveLockDocument?: boolean;
  archiveNotifyOwner?: boolean;

  // For DeleteNode
  softDelete?: boolean;
  deleteType?: string;
  deleteNotifyOwner?: boolean;
  deleteRequireConfirmation?: boolean;

  // Callbacks
  onEdit?: () => void;
  onDelete?: () => void;

  // Allow additional properties
  [key: string]: any;
}

export type WorkflowNode = Node<WorkflowNodeData>;

// Node type constants - aligned with backend WorkflowNodeType.java
export const NodeTypes = {
  // Entry
  START: 'startNode',
  TRIGGER: 'triggerNode',

  // Human Tasks
  APPROVAL: 'approvalNode',
  WORKFLOW_STEP: 'workflowStep', // Alias for APPROVAL
  REVIEW: 'reviewNode',
  MANUAL_TASK: 'manualTaskNode',

  // Logic / Flow
  CONDITIONAL: 'conditionalNode',
  SPLIT: 'splitNode',
  JOIN: 'joinNode',

  // Time / Scheduling
  DELAY: 'delayNode',


  // Document Actions
  MOVE_DOCUMENT: 'moveDocumentNode',
  UPDATE_METADATA: 'updateMetadataNode',
  CHANGE_STATUS: 'changeStatusNode',
  NEW_VERSION: 'newVersionNode',
  LOCK_DOCUMENT: 'lockDocumentNode',
  UNLOCK_DOCUMENT: 'unlockDocumentNode',
  ARCHIVE: 'archiveNode',
  DELETE: 'deleteNode',
  STAMP: 'stampNode',

  // Communication
  NOTIFICATION: 'notificationNode',
  EMAIL: 'emailNode',

  // Integration
  API_CALL: 'apiCallNode',
  SCRIPT: 'scriptNode',
  OCR: 'ocrNode',
  SUB_WORKFLOW: 'subWorkflowNode',

  // Variables
  SET_VARIABLE: 'setVariableNode',
  GET_CONTEXT: 'getContextNode',

  // Flow Control / Termination
  END: 'endNode',
  CANCEL: 'cancelNode',
  ERROR_HANDLER: 'errorHandlerNode',
  END_SUCCESS: 'endSuccessNode',
  END_FAILURE: 'endFailureNode',
  FINISH: 'finishNode',
} as const;

export type NodeType = typeof NodeTypes[keyof typeof NodeTypes];

