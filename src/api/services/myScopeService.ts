import { apiClient } from '../client';
import type { OrgUnitMemberResponse, OrgUnitGroupResponse, OrgUnitResponse, GroupMemberResponse, OrgPositionResponse, PositionAssignmentResponse, CreateOrgUnitGroupRequest, UpdateOrgUnitGroupRequest } from './orgUnitService';

// ==================== Types ====================

export interface MyScopeUnitDto {
    orgUnitId: string;
    orgUnitName: string;
    orgUnitCode: string;
    orgUnitDescription: string | null;
    orgUnitTypeName: string | null;
    orgUnitTypeColor: string | null;
    leadershipRole: string;
    memberCount: number;
    childCount: number;
    resolvedPermissions: string[];
}

interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
}

// ==================== Service ====================

class MyScopeService {
    private baseUrl = '/api/v1/my-scope';

    // ==================== Units ====================

    async getMyUnits(): Promise<MyScopeUnitDto[]> {
        return apiClient.get<MyScopeUnitDto[]>(`${this.baseUrl}/units`);
    }

    async getMyUnit(ouId: string): Promise<MyScopeUnitDto> {
        return apiClient.get<MyScopeUnitDto>(`${this.baseUrl}/units/${ouId}`);
    }

    async hasLeadership(): Promise<boolean> {
        return apiClient.get<boolean>(`${this.baseUrl}/has-leadership`);
    }

    // ==================== Members ====================

    async getMyMembers(ouId: string): Promise<OrgUnitMemberResponse[]> {
        return apiClient.get<OrgUnitMemberResponse[]>(`${this.baseUrl}/units/${ouId}/members`);
    }

    async getMyMembersPaged(ouId: string, params: {
        query?: string; page?: number; size?: number; sort?: string; direction?: string;
    } = {}): Promise<PageResponse<OrgUnitMemberResponse>> {
        const p = new URLSearchParams();
        if (params.query) p.set('query', params.query);
        p.set('page', String(params.page ?? 0));
        p.set('size', String(params.size ?? 10));
        if (params.sort) p.set('sort', params.sort);
        if (params.direction) p.set('direction', params.direction);
        return apiClient.get<PageResponse<OrgUnitMemberResponse>>(
            `${this.baseUrl}/units/${ouId}/members?${p}`);
    }

    async addMember(ouId: string, userId: string): Promise<OrgUnitMemberResponse> {
        return apiClient.post<OrgUnitMemberResponse>(
            `${this.baseUrl}/units/${ouId}/members`, { userId });
    }

    async addMembersBatch(ouId: string, assignments: { userId: string }[]): Promise<OrgUnitMemberResponse[]> {
        return apiClient.post<OrgUnitMemberResponse[]>(
            `${this.baseUrl}/units/${ouId}/members/batch`, { assignments });
    }

    async removeMember(ouId: string, userId: string): Promise<void> {
        return apiClient.delete(`${this.baseUrl}/units/${ouId}/members/${userId}`);
    }

    async removeMembersBatch(ouId: string, userIds: string[]): Promise<void> {
        return apiClient.delete(`${this.baseUrl}/units/${ouId}/members/batch`, {
            data: { userIds },
        });
    }

    // ==================== Groups ====================

    async getMyGroups(ouId: string): Promise<OrgUnitGroupResponse[]> {
        return apiClient.get<OrgUnitGroupResponse[]>(`${this.baseUrl}/units/${ouId}/groups`);
    }

    async getMyGroupsPaged(ouId: string, params: {
        query?: string; groupTypeId?: string; isActive?: boolean;
        page?: number; size?: number; sort?: string; direction?: string;
    } = {}): Promise<PageResponse<OrgUnitGroupResponse>> {
        const p = new URLSearchParams();
        if (params.query) p.set('query', params.query);
        if (params.groupTypeId && params.groupTypeId !== 'ALL') p.set('groupTypeId', params.groupTypeId);
        if (params.isActive !== undefined) p.set('isActive', String(params.isActive));
        p.set('page', String(params.page ?? 0));
        p.set('size', String(params.size ?? 10));
        if (params.sort) p.set('sort', params.sort);
        if (params.direction) p.set('direction', params.direction);
        return apiClient.get<PageResponse<OrgUnitGroupResponse>>(
            `${this.baseUrl}/units/${ouId}/groups?${p}`);
    }

