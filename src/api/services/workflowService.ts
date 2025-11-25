import { apiClient } from '../client';
import {
  WorkflowResponse,
  WorkflowDetailResponse,
  WorkflowInstanceResponse,
  WorkflowStepInstanceResponse,
  WorkflowAdminResponse,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  StartWorkflowInstanceRequest,
  CompleteStepRequest,
  RejectStepRequest,
  AddWorkflowAdminRequest,
  AddWorkflowTriggerRequest,
  WorkflowTriggerResponse,
  UpdateWorkflowTriggerRequest,
  PageResponse,
  BatchOperationResult,
} from '../../types/api';
import {
  WorkflowHistoryResponse,
  WorkflowInstanceAssignmentResponse,
  WorkflowTimelineResponse,
  ReassignStepRequest,
} from '../../types/workflow';

export class WorkflowService {
  private baseUrl = '/api/v1/workflows';

  // ==================== WORKFLOW CRUD ====================

  async createWorkflow(request: CreateWorkflowRequest): Promise<WorkflowDetailResponse> {
    return apiClient.post<WorkflowDetailResponse>(this.baseUrl, request);
  }

  async getWorkflow(id: number): Promise<WorkflowDetailResponse> {
    return apiClient.get<WorkflowDetailResponse>(`${this.baseUrl}/${id}`);
  }



  async getAllWorkflows(
    page: number = 0,
    size: number = 20,
    search?: string,
    isActive?: boolean
  ): Promise<PageResponse<WorkflowResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (search) params.append('search', search);
    if (isActive !== undefined) params.append('isActive', isActive.toString());

