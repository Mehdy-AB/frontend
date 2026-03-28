// Export all API services
export { apiClient } from '../client';
export { authService } from './authService';
export { userManagementService } from './userManagementService';
export { roleManagementService } from './roleManagementService';
export { groupManagementService } from './groupManagementService';
export { documentService } from './documentService';
export { folderService } from './folderService';
export { searchService } from './searchService';
export { tagService } from './tagService';
export { linkRuleService } from './linkRuleService';
export { filingCategoryService } from './filingCategoryService';
export { commentService } from './commentService';
export { favoriteService } from './favoriteService';
export { recycleBinService } from './recycleBinService';
export { auditLogService } from './auditLogService';
export { unclassifiedDocumentService } from './unclassifiedDocumentService';
export { workflowService } from './workflowService';
export { stampService } from './stampService';
export { workspaceService } from './workspaceService';

// Re-export types for convenience
export * from '../../types/api';

// Note: Removed old services (userService.ts, roleService.ts, groupService.ts, apiService.ts, enhancedSearchService.ts)
// Use the *ManagementService versions instead which match the backend /api/v1/admin/* endpoints

