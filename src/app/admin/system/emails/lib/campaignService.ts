/**
 * Email Campaign API Service
 * Handles campaign CRUD, sending, and recipient management
 */

import { apiClient } from '@/api/client';
import type {
    EmailCampaign,
    EmailCampaignStatus,
    EmailCampaignType,
    TargetType,
    CampaignFormData,
    CampaignActivity,
    CampaignStats,
} from '../lib/types';

// ============================================================================
// Types
// ============================================================================

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface CampaignPreviewRequest {
    recipientEmail?: string;
    variables?: Record<string, string>;
}

export interface CampaignPreviewResponse {
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    recipientEmail?: string;
    recipientName?: string;
}

export interface CampaignRecipient {
    id: number;
    email: string;
    displayName?: string;
    userId?: string;
    status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
    sentAt?: string;
    errorMessage?: string;
    emailLogId?: number;
    openCount?: number;
    clickCount?: number;
    openedAt?: string;
    firstClickedAt?: string;
}

export interface CampaignUser {
    id: string;
    name: string;
    email: string;
}

export interface CampaignRole {
    id: string;
    name: string;
    description?: string;
    userCount: number;
}

// ============================================================================
// API Constants
// ============================================================================

const CAMPAIGNS_BASE = '/api/v1/email/campaigns';

// ============================================================================
// Service
// ============================================================================

class CampaignService {

    // --------------------------------------------------------------------------
    // CRUD Operations
    // --------------------------------------------------------------------------

    async getCampaigns(
        page = 0,
        size = 20,
        search?: string,
        status?: EmailCampaignStatus,
        type?: EmailCampaignType,
        startDate?: string
    ): Promise<PageResponse<EmailCampaign>> {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });
        if (search) params.set('search', search);
        if (status) params.set('status', status);
        if (type) params.set('type', type);
        if (startDate) params.set('startDate', startDate);

        return apiClient.get<PageResponse<EmailCampaign>>(`${CAMPAIGNS_BASE}?${params}`);
    }

    async getCampaign(id: string): Promise<EmailCampaign> {
        return apiClient.get<EmailCampaign>(`${CAMPAIGNS_BASE}/${id}`);
    }

    async createCampaign(data: CampaignFormData): Promise<EmailCampaign> {
        const request = this.mapFormDataToRequest(data);
        return apiClient.post<EmailCampaign>(CAMPAIGNS_BASE, request);
    }

    async updateCampaign(id: string, data: CampaignFormData): Promise<EmailCampaign> {
        const request = this.mapFormDataToRequest(data);
        return apiClient.put<EmailCampaign>(`${CAMPAIGNS_BASE}/${id}`, request);
    }

    async deleteCampaign(id: string): Promise<void> {
        return apiClient.delete(`${CAMPAIGNS_BASE}/${id}`);
    }

    // --------------------------------------------------------------------------
    // Campaign Actions
    // --------------------------------------------------------------------------

    async duplicateCampaign(id: string): Promise<EmailCampaign> {
        return apiClient.post<EmailCampaign>(`${CAMPAIGNS_BASE}/${id}/duplicate`, {});
    }

    async sendCampaign(id: string): Promise<EmailCampaign> {
        return apiClient.post<EmailCampaign>(`${CAMPAIGNS_BASE}/${id}/send`, {});
    }

    async pauseCampaign(id: string): Promise<EmailCampaign> {
        return apiClient.post<EmailCampaign>(`${CAMPAIGNS_BASE}/${id}/pause`, {});
    }

    async resumeCampaign(id: string): Promise<EmailCampaign> {
        return apiClient.post<EmailCampaign>(`${CAMPAIGNS_BASE}/${id}/resume`, {});
    }

    async cancelCampaign(id: string): Promise<EmailCampaign> {
        return apiClient.post<EmailCampaign>(`${CAMPAIGNS_BASE}/${id}/cancel`, {});
    }

    // --------------------------------------------------------------------------
    // Recipients & Preview
    // --------------------------------------------------------------------------

    async getRecipients(
        campaignId: string,
        page = 0,
        size = 50
    ): Promise<PageResponse<CampaignRecipient>> {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });
        return apiClient.get<PageResponse<CampaignRecipient>>(
            `${CAMPAIGNS_BASE}/${campaignId}/recipients?${params}`
        );
    }

    async previewCampaign(
        id: string,
        request?: CampaignPreviewRequest
    ): Promise<CampaignPreviewResponse> {
        return apiClient.post<CampaignPreviewResponse>(
            `${CAMPAIGNS_BASE}/${id}/preview`,
            request || {}
        );
    }

    // --------------------------------------------------------------------------
    // Stats & Activities
    // --------------------------------------------------------------------------

    async getStats(): Promise<CampaignStats> {
        return apiClient.get<CampaignStats>(`${CAMPAIGNS_BASE}/stats`);
    }

    async getActivities(campaignId: string): Promise<CampaignActivity[]> {
        // Activities are derived from campaign data, no separate endpoint yet
        // Return empty array - can be implemented later with audit logs
        console.debug('[CampaignService] getActivities called for', campaignId);
        return [];
    }

    // --------------------------------------------------------------------------
    // Helper Data (Users & Roles for recipient selection)
    // --------------------------------------------------------------------------

    async getUsers(search?: string): Promise<CampaignUser[]> {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        return apiClient.get<CampaignUser[]>(`${CAMPAIGNS_BASE}/users?${params}`);
    }

    async getRoles(): Promise<CampaignRole[]> {
        return apiClient.get<CampaignRole[]>(`${CAMPAIGNS_BASE}/roles`);
    }

    // --------------------------------------------------------------------------
    // Private Helpers
    // --------------------------------------------------------------------------

    private mapFormDataToRequest(data: CampaignFormData): object {
        return {
            name: data.name,
            subject: data.subject,
            bodyHtml: data.bodyHtml,
            templateId: data.templateId ? parseInt(data.templateId, 10) : undefined,
            type: data.type,
            targetType: data.targetType,
            targetUserIds: data.targetUserIds,
            targetRoleIds: data.targetRoleIds,
            externalEmails: data.externalEmails,
            documentIds: data.documentIds || [],
            scheduledAt: data.scheduleEnabled && data.scheduledAt ? data.scheduledAt : undefined,
            trackingEnabled: true
        };
    }
}

export const campaignService = new CampaignService();
