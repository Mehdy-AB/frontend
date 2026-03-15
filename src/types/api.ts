// Updated API types to match backend DTOs exactly
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

export interface BatchOperationResult {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    itemId: number;
    errorMessage: string;
  }>;
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
  SCORE: 'score',
  NAME: 'name',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt'
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

// Relation Type enum (matches backend)
export const RelationType = {
  REFERENCE: 'REFERENCE',
  ATTACHMENT: 'ATTACHMENT',
  PARENT_DOCUMENT: 'PARENT_DOCUMENT',
  CHILD_DOCUMENT: 'CHILD_DOCUMENT',
  VERSION: 'VERSION',
  ALTERNATIVE_VERSION: 'ALTERNATIVE_VERSION',
  SIMILAR_DOCUMENT: 'SIMILAR_DOCUMENT',
} as const;

export type RelationType = typeof RelationType[keyof typeof RelationType];

// Condition Logic enum (matches backend)
export const ConditionLogic = {
  AND: 'AND',
  OR: 'OR'
} as const;

export type ConditionLogic = typeof ConditionLogic[keyof typeof ConditionLogic];

// Condition Operator enum (matches backend)
export const ConditionOperator = {
  EQUAL: 'EQUAL',
  NOT_EQUAL: 'NOT_EQUAL',
  GREATER_THAN: 'GREATER_THAN',
  LESS_THAN: 'LESS_THAN',
  GREATER_OR_EQUAL: 'GREATER_OR_EQUAL',
  LESS_OR_EQUAL: 'LESS_OR_EQUAL',
  CONTAINS: 'CONTAINS',
  NOT_CONTAINS: 'NOT_CONTAINS',
  STARTS_WITH: 'STARTS_WITH',
  ENDS_WITH: 'ENDS_WITH',
  IS_NULL: 'IS_NULL',
  IS_NOT_NULL: 'IS_NOT_NULL'
} as const;

export type ConditionOperator = typeof ConditionOperator[keyof typeof ConditionOperator];

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
  imageUrl?: string; // Alias for imgUrl
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  attributes?: Record<string, any>;
  roles: string[];
  groups: GroupDto[];
  // Governed HR attributes
  employeeNumber?: string;
  costCenterId?: string;
  costCenterName?: string;
  hireDate?: string;
  terminationDate?: string;
  jobFamilyId?: string;
  jobFamilyName?: string;
  employmentTypeId?: string;
  employmentTypeName?: string;
  clearanceLevelId?: string;
  clearanceLevelName?: string;
  currentManagerUserId?: string;
  currentManagerDisplayName?: string;
}

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface CreateUserRequest {
  username: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  imageUrl?: string;
  // Governed HR attributes (optional at creation)
  employeeNumber?: string;
  costCenterId?: string;
  hireDate?: string;
  jobFamilyId?: string;
  employmentTypeId?: string;
  clearanceLevelId?: string;
  managerId?: string;
}

export interface UpdateUserRequest {
  username: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  imageUrl?: string;
  // Governed HR attributes
  employeeNumber?: string;
  costCenterId?: string | null;
  hireDate?: string;
  jobFamilyId?: string;
  employmentTypeId?: string;
  clearanceLevelId?: string;
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
  userCount?: number; // Optional as it may not be present in all responses
  users?: string[]; // Array of usernames included in permission responses
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
  metadataDefinitions?: CategoryMetadataDefinitionDto[];
}

export interface DocumentWorkflowInstanceDto {
  instanceId: number;
  workflowId: number;
  workflowName: string;
  workflowStatus: string; // ACTIVE, COMPLETED, CANCELLED, FAILED, etc.
  currentStepId?: number;
  currentStepName?: string;
  currentStepOrder?: number;
  currentStepStatus?: string; // ACTIVE, PENDING, COMPLETED, etc.
  currentNodeType?: string;   // APPROVAL, REVIEW, MANUAL_TASK, FORM_REQUEST, etc.
  totalNodes?: number;
  completedNodes?: number;
  progressPercentage?: number;
  workflowStartedAt?: string;
  workflowCompletedAt?: string;
  currentStepDueDate?: string;
  assignedUsers: UserDto[];
  currentStepInstanceId?: number;
}

export interface ComposedChildDto {
  documentId: number;
  name: string;
  mimeType?: string;
  relationType?: string;
}

export interface DocumentResponseDto {
  documentId: number;
  versionId: number;
  createdBy: UserDto;
  ownedBy: UserDto;
  name: string;
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
  metadata: string[]; // Keep for backward compatibility
  filingCategory?: DocumentFilingCategoryResponseDto;
  userPermissions: DocumentPermissionResDto;
  workflowInstance?: DocumentWorkflowInstanceDto;
  stamp?: StampResponse; // Stamp applied to the active version
  composedChildren?: DocumentResponseDto[]; // Child documents linked via INHERIT/CASCADE
  relationType?: string; // Only set for composed children (e.g. CHILD_DOCUMENT, ATTACHMENT)
}

