import { apiClient } from '../client';
import { PageResponse } from '../../types/api';

export interface AuditLog {
  id: number;
  userId: string;
  username: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export class AuditLogService {
  private baseUrl = '/api/v1/admin/audit-logs';

  // Get all audit logs
  async getAllAuditLogs(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'timestamp',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<PageResponse<AuditLog>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });

    return apiClient.get<PageResponse<AuditLog>>(`${this.baseUrl}?${params}`);
  }

  // Get audit logs by user
  async getAuditLogsByUser(
    userId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<AuditLog>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<AuditLog>>(`${this.baseUrl}/user/${userId}?${params}`);
  }

  // Get audit logs by entity
  async getAuditLogsByEntity(
    entityType: string,
    entityId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<AuditLog>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<AuditLog>>(`${this.baseUrl}/entity/${entityType}/${entityId}?${params}`);
  }

  // Search audit logs
  async searchAuditLogs(
    searchTerm: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<AuditLog>> {
    const params = new URLSearchParams({
      searchTerm,
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<AuditLog>>(`${this.baseUrl}/search?${params}`);
  }

  // Get audit logs by date range
  async getAuditLogsByDateRange(
    startDate: string,
    endDate: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<AuditLog>> {
    const params = new URLSearchParams({
      startDate,
      endDate,
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<AuditLog>>(`${this.baseUrl}/date-range?${params}`);
  }
}

export const auditLogService = new AuditLogService();
