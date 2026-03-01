'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Download, RotateCcw, ShieldAlert, Loader2, AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import AuditFilterPanel from '../../../../components/audit/AuditFilterPanel';
import AuditDetailDrawer from '../../../../components/audit/AuditDetailDrawer';
import AuditExportModal from '../../../../components/audit/AuditExportModal';
import UserAvatar from '../../../../components/main/UserAvatar';
import {
  auditLogService,
  type AuditLogResponseDto,
  type AuditLogFilterRequest,
  type AuditStatisticsDto,
} from '../../../../api/services/auditLogService';
import type { PageResponse } from '../../../../types/api';
import './audit.css';

// ============================================================================
// HELPERS
// ============================================================================

const SENSITIVE_CSV = /^[=+\-@\t\r]/;
function csvSafe(v: string): string {
  if (SENSITIVE_CSV.test(v)) return `'${v}`;
  if (v.includes(',') || v.includes('"') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function formatTs(ts: string | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function formatAction(a: string | null): string {
  if (!a) return '—';
  return a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function TransactionsPage() {
  // State
  const [data, setData] = useState<PageResponse<AuditLogResponseDto> | null>(null);
  const [stats, setStats] = useState<AuditStatisticsDto | null>(null);
  const [actionOptions, setActionOptions] = useState<string[]>([]);
  const [entityTypeOptions, setEntityTypeOptions] = useState<string[]>([]);
  const [currentFilter, setCurrentFilter] = useState<AuditLogFilterRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [drawerEventId, setDrawerEventId] = useState<number | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const initialLoad = useRef(true);

  // ---- Load options on mount ----
  useEffect(() => {
    Promise.all([
      auditLogService.getActionOptions().catch(() => []),
      auditLogService.getEntityTypeOptions().catch(() => []),
    ]).then(([actions, entities]) => {
      setActionOptions(actions);
      setEntityTypeOptions(entities);
    });
  }, []);

  // ---- Fetch data ----
  const fetchData = useCallback(async (filter: AuditLogFilterRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await auditLogService.filter(filter);
      setData(result);
      setCurrentFilter(filter);
      // Build active filter summary
      const af: string[] = [];
      if (filter.actions?.length) af.push(`Actions: ${filter.actions.length}`);
      if (filter.entityTypes?.length) af.push(`Types: ${filter.entityTypes.length}`);
      if (filter.userId) af.push(`User: ${filter.userId.slice(0, 8)}…`);
      if (filter.success !== null && filter.success !== undefined) af.push(filter.success ? 'Success only' : 'Failures only');
      if (filter.search) af.push(`"${filter.search}"`);
      if (filter.dateFrom) af.push(`From: ${new Date(filter.dateFrom).toLocaleDateString()}`);
      if (filter.dateTo) af.push(`To: ${new Date(filter.dateTo).toLocaleDateString()}`);
      setActiveFilters(af);
    } catch (err: any) {
      if (err?.status === 403 || err?.status === 401) {
        setUnauthorized(true);
      } else {
        setError(err?.message || 'Failed to load audit logs.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Fetch stats ----
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await auditLogService.getStatistics();
      setStats(s);
    } catch {
      // Stats are non-critical; silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ---- Initial load ----
  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const initialFilter: AuditLogFilterRequest = {
        dateFrom: weekAgo.toISOString(),
        dateTo: now.toISOString(),
        page: 0,
        size: pageSize,
        sortBy: 'timestamp',
        sortDir: 'desc',
      };
      fetchData(initialFilter);
      fetchStats();
    }
  }, [fetchData, fetchStats, pageSize]);

  // ---- Handlers ----
  const handleApplyFilter = useCallback((filter: AuditLogFilterRequest) => {
    fetchData({ ...filter, size: pageSize });
    fetchStats();
  }, [fetchData, fetchStats, pageSize]);

  const handlePageChange = useCallback((newPage: number) => {
    if (!currentFilter) return;
    fetchData({ ...currentFilter, page: newPage });
  }, [currentFilter, fetchData]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    if (currentFilter) {
      fetchData({ ...currentFilter, size, page: 0 });
    }
  }, [currentFilter, fetchData]);

  const handleResetFromSummary = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const resetFilter: AuditLogFilterRequest = {
      dateFrom: weekAgo.toISOString(),
      dateTo: now.toISOString(),
      page: 0,
      size: pageSize,
      sortBy: 'timestamp',
      sortDir: 'desc',
    };
    fetchData(resetFilter);
    fetchStats();
  }, [fetchData, fetchStats, pageSize]);

  // ---- Unauthorized state ----
  if (unauthorized) {
    return (
      <div className="audit-page">
        <div className="audit-unauthorized">
          <ShieldAlert size={48} />
          <h2>Administrator access required</h2>
          <p>You do not have permission to view audit logs. Please contact your system administrator.</p>
        </div>
      </div>
    );
  }

  const rows = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 0;
  const currentPage = data?.number || 0;

  return (
    <div className="audit-page">
      {/* Header */}
      <div className="audit-page__header">
        <div>
          <h1 className="audit-page__title">Unified Audit</h1>
          <p className="audit-page__subtitle">System-wide audit trail (read-only)</p>
        </div>
        <div className="audit-page__header-actions">
          <button
            className="audit-btn audit-btn--ghost"
            onClick={handleResetFromSummary}
            disabled={loading}
            type="button"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            className="audit-btn audit-btn--outline"
            onClick={() => setShowExportModal(true)}
            disabled={rows.length === 0}
            type="button"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Statistics bar */}
      {stats && (
        <div className="audit-stats-bar">
          <div className="audit-stats-bar__item">
            <span className="audit-stats-bar__label">Total</span>
            <span className="audit-stats-bar__value">{stats.totalEvents.toLocaleString()}</span>
          </div>
          <div className="audit-stats-bar__divider" />
          <div className="audit-stats-bar__item">
            <span className="audit-stats-bar__label">Today</span>
            <span className="audit-stats-bar__value">{stats.eventsToday.toLocaleString()}</span>
          </div>
          <div className="audit-stats-bar__divider" />
          <div className="audit-stats-bar__item">
            <span className="audit-stats-bar__label">This Week</span>
            <span className="audit-stats-bar__value">{stats.eventsThisWeek.toLocaleString()}</span>
          </div>
          <div className="audit-stats-bar__divider" />
          <div className="audit-stats-bar__item">
            <span className="audit-stats-bar__label">Failures</span>
            <span className="audit-stats-bar__value audit-stats-bar__value--fail">{stats.failedEvents.toLocaleString()}</span>
          </div>
          <div className="audit-stats-bar__divider" />
          <div className="audit-stats-bar__item">
            <span className="audit-stats-bar__label">Success Rate</span>
            <span className="audit-stats-bar__value">{stats.successRate.toFixed(1)}%</span>
          </div>
          <div className="audit-stats-bar__divider" />
          <div className="audit-stats-bar__item">
            <span className="audit-stats-bar__label">Active Users</span>
            <span className="audit-stats-bar__value">{stats.uniqueUsers}</span>
          </div>
          {stats.topUsers.length > 0 && (
            <>
              <div className="audit-stats-bar__divider" />
              <div className="audit-stats-bar__item audit-stats-bar__item--wide">
                <span className="audit-stats-bar__label">Top Users</span>
                <div className="audit-top-users">
                  {stats.topUsers.slice(0, 3).map((u, i) => (
                    <div key={`top-user-${i}`} className="audit-top-users__chip">
                      <UserAvatar
                        user={{ username: u.username, imgUrl: u.imgUrl }}
                        size="xs"
                      />
                      <div className="audit-top-users__info">
                        <span className="audit-top-users__name">{u.displayName || u.username}</span>
                        {u.displayName && u.displayName !== u.username && (
                          <span className="audit-top-users__username">@{u.username}</span>
                        )}
                      </div>
                      <span className="audit-top-users__count">{u.eventCount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {statsLoading && !stats && (
        <div className="audit-stats-bar audit-stats-bar--loading">
          <Loader2 size={16} className="audit-spin" /> Loading statistics…
        </div>
      )}

      {/* Body: filter + table */}
      <div className="audit-page__body">
        {/* Filter panel */}
        <aside className="audit-page__sidebar">
          <AuditFilterPanel
            actionOptions={actionOptions}
            entityTypeOptions={entityTypeOptions}
            onApply={handleApplyFilter}
            loading={loading}
          />
        </aside>

        {/* Table section */}
        <main className="audit-page__main">
          {/* Active filter summary */}
          {activeFilters.length > 0 && (
            <div className="audit-active-filters">
              <span className="audit-active-filters__label">Active filters:</span>
              {activeFilters.map((f, i) => (
                <span key={i} className="audit-active-filters__tag">{f}</span>
              ))}
              <button
                className="audit-btn audit-btn--icon-sm"
                onClick={handleResetFromSummary}
                title="Clear all filters"
                type="button"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="audit-error-banner">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Table */}
          <div className="audit-table-container">
            {loading && (
              <div className="audit-table-loading">
                <Loader2 size={20} className="audit-spin" />
              </div>
            )}
            <table className="audit-table" id="audit-log-table">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Timestamp</th>
                  <th style={{ width: '220px' }}>User</th>
                  <th style={{ width: '180px' }}>Action</th>
                  <th style={{ width: '110px' }}>Entity Type</th>
                  <th style={{ width: '60px' }}>Status</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="audit-table__empty">
                      {currentFilter ? 'No results found for the current filters. Try adjusting your date range or removing some filters.' : 'Apply filters to load audit logs.'}
                    </td>
                  </tr>
                )}
                {rows.map(row => (
                  <tr
                    key={row.id}
                    className={`audit-table__row ${row.success === false ? 'audit-table__row--fail' : ''}`}
                    onClick={() => setDrawerEventId(row.id)}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') setDrawerEventId(row.id); }}
                    role="button"
                  >
                    <td className="audit-table__cell--mono">{formatTs(row.timestamp)}</td>
                    <td>
                      <div className="audit-user-cell">
                        <UserAvatar
                          user={row.user ? {
                            id: row.user.id,
                            username: row.user.username,
                            email: row.user.email,
                            displayName: row.user.displayName,
                            firstName: row.user.firstName,
                            lastName: row.user.lastName,
                            imgUrl: row.user.imgUrl,
                          } : undefined}
                          size="xs"
                        />
                        <div className="audit-user-cell__info">
                          <span className="audit-user-cell__name">{row.user?.displayName || row.username || '—'}</span>
                          <span className="audit-user-cell__detail">{row.user?.email || row.userEmail || formatAction(row.action)}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="audit-action-badge">{formatAction(row.action)}</span></td>
                    <td><span className="audit-entity-badge">{row.entityType || '—'}</span></td>
                    <td>
                      {row.success === false
                        ? <span className="audit-status-pill audit-status-pill--fail">FAIL</span>
                        : <span className="audit-status-pill audit-status-pill--ok">OK</span>
                      }
                    </td>
                    <td className="audit-table__cell--truncate">{row.actionDescription || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="audit-pagination">
            <div className="audit-pagination__info">
              {totalElements > 0 ? (
                <>Showing {currentPage * (currentFilter?.size || pageSize) + 1}–{Math.min((currentPage + 1) * (currentFilter?.size || pageSize), totalElements)} of {totalElements.toLocaleString()}</>
              ) : 'No results'}
            </div>
            <div className="audit-pagination__controls">
              <label className="audit-pagination__size-label">
                Rows:
                <select
                  className="audit-input audit-input--sm"
                  value={pageSize}
                  onChange={e => handlePageSizeChange(Number(e.target.value))}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <button
                className="audit-btn audit-btn--icon"
                disabled={currentPage === 0 || loading}
                onClick={() => handlePageChange(currentPage - 1)}
                title="Previous page"
                type="button"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="audit-pagination__page">
                Page {currentPage + 1} of {Math.max(totalPages, 1)}
              </span>
              <button
                className="audit-btn audit-btn--icon"
                disabled={currentPage >= totalPages - 1 || loading}
                onClick={() => handlePageChange(currentPage + 1)}
                title="Next page"
                type="button"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Detail drawer */}
      <AuditDetailDrawer
        eventId={drawerEventId}
        onClose={() => setDrawerEventId(null)}
      />

      {/* Export modal */}
      <AuditExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        rows={rows}
        filter={currentFilter || { page: 0, size: pageSize, sortBy: 'timestamp', sortDir: 'desc' }}
        paging={{
          page: data?.number ?? 0,
          size: data?.size ?? pageSize,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0,
        }}
      />
    </div>
  );
}