// Bulk upload response types
export interface BulkUploadResult {
  fileName: string;
  documentId?: number;
  versionId?: number;
  success: boolean;
  error?: string;
}

export interface BulkUploadResponse {
  totalFiles: number;
  successCount: number;
  failedCount: number;
  results: BulkUploadResult[];
  message: string;
}

export interface DocumentVersionResponseDto {
  id: number;
  documentId: number;
  versionNumber: number;
  minioKey: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  stamp?: StampResponse; // Stamp applied to this version
}

export interface DocumentUploadRequestDto {
  file: File;
  folderId: number;
  createdBy: string;
  lang: ExtractorLanguage;
  fileName?: string;
  tagsJson?: string;
}

export interface DocumentVersionUploadRequestDto {
  file: File;
  documentId: number;
  lang: ExtractorLanguage;
  createdBy: string;
}

export interface DocumentPermissionResDto {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
}

export interface DocumentPermissionReq {
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

export interface UpdateDocumentDescriptionRequestDto {
  description: string;
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
  type?: string;
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

export enum RuleStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface LinkRuleRequestDto {
  name: string;
  description?: string;
  relationType: RelationType;
  conditionsLogic: ConditionLogic; // 'AND' | 'OR'
  conditions: LinkRuleConditionRequestDto[];
  enabled?: boolean;
  bidirectional?: boolean;
  priority?: number;
  executionOrder?: number;
  scope?: string;
  cronExpression?: string;

  // Governance
  status?: RuleStatus | string;
  ownerId?: string;
}

export interface LinkRuleConditionRequestDto {
  sourceMetadataId: number;
  targetMetadataId: number;
  operator: ConditionOperator;
  caseSensitive?: boolean;
}

export interface LinkRuleResponseDto {
  id: number;
  name: string;
  description?: string;
  relationType: string;
  conditions: LinkRuleConditionResponseDto[];
  enabled: boolean;
  bidirectional: boolean;
  priority: number;
  executionOrder: number;
  scope: string;
  cronExpression?: string;

  // Governance
  status: RuleStatus | string;
  owner?: UserDto;
  approvedBy?: UserDto;
  approvedAt?: string;

