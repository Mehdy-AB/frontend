'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Handshake, ClipboardCheck, List, ShieldPlus, ScrollText, BarChart3,
  Loader2, CheckCircle2, XCircle, Ban, ChevronLeft, ChevronRight,
  AlertTriangle, Clock, Users, TrendingUp, ShieldAlert,
  Search, RotateCcw, RefreshCw, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { delegationAdminService, type DelegationStatsResponse, type DelegationAuditFilter, type EmergencyDelegationRequest } from '../../../api/services/delegationAdminService';
import { delegationService, type DelegationResponse } from '../../../api/services/delegationService';
import type { AuditLogResponseDto } from '../../../api/services/auditLogService';
import type { PageResponse } from '../../../types/api';
import UserAvatar from '../../../components/main/UserAvatar';
import './delegations.css';

// =====================================================================
// HELPERS
// =====================================================================

function formatTs(ts: string | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(ts: string | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function statusClass(s: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'active', PENDING_APPROVAL: 'pending', EXPIRED: 'expired',
    REVOKED: 'revoked', REJECTED: 'rejected', DRAFT: 'draft',
  };
  return map[s] || 'draft';
}

function actionBadgeClass(action: string): string {
  if (action.includes('CREATE')) return 'create';
  if (action.includes('APPROVE')) return 'approve';
  if (action.includes('REJECT')) return 'reject';
  if (action.includes('ACTIVATE')) return 'activate';
  if (action.includes('REVOKE')) return 'revoke';
  if (action.includes('EXPIRE')) return 'expire';
  return 'create';
}

function formatAction(a: string | null): string {
  if (!a) return '—';
  return a.replace(/^DELEGATION_/, '').replace(/_/g, ' ');
}

function getDomainLabel(type: string): string {
  const map: Record<string, string> = {
    OU_OPERATIONAL: 'OU Operational',
    WORKFLOW_TASKS: 'Workflow Tasks',
    WORKFLOW_APPROVALS: 'Workflow Approvals',
    FORM_ADMIN: 'Form Admin',
    WORKFLOW_ADMIN: 'Workflow Admin',
  };
  return map[type] || type;
}

function isPending24h(createdAt: string): boolean {
  return (Date.now() - new Date(createdAt).getTime()) > 24 * 60 * 60 * 1000;
}

// =====================================================================
// DELEGATION DETAIL DRAWER (for Approval Queue + All Delegations)
// =====================================================================

function DelegationDetailDrawer({ delegation, onClose, onApprove, onReject, onRevoke, actionLoading }: {
  delegation: DelegationResponse | null;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onRevoke?: (id: string) => void;
  actionLoading?: string | null;
}) {
  useEffect(() => {
    if (!delegation) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [delegation, onClose]);

  if (!delegation) return null;
  const d = delegation;

  const statusDotClass = d.status === 'ACTIVE' ? 'ok' : d.status === 'PENDING_APPROVAL' ? 'pending' : 'fail';

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: 'Delegation ID', value: <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{d.id}</span> },
    { label: 'Type', value: <span className="deleg-type-badge">{getDomainLabel(d.delegationType)}</span> },
    { label: 'Status', value: <span className={`deleg-badge deleg-badge--${statusClass(d.status)}`}>{d.status.replace('_', ' ')}</span> },
    { label: 'Scope', value: d.scopes?.[0]?.scopeLabel || '—' },
    { label: 'Start Date', value: formatDate(d.startAt) },
    { label: 'End Date', value: formatDate(d.endAt) },
    { label: 'Requested', value: new Date(d.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) },
    { label: 'Reason', value: d.reason || '—' },
  ];

  if (d.revocationReason) fields.push({ label: 'Revoke Reason', value: d.revocationReason });
  if (d.approvedAt) fields.push({ label: 'Approved At', value: new Date(d.approvedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) });

  return (
    <>
      <div className="deleg-drawer-overlay" onClick={onClose} />
      <div className="deleg-drawer" tabIndex={-1} role="dialog" aria-label="Delegation detail">
        <div className="deleg-drawer__header">
          <h2 className="deleg-drawer__title">Delegation Detail</h2>
          <button className="deleg-drawer__close" onClick={onClose} title="Close (Esc)" type="button"><X size={18} /></button>
        </div>
        <div className="deleg-drawer__body">
          {/* Identity bar */}
          <div className="deleg-drawer__identity">
            <span className={`deleg-drawer__status-dot deleg-drawer__status-dot--${statusDotClass}`} />
            <UserAvatar user={{ displayName: d.delegatorName, imgUrl: d.delegatorImgUrl ?? undefined }} size="xs" />
            <span>{d.delegatorName}</span>
            <span className="deleg-arrow">→</span>
            <UserAvatar user={{ displayName: d.delegateName, imgUrl: d.delegateImgUrl ?? undefined }} size="xs" />
            <span>{d.delegateName}</span>
          </div>

          {/* Structured fields */}
          <div className="deleg-drawer__section">
            <div className="deleg-drawer__section-title">Details</div>
            <div className="deleg-drawer__fields">
              {fields.map(f => (
                <div key={f.label} className="deleg-drawer__field">
                  <span className="deleg-drawer__field-label">{f.label}</span>
                  <span className="deleg-drawer__field-value">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Roles */}
          {d.roles && d.roles.length > 0 && (
            <div className="deleg-drawer__section">
              <div className="deleg-drawer__section-title">Delegated Roles</div>
              <div className="deleg-drawer__roles">
                {d.roles.map(r => (
                  <span key={r.roleId} className="deleg-type-badge">{r.businessLabel}</span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {(d.status === 'PENDING_APPROVAL' && onApprove && onReject) && (
            <div className="deleg-drawer__actions">
              <button className="deleg-btn deleg-btn--success" onClick={() => onApprove(d.id)} disabled={actionLoading === d.id} type="button">
                {actionLoading === d.id ? <Loader2 size={14} className="deleg-spin" /> : <CheckCircle2 size={14} />} Approve
              </button>
              <button className="deleg-btn deleg-btn--danger" onClick={() => onReject(d.id)} disabled={actionLoading === d.id} type="button">
                <XCircle size={14} /> Reject
              </button>
            </div>
          )}
          {(d.canRevoke && onRevoke) && (
            <div className="deleg-drawer__actions">
              <button className="deleg-btn deleg-btn--danger" onClick={() => onRevoke(d.id)} type="button">
                <Ban size={14} /> Revoke Delegation
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// =====================================================================
// AUDIT EVENT DRAWER (for Audit Trail tab)
// =====================================================================

function AuditEventDrawer({ event, onClose }: {
  event: AuditLogResponseDto | null;
  onClose: () => void;
}) {
  const [jsonExpanded, setJsonExpanded] = useState(false);

  useEffect(() => {
    if (!event) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [event, onClose]);

  if (!event) return null;
  const e = event;

  let parsedDetails: any = null;
  try { parsedDetails = e.details ? JSON.parse(e.details) : null; } catch { /* ignore */ }

  const fields: { label: string; value: string | null }[] = [
    { label: 'Event ID', value: String(e.id) },
    { label: 'Timestamp', value: e.timestamp ? new Date(e.timestamp).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' }) : null },
    { label: 'Action', value: e.action },
    { label: 'Description', value: e.actionDescription },
    { label: 'Entity ID', value: e.entityId },
    { label: 'Entity Name', value: e.entityName },
    { label: 'User', value: e.user ? `${e.user.displayName || e.user.username} (${e.user.email})` : e.username },
    { label: 'Success', value: e.success !== null && e.success !== undefined ? (e.success ? 'Yes' : 'No') : null },
    { label: 'Error', value: e.errorMessage },
    { label: 'IP Address', value: e.ipAddress },
    { label: 'Duration', value: e.durationMs !== null && e.durationMs !== undefined ? `${e.durationMs}ms` : null },
  ];

  return (
    <>
      <div className="deleg-drawer-overlay" onClick={onClose} />
      <div className="deleg-drawer" tabIndex={-1} role="dialog" aria-label="Audit event detail">
        <div className="deleg-drawer__header">
          <h2 className="deleg-drawer__title">Audit Event Detail</h2>
          <button className="deleg-drawer__close" onClick={onClose} title="Close (Esc)" type="button"><X size={18} /></button>
        </div>
        <div className="deleg-drawer__body">
          {/* Identity bar */}
          <div className="deleg-drawer__identity">
            <span className={`deleg-drawer__status-dot deleg-drawer__status-dot--${e.success !== false ? 'ok' : 'fail'}`} />
            <strong>{formatAction(e.action)}</strong>
            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>#{e.id}</span>
          </div>

          {/* Fields */}
          <div className="deleg-drawer__section">
            <div className="deleg-drawer__section-title">Event Information</div>
            <div className="deleg-drawer__fields">
              {fields.map(f => {
                if (f.value === null || f.value === undefined) return null;
                return (
                  <div key={f.label} className="deleg-drawer__field">
                    <span className="deleg-drawer__field-label">{f.label}</span>
                    <span className="deleg-drawer__field-value">{f.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Raw JSON */}
          {parsedDetails && (
            <div className="deleg-drawer__section">
              <button className="deleg-drawer__json-toggle" onClick={() => setJsonExpanded(!jsonExpanded)} type="button">
                Raw Details (JSON)
                {jsonExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {jsonExpanded && (
                <pre className="deleg-drawer__json">{JSON.stringify(parsedDetails, null, 2)}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// =====================================================================
// MAIN PAGE
// =====================================================================

type TabId = 'queue' | 'all' | 'emergency' | 'audit' | 'analytics';

export default function DelegationAdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('queue');
  const [pendingCount, setPendingCount] = useState(0);
  const [stats, setStats] = useState<DelegationStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load stats on mount + whenever refreshKey changes
  useEffect(() => {
    setStatsLoading(true);
    delegationAdminService.getDelegationStats()
      .then(s => { setStats(s); setPendingCount(s.totalPending); })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const tabs: { id: TabId; label: string; Icon: any }[] = [
    { id: 'queue', label: 'Approval Queue', Icon: ClipboardCheck },
    { id: 'all', label: 'All Delegations', Icon: List },
    { id: 'emergency', label: 'Emergency Create', Icon: ShieldPlus },
    { id: 'audit', label: 'Audit Trail', Icon: ScrollText },
    { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
  ];

  return (
    <div className="deleg-page">
      {/* Header */}
      <div className="deleg-page__header">
        <div>
          <h1 className="deleg-page__title">
            <Handshake size={24} /> Delegation Governance
          </h1>
          <p className="deleg-page__subtitle">Administration console for managing all delegations system-wide</p>
        </div>
        <button className="deleg-btn deleg-btn--ghost" onClick={handleRefresh} type="button">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tab Bar */}
      <div className="deleg-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`deleg-tab ${activeTab === t.id ? 'deleg-tab--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            type="button"
          >
            <t.Icon size={15} /> {t.label}
            {t.id === 'queue' && pendingCount > 0 && (
              <span className="deleg-tab__badge">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'queue' && <ApprovalQueueTab onAction={handleRefresh} refreshKey={refreshKey} />}
      {activeTab === 'all' && <AllDelegationsTab refreshKey={refreshKey} />}
      {activeTab === 'emergency' && <EmergencyCreateTab onCreated={handleRefresh} />}
      {activeTab === 'audit' && <AuditTrailTab refreshKey={refreshKey} />}
      {activeTab === 'analytics' && <AnalyticsTab stats={stats} loading={statsLoading} onRefresh={handleRefresh} />}
    </div>
  );
}

// =====================================================================
// TAB 1: APPROVAL QUEUE (server-side paginated, classic table)
// =====================================================================

function ApprovalQueueTab({ onAction, refreshKey }: { onAction: () => void; refreshKey: number }) {
  const [data, setData] = useState<PageResponse<DelegationResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    delegationType: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    page: 0,
  });
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<DelegationResponse | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await delegationAdminService.getAllDelegations({
        status: 'PENDING_APPROVAL',
        delegationType: filters.delegationType || undefined,
        search: filters.search || undefined,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo).toISOString() : undefined,
        page: filters.page,
        size: 25,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      setData(result);
    } catch { /* error */ }
    finally { setLoading(false); }
  }, [filters, refreshKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await delegationService.approveDelegation(id);
      onAction();
      fetchData();
    } catch { /* toast */ }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    setActionLoading(rejectDialog);
    try {
      await delegationService.rejectDelegation(rejectDialog, rejectReason);
      setRejectDialog(null);
      setRejectReason('');
      onAction();
      fetchData();
    } catch { /* toast */ }
    finally { setActionLoading(null); }
  };

  const handleReset = () => {
    setFilters({ delegationType: '', search: '', dateFrom: '', dateTo: '', page: 0 });
  };

  const rows = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;
  const currentPage = data?.number || 0;

  return (
    <>
      {/* Filter bar */}
      <div className="deleg-filter-bar">
        <select value={filters.delegationType} onChange={e => setFilters(f => ({ ...f, delegationType: e.target.value, page: 0 }))}>
          <option value="">All Types</option>
          <option value="OU_OPERATIONAL">OU Operational</option>
          <option value="WORKFLOW_TASKS">Workflow Tasks</option>
          <option value="WORKFLOW_APPROVALS">Workflow Approvals</option>
        </select>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 0 }))}
            style={{ paddingLeft: 30 }}
          />
        </div>
        <input
          type="date"
          title="From date"
          value={filters.dateFrom}
          onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value, page: 0 }))}
        />
        <input
          type="date"
          title="To date"
          value={filters.dateTo}
          onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value, page: 0 }))}
        />
        <button className="deleg-btn deleg-btn--ghost deleg-btn--sm" onClick={handleReset} type="button">
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* Table */}
      <div className="deleg-table-wrap">
        {loading && <div className="deleg-loading-overlay"><Loader2 size={20} className="deleg-spin" /></div>}
        <table className="deleg-table" id="approval-queue-table">
          <thead>
            <tr>
              <th>Delegator</th>
              <th>Delegate</th>
              <th>Type</th>
              <th>Status</th>
              <th>Scope</th>
              <th>Roles</th>
              <th>Requested</th>
              <th>Period</th>
              <th>Reason</th>
              <th style={{ width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="deleg-table__empty">
                  <CheckCircle2 size={20} style={{ marginBottom: 4, opacity: 0.5 }} /><br />
                  Approval queue is clear — no pending delegations
                </td>
              </tr>
            )}
            {rows.map(d => (
              <tr key={d.id} className={selectedRow?.id === d.id ? 'deleg-table__row--selected' : ''} onClick={() => setSelectedRow(d)}>
                <td><div className="deleg-user-cell"><UserAvatar user={{ displayName: d.delegatorName, imgUrl: d.delegatorImgUrl ?? undefined }} size="xs" /><strong>{d.delegatorName}</strong></div></td>
                <td><div className="deleg-user-cell"><UserAvatar user={{ displayName: d.delegateName, imgUrl: d.delegateImgUrl ?? undefined }} size="xs" /><strong>{d.delegateName}</strong></div></td>
                <td><span className="deleg-type-badge">{getDomainLabel(d.delegationType)}</span></td>
                <td>
                  <span className={`deleg-badge deleg-badge--${statusClass(d.status)}`}>
                    {d.status.replace('_', ' ')}
                  </span>
                  {d.status === 'PENDING_APPROVAL' && isPending24h(d.createdAt) && (
                    <span style={{ color: '#dc2626', fontSize: '0.65rem', fontWeight: 700, marginLeft: 4 }}>URGENT</span>
                  )}
                </td>
                <td>{d.scopes?.[0]?.scopeLabel || '—'}</td>
                <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.roles?.map(r => r.businessLabel).join(', ') || '—'}
                </td>
                <td style={{ fontSize: '0.78rem' }}>{formatTs(d.createdAt)}</td>
                <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatDate(d.startAt)} — {formatDate(d.endAt)}</td>
                <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem', color: '#64748b' }}>
                  {d.reason || '—'}
                </td>
                <td>
                  {d.status === 'PENDING_APPROVAL' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="deleg-btn deleg-btn--success deleg-btn--sm"
                        onClick={(e) => { e.stopPropagation(); handleApprove(d.id); }}
                        disabled={actionLoading === d.id}
                        type="button"
                      >
                        {actionLoading === d.id ? <Loader2 size={12} className="deleg-spin" /> : <CheckCircle2 size={12} />} Approve
                      </button>
                      <button
                        className="deleg-btn deleg-btn--danger deleg-btn--sm"
                        onClick={(e) => { e.stopPropagation(); setRejectDialog(d.id); }}
                        disabled={actionLoading === d.id}
                        type="button"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="deleg-pagination">
          <span>
            {totalElements > 0
              ? <>Showing {currentPage * 25 + 1}–{Math.min((currentPage + 1) * 25, totalElements)} of {totalElements.toLocaleString()}</>
              : 'No results'
            }
          </span>
          <div className="deleg-pagination__controls">
            <button className="deleg-btn deleg-btn--ghost deleg-btn--sm" disabled={filters.page === 0 || loading} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} type="button">
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Page {currentPage + 1} of {Math.max(totalPages, 1)}</span>
            <button className="deleg-btn deleg-btn--ghost deleg-btn--sm" disabled={filters.page >= totalPages - 1 || loading} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} type="button">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Reject Reason Dialog */}
      {rejectDialog && (
        <div className="deleg-dialog-overlay" onClick={() => setRejectDialog(null)}>
          <div className="deleg-dialog" onClick={e => e.stopPropagation()}>
            <h3 className="deleg-dialog__title">Reject Delegation</h3>
            <textarea
              placeholder="Reason for rejection (optional)..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="deleg-dialog__actions">
              <button className="deleg-btn deleg-btn--ghost" onClick={() => setRejectDialog(null)} type="button">Cancel</button>
              <button className="deleg-btn deleg-btn--danger" onClick={handleReject} disabled={actionLoading !== null} type="button">
                {actionLoading ? <Loader2 size={14} className="deleg-spin" /> : null} Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <DelegationDetailDrawer
        delegation={selectedRow}
        onClose={() => setSelectedRow(null)}
        onApprove={handleApprove}
        onReject={(id) => { setSelectedRow(null); setRejectDialog(id); }}
        actionLoading={actionLoading}
      />
    </>
  );
}

// =====================================================================
// TAB 2: ALL DELEGATIONS
// =====================================================================

function AllDelegationsTab({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<PageResponse<DelegationResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', delegationType: '', search: '', dateFrom: '', dateTo: '', page: 0 });
  const [revokeDialog, setRevokeDialog] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [selectedRow, setSelectedRow] = useState<DelegationResponse | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await delegationAdminService.getAllDelegations({
        status: filters.status || undefined,
        delegationType: filters.delegationType || undefined,
        search: filters.search || undefined,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo).toISOString() : undefined,
        page: filters.page,
        size: 20,
      });
      setData(result);
    } catch { /* error */ }
    finally { setLoading(false); }
  }, [filters, refreshKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRevoke = async () => {
    if (!revokeDialog) return;
    try {
      await delegationService.revokeDelegation(revokeDialog, revokeReason);
      setRevokeDialog(null);
      setRevokeReason('');
      fetchData();
    } catch { /* toast */ }
  };

  const rows = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <>
      {/* Filter bar */}
      <div className="deleg-filter-bar">
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 0 }))}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="EXPIRED">Expired</option>
          <option value="REVOKED">Revoked</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={filters.delegationType} onChange={e => setFilters(f => ({ ...f, delegationType: e.target.value, page: 0 }))}>
          <option value="">All Types</option>
          <option value="OU_OPERATIONAL">OU Operational</option>
          <option value="WORKFLOW_TASKS">Workflow Tasks</option>
          <option value="WORKFLOW_APPROVALS">Workflow Approvals</option>
        </select>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 0 }))}
            style={{ paddingLeft: 30 }}
          />
        </div>
        <input
          type="date"
          title="From date"
          value={filters.dateFrom}
          onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value, page: 0 }))}
        />
        <input
          type="date"
          title="To date"
          value={filters.dateTo}
          onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value, page: 0 }))}
        />
        <button className="deleg-btn deleg-btn--ghost deleg-btn--sm" onClick={() => setFilters({ status: '', delegationType: '', search: '', dateFrom: '', dateTo: '', page: 0 })} type="button">
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* Table */}
      <div className="deleg-table-wrap">
        {loading && <div className="deleg-loading-overlay"><Loader2 size={20} className="deleg-spin" /></div>}
        <table className="deleg-table" id="delegation-admin-table">
          <thead>
            <tr>
              <th>Delegator → Delegate</th>
              <th>Type</th>
              <th>Status</th>
              <th>Scope</th>
              <th>Start</th>
              <th>End</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="deleg-table__empty">No delegations found</td></tr>
            )}
            {rows.map(d => (
              <tr key={d.id} className={selectedRow?.id === d.id ? 'deleg-table__row--selected' : ''} onClick={() => setSelectedRow(d)}>
                <td>
                  <div className="deleg-user-cell">
                    <UserAvatar user={{ displayName: d.delegatorName, imgUrl: d.delegatorImgUrl ?? undefined }} size="xs" />
                    <strong>{d.delegatorName}</strong>
                  </div>
                  <span className="deleg-arrow"> → </span>
                  <div className="deleg-user-cell" style={{ display: 'inline-flex' }}>
                    <UserAvatar user={{ displayName: d.delegateName, imgUrl: d.delegateImgUrl ?? undefined }} size="xs" />
                    <strong>{d.delegateName}</strong>
                  </div>
                </td>
                <td><span className="deleg-type-badge">{getDomainLabel(d.delegationType)}</span></td>
                <td><span className={`deleg-badge deleg-badge--${statusClass(d.status)}`}>{d.status.replace('_', ' ')}</span></td>
                <td>{d.scopes?.[0]?.scopeLabel || '—'}</td>
                <td style={{ fontSize: '0.78rem' }}>{formatDate(d.startAt)}</td>
                <td style={{ fontSize: '0.78rem' }}>{formatDate(d.endAt)}</td>
                <td>
                  {d.canRevoke && (
                    <button className="deleg-btn deleg-btn--danger deleg-btn--sm" onClick={(e) => { e.stopPropagation(); setRevokeDialog(d.id); }} type="button">
                      <Ban size={12} /> Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="deleg-pagination">
          <span>Page {(data?.number ?? 0) + 1} of {Math.max(totalPages, 1)} ({data?.totalElements ?? 0} total)</span>
          <div className="deleg-pagination__controls">
            <button className="deleg-btn deleg-btn--ghost deleg-btn--sm" disabled={filters.page === 0} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} type="button">
              <ChevronLeft size={14} />
            </button>
            <button className="deleg-btn deleg-btn--ghost deleg-btn--sm" disabled={filters.page >= totalPages - 1} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} type="button">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Revoke Dialog */}
      {revokeDialog && (
        <div className="deleg-dialog-overlay" onClick={() => setRevokeDialog(null)}>
          <div className="deleg-dialog" onClick={e => e.stopPropagation()}>
            <h3 className="deleg-dialog__title">Revoke Delegation</h3>
            <textarea
              placeholder="Reason for revocation..."
              value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
            />
            <div className="deleg-dialog__actions">
              <button className="deleg-btn deleg-btn--ghost" onClick={() => setRevokeDialog(null)} type="button">Cancel</button>
              <button className="deleg-btn deleg-btn--danger" onClick={handleRevoke} type="button">Revoke</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <DelegationDetailDrawer
        delegation={selectedRow}
        onClose={() => setSelectedRow(null)}
        onRevoke={(id) => { setSelectedRow(null); setRevokeDialog(id); }}
      />
    </>
  );
}

// =====================================================================
// TAB 3: EMERGENCY CREATE
// =====================================================================

function EmergencyCreateTab({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    delegatorUserId: '', delegateUserId: '', ouId: '', roleIds: '',
    startAt: '', endAt: '', reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.delegatorUserId || !form.delegateUserId || !form.ouId || !form.roleIds || !form.startAt || !form.endAt || !form.reason) {
      setError('All fields are required for emergency delegations.');
      return;
    }

    setSubmitting(true);
    try {
      const request: EmergencyDelegationRequest = {
        delegatorUserId: form.delegatorUserId,
        delegateUserId: form.delegateUserId,
        ouId: form.ouId,
        roleIds: form.roleIds.split(',').map(s => s.trim()).filter(Boolean),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        reason: form.reason,
      };
      await delegationAdminService.createEmergencyDelegation(request);
      setSuccess(true);
      setForm({ delegatorUserId: '', delegateUserId: '', ouId: '', roleIds: '', startAt: '', endAt: '', reason: '' });
      onCreated();
    } catch (err: any) {
      setError(err?.message || 'Failed to create emergency delegation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
        <span style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 500 }}>
          Emergency delegations bypass normal approval flow and are activated immediately.
        </span>
      </div>

      {success && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> Emergency delegation created and activated successfully.
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <form className="deleg-form" onSubmit={handleSubmit}>
        <div className="deleg-form__group">
          <label className="deleg-form__label">Delegator User ID</label>
          <input className="deleg-form__input" placeholder="UUID of the user being delegated from" value={form.delegatorUserId} onChange={e => setForm(f => ({ ...f, delegatorUserId: e.target.value }))} />
          <div className="deleg-form__hint">The user whose responsibilities are being temporarily transferred</div>
        </div>
        <div className="deleg-form__group">
          <label className="deleg-form__label">Delegate User ID</label>
          <input className="deleg-form__input" placeholder="UUID of the user receiving the delegation" value={form.delegateUserId} onChange={e => setForm(f => ({ ...f, delegateUserId: e.target.value }))} />
          <div className="deleg-form__hint">The user who will temporarily assume the responsibilities</div>
        </div>
        <div className="deleg-form__group">
          <label className="deleg-form__label">OU ID (Scope)</label>
          <input className="deleg-form__input" placeholder="UUID of the organizational unit" value={form.ouId} onChange={e => setForm(f => ({ ...f, ouId: e.target.value }))} />
        </div>
        <div className="deleg-form__group">
          <label className="deleg-form__label">Role IDs</label>
          <input className="deleg-form__input" placeholder="Comma-separated role UUIDs" value={form.roleIds} onChange={e => setForm(f => ({ ...f, roleIds: e.target.value }))} />
          <div className="deleg-form__hint">Comma-separated list of scoped role IDs to delegate</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="deleg-form__group">
            <label className="deleg-form__label">Start Date</label>
            <input className="deleg-form__input" type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} />
          </div>
          <div className="deleg-form__group">
            <label className="deleg-form__label">End Date</label>
            <input className="deleg-form__input" type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} />
          </div>
        </div>
        <div className="deleg-form__group">
          <label className="deleg-form__label">Reason *</label>
          <textarea className="deleg-form__textarea" placeholder="Explain why this emergency delegation is needed (mandatory for audit)..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
        </div>
        <button className="deleg-btn deleg-btn--primary" type="submit" disabled={submitting}>
          {submitting ? <Loader2 size={14} className="deleg-spin" /> : <ShieldPlus size={14} />}
          Create Emergency Delegation
        </button>
      </form>
    </div>
  );
}

