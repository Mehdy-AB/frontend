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
  AllowedFoldersToMove,
  MovingType,
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
    name?: string,
    showFolder: boolean = true,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<FolderRepoResDto> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: sortBy || SortFields.NAME,
      desc: (sortDirection === 'desc').toString(),
      showFolder: showFolder.toString(),
    });

    if (name) {
      params.append('name', name);
    }

    return apiClient.get<FolderRepoResDto>(`${this.baseUrl}/${folderId}?${params}`);
  }

  // Get folder by path
  async getFolderByPath(
    path: string,
    page: number = 0,
    size: number = 20,
    name?: string,
    showFolder: boolean = true,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<FolderRepoResDto> {
    const params = new URLSearchParams({
      path,
      page: page.toString(),
      size: size.toString(),
      sort: sortBy || SortFields.NAME,
      desc: (sortDirection === 'desc').toString(),
      showFolder: showFolder.toString(),
    });

    if (name) {
      params.append('name', name);
    }

    return apiClient.get<FolderRepoResDto>(`${this.baseUrl}/path?${params}`);
  }

  // Get folder ID by path (lightweight, fast)
  async getFolderIdByPath(path: string): Promise<{ id: number }> {
    const params = new URLSearchParams({ path });
    return apiClient.get<{ id: number }>(`${this.baseUrl}/path/id?${params}`);
  }

  // Get folder permissions
  async getFolderPermissions(folderId: number): Promise<FolderPermissionResDto> {
    return apiClient.get<FolderPermissionResDto>(`${this.baseUrl}/${folderId}/permissions`);
  }

  // Get folders by parent (deprecated - use getFolderContents instead)
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

  // Get specific user's repository (root folders) - for admin viewing
  async getUserRepository(
    userId: string,
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

    return apiClient.get<PageResponse<FolderResDto>>(`${this.baseUrl}/user/${userId}?${params}`);
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

  // Search folders (using name parameter in getMyRepository)
  async searchFolders(
    query: string,
    page: number = 0,
    size: number = 20,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<FolderResDto>> {
    return this.getMyRepository(page, size, query, sortBy, sortDirection);
  }

  // Get shared folders
  async getSharedFolders(
    page: number = 0,
    size: number = 20,
    name?: string,
    showFolder: boolean = true,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<FolderRepoResDto> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: sortBy || SortFields.NAME,
      desc: (sortDirection === 'desc').toString(),
      showFolder: showFolder.toString(),
    });

    if (name) {
      params.append('name', name);
    }

    return apiClient.get<FolderRepoResDto>(`${this.baseUrl}/shared?${params}`);
  }

  // Rename folder
  async renameFolder(folderId: number, newName: string): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/rename/${folderId}?name=${encodeURIComponent(newName)}`);
  }

  async changeDescription(folderId: number, description: string): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/change-description/${folderId}?description=${encodeURIComponent(description)}`);
  }

  // Move folder
  async moveFolder(folderId: number, newParentId: number | null): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/move/${folderId}/${newParentId}`);
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
  async getAllowedFoldersToMove(
    entityId: number,
    entityType: MovingType,
    page: number = 0,
    size: number = 20,
    name?: string
  ): Promise<PageResponse<AllowedFoldersToMove>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      type: entityType,
    });

    if (name) {
      params.append('name', name);
    }

    return apiClient.get<PageResponse<AllowedFoldersToMove>>(`${this.baseUrl}/to-move/${entityId}?${params}`);
  }

  // Get folder sharing list (permissions)
  async getFolderSharingList(
    folderId: number,
    page: number = 0,
    size: number = 20,
    search?: string
  ): Promise<PageResponse<TypeShareAccessRes>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    // Add search parameter if provided
    if (search) {
      params.append('search', search);
    }

    return apiClient.get<PageResponse<TypeShareAccessRes>>(`${this.baseUrl}/${folderId}/share?${params}`);
  }

  // Share folder with type (create or update permission)
  // Create new folder permission (POST)
  async createFolderPermission(
    folderId: number,
    shareData: TypeShareAccessWithTypeReq
  ): Promise<TypeShareAccessRes> {
    return apiClient.post<TypeShareAccessRes>(`${this.baseUrl}/${folderId}/share`, shareData);
  }

  // Update existing folder permission (PUT)
  async updateFolderPermission(
    folderId: number,
    shareData: TypeShareAccessWithTypeReq
  ): Promise<TypeShareAccessRes> {
    return apiClient.put<TypeShareAccessRes>(`${this.baseUrl}/${folderId}/share`, shareData);
  }

  // Legacy method - uses PUT
  async shareFolderWithType(
    folderId: number,
    shareData: TypeShareAccessWithTypeReq
  ): Promise<TypeShareAccessRes> {
    return this.updateFolderPermission(folderId, shareData);
  }

  // Revoke folder access
  async revokeFolderAccess(
    folderId: number,
    granteeId: string,
    inherits: boolean = false
  ): Promise<void> {
    const params = new URLSearchParams({
      inherits: inherits.toString(),
    });

    return apiClient.delete<void>(`${this.baseUrl}/${folderId}/share/${granteeId}?${params}`);
  }

  // Get available users for folder (excluding those with existing permissions)
  async getAvailableUsersForFolder(
    folderId: number,
    page: number = 0,
    size: number = 20,
    search?: string
  ): Promise<PageResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    return apiClient.get<PageResponse<any>>(`${this.baseUrl}/${folderId}/available-users?${params}`);
  }

  // Get available roles for folder (excluding those with existing permissions)
  async getAvailableRolesForFolder(
    folderId: number,
    page: number = 0,
    size: number = 20,
    search?: string
  ): Promise<PageResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    return apiClient.get<PageResponse<any>>(`${this.baseUrl}/${folderId}/available-roles?${params}`);
  }

  // Get available groups for folder (excluding those with existing permissions)
  async getAvailableGroupsForFolder(
    folderId: number,
    page: number = 0,
    size: number = 20,
    search?: string
  ): Promise<PageResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    return apiClient.get<PageResponse<any>>(`${this.baseUrl}/${folderId}/available-groups?${params}`);
  }

  // Download folder as ZIP
  async downloadFolder(folderId: number, folderName: string): Promise<void> {
    try {
      const blob = await apiClient.downloadFile(`${this.baseUrl}/${folderId}/download`);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading folder:', error);
      throw error;
    }
  }
}

export const folderService = new FolderService();