import { apiClient } from '../client';

export interface UpdateProfileRequest {
  displayName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  jobTitle?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserProfileResponse {
  id: string;
  username: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  imageUrl?: string;
  profilePhotoUrl?: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

class ProfileService {
  private readonly baseUrl = '/api/v1/profile';

  /**
   * Get current user's profile
   */
  async getCurrentProfile(): Promise<UserProfileResponse> {
    return await apiClient.get<UserProfileResponse>(this.baseUrl);
  }

  /**
   * Update current user's profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfileResponse> {
    return await apiClient.put<UserProfileResponse>(this.baseUrl, data);
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(`${this.baseUrl}/change-password`, data);
  }

  /**
   * Upload profile photo
   */
  async uploadProfilePhoto(file: File): Promise<UserProfileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return await apiClient.post<UserProfileResponse>(
      `${this.baseUrl}/photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  /**
   * Delete profile photo
   */
  async deleteProfilePhoto(): Promise<UserProfileResponse> {
    return await apiClient.delete<UserProfileResponse>(`${this.baseUrl}/photo`);
  }

  /**
   * Get profile photo URL for a specific user
   */
  async getUserProfilePhotoUrl(userId: string): Promise<string | null> {
    try {
      const response = await apiClient.get<{ photoUrl: string | null }>(`${this.baseUrl}/photo/${userId}`);
      return response.photoUrl;
    } catch (error) {
      console.error('Failed to get profile photo URL:', error);
      return null;
    }
  }
}

export const profileService = new ProfileService();

