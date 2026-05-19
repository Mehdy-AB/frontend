import { apiClient } from '../client';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface SettingValue {
    value: string;
    type: string;
    description?: string;
    isSystem: boolean;
    updatedAt?: string;
}

export interface ServiceHealth {
    name: string;
    status: 'UP' | 'DOWN' | 'DEGRADED';
    responseTimeMs: number;
    lastCheckedAt: string;
    errorMessage?: string;
}

// ═══════════════════════════════════════════════════════════════
// Settings API
// ═══════════════════════════════════════════════════════════════

class SettingsService {
    private baseUrl = '/api/v1/settings';

    /** Get all settings grouped by category */
    async getAllSettings(): Promise<Record<string, Record<string, SettingValue>>> {
        return apiClient.get(this.baseUrl);
    }

    /** Get settings for a specific category */
    async getSettingsByCategory(category: string): Promise<Record<string, SettingValue>> {
        return apiClient.get(`${this.baseUrl}/${category}`);
    }

    /** 
     * Batch update settings.
     * Keys must be in format: "CATEGORY.setting.key"
     */
    async updateSettings(updates: Record<string, string>): Promise<Record<string, string>> {
        return apiClient.put(this.baseUrl, updates);
    }

    /** Reset a category to defaults */
    async resetToDefaults(category: string): Promise<{ status: string; category: string }> {
        return apiClient.post(`${this.baseUrl}/reset/${category}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // Service Health
    // ═══════════════════════════════════════════════════════════════

    /** Get all service health statuses (cached) */
    async getServiceHealth(): Promise<ServiceHealth[]> {
        return apiClient.get(`${this.baseUrl}/health`);
    }

    /** Force re-check all services */
    async triggerHealthCheck(): Promise<ServiceHealth[]> {
        return apiClient.post(`${this.baseUrl}/health/check`);
    }
}

export const settingsService = new SettingsService();
