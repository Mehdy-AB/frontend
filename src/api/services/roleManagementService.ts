import { apiClient } from '../client';
import {
  RoleDto,
  PermissionDto,
  CreateRoleRequest,
  UpdateRoleRequest,
  PageResponse,
  UserDto,
} from '../../types/api';

export class RoleManagementService {
  private baseUrl = '/api/v1/admin/roles';

  // Get all roles with pagination
  async getRoles(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'name',
    sortDirection: 'asc' | 'desc' = 'asc',
    name?: string
  ): Promise<PageResponse<RoleDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });
    
    if (name) {
      params.append('name', name);
    }

    return apiClient.get<PageResponse<RoleDto>>(`${this.baseUrl}?${params}`);
  }

  // Get role by ID
  async getRoleById(roleId: string): Promise<RoleDto> {
    return apiClient.get<RoleDto>(`${this.baseUrl}/${roleId}`);
  }

  // Create new role
  async createRole(roleData: CreateRoleRequest): Promise<RoleDto> {
    return apiClient.post<RoleDto>(this.baseUrl, roleData);
  }

  // Update role
  async updateRole(roleId: string, roleData: UpdateRoleRequest): Promise<RoleDto> {
    return apiClient.put<RoleDto>(`${this.baseUrl}/${roleId}`, roleData);
  }

  // Delete role
  async deleteRole(roleId: string): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${roleId}`);
  }

  // Toggle role status (enable/disable)
  async toggleRoleStatus(roleId: string, enabled: boolean): Promise<RoleDto> {
    return apiClient.patch<RoleDto>(`${this.baseUrl}/${roleId}/toggle-status`, { enabled });
  }

  // Get all permissions
  async getAllPermissions(): Promise<PermissionDto[]> {
    return apiClient.get<PermissionDto[]>(`${this.baseUrl}/all-permissions`);
  }

  // Get permissions by category
  async getPermissionsByCategory(category: string): Promise<PermissionDto[]> {
    return apiClient.get<PermissionDto[]>(`/api/v1/permissions/category/${category}`);
  }

  // Assign permissions to role
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<RoleDto> {
    return apiClient.post<RoleDto>(`${this.baseUrl}/${roleId}/permissions`, {
      permissionIds,
    });
  }

  // Remove permissions from role
  async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<RoleDto> {
    return apiClient.delete<RoleDto>(`${this.baseUrl}/${roleId}/permissions`, {
      data: { permissionIds },
    });
  }

  // Get users with role (with optional search)
  async getUsersWithRole(
    roleId: string,
    page: number = 0,
    size: number = 20,
    search?: string
  ): Promise<PageResponse<UserDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    return apiClient.get<PageResponse<UserDto>>(`${this.baseUrl}/${roleId}/users?${params}`);
  }

  // Get users available for role assignment (users NOT in role, with optional search)
  async getAvailableUsersForRole(
    roleId: string,
    page: number = 0,
    size: number = 20,
    search?: string
  ): Promise<PageResponse<UserDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    return apiClient.get<PageResponse<UserDto>>(`${this.baseUrl}/${roleId}/available-users?${params}`);
  }

  // Assign role to users
  async assignRoleToUsers(roleId: string, userIds: string[]): Promise<void> {
    return apiClient.post<void>(`${this.baseUrl}/${roleId}/users`, { userIds });
  }

  // Remove role from users
  async removeRoleFromUsers(roleId: string, userIds: string[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${roleId}/users`, {
      data: { userIds },
    });
  }

  // Get role statistics
  async getRoleStatistics(): Promise<{
    totalRoles: number;
    rolesByPermission: Record<string, number>;
    usersByRole: Record<string, number>;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  // Clone role
  async cloneRole(roleId: string, newRoleName: string): Promise<RoleDto> {
    return apiClient.post<RoleDto>(`${this.baseUrl}/${roleId}/clone`, {
      name: newRoleName,
    });
  }

  // Bulk operations
  async bulkDeleteRoles(roleIds: string[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/bulk`, {
      data: { roleIds },
    });
  }
}

export const roleManagementService = new RoleManagementService();

