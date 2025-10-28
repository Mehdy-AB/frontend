import { apiClient } from '../client';
import {
  UserDto,
  CreateUserRequest,
  UpdateUserRequest,
  PageResponse,
  SearchFields,
  SortFieldsUser,
  UserStatus,
} from '../../types/api';

export class UserManagementService {
  private baseUrl = '/api/v1/admin/users';

  // Get all users with pagination
  async getUsers(
    page: number = 0,
    size: number = 20,
    sortBy?: SortFieldsUser,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<UserDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy || SortFieldsUser.USERNAME,
      sortDirection,
    });

    return apiClient.get<PageResponse<UserDto>>(`${this.baseUrl}?${params}`);
  }

  // Search users
  async searchUsers(
    query: string,
    searchFields?: SearchFields[],
    page: number = 0,
    size: number = 20,
    sortBy?: SortFieldsUser,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<UserDto>> {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy || SortFieldsUser.USERNAME,
      sortDirection,
    });

    if (searchFields && searchFields.length > 0) {
      searchFields.forEach(field => params.append('searchFields', field));
    }

    return apiClient.get<PageResponse<UserDto>>(`${this.baseUrl}/search?${params}`);
  }

  // Get user by ID
  async getUserById(userId: string): Promise<UserDto> {
    return apiClient.get<UserDto>(`${this.baseUrl}/${userId}`);
  }

  // Create new user
  async createUser(userData: CreateUserRequest): Promise<UserDto> {
    return apiClient.post<UserDto>(this.baseUrl, userData);
  }

  // Update user
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<UserDto> {
    return apiClient.put<UserDto>(`${this.baseUrl}/${userId}`, userData);
  }

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${userId}`);
  }

  // Enable/disable user
  async updateUserStatus(userId: string, enabled: boolean): Promise<UserDto> {
    return apiClient.patch<UserDto>(`${this.baseUrl}/${userId}/status`, { enabled });
  }

  // Get users by status
  async getUsersByStatus(
    status: UserStatus,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<UserDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<UserDto>>(`${this.baseUrl}/status/${status}?${params}`);
  }

  // Get user statistics
  async getUserStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersByRole: Record<string, number>;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  // Bulk operations
  async bulkUpdateUserStatus(userIds: string[], enabled: boolean): Promise<void> {
    return apiClient.patch<void>(`${this.baseUrl}/bulk/status`, {
      userIds,
      enabled,
    });
  }

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/bulk`, {
      data: { userIds },
    });
  }

  // ==== USER ROLES & GROUPS ====

  // Get available roles for user (not already assigned)
  async getAvailableRolesForUser(
    userId: string,
    params: { page: number; size: number; search?: string }
  ): Promise<PageResponse<any>> {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      size: params.size.toString(),
    });
    if (params.search) {
      queryParams.set('search', params.search);
    }
    return apiClient.get(`${this.baseUrl}/${userId}/available-roles?${queryParams}`);
  }

  // Get available groups for user (not already assigned)
  async getAvailableGroupsForUser(
    userId: string,
    params: { page: number; size: number; search?: string }
  ): Promise<PageResponse<any>> {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      size: params.size.toString(),
    });
    if (params.search) {
      queryParams.set('search', params.search);
    }
    return apiClient.get(`${this.baseUrl}/${userId}/available-groups?${queryParams}`);
  }

  // Get user's groups
  async getUserGroups(
    userId: string,
    params: { page: number; size: number; search?: string }
  ): Promise<PageResponse<any>> {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      size: params.size.toString(),
    });
    if (params.search) {
      queryParams.set('search', params.search);
    }
    return apiClient.get(`${this.baseUrl}/${userId}/groups?${queryParams}`);
  }

  // ==== USER SESSIONS ====

  // Get user's active sessions
  async getUserSessions(userId: string): Promise<any[]> {
    return apiClient.get(`${this.baseUrl}/${userId}/sessions`);
  }

  // Revoke a specific session
  async revokeUserSession(userId: string, sessionId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/${userId}/sessions/${sessionId}`);
  }

  // Revoke all user sessions
  async revokeAllUserSessions(userId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/${userId}/sessions`);
  }

  // ==== PASSWORD MANAGEMENT ====

  // Reset user password
  async resetUserPassword(userId: string): Promise<{
    message: string;
    temporaryPassword: string;
    note: string;
  }> {
    return apiClient.post(`${this.baseUrl}/${userId}/reset-password`, {});
  }

  // ==== USER STATISTICS ====

  // Get detailed user statistics
  async getUserStatisticsById(userId: string): Promise<{
    userId: string;
    username: string;
    displayName: string;
    createdAt: string;
    lastLogin: string;
    rolesCount: number;
    groupsCount: number;
    activeSessionsCount: number;
    status: string;
    emailVerified: boolean;
  }> {
    return apiClient.get(`${this.baseUrl}/${userId}/statistics`);
  }
}

export const userManagementService = new UserManagementService();

