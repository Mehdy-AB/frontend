/**
 * Mock data for Email Management module
 * TODO: Replace with actual API calls
 */

import type {
  EmailCampaign,
  EmailTemplate,
  EmailLog,
  EmailStats
} from './types';

export const mockEmailCampaigns: EmailCampaign[] = [
  {
    id: '1',
    name: 'Welcome Campaign',
    subject: 'Welcome to AebDMS',
    status: 'active',
    type: 'automated',
    recipients: 1250,
    sent: 1180,
    delivered: 1156,
    opened: 892,
    clicked: 234,
    bounced: 24,
    unsubscribed: 12,
    createdBy: 'Admin User',
    createdAt: '2024-01-15T10:30:00Z',
    lastSent: '2024-01-20T14:22:00Z',
    nextScheduled: null,
    template: 'Welcome Email'
  },
  {
    id: '2',
    name: 'Monthly Newsletter',
    subject: 'January 2024 Newsletter',
    status: 'scheduled',
    type: 'newsletter',
    recipients: 2500,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    unsubscribed: 0,
    createdBy: 'Marketing Team',
    createdAt: '2024-01-18T09:15:00Z',
    lastSent: null,
    nextScheduled: '2024-01-25T10:00:00Z',
    template: 'Newsletter Template'
  },
  {
    id: '3',
    name: 'Password Reset Campaign',
    subject: 'Reset Your Password',
    status: 'active',
    type: 'transactional',
    recipients: 89,
    sent: 89,
    delivered: 85,
    opened: 67,
    clicked: 45,
    bounced: 4,
    unsubscribed: 0,
    createdBy: 'System',
    createdAt: '2024-01-10T11:20:00Z',
    lastSent: '2024-01-20T16:45:00Z',
    nextScheduled: null,
    template: 'Password Reset'
  },
  {
    id: '4',
    name: 'Product Update',
    subject: 'New Features Available',
    status: 'draft',
    type: 'announcement',
    recipients: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    unsubscribed: 0,
    createdBy: 'Product Team',
    createdAt: '2024-01-19T14:30:00Z',
    lastSent: null,
    nextScheduled: null,
    template: 'Product Update'
  },
  {
    id: '5',
    name: 'System Maintenance',
    subject: 'Scheduled Maintenance Notice',
    status: 'completed',
    type: 'system',
    recipients: 500,
    sent: 500,
    delivered: 495,
    opened: 423,
    clicked: 89,
    bounced: 5,
    unsubscribed: 2,
    createdBy: 'System Admin',
    createdAt: '2024-01-17T08:00:00Z',
    lastSent: '2024-01-17T10:00:00Z',
    nextScheduled: null,
    template: 'System Notification'
  }
];

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Welcome Email',
    subject: 'Welcome to AebDMS',
    type: 'welcome',
    status: 'active',
    usage: 156,
    lastModified: '2024-01-15T10:30:00Z',
    createdBy: 'Admin User',
    preview: 'Welcome to our document management system...'
  },
  {
    id: '2',
    name: 'Password Reset',
    subject: 'Reset Your Password',
    type: 'password_reset',
    status: 'active',
    usage: 89,
    lastModified: '2024-01-10T09:15:00Z',
    createdBy: 'Admin User',
    preview: 'Click the link below to reset your password...'
  },
  {
    id: '3',
    name: 'Document Shared',
    subject: 'Document Shared with You',
    type: 'document_shared',
    status: 'active',
    usage: 234,
    lastModified: '2024-01-12T14:22:00Z',
    createdBy: 'Admin User',
    preview: 'A document has been shared with you...'
  },
  {
    id: '4',
    name: 'Newsletter Template',
    subject: 'Monthly Newsletter',
    type: 'newsletter',
    status: 'draft',
    usage: 0,
    lastModified: '2024-01-18T16:45:00Z',
    createdBy: 'Marketing Team',
    preview: 'Here are the latest updates and features...'
  },
  {
    id: '5',
    name: 'System Notification',
    subject: 'System Maintenance Notice',
    type: 'system_notification',
    status: 'active',
    usage: 45,
    lastModified: '2024-01-05T11:20:00Z',
    createdBy: 'System Admin',
    preview: 'We will be performing scheduled maintenance...'
  }
];

export const mockEmailLogs: EmailLog[] = [
  {
    id: '1',
    timestamp: '2024-01-20T14:30:00Z',
    recipient: 'john.doe@company.com',
    subject: 'Welcome to AebDMS',
    campaign: 'Welcome Campaign',
    status: 'delivered',
    opened: true,
    clicked: true,
    bounceReason: null,
    deliveryTime: 1.2,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: '2',
    timestamp: '2024-01-20T14:25:00Z',
    recipient: 'jane.smith@company.com',
    subject: 'Document Shared with You',
    campaign: 'Document Sharing',
    status: 'delivered',
    opened: true,
    clicked: false,
    bounceReason: null,
    deliveryTime: 0.8,
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  },
  {
    id: '3',
    timestamp: '2024-01-20T14:20:00Z',
    recipient: 'invalid@email.com',
    subject: 'Password Reset',
    campaign: 'Password Reset Campaign',
    status: 'bounced',
    opened: false,
    clicked: false,
    bounceReason: 'Invalid email address',
    deliveryTime: 0,
    ipAddress: '192.168.1.102',
    userAgent: null
  },
  {
    id: '4',
    timestamp: '2024-01-20T14:15:00Z',
    recipient: 'admin@company.com',
    subject: 'Weekly Activity Report',
    campaign: 'Weekly Reports',
    status: 'delivered',
    opened: false,
    clicked: false,
    bounceReason: null,
    deliveryTime: 2.1,
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
  },
  {
    id: '5',
    timestamp: '2024-01-20T14:10:00Z',
    recipient: 'user@example.com',
    subject: 'System Maintenance Notice',
    campaign: 'System Maintenance',
    status: 'failed',
    opened: false,
    clicked: false,
    bounceReason: 'SMTP connection timeout',
    deliveryTime: 0,
    ipAddress: '192.168.1.104',
    userAgent: null
  }
];

export const mockEmailStats: EmailStats = {
  totalSent: 15420,
  delivered: 14890,
  opened: 12345,
  clicked: 3456,
  bounced: 234,
  failed: 296,
  unsubscribed: 89,
  deliveryRate: 96.6,
  openRate: 82.9,
  clickRate: 27.9,
  bounceRate: 1.5,
  unsubscribeRate: 0.6,
  todaySent: 156,
  thisWeekSent: 1234,
  thisMonthSent: 5678,
  activeCampaigns: 3,
  scheduledCampaigns: 1,
  totalTemplates: 5
};
