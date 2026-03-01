/**
 * Type definitions for Email Management module
 * Comprehensive types for Email Campaigns feature
 */

// ============================================================================
// Email Campaign Enums
// ============================================================================

export type EmailCampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENDING'
  | 'RUNNING'
  | 'PAUSED'
  | 'FAILED'
  | 'COMPLETED'
  | 'CANCELLED';

export type EmailCampaignType =
  | 'NEWSLETTER'
  | 'ANNOUNCEMENT'
  | 'TRANSACTIONAL'
  | 'AUTOMATED'
  | 'SYSTEM';

export type TargetType =
  | 'SYSTEM_USERS'
  | 'EXTERNAL'
  | 'MIXED';

// ============================================================================
// Email Campaign Interfaces
// ============================================================================

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  templateId?: string;
  templateName?: string;
  status: EmailCampaignStatus;
  type: EmailCampaignType;
  targetType: TargetType;

  // Recipients
  targetUserIds?: string[];
  targetRoleIds?: string[];
  externalEmails?: string[];
  documentIds?: number[];

  // Scheduling
  scheduledAt?: string;
  sentAt?: string;

  // Stats
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  failedCount: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName?: string;
  createdByImageUrl?: string;
}

export interface CampaignActivity {
  id: string;
  campaignId: string;
  type: 'CREATED' | 'UPDATED' | 'SCHEDULED' | 'STARTED' | 'PAUSED' | 'RESUMED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface CampaignFormData {
  name: string;
  subject: string;
  bodyHtml: string;
  templateId?: string;
  type: EmailCampaignType;
  targetType: TargetType;
  targetUserIds: string[];
  targetRoleIds: string[];
  externalEmails: string[];
  documentIds: number[];
  scheduleEnabled: boolean;
  scheduledAt?: string;
}

// ============================================================================
// Mock User/Role Types for Recipient Selection
// ============================================================================

export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface MockRole {
  id: string;
  name: string;
  userCount: number;
}

export interface MockTemplate {
  id: string;
  name: string;
  subject: string;
}

// ============================================================================
// Campaign Stats Summary
// ============================================================================

export interface CampaignStats {
  total: number;
  draft: number;
  scheduled: number;
  running: number;
  completed: number;
  failed: number;
}

// ============================================================================
// Filter Types
// ============================================================================

export type DateRangeFilter = 'all' | 'last_7_days' | 'last_30_days';

export interface CampaignFilters {
  search: string;
  status: EmailCampaignStatus | 'all';
  type: EmailCampaignType | 'all';
  dateRange: DateRangeFilter;
}

// ============================================================================
// Legacy Types (for backward compatibility)
// ============================================================================

export interface LegacyEmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  type: 'newsletter' | 'promotional' | 'transactional' | 'automated';
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type?: string;
  status: 'active' | 'draft' | 'inactive';
  usage?: number;
  usageCount?: number;
  category?: string;
  lastModified?: string;
  createdBy?: string;
  preview?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailLog {
  id: string;
  timestamp?: string;
  recipient: string;
  subject: string;
  campaign: string;
  status: 'sent' | 'queued' | 'failed';
  opened?: boolean;
  clicked?: boolean;
  bounceReason?: string | null;
  deliveryTime?: number;
  ipAddress?: string;
  userAgent?: string | null;
  sentAt?: string;
  openedAt?: string;
  bodyHtml?: string;
}

export interface EmailStats {
  totalSent: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  bounced?: number;
  failed?: number;
  unsubscribed?: number;
  sentRate: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate?: number;
  bounceRate?: number;
  unsubscribeRate?: number;
  todaySent?: number;
  thisWeekSent?: number;
  thisMonthSent?: number;
  activeCampaigns?: number;
  scheduledCampaigns?: number;
  totalTemplates?: number;
}
