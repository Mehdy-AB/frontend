/**
 * Workflow Admin Service - Comprehensive API client for Workflow Management
 * Matches backend WorkflowController endpoints
 */

import { apiClient } from '../client';
import { PageResponse } from '../../types/api';
import {
  WorkflowDetailResponse,
  WorkflowResponse,
  WorkflowInstanceResponse,
  WorkflowNodeInstanceResponse,
  WorkflowHistoryResponse,
  WorkflowTriggerResponse,
  WorkflowTimelineResponse,
  ReactFlowGraphDto,
  WorkflowInstanceStateResponse,
  WorkflowNodeInstanceDetailResponse,
  NodeStatisticsResponse,
  NodeDocumentResponse,
  WorkflowStatisticsResponse,
  WorkflowAdminResponse,
  BatchOperationResult,
  WorkflowInstanceAssignmentResponse,
  // Requests
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  AddWorkflowTriggerRequest,
  UpdateWorkflowTriggerRequest,
  ApplyWorkflowChangesRequest,
  StartWorkflowInstanceRequest,
  CompleteStepRequest,
  RejectStepRequest,
  ReassignStepRequest,
  UpdateStepDueDateRequest,
  BatchCancelInstancesRequest,
  BatchReassignStepsRequest,
  CancelWorkflowInstanceRequest,
  ForceCompleteWorkflowRequest,
  RollbackStepRequest,
  AddWorkflowAdminRequest,
  SetVariableRequest,
  BulkInstanceOperationRequest,
  BulkReassignRequest
} from '../../types/workflow';
import { InstanceStatus, NodeStatus } from '../../types/workflow';

class WorkflowAdminService {
  private baseUrl = '/api/v1/workflows';

  // ==================== WORKFLOW CRUD ====================

  async createWorkflow(data: CreateWorkflowRequest): Promise<WorkflowDetailResponse> {
    return apiClient.post<WorkflowDetailResponse>(this.baseUrl, data);
  }

  async getWorkflow(id: number): Promise<WorkflowDetailResponse> {
    return apiClient.get<WorkflowDetailResponse>(`${this.baseUrl}/${id}`);
  }

  async getWorkflowTriggers(id: number): Promise<WorkflowTriggerResponse[]> {
    return apiClient.get<WorkflowTriggerResponse[]>(`${this.baseUrl}/${id}/triggers`);
  }

  async getWorkflowInstances(
    id: number,
    page: number = 0,
    size: number = 20,
    search?: string,
    status?: InstanceStatus
  ): Promise<PageResponse<WorkflowInstanceResponse>> {
    return apiClient.get<PageResponse<WorkflowInstanceResponse>>(`${this.baseUrl}/${id}/instances`, {
      params: { page, size, search, status }
    });
  }

  async getAllWorkflows(
    page: number = 0,
    size: number = 20,
    search?: string,
    isActive?: boolean
  ): Promise<PageResponse<WorkflowResponse>> {
    return apiClient.get<PageResponse<WorkflowResponse>>(this.baseUrl, {
      params: { page, size, search, isActive }
    });
  }

  async updateWorkflow(id: number, data: UpdateWorkflowRequest): Promise<WorkflowDetailResponse> {
    return apiClient.put<WorkflowDetailResponse>(`${this.baseUrl}/${id}`, data);
  }

