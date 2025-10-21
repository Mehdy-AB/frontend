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
export enum GranteeType {
  USER = 'USER',
  GROUP = 'GROUP',
  ROLE = 'ROLE'
}

export enum ExtractorLanguage {
  ARA = 'ara',
  FRA = 'fra',
  ENG = 'eng'
}

export enum SortFields {
  OWNED_BY = 'ownedBy',
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  CREATED_BY = 'createdBy'
}

export enum SortFieldsUser {
  USERNAME = 'USERNAME',
  EMAIL = 'EMAIL',
  FIRST_NAME = 'FIRST_NAME',
  CREATED_TIMESTAMP = 'CREATED_TIMESTAMP',
  LAST_NAME = 'LAST_NAME'
}

export enum SearchFields {
  USERNAME = 'USERNAME',
  EMAIL = 'EMAIL',
  FIRST_NAME = 'FIRST_NAME',
  LAST_NAME = 'LAST_NAME'
}

export enum ElasticSortFields {
  SCORE = 'score',
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

export enum SearchResultType {
  FOLDER = 'FOLDER',
  DOCUMENT = 'DOCUMENT'
}

export enum MetadataType {
  LIST = 'LIST',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DATETIME = 'DATETIME',
  DATE = 'DATE',
  FLOAT = 'FLOAT',
  BOOLEAN = 'BOOLEAN'
}

// User types
export interface UserDto {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  jobTitle: string[];
  imageUrl: string;
  email: string;
  createdTimestamp: string;
}

export interface FullUserDto {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  jobTitle: string[];
  imageUrl: string;
  email: string;
  createdTimestamp: string;
  sessions: any[]; // UserSessionRepresentation from Keycloak
}

export interface UserCreateReq {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  job: string[];
  imageUrl?: string;
}

export interface UserUpdateReq {
  firstName?: string;
  lastName?: string;
  email?: string;
  enabled?: boolean;
  imageUrl?: string;
  jobTitle?: string[];
}

// Role types
export interface RoleDto {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface RoleCreateReq {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface RoleUpdateReq {
  description?: string;
  permissions?: string[];
}

// Group types
export interface GroupDto {
  id: string;
  name: string;
  description: string;
  path: string;
}

export interface GroupCreateReq {
  name: string;
  description?: string;
  path?: string;
}

export interface GroupUpdateReq {
  name?: string;
  description?: string;
  path?: string;
}

// Document types
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
  metadataDefinitions: CategoryMetadataDefinitionDto[];
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
  name: string;
  description?: string;
  color?: string;
}

export interface AddTagToDocumentRequestDto {
  tagId: number;
}

export interface TagResponseDto {
  id: number;
  name: string;
  description?: string;
  color?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isSystem?: boolean;
  documentCount?: number;
}

export interface DocumentTagResponseDto {
  documentId: number;
  tagId: number;
  tagName: string;
  tagColor?: string;
  createdBy: string;
  createdAt: string;
}

// ==================== LINK RULE TYPES ====================

// Enums for link rules
export enum ConditionLogic {
  AND = 'AND',
  OR = 'OR'
}

export enum ConditionOperator {
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  CONTAINS = 'CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  IN = 'IN',
  NOT_IN = 'NOT_IN'
}

export interface LinkRuleConditionRequestDto {
  sourceMetadataId: number;
  targetMetadataId: number;
  operator: ConditionOperator;
  caseSensitive?: boolean;
}

export interface MetadataInfoDto {
  metadataId: number;
  metadataName: string;
  categoryId: number;
  categoryName: string;
  dataType: string;
}

export interface LinkRuleConditionResponseDto {
  id: number;
  sourceMetadata: MetadataInfoDto;
  targetMetadata: MetadataInfoDto;
  operator: ConditionOperator;
  caseSensitive: boolean;
}

export interface LinkRuleRequestDto {
  name: string;
  description?: string;
  linkType: string;
  conditionsLogic: ConditionLogic;
  conditions: LinkRuleConditionRequestDto[];
  enabled?: boolean;
  bidirectional?: boolean;
}

export interface LinkRuleResponseDto {
  id: number;
  name: string;
  description?: string;
  linkType: string;
  conditions: LinkRuleConditionResponseDto[];
  enabled: boolean;
  bidirectional: boolean;
  createdBy: UserDto;
  createdAt: string;
  updatedAt: string;
  activeLinksCount?: number;
}

export interface DocumentLinkRequestDto {
  sourceDocumentId: number;
  targetDocumentId: number;
  linkType: string;
  description?: string;
}

export interface DocumentLinkResponseDto {
  id: number;
  // Source document
  sourceDocumentId: number;
  sourceDocumentName: string;
  sourceDocumentTitle: string;
  // Target document
  targetDocumentId: number;
  targetDocumentName: string;
  targetDocumentTitle: string;
  // Link details
  linkType: string;
  description?: string;
  isManual: boolean; // Changed from isAutomatic - INVERTED LOGIC!
  // Rule info (if automatic)
  ruleId?: number;
  ruleName?: string;
  createdBy: string;
  createdAt: string;
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
  activeVersion: number;
  documentCreatedAt: string;
  documentUpdatedAt: string;
  isPublic: boolean;
  // User information
  createdBy: UserDto;
  ownedBy: UserDto;
  // Link information
  linkType: string;
  description?: string;
  isManual: boolean;
  ruleName?: string;
  ruleId?: number;
  linkedAt: string;
  // Document metadata for frontend display
  metadata: RelatedDocumentMetadataDto[];
  // Category information
  filingCategory?: RelatedDocumentFilingCategoryDto;
  // User permissions
  userPermissions?: RelatedDocumentUserPermissionsDto;
}

export interface RelatedDocumentMetadataDto {
  metadataId: number;
  metadataName: string;
  value: string;
  categoryName: string;
  categoryId: number;
}

export interface RelatedDocumentFilingCategoryDto {
  id: number;
  name: string;
  description?: string;
  metadata: RelatedDocumentMetadataDto[];
  metadataDefinitions: RelatedDocumentMetadataDefinitionDto[];
}

export interface RelatedDocumentMetadataDefinitionDto {
  id: number;
  key: string;
  dataType: string;
  mandatory: boolean;
  listId?: number;
  list?: RelatedDocumentListMetaDataDto;
}

export interface RelatedDocumentListMetaDataDto {
  id: number;
  name: string;
  description?: string;
  mandatory: boolean;
  option: string[];
}

export interface RelatedDocumentUserPermissionsDto {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
}

export interface TypeShareAccessDocWithTypeReq {
  granteeId: string;
  permission: DocumentPermissionReq;
  type: GranteeType;
}

export interface TypeShareAccessDocumentRes {
  grantee: any;
  permission: DocumentPermissionReq;
}

// Folder types
export interface FolderResDto {
  id: number;
  name: string;
  description: string;
  parentId: number;
  createdBy: UserDto;
  ownedBy: UserDto;
  isPublic: boolean;
  size: number;
  createdAt: string;
  updatedAt: string;
  path: string;
  userPermissions: FolderPermissionResDto;
}

export interface CreateFolderDto {
  name: string;
  description?: string;
  parentId?: number;
  usersGevenPermission: TypeShareAcces[];
  goupesGevenPermission: TypeShareAcces[];
  rolesGevenPermission: TypeShareAcces[];
  subgroups: CreateFolderDto[];
}

export interface FolderRepoResDto {
  folder: FolderResDto;
  folders: FolderResDto[];
  documents: DocumentResponseDto[];
  page: PageMeta;
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

export interface FolderPermissionResDto {
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

export interface TypeShareAccessWithTypeReq {
  granteeId: string;
  permission: FolderPermissionReq;
  type: GranteeType;
}

export interface TypeShareAccessRes {
  grantee: any;
  permission: FolderPermissionReq;
}

// Filing Categories types
export interface FilingCategoryRequestDto {
  name: string;
  description?: string;
  metadataDefinitions: CategoryMetadataDefinitionDto[];
}

export interface FilingCategoryResponseDto {
  id: number;
  name: string;
  description: string;
  createdBy: UserDto;
  metadataDefinitions: CategoryMetadataDefinitionDto[];
}

export interface CategoryMetadataDefinitionDto {
  id?: number;
  key: string;
  dataType: MetadataType;
  mandatory: boolean;
  listId?: number;
  list?: MetaDataListReq;
}

export interface MetaDataListReq {
  id?: number;
  name: string;
  description?: string;
  mandatory: boolean;
  option: string[];
}

export interface MetaDataListRes {
  id: number;
  name: string;
  description: string;
  mandatory: boolean;
  option: string[];
}

// Elastic Search types
export interface GlobalSearchResultDto {
  folders: SearchFoldersRes[];
  documents: SearchDocumentsRes[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export interface SearchFoldersRes {
  folder: FolderResDto;
  score: number;
  highlight: Record<string, string>;
}

export interface SearchDocumentsRes {
  document: DocumentResponseDto;
  score: number;
  highlight: Record<string, string>;
  // Enhanced fields for version search
  documentId: number;
  versionId: number;
  name: string;
  title: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
  versionNumber: number;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  userPermissions: any;
  versions: DocumentVersionInfo[];
}

export interface DocumentVersionInfo {
  versionId: number;
  versionNumber: number;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== UNIFIED SEARCH TYPES ====================

export interface UnifiedSearchRequestDto {
  // Basic search parameters
  query?: string;
  page?: number;
  size?: number;

  // Content type filters
  includeFolders?: boolean;
  includeDocuments?: boolean;

  // Simple filters (triggers DB search when no text query)
  ownerId?: string; // Search by owner (user ID)

  // Creation date - supports both single date and date range
  createdAt?: string; // Single creation date
  createdAtFrom?: string; // Start of date range
  createdAtTo?: string; // End of date range
  
  // Search field toggles (for Elasticsearch)
  lookUpNames?: boolean;
  lookUpMetadataValue?: boolean;
  lookUpOcrContent?: boolean;
  lookUpDescription?: boolean;
  lookUpTags?: boolean;

  // Sorting
  sortBy?: string;
  sortDesc?: boolean;

  // Advanced search features (always triggers Elasticsearch)
  metadataOperations?: MetadataOperationDto; // AND/OR metadata search
}

export interface CategoryMetadataSearchDto {
  // Category selection
  categoryId?: number;
  categoryName?: string;
  
  // Metadata field filters
  metadataFilters?: MetadataFilter[];
}

export interface MetadataFilter {
  // Field identification
  metadataDefinitionId?: number;
  
  // Filter operation
  operator: FilterOperator;
  
  // Values
  value?: string;
  fromValue?: any;
  toValue?: any;
  values?: string[];
}

export interface MetadataOperationDto {
  // Operation type between metadata conditions
  operationType: 'AND' | 'OR';
  
  // List of metadata conditions
  conditions: MetadataCondition[];
}

export interface MetadataCondition {
  // Model and metadata field identification
  metadataDefinitionId: number;  // ID of the CategoryMetadataDefinition
  
  // Filter operation
  operator: FilterOperator;    // EQUALS, CONTAINS, RANGE, GT, LT, GTE, LTE, IN, NOT_IN
  
  // Values
  value?: string;               // For EQUALS, CONTAINS
  fromValue?: any;              // For RANGE, GTE
  toValue?: any;                // For RANGE, LTE
  values?: string[];            // For IN, NOT_IN (for LIST type)
}

// ==================== SEARCH REQUEST TYPES ====================

export interface ModelMetadataFilterDto {
  modelId: number;
  modelName?: string;
  metadataFieldFilters?: Record<string, any>;
  metadataFieldRanges?: Record<string, any>;
  metadataFieldTypes?: Record<string, string>;
  metadataFilters?: MetadataFieldFilter[];
}

export interface MetadataFieldFilter {
  fieldName: string;
  fieldType: string;
  value?: any;
  fromValue?: any;
  toValue?: any;
  operator: string; // "equals", "contains", "startsWith", "endsWith", "range", "gt", "lt", "gte", "lte"
}

export interface SearchRequestDto {
  // Basic search parameters
  query?: string;
  page?: number;
  size?: number;

  // Search field toggles
  lookUpFolderName?: boolean;
  lookUpDocumentName?: boolean;
  lookUpMetadataKey?: boolean;
  lookUpMetadataValue?: boolean;
  lookUpCategoryName?: boolean;
  lookUpOcrContent?: boolean;
  lookUpDescription?: boolean;
  lookUpTags?: boolean;
  lookUpModel?: boolean;
  lookUpCreatedAt?: boolean;

  // Content type filters
  includeFolders?: boolean;
  includeDocuments?: boolean;

  // Model-based metadata filtering
  modelMetadataFilter?: ModelMetadataFilterDto;
  
  // Legacy ID-based filtering (kept for backward compatibility)
  modelId?: number;
  modelIds?: number[];
  metadataId?: number;
  metadataIds?: number[];
  categoryId?: number;
  categoryIds?: number[];

  // Metadata search parameters
  metadataKey?: string;
  metadataValue?: string;
  metadataKeyValue?: string;
  metadataCategory?: string;
  metadataType?: string;
  
  // Range search for metadata
  metadataRangeField?: string;
  metadataRangeFrom?: any;
  metadataRangeTo?: any;
  metadataRangeInclusive?: boolean;
  
  // Creation date range search
  createdAtFrom?: string;
  createdAtTo?: string;
  createdAtInclusive?: boolean;
  
  // Model/Type filtering
  modelType?: string;
  modelTypes?: string[];
  mimeType?: string;
  mimeTypes?: string[];

  // Sorting
  sortBy?: string; // "score", "name", "createdAt", "updatedAt"
  sortDesc?: boolean;
}

// ==================== ADVANCED SEARCH TYPES ====================

export enum FilterOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  RANGE = 'RANGE',
  GT = 'GT',
  LT = 'LT',
  GTE = 'GTE',
  LTE = 'LTE',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL'
}

export enum FilterLogic {
  AND = 'AND',
  OR = 'OR'
}

export enum SortOption {
  RELEVANCE = 'RELEVANCE',
  NAME = 'NAME',
  CREATED_DATE = 'CREATED_DATE',
  UPDATED_DATE = 'UPDATED_DATE',
  SIZE = 'SIZE',
  TYPE = 'TYPE'
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC'
}

export interface MetadataFilter {
  metadataDefinitionId?: number;
  fieldName: string;
  fieldType: string;
  operator: FilterOperator;
  value?: string;
  fromValue?: any;
  toValue?: any;
  values?: string[];
  caseInsensitive?: boolean;
  inclusive?: boolean;
}

export interface CategoryMetadataSearchDto {
  categoryId?: number;
  categoryName?: string;
  metadataFilters?: MetadataFilter[];
}

export interface SearchScope {
  searchInName?: boolean;
  searchInDescription?: boolean;
  searchInMetadata?: boolean;
  searchInOcrText?: boolean;
  searchInTags?: boolean;
  searchInPath?: boolean;
}

export interface DateRangeFilter {
  from?: string;
  to?: string;
  inclusive?: boolean;
}

export interface AdvancedSearchRequestDto {
  // Basic search
  query?: string;
  searchScope?: SearchScope;
  page?: number;
  size?: number;
  
  // Category-based filtering
  categoryFilter?: CategoryMetadataSearchDto;
  categoryFilters?: CategoryMetadataSearchDto[];
  categoryFilterLogic?: FilterLogic;
  
  // Content type filters
  includeFolders?: boolean;
  includeDocuments?: boolean;
  
  // Document type filters
  mimeTypes?: string[];
  fileExtensions?: string[];
  
  // Date filters
  createdAt?: DateRangeFilter;
  updatedAt?: DateRangeFilter;
  
  // Folder filters
  folderIds?: number[];
  includeSubfolders?: boolean;
  
  // Tag filters
  tags?: string[];
  tagFilterLogic?: FilterLogic;
  
  // Advanced options
  searchInOcrContent?: boolean;
  searchInAllVersions?: boolean;
  sortBy?: SortOption;
  sortDirection?: SortDirection;
}

export interface AdvancedSearchResponseDto {
  documents: any[];
  folders: any[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  metadata: {
    query?: string;
    searchTimeMs: number;
    hasMore: boolean;
    appliedFilters?: string;
  };
}

export interface Filters {
  lookUpFolderName: boolean;
  lookUpDocumentName: boolean;
  lookUpMetadataKey: boolean;
  lookUpMetadataValue: boolean;
  lookUpCategoryName: boolean;
  lookUpOcrContent: boolean;
  lookUpDescription: boolean;
  includeFolders: boolean;
  includeDocuments: boolean;
  sortBy: ElasticSortFields;
  sortDesc: boolean;
}

export interface SearchResult {
  type: SearchResultType;
  score: number;
  objectId: number;
  highlight: Record<string, string>;
}

// Error types
export interface ErrorDto {
  status: number;
  message: string;
}

// Moving types
export enum MovingType {
  FOLDER = 'FOLDER',
  DOCUMENT = 'DOCUMENT'
}

export interface AllowedFoldersToMove {
  id: number;
  name: string;
  path: string;
  description?: string;
  isPublic: boolean;
  size: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== AUDIT LOG TYPES ====================

export interface AuditLog {
  id: number;
  userId: string;
  userEmail: string;
  username: string;
  entityType: string;
  entityId: string;
  action: string;
  timestamp: string;
  details: string; // JSON string
}

export interface AuditLogStatistics {
  [key: string]: number;
}

// ==================== COMMENT TYPES ====================

export interface Comment {
  id: number;
  userId: string;
  username: string;
  entityType: string;
  entityId: number;
  isEdited: boolean;
  text: string;
  hasReply:boolean;
  parentCommentId?: number;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface CommentCreateReq {
  entityType: string;
  entityId: number;
  text: string;
  parentCommentId?: number;
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
  userId: string;
  username: string;
  documentId: number;
  documentName: string;
  createdAt: string;
}

export interface FolderFavorite {
  id: number;
  userId: string;
  username: string;
  folderId: number;
  folderName: string;
  createdAt: string;
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
  deletedBy: string;
  deletedByUsername: string;
  deletedAt: string;
  originalData: string; // JSON string of original entity data
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


// Document search types
export interface DocumentSearchItem {
  id: number;
  title: string;
  name: string;
  description: string;
  type: string;
  ownerName: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
}

export interface DocumentSearchResponse {
  documents: DocumentSearchItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}


// ==================== DOCUMENT VERSION TYPES ====================

export interface DocumentVersionResponse {
  id: number;
  documentId: number;
  versionNumber: number;
  minioKey: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

// ==================== RULE EXECUTION TYPES ====================

export interface RuleExecutionRequest {
  ruleId: number;
  documentId?: number; // Optional: execute rule for specific document
  forceRevalidation?: boolean;
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
  lastExecutedAt?: string;
  linksCreated: number;
  successRate: number;
  averageExecutionTime: number;
}

export interface BulkRuleExecutionRequest {
  ruleIds: number[];
  documentId?: number;
  forceRevalidation?: boolean;
}

export interface BulkRuleExecutionResponse {
  totalRules: number;
  successfulRules: number;
  failedRules: number;
  totalLinksCreated: number;
  executionTime: number;
  results: RuleExecutionResponse[];
}

export interface LinkRuleCacheStatistics {
  totalCachedLinks: number;
  activeRules: number;
  lastRevalidation: string;
  cacheHitRate: number;
}

// ==================== ENHANCED LINK RULE TYPES ====================

export interface LinkRuleStatistics {
  totalRules: number;
  activeRules: number;
  inactiveRules: number;
  totalLinks: number;
  rulesByType: Record<string, number>;
}

export interface BulkToggleRequest {
  ruleIds: number[];
  enabled: boolean;
}

export interface BulkToggleResponse {
  success: number[];
  failed: number[];
  message: string;
}

export interface LinkRuleTestResult {
  sourceDocumentId: number;
  targetDocumentId: number;
  matchScore: number;
  matchedConditions: string[];
}

export interface LinkRuleTestResponse {
  ruleId: number;
  testResults: LinkRuleTestResult[];
  summary: {
    totalMatches: number;
    averageScore: number;
    executionTime: number;
  };
}

// ==================== DOCUMENT LINK ENHANCED TYPES ====================

export interface DocumentLinkSearchParams {
  page?: number;
  size?: number;
  linkType?: string;
  isManual?: boolean;
  search?: string;
  fromDate?: string;
  toDate?: string;
  mimeType?: string;
}

export interface RelatedDocumentSearchParams extends DocumentLinkSearchParams {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface BulkDeleteRequest {
  linkIds: number[];
}

export interface BulkDeleteResponse {
  success: number[];
  failed: number[];
  message: string;
}

// ==================== ASYNC OPERATION TYPES ====================

export interface AsyncOperationResponse {
  message: string;
  status: string;
  operationId?: string;
  estimatedCompletionTime?: number;
}

export interface LinkRuleApplicationResponse extends AsyncOperationResponse {
  ruleId: number;
  documentsProcessed?: number;
  linksCreated?: number;
}

export interface DocumentRuleApplicationResponse extends AsyncOperationResponse {
  documentId: number;
  rulesApplied?: number;
  linksCreated?: number;
}

export interface ReapplyAllRulesResponse extends AsyncOperationResponse {
  totalRules?: number;
  totalDocuments?: number;
  totalLinksCreated?: number;
}

// ==================== CACHE MANAGEMENT TYPES ====================

export interface CacheClearResponse {
  message: string;
  clearedAt: string;
  itemsCleared?: number;
}

export interface CacheStatistics {
  totalItems: number;
  hitRate: number;
  missRate: number;
  averageAccessTime: number;
  lastAccess: string;
  memoryUsage: number;
}
