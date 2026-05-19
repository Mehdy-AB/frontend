/**
 * Custom hooks for DMS Settings module — wired to real API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { settingsService, type SettingValue, type ServiceHealth as APIServiceHealth } from '@/api/services/settingsService';
import type {
  SystemInfo,
  StorageInfo,
  SecuritySettings,
  PerformanceSettings,
  BackupSettings,
  LogEntry,
  ServiceHealth,
  CoreSettings,
  StorageSettings,
  UploadRules
} from './types';
import {
  mockSystemInfo,
  mockStorageInfo,
  mockBackupSettings,
  mockLogs
} from './mockData';

// ═══════════════════════════════════════════════════════════════
// Helper: parse API settings into typed objects
// ═══════════════════════════════════════════════════════════════

function val(settings: Record<string, SettingValue>, key: string, fallback: string = ''): string {
  return settings[key]?.value ?? fallback;
}
function valInt(settings: Record<string, SettingValue>, key: string, fallback: number = 0): number {
  const v = settings[key]?.value;
  if (!v) return fallback;
  const parsed = parseInt(v, 10);
  return isNaN(parsed) ? fallback : parsed;
}
function valBool(settings: Record<string, SettingValue>, key: string, fallback: boolean = false): boolean {
  return settings[key]?.value === 'true' ? true : settings[key]?.value === 'false' ? false : fallback;
}

function parseSecuritySettings(sec: Record<string, SettingValue>): SecuritySettings {
  return {
    authentication: {
      method: 'JWT',
      sessionTimeout: valInt(sec, 'session.timeout.minutes', 30),
      maxLoginAttempts: valInt(sec, 'max.login.attempts', 5),
      lockoutDuration: valInt(sec, 'lockout.duration.minutes', 15),
      requireMFA: valBool(sec, 'mfa.required'),
      conditionalMFA: valBool(sec, 'mfa.conditional'),
      passwordPolicy: {
        minLength: valInt(sec, 'password.min.length', 8),
        requireUppercase: valBool(sec, 'password.require.uppercase', true),
        requireLowercase: valBool(sec, 'password.require.lowercase', true),
        requireNumbers: valBool(sec, 'password.require.numbers', true),
        requireSymbols: valBool(sec, 'password.require.symbols', true),
        maxAge: valInt(sec, 'password.rotation.days', 90),
      }
    },
    encryption: { enabled: true, algorithm: 'AES-256', keyRotation: 90, lastRotation: new Date().toISOString() },
    access: { ipWhitelist: [], allowedDomains: [], blockTor: false, requireVPN: false },
    audit: { enabled: true, retentionDays: 365, logLevel: 'info', events: ['login', 'document_access', 'settings_change'] }
  };
}

function parsePerformanceSettings(perf: Record<string, SettingValue>): PerformanceSettings {
  return {
    asyncProcessingEnabled: valBool(perf, 'async.processing.enabled', true),
    maxConcurrentJobs: valInt(perf, 'max.concurrent.jobs', 4),
    caching: {
      enabled: valBool(perf, 'caching.enabled', true),
      type: val(perf, 'caching.strategy', 'LRU'),
      ttl: valInt(perf, 'caching.ttl.seconds', 3600),
      maxMemory: '512MB'
    },
    indexing: {
      enabled: true,
      engine: 'Elasticsearch',
      batchSize: valInt(perf, 'indexing.batch.size', 50),
      interval: valInt(perf, 'indexing.interval.seconds', 10)
    },
    compression: { enabled: true, algorithm: 'GZIP', level: 6, threshold: 1024 },
    optimization: { lazyLoading: true, imageOptimization: true, cdnEnabled: false, preloadCritical: true }
  };
}

function parseCoreSettings(core: Record<string, SettingValue>): CoreSettings {
  return {
    systemName: val(core, 'system.name', 'GiDoc ECM'),
    defaultLanguage: val(core, 'default.language', 'en'),
    timezone: val(core, 'timezone', 'UTC'),
    dateFormat: val(core, 'date.format', 'yyyy-MM-dd'),
    numberFormat: val(core, 'number.format', '#,##0.##'),
  };
}

function parseStorageSettings(stor: Record<string, SettingValue>): StorageSettings {
  return {
    defaultBackend: val(stor, 'default.backend', 'MINIO'),
    tierHot: valBool(stor, 'storage.tier.hot', true),
    tierWarm: valBool(stor, 'storage.tier.warm', true),
    tierArchive: valBool(stor, 'storage.tier.archive', true),
    maxFileSizeMb: valInt(stor, 'max.file.size.mb', 50),
    chunkUploadSizeMb: valInt(stor, 'chunk.upload.size.mb', 10),
  };
}

function parseUploadRules(upload: Record<string, SettingValue>): UploadRules {
  return {
    allowedMimeTypes: val(upload, 'allowed.mime.types', ''),
    blockedFileTypes: val(upload, 'blocked.file.types', ''),
    archiveHandling: val(upload, 'archive.handling', 'EXTRACT_AND_INDEX'),
  };
}

// ═══════════════════════════════════════════════════════════════
// Main Hook
// ═══════════════════════════════════════════════════════════════

export function useDMSSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API-driven state
  const [coreSettings, setCoreSettings] = useState<CoreSettings>({
    systemName: 'GiDoc ECM', defaultLanguage: 'en', timezone: 'UTC', dateFormat: 'yyyy-MM-dd', numberFormat: '#,##0.##'
  });
  const [storageSettings, setStorageSettings] = useState<StorageSettings>({
    defaultBackend: 'MINIO', tierHot: true, tierWarm: true, tierArchive: true, maxFileSizeMb: 50, chunkUploadSizeMb: 10
  });
  const [uploadRules, setUploadRules] = useState<UploadRules>({
    allowedMimeTypes: '', blockedFileTypes: '', archiveHandling: 'EXTRACT_AND_INDEX'
  });
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    authentication: { method: 'JWT', sessionTimeout: 30, maxLoginAttempts: 5, lockoutDuration: 15, requireMFA: false, conditionalMFA: false, passwordPolicy: { minLength: 8, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSymbols: true, maxAge: 90 } },
    encryption: { enabled: true, algorithm: 'AES-256', keyRotation: 90, lastRotation: '' },
    access: { ipWhitelist: [], allowedDomains: [], blockTor: false, requireVPN: false },
    audit: { enabled: true, retentionDays: 365, logLevel: 'info', events: [] }
  });
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>({
    asyncProcessingEnabled: true, maxConcurrentJobs: 4,
    caching: { enabled: true, type: 'LRU', ttl: 3600, maxMemory: '512MB' },
    indexing: { enabled: true, engine: 'Elasticsearch', batchSize: 50, interval: 10 },
    compression: { enabled: true, algorithm: 'GZIP', level: 6, threshold: 1024 },
    optimization: { lazyLoading: true, imageOptimization: true, cdnEnabled: false, preloadCritical: true }
  });
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [healthLoading, setHealthLoading] = useState(false);

  // Keep mock-based state for tabs not yet API-backed
  const [systemInfo, setSystemInfo] = useState<SystemInfo>(mockSystemInfo);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>(mockStorageInfo);
  const [backupSettings, setBackupSettings] = useState<BackupSettings>(mockBackupSettings);
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [logFilter, setLogFilter] = useState<string>('all');

  // ═══════════════════════════════════════════════════════════════
  // Fetch all settings from API
  // ═══════════════════════════════════════════════════════════════

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const all = await settingsService.getAllSettings();

      if (all.CORE) setCoreSettings(parseCoreSettings(all.CORE as any));
      if (all.STORAGE) setStorageSettings(parseStorageSettings(all.STORAGE as any));
      if (all.UPLOAD) setUploadRules(parseUploadRules(all.UPLOAD as any));
      if (all.SECURITY) setSecuritySettings(parseSecuritySettings(all.SECURITY as any));
      if (all.PERFORMANCE) setPerformanceSettings(parsePerformanceSettings(all.PERFORMANCE as any));

      // Update system info from core settings
      if (all.CORE) {
        setSystemInfo(prev => ({
          ...prev,
          version: '2.1.0',
          status: 'healthy',
        }));
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setError(err?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // Fetch service health
  // ═══════════════════════════════════════════════════════════════

  const fetchHealth = useCallback(async () => {
    try {
      setHealthLoading(true);
      const health = await settingsService.getServiceHealth();
      setServiceHealth(health as ServiceHealth[]);

      // Update system status based on service health
      const hasDown = health.some(s => s.status === 'DOWN');
      const hasDegraded = health.some(s => s.status === 'DEGRADED');
      setSystemInfo(prev => ({
        ...prev,
        status: hasDown ? 'error' : hasDegraded ? 'warning' : 'healthy'
      }));
    } catch (err) {
      console.error('Failed to load service health:', err);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const triggerHealthCheck = useCallback(async () => {
    try {
      setHealthLoading(true);
      const health = await settingsService.triggerHealthCheck();
      setServiceHealth(health as ServiceHealth[]);

      // Update system status based on service health
      const hasDown = health.some(s => s.status === 'DOWN');
      const hasDegraded = health.some(s => s.status === 'DEGRADED');
      setSystemInfo(prev => ({
        ...prev,
        status: hasDown ? 'error' : hasDegraded ? 'warning' : 'healthy'
      }));
    } catch (err) {
      console.error('Failed to trigger health check:', err);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // Save settings to API
  // ═══════════════════════════════════════════════════════════════

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updates: Record<string, string> = {};

      // Core settings
      updates['CORE.system.name'] = coreSettings.systemName;
      updates['CORE.default.language'] = coreSettings.defaultLanguage;
      updates['CORE.timezone'] = coreSettings.timezone;
      updates['CORE.date.format'] = coreSettings.dateFormat;
      updates['CORE.number.format'] = coreSettings.numberFormat;

      // Storage settings
      updates['STORAGE.default.backend'] = storageSettings.defaultBackend;
      updates['STORAGE.storage.tier.hot'] = String(storageSettings.tierHot);
      updates['STORAGE.storage.tier.warm'] = String(storageSettings.tierWarm);
      updates['STORAGE.storage.tier.archive'] = String(storageSettings.tierArchive);
      updates['STORAGE.max.file.size.mb'] = String(storageSettings.maxFileSizeMb);
      updates['STORAGE.chunk.upload.size.mb'] = String(storageSettings.chunkUploadSizeMb);

      // Upload rules
      updates['UPLOAD.allowed.mime.types'] = uploadRules.allowedMimeTypes;
      updates['UPLOAD.blocked.file.types'] = uploadRules.blockedFileTypes;
      updates['UPLOAD.archive.handling'] = uploadRules.archiveHandling;

      // Security settings
      updates['SECURITY.max.login.attempts'] = String(securitySettings.authentication.maxLoginAttempts);
      updates['SECURITY.lockout.duration.minutes'] = String(securitySettings.authentication.lockoutDuration);
      updates['SECURITY.password.min.length'] = String(securitySettings.authentication.passwordPolicy.minLength);
      updates['SECURITY.password.require.uppercase'] = String(securitySettings.authentication.passwordPolicy.requireUppercase);
      updates['SECURITY.password.require.lowercase'] = String(securitySettings.authentication.passwordPolicy.requireLowercase);
      updates['SECURITY.password.require.numbers'] = String(securitySettings.authentication.passwordPolicy.requireNumbers);
      updates['SECURITY.password.require.symbols'] = String(securitySettings.authentication.passwordPolicy.requireSymbols);
      updates['SECURITY.password.rotation.days'] = String(securitySettings.authentication.passwordPolicy.maxAge);
      updates['SECURITY.session.timeout.minutes'] = String(securitySettings.authentication.sessionTimeout);
      updates['SECURITY.mfa.required'] = String(securitySettings.authentication.requireMFA);
      updates['SECURITY.mfa.conditional'] = String(securitySettings.authentication.conditionalMFA);

      // Performance settings
      updates['PERFORMANCE.async.processing.enabled'] = String(performanceSettings.asyncProcessingEnabled);
      updates['PERFORMANCE.max.concurrent.jobs'] = String(performanceSettings.maxConcurrentJobs);
      updates['PERFORMANCE.caching.enabled'] = String(performanceSettings.caching.enabled);
      updates['PERFORMANCE.caching.ttl.seconds'] = String(performanceSettings.caching.ttl);
      updates['PERFORMANCE.caching.strategy'] = performanceSettings.caching.type;
      updates['PERFORMANCE.indexing.batch.size'] = String(performanceSettings.indexing.batchSize);
      updates['PERFORMANCE.indexing.interval.seconds'] = String(performanceSettings.indexing.interval);

      await settingsService.updateSettings(updates);
      setError(null);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err?.message || 'Failed to save settings');
      throw err; // Re-throw so the page can show error
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Initial load
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    fetchSettings();
    fetchHealth();
  }, [fetchSettings, fetchHealth]);

  // Poll health every 60s
  const healthIntervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    healthIntervalRef.current = setInterval(() => {
      fetchHealth();
    }, 60000);
    return () => {
      if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
    };
  }, [fetchHealth]);

  const filteredLogs = logs.filter(log => logFilter === 'all' || log.level === logFilter);

  return {
    loading,
    saving,
    error,
    // API-driven
    coreSettings,
    storageSettings,
    uploadRules,
    securitySettings,
    performanceSettings,
    serviceHealth,
    healthLoading,
    setCoreSettings,
    setStorageSettings,
    setUploadRules,
    setSecuritySettings,
    setPerformanceSettings,
    // Still mock-based
    systemInfo,
    storageInfo,
    backupSettings,
    logs: filteredLogs,
    logFilter,
    setSystemInfo,
    setStorageInfo,
    setBackupSettings,
    setLogs,
    setLogFilter,
    // Actions
    handleSaveSettings,
    fetchSettings,
    fetchHealth,
    triggerHealthCheck,
  };
}