  async deleteWorkflow(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async getActiveInstanceCount(id: number): Promise<{ activeCount: number }> {
    return apiClient.get<{ activeCount: number }>(`${this.baseUrl}/${id}/active-count`);
  }

  async getAdminedWorkflows(
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<WorkflowResponse>> {
    return apiClient.get<PageResponse<WorkflowResponse>>(`${this.baseUrl}/admined`, {
      params: { page, size }
    });
  }

  async validateWorkflowGraph(graphJson: string): Promise<any> {
    return apiClient.post<any>(`${this.baseUrl}/validate-graph`, graphJson);
  }

  // ==================== WORKFLOW ADMINS ====================

  async addWorkflowAdmin(id: number, data: AddWorkflowAdminRequest): Promise<WorkflowAdminResponse> {
    return apiClient.post<WorkflowAdminResponse>(`${this.baseUrl}/${id}/admins`, data);
  }

  async removeWorkflowAdmin(id: number, userId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}/admins/${userId}`);
  }

  async updateWorkflowAdmin(id: number, userId: string, data: AddWorkflowAdminRequest): Promise<WorkflowAdminResponse> {
    return apiClient.put<WorkflowAdminResponse>(`${this.baseUrl}/${id}/admins/${userId}`, data);
  }

  // ==================== WORKFLOW INSTANCES ====================

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

  // ==================== WORKFLOW NODES ====================

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

  async getDocumentNodes(documentId: number): Promise<WorkflowNodeInstanceResponse[]> {
    return apiClient.get<WorkflowNodeInstanceResponse[]>(`${this.baseUrl}/documents/${documentId}/nodes`);
  }

  async getInstanceHistory(instanceId: number): Promise<WorkflowHistoryResponse[]> {
    return apiClient.get<WorkflowHistoryResponse[]>(`${this.baseUrl}/instances/${instanceId}/history`);
  }

  async getInstanceTimeline(instanceId: number): Promise<WorkflowTimelineResponse> {
    return apiClient.get<WorkflowTimelineResponse>(`${this.baseUrl}/instances/${instanceId}/timeline`);
  }

  async getNodeInstanceAssignments(nodeInstanceId: number): Promise<WorkflowInstanceAssignmentResponse[]> {
    return apiClient.get<WorkflowInstanceAssignmentResponse[]>(`${this.baseUrl}/instances/nodes/${nodeInstanceId}/assignments`);
  }

  async reassignNode(
    instanceId: number,
    nodeInstanceId: number,
    data: ReassignStepRequest
  ): Promise<WorkflowNodeInstanceResponse> {
    return apiClient.post<WorkflowNodeInstanceResponse>(
      `${this.baseUrl}/instances/${instanceId}/nodes/${nodeInstanceId}/reassign`,
      data
    );
  }

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

  async cancelInstance(
    instanceId: number,
    data: { cancellationReason: string }
  ): Promise<void> {
    return apiClient.post<void>(
      `${this.baseUrl}/instances/${instanceId}/cancel`,
      data
    );
  }


  async updateNodeDueDate(
    instanceId: number,
    nodeInstanceId: number,
    data: UpdateStepDueDateRequest
  ): Promise<WorkflowNodeInstanceResponse> {
    return apiClient.patch<WorkflowNodeInstanceResponse>(
      `${this.baseUrl}/instances/${instanceId}/nodes/${nodeInstanceId}/due-date`,
      data
    );
  }

  async batchCancelInstances(data: BatchCancelInstancesRequest): Promise<BatchOperationResult> {
    return apiClient.post<BatchOperationResult>(`${this.baseUrl}/instances/batch/cancel`, data);
  }

  async batchReassignNodes(
    instanceId: number,
    data: BatchReassignStepsRequest
  ): Promise<BatchOperationResult> {
    return apiClient.post<BatchOperationResult>(
      `${this.baseUrl}/instances/${instanceId}/nodes/batch/reassign`,
      data
    );
  }

  async cancelWorkflowInstance(
    instanceId: number,
    data: CancelWorkflowInstanceRequest
  ): Promise<void> {
    await apiClient.post(`${this.baseUrl}/instances/${instanceId}/cancel`, data);
  }

  async forceCompleteWorkflowInstance(
    instanceId: number,
    data?: ForceCompleteWorkflowRequest
  ): Promise<void> {
    await apiClient.post(`${this.baseUrl}/instances/${instanceId}/force-complete`, data);
  }

  async restartWorkflowInstance(instanceId: number): Promise<WorkflowInstanceResponse> {
    return apiClient.post<WorkflowInstanceResponse>(`${this.baseUrl}/instances/${instanceId}/restart`);
  }

  async applyWorkflowChanges(
    id: number,
    data: ApplyWorkflowChangesRequest
  ): Promise<BatchOperationResult> {
    return apiClient.post<BatchOperationResult>(`${this.baseUrl}/${id}/apply-changes`, data);
  }

  async rollbackToNode(
    instanceId: number,
    data: RollbackStepRequest
  ): Promise<WorkflowInstanceResponse> {
    return apiClient.post<WorkflowInstanceResponse>(`${this.baseUrl}/instances/${instanceId}/rollback`, data);
  }

  // ==================== NODE INSTANCE MANAGEMENT ====================

  async getInstancesAtNode(workflowId: number, nodeId: string, status?: string, documentId?: number): Promise<WorkflowNodeInstanceResponse[]> {
    const params: Record<string, any> = {};
    if (status) params.status = status;
    if (documentId) params.documentId = documentId;
    return apiClient.get<WorkflowNodeInstanceResponse[]>(`${this.baseUrl}/${workflowId}/nodes/${nodeId}/instances`, {
      params: Object.keys(params).length > 0 ? params : undefined
    });
  }

  async cancelAllInstancesAtNode(
    workflowId: number,
    nodeId: string,
    reason?: string
  ): Promise<BatchOperationResult> {
    return apiClient.post<BatchOperationResult>(
      `${this.baseUrl}/${workflowId}/nodes/${nodeId}/instances/cancel-all`,
      null,
      { params: { reason } }
    );
  }

  async completeAllInstancesAtNode(workflowId: number, nodeId: string): Promise<BatchOperationResult> {
    return apiClient.post<BatchOperationResult>(
      `${this.baseUrl}/${workflowId}/nodes/${nodeId}/instances/complete-all`,
      null
    );
  }

  // ==================== ADMIN ENDPOINTS ====================

  async getNodeStatistics(id: number): Promise<NodeStatisticsResponse[]> {
    return apiClient.get<NodeStatisticsResponse[]>(`${this.baseUrl}/${id}/admin/nodes/statistics`);
  }

  async getDocumentsAtNode(
    id: number,
    nodeId: string,
    page: number = 0,
    size: number = 20,
    search?: string,
    status?: NodeStatus
  ): Promise<PageResponse<NodeDocumentResponse>> {
    return apiClient.get<PageResponse<NodeDocumentResponse>>(`${this.baseUrl}/${id}/admin/nodes/${nodeId}/documents`, {
      params: { page, size, search, status }
    });
  }

  async bulkCancelInstances(id: number, data: BulkInstanceOperationRequest): Promise<BatchOperationResult> {
    return apiClient.post<BatchOperationResult>(`${this.baseUrl}/${id}/admin/bulk-cancel`, data);
  }

  async bulkForceCompleteInstances(id: number, data: BulkInstanceOperationRequest): Promise<BatchOperationResult> {
    return apiClient.post<BatchOperationResult>(`${this.baseUrl}/${id}/admin/bulk-complete`, data);
  }

  async bulkDeleteInstances(id: number, data: BulkInstanceOperationRequest): Promise<BatchOperationResult> {
    return apiClient.post<BatchOperationResult>(`${this.baseUrl}/${id}/admin/bulk-delete`, data);
  }

  async bulkReassignAtNode(
    id: number,
    nodeId: string,
    data: BulkReassignRequest
  ): Promise<BatchOperationResult> {
    return apiClient.post<BatchOperationResult>(`${this.baseUrl}/${id}/admin/nodes/${nodeId}/bulk-reassign`, data);
  }

  async getWorkflowStatistics(id: number): Promise<WorkflowStatisticsResponse> {
    return apiClient.get<WorkflowStatisticsResponse>(`${this.baseUrl}/${id}/admin/statistics`);
  }

  async getWorkflowHistory(
    id: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<WorkflowHistoryResponse>> {
    return apiClient.get<PageResponse<WorkflowHistoryResponse>>(`${this.baseUrl}/${id}/admin/history`, {
      params: { page, size }
    });
  }

  // ==================== TRIGGER CRUD ====================

  async addTrigger(id: number, data: AddWorkflowTriggerRequest): Promise<WorkflowTriggerResponse> {
    return apiClient.post<WorkflowTriggerResponse>(`${this.baseUrl}/${id}/triggers`, data);
  }

  async getTrigger(id: number, triggerId: number): Promise<WorkflowTriggerResponse> {
    return apiClient.get<WorkflowTriggerResponse>(`${this.baseUrl}/${id}/triggers/${triggerId}`);
  }

  async updateTrigger(id: number, triggerId: number, data: UpdateWorkflowTriggerRequest): Promise<WorkflowTriggerResponse> {
    return apiClient.put<WorkflowTriggerResponse>(`${this.baseUrl}/${id}/triggers/${triggerId}`, data);
  }

  async deleteTrigger(id: number, triggerId: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}/triggers/${triggerId}`);
  }

