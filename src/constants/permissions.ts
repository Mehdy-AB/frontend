/**
 * Frontend permission constants matching backend Permissions.java
 * This file should be kept in sync with the backend Permissions.java
 */

export const Permissions = {
  // User Management
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ASSIGN_ROLE: 'user:assign-role',
  USER_CHANGE_PASSWORD: 'user:change-password',
  USER_DISABLE: 'user:disable',
  USER_RESET_PASSWORD: 'user:reset-password',

  // Role & Permission Management
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_CREATE: 'role:create',
  ROLE_ASSIGN: 'role:assign',
  ROLE_ASSIGN_PERMISSION: 'role:assign-permission',

  // Group Management
  GROUP_READ: 'group:read',
  GROUP_CREATE: 'group:create',
  GROUP_UPDATE: 'group:update',
  GROUP_DELETE: 'group:delete',
  GROUP_ASSIGN_USER: 'group:assign-user',
  GROUP_ASSIGN_ROLE: 'group:assign-role',

  // Folder Management
  FOLDER_READ: 'folder:read',
  FOLDER_UPDATE: 'folder:update',
  FOLDER_CREATE: 'folder:write',
  FOLDER_DELETE: 'folder:delete',
  FOLDER_SHARE: 'folder:share',
  FOLDER_UPLOAD: 'folder:upload',
  FOLDER_MOVE: 'folder:move',
  FOLDER_CHANGE_PERMISSIONS: 'folder:change-permissions',

  // Document Management
  DOCUMENT_READ: 'document:read',
  DOCUMENT_WRITE: 'document:write',
  DOCUMENT_UPDATE: 'document:update',
  DOCUMENT_DELETE: 'document:delete',
  DOCUMENT_EDIT: 'document:edit',
  DOCUMENT_SHARE: 'document:share',
  DOCUMENT_CHANGE_PERMISSIONS: 'document:change-permissions',
  DOCUMENT_LOCK: 'document:lock',
  DOCUMENT_UNLOCK: 'document:unlock',
  DOCUMENT_VERSION_CONTROL: 'document:version-control',
  DOCUMENT_SIGN: 'document:sign',
  DOCUMENT_ASSIGN_REVIEWER: 'document:assign-reviewer',
  DOCUMENT_VALIDATE: 'document:validate',
  DOCUMENT_ANNOTATE: 'document:annotate',
  DOCUMENT_DOWNLOAD: 'document:download',

  // OCR & Search
  OCR_READ: 'ocr:read',
  OCR_REPROCESS: 'ocr:reprocess',
  SEARCH_ADVANCED: 'search:advanced',
  SEARCH_FULL_TEXT: 'search:full-text',

  // Workflow & Validation
  WORKFLOW_VIEW_HISTORY: 'workflow:view-history',
  WORKFLOW_ASSIGN: 'workflow:assign',
  WORKFLOW_APPROVE: 'workflow:approve',
  WORKFLOW_REJECT: 'workflow:reject',
  WORKFLOW_CANCEL: 'workflow:cancel',

  // Dashboard & Analytics
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_EDIT_WIDGETS: 'dashboard:edit-widgets',
  REPORT_GENERATE: 'report:generate',
  REPORT_DOWNLOAD: 'report:download',

  // UI Customization & System Settings
  UI_CUSTOMIZE_THEME: 'ui:customize-theme',
  UI_MANAGE_WIDGETS: 'ui:manage-widgets',

  // Server & Admin Panel
  SERVER_VIEW_STATUS: 'server:view-status',
  SERVER_MANAGE_LOGS: 'server:manage-logs',
  SERVER_UPDATE_CONFIG: 'server:update-config',
  SERVER_BACKUP: 'server:backup',
  SERVER_RESTORE: 'server:restore',
  SERVER_MANAGE_STORAGE: 'server:manage-storage',
  SERVER_RESTART: 'server:restart',

  // Audit & Logs
  AUDIT_READ: 'audit:read',
  AUDIT_EXPORT: 'audit:export',
  AUDIT_FILTER_BY_USER: 'audit:filter-by-user',

  // Notification Management
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_SEND: 'notification:send',

  // Trash & Recovery
  TRASH_VIEW: 'trash:view',
  TRASH_RESTORE: 'trash:restore',
  TRASH_DELETE_PERMANENTLY: 'trash:delete-permanently',

  // Model & Metadata
  MODEL_WRITE: 'model:create',
  MODEL_READ: 'model:read',
  MODEL_UPDATE: 'model:update',
  MODEL_DELETE: 'model:delete',

  // Tag Management
  TAG_CREATE: 'tag:create',
  TAG_READ: 'tag:read',
  TAG_UPDATE: 'tag:update',
  TAG_DELETE: 'tag:delete',
  TAG_ASSIGN: 'tag:assign',

  // Form Management
  FORM_READ: 'form:read',
  FORM_CREATE: 'form:create',
  FORM_UPDATE: 'form:update',
  FORM_DELETE: 'form:delete',
  FORM_PUBLISH: 'form:publish',
  FORM_VIEW_SUBMISSIONS: 'form:view-submissions',

  // Stamp Management
  STAMP_READ: 'stamp:read',
  STAMP_CREATE: 'stamp:create',
  STAMP_UPDATE: 'stamp:update',
  STAMP_DELETE: 'stamp:delete',
  STAMP_APPLY: 'stamp:apply',
} as const;

/**
 * Map admin pages to required permissions
 * Each page can require multiple permissions (read for view, create/update/delete for actions)
 */
