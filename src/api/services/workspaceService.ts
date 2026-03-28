import { apiClient } from '../client';
import { PageResponse } from '../../types/api';

// =====================================================================
// WORKSPACE TYPES
// =====================================================================

export type WorkspaceType = 'STANDARD' | 'SECURED';
export type WorkspaceStatus = 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
export type WorkspaceRole = 'OWNER' | 'MANAGER' | 'CONTRIBUTOR' | 'READER' | 'AUDITOR';
export type PrincipalType = 'USER' | 'ROLE' | 'GROUP';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type OcrMode = 'OFF' | 'CONDITIONAL' | 'REQUIRED';
export type ArchiveHandling = 'BLOCK' | 'ALLOW' | 'QUARANTINE';

export interface WorkspaceDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: WorkspaceType;
  status: WorkspaceStatus;
  ownerOuId: string | null;
  createdById: string;
  rootFolderId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMemberDto {
  id: number;
  workspaceId: string;
  principalType: PrincipalType;
  principalId: string;
  workspaceRole: WorkspaceRole;
  assignedById: string | null;
  createdAt: string;
  isActive: boolean;
  removedAt: string | null;
  removedById: string | null;
  removalReason: string | null;
}

export interface WorkspacePolicyDto {
  id: number;
  workspaceId: string;
  // Ingestion
  maxFileSizeBytes: number | null;
  virusScanRequired: boolean;
  ocrMode: OcrMode;
  archiveHandling: ArchiveHandling;
  // Security
  downloadAllowed: boolean;
  printAllowed: boolean;
  exportAllowed: boolean;
  externalSharingAllowed: boolean;
  externalLinkAllowed: boolean;
  watermarkRequired: boolean;
  viewAuditRequired: boolean;
  breakGlassRequired: boolean;
  // Access control
  crossWorkspaceAclAllowed: boolean;
  directUserAclAllowed: boolean;
  inheritanceEnforced: boolean;
  // Classification
  classificationDefault: string | null;
  // Version
  versioningRequired: boolean;
  // Content governance (IDs)
  allowedFileTypes: { id: number; mimeType: string; label: string }[];
  allowedFilingCategories: { id: number; name: string }[];
  defaultFilingCategory: { id: number; name: string } | null;
  allowedWorkflows: { id: number; name: string }[];
  // Audit
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceRequestDto {
  id: number;
  name: string;
  code: string;
  description: string | null;
  type: WorkspaceType;
  ownerOuId: string | null;
  justification: string;
  status: RequestStatus;
  requestedById: string;
  requestedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    avatarUrl?: string;
  };
  reviewedById: string | null;
  reviewComment: string | null;
  reviewedAt: string | null;
  createdWorkspaceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceStatsDto {
  workspaceId: string;
  workspaceName: string;
  memberCount: number;
  folderCount: number;
  documentCount: number;
  status: WorkspaceStatus;
}

export interface IngestionValidationResult {
  fileTypeAllowed: boolean;
  fileSizeAllowed: boolean;
  filingCategoryAllowed?: boolean;
}

// =====================================================================
// REQUEST DTOs
// =====================================================================

export interface CreateWorkspaceRequest {
  name: string;
  code: string;
  description?: string;
  type?: WorkspaceType;
  ownerOuId?: string;
  // Policy fields (optional — null = use defaults)
  downloadAllowed?: boolean;
  printAllowed?: boolean;
  exportAllowed?: boolean;
  externalSharingAllowed?: boolean;
  externalLinkAllowed?: boolean;
  watermarkRequired?: boolean;
  viewAuditRequired?: boolean;
  breakGlassRequired?: boolean;
  maxFileSizeBytes?: number;
  virusScanRequired?: boolean;
  ocrMode?: string;
  archiveHandling?: string;
  crossWorkspaceAclAllowed?: boolean;
  directUserAclAllowed?: boolean;
  inheritanceEnforced?: boolean;
  classificationDefault?: string;
  versioningRequired?: boolean;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  code?: string;
  type?: WorkspaceType;
}

export interface UpdatePolicyRequest {
  downloadAllowed?: boolean;
  printAllowed?: boolean;
  exportAllowed?: boolean;
  externalSharingAllowed?: boolean;
  externalLinkAllowed?: boolean;
  watermarkRequired?: boolean;
  viewAuditRequired?: boolean;
  breakGlassRequired?: boolean;
  maxFileSizeBytes?: number;
  virusScanRequired?: boolean;
  ocrMode?: string;
  archiveHandling?: string;
  crossWorkspaceAclAllowed?: boolean;
  directUserAclAllowed?: boolean;
  inheritanceEnforced?: boolean;
  classificationDefault?: string;
  versioningRequired?: boolean;
  allowedFileTypeIds?: number[];
  allowedFilingCategoryIds?: number[];
  defaultFilingCategoryId?: number;
  allowedWorkflowIds?: number[];
}

export interface SubmitWorkspaceRequestPayload {
  name: string;
  code: string;
  description?: string;
  type?: WorkspaceType;
  ownerOuId?: string;
  justification: string;
  // Policy configuration (optional — applied if request is approved)
  downloadAllowed?: boolean;
  printAllowed?: boolean;
  exportAllowed?: boolean;
  externalSharingAllowed?: boolean;
  externalLinkAllowed?: boolean;
  watermarkRequired?: boolean;
  viewAuditRequired?: boolean;
  breakGlassRequired?: boolean;
  maxFileSizeBytes?: number;
  virusScanRequired?: boolean;
  ocrMode?: string;
  archiveHandling?: string;
  crossWorkspaceAclAllowed?: boolean;
  directUserAclAllowed?: boolean;
  inheritanceEnforced?: boolean;
  classificationDefault?: string;
  versioningRequired?: boolean;
}

export interface ReviewWorkspaceRequestPayload {
  approved: boolean;
  comment?: string;
}

export interface AddMemberParams {
  principalType: PrincipalType;
  principalId: string;
  role: WorkspaceRole;
}

export interface RoleCheckResponse {
  hasRole: boolean;
  userId: string;
  role: WorkspaceRole;
}

export interface MembershipCheckResponse {
  isMember: boolean;
  userId: string;
}

export interface MyRoleResponse {
  isMember: boolean;
  role: WorkspaceRole | null;
}

export interface PolicyCheckResponse {
  allowed: boolean;
  [key: string]: unknown;
}

// =====================================================================
// WORKSPACE SERVICE
// =====================================================================

class WorkspaceService {
  private baseUrl = '/api/workspaces';

