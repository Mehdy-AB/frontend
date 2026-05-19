import { apiClient } from '../client';

export interface LdapServerDto {
    id: string;
    name: string;
    serverType?: string;
    description?: string;
    hostname: string;
    port: number;
    sslPort: number;
    useSSL: boolean;
    useTLS: boolean;
    baseDn: string;
    bindDn?: string;
    connectionTimeout: number;
    searchTimeout: number;
    userFilter: string;
    groupFilter: string;
    attributeMappings: Record<string, string>;
    enabled: boolean;
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'TESTING' | 'MAINTENANCE' | 'UNKNOWN';
    userCount: number;
    groupCount: number;
    syncCount: number;
    errorCount: number;
    lastError?: string;
    lastSync?: string;
    lastTest?: string;
    createdAt: string;
    updatedAt: string;
    createdByName?: string;
    // Sync scheduling
    syncSchedule: string;
    autoDisableUsers: boolean;
    nextSyncAt?: string;
    syncManagers?: boolean;
    syncDepartment?: boolean;
    managerAttribute?: string;
    departmentAttribute?: string;
    // Enterprise
    deletionThresholdPercent?: number;
    resolveNestedGroups?: boolean;
    jitProvisioning?: boolean;
    immutableIdAttribute?: string;
    fieldOwnership?: Record<string, string>;
}

export interface CreateLdapServerRequest {
    name: string;
    serverType?: string;
    description?: string;
    hostname: string;
    port?: number;
    sslPort?: number;
    useSSL?: boolean;
    useTLS?: boolean;
    baseDn: string;
    bindDn?: string;
    bindPassword?: string;
    connectionTimeout?: number;
    searchTimeout?: number;
    userFilter?: string;
    groupFilter?: string;
    attributeMappings?: Record<string, string>;
    enabled?: boolean;
    // Sync scheduling
    syncSchedule?: string;
    autoDisableUsers?: boolean;
    syncManagers?: boolean;
    syncDepartment?: boolean;
    managerAttribute?: string;
    departmentAttribute?: string;
    // Enterprise
    deletionThresholdPercent?: number;
    resolveNestedGroups?: boolean;
    jitProvisioning?: boolean;
    immutableIdAttribute?: string;
    fieldOwnership?: Record<string, string>;
}

export interface UpdateLdapServerRequest extends CreateLdapServerRequest { }

export interface TestConnectionResponse {
    success: boolean;
    message: string;
    testedAt?: string;
}

export interface LdapSyncResult {
    success: boolean;
    imported: number;
    updated: number;
    disabled: number;
    errors: number;
    errorMessage?: string;
    errorDetails: string[];
}

export interface LdapStatistics {
    totalServers: number;
    enabledServers: number;
    connectedServers: number;
    totalLdapUsers: number;
    totalSyncs: number;
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

// ── OrgUnit Mapping Types ──

export interface DepartmentOrgUnitMappingDto {
    departmentValue: string;
    orgUnitId: string;
    orgUnitName?: string;
    orgUnitCode?: string;
    isPrimary: boolean;
}

export interface GroupOrgUnitMappingDto {
    ldapGroupDn: string;
    ldapGroupName: string;
    orgUnitId: string;
    orgUnitName?: string;
    orgUnitCode?: string;
    isPrimary: boolean;
}

export interface OrgUnitSearchResult {
    id: string;
    name: string;
    code: string;
    typeName?: string;
    parentId?: string;
    parentName?: string;
    level: number;
}

class LdapServerService {
    private readonly basePath = '/api/v1/admin/ldap-servers';

    async getServers(page = 0, size = 20, search?: string): Promise<PageResponse<LdapServerDto>> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('size', size.toString());
        if (search) {
            params.append('search', search);
        }
        return apiClient.get<PageResponse<LdapServerDto>>(
            `${this.basePath}?${params.toString()}`
        );
    }

    async getServerById(id: string): Promise<LdapServerDto> {
        return apiClient.get<LdapServerDto>(`${this.basePath}/${id}`);
    }

    async createServer(request: CreateLdapServerRequest): Promise<LdapServerDto> {
        return apiClient.post<LdapServerDto>(this.basePath, request);
    }

