import { apiClient } from '../client';
import { PageResponse, UserDto } from '../../types/api';

export interface TrashItemDto {
  id: number;
  entityType: string;
  entityId: number;
  entityName: string;
  deletedAt: string;
  deletedBy: UserDto;
  sizeBytes?: number;
  path?: string;
}

export class TrashService {
  private baseUrl = '/api/v1/trash';

  // Get current user's trash items (all deleted documents and folders)
  async getMyTrash(opts?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    entityType?: string;
  }): Promise<PageResponse<TrashItemDto>> {
    const page = opts?.page ?? 0;
    const size = opts?.size ?? 20;
    const sortBy = opts?.sortBy ?? 'deletedAt';
    const sortDir = opts?.sortDir ?? 'desc';
    const entityType = opts?.entityType;

    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir,
    });

    if (entityType) {
      params.append('entityType', entityType);
    }

    return apiClient.get<PageResponse<TrashItemDto>>(`${this.baseUrl}?${params}`);
  }

  // Restore a deleted item
  async restoreItem(entityType: string, entityId: number): Promise<void> {
    const params = new URLSearchParams({
      entityType,
      entityId: entityId.toString(),
    });
    return apiClient.post<void>(`${this.baseUrl}/restore?${params}`);
  }

  // Permanently delete an item
  async permanentlyDelete(entityType: string, entityId: number): Promise<void> {
    const params = new URLSearchParams({
      entityType,
      entityId: entityId.toString(),
    });
    return apiClient.delete<void>(`${this.baseUrl}/permanent?${params}`);
  }

  // Empty trash - permanently delete all deleted items for current user
  async emptyTrash(): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/empty`);
  }

  // Get trash count for current user
  async getTrashCount(): Promise<number> {
    return apiClient.get<number>(`${this.baseUrl}/count`);
  }
}

export const trashService = new TrashService();




