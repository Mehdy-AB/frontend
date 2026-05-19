'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
  Server,
  ChevronRight,
  RefreshCw,
  Loader2,
  Zap,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ldapServerService } from '@/api/services/ldapServerService';

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
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

const RUN_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: 'Healthy', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  FAILED: { label: 'Failed', color: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20' },
  BLOCKED_BY_THRESHOLD: { label: 'Blocked', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  RUNNING: { label: 'Running', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20' },
};

// ─── Stat Card ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, iconBg, iconColor, valueColor }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; iconBg: string; iconColor: string; valueColor?: string;
}) {
  return (
    <Card className="group overflow-hidden border border-border/50 hover:shadow-md hover:border-primary/15 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 tracking-tight ${valueColor || ''}`}>{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

export default function SyncDashboardPanel() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchDashboard = useCallback(async (days?: number) => {
    try {
      const data = await ldapServerService.getSyncDashboard(days || parseInt(period));
      setDashboard(data);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => { setRefreshing(true); fetchDashboard(); };
  const handlePeriodChange = (v: string) => { setPeriod(v); setLoading(true); fetchDashboard(parseInt(v)); };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[88px] rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  // ── Computed values ──
  const servers = dashboard.servers || [];
  const totalServers = servers.length;
  const connectedServers = servers.filter((s: any) => s.status === 'CONNECTED').length;
  const totalUsers = servers.reduce((sum: number, s: any) => sum + (s.userCount || 0), 0);
  
  const hasData = dashboard.totalRuns > 0;
  const rawRate = hasData ? Math.round(((dashboard.completed || 0) / dashboard.totalRuns) * 100) : -1;
  const hasServers = totalServers > 0;
  const noSyncsYet = rawRate === -1 || !hasData;
  const successRate = noSyncsYet ? null : rawRate;

  const rateColor = noSyncsYet ? 'text-muted-foreground'
    : successRate! >= 95 ? 'text-emerald-600 dark:text-emerald-400'
    : successRate! >= 80 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';
  const rateBg = noSyncsYet ? 'bg-muted/50'
    : successRate! >= 95 ? 'bg-emerald-500/10' : successRate! >= 80 ? 'bg-amber-500/10' : 'bg-red-500/10';

  const timeline = dashboard.timeline || [];
  const maxDailyTotal = Math.max(1, ...timeline.map((d: any) =>
    (d.completed || 0) + (d.failed || 0) + (d.blocked || 0)
  ));

  return (
    <div className="space-y-4">
      {/* ══════════════════════════════════════════════════════════════
           HEADER & CONTROLS
         ══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Sync Dashboard</h2>
          <p className="text-sm text-gray-500">Overview of LDAP infrastructure health and synchronization metrics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="gap-2 rounded-xl border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
        >
          <RefreshCw className={`h-4 w-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           ROW 1 — Infrastructure Overview (always visible)
         ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group overflow-hidden border border-gray-200 hover:shadow-md hover:border-violet-200 transition-all duration-300 cursor-default rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Servers</p>
                <p className="text-2xl font-bold mt-1 tracking-tight text-gray-900">{totalServers}</p>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-50/80 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                <Server className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group overflow-hidden border border-gray-200 hover:shadow-md hover:border-violet-200 transition-all duration-300 cursor-default rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Connected</p>
                <p className="text-2xl font-bold mt-1 tracking-tight text-gray-900">{connectedServers}</p>
                {totalServers > 0 && <p className="text-[11px] text-gray-400 mt-0.5">{totalServers - connectedServers} offline</p>}
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-emerald-50/80 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group overflow-hidden border border-gray-200 hover:shadow-md hover:border-violet-200 transition-all duration-300 cursor-default rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold mt-1 tracking-tight text-gray-900">{totalUsers.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-violet-50/80 text-violet-600 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group overflow-hidden border border-gray-200 hover:shadow-md hover:border-violet-200 transition-all duration-300 cursor-default rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className={`text-2xl font-bold mt-1 tracking-tight ${noSyncsYet ? 'text-gray-400' : successRate! >= 95 ? 'text-emerald-600' : successRate! >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                  {noSyncsYet ? 'N/A' : `${successRate}%`}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{noSyncsYet ? 'No syncs yet' : `${dashboard.completed || 0}/${dashboard.totalRuns || 0} syncs`}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${noSyncsYet ? 'bg-gray-50 text-gray-400' : successRate! >= 95 ? 'bg-emerald-50 text-emerald-600' : successRate! >= 80 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           TOGGLE — Sync Details
         ══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between mt-6 px-1 border-t border-gray-100 pt-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-xl px-3 py-5 transition-colors"
          onClick={() => setDetailsOpen(!detailsOpen)}
        >
          <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200/50">
            <Activity className="h-4 w-4 text-gray-600" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold block">Sync Details & History</span>
            <span className="text-xs font-normal text-gray-400 block -mt-0.5">Click to view global timeline and recent failures</span>
          </div>
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-300 ${detailsOpen ? 'rotate-180' : ''}`} />
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500">Period:</span>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[130px] h-9 text-xs font-medium rounded-xl border-gray-200 shadow-sm bg-white hover:bg-gray-50 transition-colors">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-200 shadow-lg">
              <SelectItem value="7" className="text-xs font-medium rounded-lg">Last 7 Days</SelectItem>
              <SelectItem value="14" className="text-xs font-medium rounded-lg">Last 14 Days</SelectItem>
              <SelectItem value="30" className="text-xs font-medium rounded-lg">Last 30 Days</SelectItem>
              <SelectItem value="90" className="text-xs font-medium rounded-lg">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           EXPANDED — Performance, Chart, Health, Failures
         ══════════════════════════════════════════════════════════════ */}
      {detailsOpen && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 mt-4 bg-gray-50/50 p-6 rounded-[1.5rem] border border-gray-200/60 shadow-inner">

          {/* ── Row 2: Performance Metrics ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-gray-200 shadow-sm bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Users Provisioned</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{(dashboard.usersCreated || 0).toLocaleString()}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{(dashboard.usersDisabled || 0).toLocaleString()} disabled</p>
                </div>
                <div className="h-10 w-10 bg-violet-50 rounded-xl flex items-center justify-center border border-violet-100">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-gray-200 shadow-sm bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatDuration(dashboard.avgDurationSeconds || 0)}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">per sync run</p>
                </div>
                <div className="h-10 w-10 bg-cyan-50 rounded-xl flex items-center justify-center border border-cyan-100">
                  <Clock className="h-5 w-5 text-cyan-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-gray-200 shadow-sm bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sync Failures</p>
                  <p className={`text-2xl font-bold mt-1 ${dashboard.failed > 0 ? 'text-red-600' : 'text-gray-900'}`}>{dashboard.failed || 0}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{dashboard.blocked || 0} blocked · {dashboard.totalErrors || 0} row errors</p>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${dashboard.failed > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-100 border-gray-200'}`}>
                  <AlertTriangle className={`h-5 w-5 ${dashboard.failed > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Row 3: Chart + Failures side by side ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Sync Activity Chart */}
            <Card className="lg:col-span-2 border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="pb-3 px-5 pt-5 border-b border-gray-100/50">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className="h-7 w-7 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100/50">
                    <Zap className="h-4 w-4 text-amber-500" />
                  </div>
                  Sync Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {timeline.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                    <Activity className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-xs font-medium">No sync activity in this period</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-4 text-[11px] font-medium text-gray-500">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-emerald-500" /> Completed</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-red-500" /> Failed</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-amber-500" /> Blocked</span>
                    </div>
                    <div className="flex items-end gap-1 h-40">
                      {timeline.map((day: any, i: number) => {
                        const comp = day.completed || 0;
                        const fail = day.failed || 0;
                        const block = day.blocked || 0;
                        const total = comp + fail + block;
                        const heightPct = Math.max(4, (total / maxDailyTotal) * 100);
                        return (
                          <div key={day.date} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                            <div className="absolute bottom-full mb-2 bg-gray-900 text-white border-0 rounded-lg px-3 py-2 text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              <p className="font-semibold mb-1 pb-1 border-b border-gray-700">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              <div className="flex justify-between items-center gap-4"><span className="text-gray-300">Completed</span> <span>{comp}</span></div>
                              <div className="flex justify-between items-center gap-4"><span className="text-gray-300">Blocked</span> <span>{block}</span></div>
                              <div className="flex justify-between items-center gap-4"><span className="text-gray-300">Failed</span> <span>{fail}</span></div>
                            </div>
                            <div className="w-full flex-1 flex flex-col justify-end max-w-[20px]">
                              <div className="w-full rounded-t-sm overflow-hidden flex flex-col-reverse bg-gray-100 group-hover:bg-gray-200 transition-colors duration-300" style={{ height: `${heightPct}%` }}>
                                {comp > 0 && <div className="w-full bg-emerald-500/80 group-hover:bg-emerald-500 transition-colors" style={{ height: `${(comp / total) * 100}%` }} />}
                                {fail > 0 && <div className="w-full bg-red-500/80 group-hover:bg-red-500 transition-colors" style={{ height: `${(fail / total) * 100}%` }} />}
                                {block > 0 && <div className="w-full bg-amber-500/80 group-hover:bg-amber-500 transition-colors" style={{ height: `${(block / total) * 100}%` }} />}
                              </div>
                            </div>
                            {(i === 0 || i === timeline.length - 1 || i % Math.max(1, Math.floor(timeline.length / 5)) === 0) && (
                              <p className="text-[10px] text-gray-400 mt-2 truncate w-full text-center">
                                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Failures */}
            <Card className="border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="pb-3 px-5 pt-5 border-b border-gray-100/50">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className="h-7 w-7 bg-red-50 rounded-lg flex items-center justify-center border border-red-100/50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  Recent Failures
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(dashboard.recentFailures || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">All Clear</p>
                    <p className="text-xs text-gray-500 mt-1">No sync failures detected in this period</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[250px] overflow-y-auto">
                    {(dashboard.recentFailures || []).map((f: any, i: number) => (
                      <div
                        key={f.id || i}
                        className="p-4 hover:bg-gray-50/80 transition-colors cursor-pointer"
                        onClick={() => f.serverId && router.push(`/admin/users/ldap-servers/${f.serverId}`)}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-semibold text-gray-900 truncate pr-2">{f.serverName || 'Unknown Server'}</p>
                          <span className="text-[10px] text-gray-400 shrink-0 bg-gray-100 px-1.5 py-0.5 rounded-md">{formatTimeAgo(f.at)}</span>
                        </div>
                        <p className="text-[11px] text-red-600 bg-red-50 border border-red-100/50 p-2 rounded-lg line-clamp-2 leading-relaxed">
                          {f.error || 'Unknown error occurred during sync.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Row 4: Server Health Grid ── */}
          {hasServers && (
            <Card className="border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="pb-3 px-5 pt-5 border-b border-gray-100/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className="h-7 w-7 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100/50">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  Global Server Health
                </CardTitle>
                <CardDescription className="text-xs m-0">Click a server to view its full details</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {servers.map((srv: any, index: number) => {
                    const runSt = RUN_STATUS_CONFIG[srv.lastRunStatus] || RUN_STATUS_CONFIG.COMPLETED;
                    const isConnected = srv.status === 'CONNECTED';
                    return (
                      <div
                        key={srv.id || srv.serverId || index}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all cursor-pointer group"
                        onClick={() => router.push(`/admin/users/ldap-servers/${srv.id || srv.serverId}`)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-3 w-3 rounded-full flex-shrink-0 shadow-sm ${isConnected ? 'bg-emerald-500 shadow-emerald-500/30' : srv.status === 'ERROR' ? 'bg-red-500 shadow-red-500/30' : 'bg-gray-400'}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{srv.name || srv.serverName}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {(srv.userCount || 0).toLocaleString()} users · Last sync {formatTimeAgo(srv.lastSync)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {srv.lastRunStatus && (
                            <Badge className={`${runSt.color} text-[10px] border py-0 h-5`}>{runSt.label}</Badge>
                          )}
                          {srv.lastRunDuration != null && (
                            <span className="text-[11px] text-muted-foreground tabular-nums">{formatDuration(srv.lastRunDuration)}</span>
                          )}
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
