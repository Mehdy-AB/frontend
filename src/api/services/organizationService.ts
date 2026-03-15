import { apiClient } from '../client';

// ==================== Reference Data Types ====================

export interface ReferenceDataItem {
    id: string;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
    sortOrder: number;
    createdAt?: string;
    updatedAt?: string;
    // ClearanceLevel-specific
    levelRank?: number;
    color?: string;
}

export type ClearanceLevelItem = ReferenceDataItem;

export interface CreateReferenceDataRequest {
    code: string;
    name: string;
    description?: string;
    sortOrder?: number;
    levelRank?: number;
    color?: string;
}

export interface UpdateReferenceDataRequest {
    code?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
    sortOrder?: number;
    levelRank?: number;
    color?: string;
}

// ==================== Manager Types ====================

export interface ManagerAssignmentResponse {
    id: string;
    userId: string;
    userDisplayName: string;
    managerUserId: string;
    managerDisplayName: string;
    managerImageUrl?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    isActing: boolean;
    assignmentReason?: string;
    assignedByDisplayName?: string;
    createdAt: string;
}

export interface AssignManagerRequest {
    managerUserId: string;
    effectiveFrom?: string;
    isActing?: boolean;
    assignmentReason?: string;
}

// ==================== Position Types ====================

export interface PositionDefinitionResponse {
    id: string;
    code: string;
    title: string;
    description?: string;
    jobFamilyId?: string;
    jobFamilyName?: string;
    levelBand?: string;
    minClearanceLevelId?: string;
    minClearanceLevelName?: string;
    isActive: boolean;
    sortOrder: number;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreatePositionDefinitionRequest {
    code: string;
    title: string;
    description?: string;
    jobFamilyId?: string;
    levelBand?: string;
    minClearanceLevelId?: string;
    sortOrder?: number;
}

export interface UpdatePositionDefinitionRequest {
    code?: string;
    title?: string;
    description?: string;
    jobFamilyId?: string;
    clearJobFamily?: boolean;
    levelBand?: string;
    minClearanceLevelId?: string;
    clearMinClearanceLevel?: boolean;
    sortOrder?: number;
    isActive?: boolean;
}

export interface PositionAssignmentResponse {
    id: string;
    userId: string;
    userDisplayName: string;
    orgPositionId: string;
    seatCode: string;
    positionTitle: string;
    orgUnitId: string;
    orgUnitName: string;
    ftePercentage: number;
    isPrimary: boolean;
    assignmentType: string;
    effectiveDate: string;
    endDate?: string;
}

// ==================== Operational Group Types ====================

export interface OrgUnitGroupResponse {
    id: string;
    name: string;
    description?: string;
    orgUnitId: string;
    orgUnitName: string;
    groupType: string;
    leaderUserId?: string;
    leaderDisplayName?: string;
    memberCount: number;
    isActive: boolean;
}

export interface GroupMemberResponse {
    id: string;
    groupId: string;
    userId: string;
    userDisplayName: string;
    userImageUrl?: string;
    roleInGroup: string;
    joinedAt: string;
}

// Reference data category type
export type ReferenceDataCategory = 'job-families' | 'employment-types' | 'clearance-levels' | 'cost-centers';

// ==================== Paged Response ====================

export interface PagedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface PositionFilterParams {
    search?: string;
    jobFamilyId?: string;
    isActive?: boolean;
    page?: number;
    size?: number;
}

// ==================== Service ====================

class OrganizationService {
    private refBase = '/api/v1/admin/reference';

    // ---- Reference Data: Server-side Search ----

    async searchReferenceData(category: ReferenceDataCategory, query: string): Promise<ReferenceDataItem[]> {
        if (!query || query.length < 1) return [];
        return apiClient.get<ReferenceDataItem[]>(`${this.refBase}/${category}?query=${encodeURIComponent(query)}`);
    }

    // ---- Reference Data: Get by ID ----

    async getReferenceDataById(category: ReferenceDataCategory, id: string): Promise<ReferenceDataItem> {
        return apiClient.get<ReferenceDataItem>(`${this.refBase}/${category}/${id}`);
    }

    // ---- Reference Data: CRUD ----

