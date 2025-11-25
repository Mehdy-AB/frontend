/**
 * Workflow Admin Service - CRUD operations for workflow management
 */

import { apiClient } from '../client';
import { PageResponse } from '../../types/api';
import {
  WorkflowDetail,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
} from '../../types/workflow-admin';

class WorkflowAdminService {
  private baseUrl = '/api/v1/workflow';

  /**
   * Get all workflows with pagination
   */
  async getAllWorkflows(page: number = 0, size: number = 20): Promise<PageResponse<WorkflowDetail>> {
    return apiClient.get<PageResponse<WorkflowDetail>>(`${this.baseUrl}/all`, {
      params: { page, size },
    });
  }

  /**
   * Search workflows by name
   */
  async searchWorkflows(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<WorkflowDetail>> {
    return apiClient.get<PageResponse<WorkflowDetail>>(`${this.baseUrl}/search`, {
      params: { query, page, size },
    });
  }

  /**
   * Get workflow by ID with full details
   */
  async getWorkflowById(id: number): Promise<WorkflowDetail> {
    return apiClient.get<WorkflowDetail>(`${this.baseUrl}/${id}/details`);
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(data: CreateWorkflowRequest): Promise<WorkflowDetail> {
    return apiClient.post<WorkflowDetail>(this.baseUrl, data);
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(id: number, data: UpdateWorkflowRequest): Promise<WorkflowDetail> {
    return apiClient.put<WorkflowDetail>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Validate workflow name (check if exists)
   */
  async validateWorkflowName(name: string, excludeId?: number): Promise<boolean> {
    try {
      const result = await this.searchWorkflows(name, 0, 100);
      const exists = result.content.some(
        (w) => w.name.toLowerCase() === name.toLowerCase() && w.id !== excludeId
      );
      return !exists; // Returns true if name is valid (not exists)
    } catch (error) {
      console.error('Error validating workflow name:', error);
      return false;
    }
  }
}

export const workflowAdminService = new WorkflowAdminService();