    return apiClient.get<PageResponse<WorkflowResponse>>(`${this.baseUrl}?${params}`);
  }

  async updateWorkflow(id: number, request: UpdateWorkflowRequest): Promise<WorkflowDetailResponse> {
    return apiClient.put<WorkflowDetailResponse>(`${this.baseUrl}/${id}`, request);
  }

  async applyWorkflowChanges(
    workflowId: number,
    applyToExistingInstances: boolean,
    instanceIds?: number[],
    reason?: string
  ): Promise<BatchOperationResult> {
    return apiClient.post<BatchOperationResult>(`${this.baseUrl}/${workflowId}/apply-changes`, {
      applyToExistingInstances,
      instanceIds,
      reason,
    });
  }

  async deleteWorkflow(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  async getAdminedWorkflows(
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<WorkflowResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    return apiClient.get<PageResponse<WorkflowResponse>>(`${this.baseUrl}/admined?${params}`);
  }

  // ==================== WORKFLOW INSTANCES ====================

  async startWorkflowInstance(request: StartWorkflowInstanceRequest): Promise<WorkflowInstanceResponse> {
    return apiClient.post<WorkflowInstanceResponse>(`${this.baseUrl}/instances`, request);
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

  async getWorkflowInstances(
    workflowId: number,
    page: number = 0,
    size: number = 20,
    search?: string,
    status?: string
  ): Promise<PageResponse<WorkflowInstanceResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);

    return apiClient.get<PageResponse<WorkflowInstanceResponse>>(`${this.baseUrl}/${workflowId}/instances?${params}`);
  }

  async getUserInstances(
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<WorkflowInstanceResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    return apiClient.get<PageResponse<WorkflowInstanceResponse>>(`${this.baseUrl}/instances/my?${params}`);
  }

  async getPendingSteps(): Promise<WorkflowStepInstanceResponse[]> {
    return apiClient.get<WorkflowStepInstanceResponse[]>(`${this.baseUrl}/steps/pending`);
  }

  async getActiveSteps(
    page: number = 0,
    size: number = 20,
    search?: string,
    priority?: string
  ): Promise<PageResponse<WorkflowStepInstanceResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (search) params.append('search', search);
    if (priority && priority !== 'all') params.append('priority', priority);

    return apiClient.get<PageResponse<WorkflowStepInstanceResponse>>(`${this.baseUrl}/steps/active?${params}`);
  }

  async getDocumentSteps(documentId: number): Promise<WorkflowStepInstanceResponse[]> {
    return apiClient.get<WorkflowStepInstanceResponse[]>(`${this.baseUrl}/documents/${documentId}/steps`);
  }

  async completeStep(stepInstanceId: number, request: CompleteStepRequest): Promise<WorkflowStepInstanceResponse> {
    return apiClient.post<WorkflowStepInstanceResponse>(
      `${this.baseUrl}/steps/${stepInstanceId}/complete`,
      request
    );
  }

  async rejectStep(stepInstanceId: number, request: RejectStepRequest): Promise<WorkflowStepInstanceResponse> {
    return apiClient.post<WorkflowStepInstanceResponse>(
      `${this.baseUrl}/steps/${stepInstanceId}/reject`,
      request
    );
  }

  async getInstanceHistory(instanceId: number): Promise<WorkflowHistoryResponse[]> {
    return apiClient.get<WorkflowHistoryResponse[]>(`${this.baseUrl}/instances/${instanceId}/history`);
  }

  async getInstanceTimeline(instanceId: number): Promise<WorkflowTimelineResponse> {
    return apiClient.get<WorkflowTimelineResponse>(`${this.baseUrl}/instances/${instanceId}/timeline`);
  }

  async getStepInstanceAssignments(stepInstanceId: number): Promise<WorkflowInstanceAssignmentResponse[]> {
    return apiClient.get<WorkflowInstanceAssignmentResponse[]>(`${this.baseUrl}/instances/steps/${stepInstanceId}/assignments`);
  }

  async reassignStep(
    instanceId: number,
    stepInstanceId: number,
    request: ReassignStepRequest
  ): Promise<WorkflowStepInstanceResponse> {
    return apiClient.post<WorkflowStepInstanceResponse>(
      `${this.baseUrl}/instances/${instanceId}/steps/${stepInstanceId}/reassign`,
      request
    );
  }

  async cancelWorkflowInstance(instanceId: number, reason: string): Promise<void> {
    return apiClient.post<void>(`${this.baseUrl}/instances/${instanceId}/cancel`, { reason });
  }

  async forceCompleteWorkflowInstance(instanceId: number, comment?: string): Promise<void> {
    return apiClient.post<void>(`${this.baseUrl}/instances/${instanceId}/force-complete`, { comment });
  }

  async updateStepDueDate(
    instanceId: number,
    stepInstanceId: number,
    dueDate: string,
    reason?: string
  ): Promise<WorkflowStepInstanceResponse> {
    return apiClient.patch<WorkflowStepInstanceResponse>(
      `${this.baseUrl}/instances/${instanceId}/steps/${stepInstanceId}/due-date`,
      { dueDate, reason }
    );
  }

  async batchCancelInstances(instanceIds: number[], reason: string): Promise<BatchOperationResult> {
    return apiClient.post<BatchOperationResult>(`${this.baseUrl}/instances/batch/cancel`, {
      instanceIds,
      reason,
    });
  }

  async batchReassignSteps(
    instanceId: number,
    stepInstanceIds: number[],
    assignments: any[],
    reason?: string
  ): Promise<BatchOperationResult> {
    return apiClient.post<BatchOperationResult>(
      `${this.baseUrl}/instances/${instanceId}/steps/batch/reassign`,
      { stepInstanceIds, assignments, reason }
    );
  }

  // ==================== WORKFLOW ADMINS ====================

  async addWorkflowAdmin(workflowId: number, request: AddWorkflowAdminRequest): Promise<WorkflowAdminResponse> {
    return apiClient.post<WorkflowAdminResponse>(`${this.baseUrl}/${workflowId}/admins`, request);
  }

  async removeWorkflowAdmin(workflowId: number, userId: string): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${workflowId}/admins/${userId}`);
  }

  async updateWorkflowAdmin(
    workflowId: number,
    userId: string,
    request: AddWorkflowAdminRequest
  ): Promise<WorkflowAdminResponse> {
    return apiClient.put<WorkflowAdminResponse>(`${this.baseUrl}/${workflowId}/admins/${userId}`, request);
  }

  // ==================== WORKFLOW TRIGGERS ====================

  async addWorkflowTrigger(request: AddWorkflowTriggerRequest): Promise<WorkflowTriggerResponse> {
    return apiClient.post<WorkflowTriggerResponse>(`${this.baseUrl}/triggers`, request);
  }

  async getWorkflowTriggers(workflowId: number): Promise<WorkflowTriggerResponse[]> {
    return apiClient.get<WorkflowTriggerResponse[]>(`${this.baseUrl}/triggers/workflow/${workflowId}`);
  }

  async updateWorkflowTrigger(triggerId: number, request: UpdateWorkflowTriggerRequest): Promise<WorkflowTriggerResponse> {
    return apiClient.put<WorkflowTriggerResponse>(`${this.baseUrl}/triggers/${triggerId}`, request);
  }

  async deleteWorkflowTrigger(triggerId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/triggers/${triggerId}`);
  }

  async rollbackToStep(
    instanceId: number,
    request: { targetStepId: number; reason: string }
  ): Promise<WorkflowInstanceResponse> {
    return apiClient.post<WorkflowInstanceResponse>(
      `${this.baseUrl}/instances/${instanceId}/rollback`,
      request
    );
  }
}

export const workflowService = new WorkflowService();
