import { apiClient } from './client'
import { AxiosResponse, AxiosError } from 'axios'
import { MovingType, AllowedFoldersToMove, PageResponse, UpdateDocumentMetadataRequestDto, CreateTagRequestDto, UpdateTagRequestDto, AddTagToDocumentRequestDto, TagResponseDto, DocumentTagResponseDto, LinkRuleRequestDto, LinkRuleResponseDto, DocumentLinkRequestDto, DocumentLinkResponseDto, RelatedDocumentResponseDto, RuleExecutionRequest, RuleExecutionResponse, RuleStatistics, BulkRuleExecutionRequest, BulkRuleExecutionResponse, LinkRuleCacheStatistics, SearchRequestDto, AdvancedSearchRequestDto, AdvancedSearchResponseDto, UnifiedSearchRequestDto, FilingCategoryDocDto, TypeShareAccessWithTypeReq } from '../types/api'
import { userManagementService } from './services/userManagementService'
import { roleManagementService } from './services/roleManagementService'
import { groupManagementService } from './services/groupManagementService'
import { documentService } from './services/documentService'
import { folderService } from './services/folderService'
import { tagService } from './services/tagService'
import { linkRuleService } from './services/linkRuleService'
import { commentService } from './services/commentService'
import { favoriteService } from './services/favoriteService'
import { recycleBinService } from './services/recycleBinService'
import { auditLogService } from './services/auditLogService'
import { filingCategoryService } from './services/filingCategoryService'
import { searchService } from './services/searchService'
import { unclassifiedDocumentService } from './services/unclassifiedDocumentService'

// Notification interface for API calls
interface ApiNotificationOptions {
  showSuccess?: boolean
  showError?: boolean
  successMessage?: string
  errorMessage?: string
  silent?: boolean // If true, no notifications will be shown
}

// Default notification messages
const DEFAULT_MESSAGES = {
  create: {
    success: 'Item created successfully',
    error: 'Failed to create item'
  },
  update: {
    success: 'Item updated successfully',
    error: 'Failed to update item'
  },
  delete: {
    success: 'Item deleted successfully',
    error: 'Failed to delete item'
  },
  upload: {
    success: 'File uploaded successfully',
    error: 'Failed to upload file'
  },
  download: {
    success: 'Download started',
    error: 'Failed to download file'
  },
  move: {
    success: 'Item moved successfully',
    error: 'Failed to move item'
  },
  rename: {
    success: 'Item renamed successfully',
    error: 'Failed to rename item'
  },
  assign: {
    success: 'Assignment completed successfully',
    error: 'Failed to complete assignment'
  },
  remove: {
    success: 'Removal completed successfully',
    error: 'Failed to remove item'
  }
}

class NotificationApiClient {
  private notificationCallback: ((type: 'success' | 'error', title: string, message?: string) => void) | null = null

  // Set the notification callback (will be called from components)
  setNotificationCallback(callback: (type: 'success' | 'error', title: string, message?: string) => void) {
    this.notificationCallback = callback
  }

  // Helper method to show notifications
  private showNotification(type: 'success' | 'error', title: string, message?: string) {
    if (this.notificationCallback) {
      this.notificationCallback(type, title, message)
    }
  }

