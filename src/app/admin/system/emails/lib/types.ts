/**
 * Type definitions for Email Management module
 */

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: 'active' | 'scheduled' | 'draft' | 'completed' | 'paused';
  type: 'automated' | 'newsletter' | 'transactional' | 'announcement' | 'system';
  recipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  createdBy: string;
  createdAt: string;
  lastSent: string | null;
  nextScheduled: string | null;
  template: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: string;
  status: 'active' | 'draft';
  usage: number;
  lastModified: string;
  createdBy: string;
  preview: string;
}

export interface EmailLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  campaign: string;
  status: 'delivered' | 'bounced' | 'failed' | 'pending';
  opened: boolean;
  clicked: boolean;
  bounceReason: string | null;
  deliveryTime: number;
  ipAddress: string;
  userAgent: string | null;
}

export interface EmailStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  todaySent: number;
  thisWeekSent: number;
  thisMonthSent: number;
  activeCampaigns: number;
  scheduledCampaigns: number;
  totalTemplates: number;
}
