import { notificationApiClient } from '../notificationClient';
import {
  RoleDto,
  RoleCreateReq,
  RoleUpdateReq,
  UserDto
} from '../../types/api';

export class RoleService {
  /**
   * Create a new role
   */
  static async createRole(data: RoleCreateReq): Promise<RoleDto> {
    return notificationApiClient.createRole(data);
  }

  /**
   * Get role by ID
   */
  static async getRoleById(id: string): Promise<RoleDto | null> {
    return notificationApiClient.getRoleById(id);
  }

  /**
   * Get all roles
   */
  static async getAllRoles(params: {
    page?: number;
    size?: number;
    query?: string;
    desc?: boolean;
  } = {}): Promise<RoleDto[]> {
    return notificationApiClient.getAllRoles(params);
  }

  /**
   * Update role
   */
  static async updateRole(id: string, data: RoleUpdateReq): Promise<RoleDto> {
    return notificationApiClient.updateRole(id, data);
  }

  /**
   * Delete role
   */
  static async deleteRole(id: string): Promise<void> {
    return notificationApiClient.deleteRole(id);
  }

  /**
   * Get users by role
   */
  static async getRoleUsers(roleName: string, params: {
    page?: number;
    size?: number;
  } = {}): Promise<UserDto[]> {
    return notificationApiClient.getRoleUsers(roleName, params);
  }

  /**
   * Assign role to user
   */
  static async assignRoleToUser(roleName: string, userId: string): Promise<void> {
    return notificationApiClient.assignRoleToUser(roleName, userId);
  }

  /**
   * Remove role from user
   */
  static async removeRoleFromUser(roleName: string, userId: string): Promise<void> {
    return notificationApiClient.removeRoleFromUser(roleName, userId);
  }

  /**
   * Assign permission to role
   */
  static async assignPermissionToRole(roleName: string, permission: string): Promise<void> {
    return notificationApiClient.assignPermissionToRole(roleName, permission);
  }

  /**
   * Remove permission from role
   */
  static async removePermissionFromRole(roleName: string, permission: string): Promise<void> {
    return notificationApiClient.removePermissionFromRole(roleName, permission);
  }

  /**
   * Get all available permissions
   */
  static async getAllPermissions(): Promise<string[]> {
    return notificationApiClient.getAllPermissions();
  }

  /**
   * Assign permission directly to user
   */
  static async assignPermissionToUser(userId: string, permission: string): Promise<void> {
    return notificationApiClient.assignPermissionToUser(userId, permission);
  }

  /**
   * Remove permission directly from user
   */
  static async removePermissionFromUser(userId: string, permission: string): Promise<void> {
    return notificationApiClient.removePermissionFromUser(userId, permission);
  }
}

export default RoleService;
