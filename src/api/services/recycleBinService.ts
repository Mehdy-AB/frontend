import { apiClient } from '../client'
import { notificationApiClient } from '../notificationClient'
import { 
  RecycleBinEntry, 
  RecycleBinMoveReq, 
  RecycleBinRestoreReq, 
  RecycleBinPermanentDeleteReq, 
  RecycleBinCheckResponse, 
  RecycleBinCountResponse, 
  PageResponse 
} from '../../types/api'

export class RecycleBinService {
  // ==================== RECYCLE BIN ENDPOINTS ====================

  /**
   * Move entity to recycle bin
   */
  async moveToRecycleBin(data: RecycleBinMoveReq): Promise<RecycleBinEntry> {
    return notificationApiClient.moveToRecycleBin(data)
  }

  /**
   * Restore entity from recycle bin
   */
  async restoreFromRecycleBin(data: RecycleBinRestoreReq): Promise<void> {
    return notificationApiClient.restoreFromRecycleBin(data)
  }

  /**
   * Permanently delete entity
   */
  async permanentlyDelete(data: RecycleBinPermanentDeleteReq): Promise<void> {
    return notificationApiClient.permanentlyDelete(data)
  }

  /**
   * Empty entire recycle bin
   */
  async emptyRecycleBin(): Promise<void> {
    return notificationApiClient.emptyRecycleBin()
  }

  /**
   * Empty current user's recycle bin
   */
  async emptyMyRecycleBin(): Promise<void> {
    return notificationApiClient.emptyMyRecycleBin()
  }

  /**
   * Get all recycle bin entries
   */
  async getAllRecycleBinEntries(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<RecycleBinEntry>> {
    return notificationApiClient.getAllRecycleBinEntries(params)
  }

  /**
   * Get entries by entity type
   */
  async getRecycleBinEntriesByEntityType(entityType: string, params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<RecycleBinEntry>> {
    return notificationApiClient.getRecycleBinEntriesByEntityType(entityType, params)
  }

  /**
   * Get current user's entries
   */
  async getMyRecycleBinEntries(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<RecycleBinEntry>> {
    return notificationApiClient.getMyRecycleBinEntries(params)
  }

  /**
   * Get entries by user
   */
  async getRecycleBinEntriesByUser(userId: string, params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<RecycleBinEntry>> {
    return notificationApiClient.getRecycleBinEntriesByUser(userId, params)
  }

  /**
   * Check if entity is in recycle bin
   */
  async isInRecycleBin(entityType: string, entityId: number): Promise<RecycleBinCheckResponse> {
    return notificationApiClient.isInRecycleBin(entityType, entityId)
  }

  /**
   * Get total recycle bin count
   */
  async getRecycleBinCount(): Promise<RecycleBinCountResponse> {
    return notificationApiClient.getRecycleBinCount()
  }

  /**
   * Get count by entity type
   */
  async getRecycleBinCountByEntityType(entityType: string): Promise<RecycleBinCountResponse> {
    return notificationApiClient.getRecycleBinCountByEntityType(entityType)
  }

  /**
   * Get current user's entry count
   */
  async getMyRecycleBinCount(): Promise<RecycleBinCountResponse> {
    return notificationApiClient.getMyRecycleBinCount()
  }

  /**
   * Get user's entry count
   */
  async getUserRecycleBinCount(userId: string): Promise<RecycleBinCountResponse> {
    return notificationApiClient.getUserRecycleBinCount(userId)
  }

  /**
   * Cleanup old entries
   */
  async cleanupOldRecycleBinEntries(cutoffDate: string): Promise<void> {
    return notificationApiClient.cleanupOldRecycleBinEntries(cutoffDate)
  }

  /**
   * Get specific recycle bin entry
   */
  async getRecycleBinEntry(id: number): Promise<RecycleBinEntry> {
    return notificationApiClient.getRecycleBinEntry(id)
  }
}

// Create and export a singleton instance
export const recycleBinService = new RecycleBinService()
export default recycleBinService

