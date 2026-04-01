import { apiClient } from '../client';

// ==================== Types ====================

export interface DelegationResponse {
    id: string;
    delegatorUserId: string;
    delegatorName: string;
    delegatorImgUrl: string | null;
    delegateUserId: string;
    delegateName: string;
    delegateImgUrl: string | null;
    delegationType: string;
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'REVOKED' | 'EXPIRED';
    startAt: string;
    endAt: string;
    reason: string | null;
    revocationReason: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    createdAt: string;
    canRevoke: boolean;
    scopes: ScopeInfo[];
    roles: RoleInfo[];
}

export interface ScopeInfo {
    scopeType: string;
    scopeRefId: string;
    scopeLabel: string;
}

export interface RoleInfo {
    roleId: string;
    roleCode: string;
    roleName: string;
    businessLabel: string;
    requiresApproval: boolean;
}

export interface DelegableRoleResponse {
    roleId: string;
    roleCode: string;
    roleName: string;
    description: string;
    businessLabel: string;
    requiresApproval: boolean;
    maxDelegationDays: number;
    permissions: string[];
}

export interface EligibleDelegateResponse {
    userId: string;
    displayName: string;
    username: string;
    email: string;
}

export interface CreateDelegationRequest {
    delegateUserId: string;
    roleIds: string[];
    startAt: string;
    endAt: string;
    reason: string;
}

export interface UserDelegationFilter {
    status?: string;
    delegationType?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page: number;
    size: number;
    sortBy?: string;
    sortDir?: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

// ==================== Service ====================

class DelegationService {
    // ==================== Central Hub ====================

    async getMyOutgoing(): Promise<DelegationResponse[]> {
        return apiClient.get<DelegationResponse[]>('/api/v1/delegations/outgoing');
    }

    async getMyIncoming(): Promise<DelegationResponse[]> {
        return apiClient.get<DelegationResponse[]>('/api/v1/delegations/incoming');
    }

    async getMyOutgoingPaged(filter: UserDelegationFilter): Promise<PageResponse<DelegationResponse>> {
        return apiClient.post<PageResponse<DelegationResponse>>('/api/v1/delegations/outgoing/search', filter);
    }

    async getMyIncomingPaged(filter: UserDelegationFilter): Promise<PageResponse<DelegationResponse>> {
        return apiClient.post<PageResponse<DelegationResponse>>('/api/v1/delegations/incoming/search', filter);
    }

    async getPendingApproval(): Promise<DelegationResponse[]> {
        return apiClient.get<DelegationResponse[]>('/api/v1/delegations/pending');
    }

    async hasDelegableResponsibilities(): Promise<boolean> {
        const res = await apiClient.get<{ hasDelegable: boolean }>('/api/v1/delegations/has-delegable');
        return res.hasDelegable;
    }

    async approveDelegation(id: string): Promise<DelegationResponse> {
        return apiClient.put<DelegationResponse>(`/api/v1/delegations/${id}/approve`, {});
    }

    async rejectDelegation(id: string, reason: string): Promise<DelegationResponse> {
        return apiClient.put<DelegationResponse>(`/api/v1/delegations/${id}/reject`, { reason });
    }

    async revokeDelegation(id: string, reason: string): Promise<DelegationResponse> {
        return apiClient.put<DelegationResponse>(`/api/v1/delegations/${id}/revoke`, { reason });
    }

    // ==================== Contextual (OU-scoped) ====================

    async getOutgoingForOu(ouId: string): Promise<DelegationResponse[]> {
        return apiClient.get<DelegationResponse[]>(`/api/v1/my-scope/units/${ouId}/delegations/outgoing`);
    }

    async getIncomingForOu(ouId: string): Promise<DelegationResponse[]> {
        return apiClient.get<DelegationResponse[]>(`/api/v1/my-scope/units/${ouId}/delegations/incoming`);
    }

    async getOutgoingForOuPaged(ouId: string, filter: UserDelegationFilter): Promise<PageResponse<DelegationResponse>> {
        return apiClient.post<PageResponse<DelegationResponse>>(`/api/v1/my-scope/units/${ouId}/delegations/outgoing/search`, filter);
    }

    async getIncomingForOuPaged(ouId: string, filter: UserDelegationFilter): Promise<PageResponse<DelegationResponse>> {
        return apiClient.post<PageResponse<DelegationResponse>>(`/api/v1/my-scope/units/${ouId}/delegations/incoming/search`, filter);
    }

    async getDelegableRoles(ouId: string): Promise<DelegableRoleResponse[]> {
        return apiClient.get<DelegableRoleResponse[]>(`/api/v1/my-scope/units/${ouId}/delegations/delegable-roles`);
    }

    async getEligibleDelegates(ouId: string, search?: string): Promise<EligibleDelegateResponse[]> {
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        return apiClient.get<EligibleDelegateResponse[]>(`/api/v1/my-scope/units/${ouId}/delegations/eligible-delegates${params}`);
    }

    async createOuDelegation(ouId: string, request: CreateDelegationRequest): Promise<DelegationResponse> {
        return apiClient.post<DelegationResponse>(`/api/v1/my-scope/units/${ouId}/delegations`, request);
    }
}

export const delegationService = new DelegationService();