export const AdminPagePermissions: Record<string, {
  view?: string; // Permission required to view the page
  create?: string; // Permission required to create items
  update?: string; // Permission required to update items
  delete?: string; // Permission required to delete items
  assign?: string; // Permission required for assignment actions
}> = {
  // System pages
  '/admin/system/dms-settings': {
    view: Permissions.SERVER_VIEW_STATUS,
    update: Permissions.SERVER_UPDATE_CONFIG,
  },
  '/admin/system/customization': {
    view: Permissions.UI_CUSTOMIZE_THEME,
    update: Permissions.UI_CUSTOMIZE_THEME,
  },
  '/admin/system/email': {
    view: Permissions.SERVER_UPDATE_CONFIG,
    update: Permissions.SERVER_UPDATE_CONFIG,
  },
  '/admin/system/license': {
    view: Permissions.SERVER_VIEW_STATUS,
  },
  '/admin/system/emails': {
    view: Permissions.NOTIFICATION_READ,
    update: Permissions.NOTIFICATION_SEND,
  },
  '/admin/system/transactions': {
    view: Permissions.AUDIT_READ,
  },

  // User management pages
  '/admin/users': {
    view: Permissions.USER_READ,
    create: Permissions.USER_CREATE,
    update: Permissions.USER_UPDATE,
    delete: Permissions.USER_DELETE,
    assign: Permissions.USER_ASSIGN_ROLE,
  },
  '/admin/users/extranet': {
    view: Permissions.USER_READ,
    create: Permissions.USER_CREATE,
    update: Permissions.USER_UPDATE,
  },
  '/admin/users/ldap-servers': {
    view: Permissions.SERVER_VIEW_STATUS,
    create: Permissions.SERVER_UPDATE_CONFIG,
    update: Permissions.SERVER_UPDATE_CONFIG,
    delete: Permissions.SERVER_UPDATE_CONFIG,
  },
  '/admin/users/alias': {
    view: Permissions.USER_READ,
    create: Permissions.USER_CREATE,
    update: Permissions.USER_UPDATE,
    delete: Permissions.USER_DELETE,
  },
  '/admin/users/notifications': {
    view: Permissions.NOTIFICATION_READ,
    update: Permissions.NOTIFICATION_SEND,
  },

  // Group management
  '/admin/groups': {
    view: Permissions.GROUP_READ,
    create: Permissions.GROUP_CREATE,
    update: Permissions.GROUP_UPDATE,
    delete: Permissions.GROUP_DELETE,
    assign: Permissions.GROUP_ASSIGN_USER,
  },

  // Role management
  '/admin/roles': {
    view: Permissions.ROLE_READ,
    create: Permissions.ROLE_CREATE,
    update: Permissions.ROLE_UPDATE,
    delete: Permissions.ROLE_DELETE,
    assign: Permissions.ROLE_ASSIGN_PERMISSION,
  },

  // Document management pages
  '/admin/documents/filing-categories': {
    view: Permissions.MODEL_READ,
    create: Permissions.MODEL_WRITE,
    update: Permissions.MODEL_UPDATE,
    delete: Permissions.MODEL_DELETE,
  },
  '/admin/documents/secured-spaces': {
    view: Permissions.DOCUMENT_READ,
    create: Permissions.DOCUMENT_WRITE,
    update: Permissions.DOCUMENT_UPDATE,
    delete: Permissions.DOCUMENT_DELETE,
  },
  '/admin/documents/linking': {
    view: Permissions.DOCUMENT_READ,
    create: Permissions.DOCUMENT_WRITE,
    update: Permissions.DOCUMENT_UPDATE,
    delete: Permissions.DOCUMENT_DELETE,
  },
  '/admin/documents/tags': {
    view: Permissions.TAG_READ,
    create: Permissions.TAG_CREATE,
    update: Permissions.TAG_UPDATE,
    delete: Permissions.TAG_DELETE,
    assign: Permissions.TAG_ASSIGN,
  },
  '/admin/documents/stamps': {
    view: Permissions.STAMP_READ,
    create: Permissions.STAMP_CREATE,
    update: Permissions.STAMP_UPDATE,
    delete: Permissions.STAMP_DELETE,
  },
  '/admin/documents/digital-signature': {
    view: Permissions.DOCUMENT_SIGN,
    update: Permissions.DOCUMENT_SIGN,
  },

  // Workflow pages
  '/admin/workflow/tasks': {
    view: Permissions.WORKFLOW_VIEW_HISTORY,
    assign: Permissions.WORKFLOW_ASSIGN,
  },
  '/admin/workflow/designer': {
    view: Permissions.WORKFLOW_VIEW_HISTORY,
    create: Permissions.WORKFLOW_ASSIGN,
    update: Permissions.WORKFLOW_ASSIGN,
  },
  '/admin/workflow/working-hours': {
    view: Permissions.WORKFLOW_VIEW_HISTORY,
    update: Permissions.WORKFLOW_ASSIGN,
  },

  // Forms pages
  '/admin/forms': {
    view: Permissions.FORM_READ,
    create: Permissions.FORM_CREATE,
    update: Permissions.FORM_UPDATE,
    delete: Permissions.FORM_DELETE,
  },
  '/admin/forms/create': {
    view: Permissions.FORM_CREATE,
    create: Permissions.FORM_CREATE,
  },
  // Dynamic form edit page - matches /admin/forms/[id]/edit
  '/admin/forms/edit': {
    view: Permissions.FORM_UPDATE,
    update: Permissions.FORM_UPDATE,
  },
};

