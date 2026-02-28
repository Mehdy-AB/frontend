import { apiClient } from '../client';

// ==================== Types ====================

export type OrgUnitType = 'ORGANIZATION' | 'DIRECTORATE' | 'DEPARTMENT' | 'SERVICE' | 'TEAM' | 'BRANCH';

export interface OrgUnitResponse {
    id: string;
    name: string;
    code: string;
    description: string | null;
    type: OrgUnitType;
    parentId: string | null;
    parentName: string | null;
    pathLtree: string;
    level: number;
    sortOrder: number;
    isActive: boolean;
    headUserId: string | null;
    headUserDisplayName: string | null;
    memberCount: number;
    childCount: number;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
    attributes: Record<string, any>;
}

export interface OrgUnitTreeResponse {
    id: string;
    name: string;
    code: string;
    type: OrgUnitType;
    level: number;
    sortOrder: number;
    isActive: boolean;
    headUserId: string | null;
    headUserDisplayName: string | null;
    memberCount: number;
    children: OrgUnitTreeResponse[];
}

export interface OrgUnitMemberResponse {
    id: string;
    userId: string;
    username: string;
    displayName: string;
    email: string;
    imageUrl: string | null;
    isPrimary: boolean;
    positionTitle: string | null;
    assignedAt: string;
    assignedBy: string | null;
    assignedByDisplayName: string | null;
}

export interface CreateOrgUnitRequest {
    name: string;
    code: string;
    description?: string;
    type: OrgUnitType;
    parentId?: string;
    headUserId?: string;
    sortOrder?: number;
    attributes?: Record<string, any>;
}

export interface UpdateOrgUnitRequest {
    name?: string;
    code?: string;
    description?: string;
    type?: OrgUnitType;
    parentId?: string;
    headUserId?: string;
    sortOrder?: number;
    isActive?: boolean;
    attributes?: Record<string, any>;
}

export interface AssignUserToOrgUnitRequest {
    userId: string;
    isPrimary?: boolean;
    positionTitle?: string;
}

export interface BatchAssignUsersRequest {
    assignments: {
        userId: string;
        isPrimary?: boolean;
        positionTitle?: string;
    }[];
}

// ==================== Service ====================

export class OrgUnitService {
    private baseUrl = '/api/v1/admin/org-units';

    // CRUD
    async createOrgUnit(data: CreateOrgUnitRequest): Promise<OrgUnitResponse> {
        return apiClient.post<OrgUnitResponse>(this.baseUrl, data);
    }

    async getOrgUnit(id: string): Promise<OrgUnitResponse> {
        return apiClient.get<OrgUnitResponse>(`${this.baseUrl}/${id}`);
    }

    async getOrgUnitByCode(code: string): Promise<OrgUnitResponse> {
        return apiClient.get<OrgUnitResponse>(`${this.baseUrl}/code/${code}`);
    }

    async getAllOrgUnits(type?: OrgUnitType): Promise<OrgUnitResponse[]> {
        const params = type ? `?type=${type}` : '';
        return apiClient.get<OrgUnitResponse[]>(`${this.baseUrl}${params}`);
    }

    async updateOrgUnit(id: string, data: UpdateOrgUnitRequest): Promise<OrgUnitResponse> {
        return apiClient.put<OrgUnitResponse>(`${this.baseUrl}/${id}`, data);
    }

    async deleteOrgUnit(id: string): Promise<void> {
        return apiClient.delete<void>(`${this.baseUrl}/${id}`);
    }

    // Tree operations
    async getTree(): Promise<OrgUnitTreeResponse[]> {
        return apiClient.get<OrgUnitTreeResponse[]>(`${this.baseUrl}/tree`);
    }

    async getSubtree(id: string): Promise<OrgUnitTreeResponse> {
        return apiClient.get<OrgUnitTreeResponse>(`${this.baseUrl}/${id}/tree`);
    }

    async getChildren(id: string): Promise<OrgUnitResponse[]> {
        return apiClient.get<OrgUnitResponse[]>(`${this.baseUrl}/${id}/children`);
    }

    async getAncestors(id: string): Promise<OrgUnitResponse[]> {
        return apiClient.get<OrgUnitResponse[]>(`${this.baseUrl}/${id}/ancestors`);
    }

    async getDescendants(id: string): Promise<OrgUnitResponse[]> {
        return apiClient.get<OrgUnitResponse[]>(`${this.baseUrl}/${id}/descendants`);
    }

    // Member management
    async getMembers(orgUnitId: string): Promise<OrgUnitMemberResponse[]> {
        return apiClient.get<OrgUnitMemberResponse[]>(`${this.baseUrl}/${orgUnitId}/members`);
    }

    async assignUser(orgUnitId: string, data: AssignUserToOrgUnitRequest): Promise<OrgUnitMemberResponse> {
        return apiClient.post<OrgUnitMemberResponse>(`${this.baseUrl}/${orgUnitId}/members`, data);
    }

    async assignUsersBatch(orgUnitId: string, data: BatchAssignUsersRequest): Promise<OrgUnitMemberResponse[]> {
        return apiClient.post<OrgUnitMemberResponse[]>(`${this.baseUrl}/${orgUnitId}/members/batch`, data);
    }

    async removeUser(orgUnitId: string, userId: string): Promise<void> {
        return apiClient.delete<void>(`${this.baseUrl}/${orgUnitId}/members/${userId}`);
    }

    async setHead(orgUnitId: string, headUserId: string): Promise<OrgUnitResponse> {
        return apiClient.put<OrgUnitResponse>(`${this.baseUrl}/${orgUnitId}/head`, { headUserId });
    }

    // Search
    async search(query: string): Promise<OrgUnitResponse[]> {
        return apiClient.get<OrgUnitResponse[]>(`${this.baseUrl}/search?query=${encodeURIComponent(query)}`);
    }
}

export const orgUnitService = new OrgUnitService();
