'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import {
  ArrowLeft,
  Server,
  Shield,
  Users,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Settings,
  Loader2,
  Wifi,
  WifiOff,
  Search,
  ChevronDown,
  Play,
  Eye,
  Zap,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ldapServerService } from '@/api/services/ldapServerService';
import SyncHistoryPanel from '../_components/SyncHistoryPanel';
import IdentityReviewPanel from '../_components/IdentityReviewPanel';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ServerDetail {
  id: string;
  name: string;
  serverType: string;
  hostname: string;
  port: number;
  status: string;
  enabled: boolean;
  userCount: number;
  groupCount: number;
  syncCount: number;
  errorCount: number;
  lastSync: string;
  lastTest: string;
  nextSyncAt: string;
  syncSchedule: string;
  autoDisableUsers: boolean;
  deletionThresholdPercent: number;
  resolveNestedGroups: boolean;
  jitProvisioning: boolean;
  immutableIdAttribute: string;
  fieldOwnership: Record<string, string>;
  syncManagers: boolean;
  syncDepartment: boolean;
  useSSL: boolean;
  useTLS: boolean;
  description: string;
  createdByName: string;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusConfig(status: string) {
  switch (status?.toUpperCase()) {
    case 'CONNECTED':
      return { label: 'Connected', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500' };
    case 'ERROR':
      return { label: 'Error', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-500' };
    case 'DISCONNECTED':
      return { label: 'Disconnected', icon: WifiOff, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', dot: 'bg-gray-400' };
    default:
      return { label: status || 'Unknown', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500' };
  }
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const SCHEDULE_LABELS: Record<string, string> = {
  MANUAL: 'Manual', EVERY_15_MIN: 'Every 15 min', EVERY_30_MIN: 'Every 30 min',
  HOURLY: 'Hourly', EVERY_6_HOURS: 'Every 6 hours', DAILY: 'Daily',
};

const OWNERSHIP_LABELS: Record<string, { label: string; color: string }> = {
  directory: { label: 'Directory', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  ecm: { label: 'ECM Only', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20' },
  hybrid: { label: 'Hybrid', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20' },
};

const SYNC_MODES = [
  { value: 'FULL', label: 'Full Sync', icon: RefreshCw, desc: 'Complete directory synchronization' },
  { value: 'INCREMENTAL', label: 'Incremental', icon: Zap, desc: 'Only changed entries since last sync' },
  { value: 'DRY_RUN', label: 'Dry Run', icon: Eye, desc: 'Preview changes without applying' },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export default function LdapServerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.serverId as string;

  const { showSuccess, showError, showWarning } = useNotifications();

  const [server, setServer] = useState<ServerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastSyncRun, setLastSyncRun] = useState<any>(null);

  // Search preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const fetchServer = useCallback(async () => {
    try {
      const data = await ldapServerService.getServerById(serverId);
      setServer(data as any);
    } catch {
      showError('Failed to load server details');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  const fetchLastSyncRun = useCallback(async () => {
    try {
      const run = await ldapServerService.getLatestSyncRun(serverId);
      setLastSyncRun(run);
    } catch { /* no runs yet */ }
  }, [serverId]);

  useEffect(() => {
    fetchServer();
    fetchLastSyncRun();
  }, [fetchServer, fetchLastSyncRun]);

  const handleSync = async (mode: 'FULL' | 'INCREMENTAL' | 'DRY_RUN') => {
    setSyncing(true);
    try {
      const result = await ldapServerService.syncUsers(serverId, mode);
      if ((result as any).thresholdBlocked) {
        showWarning('Sync blocked by safety threshold', 'Review the Identity Review panel for details.');
      } else if (mode === 'DRY_RUN') {
        showSuccess('Dry run complete', `${result.imported} users would be imported, ${result.updated} would be updated.`);
      } else {
        showSuccess('Synchronization complete', `${result.imported} users imported, ${result.updated} updated from the server.`);
      }
      fetchServer();
      fetchLastSyncRun();
    } catch {
      showError('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await ldapServerService.testConnection(serverId);
      if (result.success) showSuccess('Connection successful');
      else showError('Connection failed', result.message);
      fetchServer();
    } catch {
      showError('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSearchPreview = async () => {
    setPreviewLoading(true);
    try {
      const data = await ldapServerService.getSearchPreview(serverId, 15);
      setPreviewData(data);
      if (!data.success) showError(data.error || 'Preview failed');
    } catch {
      showError('Failed to run search preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Server className="h-16 w-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">Server not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/users/ldap-servers')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Servers
        </Button>
      </div>
    );
  }

  const st = statusConfig(server.status);
  const StatusIcon = st.icon;
  const fieldEntries = Object.entries(server.fieldOwnership || {});
  const isThresholdBlocked =
    lastSyncRun?.status === 'BLOCKED_BY_THRESHOLD';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="mt-1 rounded-xl"
            onClick={() => router.push('/admin/users/ldap-servers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-12 w-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 mt-0.5">
            <Server className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{server.name}</h1>
              <Badge className={`${st.bg} border gap-1.5 rounded-full`}>
                <span className={`h-2 w-2 rounded-full ${st.dot} animate-pulse`} />
                {st.label}
              </Badge>
              {!server.enabled && <Badge variant="secondary" className="text-xs rounded-full">Disabled</Badge>}
            </div>
            <p className="text-gray-500 text-sm font-medium">
              {server.serverType} · {server.hostname}:{server.port}
              {server.useSSL ? ' · SSL' : server.useTLS ? ' · TLS' : ''}
              {server.description ? ` · ${server.description}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm min-w-[120px]">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Users Synced</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="text-xl font-bold text-gray-900">{server.userCount?.toLocaleString() || 0}</span>
              </div>
            </div>
            <div className="flex flex-col px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm min-w-[120px]">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Syncs</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-xl font-bold text-gray-900">{server.syncCount?.toLocaleString() || 0}</span>
              </div>
            </div>
            <div className="flex flex-col px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm min-w-[120px]">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Errors</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="text-xl font-bold text-gray-900">{server.errorCount || 0}</span>
              </div>
            </div>
            <div className="w-px h-10 bg-gray-200 mx-2"></div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleTest}
              disabled={testing || syncing} className="h-10 px-4 gap-2 rounded-xl">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
              Test
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={syncing || testing} className="h-10 px-4 gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl shadow-md border-0">
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Sync <ChevronDown className="h-3 w-3 opacity-60 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-xl border-gray-100">
                {SYNC_MODES.map((mode) => (
                  <DropdownMenuItem
                    key={mode.value}
                    onClick={() => handleSync(mode.value as any)}
                    className="flex items-start gap-3 py-3 cursor-pointer rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <mode.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{mode.label}</p>
                      <p className="text-xs text-muted-foreground">{mode.desc}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ── Threshold Blocked Alert ── */}
      {isThresholdBlocked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800">
                Safety Threshold Triggered
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                {lastSyncRun.errorSummary || `The last sync was blocked because the deletion threshold was exceeded. 
                ${lastSyncRun.thresholdTriggered}% of users would have been disabled.`}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={() => handleSync('DRY_RUN')}>
                  <Eye className="h-3.5 w-3.5" /> Preview Changes
                </Button>
                <p className="text-xs text-amber-600">
                  Run a dry-run to preview what would happen, or adjust the threshold in Settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Tabs ── */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-gray-100/80 backdrop-blur-sm rounded-xl p-1 inline-flex h-11 border border-gray-200 shadow-inner">
          <TabsTrigger value="overview" className="gap-2 text-sm font-medium rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all duration-200">
            <Settings className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 text-sm font-medium rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all duration-200">
            <Activity className="h-4 w-4" /> Sync History
          </TabsTrigger>
          <TabsTrigger value="identity" className="gap-2 text-sm font-medium rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all duration-200">
            <Shield className="h-4 w-4" /> Identity Review
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2 text-sm font-medium rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all duration-200">
            <Search className="h-4 w-4" /> Search Preview
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Overview ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sync Configuration */}
            <Card className="rounded-2xl border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                  <RefreshCw className="h-4 w-4" /> Sync Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {[
                  { label: 'Schedule', value: SCHEDULE_LABELS[server.syncSchedule] || server.syncSchedule },
                  { label: 'Auto-Disable Users', badge: server.autoDisableUsers },
                  { label: 'Immutable ID', code: server.immutableIdAttribute || 'objectGUID' },
                  { label: 'Nested Groups', badge: server.resolveNestedGroups },
                  { label: 'Sync Managers', badge: server.syncManagers ?? false },
                  { label: 'Sync Department', badge: server.syncDepartment ?? false },
                  { label: 'JIT Provisioning', badge: server.jitProvisioning },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{row.label}</span>
                    {row.value && <span className="text-sm font-medium text-gray-900">{row.value}</span>}
                    {row.code && <code className="text-xs bg-gray-100 px-2 py-1 rounded-md font-mono text-gray-700">{row.code}</code>}
                    {row.badge !== undefined && (
                      <Badge variant={row.badge ? 'default' : 'secondary'} className="text-xs rounded-full">
                        {row.badge ? 'Enabled' : 'Disabled'}
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Safety & Governance */}
            <Card className="rounded-2xl border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                  <Shield className="h-4 w-4" /> Safety & Governance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                    <Shield className="h-24 w-24 text-amber-500" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Safety Threshold</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-[80%]">
                          Blocks sync if deletion count exceeds this percentage to prevent mass outages.
                        </p>
                      </div>
                      <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold border border-amber-200 shadow-sm">
                        {server.deletionThresholdPercent || 20}%
                      </div>
                    </div>
                    
                    <div className="relative h-2 w-full bg-gray-100 rounded-full mt-6 shadow-inner">
                      <div className="absolute top-0 left-0 h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${server.deletionThresholdPercent || 20}%` }}></div>
                      <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-amber-500 rounded-full shadow-md transition-all duration-500" style={{ left: `calc(${server.deletionThresholdPercent || 20}% - 8px)` }}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      <span>Strict (0%)</span>
                      <span>Lenient (100%)</span>
                    </div>
                  </div>
                </div>

                {/* Field Ownership Table */}
                {fieldEntries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5" /> Field Ownership
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {fieldEntries.map(([field, owner]) => {
                        const ownerConfig = OWNERSHIP_LABELS[owner] || OWNERSHIP_LABELS.directory;
                        return (
                          <div key={field} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                            <span className="text-xs font-medium capitalize">{field}</span>
                            <Badge className={`${ownerConfig.color} text-xs border`}>
                              {ownerConfig.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab: Sync History ── */}
        <TabsContent value="history">
          <SyncHistoryPanel serverId={serverId} />
        </TabsContent>

        {/* ── Tab: Identity Review ── */}
        <TabsContent value="identity">
          <IdentityReviewPanel serverId={serverId} />
        </TabsContent>

        {/* ── Tab: Search Preview ── */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4" /> Search Preview
                  </CardTitle>
                  <CardDescription>
                    Test your LDAP filters to see which users and groups would be found during sync
                  </CardDescription>
                </div>
                <Button size="sm" onClick={handleSearchPreview}
                  disabled={previewLoading} className="gap-2">
                  {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Run Preview
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!previewData && !previewLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Search className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium">No preview data yet</p>
                  <p className="text-xs mt-1">Click "Run Preview" to test your LDAP search filters</p>
                </div>
              )}

              {previewLoading && (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              )}

              {previewData && !previewLoading && (
                <div className="space-y-6">
                  {!previewData.success && (
                    <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                      <p className="text-sm text-red-600 font-medium">Preview Failed</p>
                      <p className="text-xs text-muted-foreground mt-1">{previewData.error}</p>
                    </div>
                  )}

                  {/* User Preview */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Users Found
                        <span className="ml-2 text-gray-500 font-normal">({previewData.userCount})</span>
                      </h4>
                    </div>
                    {previewData.userSizeLimitHit && (
                      <div className="mb-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-700 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                        <span>{previewData.userNote}</span>
                      </div>
                    )}
                    {previewData.users?.length > 0 ? (
                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50/80 border-b border-gray-200">
                              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</TableHead>
                              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Display Name</TableHead>
                              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</TableHead>
                              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">DN</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.users.map((u: any, i: number) => (
                              <TableRow key={i} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                <TableCell className="font-mono text-xs text-gray-700">{u.username}</TableCell>
                                <TableCell className="text-sm text-gray-900 font-medium">{u.displayName}</TableCell>
                                <TableCell className="text-xs text-gray-500">{u.email}</TableCell>
                                <TableCell className="text-[11px] text-gray-400 font-mono max-w-[200px] truncate" title={u.dn}>
                                  {u.dn}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50">
                        <Users className="h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-sm font-medium text-gray-600">No users found</p>
                        <p className="text-xs text-gray-400 mt-1">Adjust your user search filter and try again.</p>
                      </div>
                    )}
                  </div>

                  {/* Group Preview */}
                  <div>
                    <div className="flex items-center gap-2 mb-3 mt-6">
                      <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                        <Shield className="h-4 w-4 text-emerald-600" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Groups Found
                        <span className="ml-2 text-gray-500 font-normal">({previewData.groupCount})</span>
                      </h4>
                    </div>
                    {previewData.groupSizeLimitHit && (
                      <div className="mb-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-700 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                        <span>{previewData.groupNote}</span>
                      </div>
                    )}
                    {previewData.groups?.length > 0 ? (
                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50/80 border-b border-gray-200">
                              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</TableHead>
                              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</TableHead>
                              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">DN</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.groups.map((g: any, i: number) => (
                              <TableRow key={i} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                <TableCell className="text-sm text-gray-900 font-medium">{g.name}</TableCell>
                                <TableCell className="text-xs text-gray-500">{g.description}</TableCell>
                                <TableCell className="text-[11px] text-gray-400 font-mono max-w-[250px] truncate" title={g.dn}>
                                  {g.dn}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50">
                        <Shield className="h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-sm font-medium text-gray-600">No groups found</p>
                        <p className="text-xs text-gray-400 mt-1">Adjust your group search filter or ensure it is configured.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
