import { apiClient } from './client'
import { AxiosResponse, AxiosError } from 'axios'
import { MovingType, AllowedFoldersToMove, PageResponse } from '../types/api'

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
      
      if (!silent && showSuccess) {
        const message = successMessage || DEFAULT_MESSAGES[operation].success
        this.showNotification('success', 'Success', message)
      }
      
      return result
    } catch (error: any) {
      if (!silent && showError) {
        const message = errorMessage || DEFAULT_MESSAGES[operation].error
        this.showNotification('error', 'Error', message)
      }
      throw error
    }
  }

  // ==================== USER ENDPOINTS ====================
  
  async createUser(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.createUser(data),
      { successMessage: 'User created successfully', errorMessage: 'Failed to create user', ...options },
      'create'
    )
  }

  async getUserById(id: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getUserById(id),
      { silent: true, ...options } // Silent for GET operations
    )
  }

  async getAllUsers(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAllUsers(params),
      { silent: true, ...options } // Silent for GET operations
    )
  }

  async updateUser(id: string, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.updateUser(id, data),
      { successMessage: 'User updated successfully', errorMessage: 'Failed to update user', ...options },
      'update'
    )
  }

  async deleteUser(id: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.deleteUser(id),
      { successMessage: 'User deleted successfully', errorMessage: 'Failed to delete user', ...options },
      'delete'
    )
  }

  // ==================== ROLE ENDPOINTS ====================

  async createRole(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.createRole(data),
      { successMessage: 'Role created successfully', errorMessage: 'Failed to create role', ...options },
      'create'
    )
  }

  async getRoleById(id: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getRoleById(id),
      { silent: true, ...options }
    )
  }

  async getAllRoles(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAllRoles(params),
      { silent: true, ...options }
    )
  }

  async updateRole(id: string, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.updateRole(id, data),
      { successMessage: 'Role updated successfully', errorMessage: 'Failed to update role', ...options },
      'update'
    )
  }

  async deleteRole(id: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.deleteRole(id),
      { successMessage: 'Role deleted successfully', errorMessage: 'Failed to delete role', ...options },
      'delete'
    )
  }

  async assignRoleToUser(roleName: string, userId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.assignRoleToUser(roleName, userId),
      { successMessage: 'Role assigned successfully', errorMessage: 'Failed to assign role', ...options },
      'assign'
    )
  }

  async removeRoleFromUser(roleName: string, userId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.removeRoleFromUser(roleName, userId),
      { successMessage: 'Role removed successfully', errorMessage: 'Failed to remove role', ...options },
      'remove'
    )
  }

  // ==================== GROUP ENDPOINTS ====================

  async createGroup(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.createGroup(data),
      { successMessage: 'Group created successfully', errorMessage: 'Failed to create group', ...options },
      'create'
    )
  }

  async getGroupById(id: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getGroupById(id),
      { silent: true, ...options }
    )
  }

  async getAllGroups(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAllGroups(params),
      { silent: true, ...options }
    )
  }

  async updateGroup(id: string, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.updateGroup(id, data),
      { successMessage: 'Group updated successfully', errorMessage: 'Failed to update group', ...options },
      'update'
    )
  }

  async deleteGroup(id: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.deleteGroup(id),
      { successMessage: 'Group deleted successfully', errorMessage: 'Failed to delete group', ...options },
      'delete'
    )
  }

  async addUserToGroup(groupId: string, userId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.addUserToGroup(groupId, userId),
      { successMessage: 'User added to group successfully', errorMessage: 'Failed to add user to group', ...options },
      'assign'
    )
  }

  async removeUserFromGroup(groupId: string, userId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.removeUserFromGroup(groupId, userId),
      { successMessage: 'User removed from group successfully', errorMessage: 'Failed to remove user from group', ...options },
      'remove'
    )
  }

  // ==================== DOCUMENT ENDPOINTS ====================

  async uploadDocument(file: File, folderId: number, title: string, lang: any, filingCategoryDto: any[], options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.uploadDocument(file, folderId, title, lang, filingCategoryDto),
      { 
        successMessage: `File "${file.name}" uploaded successfully`, 
        errorMessage: `Failed to upload "${file.name}"`, 
        ...options 
      },
      'upload'
    )
  }

  async renameDocument(id: number, name: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.renameDocument(id, name),
      { successMessage: 'Document renamed successfully', errorMessage: 'Failed to rename document', ...options },
      'rename'
    )
  }

  async editDocumentTitle(id: number, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.editDocumentTitle(id, data),
      { successMessage: 'Document title updated successfully', errorMessage: 'Failed to update document title', ...options },
      'update'
    )
  }

  async editDocumentDescription(id: number, description: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.editDocumentDescription(id, description),
      { successMessage: 'Document description updated successfully', errorMessage: 'Failed to update document description', ...options },
      'update'
    )
  }

  async getDocumentVersionsList(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getDocumentVersionsList(id),
      { silent: true, ...options }
    )
  }

  async setActiveVersion(documentId: number, versionId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.setActiveVersion(documentId, versionId),
      { successMessage: 'Active version updated successfully', errorMessage: 'Failed to update active version', ...options },
      'update'
    )
  }

  // Update document filing category
  async updateDocumentFilingCategory(documentId: number, filingCategoryDto: any[], options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.updateDocumentFilingCategory(documentId, filingCategoryDto),
      { successMessage: 'Document filing category updated successfully', errorMessage: 'Failed to update document filing category', ...options },
      'update'
    )
  }

  async uploadDocumentVersion(file: File, documentId: number, lang: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.uploadDocumentVersion(file, documentId, lang),
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
      () => apiClient.moveDocument(id, to),
      { successMessage: 'Document moved successfully', errorMessage: 'Failed to move document', ...options },
      'move'
    )
  }

  async downloadDocument(id: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.downloadDocument(id, params),
      { successMessage: 'Download started', errorMessage: 'Failed to download document', ...options },
      'download'
    )
  }

  async fileDownloaded(id: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.fileDownloaded(id, params),
      { successMessage: 'Download logged successfully', errorMessage: 'Failed to log download', ...options },
      'download'
    )
  }

  async deleteDocument(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.deleteDocument(id),
      { successMessage: 'Document deleted successfully', errorMessage: 'Failed to delete document', ...options },
      'delete'
    )
  }

  async getDocument(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getDocument(id),
      { silent: true, ...options }
    )
  }

  // ==================== FOLDER ENDPOINTS ====================

  async createFolder(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.createFolder(data),
      { successMessage: 'Folder created successfully', errorMessage: 'Failed to create folder', ...options },
      'create'
    )
  }

  async getFolder(id: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getFolder(id, params),
      { silent: true, ...options }
    )
  }

  async getFolderByPath(path: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getFolderByPath(path, params),
      { silent: true, ...options }
    )
  }

  async getRepository(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getRepository(params),
      { silent: true, ...options }
    )
  }

  async getSharedFolders(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getSharedFolders(params),
      { silent: true, ...options }
    )
  }

  async renameFolder(id: number, name: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.renameFolder(id, name),
      { successMessage: 'Folder renamed successfully', errorMessage: 'Failed to rename folder', ...options },
      'rename'
    )
  }

  async moveFolder(id: number, to: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.moveFolder(id, to),
      { successMessage: 'Folder moved successfully', errorMessage: 'Failed to move folder', ...options },
      'move'
    )
  }

  async getFoldersToMove(id: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getFoldersToMove(id, params),
      { silent: true, ...options } // Silent for GET operations
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
      () => apiClient.getFoldersToMove(id, { type, ...params }),
      { silent: true, ...options } // Silent for GET operations
    )
  }

  async deleteFolder(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.deleteFolder(id),
      { successMessage: 'Folder deleted successfully', errorMessage: 'Failed to delete folder', ...options },
      'delete'
    )
  }

  // ==================== FILING CATEGORIES ENDPOINTS ====================

  async createFilingCategory(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.createFilingCategory(data),
      { successMessage: 'Filing category created successfully', errorMessage: 'Failed to create filing category', ...options },
      'create'
    )
  }

  async getAllFilingCategories(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAllFilingCategories(params),
      { silent: true, ...options }
    )
  }

  async getFilingCategoryById(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getFilingCategoryById(id),
      { silent: true, ...options }
    )
  }

  async updateFilingCategory(id: number, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.updateFilingCategory(id, data),
      { successMessage: 'Filing category updated successfully', errorMessage: 'Failed to update filing category', ...options },
      'update'
    )
  }

  async deleteFilingCategory(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.deleteFilingCategory(id),
      { successMessage: 'Filing category deleted successfully', errorMessage: 'Failed to delete filing category', ...options },
      'delete'
    )
  }

  // ==================== METADATA LIST ENDPOINTS ====================

  async createMetadataList(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.createMetadataList(data),
      { successMessage: 'Metadata list created successfully', errorMessage: 'Failed to create metadata list', ...options },
      'create'
    )
  }

  async getAllMetadataLists(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAllMetadataLists(params),
      { silent: true, ...options }
    )
  }

  async getMetadataListById(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getMetadataListById(id),
      { silent: true, ...options }
    )
  }

  async updateMetadataList(id: number, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.updateMetadataList(id, data),
      { successMessage: 'Metadata list updated successfully', errorMessage: 'Failed to update metadata list', ...options },
      'update'
    )
  }

  async deleteMetadataList(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.deleteMetadataList(id),
      { successMessage: 'Metadata list deleted successfully', errorMessage: 'Failed to delete metadata list', ...options },
      'delete'
    )
  }

  // ==================== SEARCH ENDPOINTS ====================

  async globalSearch(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.globalSearch(params),
      { silent: true, ...options }
    )
  }

  async enhancedSearch(query: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.enhancedSearch(query, params),
      { silent: true, ...options }
    )
  }

  async searchInVersions(query: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.searchInVersions(query, params),
      { silent: true, ...options }
    )
  }

  async getDocumentVersions(documentId: number, query?: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getDocumentVersions(documentId, query),
      { silent: true, ...options }
    )
  }

  // ==================== SHARING ENDPOINTS ====================

  async createOrUpdateDocumentShared(folderId: number, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.createOrUpdateDocumentShared(folderId, data),
      { successMessage: 'Document sharing updated successfully', errorMessage: 'Failed to update document sharing', ...options },
      'update'
    )
  }

  async deleteDocumentShared(folderId: number, granteeId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.deleteDocumentShared(folderId, granteeId),
      { successMessage: 'Document sharing removed successfully', errorMessage: 'Failed to remove document sharing', ...options },
      'remove'
    )
  }

  async createOrUpdateFolderShared(folderId: number, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.createOrUpdateFolderShared(folderId, data),
      { successMessage: 'Folder sharing updated successfully', errorMessage: 'Failed to update folder sharing', ...options },
      'update'
    )
  }

  async deleteFolderShared(folderId: number, granteeId: string, inherits: boolean, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.deleteFolderShared(folderId, granteeId, inherits),
      { successMessage: 'Folder sharing removed successfully', errorMessage: 'Failed to remove folder sharing', ...options },
      'remove'
    )
  }

  // ==================== ADDITIONAL ADMIN ENDPOINTS ====================

  async getAllPermissions(options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAllPermissions(),
      { silent: true, ...options }
    )
  }

  async getGroupMembers(groupId: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getGroupMembers(groupId, params),
      { silent: true, ...options }
    )
  }

  async getRoleUsers(roleName: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getRoleUsers(roleName, params),
      { silent: true, ...options }
    )
  }

  async getFolderShared(id: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getFolderShared(id, params),
      { silent: true, ...options }
    )
  }

  async getDocumentShared(id: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getDocumentShared(id, params),
      { silent: true, ...options }
    )
  }

  async getDocumentById(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getDocument(id),
      { silent: true, ...options }
    )
  }

  // ==================== AUDIT LOG ENDPOINTS ====================

  async getAllAuditLogs(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAllAuditLogs(params),
      { silent: true, ...options }
    )
  }

  async getAuditLogsByUser(userId: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAuditLogsByUser(userId, params),
      { silent: true, ...options }
    )
  }

  async getAuditLogsByEntity(entityType: string, entityId: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAuditLogsByEntity(entityType, entityId, params),
      { silent: true, ...options }
    )
  }

  async getAuditLogsBySearchTerm(searchTerm: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAuditLogsBySearchTerm(searchTerm, params),
      { silent: true, ...options }
    )
  }

  async getAuditLogsByDateRange(startDate: string, endDate: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAuditLogsByDateRange(startDate, endDate, params),
      { silent: true, ...options }
    )
  }

  async getActionStatistics(startDate: string, endDate: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getActionStatistics(startDate, endDate),
      { silent: true, ...options }
    )
  }

  async getUserActivityStatistics(startDate: string, endDate: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getUserActivityStatistics(startDate, endDate),
      { silent: true, ...options }
    )
  }

  async getEntityTypeStatistics(startDate: string, endDate: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getEntityTypeStatistics(startDate, endDate),
      { silent: true, ...options }
    )
  }

  // ==================== COMMENT ENDPOINTS ====================

  async addComment(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.addComment(data),
      { successMessage: 'Comment added successfully', errorMessage: 'Failed to add comment', ...options },
      'create'
    )
  }

  async getCommentsByEntity(entityType: string, entityId: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getCommentsByEntity(entityType, entityId, params),
      { silent: true, ...options }
    )
  }

  async getCommentsByUser(userId: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getCommentsByUser(userId, params),
      { silent: true, ...options }
    )
  }

  async getMyComments(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getMyComments(params),
      { silent: true, ...options }
    )
  }

  async getCommentReplies(commentId: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getCommentReplies(commentId, params),
      { silent: true, ...options }
    )
  }

  async getComment(commentId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getComment(commentId),
      { silent: true, ...options }
    )
  }

  async updateComment(commentId: number, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.updateComment(commentId, data),
      { successMessage: 'Comment updated successfully', errorMessage: 'Failed to update comment', ...options },
      'update'
    )
  }

  async deleteComment(commentId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.deleteComment(commentId),
      { successMessage: 'Comment deleted successfully', errorMessage: 'Failed to delete comment', ...options },
      'delete'
    )
  }

  async getCommentCount(entityType: string, entityId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getCommentCount(entityType, entityId),
      { silent: true, ...options }
    )
  }

  async getUserCommentCount(userId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getUserCommentCount(userId),
      { silent: true, ...options }
    )
  }

  async getMyCommentCount(options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getMyCommentCount(),
      { silent: true, ...options }
    )
  }

  async getAllComments(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAllComments(params),
      { silent: true, ...options }
    )
  }

  // ==================== FAVORITE ENDPOINTS ====================

  async addToFavorites(documentId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.addToFavorites(documentId),
      { successMessage: 'Added to favorites', errorMessage: 'Failed to add to favorites', ...options },
      'create'
    )
  }

  async removeFromFavorites(documentId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.removeFromFavorites(documentId),
      { successMessage: 'Removed from favorites', errorMessage: 'Failed to remove from favorites', ...options },
      'remove'
    )
  }

  async isFavorite(documentId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.isFavorite(documentId),
      { silent: true, ...options }
    )
  }

  async getMyFavorites(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getMyFavorites(params),
      { silent: true, ...options }
    )
  }

  async getFavoritesByUser(userId: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getFavoritesByUser(userId, params),
      { silent: true, ...options }
    )
  }

  async getFavoritesByDocument(documentId: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getFavoritesByDocument(documentId, params),
      { silent: true, ...options }
    )
  }

  async getMyFavoritesCount(options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getMyFavoritesCount(),
      { silent: true, ...options }
    )
  }

  async getUserFavoritesCount(userId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getUserFavoritesCount(userId),
      { silent: true, ...options }
    )
  }

  async getDocumentFavoritesCount(documentId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getDocumentFavoritesCount(documentId),
      { silent: true, ...options }
    )
  }

  async getAllFavorites(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAllFavorites(params),
      { silent: true, ...options }
    )
  }

  // ==================== FOLDER FAVORITE ENDPOINTS ====================

  async addFolderToFavorites(folderId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.addFolderToFavorites(folderId),
      { successMessage: 'Folder added to favorites', errorMessage: 'Failed to add folder to favorites', ...options },
      'create'
    )
  }

  async removeFolderFromFavorites(folderId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.removeFolderFromFavorites(folderId),
      { successMessage: 'Folder removed from favorites', errorMessage: 'Failed to remove folder from favorites', ...options },
      'remove'
    )
  }

  async isFolderFavorite(folderId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.isFolderFavorite(folderId),
      { silent: true, ...options }
    )
  }

  async getMyFolderFavorites(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getMyFolderFavorites(params),
      { silent: true, ...options }
    )
  }

  async getFolderFavoritesByFolder(folderId: number, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getFolderFavoritesByFolder(folderId, params),
      { silent: true, ...options }
    )
  }

  async getMyFolderFavoritesCount(options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getMyFolderFavoritesCount(),
      { silent: true, ...options }
    )
  }

  // ==================== COMBINED FAVORITES ====================

  async getMyRepo(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getMyRepo(params),
      { silent: true, ...options }
    )
  }

  async getMyRepoCount(options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getMyRepoCount(),
      { silent: true, ...options }
    )
  }

  async checkFavoriteStatus(request: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.checkFavoriteStatus(request),
      { silent: true, ...options }
    )
  }

  // ==================== RECYCLE BIN ENDPOINTS ====================

  async moveToRecycleBin(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.moveToRecycleBin(data),
      { successMessage: 'Moved to recycle bin', errorMessage: 'Failed to move to recycle bin', ...options },
      'delete'
    )
  }

  async restoreFromRecycleBin(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.restoreFromRecycleBin(data),
      { successMessage: 'Restored from recycle bin', errorMessage: 'Failed to restore from recycle bin', ...options },
      'create'
    )
  }

  async permanentlyDelete(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.permanentlyDelete(data),
      { successMessage: 'Permanently deleted', errorMessage: 'Failed to permanently delete', ...options },
      'delete'
    )
  }

  async emptyRecycleBin(options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.emptyRecycleBin(),
      { successMessage: 'Recycle bin emptied', errorMessage: 'Failed to empty recycle bin', ...options },
      'delete'
    )
  }

  async emptyMyRecycleBin(options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.emptyMyRecycleBin(),
      { successMessage: 'Your recycle bin emptied', errorMessage: 'Failed to empty your recycle bin', ...options },
      'delete'
    )
  }

  async getAllRecycleBinEntries(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getAllRecycleBinEntries(params),
      { silent: true, ...options }
    )
  }

  async getRecycleBinEntriesByEntityType(entityType: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getRecycleBinEntriesByEntityType(entityType, params),
      { silent: true, ...options }
    )
  }

  async getMyRecycleBinEntries(params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getMyRecycleBinEntries(params),
      { silent: true, ...options }
    )
  }

  async getRecycleBinEntriesByUser(userId: string, params?: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getRecycleBinEntriesByUser(userId, params),
      { silent: true, ...options }
    )
  }

  async isInRecycleBin(entityType: string, entityId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.isInRecycleBin(entityType, entityId),
      { silent: true, ...options }
    )
  }

  async getRecycleBinCount(options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getRecycleBinCount(),
      { silent: true, ...options }
    )
  }

  async getRecycleBinCountByEntityType(entityType: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getRecycleBinCountByEntityType(entityType),
      { silent: true, ...options }
    )
  }

  async getMyRecycleBinCount(options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getMyRecycleBinCount(),
      { silent: true, ...options }
    )
  }

  async getUserRecycleBinCount(userId: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getUserRecycleBinCount(userId),
      { silent: true, ...options }
    )
  }

  async cleanupOldRecycleBinEntries(cutoffDate: string, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.cleanupOldRecycleBinEntries(cutoffDate),
      { successMessage: 'Old entries cleaned up', errorMessage: 'Failed to cleanup old entries', ...options },
      'delete'
    )
  }

  async getRecycleBinEntry(id: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getRecycleBinEntry(id),
      { silent: true, ...options }
    )
  }

  // ==================== LINK RULE ENDPOINTS ====================

  async createManualLink(data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.createManualLink(data),
      { successMessage: 'Manual link created successfully', errorMessage: 'Failed to create manual link', ...options },
      'create'
    )
  }

  async getDocumentManualLinks(documentId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getDocumentManualLinks(documentId),
      { silent: true, ...options }
    )
  }

  async getOutgoingManualLinks(documentId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getOutgoingManualLinks(documentId),
      { silent: true, ...options }
    )
  }

  async getIncomingManualLinks(documentId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getIncomingManualLinks(documentId),
      { silent: true, ...options }
    )
  }

  async updateManualLink(linkId: number, data: any, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.updateManualLink(linkId, data),
      { successMessage: 'Manual link updated successfully', errorMessage: 'Failed to update manual link', ...options },
      'update'
    )
  }

  async deleteManualLink(linkId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.deleteManualLink(linkId),
      { successMessage: 'Manual link deleted successfully', errorMessage: 'Failed to delete manual link', ...options },
      'delete'
    )
  }

  async getRelatedDocuments(documentId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getRelatedDocuments(documentId),
      { silent: true, ...options }
    )
  }

  async triggerLinkRuleRevalidation(options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.triggerLinkRuleRevalidation(),
      { successMessage: 'Link rule revalidation triggered successfully', errorMessage: 'Failed to trigger revalidation', ...options },
      'update'
    )
  }

  async revalidateLinkRule(ruleId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.revalidateLinkRule(ruleId),
      { successMessage: 'Link rule revalidated successfully', errorMessage: 'Failed to revalidate link rule', ...options },
      'update'
    )
  }

  async getLinkRuleCacheStatistics(options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.getLinkRuleCacheStatistics(),
      { silent: true, ...options }
    )
  }

  async clearDocumentLinkCache(documentId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.clearDocumentLinkCache(documentId),
      { successMessage: 'Document link cache cleared successfully', errorMessage: 'Failed to clear document link cache', ...options },
      'delete'
    )
  }

  async clearRuleLinkCache(ruleId: number, options?: ApiNotificationOptions) {
    return this.withNotification(
      () => apiClient.clearRuleLinkCache(ruleId),
      { successMessage: 'Rule link cache cleared successfully', errorMessage: 'Failed to clear rule link cache', ...options },
      'delete'
    )
  }
}

// Create and export a singleton instance
export const notificationApiClient = new NotificationApiClient()
export default notificationApiClient
