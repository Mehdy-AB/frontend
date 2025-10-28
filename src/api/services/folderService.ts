import { apiClient } from '../client';
import {
  FolderResDto,
  FolderWithOwnerDto,
  FolderPermissionResDto,
  CreateFolderDto,
  FolderRepoResDto,
  PageResponse,
  SortFields,
  GranteeType,
  TypeShareAccessWithTypeReq,
  TypeShareAccessRes,
} from '../../types/api';

export class FolderService {
  private baseUrl = '/api/v1/folder';

  // Get all folders with pagination
  async getFolders(
    page: number = 0,
    size: number = 20,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<FolderResDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy || SortFields.NAME,
      sortDirection,
    });

    return apiClient.get<PageResponse<FolderResDto>>(`${this.baseUrl}?${params}`);
  }

  // Get folder by ID
  async getFolderById(folderId: number): Promise<FolderResDto> {
    return apiClient.get<FolderResDto>(`${this.baseUrl}/${folderId}`);
  }

  // Create new folder
  async createFolder(folderData: CreateFolderDto): Promise<FolderResDto> {
    return apiClient.post<FolderResDto>(this.baseUrl, folderData);
  }

  // Update folder
  async updateFolder(folderId: number, folderData: CreateFolderDto): Promise<FolderResDto> {
    return apiClient.put<FolderResDto>(`${this.baseUrl}/${folderId}`, folderData);
  }

  // Delete folder
  async deleteFolder(folderId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${folderId}`);
  }

  // Get folder contents (documents and subfolders)
  async getFolderContents(
    folderId: number,
    page: number = 0,
    size: number = 20,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<FolderRepoResDto> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy || SortFields.NAME,
      sortDirection,
    });

    return apiClient.get<FolderRepoResDto>(`${this.baseUrl}/${folderId}/contents?${params}`);
  }

  // Get folder permissions
  async getFolderPermissions(folderId: number): Promise<FolderPermissionResDto> {
    return apiClient.get<FolderPermissionResDto>(`${this.baseUrl}/${folderId}/permissions`);
  }

  // Share folder with user/group/role
  async shareFolderWithType(
    folderId: number,
    shareData: TypeShareAccessWithTypeReq
  ): Promise<TypeShareAccessRes> {
    return apiClient.post<TypeShareAccessRes>(`${this.baseUrl}/${folderId}/share`, shareData);
  }

  // Revoke folder access
  async revokeFolderAccess(folderId: number, granteeId: string): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${folderId}/share/${granteeId}`);
  }

  // Get folder sharing list
  async getFolderSharingList(folderId: number): Promise<TypeShareAccessRes[]> {
    return apiClient.get<TypeShareAccessRes[]>(`${this.baseUrl}/${folderId}/sharing`);
  }

  // Get folders by parent
  async getFoldersByParent(
    parentId: number,
    page: number = 0,
    size: number = 20,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<FolderResDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy || SortFields.NAME,
      sortDirection,
    });

    return apiClient.get<PageResponse<FolderResDto>>(`${this.baseUrl}/parent/${parentId}?${params}`);
  }

  // Get root folders
  // Get current user's repository (root folders)
  async getMyRepository(
    page: number = 0,
    size: number = 20,
    name?: string,
    sortBy: SortFields = SortFields.NAME,
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<PageResponse<FolderResDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: sortBy,
      desc: (sortDirection === 'desc').toString(),
    });

    if (name) {
      params.append('name', name);
    }

    return apiClient.get<PageResponse<FolderResDto>>(`${this.baseUrl}?${params}`);
  }

  async getRootFolders(
    page: number = 0,
    size: number = 20,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<FolderResDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy || SortFields.NAME,
      sortDirection,
    });

    return apiClient.get<PageResponse<FolderResDto>>(`${this.baseUrl}/root?${params}`);
  }

  // Get folders by owner
  async getFoldersByOwner(
    ownerId: string,
    page: number = 0,
    size: number = 20,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<FolderResDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy || SortFields.NAME,
      sortDirection,
    });

    return apiClient.get<PageResponse<FolderResDto>>(`${this.baseUrl}/owner/${ownerId}?${params}`);
  }

  // Search folders
  async searchFolders(
    query: string,
    page: number = 0,
    size: number = 20,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<FolderResDto>> {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy || SortFields.NAME,
      sortDirection,
    });

    return apiClient.get<PageResponse<FolderResDto>>(`${this.baseUrl}/search?${params}`);
  }

  // Move folder
  async moveFolder(folderId: number, newParentId?: number): Promise<FolderResDto> {
    return apiClient.patch<FolderResDto>(`${this.baseUrl}/${folderId}/move`, {
      parentId: newParentId,
    });
  }

  // Get folder hierarchy
  async getFolderHierarchy(folderId: number): Promise<FolderResDto[]> {
    return apiClient.get<FolderResDto[]>(`${this.baseUrl}/${folderId}/hierarchy`);
  }

  // Get folder statistics
  async getFolderStatistics(): Promise<{
    totalFolders: number;
    foldersByOwner: Record<string, number>;
    foldersByLevel: Record<string, number>;
    totalSize: number;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  // Bulk operations
  async bulkDeleteFolders(folderIds: number[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/bulk`, {
      data: { folderIds },
    });
  }

  async bulkMoveFolders(folderIds: number[], targetParentId?: number): Promise<void> {
    return apiClient.patch<void>(`${this.baseUrl}/bulk/move`, {
      folderIds,
      parentId: targetParentId,
    });
  }

  // Get allowed folders for moving
  async getAllowedFoldersToMove(entityType: 'DOCUMENT' | 'FOLDER', entityId: number): Promise<{
    id: number;
    name: string;
    path: string;
    canMove: boolean;
    reason?: string;
  }[]> {
    return apiClient.get(`${this.baseUrl}/allowed-to-move`, {
      params: { entityType, entityId },
    });
  }
}

export const folderService = new FolderService();