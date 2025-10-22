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
  // Tag types
  CreateTagRequestDto,
  UpdateTagRequestDto,
  AddTagToDocumentRequestDto,
  TagResponseDto,
  DocumentTagResponseDto,
  // Link Rule types
  LinkRuleRequestDto,
  LinkRuleResponseDto,
  DocumentLinkRequestDto,
  DocumentLinkResponseDto,
  RelatedDocumentResponseDto,
  // Enhanced ClassA types
  ClassAUploadRequestDto,
  ClassAResponseDto,
  ClassADetailResponseDto,
  ClassASearchRequestDto,
  ClassAStatisticsResponseDto,
  // Bulk Upload types
  BulkUploadRequestDto,
  BulkUploadResponseDto,
  // Document Search types
  DocumentSearchResultDto,
  DocumentSearchResponseDto,
  // Document Update types
  UpdateDocumentDescriptionRequestDto,
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
  AdvancedSearchResponseDto,
  UnifiedSearchRequestDto,
  AdvancedSearchRequestDto,
  SearchRequestDto,
  Filters,
  ModelMetadataFilterDto,
  MetadataFieldFilter,
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
  // Document search types
  DocumentSearchResponse,
  // Rule execution types
  RuleExecutionRequest,
  RuleExecutionResponse,
  RuleStatistics,
  BulkRuleExecutionRequest,
  BulkRuleExecutionResponse,
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
        console.error('API Error:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            params: error.config?.params
          }
        });
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
   * Upload multiple documents (bulk upload)
   */
  async uploadMultipleDocuments(
    files: File[],
    folderId: number,
    title: string,
    lang: ExtractorLanguage,
    categoryId?: number,
    fileName?: string,
    tags?: number[],
    filingCategoryDto?: FilingCategoryDocDto | null
  ): Promise<BulkUploadResponseDto> {
    const formData = new FormData();
    
    // Add all files
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    
    formData.append('folderId', folderId.toString());
    formData.append('title', title);
    formData.append('lang', lang);
    
    // Add category ID (required for multi-file uploads)
    if (categoryId) {
      formData.append('categoryId', categoryId.toString());
    }
    
    // Add optional fileName
    if (fileName) {
      formData.append('fileName', fileName);
    }
    
    // Add optional tags
    if (tags && tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }
    
    // Add filing category metadata if available (using @RequestPart)
    if (filingCategoryDto) {
      // Create a Blob with JSON content type for the filing category
      const filingCategoryBlob = new Blob([JSON.stringify(filingCategoryDto)], {
        type: 'application/json'
      });
      formData.append('filingCategory', filingCategoryBlob);
    }

    const response: AxiosResponse<BulkUploadResponseDto> = await this.client.post(
      '/api/v1/document/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
  async uploadDocument(
    file: File,
    folderId: number,
    title: string,
    lang: ExtractorLanguage,
    filingCategoryDto: FilingCategoryDocDto | null,
    fileName?: string,
    tags?: number[]
  ): Promise<DocumentResponseDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId.toString());
    formData.append('title', title);
    formData.append('lang', lang);
    
    // Add optional fileName
    if (fileName) {
      formData.append('fileName', fileName);
    }
    
    // Add optional tags
    if (tags && tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }
    
    // Create a Blob with JSON content type for the filing category
    if (filingCategoryDto) {
    const filingCategoryBlob = new Blob([JSON.stringify(filingCategoryDto)], {
      type: 'application/json'
    });
    formData.append('filingCategory', filingCategoryBlob);
  }

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
   * Unified smart search (POST endpoint with smart routing)
   */
  async unifiedSearch(data: UnifiedSearchRequestDto): Promise<GlobalSearchResultDto> {
    const response: AxiosResponse<GlobalSearchResultDto> = await this.client.post('/api/v1/search', data);
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

  // ==================== TAG ENDPOINTS ====================

  /**
   * Create a new tag
   */
  async createTag(request: CreateTagRequestDto): Promise<TagResponseDto> {
    const response: AxiosResponse<TagResponseDto> = await this.client.post('/api/v1/tags', request);
    return response.data;
  }

  /**
   * Get tag by ID
   */
  async getTagById(id: number): Promise<TagResponseDto> {
    const response: AxiosResponse<TagResponseDto> = await this.client.get(`/api/v1/tags/${id}`);
    return response.data;
  }

  /**
   * Get tag by name
   */
  async getTagByName(name: string): Promise<TagResponseDto> {
    const response: AxiosResponse<TagResponseDto> = await this.client.get(`/api/v1/tags/name/${name}`);
    return response.data;
  }

  /**
   * Get all tags
   */
  async getAllTags(): Promise<TagResponseDto[]> {
    const response: AxiosResponse<TagResponseDto[]> = await this.client.get('/api/v1/tags');
    return response.data;
  }

  /**
   * Get tags by user ID
   */
  async getTagsByUser(userId: string): Promise<TagResponseDto[]> {
    const response: AxiosResponse<TagResponseDto[]> = await this.client.get(`/api/v1/tags/user/${userId}`);
    return response.data;
  }

  /**
   * Get current user's tags
   */
  async getMyTags(): Promise<TagResponseDto[]> {
    const response: AxiosResponse<TagResponseDto[]> = await this.client.get('/api/v1/tags/my-tags');
    return response.data;
  }

  /**
   * Get available tags for current user
   */
  async getAvailableTags(): Promise<TagResponseDto[]> {
    const response: AxiosResponse<TagResponseDto[]> = await this.client.get('/api/v1/tags/available');
    return response.data;
  }

  /**
   * Get system tags
   */
  async getSystemTags(): Promise<TagResponseDto[]> {
    const response: AxiosResponse<TagResponseDto[]> = await this.client.get('/api/v1/tags/system');
    return response.data;
  }

  /**
   * Search tags by name
   */
  async searchTags(name: string, page: number = 0, size: number = 20): Promise<PageResponse<TagResponseDto>> {
    const response: AxiosResponse<PageResponse<TagResponseDto>> = await this.client.post('/api/v1/tags/search', {
      name,
      page,
      size
    });
    return response.data;
  }

  /**
   * Update tag
   */
  async updateTag(id: number, request: UpdateTagRequestDto): Promise<TagResponseDto> {
    const response: AxiosResponse<TagResponseDto> = await this.client.put(`/api/v1/tags/${id}`, request);
    return response.data;
  }

  /**
   * Delete tag
   */
  async deleteTag(id: number): Promise<void> {
    await this.client.delete(`/api/v1/tags/${id}`);
  }

  /**
   * Add tag to document
   */
  async addTagToDocument(documentId: number, request: AddTagToDocumentRequestDto): Promise<DocumentTagResponseDto> {
    const response: AxiosResponse<DocumentTagResponseDto> = await this.client.post(`/api/v1/tags/documents/${documentId}/tags`, request);
    return response.data;
  }

  /**
   * Remove tag from document
   */
  async removeTagFromDocument(documentId: number, tagId: number): Promise<void> {
    await this.client.delete(`/api/v1/tags/documents/${documentId}/tags/${tagId}`);
  }

  /**
   * Remove all tags from document
   */
  async removeAllTagsFromDocument(documentId: number): Promise<void> {
    await this.client.delete(`/api/v1/tags/documents/${documentId}/tags`);
  }

  /**
   * Get tags by document ID
   */
  async getTagsByDocumentId(documentId: number): Promise<TagResponseDto[]> {
    const response: AxiosResponse<TagResponseDto[]> = await this.client.get(`/api/v1/tags/documents/${documentId}/tags`);
    return response.data;
  }

  /**
   * Get document IDs by tag ID
   */
  async getDocumentIdsByTagId(tagId: number): Promise<number[]> {
    const response: AxiosResponse<number[]> = await this.client.get(`/api/v1/tags/${tagId}/documents`);
    return response.data;
  }

  /**
   * Get tag statistics
   */
  async getTagStatistics(): Promise<{ totalTags: number; userTags: number }> {
    const response: AxiosResponse<{ totalTags: number; userTags: number }> = await this.client.get('/api/v1/tags/statistics');
    return response.data;
  }

  /**
   * Get tag statistics by tag ID
   */
  async getTagStatisticsById(tagId: number): Promise<{ tagId: number; documentCount: number }> {
    const response: AxiosResponse<{ tagId: number; documentCount: number }> = await this.client.get(`/api/v1/tags/${tagId}/statistics`);
    return response.data;
  }

  // ==================== LINK RULE ENDPOINTS ====================

  /**
   * Create a link rule
   */
  async createLinkRule(request: LinkRuleRequestDto): Promise<LinkRuleResponseDto> {
    const response: AxiosResponse<LinkRuleResponseDto> = await this.client.post('/api/link-rules', request);
    return response.data;
  }

  /**
   * Update a link rule
   */
  async updateLinkRule(ruleId: number, request: LinkRuleRequestDto): Promise<LinkRuleResponseDto> {
    const response: AxiosResponse<LinkRuleResponseDto> = await this.client.put(`/api/link-rules/${ruleId}`, request);
    return response.data;
  }

  /**
   * Delete a link rule
   */
  async deleteLinkRule(ruleId: number): Promise<void> {
    await this.client.delete(`/api/link-rules/${ruleId}`);
  }

  /**
   * Get link rule by ID
   */
  async getLinkRule(ruleId: number): Promise<LinkRuleResponseDto> {
    const response: AxiosResponse<LinkRuleResponseDto> = await this.client.get(`/api/link-rules/${ruleId}`);
    return response.data;
  }

  /**
   * Get all link rules
   */
  async getAllLinkRules(): Promise<LinkRuleResponseDto[]> {
    const response: AxiosResponse<LinkRuleResponseDto[]> = await this.client.get('/api/link-rules');
    return response.data;
  }

  /**
   * Get all link rules with pagination and filters
   */
  async getAllLinkRulesPaginated(params: {
    page?: number;
    size?: number;
    enabled?: boolean;
    linkType?: string;
    name?: string;
  } = {}): Promise<PageResponse<LinkRuleResponseDto>> {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.enabled !== undefined) queryParams.append('enabled', params.enabled.toString());
    if (params.linkType) queryParams.append('linkType', params.linkType);
    if (params.name) queryParams.append('name', params.name);
    
    const response: AxiosResponse<PageResponse<LinkRuleResponseDto>> = await this.client.get(`/api/link-rules?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Toggle rule enabled/disabled
   */
  async toggleLinkRule(ruleId: number, enabled: boolean): Promise<void> {
    await this.client.put(`/api/link-rules/${ruleId}/toggle?enabled=${enabled}`);
  }

  /**
   * Apply a specific rule to all documents (async)
   */
  async applyLinkRule(ruleId: number): Promise<{ message: string; status: string; ruleId: number }> {
    const response: AxiosResponse<{ message: string; status: string; ruleId: number }> = 
      await this.client.post(`/api/link-rules/${ruleId}/apply`);
    return response.data;
  }

  /**
   * Apply all enabled rules to a specific document (async)
   */
  async applyRulesToDocument(documentId: number): Promise<{ message: string; status: string; documentId: number }> {
    const response: AxiosResponse<{ message: string; status: string; documentId: number }> = 
      await this.client.post(`/api/link-rules/apply-to-document/${documentId}`);
    return response.data;
  }

  /**
   * Reapply all enabled rules (async)
   */
  async reapplyAllLinkRules(): Promise<{ message: string; status: string }> {
    const response: AxiosResponse<{ message: string; status: string }> = 
      await this.client.post('/api/link-rules/reapply-all');
    return response.data;
  }

  /**
   * Get link rules by category
   */
  async getLinkRulesByCategory(categoryId: number): Promise<LinkRuleResponseDto[]> {
    const response: AxiosResponse<LinkRuleResponseDto[]> = await this.client.get(`/api/link-rules/category/${categoryId}`);
    return response.data;
  }

  /**
   * Get link rules by metadata
   */
  async getLinkRulesByMetadata(metadataId: number): Promise<LinkRuleResponseDto[]> {
    const response: AxiosResponse<LinkRuleResponseDto[]> = await this.client.get(`/api/link-rules/metadata/${metadataId}`);
    return response.data;
  }

  // ==================== ENHANCED LINK RULE FUNCTIONS ====================

  /**
   * Get active link rules only
   */
  async getActiveLinkRules(): Promise<LinkRuleResponseDto[]> {
    const response: AxiosResponse<LinkRuleResponseDto[]> = await this.client.get('/api/link-rules/active');
    return response.data;
  }

  /**
   * Get link rules with advanced filtering and search
   */
  async searchLinkRules(params: {
    page?: number;
    size?: number;
    enabled?: boolean;
    linkType?: string;
    name?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}): Promise<PageResponse<LinkRuleResponseDto>> {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.enabled !== undefined) queryParams.append('enabled', params.enabled.toString());
    if (params.linkType) queryParams.append('linkType', params.linkType);
    if (params.name) queryParams.append('name', params.name);
    if (params.sortBy) queryParams.append('sort', params.sortBy);
    if (params.sortDirection) queryParams.append('direction', params.sortDirection);
    
    const response: AxiosResponse<PageResponse<LinkRuleResponseDto>> = 
      await this.client.get(`/api/link-rules?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get link rule statistics
   */
  async getLinkRuleStatistics(): Promise<{
    totalRules: number;
    activeRules: number;
    inactiveRules: number;
    totalLinks: number;
    rulesByType: Record<string, number>;
  }> {
    const response: AxiosResponse<{
      totalRules: number;
      activeRules: number;
      inactiveRules: number;
      totalLinks: number;
      rulesByType: Record<string, number>;
    }> = await this.client.get('/api/link-rules/statistics');
    return response.data;
  }

  /**
   * Bulk enable/disable multiple rules
   */
  async bulkToggleLinkRules(ruleIds: number[], enabled: boolean): Promise<{
    success: number[];
    failed: number[];
    message: string;
  }> {
    const response: AxiosResponse<{
      success: number[];
      failed: number[];
      message: string;
    }> = await this.client.put('/api/link-rules/bulk-toggle', {
      ruleIds,
      enabled
    });
    return response.data;
  }

  /**
   * Duplicate a link rule
   */
  async duplicateLinkRule(ruleId: number, newName: string): Promise<LinkRuleResponseDto> {
    const response: AxiosResponse<LinkRuleResponseDto> = 
      await this.client.post(`/api/link-rules/${ruleId}/duplicate`, { name: newName });
    return response.data;
  }

  /**
   * Test a link rule against sample documents
   */
  async testLinkRule(ruleId: number, sampleSize: number = 10): Promise<{
    ruleId: number;
    testResults: Array<{
      sourceDocumentId: number;
      targetDocumentId: number;
      matchScore: number;
      matchedConditions: string[];
    }>;
    summary: {
      totalMatches: number;
      averageScore: number;
      executionTime: number;
    };
  }> {
    const response: AxiosResponse<{
      ruleId: number;
      testResults: Array<{
        sourceDocumentId: number;
        targetDocumentId: number;
        matchScore: number;
        matchedConditions: string[];
      }>;
      summary: {
        totalMatches: number;
        averageScore: number;
        executionTime: number;
      };
    }> = await this.client.post(`/api/link-rules/${ruleId}/test`, { sampleSize });
    return response.data;
  }

  // ==================== DOCUMENT LINK FUNCTIONS ====================

  /**
   * Get all links for a document
   */
  async getDocumentLinks(documentId: number, params: {
    page?: number;
    size?: number;
    linkType?: string;
    isManual?: boolean;
    search?: string;
  } = {}): Promise<PageResponse<DocumentLinkResponseDto>> {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.linkType) queryParams.append('linkType', params.linkType);
    if (params.isManual !== undefined) queryParams.append('isManual', params.isManual.toString());
    if (params.search) queryParams.append('search', params.search);
    
    const response: AxiosResponse<PageResponse<DocumentLinkResponseDto>> = 
      await this.client.get(`/api/document-links/document/${documentId}?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get manual links for a document
   */
  async getManualDocumentLinks(documentId: number): Promise<DocumentLinkResponseDto[]> {
    const response: AxiosResponse<DocumentLinkResponseDto[]> = 
      await this.client.get(`/api/document-links/document/${documentId}/manual`);
    return response.data;
  }

  /**
   * Get automatic links for a document
   */
  async getAutomaticDocumentLinks(documentId: number): Promise<DocumentLinkResponseDto[]> {
    const response: AxiosResponse<DocumentLinkResponseDto[]> = 
      await this.client.get(`/api/document-links/document/${documentId}/automatic`);
    return response.data;
  }

  /**
   * Get outgoing links for a document
   */
  async getOutgoingDocumentLinks(documentId: number, params: {
    page?: number;
    size?: number;
    linkType?: string;
    isManual?: boolean;
  } = {}): Promise<PageResponse<DocumentLinkResponseDto>> {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.linkType) queryParams.append('linkType', params.linkType);
    if (params.isManual !== undefined) queryParams.append('isManual', params.isManual.toString());
    
    const response: AxiosResponse<PageResponse<DocumentLinkResponseDto>> = 
      await this.client.get(`/api/document-links/document/${documentId}/outgoing?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get incoming links for a document
   */
  async getIncomingDocumentLinks(documentId: number, params: {
    page?: number;
    size?: number;
    linkType?: string;
    isManual?: boolean;
  } = {}): Promise<PageResponse<DocumentLinkResponseDto>> {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.linkType) queryParams.append('linkType', params.linkType);
    if (params.isManual !== undefined) queryParams.append('isManual', params.isManual.toString());
    
    const response: AxiosResponse<PageResponse<DocumentLinkResponseDto>> = 
      await this.client.get(`/api/document-links/document/${documentId}/incoming?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get related documents with advanced filtering
   */
  async getRelatedDocuments(documentId: number, params: {
    page?: number;
    size?: number;
    linkType?: string;
    isManual?: boolean;
    search?: string;
    fromDate?: string;
    toDate?: string;
    mimeType?: string;
  } = {}): Promise<PageResponse<RelatedDocumentResponseDto>> {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.linkType) queryParams.append('linkType', params.linkType);
    if (params.isManual !== undefined) queryParams.append('isManual', params.isManual.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    if (params.mimeType) queryParams.append('mimeType', params.mimeType);
    
    const response: AxiosResponse<PageResponse<RelatedDocumentResponseDto>> = 
      await this.client.get(`/api/document-links/document/${documentId}/related?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Create a manual document link
   */
  async createManualDocumentLink(request: DocumentLinkRequestDto): Promise<DocumentLinkResponseDto> {
    const response: AxiosResponse<DocumentLinkResponseDto> = 
      await this.client.post('/api/document-links', request);
    return response.data;
  }

  /**
   * Update a manual document link
   */
  async updateDocumentLink(linkId: number, request: Partial<DocumentLinkRequestDto>): Promise<DocumentLinkResponseDto> {
    const response: AxiosResponse<DocumentLinkResponseDto> = 
      await this.client.put(`/api/document-links/${linkId}`, request);
    return response.data;
  }

  /**
   * Delete a document link by ID
   */
  async deleteDocumentLink(linkId: number): Promise<void> {
    await this.client.delete(`/api/document-links/${linkId}`);
  }

  /**
   * Delete a document link by details
   */
  async deleteDocumentLinkByDetails(
    sourceDocumentId: number, 
    targetDocumentId: number, 
    linkType: string
  ): Promise<void> {
    await this.client.delete(
      `/api/document-links/source/${sourceDocumentId}/target/${targetDocumentId}/type/${linkType}`
    );
  }

  /**
   * Bulk delete document links
   */
  async bulkDeleteDocumentLinks(linkIds: number[]): Promise<{
    success: number[];
    failed: number[];
    message: string;
  }> {
    const response: AxiosResponse<{
      success: number[];
      failed: number[];
      message: string;
    }> = await this.client.delete('/api/document-links/bulk', {
      data: { linkIds }
    });
    return response.data;
  }

  // ==================== CACHE AND ADMIN FUNCTIONS ====================

  /**
   * Get cache statistics for link rules
   */
  async getLinkRuleCacheStatistics(): Promise<LinkRuleCacheStatistics> {
    const response: AxiosResponse<LinkRuleCacheStatistics> = 
      await this.client.get('/api/link-rules/cache/statistics');
    return response.data;
  }

  /**
   * Clear cache for a specific rule
   */
  async clearRuleCache(ruleId: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = 
      await this.client.delete(`/api/link-rules/${ruleId}/cache`);
    return response.data;
  }

  /**
   * Clear cache for a specific document
   */
  async clearDocumentCache(documentId: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = 
      await this.client.delete(`/api/link-rules/documents/${documentId}/cache`);
    return response.data;
  }

  /**
   * Clear all link rule caches
   */
  async clearAllLinkRuleCaches(): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = 
      await this.client.delete('/api/link-rules/cache/all');
    return response.data;
  }

  // ==================== ENHANCED CLASS A DOCUMENT ENDPOINTS ====================

  /**
   * Search ClassA documents with advanced filtering
   */
  async searchClassADocuments(request: ClassASearchRequestDto): Promise<PageResponse<ClassAResponseDto>> {
    const response: AxiosResponse<PageResponse<ClassAResponseDto>> = 
      await this.client.post('/api/v1/document/class-a/search', request);
    return response.data;
  }

  /**
   * Get ClassA document statistics
   */
  async getClassAStatistics(): Promise<ClassAStatisticsResponseDto> {
    const response: AxiosResponse<ClassAStatisticsResponseDto> = 
      await this.client.get('/api/v1/document/class-a/statistics');
    return response.data;
  }

  /**
   * Get ClassA documents with pagination and filters (enhanced with search functionality)
   */
  async getClassADocuments(params: {
    page?: number;
    size?: number;
    userId?: string;
    categoryId?: number;
    name?: string;
    dateFrom?: string;
    dateTo?: string;
    exactDate?: string;
  } = {}): Promise<PageResponse<ClassAResponseDto>> {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    if (params.name) queryParams.append('name', params.name);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.exactDate) queryParams.append('exactDate', params.exactDate);
    
    const response: AxiosResponse<PageResponse<ClassAResponseDto>> = 
      await this.client.get(`/api/v1/document/class-a?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get ClassA document by ID with full details
   */
  async getClassADocument(id: number): Promise<ClassADetailResponseDto> {
    const response: AxiosResponse<ClassADetailResponseDto> = 
      await this.client.get(`/api/v1/document/class-a/${id}`);
    return response.data;
  }

  /**
   * Move ClassA document to main documents table
   */
  async moveClassAToDocument(id: number, params: {
    title: string;
    lang: ExtractorLanguage;
    name?: string;
    description?: string;
    tags?: string;
    filingCategory?: FilingCategoryDocDto;
  }): Promise<DocumentResponseDto> {
    const formData = new FormData();
    formData.append('title', params.title);
    formData.append('lang', params.lang);
    
    if (params.name) formData.append('name', params.name);
    if (params.description) formData.append('description', params.description);
    if (params.tags) formData.append('tags', params.tags);
    if (params.filingCategory) {
      formData.append('filingCategory', JSON.stringify(params.filingCategory));
    }
    
    const response: AxiosResponse<DocumentResponseDto> = 
      await this.client.post(`/api/v1/document/class-a/${id}/move-to-document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    return response.data;
  }

  /**
   * Get ClassA document view URL
   */
  async getClassADocumentUrl(id: number): Promise<{ url: string }> {
    const response: AxiosResponse<{ url: string }> = 
      await this.client.get(`/api/v1/document/class-a/${id}/view`);
    return response.data;
  }

  /**
   * Delete ClassA document
   */
  async deleteClassADocument(id: number): Promise<void> {
    await this.client.delete(`/api/v1/document/class-a/${id}`);
  }

  // ==================== ENHANCED DOCUMENT ENDPOINTS ====================

  /**
   * Update document description
   */
  async updateDocumentDescription(id: number, request: UpdateDocumentDescriptionRequestDto): Promise<void> {
    await this.client.put(`/api/v1/document/${id}/description`, request);
  }

  /**
   * Search documents with query
   */
  async searchDocuments(params: {
    q: string;
    page?: number;
    size?: number;
  }): Promise<DocumentSearchResponseDto> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.q);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    
    const response: AxiosResponse<DocumentSearchResponseDto> = 
      await this.client.get(`/api/v1/document/search?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Test OCR functionality
   */
  async testOcr(): Promise<{
    status: string;
    message: string;
    testText?: string;
    tessdataPath?: string;
  }> {
    const response: AxiosResponse<{
      status: string;
      message: string;
      testText?: string;
      tessdataPath?: string;
    }> = await this.client.get('/api/v1/document/test-ocr');
    return response.data;
  }

  /**
   * Log file download for audit purposes
   */
  async logFileDownload(id: number, version?: number): Promise<void> {
    const queryParams = new URLSearchParams();
    if (version !== undefined) queryParams.append('version', version.toString());
    
    await this.client.post(`/api/v1/document/fileDownloaded/${id}?${queryParams.toString()}`);
  }


  /**
   * Execute a specific link rule
   */
  async executeRule(request: RuleExecutionRequest): Promise<RuleExecutionResponse> {
    const response: AxiosResponse<RuleExecutionResponse> = await this.client.post(`/api/link-rules/${request.ruleId}/execute`, request);
    return response.data;
  }

  /**
   * Execute multiple link rules in bulk
   */
  async executeBulkRules(request: BulkRuleExecutionRequest): Promise<BulkRuleExecutionResponse> {
    const response: AxiosResponse<BulkRuleExecutionResponse> = await this.client.post('/api/link-rules/execute-bulk', request);
    return response.data;
  }

  /**
   * Revalidate all link rules
   */
  async revalidateAllRules(): Promise<{ message: string; rulesProcessed: number }> {
    const response: AxiosResponse<{ message: string; rulesProcessed: number }> = await this.client.post('/api/link-rules/revalidate-all');
    return response.data;
  }

  /**
   * Revalidate a specific link rule
   */
  async revalidateRule(ruleId: number): Promise<RuleExecutionResponse> {
    const response: AxiosResponse<RuleExecutionResponse> = await this.client.post(`/api/link-rules/${ruleId}/revalidate`);
    return response.data;
  }

  /**
   * Get rule execution statistics
   */
  async getRuleStatistics(ruleId: number): Promise<RuleStatistics> {
    const response: AxiosResponse<RuleStatistics> = await this.client.get(`/api/link-rules/${ruleId}/statistics`);
    return response.data;
  }

  /**
   * Get all rule statistics
   */
  async getAllRuleStatistics(): Promise<RuleStatistics[]> {
    const response: AxiosResponse<RuleStatistics[]> = await this.client.get('/api/link-rules/statistics');
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
    const response: AxiosResponse<PageResponse<AuditLog>> = await this.client.post('/api/v1/admin/audit-logs/search', {
      searchTerm,
      ...params
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

}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;