    async updateServer(id: string, request: UpdateLdapServerRequest): Promise<LdapServerDto> {
        return apiClient.put<LdapServerDto>(`${this.basePath}/${id}`, request);
    }

    async deleteServer(id: string): Promise<void> {
        await apiClient.delete(`${this.basePath}/${id}`);
    }

    async toggleServer(id: string, enabled: boolean): Promise<LdapServerDto> {
        return apiClient.patch<LdapServerDto>(
            `${this.basePath}/${id}/toggle?enabled=${enabled}`
        );
    }

    async testConnection(id: string): Promise<TestConnectionResponse> {
        return apiClient.post<TestConnectionResponse>(`${this.basePath}/${id}/test`);
    }

    async testConnectionWithParams(params: {
        hostname: string;
        port?: number;
        sslPort?: number;
        useSSL?: boolean;
        useTLS?: boolean;
        baseDn: string;
        bindDn?: string;
        bindPassword?: string;
        connectionTimeout?: number;
    }): Promise<TestConnectionResponse> {
        return apiClient.post<TestConnectionResponse>(`${this.basePath}/test-connection`, params);
    }

    async syncUsers(id: string, mode: 'FULL' | 'INCREMENTAL' | 'DRY_RUN' = 'FULL'): Promise<LdapSyncResult> {
        return apiClient.post<LdapSyncResult>(`${this.basePath}/${id}/sync?mode=${mode}`);
    }

    async getStatistics(): Promise<LdapStatistics> {
        return apiClient.get<LdapStatistics>(`${this.basePath}/statistics`);
    }

    async getEnabledServers(): Promise<LdapServerDto[]> {
        return apiClient.get<LdapServerDto[]>(`${this.basePath}/enabled`);
    }

    // ── LDAP Group & Role Mapping ──

    async fetchLdapGroups(serverId: string): Promise<{ dn: string; name: string }[]> {
        return apiClient.get<{ dn: string; name: string }[]>(`${this.basePath}/${serverId}/ldap-groups`);
    }

    async searchLdapGroups(serverId: string, query: string, limit: number = 15): Promise<{ dn: string; name: string }[]> {
        return apiClient.get<{ dn: string; name: string }[]>(
            `${this.basePath}/${serverId}/ldap-groups/search?query=${encodeURIComponent(query)}&limit=${limit}`
        );
    }

    async getGroupMappings(serverId: string): Promise<{
        defaultRoleName: string;
        mappings: { ldapGroupDn: string; ldapGroupName: string; roleId: string; roleName: string }[];
    }> {
        return apiClient.get(`${this.basePath}/${serverId}/group-mappings`);
    }

    async saveGroupMappings(serverId: string, data: {
        defaultRoleName: string;
        mappings: { ldapGroupDn: string; ldapGroupName: string; roleId: string; roleName?: string }[];
    }): Promise<{
        defaultRoleName: string;
        mappings: { ldapGroupDn: string; ldapGroupName: string; roleId: string; roleName: string }[];
    }> {
        return apiClient.put(`${this.basePath}/${serverId}/group-mappings`, data);
    }

    // ── LDAP Group → DMS Group Mapping ──

    async getGroupGroupMappings(serverId: string): Promise<{
        mappings: { ldapGroupDn: string; ldapGroupName: string; groupId: string; groupName: string }[];
    }> {
        return apiClient.get(`${this.basePath}/${serverId}/group-group-mappings`);
    }

    async saveGroupGroupMappings(serverId: string, data: {
        mappings: { ldapGroupDn: string; ldapGroupName: string; groupId: string; groupName?: string }[];
    }): Promise<{
        mappings: { ldapGroupDn: string; ldapGroupName: string; groupId: string; groupName: string }[];
    }> {
        return apiClient.put(`${this.basePath}/${serverId}/group-group-mappings`, data);
    }

    async fetchDmsGroups(): Promise<{ id: string; name: string }[]> {
        return apiClient.get<{ id: string; name: string }[]>('/api/v1/admin/groups/active');
    }

    // ── OrgUnit Mapping ──

