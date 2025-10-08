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
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  LIST = 'LIST'
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

// ==================== LINK RULE TYPES ====================

export interface ManualLinkRequest {
  sourceDocumentId: number;
  targetDocumentId: number;
  linkType: string; // e.g., "RELATED", "SUPERSEDES", "REFERENCES", "CONTAINS"
  description?: string;
}

export interface ManualLinkResponse {
  id: number;
  sourceDocumentId: number;
  targetDocumentId: number;
  linkType: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RelatedDocumentResponse {
  documentId: number;
  documentName: string;
  documentTitle: string;
  linkType: string;
  score: number; // Relevance score (1.0 for manual links)
  isManual: boolean; // true for manual links, false for automatic
  ruleName?: string; // Only for automatic links
  linkedAt: string;
}

export interface LinkRuleCacheStatistics {
  totalCachedLinks: number;
  activeRules: number;
  lastRevalidation: string;
  cacheHitRate: number;
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
