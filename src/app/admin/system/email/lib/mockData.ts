/**
 * Mock data for Email Configuration module
 * TODO: Replace with actual API calls
 */

import type {
  SMTPSettings,
  EmailTemplate,
  DeliverySettings,
  EmailLog,
  EmailStats
} from './types';

export const mockSMTPSettings: SMTPSettings = {
  enabled: true,
  host: 'smtp.company.com',
  port: 587,
  secure: false,
  username: 'noreply@company.com',
  password: '••••••••',
  fromName: 'AebDMS System',
  fromEmail: 'noreply@company.com',
  replyTo: 'support@company.com',
  timeout: 30,
  retries: 3,
  connectionPool: true,
  maxConnections: 5,
  rateLimit: 100
};

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Welcome Email',
    subject: 'Welcome to AebDMS',
    type: 'welcome',
    status: 'active',
    lastModified: '2024-01-15T10:30:00Z',
    usage: 156,
    variables: ['user_name', 'company_name', 'login_url']
  },
  {
    id: '2',
    name: 'Password Reset',
    subject: 'Reset Your Password',
    type: 'password_reset',
    status: 'active',
    lastModified: '2024-01-10T09:15:00Z',
    usage: 89,
    variables: ['user_name', 'reset_url', 'expiry_time']
  },
  {
    id: '3',
    name: 'Document Shared',
    subject: 'Document Shared with You',
    type: 'document_shared',
    status: 'active',
    lastModified: '2024-01-12T14:22:00Z',
    usage: 234,
    variables: ['sender_name', 'document_name', 'access_url', 'expiry_date']
  },
  {
    id: '4',
    name: 'System Notification',
    subject: 'System Maintenance Notice',
    type: 'system_notification',
    status: 'draft',
    lastModified: '2024-01-18T16:45:00Z',
    usage: 0,
    variables: ['maintenance_date', 'downtime_duration', 'affected_services']
  },
  {
    id: '5',
    name: 'Weekly Report',
    subject: 'Weekly Activity Report',
    type: 'weekly_report',
    status: 'active',
    lastModified: '2024-01-05T11:20:00Z',
    usage: 45,
    variables: ['week_period', 'total_documents', 'new_users', 'system_stats']
  }
];

export const mockDeliverySettings: DeliverySettings = {
  queueEnabled: true,
  maxRetries: 3,
  retryDelay: 300, // seconds
  batchSize: 50,
  processingInterval: 60, // seconds
  maxQueueSize: 10000,
  priorityLevels: ['high', 'normal', 'low'],
  rateLimiting: {
    enabled: true,
    maxPerMinute: 100,
    maxPerHour: 1000,
    maxPerDay: 10000
  },
  bounceHandling: {
    enabled: true,
    maxBounces: 5,
    bounceAction: 'disable',
    bounceCategories: ['hard', 'soft', 'complaint']
  }
};

export const mockEmailLogs: EmailLog[] = [
  {
    id: '1',
    timestamp: '2024-01-20T14:30:00Z',
    recipient: 'john.doe@company.com',
    subject: 'Welcome to AebDMS',
    status: 'delivered',
    template: 'Welcome Email',
    deliveryTime: 1.2,
    error: null
  },
  {
    id: '2',
    timestamp: '2024-01-20T14:25:00Z',
    recipient: 'jane.smith@company.com',
    subject: 'Document Shared with You',
    status: 'delivered',
    template: 'Document Shared',
    deliveryTime: 0.8,
    error: null
  },
  {
    id: '3',
    timestamp: '2024-01-20T14:20:00Z',
    recipient: 'invalid@email.com',
    subject: 'Password Reset',
    status: 'bounced',
    template: 'Password Reset',
    deliveryTime: 0,
    error: 'Invalid email address'
  },
  {
    id: '4',
    timestamp: '2024-01-20T14:15:00Z',
    recipient: 'admin@company.com',
    subject: 'Weekly Activity Report',
    status: 'delivered',
    template: 'Weekly Report',
    deliveryTime: 2.1,
    error: null
  },
  {
    id: '5',
    timestamp: '2024-01-20T14:10:00Z',
    recipient: 'user@example.com',
    subject: 'System Maintenance Notice',
    status: 'failed',
    template: 'System Notification',
    deliveryTime: 0,
    error: 'SMTP connection timeout'
  }
];

export const mockEmailStats: EmailStats = {
  totalSent: 15420,
  delivered: 14890,
  bounced: 234,
  failed: 296,
  deliveryRate: 96.6,
  averageDeliveryTime: 1.4,
  todaySent: 156,
  thisWeekSent: 1234,
  thisMonthSent: 5678
};
