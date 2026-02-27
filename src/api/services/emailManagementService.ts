/**
 * Email Management API Service
 * Handles templates, sending, and logs
 */

import { apiClient } from '@/api/client';

// ============================================================================
// Types
// ============================================================================

export type EmailStatus = 'QUEUED' | 'SENT' | 'FAILED';

export interface EmailRecipients {
    to: string[];
    cc: string[];
    bcc: string[];
}

// Template Types
export interface EmailTemplate {
    id: number;
    name: string;
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    variables: string[];
    isActive: boolean;
    createdBy?: string;
    createdByName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface EmailTemplateRequest {
    name: string;
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    variables: string[];
    isActive: boolean;
}

export interface TemplatePreviewRequest {
    variables: Record<string, string>;
}

export interface TemplatePreviewResponse {
    subject: string;
    bodyHtml: string;
    bodyText?: string;
}

// Send Email Types
export interface SendEmailRequest {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
    templateId?: number;
    variables?: Record<string, string>;
    documentIds?: number[];
}

export interface SendEmailResponse {
    logId: number;
    status: EmailStatus;
    message: string;
}

// Log Types
export interface EmailLogAttachment {
    id: number;
    documentId?: number;
    filename: string;
    mimeType?: string;
    sizeBytes?: number;
    attachedAsLink: boolean;
    presignedUrl?: string;
}

export interface EmailLog {
    id: number;
    templateId?: number;
    templateName?: string;
    recipients: EmailRecipients;
    subject: string;
    bodyHtml?: string;
    bodyText?: string;
    status: EmailStatus;
    providerMessageId?: string;
    errorMessage?: string;
    queuedAt: string;
    sentAt?: string;
    failedAt?: string;
    sentBy?: string;
    sentByName?: string;
    attachments: EmailLogAttachment[];
    // Tracking fields
    trackingId?: string;
    openedAt?: string;
    openCount?: number;
    clickCount?: number;
    firstClickedAt?: string;
}

export interface EmailLogStats {
    totalQueued: number;
    totalSent: number;
    totalFailed: number;
    totalOpened: number;
    totalClicked: number;
    sentRate: number;
    openRate: number;
    clickRate: number;
    clickToOpenRate: number;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

// ============================================================================
// API Constants
// ============================================================================

const EMAIL_BASE = '/api/v1/email';

// ============================================================================
// Service
// ============================================================================

class EmailManagementService {

    // --------------------------------------------------------------------------
    // Templates
    // --------------------------------------------------------------------------

    async getTemplates(page = 0, size = 20, search?: string, activeOnly = false): Promise<PageResponse<EmailTemplate>> {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
            activeOnly: activeOnly.toString()
        });
        if (search) params.set('search', search);

        return apiClient.get<PageResponse<EmailTemplate>>(`${EMAIL_BASE}/templates?${params}`);
    }

    async getTemplate(id: number): Promise<EmailTemplate> {
        return apiClient.get<EmailTemplate>(`${EMAIL_BASE}/templates/${id}`);
    }

    async createTemplate(request: EmailTemplateRequest): Promise<EmailTemplate> {
        return apiClient.post<EmailTemplate>(`${EMAIL_BASE}/templates`, request);
    }

    async updateTemplate(id: number, request: EmailTemplateRequest): Promise<EmailTemplate> {
        return apiClient.put<EmailTemplate>(`${EMAIL_BASE}/templates/${id}`, request);
    }

    async deleteTemplate(id: number): Promise<void> {
        return apiClient.delete(`${EMAIL_BASE}/templates/${id}`);
    }

    async previewTemplate(id: number, variables: Record<string, string>): Promise<TemplatePreviewResponse> {
        return apiClient.post<TemplatePreviewResponse>(`${EMAIL_BASE}/templates/${id}/preview`, { variables });
    }

    // --------------------------------------------------------------------------
    // Send Email
    // --------------------------------------------------------------------------

    async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
        console.debug('[EmailManagement] Sending email:', request);
        return apiClient.post<SendEmailResponse>(`${EMAIL_BASE}/send`, request);
    }

    // --------------------------------------------------------------------------
    // Logs
    // --------------------------------------------------------------------------

    async getLogs(
        page = 0,
        size = 20,
        status?: EmailStatus,
        recipientContains?: string,
        templateId?: number
    ): Promise<PageResponse<EmailLog>> {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });
        if (status) params.set('status', status);
        if (recipientContains) params.set('recipientContains', recipientContains);
        if (templateId) params.set('templateId', templateId.toString());

        return apiClient.get<PageResponse<EmailLog>>(`${EMAIL_BASE}/logs?${params}`);
    }

    async getLog(id: number): Promise<EmailLog> {
        return apiClient.get<EmailLog>(`${EMAIL_BASE}/logs/${id}`);
    }

    async getStats(): Promise<EmailLogStats> {
        return apiClient.get<EmailLogStats>(`${EMAIL_BASE}/logs/stats`);
    }

    // --------------------------------------------------------------------------
    // Variables & Preview (for WYSIWYG editor)
    // --------------------------------------------------------------------------

    /**
     * Get available template variables for the email editor.
     * Variables include recipient.*, sender.*, campaign.*, now.*
     */
    async getVariables(): Promise<VariableDefinition[]> {
        return apiClient.get<VariableDefinition[]>(`${EMAIL_BASE}/variables`);
    }

    /**
     * Preview email with variables resolved.
     * Uses the same compilation pipeline as actual email sending.
     */
    async previewEmail(request: EmailPreviewRequest): Promise<EmailPreviewResponse> {
        return apiClient.post<EmailPreviewResponse>(`${EMAIL_BASE}/preview`, request);
    }
}

// Variable Definition Type (matches backend)
export interface VariableDefinition {
    key: string;
    label: string;
    example: string;
    category: string;
    dynamic?: boolean;
}

// Email Preview Types
export interface EmailPreviewRequest {
    subject: string;
    bodyHtml: string;
    recipientId?: string;
}

export interface EmailPreviewResponse {
    renderedSubject: string;
    renderedBodyHtml: string;
    renderedBodyText: string;
    resolvedVariables: Record<string, string>;
    warnings: string[];
    previewAsRecipient: string;
}

export const emailManagementService = new EmailManagementService();
