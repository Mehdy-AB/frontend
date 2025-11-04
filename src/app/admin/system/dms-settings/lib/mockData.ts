/**
 * Mock data for DMS Settings module
 * TODO: Replace with actual API calls
 */

import type {
  SystemInfo,
  StorageInfo,
  SecuritySettings,
  PerformanceSettings,
  BackupSettings,
  LogEntry
} from './types';

export const mockSystemInfo: SystemInfo = {
  version: '2.1.4',
  buildDate: '2024-01-15T10:30:00Z',
  uptime: '15 days, 8 hours, 32 minutes',
  lastBackup: '2024-01-20T02:00:00Z',
  nextBackup: '2024-01-21T02:00:00Z',
  status: 'healthy',
  performance: {
    cpu: 45,
    memory: 67,
    disk: 23,
    network: 12
  }
};

export const mockStorageInfo: StorageInfo = {
  total: 1000, // GB
  used: 234, // GB
  available: 766, // GB
  breakdown: [
    { type: 'Documents', size: 120, percentage: 51.3, color: '#3b82f6' },
    { type: 'Images', size: 45, percentage: 19.2, color: '#10b981' },
    { type: 'Videos', size: 35, percentage: 15.0, color: '#f59e0b' },
    { type: 'Archives', size: 20, percentage: 8.5, color: '#ef4444' },
    { type: 'System', size: 14, percentage: 6.0, color: '#6b7280' }
  ],
  locations: [
    {
      id: '1',
      name: 'Primary Storage',
      path: '/var/dms/storage',
      type: 'Local',
      size: 500,
      used: 120,
      status: 'active'
    },
    {
      id: '2',
      name: 'Backup Storage',
      path: '/var/dms/backup',
      type: 'Local',
      size: 500,
      used: 114,
      status: 'active'
    }
  ]
};

export const mockSecuritySettings: SecuritySettings = {
  authentication: {
    method: 'jwt',
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15, // minutes
    requireMFA: false,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      maxAge: 90 // days
    }
  },
  encryption: {
    enabled: true,
    algorithm: 'AES-256',
    keyRotation: 90, // days
    lastRotation: '2024-01-01T00:00:00Z'
  },
  access: {
    ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
    allowedDomains: ['company.com', 'subsidiary.com'],
    blockTor: true,
    requireVPN: false
  },
  audit: {
    enabled: true,
    retentionDays: 365,
    logLevel: 'info',
    events: ['login', 'logout', 'file_access', 'file_modify', 'admin_action']
  }
};

export const mockPerformanceSettings: PerformanceSettings = {
  caching: {
    enabled: true,
    type: 'redis',
    ttl: 3600, // seconds
    maxMemory: '512MB'
  },
  indexing: {
    enabled: true,
    engine: 'elasticsearch',
    batchSize: 1000,
    interval: 300 // seconds
  },
  compression: {
    enabled: true,
    algorithm: 'gzip',
    level: 6,
    threshold: 1024 // bytes
  },
  optimization: {
    lazyLoading: true,
    imageOptimization: true,
    cdnEnabled: false,
    preloadCritical: true
  }
};

export const mockBackupSettings: BackupSettings = {
  enabled: true,
  schedule: 'daily',
  time: '02:00',
  retention: 30, // days
  compression: true,
  encryption: true,
  locations: [
    { id: '1', name: 'Local Backup', path: '/backups/local', enabled: true },
    { id: '2', name: 'Cloud Backup', path: 's3://dms-backups', enabled: true },
    { id: '3', name: 'Remote Server', path: 'ftp://backup.company.com', enabled: false }
  ]
};

export const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-20T14:30:00Z',
    level: 'info',
    category: 'system',
    message: 'System backup completed successfully',
    details: 'Backed up 1,234 files (2.3 GB) to local storage'
  },
  {
    id: '2',
    timestamp: '2024-01-20T14:25:00Z',
    level: 'warning',
    category: 'performance',
    message: 'High memory usage detected',
    details: 'Memory usage reached 85% (6.8 GB / 8 GB)'
  },
  {
    id: '3',
    timestamp: '2024-01-20T14:20:00Z',
    level: 'error',
    category: 'database',
    message: 'Database connection timeout',
    details: 'Failed to connect to primary database after 30 seconds'
  },
  {
    id: '4',
    timestamp: '2024-01-20T14:15:00Z',
    level: 'info',
    category: 'security',
    message: 'User login successful',
    details: 'User admin@company.com logged in from 192.168.1.100'
  },
  {
    id: '5',
    timestamp: '2024-01-20T14:10:00Z',
    level: 'info',
    category: 'file',
    message: 'Document uploaded',
    details: 'Document "contract_2024.pdf" uploaded by user john.doe'
  }
];
