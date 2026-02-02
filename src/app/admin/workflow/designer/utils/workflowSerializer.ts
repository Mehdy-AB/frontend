/**
 * Workflow Serializer
 * Converts frontend React Flow node/edge data to backend DTO format
 */

import { Node, Edge } from '@xyflow/react';
import { WorkflowNodeData } from '../nodes/types';

// Backend node types from WorkflowNodeType.java
export type BackendNodeType =
    | 'END'
    | 'CANCEL'
    | 'APPROVAL'
    | 'REVIEW'
    | 'MANUAL_TASK'
    | 'CONDITION'
    | 'SPLIT'
    | 'JOIN'
    | 'DELAY'
    | 'SLA_TIMEOUT'
    | 'SLA'
    | 'MOVE_DOCUMENT'
    | 'UPDATE_METADATA'
    | 'CHANGE_STATUS'
    | 'NEW_VERSION'
    | 'LOCK_DOCUMENT'
    | 'UNLOCK_DOCUMENT'
    | 'ARCHIVE_DOCUMENT'
    | 'DELETE_DOCUMENT'
    | 'NOTIFICATION'
    | 'API_CALL'
    | 'SCRIPT'
    | 'OCR_PROCESS'
    | 'SUB_WORKFLOW'
    | 'ERROR_HANDLER'
    | 'SET_VARIABLE'
    | 'GET_CONTEXT'
    | 'TASK'
    | 'STAMP_DOCUMENT'
    | 'EMAIL';

// Frontend to backend node type mapping
const FRONTEND_TO_BACKEND_NODE_TYPE: Record<string, BackendNodeType> = {
    startNode: 'MANUAL_TASK', // Start is represented as the initial task
    triggerNode: 'MANUAL_TASK',
    workflowStep: 'APPROVAL',
    firstStep: 'APPROVAL',
    finishNode: 'END',
    endSuccessNode: 'END',
    endFailureNode: 'CANCEL',
    conditionalNode: 'CONDITION',
    delayNode: 'DELAY',
    moveDocumentNode: 'MOVE_DOCUMENT',
    stampNode: 'STAMP_DOCUMENT',
    notificationNode: 'NOTIFICATION',
    emailNode: 'EMAIL',
    slaNode: 'SLA',
    apiCallNode: 'API_CALL',
    subWorkflowNode: 'SUB_WORKFLOW',
    setVariableNode: 'SET_VARIABLE',
    scriptNode: 'SCRIPT',
    ocrNode: 'OCR_PROCESS',
    archiveNode: 'ARCHIVE_DOCUMENT',
    deleteNode: 'DELETE_DOCUMENT',
};

// Serialized node DTO for backend
export interface WorkflowNodeDto {
    id: string;
    name: string;
    description?: string;
    nodeType: BackendNodeType;
    positionX: number;
    positionY: number;
    priority?: string;
    expirationDays?: number;
    isRequired?: boolean;
    allowParallelApproval?: boolean;
    minApprovalsNeeded?: number;
    nodeConfigJson?: string;
    assignments?: WorkflowAssignmentDto[];
}

export interface WorkflowAssignmentDto {
    assigneeType: 'USER' | 'ROLE' | 'GROUP';
    assigneeId: number | string;
}

// Serialized edge DTO for backend
export interface WorkflowEdgeDto {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    label?: string;
    conditionExpression?: string;
}

/**
 * Serialize node configuration to JSON string based on node type
 */
