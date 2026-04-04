/**
 * Email Capture API Service
 * Connects frontend to backend Email Capture module
 */

import { apiClient } from '@/api/client';

// ==================== TYPES ====================

export type EmailContentType = 'EMAIL' | 'INVOICE_EMAIL' | 'HR_EMAIL' | 'LEGAL_EMAIL' | 'SUPPORT_EMAIL' | 'INTERNAL_EMAIL' | 'EXTERNAL_EMAIL';
export type AttachmentDestination = 'SAME_FOLDER' | 'SUBFOLDER' | 'PERSONAL';
export type EmailImportance = 'LOW' | 'NORMAL' | 'HIGH';

export interface AttachmentPreview {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface EmailCapturePreviewResponse {
  subject: string;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses: string[];
  sentAt: string | null;
  receivedAt: string | null;
  importance: string;
  attachmentCount: number;
  attachments: AttachmentPreview[];
  bodyPreview: string;
  originalFormat: string;
  totalSizeBytes: number;
}

export interface EmailCaptureResponse {
  documentId: number;
  emailDocumentId: number;
  subject: string;
  fromAddress: string;
  toAddresses: string[];
  sentAt: string | null;
  importance: string;
  attachmentCount: number;
  attachmentDocumentIds: number[];
  folderPath: string;
  folderId: number;
  contentType: string;
}

export interface LinkedAttachment {
  documentId: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  linkId: number;
}

export interface EmailDocumentResponse {
  documentId: number;
  emailDocumentId: number;
  documentName: string;
  folderId: number;
  folderPath: string;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses: string[];
  bccAddresses: string[];
  subject: string;
  sentAt: string | null;
  receivedAt: string | null;
  messageId: string;
  threadId: string;
  bodyText: string;
  bodyHtml: string;
  hasAttachments: boolean;
  attachmentCount: number;
  importance: string;
  contentType: string;
  sourceType: string;
  originalFormat: string;
  contentImmutable: boolean;
  archivedAt: string;
  linkedAttachments: LinkedAttachment[];
}

export interface UserEmailCaptureSettings {
  id?: number;
  defaultFolderId: number | null;
  defaultFolderName: string | null;
  defaultWorkspaceId: string | null;
  defaultWorkspaceName: string | null;
  autoExtractAttachments: boolean;
  attachmentDestination: AttachmentDestination;
  defaultContentType: EmailContentType;
  defaultFilingCategoryId: number | null;
  defaultFilingCategoryName: string | null;
  notifyOnCapture: boolean;
  preferHtmlBody: boolean;
}

/** Payload for PUT /settings (writable subset of UserEmailCaptureSettings) */
export interface UserEmailCaptureSettingsData {
  defaultFolderId?: number;
  defaultWorkspaceId?: string;
  defaultContentType?: EmailContentType;
  defaultFilingCategoryId?: number | null;
  autoExtractAttachments?: boolean;
  attachmentDestination?: AttachmentDestination;
  notifyOnCapture?: boolean;
  preferHtmlBody?: boolean;
}

/** Metadata value for capture request */
export interface MetadataValueDto {
  id: number;
  value: string;
}

const BASE_URL = '/api/v1/email-capture';

// ==================== SERVICE ====================

class EmailCaptureApiService {

  /**
   * Parse and preview an email file without archiving.
   */
  async preview(file: File): Promise<EmailCapturePreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);

    console.debug('[EmailCaptureService] Previewing email:', file.name);
    const result = await apiClient.uploadFile<EmailCapturePreviewResponse>(
      `${BASE_URL}/preview`, formData
    );
    console.debug('[EmailCaptureService] Preview result:', result.subject);
    return result;
  }

  /**
   * Full email capture — parse, enforce policies, archive, extract attachments.
   * Now supports filing category (model) and tags.
   */
  async capture(
    file: File,
    folderId: number,
    options?: {
      workspaceId?: string;
      contentType?: EmailContentType;
      extractAttachments?: boolean;
      attachmentDestination?: AttachmentDestination;
      filingCategoryId?: number;
      metadata?: MetadataValueDto[];
      tagIds?: number[];
    }
  ): Promise<EmailCaptureResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId.toString());

    if (options?.workspaceId) {
      formData.append('workspaceId', options.workspaceId);
    }
    if (options?.contentType) {
      formData.append('contentType', options.contentType);
    }
    if (options?.extractAttachments !== undefined) {
      formData.append('extractAttachments', String(options.extractAttachments));
    }
    if (options?.attachmentDestination) {
      formData.append('attachmentDestination', options.attachmentDestination);
    }
    if (options?.filingCategoryId) {
      formData.append('filingCategoryId', options.filingCategoryId.toString());
    }
    if (options?.metadata && options.metadata.length > 0) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }
    if (options?.tagIds && options.tagIds.length > 0) {
      formData.append('tagIds', options.tagIds.join(','));
    }

    console.debug('[EmailCaptureService] Capturing email:', file.name, 'to folder:', folderId);
    const result = await apiClient.uploadFile<EmailCaptureResponse>(
      `${BASE_URL}/capture`, formData
    );
    console.debug('[EmailCaptureService] Capture result:', result.documentId);
    return result;
  }

  /**
   * Get full email document details including parsed data and linked attachments.
   */
  async getEmailDocument(documentId: number): Promise<EmailDocumentResponse> {
    return apiClient.get<EmailDocumentResponse>(`${BASE_URL}/${documentId}`);
  }

  /**
   * Get sanitized HTML body of an archived email for iframe rendering.
   */
  async getEmailBodyUrl(documentId: number): Promise<string> {
    return `${BASE_URL}/${documentId}/body`;
  }

  /**
   * Check if a document is an email document.
   */
  async isEmailDocument(documentId: number): Promise<boolean> {
    return apiClient.get<boolean>(`${BASE_URL}/${documentId}/is-email`);
  }

  // ==================== USER SETTINGS ====================

  async getSettings(): Promise<UserEmailCaptureSettings> {
    return apiClient.get<UserEmailCaptureSettings>(`${BASE_URL}/settings`);
  }

  async updateSettings(settings: UserEmailCaptureSettingsData): Promise<UserEmailCaptureSettings> {
    return apiClient.put<UserEmailCaptureSettings>(`${BASE_URL}/settings`, settings);
  }
}

export const emailCaptureService = new EmailCaptureApiService();
