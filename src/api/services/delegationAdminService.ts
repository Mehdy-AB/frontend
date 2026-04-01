import { apiClient } from '../client';
import { PageResponse } from '../../types/api';
import { DelegationResponse } from './delegationService';
import { AuditLogResponseDto } from './auditLogService';

// ==================== Types ====================

export interface AdminDelegationFilter {
    status?: string;
    delegationType?: string;
    delegatorId?: string;
    delegateId?: string;
    scopeRefId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
}

export interface DelegationStatsResponse {
    totalActive: number;
    totalPending: number;
    totalExpired: number;
    totalRevoked: number;
    totalRejected: number;
    expiringSoon: number;
    recentlyExpired: number;
    countByType: Record<string, number>;
    topDelegators: TopDelegator[];
}

export interface TopDelegator {
    userId: string;
    displayName: string;
    imgUrl: string | null;
    activeCount: number;
}

export interface EmergencyDelegationRequest {
    delegatorUserId: string;
    delegateUserId: string;
    roleIds: string[];
    ouId: string;
    startAt: string;
    endAt: string;
    reason: string;
}

export interface DelegationAuditFilter {
    actions?: string[];
    userId?: string;
    username?: string;
    entityId?: string;
    dateFrom?: string;
    dateTo?: string;
    success?: boolean | null;
    search?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
}

// ==================== Service ====================

const BASE = '/api/v1/admin/delegations';

class DelegationAdminService {
    /** GET /api/v1/admin/delegations — paginated + filtered */
    async getAllDelegations(filter: AdminDelegationFilter = {}): Promise<PageResponse<DelegationResponse>> {
        const params = new URLSearchParams();
        if (filter.status) params.set('status', filter.status);
        if (filter.delegationType) params.set('delegationType', filter.delegationType);
        if (filter.delegatorId) params.set('delegatorId', filter.delegatorId);
        if (filter.delegateId) params.set('delegateId', filter.delegateId);
        if (filter.scopeRefId) params.set('scopeRefId', filter.scopeRefId);
        if (filter.search) params.set('search', filter.search);
        if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
        if (filter.dateTo) params.set('dateTo', filter.dateTo);
        params.set('page', String(filter.page ?? 0));
        params.set('size', String(filter.size ?? 20));
        params.set('sortBy', filter.sortBy ?? 'createdAt');
        params.set('sortDir', filter.sortDir ?? 'desc');

        return apiClient.get<PageResponse<DelegationResponse>>(`${BASE}?${params}`);
    }

    /** GET /api/v1/admin/delegations/stats — analytics */
    async getDelegationStats(): Promise<DelegationStatsResponse> {
        return apiClient.get<DelegationStatsResponse>(`${BASE}/stats`);
    }

    /** POST /api/v1/admin/delegations/emergency — create delegation on behalf */
    async createEmergencyDelegation(request: EmergencyDelegationRequest): Promise<DelegationResponse> {
        return apiClient.post<DelegationResponse>(`${BASE}/emergency`, request);
    }

    /** POST /api/v1/admin/delegations/audit — delegation-scoped audit trail */
    async getDelegationAuditTrail(filter: DelegationAuditFilter): Promise<PageResponse<AuditLogResponseDto>> {
        return apiClient.post<PageResponse<AuditLogResponseDto>>(`${BASE}/audit`, filter);
    }

    /** POST /api/v1/admin/delegations/audit/export — CSV export */
    async exportDelegationAuditCsv(filter: DelegationAuditFilter): Promise<Blob> {
        return apiClient.downloadFile(`${BASE}/audit/export`, {
            method: 'POST',
            data: filter,
        });
    }
}

export const delegationAdminService = new DelegationAdminService();
