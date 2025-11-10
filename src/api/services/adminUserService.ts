import { apiClient } from '../client';
import { UserDto } from '@/types/api';

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  // imageUrl is not updatable through this endpoint - use photo upload instead
}

export const adminUserService = {
  /**
   * Update user information (Admin only)
   */
  updateUser: async (userId: string, data: UpdateUserRequest): Promise<UserDto> => {
    return await apiClient.put<UserDto>(`/api/v1/admin/users/${userId}`, data);
  },

  /**
   * Upload profile photo for a user (Admin only)
   */
  uploadUserProfilePhoto: async (userId: string, file: File): Promise<UserDto> => {
    const formData = new FormData();
    formData.append('file', file);
    return await apiClient.post<UserDto>(`/api/v1/admin/users/${userId}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Delete profile photo for a user (Admin only)
   */
  deleteUserProfilePhoto: async (userId: string): Promise<void> => {
    await apiClient.delete<void>(`/api/v1/admin/users/${userId}/photo`);
  },
};

