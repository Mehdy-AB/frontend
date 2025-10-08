import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { tokenManager } from './auth/tokenManager';
import {
  // User types
  UserDto,
  FullUserDto,
  UserCreateReq,
  UserUpdateReq,
  // Role types
  RoleDto,
  RoleCreateReq,
  RoleUpdateReq,
  // Group types
  GroupDto,
  GroupCreateReq,
  GroupUpdateReq,
  // Document types
  DocumentResponseDto,
  DocumentPermissionResDto,
  FilingCategoryDocDto,
  UpdateDocumentMetadataRequestDto,
  TypeShareAccessDocWithTypeReq,
  TypeShareAccessDocumentRes,
  // Folder types
  FolderResDto,
  FolderPermissionResDto,
  CreateFolderDto,
  FolderRepoResDto,
  TypeShareAccessWithTypeReq,
  TypeShareAccessRes,
  // Filing Categories types
  FilingCategoryRequestDto,
  FilingCategoryResponseDto,
  MetaDataListReq,
  MetaDataListRes,
  // Search types
  GlobalSearchResultDto,
  Filters,
  // Common types
  PageResponse,
  SortFields,
  SortFieldsUser,
  SearchFields,
  ExtractorLanguage,
  // Moving types
  MovingType,
  AllowedFoldersToMove,
  // Audit Log types
  AuditLog,
  AuditLogStatistics,
  // Comment types
  Comment,
  CommentCreateReq,
  CommentUpdateReq,
  CommentCountResponse,
  // Favorite types
  Favorite,
  FavoriteCheckResponse,
  FavoriteCountResponse,
  // Recycle Bin types
  RecycleBinEntry,
  RecycleBinMoveReq,
  RecycleBinRestoreReq,
  RecycleBinPermanentDeleteReq,
  RecycleBinCheckResponse,
  RecycleBinCountResponse,
  // Link Rule types
  ManualLinkRequest,
  ManualLinkResponse,
  RelatedDocumentResponse,
  LinkRuleCacheStatistics
} from '../types/api';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      async (config) => {
        const accessToken = await tokenManager.getValidAccessToken();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh the token
            const refreshed = await tokenManager.refreshAccessToken();
            
            if (refreshed) {
              // Get the new access token
              const newAccessToken = await tokenManager.getAccessToken();
              if (newAccessToken) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              }
              
              // Retry the original request
              return this.client(originalRequest);
            } else {
              // Refresh failed, handle auth failure
              await tokenManager.handleAuthFailure();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            // Refresh failed, handle auth failure
            await tokenManager.handleAuthFailure();
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ==================== USER ENDPOINTS ====================
  
  /**
   * Create a new user
   */
  async createUser(data: UserCreateReq): Promise<FullUserDto> {
    const response: AxiosResponse<FullUserDto> = await this.client.post('/api/v1/admin/users', data);
    return response.data;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<FullUserDto | null> {
    try {
      const response: AxiosResponse<FullUserDto> = await this.client.get(`/api/v1/admin/users/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers(params: {
    page?: number;
    size?: number;
    query?: string;
    desc?: boolean;
    sort?: SortFieldsUser;
    search?: SearchFields;
  } = {}): Promise<UserDto[]> {
    const response: AxiosResponse<UserDto[]> = await this.client.get('/api/v1/admin/users', { params });
    return response.data;
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UserUpdateReq): Promise<UserDto> {
    const response: AxiosResponse<UserDto> = await this.client.put(`/api/v1/admin/users/${id}`, data);
    return response.data;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/api/v1/admin/users/${id}`);
  }

  // ==================== ROLE ENDPOINTS ====================

  /**
   * Create a new role
   */
  async createRole(data: RoleCreateReq): Promise<RoleDto> {
    const response: AxiosResponse<RoleDto> = await this.client.post('/api/v1/admin/roles', data);
    return response.data;
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<RoleDto | null> {
    try {
      const response: AxiosResponse<RoleDto> = await this.client.get(`/api/v1/admin/roles/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all roles
   */
  async getAllRoles(params: {
    page?: number;
    size?: number;
    query?: string;
    desc?: boolean;
  } = {}): Promise<RoleDto[]> {
    const response: AxiosResponse<RoleDto[]> = await this.client.get('/api/v1/admin/roles', { params });
    return response.data;
  }

  /**
   * Update role
   */
  async updateRole(id: string, data: RoleUpdateReq): Promise<RoleDto> {
    const response: AxiosResponse<RoleDto> = await this.client.put(`/api/v1/admin/roles/${id}`, data);
    return response.data;
  }

  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<void> {
    await this.client.delete(`/api/v1/admin/roles/${id}`);
  }

  /**
   * Get users by role
   */
  async getRoleUsers(roleName: string, params: {
    page?: number;
    size?: number;
  } = {}): Promise<UserDto[]> {
    const response: AxiosResponse<UserDto[]> = await this.client.get(`/api/v1/admin/roles/${roleName}/users`, { params });
    return response.data;
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(roleName: string, userId: string): Promise<void> {
    await this.client.post(`/api/v1/admin/roles/${roleName}/users/${userId}`);
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(roleName: string, userId: string): Promise<void> {
    await this.client.delete(`/api/v1/admin/roles/${roleName}/users/${userId}`);
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(roleName: string, permission: string): Promise<void> {
    await this.client.post(`/api/v1/admin/roles/${roleName}/permissions/${permission}`);
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleName: string, permission: string): Promise<void> {
    await this.client.delete(`/api/v1/admin/roles/${roleName}/permissions/${permission}`);
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.client.get('/api/v1/admin/roles/permissions');
    return response.data;
  }

  /**
   * Assign permission directly to user
   */
  async assignPermissionToUser(userId: string, permission: string): Promise<void> {
    await this.client.post(`/api/v1/admin/roles/users/${userId}/permissions/${permission}`);
  }

  /**
   * Remove permission directly from user
   */
  async removePermissionFromUser(userId: string, permission: string): Promise<void> {
    await this.client.delete(`/api/v1/admin/roles/users/${userId}/permissions/${permission}`);
  }

  // ==================== GROUP ENDPOINTS ====================

  /**
   * Create a new group
   */
  async createGroup(data: GroupCreateReq): Promise<GroupDto> {
    const response: AxiosResponse<GroupDto> = await this.client.post('/api/v1/admin/groups', data);
    return response.data;
  }

  /**
   * Get group by ID
   */
  async getGroupById(id: string): Promise<GroupDto | null> {
    try {
      const response: AxiosResponse<GroupDto> = await this.client.get(`/api/v1/admin/groups/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get group by path
   */
  async getGroupByPath(path: string): Promise<GroupDto | null> {
    try {
      const response: AxiosResponse<GroupDto> = await this.client.get('/api/v1/admin/groups/path', { params: { path } });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all groups
   */
  async getAllGroups(params: {
    page?: number;
    size?: number;
    query?: string;
    desc?: boolean;
  } = {}): Promise<GroupDto[]> {
    const response: AxiosResponse<GroupDto[]> = await this.client.get('/api/v1/admin/groups', { params });
    return response.data;
  }

  /**
   * Update group
   */
  async updateGroup(id: string, data: GroupUpdateReq): Promise<GroupDto> {
    const response: AxiosResponse<GroupDto> = await this.client.put(`/api/v1/admin/groups/${id}`, data);
    return response.data;
  }

  /**
   * Delete group
   */
  async deleteGroup(id: string): Promise<void> {
    await this.client.delete(`/api/v1/admin/groups/${id}`);
  }

  /**
   * Add user to group
   */
  async addUserToGroup(groupId: string, userId: string): Promise<void> {
    await this.client.post(`/api/v1/admin/groups/${groupId}/users/${userId}`);
  }

  /**
   * Remove user from group
   */
  async removeUserFromGroup(groupId: string, userId: string): Promise<void> {
    await this.client.delete(`/api/v1/admin/groups/${groupId}/users/${userId}`);
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: string, params: {
    first?: number;
    max?: number;
  } = {}): Promise<UserDto[]> {
    const response: AxiosResponse<UserDto[]> = await this.client.get(`/api/v1/admin/groups/${groupId}/users`, { params });
    return response.data;
  }

  /**
   * Add role to group
   */
  async addRoleToGroup(groupId: string, role: string): Promise<void> {
    await this.client.post(`/api/v1/admin/groups/${groupId}/roles/${role}`);
  }

  /**
   * Remove role from group
   */
  async removeRoleFromGroup(groupId: string, role: string): Promise<void> {
    await this.client.delete(`/api/v1/admin/groups/${groupId}/roles/${role}`);
  }

  /**
   * Get group roles
   */
  async getGroupRoles(groupId: string, params: {
    page?: number;
    size?: number;
  } = {}): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.client.get(`/api/v1/admin/groups/${groupId}/roles`, { params });
    return response.data;
  }

  /**
   * Add permission to group
   */
  async addPermissionToGroup(groupId: string, permission: string): Promise<void> {
    await this.client.post(`/api/v1/admin/groups/${groupId}/permissions/${permission}`);
  }

  /**
   * Remove permission from group
   */
  async removePermissionFromGroup(groupId: string, permission: string): Promise<void> {
    await this.client.delete(`/api/v1/admin/groups/${groupId}/permissions/${permission}`);
  }

  /**
   * Get group permissions
   */
  async getGroupPermissions(groupId: string, params: {
    page?: number;
    size?: number;
  } = {}): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.client.get(`/api/v1/admin/groups/${groupId}/permissions`, { params });
    return response.data;
  }

  // ==================== DOCUMENT ENDPOINTS ====================

  /**
   * Get document details
   */
  async getDocument(id: number): Promise<DocumentResponseDto> {
    const response: AxiosResponse<DocumentResponseDto> = await this.client.get(`/api/v1/document/${id}`);
    return response.data;
  }

  /**
   * Upload document
   */
  async uploadDocument(
    file: File,
    folderId: number,
    title: string,
    lang: ExtractorLanguage,
    filingCategoryDto: FilingCategoryDocDto[]
  ): Promise<DocumentResponseDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId.toString());
    formData.append('title', title);
    formData.append('lang', lang);
    
    // Send filingCategory as a Blob with proper Content-Type for @RequestPart
    const filingCategoryBlob = new Blob([JSON.stringify(filingCategoryDto)], {
      type: 'application/json'
    });
    formData.append('filingCategory', filingCategoryBlob);

    const response: AxiosResponse<DocumentResponseDto> = await this.client.post(
      '/api/v1/document',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Rename document
   */
  async renameDocument(id: number, name: string): Promise<void> {
    await this.client.put(`/api/v1/document/rename/${id}`, null, {
      params: { name }
    });
  }

  /**
   * Edit document title
   */
  async editDocumentTitle(id: number, data: any): Promise<void> {
    await this.client.put(`/api/v1/document/title/${id}`, data);
  }

  /**
   * Edit document description
   */
  async editDocumentDescription(id: number, description: string): Promise<void> {
    await this.client.put(`/api/v1/document/description/${id}`, { description });
  }

  /**
   * Get document versions list
   */
  async getDocumentVersionsList(id: number): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.client.get(`/api/v1/document/${id}/versions`);
    return response.data;
  }

  /**
   * Upload document version
   */
  async uploadDocumentVersion(
    file: File,
    documentId: number,
    lang: ExtractorLanguage,
    filingCategoryDto?: FilingCategoryDocDto[]
  ): Promise<DocumentResponseDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', documentId.toString());
    formData.append('lang', lang);
    
    if (filingCategoryDto && filingCategoryDto.length > 0) {
      const filingCategoryBlob = new Blob([JSON.stringify(filingCategoryDto)], {
        type: 'application/json'
      });
      formData.append('filingCategory', filingCategoryBlob);
    }

    const response: AxiosResponse<DocumentResponseDto> = await this.client.post(
      '/api/v1/document/version',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Move document
   */
  async moveDocument(id: number, to: number): Promise<void> {
    await this.client.put(`/api/v1/document/move/${id}/${to}`);
  }

  /**
   * Download document
   */
  async downloadDocument(id: number, params: {
    version?: number;
    page?: number;
    size?: number;
  } = {}): Promise<string> {
    const response: AxiosResponse<string> = await this.client.get(`/api/v1/document/download/${id}`, { params });
    return response.data;
  }

  /**
   * Log file download operation
   */
  async fileDownloaded(id: number, params: {
    version?: number;
  } = {}): Promise<void> {
    await this.client.post(`/api/v1/document/fileDownloaded/${id}`, null, { params });
  }

  /**
   * Get document shared permissions
   */
  async getDocumentShared(id: number, params: {
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<TypeShareAccessDocumentRes>> {
    const response: AxiosResponse<PageResponse<TypeShareAccessDocumentRes>> = await this.client.get(
      `/api/v1/document/${id}/share`,
      { params }
    );
    return response.data;
  }

  /**
   * Create or update document shared permission
   */
  async createOrUpdateDocumentShared(
    folderId: number,
    data: TypeShareAccessDocWithTypeReq
  ): Promise<TypeShareAccessDocumentRes> {
    const response: AxiosResponse<TypeShareAccessDocumentRes> = await this.client.post(
      `/api/v1/document/${folderId}/share`,
      data
    );
    return response.data;
  }

  /**
   * Delete document shared permission
   */
  async deleteDocumentShared(folderId: number, granteeId: string): Promise<void> {
    await this.client.delete(`/api/v1/document/${folderId}/share/${granteeId}`);
  }

  /**
   * Delete document
   */
  async deleteDocument(id: number): Promise<void> {
    await this.client.delete(`/api/v1/document/${id}`);
  }

  // ==================== FOLDER ENDPOINTS ====================

  /**
   * Create folder
   */
  async createFolder(data: CreateFolderDto): Promise<FolderResDto> {
    const response: AxiosResponse<FolderResDto> = await this.client.post('/api/v1/folder', data);
    return response.data;
  }

  /**
   * Get folder by ID
   */
  async getFolder(
    id: number,
    params: {
      page?: number;
      size?: number;
      name?: string;
      showFolder?: boolean;
      desc?: boolean;
      sort?: SortFields;
    } = {}
  ): Promise<FolderRepoResDto> {
    const response: AxiosResponse<FolderRepoResDto> = await this.client.get(`/api/v1/folder/${id}`, { params });
    return response.data;
  }

  /**
   * Get folder by path
   */
  async getFolderByPath(
    path: string,
    params: {
      page?: number;
      size?: number;
      name?: string;
      showFolder?: boolean;
      desc?: boolean;
      sort?: SortFields;
    } = {}
  ): Promise<FolderRepoResDto> {
    const response: AxiosResponse<FolderRepoResDto> = await this.client.get('/api/v1/folder/path', {
      params: { path, ...params }
    });
    return response.data;
  }

  /**
   * Get repository (root folders)
   */
  async getRepository(params: {
    page?: number;
    size?: number;
    name?: string;
    desc?: boolean;
    sort?: SortFields;
  } = {}): Promise<PageResponse<FolderResDto>> {
    const response: AxiosResponse<PageResponse<FolderResDto>> = await this.client.get('/api/v1/folder', { params });
    return response.data;
  }

  /**
   * Get shared folders
   */
  async getSharedFolders(params: {
    page?: number;
    size?: number;
    name?: string;
    showFolder?: boolean;
    desc?: boolean;
    sort?: SortFields;
  } = {}): Promise<FolderRepoResDto> {
    const response: AxiosResponse<FolderRepoResDto> = await this.client.get('/api/v1/folder/shared', { params });
    return response.data;
  }

  /**
   * Rename folder
   */
  async renameFolder(id: number, name: string): Promise<void> {
    await this.client.put(`/api/v1/folder/rename/${id}`, null, {
      params: { name }
    });
  }

  /**
   * Move folder
   */
  async moveFolder(id: number, to: number): Promise<void> {
    await this.client.put(`/api/v1/folder/move/${id}/${to}`);
  }

  /**
   * Get folder shared permissions
   */
  async getFolderShared(id: number, params: {
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<TypeShareAccessRes>> {
    const response: AxiosResponse<PageResponse<TypeShareAccessRes>> = await this.client.get(
      `/api/v1/folder/${id}/share`,
      { params }
    );
    return response.data;
  }

  /**
   * Create or update folder shared permission
   */
  async createOrUpdateFolderShared(
    folderId: number,
    data: TypeShareAccessWithTypeReq
  ): Promise<TypeShareAccessRes> {
    const response: AxiosResponse<TypeShareAccessRes> = await this.client.post(
      `/api/v1/folder/${folderId}/share`,
      data
    );
    return response.data;
  }

  /**
   * Delete folder shared permission
   */
  async deleteFolderShared(folderId: number, granteeId: string, inherits: boolean): Promise<void> {
    await this.client.delete(`/api/v1/folder/${folderId}/share/${granteeId}`, {
      params: { inherits }
    });
  }

  /**
   * Get folders available for moving to
   */
  async getFoldersToMove(
    id: number,
    params: {
      page?: number;
      size?: number;
      type?: MovingType;
      name?: string;
    } = {}
  ): Promise<PageResponse<AllowedFoldersToMove>> {
    const response: AxiosResponse<PageResponse<AllowedFoldersToMove>> = await this.client.get(
      `/api/v1/folder/to-move/${id}`,
      { params }
    );
    return response.data;
  }

  /**
   * Delete folder
   */
  async deleteFolder(id: number): Promise<void> {
    await this.client.delete(`/api/v1/folder/${id}`);
  }

  // ==================== FILING CATEGORIES ENDPOINTS ====================

  /**
   * Create filing category
   */
  async createFilingCategory(data: FilingCategoryRequestDto): Promise<FilingCategoryResponseDto> {
    const response: AxiosResponse<FilingCategoryResponseDto> = await this.client.post('/api/v1/filing-categories', data);
    return response.data;
  }

  /**
   * Get all filing categories
   */
  async getAllFilingCategories(params: {
    name?: string;
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<FilingCategoryResponseDto>> {
    const response: AxiosResponse<PageResponse<FilingCategoryResponseDto>> = await this.client.get(
      '/api/v1/filing-categories',
      { params }
    );
    return response.data;
  }

  /**
   * Get filing category by ID
   */
  async getFilingCategoryById(id: number): Promise<FilingCategoryResponseDto> {
    const response: AxiosResponse<FilingCategoryResponseDto> = await this.client.get(`/api/v1/filing-categories/${id}`);
    return response.data;
  }

  /**
   * Update filing category
   */
  async updateFilingCategory(id: number, data: FilingCategoryRequestDto): Promise<FilingCategoryResponseDto> {
    const response: AxiosResponse<FilingCategoryResponseDto> = await this.client.put(`/api/v1/filing-categories/${id}`, data);
    return response.data;
  }

  /**
   * Delete filing category
   */
  async deleteFilingCategory(id: number): Promise<void> {
    await this.client.delete(`/api/v1/filing-categories/${id}`);
  }

  // ==================== METADATA LIST ENDPOINTS ====================

  /**
   * Create metadata list
   */
  async createMetadataList(data: MetaDataListReq): Promise<MetaDataListRes> {
    const response: AxiosResponse<MetaDataListRes> = await this.client.post('/api/v1/filing-categories/list', data);
    return response.data;
  }

  /**
   * Get all metadata lists
   */
  async getAllMetadataLists(params: {
    name?: string;
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<MetaDataListRes>> {
    const response: AxiosResponse<PageResponse<MetaDataListRes>> = await this.client.get(
      '/api/v1/filing-categories/list',
      { params }
    );
    return response.data;
  }

  /**
   * Get metadata list by ID
   */
  async getMetadataListById(id: number): Promise<MetaDataListRes> {
    const response: AxiosResponse<MetaDataListRes> = await this.client.get(`/api/v1/filing-categories/list/${id}`);
    return response.data;
  }

  /**
   * Update metadata list
   */
  async updateMetadataList(id: number, data: MetaDataListReq): Promise<MetaDataListRes> {
    const response: AxiosResponse<MetaDataListRes> = await this.client.put(`/api/v1/filing-categories/list/${id}`, data);
    return response.data;
  }

  /**
   * Delete metadata list
   */
  async deleteMetadataList(id: number): Promise<void> {
    await this.client.delete(`/api/v1/filing-categories/list/${id}`);
  }

  // ==================== SEARCH ENDPOINTS ====================

  /**
   * Global search
   */
  async globalSearch(params: {
    page?: number;
    size?: number;
    query?: string;
    lookUpFolderName?: boolean;
    lookUpDocumentName?: boolean;
    lookUpMetadataKey?: boolean;
    lookUpMetadataValue?: boolean;
    lookUpCategoryName?: boolean;
    lookUpOcrContent?: boolean;
    lookUpDescription?: boolean;
    includeFolders?: boolean;
    includeDocuments?: boolean;
    sortBy?: string;
    sortDesc?: boolean;
  } = {}): Promise<GlobalSearchResultDto> {
    const response: AxiosResponse<GlobalSearchResultDto> = await this.client.get('/api/v1/search', { params });
    return response.data;
  }

  /**
   * Enhanced search with version support
   */
  async enhancedSearch(query: string, params: {
    page?: number;
    size?: number;
    lookUpFolderName?: boolean;
    lookUpDocumentName?: boolean;
    lookUpMetadataKey?: boolean;
    lookUpMetadataValue?: boolean;
    lookUpCategoryName?: boolean;
    lookUpOcrContent?: boolean;
    lookUpDescription?: boolean;
    includeFolders?: boolean;
    includeDocuments?: boolean;
  } = {}): Promise<GlobalSearchResultDto> {
    const response: AxiosResponse<GlobalSearchResultDto> = await this.client.get('/api/v1/search/enhanced', { 
      params: { query, ...params } 
    });
    return response.data;
  }

  /**
   * Search in document versions
   */
  async searchInVersions(query: string, params: {
    page?: number;
    size?: number;
    lookUpDocumentName?: boolean;
    lookUpOcrContent?: boolean;
  } = {}): Promise<GlobalSearchResultDto> {
    const response: AxiosResponse<GlobalSearchResultDto> = await this.client.get('/api/v1/search/versions', { 
      params: { query, ...params } 
    });
    return response.data;
  }

  /**
   * Get document versions
   */
  async getDocumentVersions(documentId: number, query?: string): Promise<GlobalSearchResultDto> {
    const params = query ? { query } : {};
    const response: AxiosResponse<GlobalSearchResultDto> = await this.client.get(`/api/v1/search/document/${documentId}/versions`, { params });
    return response.data;
  }

  /**
   * Set active version for a document
   */
  async setActiveVersion(documentId: number, versionId: number): Promise<void> {
    await this.client.put(`/api/v1/document/${documentId}/activeVersion/${versionId}`);
  }

  /**
   * Update document metadata
   */
  async updateDocumentMetadata(documentId: number, request: UpdateDocumentMetadataRequestDto): Promise<void> {
    await this.client.put(`/api/v1/document/${documentId}/metadata`, request);
  }

  /**
   * Update document filing category
   */
  async updateDocumentFilingCategory(documentId: number, filingCategoryDto: FilingCategoryDocDto[]): Promise<DocumentResponseDto> {
    const response: AxiosResponse<DocumentResponseDto> = await this.client.put(`/api/v1/document/${documentId}/filing-category`, filingCategoryDto);
    return response.data;
  }

  // ==================== AUDIT LOG ENDPOINTS ====================

  /**
   * Get all audit logs with pagination
   */
  async getAllAuditLogs(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<AuditLog>> {
    const response: AxiosResponse<PageResponse<AuditLog>> = await this.client.get('/api/v1/admin/audit-logs', { params });
    return response.data;
  }

  /**
   * Get audit logs by user
   */
  async getAuditLogsByUser(userId: string, params: {
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<AuditLog>> {
    const response: AxiosResponse<PageResponse<AuditLog>> = await this.client.get(`/api/v1/admin/audit-logs/user/${userId}`, { params });
    return response.data;
  }

  /**
   * Get audit logs by entity
   */
  async getAuditLogsByEntity(entityType: string, entityId: string, params: {
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<AuditLog>> {
    const response: AxiosResponse<PageResponse<AuditLog>> = await this.client.get(`/api/v1/admin/audit-logs/entity/${entityType}/${entityId}`, { params });
    return response.data;
  }

  /**
   * Get audit logs by search term
   */
  async getAuditLogsBySearchTerm(searchTerm: string, params: {
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<AuditLog>> {
    const response: AxiosResponse<PageResponse<AuditLog>> = await this.client.get('/api/v1/admin/audit-logs/search', { 
      params: { searchTerm, ...params } 
    });
    return response.data;
  }

  /**
   * Get audit logs by date range
   */
  async getAuditLogsByDateRange(startDate: string, endDate: string, params: {
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<AuditLog>> {
    const response: AxiosResponse<PageResponse<AuditLog>> = await this.client.get('/api/v1/admin/audit-logs/date-range', { 
      params: { startDate, endDate, ...params } 
    });
    return response.data;
  }

  /**
   * Get action statistics
   */
  async getActionStatistics(startDate: string, endDate: string): Promise<AuditLogStatistics> {
    const response: AxiosResponse<AuditLogStatistics> = await this.client.get('/api/v1/admin/audit-logs/statistics/actions', {
      params: { startDate, endDate }
    });
    return response.data;
  }

  /**
   * Get user activity statistics
   */
  async getUserActivityStatistics(startDate: string, endDate: string): Promise<AuditLogStatistics> {
    const response: AxiosResponse<AuditLogStatistics> = await this.client.get('/api/v1/admin/audit-logs/statistics/user-activity', {
      params: { startDate, endDate }
    });
    return response.data;
  }

  /**
   * Get entity type statistics
   */
  async getEntityTypeStatistics(startDate: string, endDate: string): Promise<AuditLogStatistics> {
    const response: AxiosResponse<AuditLogStatistics> = await this.client.get('/api/v1/admin/audit-logs/statistics/entity-types', {
      params: { startDate, endDate }
    });
    return response.data;
  }

  // ==================== COMMENT ENDPOINTS ====================

  /**
   * Add new comment
   */
  async addComment(data: CommentCreateReq): Promise<Comment> {
    const response: AxiosResponse<Comment> = await this.client.post('/api/v1/comments', null, {
      params: data
    });
    return response.data;
  }

  /**
   * Get comments for specific entity
   */
  async getCommentsByEntity(entityType: string, entityId: number, params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<Comment>> {
    const response: AxiosResponse<PageResponse<Comment>> = await this.client.get(`/api/v1/comments/entity/${entityType}/${entityId}`, { params });
    return response.data;
  }

  /**
   * Get comments by user
   */
  async getCommentsByUser(userId: string, params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<Comment>> {
    const response: AxiosResponse<PageResponse<Comment>> = await this.client.get(`/api/v1/comments/user/${userId}`, { params });
    return response.data;
  }

  /**
   * Get current user's comments
   */
  async getMyComments(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<Comment>> {
    const response: AxiosResponse<PageResponse<Comment>> = await this.client.get('/api/v1/comments/my-comments', { params });
    return response.data;
  }

  /**
   * Get replies to a comment
   */
  async getCommentReplies(commentId: number, params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<Comment>> {
    const response: AxiosResponse<PageResponse<Comment>> = await this.client.get(`/api/v1/comments/${commentId}/replies`, { params });
    return response.data;
  }

  /**
   * Get specific comment
   */
  async getComment(commentId: number): Promise<Comment> {
    const response: AxiosResponse<Comment> = await this.client.get(`/api/v1/comments/${commentId}`);
    return response.data;
  }

  /**
   * Update comment text
   */
  async updateComment(commentId: number, data: CommentUpdateReq): Promise<Comment> {
    const response: AxiosResponse<Comment> = await this.client.put(`/api/v1/comments/${commentId}`, null, {
      params: data
    });
    return response.data;
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: number): Promise<void> {
    await this.client.delete(`/api/v1/comments/${commentId}`);
  }

  /**
   * Get comment count for entity
   */
  async getCommentCount(entityType: string, entityId: number): Promise<CommentCountResponse> {
    const response: AxiosResponse<CommentCountResponse> = await this.client.get(`/api/v1/comments/entity/${entityType}/${entityId}/count`);
    return response.data;
  }

  /**
   * Get comment count for user
   */
  async getUserCommentCount(userId: string): Promise<CommentCountResponse> {
    const response: AxiosResponse<CommentCountResponse> = await this.client.get(`/api/v1/comments/user/${userId}/count`);
    return response.data;
  }

  /**
   * Get current user's comment count
   */
  async getMyCommentCount(): Promise<CommentCountResponse> {
    const response: AxiosResponse<CommentCountResponse> = await this.client.get('/api/v1/comments/my-comments/count');
    return response.data;
  }

  /**
   * Get all comments (admin)
   */
  async getAllComments(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<Comment>> {
    const response: AxiosResponse<PageResponse<Comment>> = await this.client.get('/api/v1/comments', { params });
    return response.data;
  }

  // ==================== FAVORITE ENDPOINTS ====================

  /**
   * Add document to favorites
   */
  async addToFavorites(documentId: number): Promise<Favorite> {
    const response: AxiosResponse<Favorite> = await this.client.post(`/api/v1/favorites/document/${documentId}`);
    return response.data;
  }

  /**
   * Remove document from favorites
   */
  async removeFromFavorites(documentId: number): Promise<void> {
    await this.client.delete(`/api/v1/favorites/document/${documentId}`);
  }

  /**
   * Check if document is favorite
   */
  async isFavorite(documentId: number): Promise<FavoriteCheckResponse> {
    const response: AxiosResponse<FavoriteCheckResponse> = await this.client.get(`/api/v1/favorites/document/${documentId}/check`);
    return response.data;
  }

  /**
   * Get current user's favorites
   */
  async getMyFavorites(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<Favorite>> {
    const response: AxiosResponse<PageResponse<Favorite>> = await this.client.get('/api/v1/favorites/my-favorites', { params });
    return response.data;
  }

  /**
   * Get favorites by user
   */
  async getFavoritesByUser(userId: string, params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<Favorite>> {
    const response: AxiosResponse<PageResponse<Favorite>> = await this.client.get(`/api/v1/favorites/user/${userId}`, { params });
    return response.data;
  }

  /**
   * Get favorites for document
   */
  async getFavoritesByDocument(documentId: number, params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<Favorite>> {
    const response: AxiosResponse<PageResponse<Favorite>> = await this.client.get(`/api/v1/favorites/document/${documentId}`, { params });
    return response.data;
  }

  /**
   * Get current user's favorite count
   */
  async getMyFavoritesCount(): Promise<FavoriteCountResponse> {
    const response: AxiosResponse<FavoriteCountResponse> = await this.client.get('/api/v1/favorites/my-favorites/count');
    return response.data;
  }

  /**
   * Get user's favorite count
   */
  async getUserFavoritesCount(userId: string): Promise<FavoriteCountResponse> {
    const response: AxiosResponse<FavoriteCountResponse> = await this.client.get(`/api/v1/favorites/user/${userId}/count`);
    return response.data;
  }

  /**
   * Get document's favorite count
   */
  async getDocumentFavoritesCount(documentId: number): Promise<FavoriteCountResponse> {
    const response: AxiosResponse<FavoriteCountResponse> = await this.client.get(`/api/v1/favorites/document/${documentId}/count`);
    return response.data;
  }

  /**
   * Get all favorites (admin)
   */
  async getAllFavorites(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<Favorite>> {
    const response: AxiosResponse<PageResponse<Favorite>> = await this.client.get('/api/v1/favorites', { params });
    return response.data;
  }

  // ==================== FOLDER FAVORITE ENDPOINTS ====================

  /**
   * Add folder to favorites
   */
  async addFolderToFavorites(folderId: number): Promise<any> {
    const response: AxiosResponse<any> = await this.client.post(`/api/v1/favorites/folder/${folderId}`);
    return response.data;
  }

  /**
   * Remove folder from favorites
   */
  async removeFolderFromFavorites(folderId: number): Promise<void> {
    await this.client.delete(`/api/v1/favorites/folder/${folderId}`);
  }

  /**
   * Check if folder is favorite
   */
  async isFolderFavorite(folderId: number): Promise<FavoriteCheckResponse> {
    const response: AxiosResponse<FavoriteCheckResponse> = await this.client.get(`/api/v1/favorites/folder/${folderId}/check`);
    return response.data;
  }

  /**
   * Get current user's folder favorites
   */
  async getMyFolderFavorites(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<any>> {
    const response: AxiosResponse<PageResponse<any>> = await this.client.get('/api/v1/favorites/my-folder-favorites', { params });
    return response.data;
  }

  /**
   * Get folder favorites by folder
   */
  async getFolderFavoritesByFolder(folderId: number, params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<any>> {
    const response: AxiosResponse<PageResponse<any>> = await this.client.get(`/api/v1/favorites/folder/${folderId}`, { params });
    return response.data;
  }

  /**
   * Get current user's folder favorite count
   */
  async getMyFolderFavoritesCount(): Promise<FavoriteCountResponse> {
    const response: AxiosResponse<FavoriteCountResponse> = await this.client.get('/api/v1/favorites/my-folder-favorites/count');
    return response.data;
  }

  // ==================== COMBINED FAVORITES ====================

  /**
   * Get all favorites (documents and folders) for current user
   */
  async getMyRepo(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<PageResponse<any>> {
    const response: AxiosResponse<PageResponse<any>> = await this.client.get('/api/v1/favorites/my-repo', { params });
    return response.data;
  }

  /**
   * Get count of all favorites for current user
   */
  async getMyRepoCount(): Promise<FavoriteCountResponse> {
    const response: AxiosResponse<FavoriteCountResponse> = await this.client.get('/api/v1/favorites/my-repo/count');
    return response.data;
  }

  /**
   * Check favorite status for multiple documents and folders
   */
  async checkFavoriteStatus(request: {
    documentIds?: number[];
    folderIds?: number[];
  }): Promise<{
    documents?: Record<number, boolean>;
    folders?: Record<number, boolean>;
  }> {
    const response: AxiosResponse<any> = await this.client.post('/api/v1/favorites/check-status', request);
    return response.data;
  }

  // ==================== RECYCLE BIN ENDPOINTS ====================

  /**
   * Move entity to recycle bin
   */
  async moveToRecycleBin(data: RecycleBinMoveReq): Promise<RecycleBinEntry> {
    const response: AxiosResponse<RecycleBinEntry> = await this.client.post('/api/v1/recycle-bin/move', null, {
      params: data
    });
    return response.data;
  }

  /**
   * Restore entity from recycle bin
   */
  async restoreFromRecycleBin(data: RecycleBinRestoreReq): Promise<void> {
    await this.client.post('/api/v1/recycle-bin/restore', null, {
      params: data
    });
  }

  /**
   * Permanently delete entity
   */
  async permanentlyDelete(data: RecycleBinPermanentDeleteReq): Promise<void> {
    await this.client.delete('/api/v1/recycle-bin/permanent', {
      params: data
    });
  }

  /**
   * Empty entire recycle bin
   */
  async emptyRecycleBin(): Promise<void> {
    await this.client.delete('/api/v1/recycle-bin/empty');
  }

  /**
   * Empty current user's recycle bin
   */
  async emptyMyRecycleBin(): Promise<void> {
    await this.client.delete('/api/v1/recycle-bin/empty/my');
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
    const response: AxiosResponse<PageResponse<RecycleBinEntry>> = await this.client.get('/api/v1/recycle-bin', { params });
    return response.data;
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
    const response: AxiosResponse<PageResponse<RecycleBinEntry>> = await this.client.get(`/api/v1/recycle-bin/entity-type/${entityType}`, { params });
    return response.data;
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
    const response: AxiosResponse<PageResponse<RecycleBinEntry>> = await this.client.get('/api/v1/recycle-bin/my-entries', { params });
    return response.data;
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
    const response: AxiosResponse<PageResponse<RecycleBinEntry>> = await this.client.get(`/api/v1/recycle-bin/user/${userId}`, { params });
    return response.data;
  }

  /**
   * Check if entity is in recycle bin
   */
  async isInRecycleBin(entityType: string, entityId: number): Promise<RecycleBinCheckResponse> {
    const response: AxiosResponse<RecycleBinCheckResponse> = await this.client.get('/api/v1/recycle-bin/check', {
      params: { entityType, entityId }
    });
    return response.data;
  }

  /**
   * Get total recycle bin count
   */
  async getRecycleBinCount(): Promise<RecycleBinCountResponse> {
    const response: AxiosResponse<RecycleBinCountResponse> = await this.client.get('/api/v1/recycle-bin/count');
    return response.data;
  }

  /**
   * Get count by entity type
   */
  async getRecycleBinCountByEntityType(entityType: string): Promise<RecycleBinCountResponse> {
    const response: AxiosResponse<RecycleBinCountResponse> = await this.client.get(`/api/v1/recycle-bin/count/entity-type/${entityType}`);
    return response.data;
  }

  /**
   * Get current user's entry count
   */
  async getMyRecycleBinCount(): Promise<RecycleBinCountResponse> {
    const response: AxiosResponse<RecycleBinCountResponse> = await this.client.get('/api/v1/recycle-bin/count/my-entries');
    return response.data;
  }

  /**
   * Get user's entry count
   */
  async getUserRecycleBinCount(userId: string): Promise<RecycleBinCountResponse> {
    const response: AxiosResponse<RecycleBinCountResponse> = await this.client.get(`/api/v1/recycle-bin/count/user/${userId}`);
    return response.data;
  }

  /**
   * Cleanup old entries
   */
  async cleanupOldRecycleBinEntries(cutoffDate: string): Promise<void> {
    await this.client.delete('/api/v1/recycle-bin/cleanup', {
      params: { cutoffDate }
    });
  }

  /**
   * Get specific recycle bin entry
   */
  async getRecycleBinEntry(id: number): Promise<RecycleBinEntry> {
    const response: AxiosResponse<RecycleBinEntry> = await this.client.get(`/api/v1/recycle-bin/${id}`);
    return response.data;
  }

  // ==================== LINK RULE ENDPOINTS ====================

  /**
   * Create a manual link between two documents
   */
  async createManualLink(data: ManualLinkRequest): Promise<ManualLinkResponse> {
    const response: AxiosResponse<ManualLinkResponse> = await this.client.post('/api/v1/link-rules/manual-links', data);
    return response.data;
  }

  /**
   * Get all manual links for a document
   */
  async getDocumentManualLinks(documentId: number): Promise<ManualLinkResponse[]> {
    const response: AxiosResponse<ManualLinkResponse[]> = await this.client.get(`/api/v1/link-rules/documents/${documentId}/manual-links`);
    return response.data;
  }

  /**
   * Get outgoing manual links for a document
   */
  async getOutgoingManualLinks(documentId: number): Promise<ManualLinkResponse[]> {
    const response: AxiosResponse<ManualLinkResponse[]> = await this.client.get(`/api/v1/link-rules/documents/${documentId}/manual-links/outgoing`);
    return response.data;
  }

  /**
   * Get incoming manual links for a document
   */
  async getIncomingManualLinks(documentId: number): Promise<ManualLinkResponse[]> {
    const response: AxiosResponse<ManualLinkResponse[]> = await this.client.get(`/api/v1/link-rules/documents/${documentId}/manual-links/incoming`);
    return response.data;
  }

  /**
   * Update a manual link
   */
  async updateManualLink(linkId: number, data: ManualLinkRequest): Promise<ManualLinkResponse> {
    const response: AxiosResponse<ManualLinkResponse> = await this.client.put(`/api/v1/link-rules/manual-links/${linkId}`, data);
    return response.data;
  }

  /**
   * Delete a manual link
   */
  async deleteManualLink(linkId: number): Promise<void> {
    await this.client.delete(`/api/v1/link-rules/manual-links/${linkId}`);
  }

  /**
   * Get all related documents (manual + automatic) for a document
   */
  async getRelatedDocuments(documentId: number): Promise<RelatedDocumentResponse[]> {
    const response: AxiosResponse<RelatedDocumentResponse[]> = await this.client.get(`/api/v1/link-rules/documents/${documentId}/related`);
    return response.data;
  }

  /**
   * Trigger manual revalidation of all rules (admin only)
   */
  async triggerLinkRuleRevalidation(): Promise<void> {
    await this.client.post('/api/v1/link-rules/admin/revalidate');
  }

  /**
   * Revalidate a specific rule (admin only)
   */
  async revalidateLinkRule(ruleId: number): Promise<void> {
    await this.client.post(`/api/v1/link-rules/admin/rules/${ruleId}/revalidate`);
  }

  /**
   * Get cache statistics (admin only)
   */
  async getLinkRuleCacheStatistics(): Promise<LinkRuleCacheStatistics> {
    const response: AxiosResponse<LinkRuleCacheStatistics> = await this.client.get('/api/v1/link-rules/admin/cache/statistics');
    return response.data;
  }

  /**
   * Clear cache for a specific document (admin only)
   */
  async clearDocumentLinkCache(documentId: number): Promise<void> {
    await this.client.delete(`/api/v1/link-rules/admin/documents/${documentId}/cache`);
  }

  /**
   * Clear cache for a specific rule (admin only)
   */
  async clearRuleLinkCache(ruleId: number): Promise<void> {
    await this.client.delete(`/api/v1/link-rules/admin/rules/${ruleId}/cache`);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;
