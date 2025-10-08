// Export the main API clients
export { default as apiClient } from './client';
export { default as notificationApiClient } from './notificationClient';

// Export all services
export { default as UserService } from './services/userService';
export { default as RoleService } from './services/roleService';
export { default as GroupService } from './services/groupService';
export { default as DocumentService } from './services/documentService';
export { default as FolderService } from './services/folderService';
export { default as FilingCategoryService, MetadataListService } from './services/filingCategoryService';
export { default as SearchService } from './services/searchService';
export { default as AuditLogService } from './services/auditLogService';
export { default as CommentService } from './services/commentService';
export { default as FavoriteService } from './services/favoriteService';
export { default as RecycleBinService } from './services/recycleBinService';

// Export all types
export * from '../types/api';
