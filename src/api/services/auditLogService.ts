import { apiClient } from '../client';
import { PageResponse } from '../../types/api';

// ============================================================================
// TYPES — Matches backend DTOs exactly
// ============================================================================

export interface AuditLogResponseDto {
  id: number;
  // Identity / Actor
  user: { id: string; username: string; email: string; displayName: string; firstName?: string; lastName?: string; imgUrl?: string } | null;
  userEmail: string | null;
  username: string | null;
  displayName: string | null;
  actorType: string | null;
  sessionId: string | null;
  requestId: string | null;
  // Action
  action: string | null;
  actionDescription: string | null;
  actionCategory: string | null;
  actionCategoryDisplayName: string | null;
  // Entity
  entityType: string | null;
  entityId: string | null;
  entityName: string | null;
  // Scope
  workspaceId: string | null;
  workspaceName: string | null;
  folderPath: string | null;
  channel: string | null;
  // HTTP
  httpMethod: string | null;
  endpoint: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  // Result
  responseStatus: number | null;
  durationMs: number | null;
  success: boolean | null;
  resultCode: string | null;
  errorMessage: string | null;
  // Change tracking
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  details: string | null;
  // Reason
  message: string | null;
  reason: string | null;
  // Timestamp
  timestamp: string;
}

export interface AuditLogFilterRequest {
  actions?: string[];
  entityTypes?: string[];
  entityId?: string;
  userId?: string;
  userIds?: string[];
  username?: string;
  roleIds?: string[];
  groupIds?: string[];
  orgUnitIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  success?: boolean | null;
  httpMethod?: string;
  httpMethods?: string[];
  ipAddress?: string;
  minDurationMs?: number;
  responseStatus?: number;
  search?: string;
  page: number;
  size: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

// Enterprise filter option types
export interface FilterUserOption {
  id: string;
  username: string;
  displayName?: string;
  imgUrl?: string;
}

export interface FilterOption {
  id: string;
  name: string;
}

export interface AuditStatisticsDto {
  totalEvents: number;
  eventsToday: number;
  eventsThisWeek: number;
  failedEvents: number;
  successRate: number;
  uniqueUsers: number;
  eventsByEntityType: Record<string, number>;
  eventsByAction: Record<string, number>;
  dailyTrend: { date: string; count: number; failures: number }[];
  topUsers: { userId: string | null; username: string; displayName?: string; imgUrl?: string; eventCount: number }[];
}

// ============================================================================
// SERVICE
// ============================================================================

const BASE = '/api/v1/admin/audit-logs';

export const auditLogService = {
  /** POST /filter — unified query with faceted filters */
  async filter(req: AuditLogFilterRequest): Promise<PageResponse<AuditLogResponseDto>> {
    return apiClient.post<PageResponse<AuditLogResponseDto>>(`${BASE}/filter`, req);
  },

  /** GET /statistics — dashboard aggregates */
  async getStatistics(): Promise<AuditStatisticsDto> {
    return apiClient.get<AuditStatisticsDto>(`${BASE}/statistics`);
  },

  /** GET /options/entity-types */
  async getEntityTypeOptions(): Promise<string[]> {
    return apiClient.get<string[]>(`${BASE}/options/entity-types`);
  },

  /** GET /options/actions */
  async getActionOptions(): Promise<string[]> {
    return apiClient.get<string[]>(`${BASE}/options/actions`);
  },

  /** GET /{id} — single event detail */
  async getById(id: number): Promise<AuditLogResponseDto> {
    return apiClient.get<AuditLogResponseDto>(`${BASE}/${id}`);
  },

  // ==========================================================================
  // FILTER OPTIONS (audit-log scoped)
  // ==========================================================================

  /** GET /options/users — distinct users in audit logs */
  async getUserOptions(): Promise<FilterUserOption[]> {
    return apiClient.get<FilterUserOption[]>(`${BASE}/options/users`);
  },

  /** GET /options/http-methods — distinct HTTP methods */
  async getHttpMethodOptions(): Promise<string[]> {
    return apiClient.get<string[]>(`${BASE}/options/http-methods`);
  },

  /** GET /options/action-categories — all action categories */
  async getActionCategoryOptions(): Promise<FilterOption[]> {
    return apiClient.get<FilterOption[]>(`${BASE}/options/action-categories`);
  },

  /** GET /options/channels — distinct channels */
  async getChannelOptions(): Promise<string[]> {
    return apiClient.get<string[]>(`${BASE}/options/channels`);
  },

  /** GET /options/actor-types — distinct actor types */
  async getActorTypeOptions(): Promise<string[]> {
    return apiClient.get<string[]>(`${BASE}/options/actor-types`);
  },

  /** GET /options/result-codes — distinct result codes */
  async getResultCodeOptions(): Promise<string[]> {
    return apiClient.get<string[]>(`${BASE}/options/result-codes`);
  },

  // ==========================================================================
  // LEGACY METHODS — Backward-compatible for existing consumers
  // ==========================================================================

  /** @deprecated Use filter() instead */
  async getAllAuditLogs(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'timestamp',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<PageResponse<AuditLog>> {
    const params = new URLSearchParams({ page: String(page), size: String(size), sortBy, sortDirection });
    return apiClient.get<PageResponse<AuditLog>>(`${BASE}?${params}`);
  },

  /** @deprecated Use filter({ userId }) instead */
  async getAuditLogsByUser(
    userId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<AuditLog>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<PageResponse<AuditLog>>(`${BASE}/user/${userId}?${params}`);
  },

  /** @deprecated Use filter({ entityTypes }) instead */
  async getAuditLogsByEntity(
    entityType: string,
    entityId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<AuditLog>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<PageResponse<AuditLog>>(`${BASE}/entity/${entityType}/${entityId}?${params}`);
  },

  /** @deprecated Use filter({ search }) instead */
  async searchAuditLogs(
    searchTerm: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<AuditLog>> {
    const params = new URLSearchParams({ searchTerm, page: String(page), size: String(size) });
    return apiClient.get<PageResponse<AuditLog>>(`${BASE}/search?${params}`);
  },

  /** @deprecated Use filter({ dateFrom, dateTo }) instead */
  async getAuditLogsByDateRange(
    startDate: string,
    endDate: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<AuditLog>> {
    const params = new URLSearchParams({ startDate, endDate, page: String(page), size: String(size) });
    return apiClient.get<PageResponse<AuditLog>>(`${BASE}/date-range?${params}`);
  },
};

// ============================================================================
// LEGACY TYPE — Backward-compatible for existing consumers
// ============================================================================

/** @deprecated Use AuditLogResponseDto instead */
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
