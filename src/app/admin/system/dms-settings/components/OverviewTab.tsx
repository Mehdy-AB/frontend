'use client';

import {
  Activity,
  Server,
  Database,
  Search,
  FileText,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SystemInfo, ServiceHealth, CoreSettings } from '../lib/types';

interface OverviewTabProps {
  systemInfo: SystemInfo;
  coreSettings: CoreSettings;
  onCoreSettingsChange: (settings: CoreSettings) => void;
  serviceHealth: ServiceHealth[];
  healthLoading: boolean;
  onRefreshHealth: () => void;
}

const serviceIcons: Record<string, any> = {
  'PostgreSQL': Database,
  'RabbitMQ': Server,
  'Elasticsearch': Search,
  'Tesseract OCR': FileText,
  'OCRmyPDF': FileText,
  'MinIO': HardDrive,
};

const statusColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'UP': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'DOWN': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  'DEGRADED': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
};

export default function OverviewTab({ systemInfo, coreSettings, onCoreSettingsChange, serviceHealth, healthLoading, onRefreshHealth }: OverviewTabProps) {
  const upCount = serviceHealth.filter(s => s.status === 'UP').length;
  const downCount = serviceHealth.filter(s => s.status === 'DOWN').length;
  const degradedCount = serviceHealth.filter(s => s.status === 'DEGRADED').length;

  return (
    <div className="space-y-6">
      {/* Core System Settings */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Core System
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System Name / Branding</label>
            <input
              type="text"
              value={coreSettings.systemName}
              onChange={(e) => onCoreSettingsChange({ ...coreSettings, systemName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Language</label>
            <select
              value={coreSettings.defaultLanguage}
              onChange={(e) => onCoreSettingsChange({ ...coreSettings, defaultLanguage: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="en">English</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
              <option value="es">Español (Spanish)</option>
              <option value="tr">Türkçe (Turkish)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={coreSettings.timezone}
              onChange={(e) => onCoreSettingsChange({ ...coreSettings, timezone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="UTC">UTC</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Berlin">Europe/Berlin (CET)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Asia/Riyadh">Asia/Riyadh (AST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
            <select
              value={coreSettings.dateFormat}
              onChange={(e) => onCoreSettingsChange({ ...coreSettings, dateFormat: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="yyyy-MM-dd">yyyy-MM-dd (2025-03-31)</option>
              <option value="dd/MM/yyyy">dd/MM/yyyy (31/03/2025)</option>
              <option value="MM/dd/yyyy">MM/dd/yyyy (03/31/2025)</option>
              <option value="dd.MM.yyyy">dd.MM.yyyy (31.03.2025)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number Format</label>
            <select
              value={coreSettings.numberFormat}
              onChange={(e) => onCoreSettingsChange({ ...coreSettings, numberFormat: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="#,##0.##">1,234.56 (US/UK)</option>
              <option value="#.##0,##">1.234,56 (EU)</option>
              <option value="# ##0,##">1 234,56 (FR)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Service Health Dashboard */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Service Health
          </h3>
          <div className="flex items-center gap-3">
            {/* Summary badges */}
            <div className="flex items-center gap-2 text-sm">
              {upCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                  <CheckCircle2 className="h-3 w-3" /> {upCount} UP
                </span>
              )}
              {degradedCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                  <AlertTriangle className="h-3 w-3" /> {degradedCount} DEGRADED
                </span>
              )}
              {downCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                  <XCircle className="h-3 w-3" /> {downCount} DOWN
                </span>
              )}
            </div>
            <Button size="sm" variant="outline" className="gap-1" onClick={onRefreshHealth} disabled={healthLoading}>
              {healthLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Check Now
            </Button>
          </div>
        </div>

        {serviceHealth.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading service health...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {serviceHealth.map((service) => {
              const colors = statusColors[service.status] || statusColors['DOWN'];
              const Icon = serviceIcons[service.name] || Server;
              return (
                <div
                  key={service.name}
                  className={`${colors.bg} border ${colors.border} rounded-lg p-4 transition-all`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${colors.text}`} />
                      <span className="font-medium text-sm text-gray-800">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${colors.dot} ${service.status === 'UP' ? '' : 'animate-pulse'}`} />
                      <span className={`text-xs font-semibold ${colors.text}`}>{service.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{service.responseTimeMs}ms</span>
                    <span>{new Date(service.lastCheckedAt).toLocaleTimeString()}</span>
                  </div>
                  {service.errorMessage && (
                    <p className="text-xs text-red-600 mt-2 truncate" title={service.errorMessage}>
                      {service.errorMessage}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* System Performance (from existing mock) */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">System Performance</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'CPU Usage', value: systemInfo.performance.cpu, color: 'bg-blue-500' },
            { label: 'Memory', value: systemInfo.performance.memory, color: 'bg-green-500' },
            { label: 'Disk', value: systemInfo.performance.disk, color: 'bg-purple-500' },
            { label: 'Network', value: systemInfo.performance.network, color: 'bg-orange-500' },
          ].map((metric) => (
            <div key={metric.label} className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${metric.value}, 100`}
                    className={metric.color.replace('bg-', 'text-')}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                  {metric.value}%
                </span>
              </div>
              <span className="text-sm text-gray-600">{metric.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