    async createReferenceData(category: ReferenceDataCategory, data: CreateReferenceDataRequest): Promise<ReferenceDataItem> {
        return apiClient.post<ReferenceDataItem>(`${this.refBase}/${category}`, data);
    }

    async updateReferenceData(category: ReferenceDataCategory, id: string, data: UpdateReferenceDataRequest): Promise<ReferenceDataItem> {
        return apiClient.put<ReferenceDataItem>(`${this.refBase}/${category}/${id}`, data);
    }

    async deleteReferenceData(category: ReferenceDataCategory, id: string): Promise<void> {
        return apiClient.delete<void>(`${this.refBase}/${category}/${id}`);
    }

    // ---- Manager ----

    async assignManager(userId: string, data: AssignManagerRequest): Promise<ManagerAssignmentResponse> {
        return apiClient.put<ManagerAssignmentResponse>(`/api/v1/admin/org-units/users/${userId}/manager`, data);
    }

    async removeManager(userId: string): Promise<void> {
        return apiClient.delete<void>(`/api/v1/admin/org-units/users/${userId}/manager`);
    }

    async getCurrentManager(userId: string): Promise<ManagerAssignmentResponse | null> {
        try {
            return await apiClient.get<ManagerAssignmentResponse>(`/api/v1/admin/org-units/users/${userId}/manager`);
        } catch {
            return null;
        }
    }

    async getManagerChain(userId: string): Promise<ManagerAssignmentResponse[]> {
        return apiClient.get<ManagerAssignmentResponse[]>(`/api/v1/admin/org-units/users/${userId}/manager/chain`);
    }

    async getManagerHistory(userId: string): Promise<ManagerAssignmentResponse[]> {
        return apiClient.get<ManagerAssignmentResponse[]>(`/api/v1/admin/org-units/users/${userId}/manager/history`);
    }

    async getDirectReports(userId: string): Promise<ManagerAssignmentResponse[]> {
        return apiClient.get<ManagerAssignmentResponse[]>(`/api/v1/admin/org-units/users/${userId}/direct-reports`);
    }

    // ---- Positions ----

    async getPositionDefinitions(params?: PositionFilterParams): Promise<PagedResponse<PositionDefinitionResponse>> {
        const qp = new URLSearchParams();
        if (params?.search) qp.set('search', params.search);
        if (params?.jobFamilyId) qp.set('jobFamilyId', params.jobFamilyId);
        if (params?.isActive !== undefined) qp.set('isActive', String(params.isActive));
        qp.set('page', String(params?.page ?? 0));
        qp.set('size', String(params?.size ?? 20));
        qp.set('sort', 'sortOrder');
        qp.set('direction', 'asc');
        return apiClient.get<PagedResponse<PositionDefinitionResponse>>(`/api/v1/admin/positions/definitions?${qp.toString()}`);
    }

    async searchPositionDefinitions(query: string): Promise<PositionDefinitionResponse[]> {
        if (!query || query.length < 1) return [];
        return apiClient.get<PositionDefinitionResponse[]>(`/api/v1/admin/positions/definitions/search?query=${encodeURIComponent(query)}`);
    }

    async getPositionDefinition(id: string): Promise<PositionDefinitionResponse> {
        return apiClient.get<PositionDefinitionResponse>(`/api/v1/admin/positions/definitions/${id}`);
    }

    async createPositionDefinition(data: CreatePositionDefinitionRequest): Promise<PositionDefinitionResponse> {
        return apiClient.post<PositionDefinitionResponse>('/api/v1/admin/positions/definitions', data);
    }

    async updatePositionDefinition(id: string, data: UpdatePositionDefinitionRequest): Promise<PositionDefinitionResponse> {
        return apiClient.put<PositionDefinitionResponse>(`/api/v1/admin/positions/definitions/${id}`, data);
    }

    async deletePositionDefinition(id: string): Promise<void> {
        return apiClient.delete<void>(`/api/v1/admin/positions/definitions/${id}`);
    }

    async getUserPositionAssignments(userId: string): Promise<PositionAssignmentResponse[]> {
        return apiClient.get<PositionAssignmentResponse[]>(`/api/v1/admin/positions/assignments/user/${userId}`);
    }
}

export const organizationService = new OrganizationService();