    async createGroup(ouId: string, request: CreateOrgUnitGroupRequest): Promise<OrgUnitGroupResponse> {
        return apiClient.post<OrgUnitGroupResponse>(
            `${this.baseUrl}/units/${ouId}/groups`, request);
    }

    async updateGroup(ouId: string, groupId: string, data: UpdateOrgUnitGroupRequest): Promise<OrgUnitGroupResponse> {
        return apiClient.put<OrgUnitGroupResponse>(
            `${this.baseUrl}/units/${ouId}/groups/${groupId}`, data);
    }

    async deleteGroup(ouId: string, groupId: string): Promise<void> {
        return apiClient.delete(`${this.baseUrl}/units/${ouId}/groups/${groupId}`);
    }

    async getGroupMembers(ouId: string, groupId: string): Promise<GroupMemberResponse[]> {
        return apiClient.get<GroupMemberResponse[]>(
            `${this.baseUrl}/units/${ouId}/groups/${groupId}/members`);
    }

    async getGroupMembersPaged(ouId: string, groupId: string, params: {
        query?: string; page?: number; size?: number;
    } = {}): Promise<PageResponse<GroupMemberResponse>> {
        const p = new URLSearchParams();
        if (params.query) p.set('query', params.query);
        p.set('page', String(params.page ?? 0));
        p.set('size', String(params.size ?? 10));
        return apiClient.get<PageResponse<GroupMemberResponse>>(
            `${this.baseUrl}/units/${ouId}/groups/${groupId}/members?${p}`);
    }

    async addGroupMember(ouId: string, groupId: string, userId: string): Promise<void> {
        return apiClient.post(
            `${this.baseUrl}/units/${ouId}/groups/${groupId}/members/${userId}`, {});
    }

    async removeGroupMember(ouId: string, groupId: string, userId: string): Promise<void> {
        return apiClient.delete(
            `${this.baseUrl}/units/${ouId}/groups/${groupId}/members/${userId}`);
    }

    async setGroupLeader(ouId: string, groupId: string, userId: string): Promise<void> {
        return apiClient.put(
            `${this.baseUrl}/units/${ouId}/groups/${groupId}/leader/${userId}`, {});
    }

    // ==================== Positions ====================

    async getMyPositions(ouId: string, params: {
        search?: string; isActive?: boolean; isBudgetApproved?: boolean;
        page?: number; size?: number; sort?: string; direction?: string;
    } = {}): Promise<PageResponse<OrgPositionResponse>> {
        const p = new URLSearchParams();
        if (params.search) p.set('search', params.search);
        if (params.isActive !== undefined) p.set('isActive', String(params.isActive));
        if (params.isBudgetApproved !== undefined) p.set('isBudgetApproved', String(params.isBudgetApproved));
        p.set('page', String(params.page ?? 0));
        p.set('size', String(params.size ?? 10));
        if (params.sort) p.set('sort', params.sort);
        if (params.direction) p.set('direction', params.direction);
        return apiClient.get<PageResponse<OrgPositionResponse>>(
            `${this.baseUrl}/units/${ouId}/positions?${p}`);
    }

    async createPosition(ouId: string, data: import('./orgUnitService').CreateOrgPositionRequest, force?: boolean): Promise<OrgPositionResponse> {
        const url = force ? `${this.baseUrl}/units/${ouId}/positions?force=true` : `${this.baseUrl}/units/${ouId}/positions`;
        return apiClient.post<OrgPositionResponse>(url, data);
    }

    async updatePosition(ouId: string, positionId: string, data: import('./orgUnitService').UpdateOrgPositionRequest): Promise<OrgPositionResponse> {
        return apiClient.put<OrgPositionResponse>(`${this.baseUrl}/units/${ouId}/positions/${positionId}`, data);
    }

    async deletePosition(ouId: string, positionId: string): Promise<void> {
        return apiClient.delete<void>(`${this.baseUrl}/units/${ouId}/positions/${positionId}`);
    }

    async deletePositionsBatch(ouId: string, positionIds: string[]): Promise<void> {
        return apiClient.delete<void>(`${this.baseUrl}/units/${ouId}/positions/batch`, {
            data: { positionIds }
        } as any);
    }