  lastScheduledExecutionAt?: string;
  createdBy: UserDto;
  createdAt: string;
  updatedAt: string;
  activeLinksCount?: number;
  lastExecutionDurationMs?: number;
  lastExecutionStatus?: string;
  lastExecutedAt?: string;
  sourceCategory?: RuleCategoryDto;
  targetCategory?: RuleCategoryDto;
}

export interface LinkRuleConditionResponseDto {
  id: number;
  sourceMetadata: MetadataInfoDto;
  targetMetadata: MetadataInfoDto;
  operator: ConditionOperator;
  caseSensitive: boolean;
}

export interface LinkRuleAuditLogDto {
  id: number;
  ruleId: number;
  action: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  changedBy?: UserDto;
  changedAt: string;
}

export interface LinkRuleTrendDto {
  date: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  linksCreated: number;
  errors: number;
}

export interface MetadataInfoDto {
  categoryId: number;
  categoryName: string;
  metadataId: number;
  metadataName: string;
  metadataType: MetadataType;
}

export interface RuleCategoryDto {
  id: number;
  name: string;
  description?: string;
  metadataDefinitions: RuleMetadataDefinitionDto[];
}

export interface RuleMetadataDefinitionDto {
  id: number;
  key: string;
  dataType: MetadataType;
  mandatory: boolean;
  listId?: number;
  list?: RuleListDto;
}

export interface RuleListDto {
  id: number;
  name: string;
  description?: string;
  mandatory: boolean;
  option: string[];
}

export interface DocumentLinkRequestDto {
  sourceDocumentId: number;
  targetDocumentId: number;
  relationType: RelationType;
  description?: string;
}

export interface DocumentLinkResponseDto {
  id: number;
  sourceDocumentId: number;
  sourceDocumentName: string;
  sourceDocumentTitle: string;
  targetDocumentId: number;
  targetDocumentName: string;
  targetDocumentTitle: string;
  relationType: string;
  description?: string;
  isManual: boolean;
  ruleId?: number;
  ruleName?: string;
  createdBy: string; // String, not UserDto
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
  activeVersion?: number;
  documentCreatedAt: string;
  isPublic: boolean;
  ownedBy: RelatedDocumentUserDto;
  relationType: string;
  strength?: string;
  permissionMode?: string;
  movementMode?: string;
  workflowMode?: string;
  removable?: boolean;
  systemGenerated?: boolean;
  description?: string;
  manual: boolean;
  ruleName?: string;
  ruleId?: number;
  linkedAt: string;
  metadata: RelatedDocumentMetadataDto[];
  filingCategory?: RelatedDocumentFilingCategoryDto;
  filingCategoryName?: string;
  linkId: number;
  userPermissions: RelatedDocumentUserPermissionsDto;
}

export interface RelatedDocumentMetadataDto {
  metadataId: number;
  metadataName: string;
  value: string;
  categoryName: string;
  categoryId: number;
}

export interface RelatedDocumentUserDto {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string[];
  imageUrl?: string;
  email?: string;
  createdTimestamp: string;
}

export interface RelatedDocumentFilingCategoryDto {
  id: number;
  name: string;
  description?: string;
  metadata: RelatedDocumentMetadataDto[];
  metadataDefinitions?: RelatedDocumentMetadataDefinitionDto[];
}

export interface RelatedDocumentMetadataDefinitionDto {
  id: number;
  key: string;
  dataType: MetadataType;
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

// ==================== FOLDER TYPES ====================

export interface FolderResDto {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  createdBy: UserDto;
  ownedBy: UserDto;
  public: boolean;
  size: number;
  createdAt: string;
  updatedAt: string;
  path: string;
  userPermissions: FolderPermissionResDto;
}

export interface FolderWithOwnerDto extends FolderResDto {
  ownedBy: UserDto;
}

export interface FolderPermissionResDto {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManagePermissions: boolean;
  canCreateSubFolders: boolean;
  canUpload: boolean;
  canEditDoc: boolean;
  canDeleteDoc: boolean;
  canShareDoc: boolean;
  canManagePermissionsDoc: boolean;
  inherits: boolean;
}

export interface CreateFolderDto {
  name: string;
  description?: string;
  parentId?: number;
  ownerId?: string; // Optional: Owner user ID for creating folders in another user's repository (admin only)
  sharedWith?: TypeShareAccessWithTypeReq[];
  subfolders?: SubfolderDto[];
}

export interface SubfolderDto {
  name: string;
  description?: string;
  subfolders?: SubfolderDto[];
}

export interface FolderPermissionReq {
  // Folder permissions
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
  canCreateSubFolders: boolean;
  // Document permissions (apply to all documents in folder)
  canUpload: boolean;
  canEditDoc: boolean;
  canDeleteDoc: boolean;
  canManagePermissionsDoc: boolean;
  inherits: boolean;
}

export interface PageableDto {
  pageNumber: number;
  pageSize: number;
}

export interface FolderRepoResDto {
  folder?: FolderResDto;
  folders: FolderResDto[];
  documents: DocumentResponseDto[];
  pageable: PageableDto;
  totalElements: number;
  totalPages: number;
}

// ==================== FILING CATEGORIES TYPES ====================

export interface FilingCategoryRequestDto {
  name: string;
  description?: string;
  metadataDefinitions?: CategoryMetadataDefinitionDto[];
  // Auto-classification config
  autoClassificationEnabled?: boolean;
  targetFolderId?: number;
  classificationRules?: string[];
  // Name structure pattern for filename generation
  nameStructure?: string;
}

export interface FilingCategoryResponseDto {
  id: number;
  name: string;
  description?: string;
  createdBy?: UserDto | null;
  metadataDefinitions?: CategoryMetadataDefinitionDto[];
  // Auto-classification fields
  autoClassificationEnabled?: boolean;
  autoClassificationTarget?: AutoClassificationTargetDto;
  classificationRules?: string[];
  // Name structure pattern for filename generation
  nameStructure?: string;
}

export interface AutoClassificationTargetDto {
  folderId: number;
  folderName: string;
  folderPath: string;
  hasUploadPermission: boolean;
}

export interface MetaDataListReq {
  name: string;
  description?: string;
  metadataFields?: MetadataFieldDto[];
  option?: string[];
  mandatory?: boolean;
}

export interface MetaDataListRes {
  id: number;
  name: string;
  description?: string;
  metadataFields: MetadataFieldDto[];
  createdAt: string;
  updatedAt: string;
  option?: string[];
  mandatory?: boolean;
}

export interface MetadataFieldDto {
  id?: number;
  name: string;
  type: MetadataType;
  required: boolean;
  options?: string[];
}

export interface CategoryMetadataDefinitionDto {
  id?: number;
  key: string;
  dataType: MetadataType;
  mandatory: boolean;
  listId?: number;
  list?: MetaDataListReq;
}

// ==================== SEARCH TYPES ====================

export interface UnifiedSearchRequestDto {
  query?: string;
  page?: number;
  size?: number;
  includeFolders?: boolean;
  includeDocuments?: boolean;
  ownerId?: string;
  createdAt?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  categoryId?: number;
  lookUpNames?: boolean;
  lookUpMetadataValue?: boolean;
  lookUpOcrContent?: boolean;
  lookUpDescription?: boolean;
  lookUpTags?: boolean;
  sortBy?: SortFields;
  sortDesc?: boolean;
  metadataOperations?: MetadataOperationDto;
}

export interface MetadataOperationDto {
  operationType: MetadataOperationType;
  conditions: MetadataCondition[];
}

export const MetadataOperationType = {
  AND: 'AND',
  OR: 'OR'
} as const;

export type MetadataOperationType = typeof MetadataOperationType[keyof typeof MetadataOperationType];

export interface MetadataCondition {
  metadataDefinitionId: number;
  operator: MetadataFilterOperator;
  value?: string;
  fromValue?: any;
  toValue?: any;
  values?: string[];
}

export const MetadataFilterOperator = {
  EQUALS: 'EQUALS',
  NOT_EQUALS: 'NOT_EQUALS',
  CONTAINS: 'CONTAINS',
  STARTS_WITH: 'STARTS_WITH',
  ENDS_WITH: 'ENDS_WITH',
  RANGE: 'RANGE',
  GT: 'GT',
  LT: 'LT',
  GTE: 'GTE',
  LTE: 'LTE',
  IN: 'IN',
  NOT_IN: 'NOT_IN',
  IS_NULL: 'IS_NULL',
  IS_NOT_NULL: 'IS_NOT_NULL'
} as const;

export type MetadataFilterOperator = typeof MetadataFilterOperator[keyof typeof MetadataFilterOperator];

export interface GlobalSearchResultDto {
  documents: SearchDocumentsRes[];
  folders: SearchFoldersRes[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  page?: Pageable;
}

export interface SearchDocumentsRes {
  document: DocumentResponseDto;
  score: number;
  highlight: Record<string, string>;
  documentId: number;
  versionId: number;
  name: string;
  description?: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
  versionNumber: number;
  activeVersion?: number;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  userPermissions: any;
  versions?: DocumentVersionInfo[];
}

export interface SearchFoldersRes {
  folder: FolderResDto;
  score: number;
  highlight: Record<string, string>;
}

export interface DocumentVersionInfo {
  versionId: number;
  versionNumber: number;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdvancedSearchRequestDto {
  query?: string;
  ownerId?: string;
  createdAt?: {
    from?: string;
    to?: string;
  };
  metadataOperations?: MetadataOperationDto;
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
  metadataOperations?: MetadataOperationDto;
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

export interface MetadataFilter {
  id: string;
  metadataId: number;
  metadataName: string;
  fieldName?: string;
  operator: FilterOperator;
  value: string;
  values?: string[];
  fromValue?: string;
  toValue?: string;
  categoryId?: string;
  categoryName?: string;
  metadataDefinitionId?: number;
  fieldType?: string;
}

export const FilterOperator = {
  EQUAL: 'EQUAL',
  EQUALS: 'EQUALS',
  NOT_EQUAL: 'NOT_EQUAL',
  NOT_EQUALS: 'NOT_EQUALS',
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
  NOT_IN: 'NOT_IN',
  RANGE: 'RANGE',
  IS_NULL: 'IS_NULL',
  IS_NOT_NULL: 'IS_NOT_NULL'
} as const;

export type FilterOperator = typeof FilterOperator[keyof typeof FilterOperator];

export const SearchScope = {
  DOCUMENTS: 'DOCUMENTS',
  FOLDERS: 'FOLDERS',
  BOTH: 'BOTH'
} as const;

export type SearchScope = typeof SearchScope[keyof typeof SearchScope];

export interface MetadataFieldDefinitionDto {
  id: number;
  name: string;
  type: MetadataType;
  required: boolean;
  options?: string[];
  categoryId: number;
}

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
      searchInName?: boolean;
      searchInDescription?: boolean;
      searchInMetadata?: boolean;
      searchInOcrText?: boolean;
      searchInTags?: boolean;
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

export interface DocumentSearchResultDto {
  id: number;
  title: string;
  name: string;
  description?: string;
  type: string;
  ownerName: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
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

// ==================== COMMENT TYPES ====================

export interface Comment {
  id: number;
  entityType: string;
  entityId: number;
  text: string;
  user: UserDto;
  createdBy?: UserDto;
  createdAt: string;
  parentId?: number;
  parentCommentId?: number;
  replies?: Comment[];
  isEdited?: boolean;
  hasReply?: boolean;
  username?: string;
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

// ==================== UNCLASSIFIED DOCUMENT TYPES ====================

export interface UnclassifiedDocumentUploadRequestDto {
  folderId: number;
  createdBy: string;
  title: string;
  fileName: string;
  categoryId: number;
}

export interface UnclassifiedDocumentResponseDto {
  id: number;
  name: string;
  fileName: string;
  folderId: number;
  folderPath?: string;
  createdBy: UserDto;
  ownedBy: UserDto;
  createdAt: string;
  updatedAt: string;
  categoryId: number;
  categoryName: string;
  sizeBytes: number;
  mimeType: string;
}

export interface UnclassifiedDocumentDetailResponseDto extends UnclassifiedDocumentResponseDto {
  description?: string;
  metadata?: DocumentMetadataResponseDto[];
  filingCategory?: DocumentFilingCategoryResponseDto;
}

export interface UnclassifiedDocumentSearchRequestDto {
  query?: string;
  userId?: string;
  categoryId?: number;
  name?: string;
  dateFrom?: string;
  dateTo?: string;
  exactDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface UnclassifiedDocumentStatisticsResponseDto {
  totalDocuments: number;
  documentsByCategory: Record<string, number>;
  documentsByUser: Record<string, number>;
  documentsByMonth: Record<string, number>;
}

export interface ClassifyUnclassifiedDocumentRequestDto {
  lang: ExtractorLanguage;
  filingCategory?: FilingCategoryDocDto;
  tags?: string;
}

// ==================== BULK UPLOAD TYPES ====================

export interface BulkUploadRequestDto {
  files: FileDataDto[];
  folderId: number;
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
  ruleDescription?: string;
  enabled?: boolean;
  relationType?: string;
  totalExecutions: number;
  totalLinksCreated?: number;
  linksCreated?: number;
  averageExecutionTime: number;
  lastExecutedAt?: string;
  successRate: number;
  conditionsCount?: number;
  bidirectional?: boolean;
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
  totalLinks: number;
  automaticLinks: number;
  manualLinks: number;
  totalRules: number;
  enabledRules: number;
  disabledRules: number;
  averageLinksPerRule: number;
  linksByType: {
    RELATED: number;
    SUPERSEDES: number;
    REFERENCES: number;
    CONTAINS: number;
  };
}

export interface LinkRuleExecutionLogDto {
  id: number;
  ruleId: number | null;
  ruleName: string | null;
  relationType: string | null;
  startedAt: string;
  completedAt: string | null;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  totalDocumentsProcessed: number;
  linksCreated: number;
  linksSkippedExisting: number;
  linksSkippedParent: number;
  linksSkippedSelf: number;
  errors: number;
  errorDetails: string | null;
  skippedDetails: string | null;
  durationMs: number | null;
  executedById: string | null;
  executedByName: string | null;
  triggerSource: string | null;
  sourceDocumentId: number | null;
  sourceDocumentName: string | null;
  errorStackTrace: string | null;
}

export interface LinkRuleAggregatedStats {
  ruleId: number;
  totalExecutions: number;
  totalLinksCreated: number;
  activeLinks: number;
  avgDurationMs: number;
  lastExecutedAt?: string;
  lastStatus?: 'RUNNING' | 'COMPLETED' | 'FAILED';
  lastLinksCreated?: number;
  lastSkippedParent?: number;
  lastSkippedExisting?: number;
  lastErrors?: number;
  lastDurationMs?: number;
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

// ==================== CLASS A TYPES ====================

export interface ClassAUploadRequestDto {
  file?: File;
  folderId: number;
  lang: ExtractorLanguage;
  fileName?: string;
  tagsIds?: number[];
  filingCategory?: FilingCategoryDocDto;
  description?: string;
}

export interface ClassAResponseDto {
  id: number;
  name: string;
  description?: string;
  folderId: number;
  sizeBytes: number;
  mimeType: string;
  createdBy: UserDto;
  createdAt: string;
  categoryId: number;
  categoryName: string;
}

export interface ClassADetailResponseDto extends ClassAResponseDto {
  metadataDefinitions?: any[];
}

export interface ClassASearchRequestDto {
  query?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ClassAStatisticsResponseDto {
  totalDocuments: number;
  documentsByCategory: Record<string, number>;
  documentsByUser: Record<string, number>;
  documentsByMonth: Record<string, number>;
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
  permission: FolderPermissionReq | DocumentPermissionReq;
  type: GranteeType;
}

export interface TypeShareAccessRes {
  grantee: UserDto | GroupDto | RoleDto;
  type: GranteeType;
  permission: FolderPermissionReq;
}

// ==================== UPDATE DOCUMENT TYPES ====================

// Already defined above: UpdateDocumentDescriptionRequestDto

// ==================== WORKFLOW TYPES ====================

export interface WorkflowResponse {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy?: UserDto;
  createdAt: string;
  updatedAt: string;
  stepCount: number;
  activeInstancesCount: number;
  admins?: WorkflowAdminResponse[];
}

export interface WorkflowDetailResponse extends WorkflowResponse {
  steps: WorkflowStepResponse[];
  workflowDefinitionJson?: string;
}

export interface WorkflowStepResponse {
  id: number;
  name: string;
  description?: string;
  stepOrder: number;
  expirationDays?: number;
  onCompleteAction?: string;
  targetFolderId?: number;
  targetFolderName?: string;
  isRequired: boolean;
  allowParallelApproval: boolean;
  minApprovalsNeeded?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  assignments: StepAssignmentResponse[];
}

export interface StepAssignmentResponse {
  id: number;
  assigneeType: 'USER' | 'ROLE' | 'GROUP';
  user?: UserDto;
  role?: RoleDto;
  group?: GroupDto;
  canEdit: boolean;
}

export interface WorkflowInstanceAssignmentResponse {
  id: number;
  stepInstanceId: number;
  assigneeType: 'USER' | 'ROLE' | 'GROUP' | 'ORG_UNIT' | 'ORG_UNIT_HEAD' | 'CREATOR_RESPONSIBLE';
  user?: UserDto;
  role?: RoleDto;
  group?: GroupDto;
  orgUnitId?: string;
  orgUnitName?: string;
  canEdit: boolean;
  assignedBy?: UserDto;
  assignedAt: string;
}

export interface WorkflowInstanceResponse {
  id: number;
  workflow: WorkflowResponse;
  document: DocumentResponseDto;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'EXPIRED';
  startedBy?: UserDto;
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: UserDto;
  cancellationReason?: string;
  currentNodeId?: string;
  currentNodeLabel?: string;
  currentNodeType?: string;
  createdAt?: string;
  notes?: string;
  updatedAt: string;
  nodeInstances: WorkflowNodeInstanceResponse[];
  completedNodesCount: number;
  totalNodesCount: number;
}

export interface WorkflowNodeInstanceResponse {
  id: number;
  workflowInstanceId: number;
  nodeId: string;
  nodeType: string;
  nodeName: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'REJECTED' | 'EXPIRED' | 'SKIPPED' | 'CANCELLED' | 'SCHEDULED';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  completedBy?: UserDto;
  dueDate?: string;
  comment?: string;
  isOverdue: boolean;
  approvalsCount: number;
  resultEdge?: string;
  resultData?: Record<string, any>;
  documentId?: number;
  documentTitle?: string;
  workflowId?: number;
  workflowName?: string;
  assignments: WorkflowInstanceAssignmentResponse[];
}
// Keeping alias for backward compatibility during refactor if needed, or just remove
export type WorkflowStepInstanceResponse = WorkflowNodeInstanceResponse;

export interface WorkflowHistoryResponse {
  id: number;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  performedBy?: UserDto;
  performedAt: string;
  comment?: string;
  nodeId?: string;
}

export interface WorkflowAdminResponse {
  id: number;
  user: UserDto;
  createdAt: string;
}

// Request DTOs
// Request DTOs
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  steps: CreateWorkflowStepRequest[];
  isActive?: boolean;
  admins?: AddWorkflowAdminRequest[];
  trigger: AddWorkflowTriggerRequest;
  workflowDefinitionJson?: string;
}

export interface CreateWorkflowStepRequest {
  name: string;
  description?: string;
  stepOrder: number;
  expirationDays?: number;
  onCompleteAction?: 'NONE' | 'MOVE_TO_FOLDER' | 'NOTIFY_USERS' | 'COMPLETE_WORKFLOW';
  targetFolderId?: number;
  targetFolderName?: string;
  isRequired?: boolean;
  allowParallelApproval?: boolean;
  minApprovalsNeeded?: number;
  assignments: CreateStepAssignmentRequest[];
  nodeType?: string;
  nodeConfigJson?: string;
  positionX?: number;
  positionY?: number;
}

export interface CreateStepAssignmentRequest {
  assigneeType: 'USER' | 'ROLE' | 'GROUP' | 'ORG_UNIT' | 'ORG_UNIT_HEAD' | 'CREATOR_RESPONSIBLE';
  assigneeId?: string;
  canEdit?: boolean;
}

export interface UpdateWorkflowRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  steps?: CreateWorkflowStepRequest[];
  admins?: AddWorkflowAdminRequest[];
  trigger: AddWorkflowTriggerRequest;
  workflowDefinitionJson?: string;
}

export interface WorkflowTriggerResponse {
  id: number;
  workflowId: number;
  workflowName: string;
  triggerType: 'FOLDER' | 'MODEL';
  folderId?: number;
  folderName?: string;
  categoryId?: number;
  categoryName?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddWorkflowTriggerRequest {
  workflowId?: number; // Optional when used in CreateWorkflowRequest/UpdateWorkflowRequest, set by backend
  triggerType: 'FOLDER' | 'MODEL';
  folderId?: number;
  categoryId?: number;
}

export interface UpdateWorkflowTriggerRequest {
  isActive?: boolean;
}

export interface StartWorkflowInstanceRequest {
  workflowId: number;
  documentId: number;
  notes?: string;
}

export interface CompleteStepRequest {
  comment?: string;
  chosenOptionId?: number;
}

export interface RejectStepRequest {
  rejectionReason: string;
  comment?: string;
  formData?: Record<string, any>;
}

export interface AddWorkflowAdminRequest {
  userId: string;
}

// ==================== COMMON TYPES ====================

// Additional types can be added here if needed


// ==================== DIGITAL CERTIFICATES ====================

export interface CertificateResponse {
  id: number;
  name: string;
  description?: string;
  certificateType: 'ROOT_CA' | 'INTERMEDIATE_CA' | 'PERSONAL' | 'ORGANIZATION' | 'CODE_SIGNING' | 'DOCUMENT_SIGNING';
  issuer: string;
  subject: string;
  serialNumber: string;
  thumbprint: string;
  validFrom: string;
  validTo: string;
  keySize: number;
  algorithm: string;
  status: 'VALID' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED' | 'PENDING';
  isActive: boolean;
  isTrusted: boolean;
  usageCount: number;
  lastUsedAt?: string;
  owner?: UserDto;
  creator?: UserDto;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
  revocationReason?: string;
  isExpired: boolean;
  isValid: boolean;
}

export interface CreateCertificateRequest {
  name: string;
  description?: string;
  certificateType: string;
  issuer: string;
  subject: string;
  serialNumber: string;
  thumbprint: string;
  validFrom: string;
  validTo: string;
  keySize: number;
  algorithm: string;
  publicKey?: string;
  certificateData?: string;
  isTrusted?: boolean;
  ownerId?: string;
}

export interface UpdateCertificateRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  isTrusted?: boolean;
}

export interface RevokeCertificateRequest {
  reason: string;
}

// ==================== STAMPS ====================

export interface StampResponse {
  id: number;
  name: string;
  description?: string;
  stampType: 'TEXT' | 'IMAGE' | 'DYNAMIC' | 'QR_CODE';
  content?: string;
  editorElements?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  imagePath?: string;
  imageUrl?: string;
  position?: string;
  opacity?: number;
  rotation?: number;
  width?: number;
  height?: number;
  category?: string;
  language?: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: string;
  creator?: UserDto;
  createdAt: string;
  updatedAt: string;
  applications?: StampApplicationResponse[];
}

export interface StampApplicationResponse {
  id: number;
  documentId: number;
  documentName?: string;
  documentVersionId: number;
  versionNumber?: number;
  stampId: number;
  stampName?: string;
  stampType?: string;
  pageNumber?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  appliedBy?: string;
  appliedByName?: string;
  appliedAt: string;
  reason?: string;
  notes?: string;
}

export interface ApplyStampRequest {
  documentId: number;
  documentVersionId: number;
  stampId: number;
  pageNumber?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  reason?: string;
  notes?: string;
}

export interface CreateStampRequest {
  name: string;
  description?: string;
  stampType: string;
  content?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  editorElements?: string;
  imagePath?: string;
  imageUrl?: string;
  position?: string;
  opacity?: number;
  rotation?: number;
  width?: number;
  height?: number;
  category?: string;
  language?: string;
}

export interface UpdateStampRequest {
  name?: string;
  description?: string;
  content?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  editorElements?: string;
  imagePath?: string;
  imageUrl?: string;
  position?: string;
  opacity?: number;
  rotation?: number;
  width?: number;
  height?: number;
  category?: string;
  isActive?: boolean;
}

// ==================== SIGNATURES ====================

export interface SignatureResponse {
  id: number;
  documentId: number;
  documentVersionId?: number;
  stamp?: StampResponse;
  certificate?: CertificateResponse;
  signer?: UserDto;
  signerName?: string;
  signerEmail?: string;
  signatureType: 'DIGITAL_CERTIFICATE' | 'VISUAL_STAMP' | 'ELECTRONIC' | 'BIOMETRIC' | 'HANDWRITTEN';
  signatureHash?: string;
  reason?: string;
  location?: string;
  contactInfo?: string;
  pageNumber?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  status: 'VALID' | 'INVALID' | 'EXPIRED' | 'REVOKED' | 'PENDING_VERIFICATION';
  isVerified: boolean;
  verifiedAt?: string;
  signedAt: string;
  notes?: string;
}

export interface CreateSignatureRequest {
  documentId: number;
  documentVersionId?: number;
  stampId?: number;
  certificateId?: number;
  signatureType: string;
  signatureData?: string;
  reason?: string;
  location?: string;
  contactInfo?: string;
  pageNumber?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  notes?: string;
}

export interface VerifySignatureRequest {
  signatureData?: string;
  expectedHash?: string;
}

// ==================== FORMS ====================

export interface FormResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
  category?: string;

  // Configuration
  allowMultipleSubmissions: boolean;
  requireAuthentication: boolean;
  isPublic: boolean;
  showProgressBar: boolean;
  isMultiStep: boolean;

  // Notifications
  sendEmailNotification: boolean;
  notificationEmail?: string;
  sendConfirmationEmail: boolean;

  // Submission settings
  maxSubmissions?: number;
  submissionDeadline?: string;
  closeAfterMaxSubmissions: boolean;

  // Messages
  successMessage?: string;
  redirectUrl?: string;

  // Styling
  themeColor?: string;
  backgroundColor?: string;
  customCss?: string;

  // Document integration
  saveToFolderId?: number;
  saveToFolderName?: string;
  createDocumentOnSubmit: boolean;
  templateMinioKey?: string;
  templateFilename?: string;
  outputAsPdf?: boolean;

  // Model integration
  filingCategoryId?: number;
  filingCategoryName?: string;
  fieldMetadataMappings?: FieldMetadataMappingDto[];
  defaultCreatorUserId?: string;

  // Statistics
  viewCount: number;
  submissionCount: number;
  completionRate?: number;
  avgCompletionTimeSeconds?: number;

  // Fields
  fields: FormFieldResponse[];

  // Metadata
  creator?: UserDto;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  closedAt?: string;
}

export interface FormFieldResponse {
  id: number;
  label: string;
  fieldKey: string;
  fieldType: 'TEXT' | 'EMAIL' | 'NUMBER' | 'PHONE' | 'URL' | 'TEXTAREA' | 'RICH_TEXT' |
  'SELECT' | 'RADIO' | 'CHECKBOX' | 'MULTI_SELECT' | 'DATE' | 'TIME' | 'DATETIME' |
  'FILE_UPLOAD' | 'IMAGE_UPLOAD' | 'RATING' | 'SLIDER' | 'SIGNATURE' | 'LOCATION' |
  'TABLE' | 'SECTION_HEADER' | 'DIVIDER' | 'HTML_CONTENT';
  placeholder?: string;
  description?: string;
  defaultValue?: string;

  // Validation
  isRequired: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  validationMessage?: string;

  // Options and conditional logic
  options?: Record<string, any>;
  conditionalLogic?: Record<string, any>;

  // Layout
  orderIndex: number;
  stepNumber: number;
  width: string;

  // File settings
  allowedFileTypes?: string;
  maxFileSizeMb?: number;
  allowMultipleFiles: boolean;

  // Additional config
  config?: Record<string, any>;
}

export interface CreateFormRequest {
  name: string;
  slug: string;
  description?: string;
  category?: string;

  // Configuration
  allowMultipleSubmissions?: boolean;
  requireAuthentication?: boolean;
  isPublic?: boolean;
  showProgressBar?: boolean;
  isMultiStep?: boolean;

  // Notifications
  sendEmailNotification?: boolean;
  notificationEmail?: string;
  sendConfirmationEmail?: boolean;

  // Submission settings
  maxSubmissions?: number;
  submissionDeadline?: string;
  closeAfterMaxSubmissions?: boolean;

  // Messages
  successMessage?: string;
  redirectUrl?: string;

  // Styling
  themeColor?: string;
  backgroundColor?: string;
  customCss?: string;

  // Document integration
  saveToFolderId?: number;
  createDocumentOnSubmit?: boolean;
  autoApprove?: boolean;
  generateDocumentOnApprovalOnly?: boolean;
  templateMinioKey?: string;
  templateFilename?: string;
  outputAsPdf?: boolean;

  // Model integration
  filingCategoryId?: number;
  fieldMetadataMappings?: FieldMetadataMappingDto[];
  defaultCreatorUserId?: string;

  // Fields
  fields?: CreateFormFieldRequest[];
}

export interface FieldMetadataMappingDto {
  id?: number;
  fieldKey?: string;
  metadataDefinitionId: number;
  metadataKey?: string;
  isStatic?: boolean;
  staticFieldType?: string; // 'form_id', 'creation_date', 'submission_id'
}

export interface CreateFormFieldRequest {
  label: string;
  fieldKey: string;
  fieldType: string;
  placeholder?: string;
  description?: string;
  defaultValue?: string;

  // Validation
  isRequired?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  validationMessage?: string;

  // Options and conditional logic
  options?: string[];
  conditionalLogic?: Record<string, any>;

  // Layout
  orderIndex: number;
  stepNumber?: number;
  width?: string;

  // File settings
  allowedFileTypes?: string;
  maxFileSizeMb?: number;
  allowMultipleFiles?: boolean;

  // Additional config
  config?: Record<string, any>;
}

export type UpdateFormRequest = Partial<CreateFormRequest>;

export interface FormSubmissionResponse {
  id: number;
  formId: number;
  formName?: string;

  // Submitter
  submitter?: UserDto;
  submitterName?: string;
  submitterEmail?: string;
  submitterIp?: string;

  // Data
  submissionData: Record<string, any>;
  values: FormSubmissionValueResponse[];

  // Status
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  isRead: boolean;
  isStarred: boolean;

  // Timing
  submittedAt: string;
  completionTimeSeconds?: number;

  // Review
  reviewer?: UserDto;
  reviewedAt?: string;
  reviewNotes?: string;

  // Metadata
  metadata?: Record<string, any>;
}

export interface FormSubmissionValueResponse {
  id: number;
  fieldId: number;
  fieldKey: string;
  fieldLabel: string;
  value?: string;
  fileUrl?: string;
}

export interface SubmitFormRequest {
  submissionData: Record<string, any>;
  submitterName?: string;
  submitterEmail?: string;
  completionTimeSeconds?: number;
  metadata?: Record<string, any>;
}