// =====================================================================
// TAB 4: AUDIT TRAIL
// =====================================================================

function AuditTrailTab({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<PageResponse<AuditLogResponseDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DelegationAuditFilter>({
    page: 0, size: 20, sortBy: 'timestamp', sortDir: 'desc',
  });
  const [selectedRow, setSelectedRow] = useState<AuditLogResponseDto | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await delegationAdminService.getDelegationAuditTrail(filters);
      setData(result);
    } catch { /* error */ }
    finally { setLoading(false); }
  }, [filters, refreshKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const DELEGATION_ACTIONS = [
    'DELEGATION_CREATE', 'DELEGATION_APPROVE', 'DELEGATION_REJECT',
    'DELEGATION_ACTIVATE', 'DELEGATION_REVOKE', 'DELEGATION_EXPIRE',
  ];

  const rows = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <>
      {/* Filter bar */}
      <div className="deleg-filter-bar">
        <select
          value={filters.actions?.[0] || ''}
          onChange={e => setFilters(f => ({ ...f, actions: e.target.value ? [e.target.value] : undefined, page: 0 }))}
        >
          <option value="">All Actions</option>
          {DELEGATION_ACTIONS.map(a => <option key={a} value={a}>{formatAction(a)}</option>)}
        </select>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search user name..."
            value={filters.username || ''}
            onChange={e => setFilters(f => ({ ...f, username: e.target.value || undefined, page: 0 }))}
            style={{ paddingLeft: 30 }}
          />
        </div>
        <input
          type="text"
          placeholder="Search details..."
          value={filters.search || ''}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value || undefined, page: 0 }))}
        />
        <button className="deleg-btn deleg-btn--ghost deleg-btn--sm" onClick={() => setFilters({ page: 0, size: 20, sortBy: 'timestamp', sortDir: 'desc' })} type="button">
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* Table */}
      <div className="deleg-table-wrap">
        {loading && <div className="deleg-loading-overlay"><Loader2 size={20} className="deleg-spin" /></div>}
        <table className="deleg-table" id="delegation-audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Delegation ID</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="deleg-table__empty">No audit entries found</td></tr>
            )}
            {rows.map(row => (
              <tr
                key={row.id}
                className={`${row.success === false ? 'deleg-table__row--fail' : ''} ${selectedRow?.id === row.id ? 'deleg-table__row--selected' : ''}`}
                onClick={() => setSelectedRow(row)}
              >
                <td style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{formatTs(row.timestamp)}</td>
                <td>
                  <div className="deleg-user-cell">
                    <UserAvatar user={{ displayName: row.user?.displayName, username: row.username ?? undefined, imgUrl: row.user?.imgUrl }} size="xs" />
                    {row.user?.displayName || row.username || '—'}
                  </div>
                </td>
                <td>
                  <span className={`deleg-action-badge deleg-action-badge--${actionBadgeClass(row.action || '')}`}>
                    {formatAction(row.action)}
                  </span>
                </td>
                <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row.entityId || '—'}
                </td>
                <td>
                  {row.success === false
                    ? <span className="deleg-badge deleg-badge--revoked" style={{ fontSize: '0.65rem' }}>FAIL</span>
                    : <span className="deleg-badge deleg-badge--active" style={{ fontSize: '0.65rem' }}>OK</span>
                  }
                </td>
                <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                  {row.actionDescription || row.details || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="deleg-pagination">
          <span>Page {(data?.number ?? 0) + 1} of {Math.max(totalPages, 1)} ({data?.totalElements ?? 0} events)</span>
          <div className="deleg-pagination__controls">
            <button className="deleg-btn deleg-btn--ghost deleg-btn--sm" disabled={(filters.page ?? 0) === 0} onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))} type="button">
              <ChevronLeft size={14} />
            </button>
            <button className="deleg-btn deleg-btn--ghost deleg-btn--sm" disabled={(filters.page ?? 0) >= totalPages - 1} onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 0) + 1 }))} type="button">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Event Drawer */}
      <AuditEventDrawer event={selectedRow} onClose={() => setSelectedRow(null)} />
    </>
  );
}