  // ---- Search / List / Filter / Sort ----

  async searchWorkspaces(params: {
    page?: number;
    size?: number;
    sort?: string;
    search?: string;
    type?: WorkspaceType;
    ownerOuId?: string;
    status?: WorkspaceStatus;
  } = {}): Promise<PageResponse<WorkspaceDto>> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.search) searchParams.set('search', params.search);
    if (params.type) searchParams.set('type', params.type);
    if (params.ownerOuId) searchParams.set('ownerOuId', params.ownerOuId);
    if (params.status) searchParams.set('status', params.status);
    return apiClient.get<PageResponse<WorkspaceDto>>(`${this.baseUrl}?${searchParams}`);
  }

  /** Search all workspaces across all statuses (admin view). */
  async searchAllWorkspaces(params: {
    page?: number;
    size?: number;
    sort?: string;
    search?: string;
    type?: WorkspaceType;
    ownerOuId?: string;
  } = {}): Promise<PageResponse<WorkspaceDto>> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.search) searchParams.set('search', params.search);
    if (params.type) searchParams.set('type', params.type);
    if (params.ownerOuId) searchParams.set('ownerOuId', params.ownerOuId);
    return apiClient.get<PageResponse<WorkspaceDto>>(`${this.baseUrl}/all?${searchParams}`);
  }

  async getMyWorkspaces(page = 0, size = 20, sort?: string): Promise<PageResponse<WorkspaceDto>> {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (sort) params.set('sort', sort);
    return apiClient.get<PageResponse<WorkspaceDto>>(`${this.baseUrl}/my?${params}`);
  }

  async getMyManagedWorkspaces(page = 0, size = 20, sort?: string): Promise<PageResponse<WorkspaceDto>> {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (sort) params.set('sort', sort);
    return apiClient.get<PageResponse<WorkspaceDto>>(`${this.baseUrl}/my/managed?${params}`);
  }

  // ---- Workspace Details ----

  async getWorkspace(workspaceId: string): Promise<WorkspaceDto> {
    return apiClient.get<WorkspaceDto>(`${this.baseUrl}/${workspaceId}`);
  }

  async getWorkspaceByCode(code: string): Promise<WorkspaceDto> {
    return apiClient.get<WorkspaceDto>(`${this.baseUrl}/by-code/${code}`);
  }

  /** Get workspace statistics (member, folder, document counts). */
  async getStats(workspaceId: string): Promise<WorkspaceStatsDto> {
    return apiClient.get<WorkspaceStatsDto>(`${this.baseUrl}/${workspaceId}/stats`);
  }

  // ---- Create ----

  async createWorkspace(data: CreateWorkspaceRequest): Promise<WorkspaceDto> {
    return apiClient.post<WorkspaceDto>(this.baseUrl, data);
  }

  // ---- Update ----

  async updateWorkspace(workspaceId: string, data: UpdateWorkspaceRequest): Promise<WorkspaceDto> {
    return apiClient.put<WorkspaceDto>(`${this.baseUrl}/${workspaceId}`, data);
  }

  // ---- Assign to OU ----

  async assignToOu(workspaceId: string, ouId?: string): Promise<WorkspaceDto> {
    const params = ouId ? `?ouId=${ouId}` : '';
    return apiClient.put<WorkspaceDto>(`${this.baseUrl}/${workspaceId}/assign-ou${params}`, {});
  }

  // ---- Status Management (archive / suspend / reactivate) ----

  async archiveWorkspace(workspaceId: string): Promise<WorkspaceDto> {
    return apiClient.post<WorkspaceDto>(`${this.baseUrl}/${workspaceId}/archive`, {});
  }

  async suspendWorkspace(workspaceId: string): Promise<WorkspaceDto> {
    return apiClient.post<WorkspaceDto>(`${this.baseUrl}/${workspaceId}/suspend`, {});
  }

  async reactivateWorkspace(workspaceId: string): Promise<WorkspaceDto> {
    return apiClient.post<WorkspaceDto>(`${this.baseUrl}/${workspaceId}/reactivate`, {});
  }

  // ---- Policy ----

  async getPolicy(workspaceId: string): Promise<WorkspacePolicyDto> {
    return apiClient.get<WorkspacePolicyDto>(`${this.baseUrl}/${workspaceId}/policy`);
  }

  async updatePolicy(workspaceId: string, data: UpdatePolicyRequest): Promise<WorkspacePolicyDto> {
    return apiClient.put<WorkspacePolicyDto>(`${this.baseUrl}/${workspaceId}/policy`, data);
  }

  // ---- Membership ----

  async listMembers(workspaceId: string): Promise<WorkspaceMemberDto[]> {
    return apiClient.get<WorkspaceMemberDto[]>(`${this.baseUrl}/${workspaceId}/members`);
  }

  async listAllMembers(workspaceId: string): Promise<WorkspaceMemberDto[]> {
    return apiClient.get<WorkspaceMemberDto[]>(`${this.baseUrl}/${workspaceId}/members/all`);
  }

  async addMember(workspaceId: string, params: AddMemberParams): Promise<WorkspaceMemberDto> {
    const searchParams = new URLSearchParams({
      principalType: params.principalType,
      principalId: params.principalId,
      role: params.role,
    });
    return apiClient.post<WorkspaceMemberDto>(`${this.baseUrl}/${workspaceId}/members?${searchParams}`, {});
  }

  async changeMemberRole(workspaceId: string, memberId: number, role: WorkspaceRole): Promise<WorkspaceMemberDto> {
    return apiClient.put<WorkspaceMemberDto>(
      `${this.baseUrl}/${workspaceId}/members/${memberId}/role?role=${role}`, {}
    );
  }

  async removeMember(workspaceId: string, memberId: number, reason?: string): Promise<void> {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return apiClient.delete<void>(`${this.baseUrl}/${workspaceId}/members/${memberId}${params}`);
  }

  async checkUserRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<RoleCheckResponse> {
    return apiClient.get<RoleCheckResponse>(
      `${this.baseUrl}/${workspaceId}/members/check-role?userId=${userId}&role=${role}`
    );
  }

  async checkMembership(workspaceId: string, userId: string): Promise<MembershipCheckResponse> {
    return apiClient.get<MembershipCheckResponse>(
      `${this.baseUrl}/${workspaceId}/members/check?userId=${userId}`
    );
  }

  async getMyRole(workspaceId: string): Promise<MyRoleResponse> {
    return apiClient.get<MyRoleResponse>(`${this.baseUrl}/${workspaceId}/my-role`);
  }

  // ---- Workspace-Scoped Folders ----

  async listWorkspaceFolders(workspaceId: string, params: {
    parentId?: number;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  } = {}): Promise<PageResponse<unknown>> {
    const searchParams = new URLSearchParams();
    if (params.parentId !== undefined) searchParams.set('parentId', params.parentId.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.sort) searchParams.set('sort', params.sort);
    return apiClient.get<PageResponse<unknown>>(`${this.baseUrl}/${workspaceId}/folders?${searchParams}`);
  }

  async createFolderInWorkspace(workspaceId: string, name: string, parentFolderId?: number): Promise<unknown> {
    const params = new URLSearchParams({ name });
    if (parentFolderId !== undefined) params.set('parentFolderId', parentFolderId.toString());
    return apiClient.post<unknown>(`${this.baseUrl}/${workspaceId}/folders?${params}`, {});
  }

  // ---- Workspace-Scoped Documents ----

  async listWorkspaceDocuments(workspaceId: string, params: {
    folderId?: number;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  } = {}): Promise<PageResponse<unknown>> {
    const searchParams = new URLSearchParams();
    if (params.folderId !== undefined) searchParams.set('folderId', params.folderId.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.sort) searchParams.set('sort', params.sort);
    return apiClient.get<PageResponse<unknown>>(`${this.baseUrl}/${workspaceId}/documents?${searchParams}`);
  }

  // ---- Policy Enforcement Checks ----

  async checkFilingCategory(workspaceId: string, filingCategoryId: number): Promise<PolicyCheckResponse> {
    return apiClient.get<PolicyCheckResponse>(
      `${this.baseUrl}/${workspaceId}/policy/check-filing-category?filingCategoryId=${filingCategoryId}`
    );
  }

  async checkFileType(workspaceId: string, mimeType: string): Promise<PolicyCheckResponse> {
    return apiClient.get<PolicyCheckResponse>(
      `${this.baseUrl}/${workspaceId}/policy/check-file-type?mimeType=${encodeURIComponent(mimeType)}`
    );
  }

  async checkFileSize(workspaceId: string, sizeBytes: number): Promise<PolicyCheckResponse> {
    return apiClient.get<PolicyCheckResponse>(
      `${this.baseUrl}/${workspaceId}/policy/check-file-size?sizeBytes=${sizeBytes}`
    );
  }

  /** Combined ingestion policy validation (file type + size + filing category). */
  async validateIngestion(workspaceId: string, mimeType: string, sizeBytes: number, filingCategoryId?: number): Promise<IngestionValidationResult> {
    const params = new URLSearchParams({ mimeType, sizeBytes: sizeBytes.toString() });
    if (filingCategoryId !== undefined) params.set('filingCategoryId', filingCategoryId.toString());
    return apiClient.get<IngestionValidationResult>(
      `${this.baseUrl}/${workspaceId}/policy/validate-ingestion?${params}`
    );
  }

  // ---- Workspace Requests (approval flow) ----

  async submitRequest(data: SubmitWorkspaceRequestPayload): Promise<WorkspaceRequestDto> {
    return apiClient.post<WorkspaceRequestDto>(`${this.baseUrl}/requests`, data);
  }

  async listPendingRequests(): Promise<WorkspaceRequestDto[]> {
    return apiClient.get<WorkspaceRequestDto[]>(`${this.baseUrl}/requests/pending`);
  }

  async listMyRequests(): Promise<WorkspaceRequestDto[]> {
    return apiClient.get<WorkspaceRequestDto[]>(`${this.baseUrl}/requests/my`);
  }

  async reviewRequest(requestId: number, data: ReviewWorkspaceRequestPayload): Promise<WorkspaceRequestDto> {
    return apiClient.post<WorkspaceRequestDto>(`${this.baseUrl}/requests/${requestId}/review`, data);
  }
}

export const workspaceService = new WorkspaceService();
