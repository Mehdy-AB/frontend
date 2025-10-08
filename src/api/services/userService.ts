import { notificationApiClient } from '../notificationClient';
import {
  UserDto,
  FullUserDto,
  UserCreateReq,
  UserUpdateReq,
  SortFieldsUser,
  SearchFields
} from '../../types/api';

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(data: UserCreateReq, options?: any): Promise<FullUserDto> {
    return notificationApiClient.createUser(data, options);
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string, options?: any): Promise<FullUserDto | null> {
    return notificationApiClient.getUserById(id, options);
  }

  /**
   * Get all users with pagination and filtering
   */
  static async getAllUsers(params: {
    page?: number;
    size?: number;
    query?: string;
    desc?: boolean;
    sort?: SortFieldsUser;
    search?: SearchFields;
  } = {}, options?: any): Promise<UserDto[]> {
    return notificationApiClient.getAllUsers(params, options);
  }

  /**
   * Update user
   */
  static async updateUser(id: string, data: UserUpdateReq, options?: any): Promise<UserDto> {
    return notificationApiClient.updateUser(id, data, options);
  }

  /**
   * Delete user
   */
  static async deleteUser(id: string, options?: any): Promise<void> {
    return notificationApiClient.deleteUser(id, options);
  }
}

export default UserService;
