/**
 * Workflow Service - API client for workflow operations
 */

import { apiClient } from '../client';
import {
  Workflow,
  WorkflowInstance,
  CreateWorkflowInstanceRequest,
  WorkflowActionRequest
} from "@/types/workflow";

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export class WorkflowService {
  private baseUrl = '/api/v1/workflow';

  /**
   * Get all workflow definitions
   */
  async getAllWorkflows(): Promise<Workflow[]> {
    return apiClient.get<Workflow[]>(this.baseUrl);
  }

  /**
   * Get workflow definition by ID
   */
  async getWorkflowById(id: number): Promise<Workflow> {
    return apiClient.get<Workflow>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new workflow instance for a document
   */
  async createWorkflowInstance(
    request: CreateWorkflowInstanceRequest
  ): Promise<WorkflowInstance> {
    return apiClient.post<WorkflowInstance>(`${this.baseUrl}/instance`, request);
  }

  /**
   * Get workflow instance by ID
   */
  async getWorkflowInstanceById(id: number): Promise<WorkflowInstance> {
    return apiClient.get<WorkflowInstance>(`${this.baseUrl}/instance/${id}`);
  }

  /**
   * Get workflow instance by document ID
   */
  async getWorkflowInstanceByDocumentId(
    documentId: number
  ): Promise<WorkflowInstance> {
    return apiClient.get<WorkflowInstance>(`${this.baseUrl}/document/${documentId}`);
  }

  /**
   * Perform an action on a workflow instance
   */
  async performWorkflowAction(
    instanceId: number,
    request: WorkflowActionRequest
  ): Promise<WorkflowInstance> {
    return apiClient.post<WorkflowInstance>(
      `${this.baseUrl}/instance/${instanceId}/action`,
      request
    );
  }

  /**
   * Get workflow instances pending approval by current user
   */
  async getPendingWorkflowInstances(
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<WorkflowInstance>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PaginatedResponse<WorkflowInstance>>(
      `${this.baseUrl}/instance/pending?${params}`
    );
  }

  /**
   * Get workflow instances created by current user
   */
  async getMyWorkflowInstances(
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<WorkflowInstance>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PaginatedResponse<WorkflowInstance>>(
      `${this.baseUrl}/instance/my?${params}`
    );
  }
}

export const workflowService = new WorkflowService();
export default workflowService;