  // Wrapper method for API calls with notifications
  private async withNotification<T>(
    apiCall: () => Promise<T>,
    options: ApiNotificationOptions = {},
    operation: keyof typeof DEFAULT_MESSAGES = 'create'
  ): Promise<T> {
    const {
      showSuccess = true,
      showError = true,
      successMessage,
      errorMessage,
      silent = false
    } = options

    try {
      const result = await apiCall()

      // Only show success notifications if not silent and showSuccess is true
      // This means GET operations (silent=true) won't show success notifications
      if (!silent && showSuccess) {
        const message = successMessage || DEFAULT_MESSAGES[operation].success
        this.showNotification('success', 'Success', message)
      }

      return result
    } catch (error: any) {
      // Always show error notifications (even for GET operations or silent requests)
      // Only respect showError if explicitly set to false
      if (showError !== false) {
        let message = errorMessage || DEFAULT_MESSAGES[operation].error

        // Extract error message from API response if not a 500 error
        if (error?.response) {
          const status = error.response?.status
          const errorData = error.response?.data

          // For non-500 errors, try to extract the message from the response
          if (status !== 500 && errorData) {
            // Try different common error message fields
            if (errorData.message) {
              message = errorData.message
            } else if (errorData.error) {
              message = typeof errorData.error === 'string' ? errorData.error : errorData.error.message || message
            } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
              // Handle validation errors
              message = errorData.errors.map((e: any) => e.message || e.defaultMessage || e).join(', ')
            } else if (typeof errorData === 'string') {
              message = errorData
            }
          }
          // For 500 errors, use the default message
        } else if (error?.message && !error?.response) {
          // Network error or other client-side error
          message = error.message
        }

        this.showNotification('error', 'Error', message)
      }
      throw error
    }
  }

  // ==================== USER ENDPOINTS ====================

  async createUser(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.createUser(data),
      { successMessage: 'User created successfully', errorMessage: 'Failed to create user', ...options },
      'create'
    )
  }

  async getUserById(id: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.getUserById(id),
      { silent: true, ...options } // Silent for GET operations
    )
  }

  async getAllUsers(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => {
        if (params?.search) {
          // Note: searchUsers also supports sort in service but maybe not in backend yet properly?
          // Using params.sortBy if available
          return userManagementService.searchUsers(
            params.search,
            undefined,
            params?.page || 0,
            params?.size || 20,
            params?.sortBy,
            params?.sortDirection
          );
        }
        return userManagementService.getUsers(
          params?.page || 0,
          params?.size || 20,
          params?.sortBy,
          params?.sortDirection
        );
      },
      { silent: true, ...options } // Silent for GET operations
    )
  }

  async updateUser(id: string, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.updateUser(id, data),
      { successMessage: 'User updated successfully', errorMessage: 'Failed to update user', ...options },
      'update'
    )
  }

  async deleteUser(id: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.deleteUser(id),
      { successMessage: 'User deleted successfully', errorMessage: 'Failed to delete user', ...options },
      'delete'
    )
  }

  async updateUserStatus(id: string, enabled: boolean, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.updateUserStatus(id, enabled),
      { successMessage: `User ${enabled ? 'enabled' : 'disabled'} successfully`, errorMessage: 'Failed to update user status', ...options },
      'update'
    )
  }

  // Recycle Bin
  async getDeletedUsers(page: number = 0, size: number = 20, sortBy?: any, sortDirection?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.getDeletedUsers(page, size, sortBy, sortDirection),
      { silent: true, ...options }
    )
  }

  async restoreUser(id: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.restoreUser(id),
      { successMessage: 'User restored successfully', errorMessage: 'Failed to restore user', ...options },
      'create' // or update
    )
  }

  // User Roles & Groups
  async getAvailableRolesForUser(userId: string, params: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.getAvailableRolesForUser(userId, params),
      { silent: true, ...options }
    )
  }

  async getAvailableGroupsForUser(userId: string, params: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.getAvailableGroupsForUser(userId, params),
      { silent: true, ...options }
    )
  }

  async getUserGroups(userId: string, params: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.getUserGroups(userId, params),
      { silent: true, ...options }
    )
  }

  // User Sessions
  async getUserSessions(userId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.getUserSessions(userId),
      { silent: true, ...options }
    )
  }

  async revokeUserSession(userId: string, sessionId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.revokeUserSession(userId, sessionId),
      { successMessage: 'Session revoked successfully', errorMessage: 'Failed to revoke session', ...options },
      'delete'
    )
  }

  async revokeAllUserSessions(userId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.revokeAllUserSessions(userId),
      { successMessage: 'All sessions revoked successfully', errorMessage: 'Failed to revoke sessions', ...options },
      'delete'
    )
  }

  // Password Management
  async resetUserPassword(userId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.resetUserPassword(userId),
      { successMessage: 'Password reset successfully', errorMessage: 'Failed to reset password', ...options },
      'update'
    )
  }

  // User Statistics
  async getUserStatisticsById(userId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => userManagementService.getUserStatisticsById(userId),
      { silent: true, ...options }
    )
  }

  // ==================== ROLE ENDPOINTS ====================

  async createRole(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => roleManagementService.createRole(data),
      { successMessage: 'Role created successfully', errorMessage: 'Failed to create role', ...options },
      'create'
    )
  }

  async getRoleById(id: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => roleManagementService.getRoleById(id),
      { silent: true, ...options }
    )
  }

  async getAllRoles(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => roleManagementService.getRoles(
        params?.page || 0,
        params?.size || 20,
        'name',
        params?.desc ? 'desc' : 'asc',
        params?.search || params?.name
      ),
      { silent: true, ...options }
    )
  }

  async updateRole(id: string, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => roleManagementService.updateRole(id, data),
      { successMessage: 'Role updated successfully', errorMessage: 'Failed to update role', ...options },
      'update'
    )
  }

  async deleteRole(id: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => roleManagementService.deleteRole(id),
      { successMessage: 'Role deleted successfully', errorMessage: 'Failed to delete role', ...options },
      'delete'
    )
  }

  async assignPermissionsToRole(roleName: string, permissionKeys: string[], options?: ApiNotificationOptions) {
    return this.withNotification(
      async () => {
        const roles = await roleManagementService.getRoles(0, 1000);
        const role = roles.content?.find(r => r.name === roleName);
        if (!role) throw new Error('Role not found');
        return apiClient.put(`/api/v1/admin/roles/${role.id}/permissions`, permissionKeys);
      },
      { successMessage: 'Permissions assigned successfully', errorMessage: 'Failed to assign permissions', ...options },
      'update'
    );
  }

  async assignRoleToUser(roleName: string, userId: string, options?: ApiNotificationOptions) {
    // Note: This maps role name to role ID and assigns it to users
    return this.withNotification(
      async () => {
        const roles = await roleManagementService.getRoles(0, 1000)
        const role = roles.content?.find(r => r.name === roleName)
        if (!role) throw new Error('Role not found')
        return roleManagementService.assignRoleToUsers(role.id, [userId])
      },
      { successMessage: 'Role assigned successfully', errorMessage: 'Failed to assign role', ...options },
      'assign'
    )
  }

  async removeRoleFromUser(roleName: string, userId: string, options?: ApiNotificationOptions) {
    // Note: This maps role name to role ID and removes it from users
    return this.withNotification(
      async () => {
        const roles = await roleManagementService.getRoles(0, 1000)
        const role = roles.content?.find(r => r.name === roleName)
        if (!role) throw new Error('Role not found')
        return roleManagementService.removeRoleFromUsers(role.id, [userId])
      },
      { successMessage: 'Role removed successfully', errorMessage: 'Failed to remove role', ...options },
      'remove'
    )
  }

  // ==================== GROUP ENDPOINTS ====================

  async createGroup(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => groupManagementService.createGroup(data),
      { successMessage: 'Group created successfully', errorMessage: 'Failed to create group', ...options },
      'create'
    )
  }

  async getGroupById(id: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => groupManagementService.getGroupById(id),
      { silent: true, ...options }
    )
  }

  async getAllGroups(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => groupManagementService.getGroups(
        params?.page || 0,
        params?.size || 20,
        'name',
        params?.desc ? 'desc' : 'asc',
        params?.search || params?.name
      ),
      { silent: true, ...options }
    )
  }

  async updateGroup(id: string, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => groupManagementService.updateGroup(id, data),
      { successMessage: 'Group updated successfully', errorMessage: 'Failed to update group', ...options },
      'update'
    )
  }

  async deleteGroup(id: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => groupManagementService.deleteGroup(id),
      { successMessage: 'Group deleted successfully', errorMessage: 'Failed to delete group', ...options },
      'delete'
    )
  }

  async addUserToGroup(groupId: string, userId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => groupManagementService.assignUsersToGroup(groupId, [userId]),
      { successMessage: 'User added to group successfully', errorMessage: 'Failed to add user to group', ...options },
      'assign'
    )
  }

  async assignUsersToGroup(groupId: string, userIds: string[], options?: ApiNotificationOptions) {
    return this.withNotification(
      () => groupManagementService.assignUsersToGroup(groupId, userIds),
      { successMessage: `${userIds.length} user${userIds.length !== 1 ? 's' : ''} added to group successfully`, errorMessage: 'Failed to assign users to group', ...options },
      'assign'
    )
  }

  async removeUserFromGroup(groupId: string, userId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => groupManagementService.removeUsersFromGroup(groupId, [userId]),
      { successMessage: 'User removed from group successfully', errorMessage: 'Failed to remove user from group', ...options },
      'remove'
    )
  }

  // ==================== LDAP SERVER ENDPOINTS ====================

  async getAllLdapServers(params?: any, options?: ApiNotificationOptions) {
    const { ldapServerService } = await import('./services/ldapServerService');
    return this.withNotification(
      () => ldapServerService.getServers(params?.page || 0, params?.size || 20, params?.search),
      { silent: true, ...options }
    )
  }

  async getLdapServerById(id: string, options?: ApiNotificationOptions) {
    const { ldapServerService } = await import('./services/ldapServerService');
    return this.withNotification(
      () => ldapServerService.getServerById(id),
      { silent: true, ...options }
    )
  }

  async createLdapServer(data: any, options?: ApiNotificationOptions) {
    const { ldapServerService } = await import('./services/ldapServerService');
    return this.withNotification(
      () => ldapServerService.createServer(data),
      { silent: true, ...options },
      'create'
    )
  }

  async updateLdapServer(id: string, data: any, options?: ApiNotificationOptions) {
    const { ldapServerService } = await import('./services/ldapServerService');
    return this.withNotification(
      () => ldapServerService.updateServer(id, data),
      { silent: true, ...options },
      'update'
    )
  }

  async deleteLdapServer(id: string, options?: ApiNotificationOptions) {
    const { ldapServerService } = await import('./services/ldapServerService');
    return this.withNotification(
      () => ldapServerService.deleteServer(id),
      { silent: true, ...options },
      'delete'
    )
  }

  async toggleLdapServer(id: string, enabled: boolean, options?: ApiNotificationOptions) {
    const { ldapServerService } = await import('./services/ldapServerService');
    return this.withNotification(
      () => ldapServerService.toggleServer(id, enabled),
      { silent: true, ...options },
      'update'
    )
  }

  async testLdapConnection(id: string, options?: ApiNotificationOptions) {
    const { ldapServerService } = await import('./services/ldapServerService');
    return this.withNotification(
      () => ldapServerService.testConnection(id),
      { silent: true, ...options },
      'update'
    )
  }

  async syncLdapUsers(id: string, options?: ApiNotificationOptions) {
    const { ldapServerService } = await import('./services/ldapServerService');
    return this.withNotification(
      () => ldapServerService.syncUsers(id),
      { silent: true, ...options },
      'update'
    )
  }

  async getLdapStatistics(options?: ApiNotificationOptions) {
    const { ldapServerService } = await import('./services/ldapServerService');
    return this.withNotification(
      () => ldapServerService.getStatistics(),
      { silent: true, ...options }
    )
  }

  // ==================== DOCUMENT ENDPOINTS ====================

  async uploadDocument(file: File, folderId: number, title: string, lang: any, filingCategoryDto: FilingCategoryDocDto | null, fileName?: string, tags?: number[], convertToPdf?: boolean, options?: ApiNotificationOptions) {
    const tagsJson = tags ? JSON.stringify(tags) : undefined;
    return this.withNotification(
      () => documentService.uploadDocument(file, folderId, title, lang, fileName, tagsJson, filingCategoryDto || undefined, convertToPdf),
      {
        successMessage: `File "${file.name}" uploaded successfully`,
        errorMessage: `Failed to upload "${file.name}"`,
        ...options
      },
      'upload'
    )
  }

  // Bulk upload multiple documents at once
  async uploadBulkDocuments(
    files: File[],
    folderId: number,
    lang: string = 'ENG',
    metadataList?: Array<{
      fileName?: string;
      title?: string;
      filingCategoryId?: number;
      metadataJson?: string;
      tagsJson?: string;
      convertToPdf?: boolean;
    }>,
    onProgress?: (current: number, total: number, fileName: string) => void,
    onByteProgress?: (loaded: number, total: number, percentage: number) => void,
    options?: ApiNotificationOptions
  ) {
    return this.withNotification(
      () => documentService.uploadBulkDocuments(files, folderId, lang, metadataList, onProgress, onByteProgress),
      {
        successMessage: `Successfully uploaded ${files.length} files. OCR processing queued.`,
        errorMessage: `Failed to upload files`,
        ...options
      },
      'upload'
    )
  }

  // Note: Multiple upload is now handled by unclassified documents
  async uploadUnclassifiedDocument(file: File, folderId: number, categoryId: number, createdBy: string, title?: string, fileName?: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => unclassifiedDocumentService.uploadUnclassifiedDocument(file, folderId, categoryId, createdBy, title, fileName),
      {
        successMessage: `File "${file.name}" uploaded to unclassified successfully`,
        errorMessage: `Failed to upload "${file.name}" to unclassified`,
        ...options
      },
      'upload'
    )
  }

  async searchUnclassifiedDocuments(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => unclassifiedDocumentService.searchUnclassifiedDocuments({
        page: params?.page || 0,
        size: params?.size || 20,
        query: params?.query,
        name: params?.query, // Use query as name filter
        categoryId: params?.categoryId,
        userId: params?.userId,
        sortBy: params?.sortBy,
        sortDirection: params?.sortDir || 'desc',
      }),
      { silent: true, ...options }
    )
  }

  async getUnclassifiedDocumentUrl(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      async () => {
        const result = await unclassifiedDocumentService.getDownloadUrl(id);
        return result.url;
      },
      { silent: true, ...options }
    )
  }

  async deleteUnclassifiedDocument(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => unclassifiedDocumentService.deleteUnclassifiedDocument(id),
      { successMessage: 'Document deleted successfully', errorMessage: 'Failed to delete document', ...options },
      'delete'
    )
  }

  async classifyUnclassifiedDocument(id: number, payload: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => unclassifiedDocumentService.classifyDocument(id, payload),
      { successMessage: 'Document classified successfully', errorMessage: 'Failed to classify document', ...options },
      'update'
    )
  }

  async renameDocument(id: number, name: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.renameDocument(id, name),
      { successMessage: 'Document renamed successfully', errorMessage: 'Failed to rename document', ...options },
      'rename'
    )
  }

  async editDocumentDescription(id: number, description: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.updateDocumentDescription(id, { description }),
      { successMessage: 'Document description updated successfully', errorMessage: 'Failed to update document description', ...options },
      'update'
    )
  }

  async getDocumentVersionsList(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.getDocumentVersions(id),
      { silent: true, ...options }
    )
  }

  async setActiveVersion(documentId: number, versionId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.setActiveVersion(documentId, versionId),
      { successMessage: 'Active version updated successfully', errorMessage: 'Failed to update active version', ...options },
      'update'
    )
  }

  // Update document metadata

  // Update document filing category

  // ==================== TAG METHODS ====================

  // Create tag

  // Get tag by ID

  // Get tag by name

  // Get all tags

  // Get tags by user

  // Get my tags

  // Get available tags

  // Get system tags

  // Search tags

  // Update tag

  // Delete tag

  // Add tag to document

  // Remove tag from document

  // Remove all tags from document

  // Get tags by document ID

  // Get document IDs by tag ID

  // Get tag statistics

  // Get tag statistics by ID

  // ==================== LINK RULE METHODS ====================


  // Get incoming links

  // Unified smart search
  async unifiedSearch(data: UnifiedSearchRequestDto, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => searchService.unifiedSearch(data),
      { silent: true, ...options }
    )
  }



  // Get outgoing links

  // Get link rules by category

  // Get link rule by ID

  // Enable link rule

  // Disable link rule

  // Delete link rule

  // ==================== NEW LINK RULE METHODS ====================

  // Create link rule

  // Update link rule

  // Get all link rules

  // Get all link rules with pagination and filters

  // Toggle rule enabled/disabled

  // Apply a specific rule to all documents (async)

  // Apply all enabled rules to a specific document (async)

  // Reapply all enabled rules (async)

  // Get link rules by metadata

  // ==================== NEW DOCUMENT LINK METHODS ====================

  // Create document link

  // Delete document link

  // Get related documents with search and filters

  async uploadDocumentVersion(
    file: File,
    documentId: number,
    lang: any,
    filingCategory?: any,
    modificationType?: 'MAJOR' | 'MINOR' | 'PATCH',
    versionComment?: string,
    options?: ApiNotificationOptions
  ) {
    return this.withNotification(
      () => documentService.uploadNewVersion(file, documentId, lang, filingCategory, modificationType, versionComment),
      {
        successMessage: `Document version uploaded successfully`,
        errorMessage: `Failed to upload document version`,
        ...options
      },
      'upload'
    )
  }

  async moveDocument(id: number, to: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.moveDocument(id, to),
      { successMessage: 'Document moved successfully', errorMessage: 'Failed to move document', ...options },
      'move'
    )
  }

  async downloadDocument(id: number, versionId?: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.getDownloadUrl(id, versionId),
      { silent: true, ...options }
    )
  }

  async fileDownloaded(id: number, versionId?: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.markFileAsDownloaded(id, versionId),
      { silent: true, ...options }
    )
  }

  async deleteDocument(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.deleteDocument(id),
      { successMessage: 'Document deleted successfully', errorMessage: 'Failed to delete document', ...options },
      'delete'
    )
  }

  async getDocument(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.getDocumentById(id),
      { silent: true, ...options }
    )
  }

  // ==================== FOLDER ENDPOINTS ====================

  async createFolder(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.createFolder(data),
      { successMessage: 'Folder created successfully', errorMessage: 'Failed to create folder', ...options },
      'create'
    )
  }

  async getFolder(id: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.getFolderContents(
        id,
        params?.page || 0,
        params?.size || 20,
        params?.name,
        params?.showFolder !== undefined ? params.showFolder : true,
        params?.sort,
        params?.desc ? 'desc' : 'asc'
      ),
      { silent: true, ...options }
    )
  }

  async getUserRepository(userId: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.getUserRepository(
        userId,
        params?.page || 0,
        params?.size || 20,
        params?.name,
        params?.sort,
        params?.desc ? 'desc' : 'asc'
      ),
      { silent: true, ...options }
    )
  }

  async getFolderByPath(path: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.getFolderByPath(
        path,
        params?.page || 0,
        params?.size || 20,
        params?.name,
        params?.showFolder !== undefined ? params.showFolder : true,
        params?.sort,
        params?.desc ? 'desc' : 'asc'
      ),
      { silent: true, ...options }
    )
  }

  async getFolderIdByPath(path: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.getFolderIdByPath(path),
      { silent: true, ...options }
    )
  }

  async getRepository(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.getMyRepository(
        params?.page || 0,
        params?.size || 20,
        params?.name,
        params?.sort,
        params?.desc ? 'desc' : 'asc'
      ),
      { silent: true, ...options }
    )
  }

  async getSharedFolders(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.getSharedFolders(
        params?.page || 0,
        params?.size || 20,
        params?.name,
        params?.showFolder !== undefined ? params.showFolder : true,
        params?.sort,
        params?.desc ? 'desc' : 'asc'
      ),
      { silent: true, ...options }
    )
  }

  async getSharedDocuments(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.getSharedDocuments({
        page: params?.page || 0,
        size: params?.size || 20,
        search: params?.query,
        sortBy: params?.sortBy,
        sortDir: params?.sortDir,
      }),
      { silent: true, ...options }
    )
  }

  async renameFolder(id: number, name: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.renameFolder(id, name),
      { successMessage: 'Folder renamed successfully', errorMessage: 'Failed to rename folder', ...options },
      'rename'
    )
  }

  async changeDescriptionFolder(id: number, description: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.changeDescription(id, description),
      { successMessage: 'Folder description changed successfully', errorMessage: 'Failed to change folder description', ...options },
    )
  }

  async moveFolder(id: number, to: number | null, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.moveFolder(id, to),
      { successMessage: 'Folder moved successfully', errorMessage: 'Failed to move folder', ...options },
      'move'
    )
  }


  async availableFolders(
    id: number,
    type: MovingType = MovingType.FOLDER,
    params?: {
      page?: number;
      size?: number;
      name?: string;
    },
    options?: ApiNotificationOptions
  ): Promise<PageResponse<AllowedFoldersToMove>> {
    return this.withNotification(
      async () => { throw new Error("getFoldersToMove not implemented - use folderService") },
      { silent: true, ...options } // Silent for GET operations
    )
  }

  async deleteFolder(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.deleteFolder(id),
      { successMessage: 'Folder deleted successfully', errorMessage: 'Failed to delete folder', ...options },
      'delete'
    )
  }

  async getAvailableUsersForFolder(folderId: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.getAvailableUsersForFolder(
        folderId,
        params?.page || 0,
        params?.size || 20,
        params?.search
      ),
      { silent: true, ...options }
    )
  }

  async getAvailableRolesForFolder(folderId: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.getAvailableRolesForFolder(
        folderId,
        params?.page || 0,
        params?.size || 20,
        params?.search
      ),
      { silent: true, ...options }
    )
  }

  async getAvailableGroupsForFolder(folderId: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.getAvailableGroupsForFolder(
        folderId,
        params?.page || 0,
        params?.size || 20,
        params?.search
      ),
      { silent: true, ...options }
    )
  }

  // ==================== FILING CATEGORIES ENDPOINTS ====================

  async createFilingCategory(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => filingCategoryService.createFilingCategory(data),
      { successMessage: 'Filing category created successfully', errorMessage: 'Failed to create filing category', ...options },
      'create'
    )
  }

  async getAllFilingCategories(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => filingCategoryService.getFilingCategories(
        params?.page || 0,
        params?.size || 20,
        params?.name
      ),
      { silent: true, ...options }
    )
  }

  async getFilingCategoryById(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => filingCategoryService.getFilingCategoryById(id),
      { silent: true, ...options }
    )
  }

  async updateFilingCategory(id: number, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => filingCategoryService.updateFilingCategory(id, data),
      { successMessage: 'Filing category updated successfully', errorMessage: 'Failed to update filing category', ...options },
      'update'
    )
  }

  async deleteFilingCategory(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => filingCategoryService.deleteFilingCategory(id),
      { successMessage: 'Filing category deleted successfully', errorMessage: 'Failed to delete filing category', ...options },
      'delete'
    )
  }

  // ==================== METADATA LIST ENDPOINTS ====================

  async createMetadataList(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => filingCategoryService.createMetadataList(data),
      { successMessage: 'Metadata list created successfully', errorMessage: 'Failed to create metadata list', ...options },
      'create'
    )
  }

  async getAllMetadataLists(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => filingCategoryService.getMetadataLists(
        params?.page || 0,
        params?.size || 20,
        params?.name
      ),
      { silent: true, ...options }
    )
  }

  async getMetadataListById(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => filingCategoryService.getMetadataListById(id),
      { silent: true, ...options }
    )
  }

  async updateMetadataList(id: number, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => filingCategoryService.updateMetadataList(id, data),
      { successMessage: 'Metadata list updated successfully', errorMessage: 'Failed to update metadata list', ...options },
      'update'
    )
  }

  async deleteMetadataList(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => filingCategoryService.deleteMetadataList(id),
      { successMessage: 'Metadata list deleted successfully', errorMessage: 'Failed to delete metadata list', ...options },
      'delete'
    )
  }

  // ==================== RULE EXECUTION ENDPOINTS ====================

  // Execute a specific link rule

  // Execute multiple link rules in bulk

  // Revalidate all link rules

  // Revalidate a specific link rule

  // Get rule execution statistics

  // Get all rule statistics

  // Get link rule cache statistics

  // Clear cache for a specific document

  // Clear cache for a specific rule

  // Clear all link rule cache


  // ==================== SHARING ENDPOINTS ====================

  async createOrUpdateDocumentShared(folderId: number, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      async () => { throw new Error("createOrUpdateDocumentShared not implemented - use documentService.shareDocumentWithType") },
      { successMessage: 'Document sharing updated successfully', errorMessage: 'Failed to update document sharing', ...options },
      'update'
    )
  }

  async deleteDocumentShared(documentId: number, granteeId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.revokeDocumentAccess(documentId, granteeId),
      { successMessage: 'Document sharing removed successfully', errorMessage: 'Failed to remove document sharing', ...options },
      'remove'
    )
  }

  // Create new folder permission (POST)
  async createFolderPermission(folderId: number, data: TypeShareAccessWithTypeReq, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.createFolderPermission(folderId, data),
      { successMessage: 'Permission added successfully', errorMessage: 'Failed to add permission', ...options },
      'create'
    )
  }

  // Update existing folder permission (PUT)
  async updateFolderPermission(folderId: number, data: TypeShareAccessWithTypeReq, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.updateFolderPermission(folderId, data),
      { successMessage: 'Permission updated successfully', errorMessage: 'Failed to update permission', ...options },
      'update'
    )
  }

  // Legacy method - uses PUT for backward compatibility
  async createOrUpdateFolderShared(folderId: number, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.shareFolderWithType(folderId, data),
      { successMessage: 'Folder sharing updated successfully', errorMessage: 'Failed to update folder sharing', ...options },
      'update'
    )
  }

  async deleteFolderShared(folderId: number, granteeId: string, inherits: boolean, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.revokeFolderAccess(folderId, granteeId, inherits),
      { successMessage: 'Folder sharing removed successfully', errorMessage: 'Failed to remove folder sharing', ...options },
      'remove'
    )
  }

  // ==================== ADDITIONAL ADMIN ENDPOINTS ====================

  async getAllPermissions(options?: ApiNotificationOptions) {
    return this.withNotification(
      async () => roleManagementService.getAllPermissions(),
      { silent: true, ...options }
    )
  }

  async getGroupMembers(groupId: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      async () => groupManagementService.getUsersInGroup(groupId, params),
      { silent: true, ...options }
    )
  }

  async getRoleUsers(roleId: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => roleManagementService.getUsersWithRole(roleId, params?.page || 0, params?.size || 1000),
      { silent: true, ...options }
    );
  }

  async getFolderShared(id: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => folderService.getFolderSharingList(
        id,
        params?.page || 0,
        params?.size || 20,
        params?.search
      ),
      { silent: true, ...options }
    )
  }

  async getDocumentShared(id: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.getDocumentSharingList(
        id,
        params?.page || 0,
        params?.size || 20,
        params?.search
      ),
      { silent: true, ...options }
    )
  }

  async createDocumentPermission(documentId: number, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.createDocumentPermission(documentId, data),
      {
        successMessage: 'Permission added successfully',
        errorMessage: 'Failed to add permission',
        ...options
      }
    )
  }

  async updateDocumentPermission(documentId: number, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.updateDocumentPermission(documentId, data),
      {
        successMessage: 'Permission updated successfully',
        errorMessage: 'Failed to update permission',
        ...options
      }
    )
  }

  async deleteDocumentPermission(documentId: number, granteeId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => documentService.revokeDocumentAccess(documentId, granteeId),
      {
        successMessage: 'Permission removed successfully',
        errorMessage: 'Failed to remove permission',
        ...options
      }
    )
  }


  // ==================== AUDIT LOG ENDPOINTS ====================









  // ==================== COMMENT ENDPOINTS ====================













  // ==================== FAVORITE ENDPOINTS ====================











  // ==================== FOLDER FAVORITE ENDPOINTS ====================







  // ==================== COMBINED FAVORITES ====================




  // ==================== RECYCLE BIN ENDPOINTS ====================

















}

// Create and export a singleton instance
export const notificationApiClient = new NotificationApiClient()
export default notificationApiClient
