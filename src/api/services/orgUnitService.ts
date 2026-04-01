import { apiClient } from '../client';
import axios, { AxiosInstance } from 'axios';
import { PageResponse } from '../../types/api';

export const COLOR_THEMES: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-800 border-slate-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    rose: 'bg-rose-100 text-rose-800 border-rose-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    red: 'bg-red-100 text-red-800 border-red-200'
};

export const getTypeColorClass = (colorName: string | null | undefined): string => {
    if (!colorName) return COLOR_THEMES['slate'];
    return COLOR_THEMES[colorName] || COLOR_THEMES['slate'];
};

// ==================== Types ====================

export interface OrgUnitTypeResponse {
    id: string;
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    levelHint: number | null;
    isActive: boolean;
    sortOrder: number;
    isSystem: boolean;
    canHaveChildren: boolean;
    canHaveMembers: boolean;
    usageCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface OrgUnitGroupTypeResponse {
    id: string;
    code: string;
    name: string;
    description: string | null;
    color: string | null;
    isActive: boolean;
    sortOrder: number;
    isSystem: boolean;
    usageCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface TypeRelation {
    parentTypeId: string;
    parentTypeName: string;
    parentTypeCode: string;
    childTypeId: string;
    childTypeName: string;
    childTypeCode: string;
}

export interface OrgUnitResponse {
    id: string;
    name: string;
    code: string;
    description: string | null;
    typeId: string;
    typeCode: string;
    typeName: string;
    typeColor: string | null;
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
    typeId: string;
    typeCode: string;
    typeName: string;
    typeColor: string | null;
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
    primary?: boolean;
    assignedAt: string;
    assignedBy: string | null;
    assignedByDisplayName: string | null;
}

export interface CreateOrgUnitRequest {
    name: string;
    code: string;
    description?: string;
    typeId: string;
    parentId?: string;
    headUserId?: string;
    sortOrder?: number;
    attributes?: Record<string, any>;
}

export interface UpdateOrgUnitRequest {
    name?: string;
    code?: string;
    description?: string;
    typeId?: string;
    parentId?: string;
    headUserId?: string;
    sortOrder?: number;
    isActive?: boolean;
    attributes?: Record<string, any>;
}

export interface AssignUserToOrgUnitRequest {
    userId: string;
    isPrimary?: boolean;
}

export interface BatchAssignUsersRequest {
    assignments: {
        userId: string;
        isPrimary?: boolean;
    }[];
}

// ==================== Position Types ====================

export interface OrgPositionResponse {
    id: string;
    positionDefinitionId: string;
    positionTitle: string;
    positionCode: string;
    orgUnitId: string;
    orgUnitName: string;
    seatCode: string;
    maxHeadcount: number;
    currentHeadcount: number;
    isBudgetApproved: boolean;
    isActive: boolean;
    reportingToPositionId: string | null;
    reportingToSeatCode: string | null;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateOrgPositionRequest {
    positionDefinitionId: string;
    seatCode: string;
    maxHeadcount?: number;
    isBudgetApproved?: boolean;
    reportingToPositionId?: string;
}

export interface UpdateOrgPositionRequest {
    seatCode?: string;
    positionDefinitionId?: string;
    maxHeadcount?: number;
    isBudgetApproved?: boolean;
    isActive?: boolean;
    reportingToPositionId?: string;
    clearReportingTo?: boolean;
}

export interface PositionAssignmentResponse {
    id: string;
    userId: string;
    userDisplayName: string;
    userImageUrl: string | null;
    orgPositionId: string;
    seatCode: string;
    positionTitle: string;
    orgUnitId: string;
    orgUnitName: string;
    orgUnitTypeColor: string | null;
    isPrimary: boolean;
    effectiveFrom: string;
    effectiveTo: string | null;
    assignmentType: string;
    ftePercentage: number | null;
    assignedBy: string | null;
    assignedByDisplayName: string | null;
    status: string;
    revokedAt: string | null;
    revokedByDisplayName: string | null;
    createdAt: string;
    updatedAt: string;
}

// Paged response shape from Spring Boot
export interface PagedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

// ==================== Member Detail Types ====================

export interface GroupMembershipInfo {
    groupId: string;
    groupName: string;
    groupCode: string;
    groupTypeName: string | null;
    groupTypeColor: string | null;
    roleInGroup: string;
    joinedAt: string;
}

export interface MemberDetailResponse {
    userId: string;
    username: string;
    displayName: string;
    email: string;
    imageUrl: string | null;
    jobTitle: string | null;
    isPrimary: boolean;
    assignedAt: string;
    assignedByDisplayName: string | null;
    managerUserId: string | null;
    managerDisplayName: string | null;
    managerImageUrl: string | null;
    positionAssignments: PositionAssignmentResponse[];
    groupMemberships: GroupMembershipInfo[];
    scopedRoles?: {
        id: string;
        roleCode: string;
        roleName: string;
        roleDescription: string;
        isDefault: boolean;
        status: string;
        grantedBy: string | null;
        grantedByDisplayName: string | null;
        effectiveFrom: string | null;
        effectiveTo: string | null;
        assignmentReason: string | null;
        source: string;
    }[];
}

export interface UserOrgUnitResponse {
    membershipId: string;
    isPrimary: boolean;
    assignedAt: string;
    orgUnitId: string;
    orgUnitName: string;
    orgUnitCode: string;
    orgUnitTypeCode: string;
    orgUnitTypeName: string;
    orgUnitTypeColor: string | null;
    level: number;
    headUserId: string | null;
    headUserDisplayName: string | null;
}

// ==================== Group Types ====================

export interface OrgUnitGroupResponse {
    id: string;
    orgUnitId: string;
    orgUnitName: string;
    code: string;
    name: string;
    description: string | null;
    groupTypeId: string;
    groupTypeCode: string;
    groupTypeName: string;
    groupTypeColor: string | null;
    leaderUserId: string | null;
    leaderDisplayName: string | null;
    leaderImageUrl: string | null;
    isActive: boolean;
    memberCount: number;
    attributes: Record<string, any>;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateOrgUnitGroupRequest {
    name: string;
    code: string;
    description?: string;
    groupTypeId?: string;
    leaderUserId?: string;
}

export interface UpdateOrgUnitGroupRequest {
    name?: string;
    description?: string;
    groupTypeId?: string;
    isActive?: boolean;
}

export interface GroupMemberResponse {
    id: string;
    groupId: string;
    userId: string;
    userDisplayName: string;
    userImageUrl: string | null;
    userEmail: string;
    roleInGroup: string;
    addedBy: string | null;
    addedByDisplayName: string | null;
    joinedAt: string;
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

    async getAllOrgUnits(typeId?: string): Promise<OrgUnitResponse[]> {
        const params = typeId ? `?typeId=${typeId}` : '';
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
    async getMembers(orgUnitId: string, params?: {
        query?: string; page?: number; size?: number; sort?: string; direction?: string;
        excludePositionId?: string;
    }): Promise<any> {
        const qp = new URLSearchParams();
        if (params?.query) qp.set('query', params.query);
        if (params?.page !== undefined) qp.set('page', String(params.page));
        if (params?.size !== undefined) qp.set('size', String(params.size));
        if (params?.sort) qp.set('sort', params.sort);
        if (params?.direction) qp.set('direction', params.direction);
        if (params?.excludePositionId) qp.set('excludePositionId', params.excludePositionId);
        return apiClient.get<any>(`${this.baseUrl}/${orgUnitId}/members?${qp.toString()}`);
    }

    async assignUser(orgUnitId: string, data: AssignUserToOrgUnitRequest): Promise<OrgUnitMemberResponse> {
        return apiClient.post<OrgUnitMemberResponse>(`${this.baseUrl}/${orgUnitId}/members`, data);
    }

    async assignUsersBatch(orgUnitId: string, data: BatchAssignUsersRequest): Promise<OrgUnitMemberResponse[]> {
        return apiClient.post<OrgUnitMemberResponse[]>(`${this.baseUrl}/${orgUnitId}/members/batch`, data);
    }

    async removeUser(orgUnitId: string, userId: string): Promise<void> {
        return apiClient.delete<void>(`${this.baseUrl}/${orgUnitId}/members/${userId}`).then(res => {
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('leadership:updated'));
            return res;
        });
    }

    async removeUsersBatch(orgUnitId: string, userIds: string[]): Promise<void> {
        return apiClient.delete<void>(`${this.baseUrl}/${orgUnitId}/members/batch`, {
            data: { userIds }
        } as any).then(res => {
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('leadership:updated'));
            return res;
        });
    }

    async setPrimaryBatch(orgUnitId: string, userIds: string[]): Promise<{ successCount: number; failCount: number; errors: string[] }> {
        return apiClient.put(`${this.baseUrl}/${orgUnitId}/members/primary/batch`, { userIds });
    }

    async removePrimaryBatch(orgUnitId: string, userIds: string[]): Promise<{ successCount: number; failCount: number; errors: string[] }> {
        return apiClient.delete(`${this.baseUrl}/${orgUnitId}/members/primary/batch`, {
            data: { userIds }
        } as any);
    }

    async getMemberDetails(orgUnitId: string, userId: string): Promise<MemberDetailResponse> {
        return apiClient.get<MemberDetailResponse>(`${this.baseUrl}/${orgUnitId}/members/${userId}/details`);
    }

    async setManagerBatch(orgUnitId: string, userIds: string[], managerUserId: string): Promise<{ successCount: number; failCount: number; errors: string[] }> {
        return apiClient.put(`${this.baseUrl}/${orgUnitId}/members/manager/batch`, { userIds, managerUserId });
    }

    async setHead(orgUnitId: string, headUserId: string): Promise<OrgUnitResponse> {
        return apiClient.put<OrgUnitResponse>(`${this.baseUrl}/${orgUnitId}/head`, { headUserId }).then(res => {
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('leadership:updated'));
            return res;
        });
    }

    async removeHead(orgUnitId: string): Promise<OrgUnitResponse> {
        return apiClient.delete<OrgUnitResponse>(`${this.baseUrl}/${orgUnitId}/head`).then(res => {
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('leadership:updated'));
            return res;
        });
    }

    // ==================== User-Centric Queries ====================

    async getUserOrgUnits(userId: string): Promise<UserOrgUnitResponse[]> {
        return apiClient.get<UserOrgUnitResponse[]>(`${this.baseUrl}/user/${userId}`);
    }

    async getUserPrimaryOrgUnit(userId: string): Promise<UserOrgUnitResponse> {
        return apiClient.get<UserOrgUnitResponse>(`${this.baseUrl}/user/${userId}/primary`);
    }

    // Move
    async moveOrgUnit(id: string, newParentId: string): Promise<OrgUnitResponse> {
        return apiClient.put<OrgUnitResponse>(`${this.baseUrl}/${id}/move`, { newParentId });
    }

    // Search
    async search(query: string): Promise<OrgUnitResponse[]> {
        return apiClient.get<OrgUnitResponse[]>(`${this.baseUrl}/search?query=${encodeURIComponent(query)}`);
    }

    // ==================== Positions (Layer 2) ====================

    async getPositions(ouId: string, params?: {
        search?: string; isActive?: boolean; isBudgetApproved?: boolean;
        page?: number; size?: number; sort?: string; direction?: string;
    }): Promise<any> {
        const qp = new URLSearchParams();
        if (params?.search) qp.set('search', params.search);
        if (params?.isActive !== undefined && params?.isActive !== null) qp.set('isActive', String(params.isActive));
        if (params?.isBudgetApproved !== undefined && params?.isBudgetApproved !== null) qp.set('isBudgetApproved', String(params.isBudgetApproved));
        qp.set('page', String(params?.page ?? 0));
        qp.set('size', String(params?.size ?? 10));
        if (params?.sort) qp.set('sort', params.sort);
        if (params?.direction) qp.set('direction', params.direction);
        return apiClient.get<any>(`${this.baseUrl}/${ouId}/positions?${qp.toString()}`);
    }

    async createPosition(ouId: string, data: CreateOrgPositionRequest, force?: boolean): Promise<OrgPositionResponse> {
        const url = force ? `${this.baseUrl}/${ouId}/positions?force=true` : `${this.baseUrl}/${ouId}/positions`;
        return apiClient.post<OrgPositionResponse>(url, data);
    }

    async deletePosition(ouId: string, positionId: string): Promise<void> {
        return apiClient.delete<void>(`${this.baseUrl}/${ouId}/positions/${positionId}`);
    }

    async deletePositionsBatch(ouId: string, positionIds: string[]): Promise<void> {
        return apiClient.delete<void>(`${this.baseUrl}/${ouId}/positions/batch`, {
            data: { positionIds }
        } as any);
    }

    async updatePosition(ouId: string, positionId: string, data: UpdateOrgPositionRequest): Promise<OrgPositionResponse> {
        return apiClient.put<OrgPositionResponse>(`${this.baseUrl}/${ouId}/positions/${positionId}`, data);
    }

    async getPositionAssignments(ouId: string, positionId: string, params?: {
        search?: string; page?: number; size?: number;
        assignmentType?: string; isPrimary?: boolean;
    }): Promise<any> {
        const qp = new URLSearchParams();
        if (params?.search) qp.set('search', params.search);
        if (params?.page !== undefined) qp.set('page', String(params.page));
        if (params?.size !== undefined) qp.set('size', String(params.size));
        if (params?.assignmentType) qp.set('assignmentType', params.assignmentType);
        if (params?.isPrimary !== undefined) qp.set('isPrimary', String(params.isPrimary));
        return apiClient.get<any>(`${this.baseUrl}/${ouId}/positions/${positionId}/assignments?${qp.toString()}`);
    }

    async assignUsersToPosition(ouId: string, positionId: string, userIds: string[], config?: {
        isPrimary?: boolean;
        effectiveFrom?: string;
        effectiveTo?: string | null;
        assignmentType?: string;
        ftePercentage?: number;
    }): Promise<PositionAssignmentResponse[]> {
        return apiClient.post<PositionAssignmentResponse[]>(
            `${this.baseUrl}/${ouId}/positions/${positionId}/assignments`,
            { userIds, ...config }
        );
    }

    async updatePositionAssignment(ouId: string, positionId: string, assignmentId: string, data: {
        isPrimary?: boolean;
        effectiveFrom?: string;
        effectiveTo?: string | null;
        assignmentType?: string;
        ftePercentage?: number;
    }): Promise<PositionAssignmentResponse> {
        return apiClient.put<PositionAssignmentResponse>(
            `${this.baseUrl}/${ouId}/positions/${positionId}/assignments/${assignmentId}`,
            data
        );
    }

    async unassignFromPositionBatch(ouId: string, positionId: string, assignmentIds: string[]): Promise<void> {
        return apiClient.delete<void>(
            `${this.baseUrl}/${ouId}/positions/${positionId}/assignments/batch`,
            { data: { assignmentIds } } as any
        );
    }

    // ==================== Operational Groups ====================

    async getGroups(
        ouId: string,
        params?: { query?: string; groupTypeId?: string; isActive?: boolean; page?: number; size?: number; sort?: string; direction?: string }
    ): Promise<PageResponse<OrgUnitGroupResponse>> {
        const queryParams = new URLSearchParams();
        if (params?.query) queryParams.append('query', params.query);
        if (params?.groupTypeId && params.groupTypeId !== 'ALL') queryParams.append('groupTypeId', params.groupTypeId);
        if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
        if (params?.page !== undefined) queryParams.append('page', params.page.toString());
        if (params?.size !== undefined) queryParams.append('size', params.size.toString());
        if (params?.sort) queryParams.append('sort', params.sort);
        if (params?.direction) queryParams.append('direction', params.direction);
        
        const queryString = queryParams.toString();
        const url = `${this.baseUrl}/${ouId}/groups` + (queryString ? `?${queryString}` : '');
        return apiClient.get<PageResponse<OrgUnitGroupResponse>>(url);
    }

    async createGroup(ouId: string, data: CreateOrgUnitGroupRequest): Promise<OrgUnitGroupResponse> {
        return apiClient.post<OrgUnitGroupResponse>(`${this.baseUrl}/${ouId}/groups`, data);
    }

    async updateGroup(ouId: string, groupId: string, data: UpdateOrgUnitGroupRequest): Promise<OrgUnitGroupResponse> {
        return apiClient.put<OrgUnitGroupResponse>(`${this.baseUrl}/${ouId}/groups/${groupId}`, data);
    }

    async getGroup(ouId: string, groupId: string): Promise<OrgUnitGroupResponse> {
        return apiClient.get<OrgUnitGroupResponse>(`${this.baseUrl}/${ouId}/groups/${groupId}`);
    }

    async deleteGroup(ouId: string, groupId: string): Promise<void> {
        return apiClient.delete<void>(`${this.baseUrl}/${ouId}/groups/${groupId}`);
    }

    async setGroupLeader(ouId: string, groupId: string, leaderUserId: string): Promise<OrgUnitGroupResponse> {
        return apiClient.put<OrgUnitGroupResponse>(`${this.baseUrl}/${ouId}/groups/${groupId}/leader?leaderUserId=${leaderUserId}`, {});
    }

    async getGroupMembers(
        ouId: string,
        groupId: string,
        params?: { query?: string; page?: number; size?: number; sort?: string; direction?: string }
    ): Promise<PageResponse<GroupMemberResponse>> {
        const queryParams = new URLSearchParams();
        if (params?.query) queryParams.append('query', params.query);
        if (params?.page !== undefined) queryParams.append('page', params.page.toString());
        if (params?.size !== undefined) queryParams.append('size', params.size.toString());
        if (params?.sort) queryParams.append('sort', params.sort);
        if (params?.direction) queryParams.append('direction', params.direction);
        
        const queryString = queryParams.toString();
        const url = `${this.baseUrl}/${ouId}/groups/${groupId}/members` + (queryString ? `?${queryString}` : '');
        return apiClient.get<PageResponse<GroupMemberResponse>>(url);
    }

    async addGroupMember(ouId: string, groupId: string, userId: string, role: string = 'MEMBER'): Promise<GroupMemberResponse> {
        return apiClient.post<GroupMemberResponse>(`${this.baseUrl}/${ouId}/groups/${groupId}/members?userId=${userId}&role=${role}`, {});
    }

    async removeGroupMember(ouId: string, groupId: string, userId: string): Promise<void> {
        return apiClient.delete<void>(`${this.baseUrl}/${ouId}/groups/${groupId}/members/${userId}`);
    }

    // ==================== Reference Data (Types) ====================

    async getOrgUnitTypes(activeOnly: boolean = false): Promise<OrgUnitTypeResponse[]> {
        return apiClient.get<OrgUnitTypeResponse[]>(`/api/v1/admin/reference/org-unit-types?activeOnly=${activeOnly}`);
    }

    async getOrgUnitType(id: string): Promise<OrgUnitTypeResponse> {
        return apiClient.get<OrgUnitTypeResponse>(`/api/v1/admin/reference/org-unit-types/${id}`);
    }

    async getAllowedChildren(parentId: string): Promise<OrgUnitTypeResponse[]> {
        return apiClient.get<OrgUnitTypeResponse[]>(`/api/v1/admin/reference/org-unit-types/${parentId}/allowed-children`);
    }

    async createOrgUnitType(data: any): Promise<OrgUnitTypeResponse> {
        return apiClient.post<OrgUnitTypeResponse>('/api/v1/admin/reference/org-unit-types', data);
    }

    async updateOrgUnitType(id: string, data: any): Promise<OrgUnitTypeResponse> {
        return apiClient.put<OrgUnitTypeResponse>(`/api/v1/admin/reference/org-unit-types/${id}`, data);
    }

    async deleteOrgUnitType(id: string): Promise<void> {
        return apiClient.delete<void>(`/api/v1/admin/reference/org-unit-types/${id}`);
    }

    // Operational Group Types
    async getOrgUnitGroupTypes(activeOnly: boolean = false): Promise<OrgUnitGroupTypeResponse[]> {
        return apiClient.get<OrgUnitGroupTypeResponse[]>(`/api/v1/admin/reference/org-unit-group-types?activeOnly=${activeOnly}`);
    }

    async getOrgUnitGroupType(id: string): Promise<OrgUnitGroupTypeResponse> {
        return apiClient.get<OrgUnitGroupTypeResponse>(`/api/v1/admin/reference/org-unit-group-types/${id}`);
    }

    async createOrgUnitGroupType(data: any): Promise<OrgUnitGroupTypeResponse> {
        return apiClient.post<OrgUnitGroupTypeResponse>('/api/v1/admin/reference/org-unit-group-types', data);
    }

    async updateOrgUnitGroupType(id: string, data: any): Promise<OrgUnitGroupTypeResponse> {
        return apiClient.put<OrgUnitGroupTypeResponse>(`/api/v1/admin/reference/org-unit-group-types/${id}`, data);
    }

    async deleteOrgUnitGroupType(id: string): Promise<void> {
        return apiClient.delete<void>(`/api/v1/admin/reference/org-unit-group-types/${id}`);
    }

    // Hierarchy Relations
    async getTypeRelations(): Promise<TypeRelation[]> {
        return apiClient.get<TypeRelation[]>('/api/v1/admin/reference/org-unit-types/relations');
    }

    async addTypeRelation(parentTypeId: string, childTypeId: string): Promise<TypeRelation> {
        return apiClient.post<TypeRelation>('/api/v1/admin/reference/org-unit-types/relations', { parentTypeId, childTypeId });
    }

    async removeTypeRelation(parentTypeId: string, childTypeId: string): Promise<void> {
        return apiClient.delete<void>(`/api/v1/admin/reference/org-unit-types/relations/${parentTypeId}/${childTypeId}`);
    }

    // ==================== Leadership & Scoped Roles ====================

    async getLeadership(ouId: string): Promise<LeadershipAssignmentDto[]> {
        return apiClient.get<LeadershipAssignmentDto[]>(`${this.baseUrl}/${ouId}/leadership`);
    }

    async getHeadScopedRoles(ouId: string): Promise<ScopedRoleAssignmentDto[]> {
        return apiClient.get<ScopedRoleAssignmentDto[]>(`${this.baseUrl}/${ouId}/scoped-roles`);
    }

    async getAvailableScopedRoles(ouId: string): Promise<ScopedRoleDto[]> {
        return apiClient.get<ScopedRoleDto[]>(`${this.baseUrl}/${ouId}/scoped-roles/available`);
    }

    async grantScopedRole(ouId: string, roleCode: string, reason?: string): Promise<ScopedRoleAssignmentDto> {
        return apiClient.post<ScopedRoleAssignmentDto>(`${this.baseUrl}/${ouId}/scoped-roles`, {
            roleCode,
            reason: reason || 'Granted via admin UI'
        });
    }

    async revokeScopedRole(ouId: string, roleCode: string): Promise<void> {
        return apiClient.delete<void>(`${this.baseUrl}/${ouId}/scoped-roles/${roleCode}`);
    }
}

// ==================== Scoped Role Types ====================

export interface LeadershipAssignmentDto {
    id: string;
    userId: string;
    userDisplayName: string | null;
    userUsername: string | null;
    userImageUrl: string | null;
    leadershipRole: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    status: string;
}

export interface ScopedRoleAssignmentDto {
    id: string;
    roleCode: string;
    roleName: string;
    roleDescription: string | null;
    isDefault: boolean;
    status: string;
    grantedBy: string | null;
    grantedByDisplayName: string | null;
    effectiveFrom: string;
    effectiveTo: string | null;
    assignmentReason: string | null;
    source: string;
}

export interface ScopedRoleDto {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    isDefault: boolean;
    permissionKeys: string[];
}

export const orgUnitService = new OrgUnitService();