function serializeNodeConfig(node: Node<WorkflowNodeData>): string | undefined {
    const data = node.data;
    const type = node.type || '';

    const config: Record<string, any> = {};

    switch (type) {
        case 'triggerNode':
        case 'startNode':
            if (data.triggerConfig) {
                config.triggerType = data.triggerConfig.triggerType;
                config.triggerFolderId = data.triggerConfig.folderId;
                config.triggerFolderName = data.triggerConfig.folderName;
                config.triggerCategoryId = data.triggerConfig.categoryId;
                config.triggerCategoryName = data.triggerConfig.categoryName;
            }
            break;

        case 'conditionalNode':
            config.conditionGroups = data.conditionGroups || [];
            config.conditionExpression = data.conditionExpression;
            break;

        case 'delayNode':
            config.delayType = data.delayType;
            config.delayValue = data.delayValue;
            config.delayMinutes = data.delayMinutes;
            config.delayHours = data.delayHours;
            config.delayDays = data.delayDays;
            break;

        case 'moveDocumentNode':
            config.targetFolderId = data.destinationFolderId;
            config.targetFolderName = data.destinationFolderName;
            config.targetFolderPath = data.destinationFolderPath;
            break;

        case 'stampNode':
            config.stampId = data.stampId;
            config.stampName = data.stampName;
            break;

        case 'notificationNode':
            config.recipients = data.recipients;
            config.notificationTitle = data.notificationTitle;
            config.notificationMessage = data.notificationMessage;
            break;

        case 'emailNode':
            config.emailRecipients = data.emailRecipients;
            config.emailSubject = data.emailSubject;
            config.emailBody = data.emailBody;
            config.attachDocument = data.attachDocument;
            config.ccRecipients = data.ccRecipients;
            break;

        case 'slaNode':
            config.slaDueHours = data.slaDueHours;
            config.slaOnTimeout = data.slaOnTimeout;
            config.escalationAction = data.escalationAction;
            config.warningThreshold = data.warningThreshold;
            break;

        case 'apiCallNode':
            config.apiMethod = data.apiMethod;
            config.apiUrl = data.apiUrl;
            config.apiHeaders = data.apiHeaders;
            config.apiBody = data.apiBody;
            config.apiTimeout = data.apiTimeout;
            config.apiRetryCount = data.apiRetryCount;
            break;

        case 'subWorkflowNode':
            config.subWorkflowId = data.subWorkflowId;
            config.subWorkflowName = data.subWorkflowName;
            config.waitForCompletion = data.waitForCompletion;
            config.passDocument = data.passDocument;
            break;

        case 'setVariableNode':
            config.variableName = data.variableName;
            config.variableValue = data.variableValue;
            config.variableType = data.variableType;
            config.variableScope = data.variableScope;
            break;

        case 'scriptNode':
            config.scriptLanguage = data.scriptLanguage;
            config.scriptCode = data.scriptCode;
            config.scriptTimeout = data.scriptTimeout;
            config.scriptOutputVariable = data.scriptOutputVariable;
            break;

        case 'ocrNode':
            config.ocrEngine = data.ocrEngine;
            config.ocrLanguages = data.ocrLanguages;
            config.ocrOutputVariable = data.ocrOutputVariable;
            config.ocrSaveToMetadata = data.ocrSaveToMetadata;
            config.ocrEnhanceImage = data.ocrEnhanceImage;
            break;

        case 'archiveNode':
            config.archivePolicy = data.archivePolicy;
            config.retentionValue = data.retentionValue;
            config.retentionUnit = data.retentionUnit;
            config.archiveLockDocument = data.archiveLockDocument;
            config.archiveNotifyOwner = data.archiveNotifyOwner;
            break;

        case 'deleteNode':
            config.deleteType = data.deleteType;
            config.deleteNotifyOwner = data.deleteNotifyOwner;
            config.deleteRequireConfirmation = data.deleteRequireConfirmation;
            config.softDelete = data.softDelete;
            break;

        case 'endSuccessNode':
            config.endType = 'SUCCESS';
            config.endMessage = data.endMessage;
            break;

        case 'endFailureNode':
            config.endType = 'FAILURE';
            config.endMessage = data.endMessage;
            break;
    }

    // Only return if there's actual config
    if (Object.keys(config).length > 0) {
        return JSON.stringify(config);
    }
    return undefined;
}

/**
 * Serialize a frontend node to backend DTO format
 */
export function serializeNode(node: Node<WorkflowNodeData>): WorkflowNodeDto {
    const data = node.data;
    const backendType = FRONTEND_TO_BACKEND_NODE_TYPE[node.type || ''] || 'MANUAL_TASK';

    const dto: WorkflowNodeDto = {
        id: node.id,
        name: data.label || `Node ${node.id}`,
        description: data.description,
        nodeType: backendType,
        positionX: Math.round(node.position.x),
        positionY: Math.round(node.position.y),
        priority: data.priority,
        expirationDays: data.expirationDays,
        isRequired: data.isRequired,
        allowParallelApproval: data.allowParallelApproval,
        minApprovalsNeeded: data.minApprovalsNeeded,
        nodeConfigJson: serializeNodeConfig(node),
    };

    // Serialize assignments if present
    if (data.assignments && data.assignments.length > 0) {
        dto.assignments = data.assignments.map((a: any) => ({
            assigneeType: a.assigneeType,
            assigneeId: a.assigneeId,
        }));
    }

    return dto;
}

/**
 * Serialize a frontend edge to backend DTO format
 */
export function serializeEdge(edge: Edge): WorkflowEdgeDto {
    return {
        id: edge.id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        label: edge.label as string | undefined,
        conditionExpression: (edge.data as { conditionExpression?: string } | undefined)?.conditionExpression,
    };
}

/**
 * Serialize entire workflow (nodes + edges) for backend
 */
export function serializeWorkflow(
    nodes: Node<WorkflowNodeData>[],
    edges: Edge[]
): { nodes: WorkflowNodeDto[]; edges: WorkflowEdgeDto[] } {
    return {
        nodes: nodes.map(serializeNode),
        edges: edges.map(serializeEdge),
    };
}

/**
 * Validate serialized workflow before saving
 */
export function validateSerializedWorkflow(
    nodes: WorkflowNodeDto[],
    edges: WorkflowEdgeDto[]
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for at least one start-type node
    const hasStart = nodes.some((n) =>
        n.id === 'start-node' || n.id.includes('trigger')
    );
    if (!hasStart) {
        errors.push('Workflow must have a START node');
    }

    // Check for at least one end-type node
    const hasEnd = nodes.some((n) => n.nodeType === 'END' || n.nodeType === 'CANCEL');
    if (!hasEnd) {
        errors.push('Workflow must have at least one END node');
    }

    // Check all nodes have names
    nodes.forEach((n) => {
        if (!n.name || n.name.trim() === '') {
            errors.push(`Node ${n.id} must have a name`);
        }
    });

    // Check edges reference valid nodes
    const nodeIds = new Set(nodes.map((n) => n.id));
    edges.forEach((e) => {
        if (!nodeIds.has(e.sourceNodeId)) {
            errors.push(`Edge ${e.id} references non-existent source ${e.sourceNodeId}`);
        }
        if (!nodeIds.has(e.targetNodeId)) {
            errors.push(`Edge ${e.id} references non-existent target ${e.targetNodeId}`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

export default {
    serializeNode,
    serializeEdge,
    serializeWorkflow,
    validateSerializedWorkflow,
};