// =====================================================================
// TAB 5: ANALYTICS
// =====================================================================

function AnalyticsTab({ stats, loading, onRefresh }: { stats: DelegationStatsResponse | null; loading: boolean; onRefresh: () => void }) {
  if (loading || !stats) {
    return <div className="deleg-loading-overlay"><Loader2 size={24} className="deleg-spin" /> Loading analytics…</div>;
  }

  const total = stats.totalActive + stats.totalPending + stats.totalExpired + stats.totalRevoked + stats.totalRejected;

  // Donut chart data
  const donutData = [
    { label: 'Active', value: stats.totalActive, color: '#22c55e' },
    { label: 'Pending', value: stats.totalPending, color: '#f59e0b' },
    { label: 'Expired', value: stats.totalExpired, color: '#94a3b8' },
    { label: 'Revoked', value: stats.totalRevoked, color: '#ef4444' },
    { label: 'Rejected', value: stats.totalRejected, color: '#ec4899' },
  ].filter(d => d.value > 0);

  // Build conic-gradient for donut
  let gradient = '';
  let offset = 0;
  donutData.forEach(d => {
    const pct = total > 0 ? (d.value / total) * 100 : 0;
    gradient += `${d.color} ${offset}% ${offset + pct}%, `;
    offset += pct;
  });
  gradient = gradient.replace(/, $/, '');

  // Bar chart data
  const typeEntries = Object.entries(stats.countByType);
  const maxTypeCount = Math.max(...typeEntries.map(([, v]) => v), 1);

  return (
    <>
      {/* KPI Cards */}
      <div className="deleg-kpi-grid">
        <div className="deleg-kpi deleg-kpi--active">
          <div className="deleg-kpi__label">Total Active</div>
          <div className="deleg-kpi__value">{stats.totalActive}</div>
        </div>
        <div className="deleg-kpi deleg-kpi--pending">
          <div className="deleg-kpi__label">Pending Approval</div>
          <div className="deleg-kpi__value">{stats.totalPending}</div>
        </div>
        <div className="deleg-kpi deleg-kpi--expired">
          <div className="deleg-kpi__label">Expired</div>
          <div className="deleg-kpi__value">{stats.totalExpired}</div>
        </div>
        <div className="deleg-kpi deleg-kpi--revoked">
          <div className="deleg-kpi__label">Revoked</div>
          <div className="deleg-kpi__value">{stats.totalRevoked}</div>
        </div>
        <div className="deleg-kpi deleg-kpi--warning">
          <div className="deleg-kpi__label">Expiring Soon (7d)</div>
          <div className="deleg-kpi__value">{stats.expiringSoon}</div>
        </div>
        <div className="deleg-kpi deleg-kpi--expired">
          <div className="deleg-kpi__label">Recently Expired (7d)</div>
          <div className="deleg-kpi__value">{stats.recentlyExpired}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="deleg-chart-grid">
        {/* Status Distribution Donut */}
        <div className="deleg-chart-card">
          <div className="deleg-chart-card__title">Status Distribution</div>
          {total === 0 ? (
            <div className="deleg-empty" style={{ padding: 20 }}>
              <div className="deleg-empty__sub">No delegations yet</div>
            </div>
          ) : (
            <div className="deleg-donut-wrap">
              <div
                className="deleg-donut"
                style={{
                  background: `conic-gradient(${gradient})`,
                  WebkitMask: 'radial-gradient(farthest-side, transparent 60%, #000 60%)',
                  mask: 'radial-gradient(farthest-side, transparent 60%, #000 60%)',
                }}
              >
                <div className="deleg-donut__center">{total}</div>
              </div>
              <div className="deleg-donut-legend">
                {donutData.map(d => (
                  <div key={d.label} className="deleg-donut-legend__item">
                    <div className="deleg-donut-legend__dot" style={{ background: d.color }} />
                    {d.label}: {d.value} ({total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* By Type Bar Chart */}
        <div className="deleg-chart-card">
          <div className="deleg-chart-card__title">Delegations by Type</div>
          {typeEntries.length === 0 ? (
            <div className="deleg-empty" style={{ padding: 20 }}>
              <div className="deleg-empty__sub">No type data available</div>
            </div>
          ) : (
            <div className="deleg-bar-chart">
              {typeEntries.map(([type, count]) => (
                <div key={type} className="deleg-bar-row">
                  <div className="deleg-bar-row__label">{getDomainLabel(type)}</div>
                  <div className="deleg-bar-row__track">
                    <div className="deleg-bar-row__fill" style={{ width: `${(count / maxTypeCount) * 100}%` }}>
                      {count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Delegators Leaderboard */}
      {stats.topDelegators.length > 0 && (
        <div className="deleg-chart-card" style={{ marginTop: 20, maxWidth: 500 }}>
          <div className="deleg-chart-card__title">Top 5 Delegators</div>
          <div className="deleg-leaderboard">
            {stats.topDelegators.map((d, i) => (
              <div key={d.userId} className="deleg-leaderboard__row">
                <div className="deleg-leaderboard__rank">#{i + 1}</div>
                <UserAvatar user={{ displayName: d.displayName, imgUrl: d.imgUrl ?? undefined }} size="xs" />
                <div className="deleg-leaderboard__name">{d.displayName}</div>
                <div className="deleg-leaderboard__count">{d.activeCount} active</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
