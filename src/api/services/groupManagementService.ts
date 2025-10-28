import { apiClient } from '../client';
import {
  GroupDto,
  CreateGroupRequest,
  UpdateGroupRequest,
  PageResponse,
  UserDto,
  RoleDto,
} from '../../types/api';

export class GroupManagementService {
  private baseUrl = '/api/v1/admin/groups';

  // Get all groups with pagination and optional search
  async getGroups(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'name',
    sortDirection: 'asc' | 'desc' = 'asc',
    name?: string
  ): Promise<PageResponse<GroupDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDirection}`,
    });
    
    if (name) {
      params.append('name', name);
    }

    return apiClient.get<PageResponse<GroupDto>>(`${this.baseUrl}?${params}`);
  }

  // Get group by ID
  async getGroupById(groupId: string): Promise<GroupDto> {
    return apiClient.get<GroupDto>(`${this.baseUrl}/${groupId}`);
  }

  // Create new group
  async createGroup(groupData: CreateGroupRequest): Promise<GroupDto> {
    return apiClient.post<GroupDto>(this.baseUrl, groupData);
  }

  // Update group
  async updateGroup(groupId: string, groupData: UpdateGroupRequest): Promise<GroupDto> {
    return apiClient.put<GroupDto>(`${this.baseUrl}/${groupId}`, groupData);
  }

  // Delete group
  async deleteGroup(groupId: string): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${groupId}`);
  }

  // Get users in group with optional search
  async getUsersInGroup(
    groupId: string,
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

    return apiClient.get<PageResponse<UserDto>>(`${this.baseUrl}/${groupId}/users?${params}`);
  }
  
  // Get users available for group assignment (users NOT in group)
  async getAvailableUsersForGroup(
    groupId: string,
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

    return apiClient.get<PageResponse<UserDto>>(`${this.baseUrl}/${groupId}/available-users?${params}`);
  }

  // Assign users to group
  async assignUsersToGroup(groupId: string, userIds: string[]): Promise<void> {
    return apiClient.post<void>(`${this.baseUrl}/${groupId}/users`, userIds);
  }

  // Remove users from group
  async removeUsersFromGroup(groupId: string, userIds: string[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${groupId}/users`, {
      data: userIds,
    });
  }

  // Get group statistics
  async getGroupStatistics(): Promise<{
    totalGroups: number;
    usersByGroup: Record<string, number>;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  // Bulk operations
  async bulkDeleteGroups(groupIds: string[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/bulk`, {
      data: { groupIds },
    });
  }

  // Search groups
  async searchGroups(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<GroupDto>> {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<GroupDto>>(`${this.baseUrl}/search?${params}`);
  }
}

export const groupManagementService = new GroupManagementService();

