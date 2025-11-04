/**
 * Type definitions for Email Configuration module
 */

export interface SMTPSettings {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  timeout: number;
  retries: number;
  connectionPool: boolean;
  maxConnections: number;
  rateLimit: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: string;
  status: 'active' | 'draft' | 'archived';
  lastModified: string;
  usage: number;
  variables: string[];
}

export interface RateLimiting {
  enabled: boolean;
  maxPerMinute: number;
  maxPerHour: number;
  maxPerDay: number;
}

export interface BounceHandling {
  enabled: boolean;
  maxBounces: number;
  bounceAction: string;
  bounceCategories: string[];
}

export interface DeliverySettings {
  queueEnabled: boolean;
  maxRetries: number;
  retryDelay: number; // seconds
  batchSize: number;
  processingInterval: number; // seconds
  maxQueueSize: number;
  priorityLevels: string[];
  rateLimiting: RateLimiting;
  bounceHandling: BounceHandling;
}

export interface EmailLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  status: 'delivered' | 'bounced' | 'failed' | 'pending';
  template: string;
  deliveryTime: number;
  error: string | null;
}

export interface EmailStats {
  totalSent: number;
  delivered: number;
  bounced: number;
  failed: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  todaySent: number;
  thisWeekSent: number;
  thisMonthSent: number;
}
