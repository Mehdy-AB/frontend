/**
 * Type definitions for DMS Settings module
 */

// ═══════════════════════════════════════════════════════════════
// Service Health
// ═══════════════════════════════════════════════════════════════

export interface ServiceHealth {
  name: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  responseTimeMs: number;
  lastCheckedAt: string;
  errorMessage?: string;
}

// ═══════════════════════════════════════════════════════════════
// Settings Value (from API)
// ═══════════════════════════════════════════════════════════════

export interface SettingValue {
  value: string;
  type: string;
  description?: string;
  isSystem: boolean;
  updatedAt?: string;
}

// ═══════════════════════════════════════════════════════════════
// System Info / Overview
// ═══════════════════════════════════════════════════════════════

export interface SystemInfo {
  version: string;
  buildDate: string;
  uptime: string;
  lastBackup: string;
  nextBackup: string;
  status: 'healthy' | 'warning' | 'error';
  performance: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// Storage
// ═══════════════════════════════════════════════════════════════

export interface StorageBreakdownItem {
  type: string;
  size: number;
  percentage: number;
  color: string;
}

export interface StorageLocation {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  used: number;
  status: string;
}

export interface StorageInfo {
  total: number;
  used: number;
  available: number;
  breakdown: StorageBreakdownItem[];
  locations: StorageLocation[];
}

// ═══════════════════════════════════════════════════════════════
// Security
// ═══════════════════════════════════════════════════════════════

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxAge: number;
}

export interface AuthenticationSettings {
  method: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireMFA: boolean;
  conditionalMFA: boolean;
  passwordPolicy: PasswordPolicy;
}

export interface EncryptionSettings {
  enabled: boolean;
  algorithm: string;
  keyRotation: number;
  lastRotation: string;
}

export interface AccessSettings {
  ipWhitelist: string[];
  allowedDomains: string[];
  blockTor: boolean;
  requireVPN: boolean;
}

export interface AuditSettings {
  enabled: boolean;
  retentionDays: number;
  logLevel: string;
  events: string[];
}

export interface SecuritySettings {
  authentication: AuthenticationSettings;
  encryption: EncryptionSettings;
  access: AccessSettings;
  audit: AuditSettings;
}

// ═══════════════════════════════════════════════════════════════
// Performance
// ═══════════════════════════════════════════════════════════════

export interface CachingSettings {
  enabled: boolean;
  type: string;
  ttl: number;
  maxMemory: string;
}

export interface IndexingSettings {
  enabled: boolean;
  engine: string;
  batchSize: number;
  interval: number;
}

export interface CompressionSettings {
  enabled: boolean;
  algorithm: string;
  level: number;
  threshold: number;
}

export interface OptimizationSettings {
  lazyLoading: boolean;
  imageOptimization: boolean;
  cdnEnabled: boolean;
  preloadCritical: boolean;
}

export interface PerformanceSettings {
  caching: CachingSettings;
  indexing: IndexingSettings;
  compression: CompressionSettings;
  optimization: OptimizationSettings;
  asyncProcessingEnabled: boolean;
  maxConcurrentJobs: number;
}

// ═══════════════════════════════════════════════════════════════
// Backup
// ═══════════════════════════════════════════════════════════════

export interface BackupLocation {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
}

export interface BackupSettings {
  enabled: boolean;
  schedule: string;
  time: string;
  retention: number;
  compression: boolean;
  encryption: boolean;
  locations: BackupLocation[];
}

// ═══════════════════════════════════════════════════════════════
// Logs
// ═══════════════════════════════════════════════════════════════

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: string;
  message: string;
  details: string;
}

// ═══════════════════════════════════════════════════════════════
// Core Settings (from API)
// ═══════════════════════════════════════════════════════════════

export interface CoreSettings {
  systemName: string;
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}

// ═══════════════════════════════════════════════════════════════
// Upload Rules (from API)
// ═══════════════════════════════════════════════════════════════

export interface UploadRules {
  allowedMimeTypes: string;
  blockedFileTypes: string;
  archiveHandling: string;
}

// ═══════════════════════════════════════════════════════════════
// Storage Settings (from API)
// ═══════════════════════════════════════════════════════════════

export interface StorageSettings {
  defaultBackend: string;
  tierHot: boolean;
  tierWarm: boolean;
  tierArchive: boolean;
  maxFileSizeMb: number;
  chunkUploadSizeMb: number;
}