    async getPositionAssignments(ouId: string, positionId: string, params: {
        search?: string; assignmentType?: string; isPrimary?: boolean;
        page?: number; size?: number; sort?: string; direction?: string;
    } = {}): Promise<any> {
        const p = new URLSearchParams();
        if (params.search) p.set('search', params.search);
        if (params.assignmentType) p.set('assignmentType', params.assignmentType);
        if (params.isPrimary !== undefined) p.set('isPrimary', String(params.isPrimary));
        if (params.page !== undefined) p.set('page', String(params.page));
        p.set('size', String(params.size ?? 10));
        if (params.sort) p.set('sort', params.sort);
        if (params.direction) p.set('direction', params.direction);
        return apiClient.get(`${this.baseUrl}/units/${ouId}/positions/${positionId}/assignments?${p}`);
    }

    async assignUsersToPosition(ouId: string, positionId: string, request: {
        userIds: string[]; isPrimary?: boolean; effectiveFrom?: string; effectiveTo?: string;
        assignmentType?: string; ftePercentage?: number;
    }): Promise<PositionAssignmentResponse[]> {
        return apiClient.post<PositionAssignmentResponse[]>(
            `${this.baseUrl}/units/${ouId}/positions/${positionId}/assignments`, request);
    }

    async updatePositionAssignment(ouId: string, positionId: string, assignmentId: string,
        request: { isPrimary?: boolean; effectiveFrom?: string; effectiveTo?: string; assignmentType?: string; ftePercentage?: number }): Promise<PositionAssignmentResponse> {
        return apiClient.put<PositionAssignmentResponse>(
            `${this.baseUrl}/units/${ouId}/positions/${positionId}/assignments/${assignmentId}`, request);
    }

    async batchUnassignFromPosition(ouId: string, positionId: string, assignmentIds: string[]): Promise<void> {
        return apiClient.delete(
            `${this.baseUrl}/units/${ouId}/positions/${positionId}/assignments/batch`, {
                data: { assignmentIds },
            });
    }

    // ==================== Children & Descendants ====================

    async getMyChildren(ouId: string): Promise<OrgUnitResponse[]> {
        return apiClient.get<OrgUnitResponse[]>(`${this.baseUrl}/units/${ouId}/children`);
    }

    async getMyDescendants(ouId: string): Promise<OrgUnitResponse[]> {
        return apiClient.get<OrgUnitResponse[]>(`${this.baseUrl}/units/${ouId}/descendants`);
    }

    async getChildMembers(ouId: string, childId: string): Promise<OrgUnitMemberResponse[]> {
        return apiClient.get<OrgUnitMemberResponse[]>(
            `${this.baseUrl}/units/${ouId}/children/${childId}/members`);
    }

    async getChildMembersPaged(ouId: string, childId: string, params: {
        query?: string; page?: number; size?: number; sort?: string; direction?: string;
    } = {}): Promise<PageResponse<OrgUnitMemberResponse>> {
        const p = new URLSearchParams();
        if (params.query) p.set('query', params.query);
        p.set('page', String(params.page ?? 0));
        p.set('size', String(params.size ?? 10));
        if (params.sort) p.set('sort', params.sort);
        if (params.direction) p.set('direction', params.direction);
        return apiClient.get<PageResponse<OrgUnitMemberResponse>>(
            `${this.baseUrl}/units/${ouId}/children/${childId}/members?${p}`);
    }

    async addChildMember(ouId: string, childId: string, userId: string): Promise<OrgUnitMemberResponse> {
        return apiClient.post<OrgUnitMemberResponse>(
            `${this.baseUrl}/units/${ouId}/children/${childId}/members`, { userId });
    }

    async addChildMembersBatch(ouId: string, childId: string, assignments: { userId: string }[]): Promise<OrgUnitMemberResponse[]> {
        return apiClient.post<OrgUnitMemberResponse[]>(
            `${this.baseUrl}/units/${ouId}/children/${childId}/members/batch`, { assignments });
    }

    async removeChildMember(ouId: string, childId: string, userId: string): Promise<void> {
        return apiClient.delete(`${this.baseUrl}/units/${ouId}/children/${childId}/members/${userId}`);
    }

    async removeChildMembersBatch(ouId: string, childId: string, userIds: string[]): Promise<void> {
        return apiClient.delete(`${this.baseUrl}/units/${ouId}/children/${childId}/members/batch`, {
            data: { userIds },
        });
    }

    async setChildHead(ouId: string, childId: string, headUserId: string): Promise<OrgUnitResponse> {
        return apiClient.put<OrgUnitResponse>(
            `${this.baseUrl}/units/${ouId}/children/${childId}/head`, { headUserId });
    }
}

export const myScopeService = new MyScopeService();
