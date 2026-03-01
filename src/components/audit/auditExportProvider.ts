/**
 * auditExportProvider.ts
 * Enterprise ECM-grade CSV export for audit logs.
 *
 * Abstraction layer:
 *   - exportCurrentPageCsv()  → implemented (client-side)
 *   - requestServerExport()   → server-side streaming
 */

import type { AuditLogFilterRequest, AuditLogResponseDto } from '../../api/services/auditLogService';
import { apiClient } from '../../api/client';

// ============================================================================
// CSV SAFETY
// ============================================================================

const INJECTION_RE = /^[=+\-@\t\r]/;

/** Escape a single CSV cell — injection-safe + RFC 4180 compliant */
function csvSafe(v: string): string {
    // CSV injection protection: prefix dangerous leading characters
    if (INJECTION_RE.test(v)) v = `'${v}`;
    // RFC 4180: wrap in quotes if it contains comma, quote, or newline
    if (v.includes(',') || v.includes('"') || v.includes('\n') || v.includes('\r')) {
        return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
}

/** Join an array of cells into a CSV row */
function csvRow(cells: string[]): string {
    return cells.map(csvSafe).join(',');
}

// ============================================================================
// TYPES
// ============================================================================

export interface PagingMeta {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface ExportResult {
    success: boolean;
    filename: string;
    rowCount: number;
}

// ============================================================================
// CLIENT-SIDE EXPORT (Phase 4 — Current Page)
// ============================================================================

const CSV_HEADERS = [
    'ID', 'Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID',
    'Success', 'HTTP Method', 'Endpoint', 'IP Address', 'Duration (ms)', 'Details',
];

/**
 * Export the currently-displayed audit rows as a CSV file.
 * Includes metadata header rows (prefixed with #) for traceability.
 */
export function exportCurrentPageCsv(
    rows: AuditLogResponseDto[],
    filter: AuditLogFilterRequest,
    paging: PagingMeta,
): ExportResult {
    const lines: string[] = [];

    // ---- Metadata header rows (comment-prefixed) ----
    const now = new Date().toISOString();
    lines.push(`# Audit Log Export`);
    lines.push(`# Exported At: ${now}`);
    lines.push(`# Page: ${paging.page + 1} of ${paging.totalPages}`);
    lines.push(`# Page Size: ${paging.size}`);
    lines.push(`# Rows in Export: ${rows.length}`);
    lines.push(`# Total Matching: ${paging.totalElements}`);
    lines.push(`# Active Filters: ${JSON.stringify(buildFilterSummary(filter))}`);
    lines.push('');

    // ---- Header row ----
    lines.push(csvRow(CSV_HEADERS));

    // ---- Data rows ----
    for (const r of rows) {
        lines.push(csvRow([
            String(r.id),
            r.timestamp || '',
            r.username || r.user?.username || '',
            r.action || '',
            r.entityType || '',
            r.entityId || '',
            r.success !== null && r.success !== undefined ? String(r.success) : '',
            r.httpMethod || '',
            r.endpoint || '',
            r.ipAddress || '',
            r.durationMs !== null && r.durationMs !== undefined ? String(r.durationMs) : '',
            (r.actionDescription || '').replace(/\n/g, ' '),
        ]));
    }

    // ---- Download ----
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const blob = new Blob([BOM + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const filename = `audit_export_${now.slice(0, 10)}_page${paging.page + 1}.csv`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    return { success: true, filename, rowCount: rows.length };
}

// ============================================================================
// SERVER-SIDE EXPORT (All Matching Records)
// ============================================================================

/**
 * POST /export/csv — Server-side streaming CSV export.
 * Uses the same axios apiClient (with JWT interceptors) as all other API calls.
 * The backend streams ALL matching rows as a CSV file (capped at 100K rows).
 */
export async function requestServerExport(filter: AuditLogFilterRequest): Promise<ExportResult> {
    // Use axios with responseType: 'blob' — auth is handled automatically
    const response = await apiClient.post<Blob>(
        '/api/v1/admin/audit-logs/export/csv',
        filter,
        { responseType: 'blob' },
    );

    const blob = response instanceof Blob ? response : new Blob([response as any]);

    // Extract filename from Content-Disposition or use fallback
    const filename = `audit_export_${new Date().toISOString().slice(0, 10)}.csv`;

    // Trigger browser download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, filename, rowCount: -1 };
}

// ============================================================================
// HELPERS
// ============================================================================

/** Build a human-readable summary object of non-empty filter fields */
export function buildFilterSummary(filter: AuditLogFilterRequest): Record<string, string> {
    const s: Record<string, string> = {};
    if (filter.dateFrom) s['Date From'] = filter.dateFrom;
    if (filter.dateTo) s['Date To'] = filter.dateTo;
    if (filter.actions?.length) s['Actions'] = filter.actions.join(', ');
    if (filter.entityTypes?.length) s['Entity Types'] = filter.entityTypes.join(', ');
    if (filter.userIds?.length) s['Users'] = `${filter.userIds.length} selected`;
    if (filter.userId) s['User ID'] = filter.userId;
    if (filter.username) s['Username'] = filter.username;
    if (filter.roleIds?.length) s['Roles'] = `${filter.roleIds.length} selected`;
    if (filter.groupIds?.length) s['Groups'] = `${filter.groupIds.length} selected`;
    if (filter.orgUnitIds?.length) s['Org Units'] = `${filter.orgUnitIds.length} selected`;
    if (filter.httpMethods?.length) s['HTTP Methods'] = filter.httpMethods.join(', ');
    if (filter.ipAddress) s['IP Address'] = filter.ipAddress;
    if (filter.minDurationMs) s['Min Duration'] = `${filter.minDurationMs}ms`;
    if (filter.success !== null && filter.success !== undefined) s['Outcome'] = filter.success ? 'Success' : 'Failure';
    if (filter.search) s['Search'] = filter.search;
    return s;
}
