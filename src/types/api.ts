// Updated API types to match backend structure
// Base API types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PageResponse<T> {
  content: T[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// Enums
export const GranteeType = {
  USER: 'USER',
  GROUP: 'GROUP',
  ROLE: 'ROLE'
} as const;

export type GranteeType = typeof GranteeType[keyof typeof GranteeType];

export const ExtractorLanguage = {
  ARA: 'ara',
  FRA: 'fra',
  ENG: 'eng'
} as const;

export type ExtractorLanguage = typeof ExtractorLanguage[keyof typeof ExtractorLanguage];

export const SortFields = {
  OWNED_BY: 'ownedBy',
  NAME: 'name',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  CREATED_BY: 'createdBy'
} as const;

export type SortFields = typeof SortFields[keyof typeof SortFields];

export const SortFieldsUser = {
  USERNAME: 'USERNAME',
  EMAIL: 'EMAIL',
  FIRST_NAME: 'FIRST_NAME',
  CREATED_TIMESTAMP: 'CREATED_TIMESTAMP',
  LAST_NAME: 'LAST_NAME'
} as const;

export type SortFieldsUser = typeof SortFieldsUser[keyof typeof SortFieldsUser];

export const SearchFields = {
  USERNAME: 'USERNAME',
  EMAIL: 'EMAIL',
  FIRST_NAME: 'FIRST_NAME',
  LAST_NAME: 'LAST_NAME'
} as const;

export type SearchFields = typeof SearchFields[keyof typeof SearchFields];

export const ElasticSortFields = {
  SCORE: 'score',
  NAME: 'name',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt'
} as const;

export type ElasticSortFields = typeof ElasticSortFields[keyof typeof ElasticSortFields];

export const SearchResultType = {
  FOLDER: 'FOLDER',
  DOCUMENT: 'DOCUMENT'
} as const;

export type SearchResultType = typeof SearchResultType[keyof typeof SearchResultType];

export const MetadataType = {
  LIST: 'LIST',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  DATETIME: 'DATETIME',
  DATE: 'DATE',
  FLOAT: 'FLOAT',
  BOOLEAN: 'BOOLEAN'
} as const;

export type MetadataType = typeof MetadataType[keyof typeof MetadataType];

// ==================== USER TYPES ====================

export interface UserDto {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  jobTitle?: string;
  imgUrl?: string;
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  attributes?: Record<string, any>;
  roles: string[];
  groups: string[];
}

export interface CreateUserRequest {
  username: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  imageUrl?: string;
}

export interface UpdateUserRequest {
  username: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  imageUrl?: string;
}

// ==================== ROLE TYPES ====================

export interface RoleDto {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isSystem?: boolean;
  permissions: PermissionDto[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface PermissionDto {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
}

// ==================== GROUP TYPES ====================

export interface GroupDto {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  userCount: number;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface UpdateGroupRequest {
  name: string;
  description?: string;
}

// ==================== DOCUMENT TYPES ====================

export interface DocumentMetadataResponseDto {
  metadataId: number;
  metadataName: string;
  value: string;
  categoryName: string;
  categoryId: number;
}

export interface DocumentFilingCategoryResponseDto {
  id: number;
  name: string;
  description?: string;
  metadata: DocumentMetadataResponseDto[];
}

export interface DocumentResponseDto {
  documentId: number;
  versionId: number;
  createdBy: UserDto;
  ownedBy: UserDto;
  name: string;
  title: string;
  description?: string;
  path: string;
  folderId: number;
  sizeBytes: number;
  mimeType: string;
  versionNumber: number;
  activeVersion?: number;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  metadata: string[];
  filingCategory?: DocumentFilingCategoryResponseDto;
  userPermissions: DocumentPermissionResDto;
}

export interface DocumentUploadRequestDto {
  file: File;
  folderId: number;
  createdBy: string;
  lang: ExtractorLanguage;
  title: string;
}

export interface DocumentVersionUploadRequestDto {
  file: File;
  documentId: number;
  lang: ExtractorLanguage;
  createdBy: string;
  filingCategory?: FilingCategoryDocDto[];
}

export interface EditDocumentTitleRequestDto {
  title: string;
}

export interface DocumentPermissionReq {
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManagePermissions: boolean;
}

export interface DocumentPermissionResDto {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
}

export interface MetaDataDto {
  id: number;
  value: string;
}

export interface FilingCategoryDocDto {
  id: number;
  metaDataDto: MetaDataDto[];
}

export interface UpdateDocumentMetadataRequestDto {
  filingCategory: FilingCategoryDocDto;
}

// ==================== TAG TYPES ====================

export interface CreateTagRequestDto {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateTagRequestDto {
  name?: string;
  description?: string;
  color?: string;
}

export interface TagResponseDto {
  id: number;
  name: string;
  description?: string;
  color?: string;
  createdBy: UserDto;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
}

export interface AddTagToDocumentRequestDto {
  tagId: number;
}

export interface DocumentTagResponseDto {
  id: number;
  documentId: number;
  tagId: number;
  tag: TagResponseDto;
  createdBy: UserDto;
  createdAt: string;
}

// ==================== LINK RULE TYPES ====================

export interface LinkRuleRequestDto {
  name: string;
  description?: string;
  linkType: string;
  conditionsLogic: 'AND' | 'OR';
  conditions: LinkRuleConditionRequestDto[];
  enabled?: boolean;
  bidirectional?: boolean;
}

export interface LinkRuleConditionRequestDto {
  sourceMetadataId: number;
  targetMetadataId: number;
  operator: 'EQUAL' | 'NOT_EQUAL' | 'CONTAINS' | 'NOT_CONTAINS';
  caseSensitive?: boolean;
}

export interface LinkRuleResponseDto {
  id: number;
  name: string;
  description?: string;
  linkType: string;
  conditionsLogic: 'AND' | 'OR';
  conditions: LinkRuleConditionResponseDto[];
  enabled: boolean;
  bidirectional: boolean;
  createdBy: UserDto;
  createdAt: string;
  updatedAt: string;
  linksCreated: number;
  lastExecutedAt?: string;
}

export interface LinkRuleConditionResponseDto {
  id: number;
  sourceMetadataId: number;
  targetMetadataId: number;
  operator: string;
  caseSensitive: boolean;
  sourceMetadataName: string;
  targetMetadataName: string;
}

export interface DocumentLinkRequestDto {
  sourceDocumentId: number;
  targetDocumentId: number;
  linkType: string;
  description?: string;
}

export interface DocumentLinkResponseDto {
  id: number;
  sourceDocumentId: number;
  targetDocumentId: number;
  linkType: string;
  description?: string;
  isManual: boolean;
  ruleId?: number;
  ruleName?: string;
  createdBy: UserDto;
  createdAt: string;
  sourceDocument: RelatedDocumentResponseDto;
  targetDocument: RelatedDocumentResponseDto;
}

export interface RelatedDocumentResponseDto {
  documentId: number;
  versionId: number;
  documentName: string;
  documentTitle: string;
  documentDescription?: string;
  path: string;
  folderId: number;
  sizeBytes: number;
  mimeType: string;
  versionNumber: number;
  activeVersion?: number;
  documentCreatedAt: string;
  isPublic: boolean;
  ownedBy: UserDto;
  linkType: string;
  description?: string;
  isManual: boolean;
  ruleName?: string;
  ruleId?: number;
  linkedAt: string;
  metadata: DocumentMetadataResponseDto[];
  filingCategory?: DocumentFilingCategoryResponseDto;
  userPermissions: DocumentPermissionResDto;
}

// ==================== FOLDER TYPES ====================

export interface FolderResDto {
  id: number;
  name: string;
  path: string;
  parentId?: number;
  sizeBytes: number;
  isPublic: boolean;
  ownedBy: UserDto;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
  folderCount: number;
}

export interface FolderWithOwnerDto extends FolderResDto {
  ownedBy: UserDto;
}

export interface FolderPermissionResDto {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
}

export interface CreateFolderDto {
  name: string;
  description?: string;
  parentId?: number;
  usersGevenPermission?: TypeShareAcces[];
  goupesGevenPermission?: TypeShareAcces[];
  rolesGevenPermission?: TypeShareAcces[];
  subfolders?: SubfolderDto[];
}

// Recursive subfolder - can have nested subfolders
// Permissions are automatically inherited from parent
export interface SubfolderDto {
  name: string;
  description?: string;
  subfolders?: SubfolderDto[]; // Can be nested infinitely
}

export interface FolderPermissionReq {
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManagePermissions: boolean;
  canCreateSubFolders: boolean;
  canEditDoc: boolean;
  canDeleteDoc: boolean;
  canShareDoc: boolean;
  canManagePermissionsDoc: boolean;
  inherits: boolean;
}

export interface TypeShareAcces {
  id: string;
  permission: FolderPermissionReq;
}

export interface FolderRepoResDto {
  folders: FolderResDto[];
  documents: DocumentResponseDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ==================== FILING CATEGORIES TYPES ====================

export interface FilingCategoryRequestDto {
  name: string;
  description?: string;
}

export interface FilingCategoryResponseDto {
  id: number;
  name: string;
  description?: string;
  createdBy?: UserDto | null;
  metadataDefinitions?: CategoryMetadataDefinitionDto[]; // For frontend compatibility
}

export interface MetaDataListReq {
  name: string;
  description?: string;
  metadataFields: MetadataFieldDto[];
}

export interface MetaDataListRes {
  id: number;
  name: string;
  description?: string;
  metadataFields: MetadataFieldDto[];
  createdAt: string;
  updatedAt: string;
}

export interface MetadataFieldDto {
  id?: number;
  name: string;
  type: MetadataType;
  required: boolean;
  options?: string[];
}

// ==================== SEARCH TYPES ====================

export interface UnifiedSearchRequestDto {
  query?: string;
  ownerId?: string;
  createdAt?: {
    from?: string;
    to?: string;
  };
  metadataOperations?: MetadataOperationDto[];
  lookupFields?: string[];
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface MetadataOperationDto {
  metadataId: number;
  operator: 'EQUAL' | 'NOT_EQUAL' | 'CONTAINS' | 'NOT_CONTAINS' | 'GT' | 'LT' | 'GTE' | 'LTE';
  value: string;
}

export interface GlobalSearchResultDto {
  documents: DocumentSearchResultDto[];
  folders: FolderSearchResultDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  searchTime: number;
  searchType: 'DATABASE' | 'ELASTICSEARCH';
}

export interface DocumentSearchResultDto {
  documentId: number;
  versionId: number;
  name: string;
  title: string;
  description?: string;
  path: string;
  folderId: number;
  sizeBytes: number;
  mimeType: string;
  versionNumber: number;
  activeVersion?: number;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  ownedBy: UserDto;
  createdBy: UserDto;
  filingCategory?: DocumentFilingCategoryResponseDto;
  metadata: DocumentMetadataResponseDto[];
  userPermissions: DocumentPermissionResDto;
  score?: number;
}

export interface FolderSearchResultDto {
  id: number;
  name: string;
  path: string;
  parentId?: number;
  sizeBytes: number;
  isPublic: boolean;
  ownedBy: UserDto;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
  folderCount: number;
  userPermissions: FolderPermissionResDto;
  score?: number;
}

export interface AdvancedSearchRequestDto {
  query?: string;
  ownerId?: string;
  createdAt?: {
    from?: string;
    to?: string;
  };
  metadataOperations?: MetadataOperationDto[];
  lookupFields?: string[];
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface AdvancedSearchResponseDto {
  documents: DocumentSearchResultDto[];
  folders: FolderSearchResultDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  searchTime: number;
}

export interface SearchRequestDto {
  query: string;
  page?: number;
  size?: number;
}

export interface Filters {
  ownerId?: string;
  createdAt?: {
    from?: string;
    to?: string;
  };
  metadataOperations?: MetadataOperationDto[];
}

export interface ModelMetadataFilterDto {
  metadataId: number;
  operator: string;
  value: string;
}

export interface MetadataFieldFilter {
  metadataId: number;
  operator: string;
  value: string;
}

// Additional search-related types for frontend components
export interface MetadataFilter {
  id: string;
  metadataId: number;
  metadataName: string;
  fieldName?: string; // Alias for metadataName
  operator: FilterOperator;
  value: string;
  values?: string[]; // For multi-value filters
  fromValue?: string; // For range filters
  toValue?: string; // For range filters
  categoryId?: string; // Changed to string for component compatibility
  categoryName?: string;
  metadataDefinitionId?: number; // Alias for metadataId
  fieldType?: string; // Data type of the field
}

export const FilterOperator = {
  EQUAL: 'EQUAL',
  EQUALS: 'EQUAL', // Alias for compatibility
  NOT_EQUAL: 'NOT_EQUAL',
  CONTAINS: 'CONTAINS',
  NOT_CONTAINS: 'NOT_CONTAINS',
  GT: 'GT',
  LT: 'LT',
  GTE: 'GTE',
  LTE: 'LTE',
  STARTS_WITH: 'STARTS_WITH',
  ENDS_WITH: 'ENDS_WITH',
  IS_EMPTY: 'IS_EMPTY',
  IS_NOT_EMPTY: 'IS_NOT_EMPTY',
  IN: 'IN',
  RANGE: 'RANGE'
} as const;

export type FilterOperator = typeof FilterOperator[keyof typeof FilterOperator];

export const SearchScope = {
  DOCUMENTS: 'DOCUMENTS',
  FOLDERS: 'FOLDERS',
  BOTH: 'BOTH'
} as const;

export type SearchScope = typeof SearchScope[keyof typeof SearchScope];

export interface CategoryMetadataDefinitionDto {
  id: number;
  name: string;
  description?: string;
  metadataFields: MetadataFieldDefinitionDto[];
  key?: string; // Alias for name
  dataType?: string; // Data type of the metadata
  mandatory?: boolean; // Whether the field is required
  list?: {
    option?: string[]; // List options
  } | boolean; // Whether the field is a list type
}

export interface MetadataFieldDefinitionDto {
  id: number;
  name: string;
  type: MetadataType;
  required: boolean;
  options?: string[];
  categoryId: number;
}

// Search configuration for frontend components
export interface SearchConfiguration {
  query?: string;
  scope?: SearchScope;
  filters?: {
    contentType?: 'documents' | 'folders' | 'both';
    searchScope?: {
      lookUpNames?: boolean;
      lookUpDescription?: boolean;
      lookUpMetadataValue?: boolean;
      lookUpOcrContent?: boolean;
      lookUpTags?: boolean;
      searchInName?: boolean; // Legacy
      searchInDescription?: boolean; // Legacy
      searchInMetadata?: boolean; // Legacy
      searchInOcrText?: boolean; // Legacy
      searchInTags?: boolean; // Legacy
    };
    dateRange?: {
      from?: string;
      to?: string;
    };
    selectedCategories?: number[];
    metadataFilters?: MetadataFilter[];
  };
  ownerId?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

// ==================== COMMENT TYPES ====================

export interface Comment {
  id: number;
  entityType: string;
  entityId: number;
  text: string;
  createdBy: UserDto;
  createdAt: string;
  updatedAt: string;
  parentId?: number;
  replies?: Comment[];
}

export interface CommentCreateReq {
  entityType: string;
  entityId: number;
  text: string;
  parentId?: number;
}

export interface CommentUpdateReq {
  text: string;
}

export interface CommentCountResponse {
  count: number;
}

// ==================== FAVORITE TYPES ====================

export interface Favorite {
  id: number;
  documentId?: number;
  folderId?: number;
  user: UserDto;
  createdAt: string;
  document?: DocumentResponseDto;
  folder?: FolderResDto;
}

export interface FavoriteCheckResponse {
  isFavorite: boolean;
}

export interface FavoriteCountResponse {
  count: number;
}

// ==================== RECYCLE BIN TYPES ====================

export interface RecycleBinEntry {
  id: number;
  entityType: string;
  entityId: number;
  entityName: string;
  deletedBy: UserDto;
  deletedAt: string;
  originalPath?: string;
  expiresAt?: string;
}

export interface RecycleBinMoveReq {
  entityType: string;
  entityId: number;
}

export interface RecycleBinRestoreReq {
  entityType: string;
  entityId: number;
}

export interface RecycleBinPermanentDeleteReq {
  entityType: string;
  entityId: number;
}

export interface RecycleBinCheckResponse {
  isInRecycleBin: boolean;
}

export interface RecycleBinCountResponse {
  count: number;
}

// ==================== AUDIT LOG TYPES ====================

export interface AuditLog {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  user: UserDto;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, any>;
}

export interface AuditLogStatistics {
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByUser: Record<string, number>;
  actionsByEntity: Record<string, number>;
}

// ==================== CLASS A TYPES ====================

export interface ClassAUploadRequestDto {
  folderId: number;
  createdBy: string;
  title: string;
  fileName: string;
  categoryId: number;
}

export interface ClassAResponseDto {
  id: number;
  title: string;
  fileName: string;
  folderId: number;
  createdBy: UserDto;
  createdAt: string;
  updatedAt: string;
  categoryId: number;
  categoryName: string;
}

export interface ClassADetailResponseDto extends ClassAResponseDto {
  description?: string;
  metadata: DocumentMetadataResponseDto[];
  filingCategory: DocumentFilingCategoryResponseDto;
}

export interface ClassASearchRequestDto {
  query?: string;
  userId?: string;
  categoryId?: number;
  name?: string;
  dateFrom?: string;
  dateTo?: string;
  exactDate?: string;
  page?: number;
  size?: number;
}

export interface ClassAStatisticsResponseDto {
  totalDocuments: number;
  documentsByCategory: Record<string, number>;
  documentsByUser: Record<string, number>;
  documentsByMonth: Record<string, number>;
}

// ==================== BULK UPLOAD TYPES ====================

export interface BulkUploadRequestDto {
  files: FileDataDto[];
  folderId: number;
  title: string;
  lang: ExtractorLanguage;
  fileName?: string;
  tagsJson?: string;
  filingCategory?: FilingCategoryDocDto;
}

export interface FileDataDto {
  fileName: string;
  content: string; // Base64 encoded
  contentType: string;
  size: number;
}

export interface BulkUploadResponseDto {
  document: DocumentResponseDto;
  success: boolean;
  message?: string;
}

// ==================== DOCUMENT SEARCH TYPES ====================

export interface DocumentSearchResponseDto {
  documents: DocumentSearchResultDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface DocumentSearchResponse {
  documents: DocumentSearchResultDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ==================== RULE EXECUTION TYPES ====================

export interface RuleExecutionRequest {
  ruleId: number;
  documentIds?: number[];
  dryRun?: boolean;
}

export interface RuleExecutionResponse {
  ruleId: number;
  documentsProcessed: number;
  linksCreated: number;
  executionTime: number;
  success: boolean;
  message?: string;
}

export interface RuleStatistics {
  ruleId: number;
  ruleName: string;
  totalExecutions: number;
  totalLinksCreated: number;
  averageExecutionTime: number;
  lastExecutedAt?: string;
  successRate: number;
}

export interface BulkRuleExecutionRequest {
  ruleIds: number[];
  documentIds?: number[];
  dryRun?: boolean;
}

export interface BulkRuleExecutionResponse {
  totalRules: number;
  successfulRules: number;
  failedRules: number;
  totalDocumentsProcessed: number;
  totalLinksCreated: number;
  executionTime: number;
  results: RuleExecutionResponse[];
}

export interface LinkRuleCacheStatistics {
  totalCacheEntries: number;
  cacheHitRate: number;
  averageCacheSize: number;
  cacheEvictions: number;
}

// ==================== MOVING TYPES ====================

export enum MovingType {
  DOCUMENT = 'DOCUMENT',
  FOLDER = 'FOLDER'
}

export interface AllowedFoldersToMove {
  id: number;
  name: string;
  path: string;
  canMove: boolean;
  reason?: string;
}

// ==================== SHARING TYPES ====================

export interface TypeShareAccessDocWithTypeReq {
  granteeId: string;
  granteeType: GranteeType;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
}

export interface TypeShareAccessDocumentRes {
  id: number;
  documentId: number;
  granteeId: string;
  granteeType: GranteeType;
  granteeName: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
  grantedBy: UserDto;
  grantedAt: string;
  revokedAt?: string;
  revokedBy?: UserDto;
}

export interface TypeShareAccessWithTypeReq {
  granteeId: string;
  granteeType: GranteeType;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
  inherits: boolean;
}

export interface TypeShareAccessRes {
  id: number;
  folderId: number;
  granteeId: string;
  granteeType: GranteeType;
  granteeName: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
  inherits: boolean;
  grantedBy: UserDto;
  grantedAt: string;
  revokedAt?: string;
  revokedBy?: UserDto;
}

// ==================== UPDATE DOCUMENT TYPES ====================

export interface UpdateDocumentDescriptionRequestDto {
  description: string;
}

// ==================== COMMON TYPES ====================

// Additional types can be added here if needed