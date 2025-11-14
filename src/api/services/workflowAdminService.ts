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
    const response = await apiClient.get<PageResponse<WorkflowDetail>>(`${this.baseUrl}/all`, {
      params: { page, size },
    });
    return response.data;
  }

  /**
   * Search workflows by name
   */
  async searchWorkflows(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<WorkflowDetail>> {
    const response = await apiClient.get<PageResponse<WorkflowDetail>>(`${this.baseUrl}/search`, {
      params: { query, page, size },
    });
    return response.data;
  }

  /**
   * Get workflow by ID with full details
   */
  async getWorkflowById(id: number): Promise<WorkflowDetail> {
    const response = await apiClient.get<WorkflowDetail>(`${this.baseUrl}/${id}/details`);
    return response.data;
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(data: CreateWorkflowRequest): Promise<WorkflowDetail> {
    const response = await apiClient.post<WorkflowDetail>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(id: number, data: UpdateWorkflowRequest): Promise<WorkflowDetail> {
    const response = await apiClient.put<WorkflowDetail>(`${this.baseUrl}/${id}`, data);
    return response.data;
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

