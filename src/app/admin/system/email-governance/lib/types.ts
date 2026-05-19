/**
 * TypeScript interfaces for Email Capture Policy admin.
 * Mirrors the backend EmailCapturePolicy JPA entity.
 */

export interface EmailCapturePolicyDto {
  id: number;
  policyName: string;
  workspaceId: string | null;

  // Joined workspace info (from LEFT JOIN FETCH)
  workspace?: {
    id: string;
    name: string;
    code?: string;
  } | null;

  // ── Routing ──
  allowedSourceMailbox: string | null;
  destinationFolderId: number | null;
  classificationDefault: string;

  // ── Security ──
  htmlSanitizationRequired: boolean;
  dangerousAttachmentsBlocked: boolean;
  malwareScanRequired: boolean;
  preserveOriginal: boolean;
  blockedExtensions: string;

  // ── Attachments ──
  attachmentExtractionEnabled: boolean;
  attachmentSubfolderEnabled: boolean;
  attachmentDestination: 'SAME_FOLDER' | 'SUBFOLDER';
  workflowAutoStartEnabled: boolean;

  // ── Compliance ──
  contentImmutable: boolean;
  auditCaptureEvent: boolean;
  metadataEditsAudited: boolean;
  recordsDeclarationEnabled: boolean;

  // ── Duplicate handling ──
  duplicateHandling: 'REJECT' | 'ALLOW' | 'VERSION';

  // ── Size limits ──
  maxAttachmentSizeBytes: number;
  maxEmailTotalSizeBytes: number;

  // ── Sync governance ──
  userMailboxSyncAllowed: boolean;
  fullMailboxSyncAllowed: boolean;
  requireAdminApprovalForSync: boolean;
  maxMailboxesPerUser: number;
  maxEmailsPerSync: number;
  allowedProviders: string;

  // ── Status ──
  isActive: boolean;
  active: boolean; // Jackson serializes isActive → active

  // ── Audit ──
  createdAt: string;
  updatedAt: string;
}

/** Workspace summary for the workspace selector dropdown */
export interface WorkspaceSummary {
  id: string;
  name: string;
  code?: string;
  status?: string;
}
