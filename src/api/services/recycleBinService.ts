import { apiClient } from '../client';
import { 
  RecycleBinEntry, 
  RecycleBinMoveReq, 
  RecycleBinRestoreReq, 
  RecycleBinPermanentDeleteReq, 
  RecycleBinCheckResponse, 
  RecycleBinCountResponse, 
  PageResponse,
} from '../../types/api';

export class RecycleBinService {
  private baseUrl = '/api/v1/recycle-bin';

  // Get recycle bin entries with pagination (all entries)
  async getRecycleBinEntries(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'deletedAt',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<PageResponse<RecycleBinEntry>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });

    return apiClient.get<PageResponse<RecycleBinEntry>>(`${this.baseUrl}?${params}`);
  }

  // Get current user's recycle bin entries with pagination
  async getMyRecycleBinEntries(opts?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }): Promise<PageResponse<RecycleBinEntry>> {
    const page = opts?.page ?? 0;
    const size = opts?.size ?? 20;
    const sortBy = opts?.sortBy ?? 'deletedAt';
    const sortDir = opts?.sortDir ?? 'desc';

    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir,
    });

    return apiClient.get<PageResponse<RecycleBinEntry>>(`${this.baseUrl}/my-entries?${params}`);
  }

  // Get recycle bin entry by ID
  async getRecycleBinEntryById(entryId: number): Promise<RecycleBinEntry> {
    return apiClient.get<RecycleBinEntry>(`${this.baseUrl}/${entryId}`);
  }

  // Move entity to recycle bin
  async moveToRecycleBin(moveData: RecycleBinMoveReq): Promise<RecycleBinEntry> {
    return apiClient.post<RecycleBinEntry>(this.baseUrl, moveData);
  }

  // Restore entity from recycle bin (backend expects request params)
  async restoreFromRecycleBin(restoreData: RecycleBinRestoreReq): Promise<void> {
    const params = new URLSearchParams({
      entityType: restoreData.entityType,
      entityId: String(restoreData.entityId),
    });
    return apiClient.post<void>(`${this.baseUrl}/restore?${params}`);
  }

  // Permanently delete entity from recycle bin (backend expects request params)
  async permanentlyDelete(deleteData: RecycleBinPermanentDeleteReq): Promise<void> {
    const params = new URLSearchParams({
      entityType: deleteData.entityType,
      entityId: String(deleteData.entityId),
    });
    return apiClient.delete<void>(`${this.baseUrl}/permanent?${params}`);
  }

  // Backward compatibility (older path naming)
  async permanentDeleteFromRecycleBin(deleteData: RecycleBinPermanentDeleteReq): Promise<void> {
    return this.permanentlyDelete(deleteData);
  }

  // Check if entity is in recycle bin
  async checkEntityInRecycleBin(entityType: string, entityId: number): Promise<RecycleBinCheckResponse> {
    return apiClient.get<RecycleBinCheckResponse>(`${this.baseUrl}/check/${entityType}/${entityId}`);
  }

  // Get recycle bin count
  async getRecycleBinCount(): Promise<RecycleBinCountResponse> {
    return apiClient.get<RecycleBinCountResponse>(`${this.baseUrl}/count`);
  }

  // Get entries by entity type
  async getEntriesByEntityType(
    entityType: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<RecycleBinEntry>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<RecycleBinEntry>>(`${this.baseUrl}/type/${entityType}?${params}`);
  }

  // Get entries by user
  async getEntriesByUser(
    userId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<RecycleBinEntry>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<RecycleBinEntry>>(`${this.baseUrl}/user/${userId}?${params}`);
  }

  // Search recycle bin entries
  async searchRecycleBinEntries(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<RecycleBinEntry>> {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<RecycleBinEntry>>(`${this.baseUrl}/search?${params}`);
  }

  // Get expired entries
  async getExpiredEntries(): Promise<RecycleBinEntry[]> {
    return apiClient.get<RecycleBinEntry[]>(`${this.baseUrl}/expired`);
  }

  // Clean up expired entries
  async cleanupExpiredEntries(): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    return apiClient.post(`${this.baseUrl}/cleanup`);
  }

  // Get recycle bin statistics
  async getRecycleBinStatistics(): Promise<{
    totalEntries: number;
    entriesByType: Record<string, number>;
    entriesByUser: Record<string, number>;
    expiredEntries: number;
    totalSize: number;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  // Bulk operations
  async bulkRestoreEntries(entryIds: number[]): Promise<void> {
    return apiClient.post<void>(`${this.baseUrl}/bulk/restore`, { entryIds });
  }

  async bulkPermanentDeleteEntries(entryIds: number[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/bulk/permanent-delete`, {
      data: { entryIds },
    });
  }

  // Clear entire recycle bin
  async clearRecycleBin(): Promise<{
    cleared: number;
    errors: string[];
  }> {
    return apiClient.delete(`${this.baseUrl}/clear`);
  }

  // Empty current user's recycle bin (aligns with backend /empty/my)
  async emptyMyRecycleBin(): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/empty/my`);
  }

  // Set retention period
  async setRetentionPeriod(days: number): Promise<void> {
    return apiClient.patch<void>(`${this.baseUrl}/retention`, { days });
  }

  // Get retention period
  async getRetentionPeriod(): Promise<{ days: number }> {
    return apiClient.get<{ days: number }>(`${this.baseUrl}/retention`);
  }

  // Export recycle bin entries
  async exportRecycleBinEntries(): Promise<Blob> {
    return apiClient.downloadFile(`${this.baseUrl}/export`);
  }
}

export const recycleBinService = new RecycleBinService();