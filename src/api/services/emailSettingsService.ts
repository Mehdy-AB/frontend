/**
 * Email Settings API Service
 * Connects frontend to backend Email Configuration module
 */

import { apiClient, ApiError } from '@/api/client';

export type SecureType = 'NONE' | 'TLS' | 'SSL';

export interface EmailSettingsRequest {
  host: string;
  port: number;
  secureType: SecureType;
  username?: string;
  password?: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  isActive: boolean;
}

export interface EmailSettingsResponse {
  id: number;
  host: string;
  port: number;
  secureType: SecureType;
  username?: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  isActive: boolean;
  updatedAt: string;
}

export interface TestEmailRequest {
  targetEmail: string;
}

export interface TestEmailResponse {
  success: boolean;
  message: string;
}

const EMAIL_SETTINGS_BASE = '/api/v1/email/settings';

/**
 * Email Settings Service
 */
class EmailSettingsService {

  /**
   * Get current email settings
   */
  async getSettings(): Promise<EmailSettingsResponse | null> {
    try {
      console.debug('[EmailSettingsService] Fetching settings from:', EMAIL_SETTINGS_BASE);
      const result = await apiClient.get<EmailSettingsResponse>(EMAIL_SETTINGS_BASE);
      console.debug('[EmailSettingsService] Settings loaded successfully');
      return result;
    } catch (error: any) {
      // Log detailed error info
      console.error('[EmailSettingsService] Error fetching settings:', {
        status: error.status,
        message: error.message,
        data: error.data,
        url: error.url,
        isNetworkError: error.isNetworkError,
      });

      // Return null for 404 (no settings configured yet)
      if (error.status === 404) {
        console.debug('[EmailSettingsService] No settings found (404), returning null');
        return null;
      }
      throw error;
    }
  }

  /**
   * Update email settings
   */
  async updateSettings(settings: EmailSettingsRequest): Promise<EmailSettingsResponse> {
    console.debug('[EmailSettingsService] Updating settings:', settings.host);
    try {
      const result = await apiClient.put<EmailSettingsResponse>(EMAIL_SETTINGS_BASE, settings);
      console.debug('[EmailSettingsService] Settings updated successfully');
      return result;
    } catch (error: any) {
      console.error('[EmailSettingsService] Error updating settings:', {
        status: error.status,
        message: error.message,
        data: error.data,
      });
      throw error;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(targetEmail: string): Promise<TestEmailResponse> {
    console.debug('[EmailSettingsService] Sending test email to:', targetEmail);
    try {
      const result = await apiClient.post<TestEmailResponse>(`${EMAIL_SETTINGS_BASE}/test`, { targetEmail });
      console.debug('[EmailSettingsService] Test email result:', result);
      return result;
    } catch (error: any) {
      console.error('[EmailSettingsService] Error sending test email:', {
        status: error.status,
        message: error.message,
        data: error.data,
      });
      throw error;
    }
  }
}

export const emailSettingsService = new EmailSettingsService();