  // ==================== GRAPH READ/WRITE ====================

  async getWorkflowGraph(id: number): Promise<ReactFlowGraphDto> {
    return apiClient.get<ReactFlowGraphDto>(`${this.baseUrl}/${id}/graph`);
  }

  async updateWorkflowGraph(id: number, data: ReactFlowGraphDto): Promise<void> {
    await apiClient.put(`${this.baseUrl}/${id}/graph`, data);
  }

  // ==================== INSTANCE STATE ====================

  async getInstanceState(instanceId: number): Promise<WorkflowInstanceStateResponse> {
    return apiClient.get<WorkflowInstanceStateResponse>(`${this.baseUrl}/instances/${instanceId}/state`);
  }

  // ==================== NODE INSTANCE DETAIL ====================

  async getNodeInstanceDetail(nodeInstanceId: number): Promise<WorkflowNodeInstanceDetailResponse> {
    return apiClient.get<WorkflowNodeInstanceDetailResponse>(`${this.baseUrl}/nodes/${nodeInstanceId}`);
  }

  // ==================== VARIABLES ====================

  async getInstanceVariables(instanceId: number): Promise<Record<string, any>> {
    return apiClient.get<Record<string, any>>(`${this.baseUrl}/instances/${instanceId}/variables`);
  }

  async setInstanceVariable(instanceId: number, key: string, data: SetVariableRequest): Promise<void> {
    await apiClient.put(`${this.baseUrl}/instances/${instanceId}/variables/${key}`, data);
  }

  async deleteInstanceVariable(instanceId: number, key: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/instances/${instanceId}/variables/${key}`);
  }
}

export const workflowAdminService = new WorkflowAdminService();
