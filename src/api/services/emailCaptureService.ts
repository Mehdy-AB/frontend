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
  htmlSanitized: boolean;
  preserveOriginal: boolean;
  recordsDeclarationEligible: boolean;
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

// ==================== MAILBOX SYNC TYPES ====================

export type MailboxProvider = 'MICROSOFT_365_IMAP' | 'GMAIL_IMAP' | 'GENERIC_IMAP';
export type MailboxTransport = 'IMAP_IDLE' | 'IMAP_POLL';
export type MailboxOwnerType = 'USER' | 'WORKSPACE' | 'SYSTEM_SHARED';
export type MailboxConnectionStatus = 'PENDING' | 'CONNECTED' | 'DISCONNECTED' | 'AUTH_EXPIRED' | 'ERROR' | 'DISABLED' | 'AWAITING_APPROVAL';
export type CaptureMode = 'INCOMING' | 'ALL';
export type SyncType = 'AUTO' | 'MANUAL' | 'RANGE';
export type SyncStatus = 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';

export interface WatchedFolderDto {
  id: number;
  folderName: string;
  displayName: string;
  active: boolean;
  uidValidity: number | null;
  lastSeenUid: number | null;
  totalCaptured: number;
  overrideDestinationFolderId: number | null;
  overrideDestinationFolderPath: string | null;
  overrideFilingCategoryId: number | null;
  overrideFilingCategoryName: string | null;
  lastFolderSyncAt: string | null;
}

export interface MailboxConnectionResponse {
  id: number;
  provider: MailboxProvider;
  activeTransport: MailboxTransport | null;
  emailAddress: string;
  displayName: string | null;
  ownerType: MailboxOwnerType;
  userId: string;
  workspaceId: string | null;
  status: MailboxConnectionStatus;
  captureMode: CaptureMode;
  autoSyncEnabled: boolean;
  autoExtractAttachments: boolean;
  attachmentDestination: AttachmentDestination;
  lookbackDays: number | null;
  lookbackSinceDate: string | null;
  lookbackUntilDate: string | null;
  destinationFolderId: number | null;
  destinationFolderPath: string | null;
  filingCategoryId: number | null;
  filingCategoryName: string | null;
  lastSyncAt: string | null;
  lastSyncMessageCount: number | null;
  lastSyncError: string | null;
  totalEmailsSynced: number;
  watchedFolders: WatchedFolderDto[];
  oauthConfigured: boolean;
  tokenExpiresAt: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MailboxConnectionRequest {
  provider: MailboxProvider;
  emailAddress: string;
  displayName?: string;
  ownerType?: MailboxOwnerType;
  workspaceId?: string;
  imapHost?: string;
  imapPort?: number;
  imapUsername?: string;
  imapPassword?: string;
  imapUseSsl?: boolean;
  destinationFolderId?: number;
  filingCategoryId?: number;
  captureMode?: CaptureMode;
  autoExtractAttachments?: boolean;
  attachmentDestination?: AttachmentDestination;
  lookbackDays?: number | null;
  lookbackSinceDate?: string | null;
  lookbackUntilDate?: string | null;
}

export interface MailboxSyncLogResponse {
  id: number;
  connectionId: number;
  syncType: SyncType;
  status: SyncStatus;
  startedAt: string;
  completedAt: string | null;
  emailsFetched: number;
  emailsCaptured: number;
  emailsSkipped: number;
  emailsFailed: number;
  errorMessage: string | null;
  triggeredBy: string | null;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

const SYNC_URL = '/api/v1/mailbox-sync';

// ==================== MAILBOX SYNC SERVICE ====================

class MailboxSyncApiService {

  // ---- CONNECTIONS ----

  async getConnections(): Promise<MailboxConnectionResponse[]> {
    return apiClient.get<MailboxConnectionResponse[]>(`${SYNC_URL}/connections`);
  }

  async getConnection(id: number): Promise<MailboxConnectionResponse> {
    return apiClient.get<MailboxConnectionResponse>(`${SYNC_URL}/connections/${id}`);
  }

  async createConnection(data: MailboxConnectionRequest): Promise<MailboxConnectionResponse> {
    return apiClient.post<MailboxConnectionResponse>(`${SYNC_URL}/connections`, data);
  }

  async updateConnection(id: number, data: Partial<MailboxConnectionRequest>): Promise<MailboxConnectionResponse> {
    return apiClient.put<MailboxConnectionResponse>(`${SYNC_URL}/connections/${id}`, data);
  }

  async deleteConnection(id: number): Promise<void> {
    return apiClient.delete(`${SYNC_URL}/connections/${id}`);
  }

