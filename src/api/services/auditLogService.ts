import { notificationApiClient } from '../notificationClient';
import { AuditLog, AuditLogStatistics, PageResponse } from '../../types/api';

export class AuditLogService {
  /**
   * Get all audit logs
   */
  static async getAllAuditLogs(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}, options?: any): Promise<PageResponse<AuditLog>> {
    return notificationApiClient.getAllAuditLogs(params, options);
  }

  /**
   * Get audit logs by user
   */
  static async getAuditLogsByUser(userId: string, params: {
    page?: number;
    size?: number;
  } = {}, options?: any): Promise<PageResponse<AuditLog>> {
    return notificationApiClient.getAuditLogsByUser(userId, params, options);
  }

  /**
   * Get audit logs by entity
   */
  static async getAuditLogsByEntity(
    entityType: string,
    entityId: string,
    params: {
      page?: number;
      size?: number;
    } = {},
    options?: any
  ): Promise<PageResponse<AuditLog>> {
    return notificationApiClient.getAuditLogsByEntity(entityType, entityId, params, options);
  }

  /**
   * Get audit logs by search term
   */
  static async getAuditLogsBySearchTerm(
    searchTerm: string,
    params: {
      page?: number;
      size?: number;
    } = {},
    options?: any
  ): Promise<PageResponse<AuditLog>> {
    return notificationApiClient.getAuditLogsBySearchTerm(searchTerm, params, options);
  }

  /**
   * Get audit logs by date range
   */
  static async getAuditLogsByDateRange(
    startDate: string,
    endDate: string,
    params: {
      page?: number;
      size?: number;
    } = {},
    options?: any
  ): Promise<PageResponse<AuditLog>> {
    return notificationApiClient.getAuditLogsByDateRange(startDate, endDate, params, options);
  }

  /**
   * Get user activity statistics
   */
  static async getUserActivityStatistics(
    startDate: string,
    endDate: string,
    options?: any
  ): Promise<AuditLogStatistics> {
    return notificationApiClient.getUserActivityStatistics(startDate, endDate, options);
  }

  /**
   * Get entity type statistics
   */
  static async getEntityTypeStatistics(
    startDate: string,
    endDate: string,
    options?: any
  ): Promise<AuditLogStatistics> {
    return notificationApiClient.getEntityTypeStatistics(startDate, endDate, options);
  }
}

export default AuditLogService;