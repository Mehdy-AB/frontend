import axios, { AxiosResponse } from 'axios';
import { UserDto } from '@/types/api';

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    imageUrl?: string;
    roles: string[];
    permissions: string[];
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

class AuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  }

  /**
   * Authenticate user with username and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<any> = await axios.post(
      `${this.baseURL}/api/v1/auth/login`,
      credentials,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    // Normalize response to handle both camelCase and snake_case
    const data = response.data;
    
    return {
      accessToken: data.access_token || data.accessToken,
      refreshToken: data.refresh_token || data.refreshToken,
      tokenType: data.token_type || data.tokenType || 'Bearer',
      expiresIn: data.expires_in || data.expiresIn || 900,
      user: {
        id: data.user?.id || '',
        username: data.user?.username || '',
        email: data.user?.email || '',
        displayName: data.user?.displayName || data.user?.display_name || '',
        firstName: data.user?.firstName || data.user?.first_name,
        lastName: data.user?.lastName || data.user?.last_name,
        jobTitle: data.user?.jobTitle || data.user?.job_title,
        imageUrl: data.user?.imageUrl || data.user?.image_url,
        roles: data.user?.roles || [],
        permissions: data.user?.permissions || [],
      },
    };
  }

  /**
   * Refresh access token using refresh token
   * Note: Refresh token should be sent as a cookie by the browser
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    // The backend expects the refresh token as a cookie or in the URL params
    // If refreshToken is provided as string, we send it as a query parameter
    const url = new URL(`${this.baseURL}/api/v1/auth/refresh`);
    if (refreshToken) {
      url.searchParams.append('refresh_token', refreshToken);
    }
    
    const response: AxiosResponse<any> = await axios.post(
      url.toString(),
      {}, // Empty body since token is in URL params
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true, // Important: Send cookies
      }
    );
    
    // Normalize response
    const data = response.data;
    
    return {
      accessToken: data.access_token || data.accessToken,
      refreshToken: data.refresh_token || data.refreshToken,
      tokenType: data.token_type || data.tokenType || 'Bearer',
      expiresIn: data.expires_in || data.expiresIn || 900,
    };
  }

  /**
   * Logout user (invalidate tokens)
   */
  async logout(accessToken: string): Promise<void> {
    await axios.post(
      `${this.baseURL}/api/v1/auth/logout`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(accessToken: string): Promise<UserDto> {
    const response: AxiosResponse<UserDto> = await axios.get(
      `${this.baseURL}/api/v1/auth/me`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Change user password
   */
  async changePassword(
    accessToken: string,
    passwordData: ChangePasswordRequest
  ): Promise<void> {
    await axios.put(
      `${this.baseURL}/api/v1/auth/change-password`,
      passwordData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await axios.post(
      `${this.baseURL}/api/v1/auth/forgot-password`,
      { email },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetData: ResetPasswordRequest): Promise<void> {
    await axios.post(
      `${this.baseURL}/api/v1/auth/reset-password`,
      resetData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    await axios.post(
      `${this.baseURL}/api/v1/auth/verify-email`,
      { token },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(accessToken: string): Promise<void> {
    await axios.post(
      `${this.baseURL}/api/v1/auth/resend-verification`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Check if token is valid
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.getCurrentUser(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
