import { notificationApiClient } from '../notificationClient';
import {
  GroupDto,
  GroupCreateReq,
  GroupUpdateReq,
  UserDto
} from '../../types/api';

export class GroupService {
  /**
   * Create a new group
   */
  static async createGroup(data: GroupCreateReq): Promise<GroupDto> {
    return notificationApiClient.createGroup(data);
  }

  /**
   * Get group by ID
   */
  static async getGroupById(id: string): Promise<GroupDto | null> {
    return notificationApiClient.getGroupById(id);
  }

  /**
   * Get group by path
   */
  static async getGroupByPath(path: string): Promise<GroupDto | null> {
    return notificationApiClient.getGroupByPath(path);
  }

  /**
   * Get all groups
   */
  static async getAllGroups(params: {
    page?: number;
    size?: number;
    query?: string;
    desc?: boolean;
  } = {}): Promise<GroupDto[]> {
    return notificationApiClient.getAllGroups(params);
  }

  /**
   * Update group
   */
  static async updateGroup(id: string, data: GroupUpdateReq): Promise<GroupDto> {
    return notificationApiClient.updateGroup(id, data);
  }

  /**
   * Delete group
   */
  static async deleteGroup(id: string): Promise<void> {
    return notificationApiClient.deleteGroup(id);
  }

  /**
   * Add user to group
   */
  static async addUserToGroup(groupId: string, userId: string): Promise<void> {
    return notificationApiClient.addUserToGroup(groupId, userId);
  }

  /**
   * Remove user from group
   */
  static async removeUserFromGroup(groupId: string, userId: string): Promise<void> {
    return notificationApiClient.removeUserFromGroup(groupId, userId);
  }

  /**
   * Get group members
   */
  static async getGroupMembers(groupId: string, params: {
    first?: number;
    max?: number;
  } = {}): Promise<UserDto[]> {
    return notificationApiClient.getGroupMembers(groupId, params);
  }

  /**
   * Add role to group
   */
  static async addRoleToGroup(groupId: string, role: string): Promise<void> {
    return notificationApiClient.addRoleToGroup(groupId, role);
  }

  /**
   * Remove role from group
   */
  static async removeRoleFromGroup(groupId: string, role: string): Promise<void> {
    return notificationApiClient.removeRoleFromGroup(groupId, role);
  }

  /**
   * Get group roles
   */
  static async getGroupRoles(groupId: string, params: {
    page?: number;
    size?: number;
  } = {}): Promise<string[]> {
    return notificationApiClient.getGroupRoles(groupId, params);
  }

  /**
   * Add permission to group
   */
  static async addPermissionToGroup(groupId: string, permission: string): Promise<void> {
    return notificationApiClient.addPermissionToGroup(groupId, permission);
  }

  /**
   * Remove permission from group
   */
  static async removePermissionFromGroup(groupId: string, permission: string): Promise<void> {
    return notificationApiClient.removePermissionFromGroup(groupId, permission);
  }

  /**
   * Get group permissions
   */
  static async getGroupPermissions(groupId: string, params: {
    page?: number;
    size?: number;
  } = {}): Promise<string[]> {
    return notificationApiClient.getGroupPermissions(groupId, params);
  }
}

export default GroupService;
