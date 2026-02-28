import { apiClient } from '../client';
import { PageResponse } from '../../types/api';
import {
    WorkflowInstanceResponse,
    WorkflowNodeInstanceResponse,
    WorkflowHistoryResponse,
    WorkflowTimelineResponse,
    StartWorkflowInstanceRequest,
    CompleteStepRequest,
    RejectStepRequest,
    WorkflowInstanceStateResponse,
    NodeStatisticsResponse
} from '../../types/workflow';

class WorkflowService {
    private baseUrl = '/api/v1/workflows';

    // ==================== INSTANCE OPERATIONS ====================

    async startWorkflowInstance(data: StartWorkflowInstanceRequest): Promise<WorkflowInstanceResponse> {
        return apiClient.post<WorkflowInstanceResponse>(`${this.baseUrl}/instances`, data);
    }

    async getWorkflowInstance(id: number): Promise<WorkflowInstanceResponse> {
        return apiClient.get<WorkflowInstanceResponse>(`${this.baseUrl}/instances/${id}`);
    }

    async getWorkflowInstanceByDocumentId(documentId: number): Promise<WorkflowInstanceResponse> {
        return apiClient.get<WorkflowInstanceResponse>(`${this.baseUrl}/documents/${documentId}/instance`);
    }

    async getAllWorkflowInstancesForDocument(documentId: number): Promise<WorkflowInstanceResponse[]> {
        return apiClient.get<WorkflowInstanceResponse[]>(`${this.baseUrl}/documents/${documentId}/instances`);
    }

    async getUserInstances(
        page: number = 0,
        size: number = 20
    ): Promise<PageResponse<WorkflowInstanceResponse>> {
        return apiClient.get<PageResponse<WorkflowInstanceResponse>>(`${this.baseUrl}/instances/my`, {
            params: { page, size }
        });
    }

    async getPendingNodes(): Promise<WorkflowNodeInstanceResponse[]> {
        return apiClient.get<WorkflowNodeInstanceResponse[]>(`${this.baseUrl}/nodes/pending`);
    }

    async getActiveNodes(
        page: number = 0,
        size: number = 20,
        search?: string
    ): Promise<PageResponse<WorkflowNodeInstanceResponse>> {
        return apiClient.get<PageResponse<WorkflowNodeInstanceResponse>>(`${this.baseUrl}/nodes/active`, {
            params: { page, size, search }
        });
    }

    // ==================== TASK ACTIONS ====================

    async completeNode(
        nodeInstanceId: number,
        data: CompleteStepRequest
    ): Promise<WorkflowNodeInstanceResponse> {
        return apiClient.post<WorkflowNodeInstanceResponse>(
            `${this.baseUrl}/nodes/${nodeInstanceId}/complete`,
            data
        );
    }

    async rejectNode(
        nodeInstanceId: number,
        data: RejectStepRequest
    ): Promise<WorkflowNodeInstanceResponse> {
        return apiClient.post<WorkflowNodeInstanceResponse>(
            `${this.baseUrl}/nodes/${nodeInstanceId}/reject`,
            data
        );
    }

    // ==================== HISTORY & TIMELINE ====================

    async getInstanceHistory(instanceId: number): Promise<WorkflowHistoryResponse[]> {
        return apiClient.get<WorkflowHistoryResponse[]>(`${this.baseUrl}/instances/${instanceId}/history`);
    }

    async getInstanceTimeline(instanceId: number): Promise<WorkflowTimelineResponse> {
        return apiClient.get<WorkflowTimelineResponse>(`${this.baseUrl}/instances/${instanceId}/timeline`);
    }

    // ==================== STATE & METADATA ====================

    async getInstanceState(instanceId: number): Promise<WorkflowInstanceStateResponse> {
        return apiClient.get<WorkflowInstanceStateResponse>(`${this.baseUrl}/instances/${instanceId}/state`);
    }

    // ==================== ADMIN ACTIONS ====================

    async forceCompleteWorkflowInstance(instanceId: number, comment?: string): Promise<void> {
        return apiClient.post<void>(`${this.baseUrl}/instances/${instanceId}/force-complete`, { comment });
    }

    async cancelWorkflowInstance(instanceId: number, reason: string): Promise<void> {
        return apiClient.post<void>(`${this.baseUrl}/instances/${instanceId}/cancel`, { reason });
    }

    async reassignStep(
        instanceId: number,
        nodeInstanceId: number,
        data: { assignments: any[]; reason: string }
    ): Promise<void> {
        return apiClient.post<void>(
            `${this.baseUrl}/instances/${instanceId}/nodes/${nodeInstanceId}/reassign`,
            data
        );
    }
}

export const workflowService = new WorkflowService();