  // ---- SYNC CONTROL ----

  async enableSync(id: number): Promise<MailboxConnectionResponse> {
    return apiClient.post<MailboxConnectionResponse>(`${SYNC_URL}/connections/${id}/enable`, {});
  }

  async disableSync(id: number): Promise<MailboxConnectionResponse> {
    return apiClient.post<MailboxConnectionResponse>(`${SYNC_URL}/connections/${id}/disable`, {});
  }

  /**
   * Trigger a one-shot historical email fetch for a date range.
   * INCOMING mode stays active — this runs alongside the IDLE watcher.
   */
  async triggerHistoricalFetch(connectionId: number, params: {
    sinceDate?: string;
    untilDate?: string;
    lookbackDays?: number;
  }): Promise<{ status: string; message: string }> {
    return apiClient.post<{ status: string; message: string }>(
      `${SYNC_URL}/connections/${connectionId}/fetch-historical`, params
    );
  }

  // ---- OAUTH2 ----

  async getAuthorizationUrl(id: number): Promise<{ authorizationUrl: string }> {
    return apiClient.get<{ authorizationUrl: string }>(`${SYNC_URL}/connections/${id}/oauth2/authorize`);
  }

  // ---- WATCHED FOLDERS ----

  async getWatchedFolders(connectionId: number): Promise<WatchedFolderDto[]> {
    return apiClient.get<WatchedFolderDto[]>(`${SYNC_URL}/connections/${connectionId}/folders`);
  }

  async addWatchedFolder(connectionId: number, data: {
    folderName: string;
    displayName?: string;
    overrideDestinationFolderId?: number;
    overrideFilingCategoryId?: number;
  }): Promise<WatchedFolderDto> {
    return apiClient.post<WatchedFolderDto>(`${SYNC_URL}/connections/${connectionId}/folders`, data);
  }

  async toggleWatchedFolder(folderId: number, active: boolean): Promise<WatchedFolderDto> {
    return apiClient.patch<WatchedFolderDto>(`${SYNC_URL}/folders/${folderId}/toggle?active=${active}`, {});
  }

  async removeWatchedFolder(folderId: number): Promise<void> {
    return apiClient.delete(`${SYNC_URL}/folders/${folderId}`);
  }

  // ---- SYNC HISTORY ----

  async getSyncHistory(
    connectionId: number, page = 0, size = 10,
    filters?: { status?: SyncStatus; from?: string; to?: string }
  ): Promise<PaginatedResponse<MailboxSyncLogResponse>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (filters?.status) params.set('status', filters.status);
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    return apiClient.get<PaginatedResponse<MailboxSyncLogResponse>>(
      `${SYNC_URL}/connections/${connectionId}/history?${params.toString()}`
    );
  }

  // ---- IMAP FOLDER BROWSER ----

  async listImapFolders(connectionId: number): Promise<ImapFolderDto[]> {
    return apiClient.get<ImapFolderDto[]>(`${SYNC_URL}/connections/${connectionId}/imap-folders`);
  }

  // ---- STATUS ----

  async getStatus(): Promise<{ activeConnections: number; timestamp: number }> {
    return apiClient.get<{ activeConnections: number; timestamp: number }>(`${SYNC_URL}/status`);
  }

  // ---- REVIEW QUEUE ----

  async getReviewQueue(page = 0, size = 20): Promise<ReviewQueueResponse> {
    return apiClient.get<ReviewQueueResponse>(
      `${SYNC_URL}/review-queue?page=${page}&size=${size}`
    );
  }

  async completeClassification(emailDocId: number, metadata: { id: number; value: string }[]): Promise<void> {
    return apiClient.patch(`${SYNC_URL}/review-queue/${emailDocId}/complete`, metadata);
  }
}

export interface ImapFolderDto {
  name: string;
  displayName: string;
  delimiter: string;
  selectable: boolean;
  hasChildren: boolean;
  depth: number;
  messageCount: number;
}

// ==================== REVIEW QUEUE ====================

export interface ReviewQueueResponse {
  content: ReviewQueueItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  pendingCount: number;
}

export interface ReviewQueueItem {
  id: number;
  messageId: string;
  subject: string;
  fromAddress: string;
  sentAt: string;
  classificationStatus: 'PROVISIONAL' | 'COMPLETE' | 'UNCLASSIFIED';
  archivedAt: string;
  document: { id: number; name: string; filingCategory?: { id: number; name: string } };
}

export const mailboxSyncService = new MailboxSyncApiService();

