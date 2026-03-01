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

    async syncUsers(id: string): Promise<LdapSyncResult> {
        return apiClient.post<LdapSyncResult>(`${this.basePath}/${id}/sync`);
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
}

export const ldapServerService = new LdapServerService();