    async searchLdapDepartments(serverId: string, query: string, limit: number = 15): Promise<string[]> {
        return apiClient.get<string[]>(`${this.basePath}/${serverId}/departments/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    }

    async searchOrgUnits(query: string, limit: number = 15): Promise<OrgUnitSearchResult[]> {
        return apiClient.get<OrgUnitSearchResult[]>(
            `${this.basePath}/org-units/search?query=${encodeURIComponent(query)}&limit=${limit}`
        );
    }

    async getDepartmentOrgUnitMappings(serverId: string): Promise<{
        mappings: DepartmentOrgUnitMappingDto[];
    }> {
        return apiClient.get(`${this.basePath}/${serverId}/department-orgunit-mappings`);
    }

    async saveDepartmentOrgUnitMappings(serverId: string, data: {
        mappings: DepartmentOrgUnitMappingDto[];
    }): Promise<{ mappings: DepartmentOrgUnitMappingDto[] }> {
        return apiClient.put(`${this.basePath}/${serverId}/department-orgunit-mappings`, data);
    }

    async getGroupOrgUnitMappings(serverId: string): Promise<{
        mappings: GroupOrgUnitMappingDto[];
    }> {
        return apiClient.get(`${this.basePath}/${serverId}/group-orgunit-mappings`);
    }

    async saveGroupOrgUnitMappings(serverId: string, data: {
        mappings: GroupOrgUnitMappingDto[];
    }): Promise<{ mappings: GroupOrgUnitMappingDto[] }> {
        return apiClient.put(`${this.basePath}/${serverId}/group-orgunit-mappings`, data);
    }

    // ── Enterprise: Sync History ──

    async getSyncHistory(serverId: string, params?: { page?: number; size?: number; status?: string; mode?: string; search?: string }): Promise<PageResponse<any>> {
        const query = new URLSearchParams();
        if (params?.page !== undefined) query.append('page', params.page.toString());
        if (params?.size !== undefined) query.append('size', params.size.toString());
        if (params?.status) query.append('status', params.status);
        if (params?.mode) query.append('mode', params.mode);
        if (params?.search) query.append('search', params.search);
        
        return apiClient.get(`${this.basePath}/${serverId}/sync-runs?${query.toString()}`);
    }

    async getLatestSyncRun(serverId: string): Promise<any | null> {
        try {
            return await apiClient.get(`${this.basePath}/${serverId}/sync-runs/latest`);
        } catch {
            return null;
        }
    }

    async getSyncRunById(serverId: string, runId: string): Promise<any> {
        return apiClient.get(`${this.basePath}/${serverId}/sync-runs/${runId}`);
    }

    // ── Enterprise: Identity Review ──

    async getIdentityReview(serverId: string, category = 'orphans', params?: { page?: number; size?: number; search?: string }): Promise<any> {
        const query = new URLSearchParams();
        query.append('category', category);
        if (params?.page !== undefined) query.append('page', params.page.toString());
        if (params?.size !== undefined) query.append('size', params.size.toString());
        if (params?.search) query.append('search', params.search);

        return apiClient.get(`${this.basePath}/${serverId}/identity-review?${query.toString()}`);
    }

    async relinkOrphan(serverId: string, userId: string, newExternalId: string): Promise<void> {
        return apiClient.post(`${this.basePath}/${serverId}/identity-review/${userId}/relink`, { newExternalId });
    }

    async convertToLocal(serverId: string, userId: string): Promise<void> {
        return apiClient.post(`${this.basePath}/${serverId}/identity-review/${userId}/convert-local`, {});
    }

    // ── Enterprise: Field Ownership ──

    async updateFieldOwnership(serverId: string, ownership: Record<string, string>): Promise<any> {
        return apiClient.put(`${this.basePath}/${serverId}/field-ownership`, ownership);
    }

    // ── Enterprise: Search Preview ──

    async getSearchPreview(serverId: string, limit = 10): Promise<any> {
        return apiClient.get(`${this.basePath}/${serverId}/search-preview?limit=${limit}`);
    }

    // ── Enterprise: Sync Dashboard ──

    async getSyncDashboard(days = 30): Promise<any> {
        return apiClient.get(`${this.basePath}/dashboard?days=${days}`);
    }

    // ── Enterprise: Dynamic User Fields ──

    async getUserFields(): Promise<{ value: string; label: string }[]> {
        return apiClient.get(`${this.basePath}/user-fields`);
    }
}

export const ldapServerService = new LdapServerService();
