'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNotifications } from '@/hooks/useNotifications';
import {
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Clock,
  Users,
  Shield,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Activity,
  Search,
} from 'lucide-react';
import { ldapServerService } from '@/api/services/ldapServerService';
import type { DirectorySyncRun } from './ldap-types';

interface SyncHistoryPanelProps {
  serverId: string;
}

function statusBadge(status: DirectorySyncRun['status']) {
  switch (status) {
    case 'COMPLETED':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1 rounded-full">
          <CheckCircle2 className="h-3 w-3" /> Completed
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20 gap-1 rounded-full">
          <XCircle className="h-3 w-3" /> Failed
        </Badge>
      );
    case 'BLOCKED_BY_THRESHOLD':
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 gap-1 rounded-full">
          <Shield className="h-3 w-3" /> Blocked
        </Badge>
      );
    case 'RUNNING':
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20 gap-1 rounded-full">
          <Loader2 className="h-3 w-3 animate-spin" /> Running
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge className="bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20 gap-1 rounded-full">
          <XCircle className="h-3 w-3" /> Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function modeBadge(mode: DirectorySyncRun['mode']) {
  switch (mode) {
    case 'FULL':
      return <Badge variant="outline" className="text-xs rounded-full">Full</Badge>;
    case 'INCREMENTAL':
      return <Badge variant="outline" className="text-xs text-blue-600 rounded-full">Incremental</Badge>;
    case 'DRY_RUN':
      return <Badge variant="outline" className="text-xs text-amber-600 rounded-full">Dry Run</Badge>;
    default:
      return <Badge variant="outline" className="text-xs rounded-full">{mode}</Badge>;
  }
}

function formatDuration(start: string, end: string | null) {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SyncHistoryPanel({ serverId }: SyncHistoryPanelProps) {
  const { showError } = useNotifications();
  const [runs, setRuns] = useState<DirectorySyncRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [mode, setMode] = useState<string>('ALL');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, status, mode]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ldapServerService.getSyncHistory(serverId, {
        page,
        size: 10,
        search: debouncedSearch || undefined,
        status: status !== 'ALL' ? status : undefined,
        mode: mode !== 'ALL' ? mode : undefined,
      });
      setRuns(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      showError('Failed to load sync history');
    } finally {
      setLoading(false);
    }
  }, [serverId, page, debouncedSearch, status, mode]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);



  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by user or errors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl border-gray-200 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-full sm:w-[140px] rounded-xl border-gray-200 text-xs font-medium">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="RUNNING">Running</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="BLOCKED_BY_THRESHOLD">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="h-9 w-full sm:w-[130px] rounded-xl border-gray-200 text-xs font-medium">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              <SelectItem value="ALL">All Modes</SelectItem>
              <SelectItem value="FULL">Full</SelectItem>
              <SelectItem value="INCREMENTAL">Incremental</SelectItem>
              <SelectItem value="DRY_RUN">Dry Run</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchHistory} className="h-9 px-3 gap-1.5 text-xs text-gray-600 rounded-xl shadow-sm">
            <RefreshCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 border-b border-gray-200">
              <TableHead className="w-10"></TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mode</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Users</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Errors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="py-3">
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3">
                      <History className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">No sync runs found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              runs.map((run) => (
              <React.Fragment key={run.id}>
                <TableRow
                  className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                  onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                >
                  <TableCell className="py-3">
                    {expandedRun === run.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-700 py-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>{formatDate(run.startedAt)}</TooltipTrigger>
                        <TooltipContent>
                          <p>Triggered by: {run.triggeredBy || 'System'}</p>
                          <p>Trigger: {run.triggerType}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="py-3">{modeBadge(run.mode)}</TableCell>
                  <TableCell className="py-3">{statusBadge(run.status)}</TableCell>
                  <TableCell className="font-mono text-xs py-3">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatDuration(run.startedAt, run.completedAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs py-3">
                    <div className="flex items-center justify-end gap-1 text-gray-700">
                      <Users className="h-3 w-3 text-gray-400" />
                      {run.usersCreated + run.usersUpdated + run.usersDisabled}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs py-3">
                    {run.errorsCount > 0 ? (
                      <span className="text-red-500 font-semibold">{run.errorsCount}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </TableCell>
                </TableRow>

                {expandedRun === run.id && (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0 border-b border-gray-100 bg-gray-50/30">
                      <div className="p-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-gray-400" />
                            Synchronization Metrics
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: run.mode === 'DRY_RUN' ? '~ Users Created' : 'Users Created', value: run.usersCreated, color: 'text-emerald-600' },
                              { label: run.mode === 'DRY_RUN' ? '~ Users Updated' : 'Users Updated', value: run.usersUpdated, color: 'text-blue-600' },
                              { label: run.mode === 'DRY_RUN' ? '~ Users Disabled' : 'Users Disabled', value: run.usersDisabled, color: 'text-amber-600' },
                              { label: run.mode === 'DRY_RUN' ? '~ Users Restored' : 'Users Restored', value: run.usersRestored, color: 'text-purple-600' },
                              { label: run.mode === 'DRY_RUN' ? '~ New Groups' : 'New Groups', value: run.groupsProcessed, color: 'text-gray-900' },
                              { label: run.mode === 'DRY_RUN' ? '~ New Roles' : 'New Roles', value: run.rolesAssigned, color: 'text-gray-900' },
                              { label: run.mode === 'DRY_RUN' ? '~ Mgrs Resolved' : 'Mgrs Resolved', value: run.managersResolved, color: 'text-emerald-600' },
                              { label: run.mode === 'DRY_RUN' ? '~ Mgrs Unresolved' : 'Mgrs Unresolved', value: run.managersUnresolved, color: 'text-amber-600' },
                            ].map((stat) => (
                              <div key={stat.label} className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50 text-center">
                                <p className="text-[11px] text-gray-500 font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
                                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {run.thresholdTriggered != null && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                            <Shield className="h-4 w-4 text-amber-500 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-amber-800">Safety Threshold Triggered ({run.thresholdTriggered}%)</p>
                              <p className="text-[11px] text-amber-700 mt-0.5">{run.errorSummary || 'Sync was blocked to prevent mass deletions.'}</p>
                            </div>
                          </div>
                        )}

                        {run.status === 'FAILED' && run.errorSummary && run.thresholdTriggered == null && (
                          <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                            <div className="w-full overflow-hidden">
                              <p className="text-xs font-semibold text-red-800 mb-1">Error Summary</p>
                              <pre className="text-[11px] text-red-700 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {run.errorSummary}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 mt-2">
          <p className="text-xs text-gray-500 font-medium">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs rounded-xl"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-3 w-3" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs rounded-xl"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              Next <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
