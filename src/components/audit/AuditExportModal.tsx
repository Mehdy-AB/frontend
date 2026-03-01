'use client';

import React, { useMemo, useState } from 'react';
import {
    X, Download, FileSpreadsheet, Lock, Info,
    CheckCircle2, Clock, Filter as FilterIcon, Loader2,
} from 'lucide-react';
import type { AuditLogFilterRequest, AuditLogResponseDto } from '../../api/services/auditLogService';
import {
    exportCurrentPageCsv,
    requestServerExport,
    buildFilterSummary,
    type PagingMeta,
} from './auditExportProvider';

// ============================================================================
// PROPS
// ============================================================================

interface AuditExportModalProps {
    open: boolean;
    onClose: () => void;
    rows: AuditLogResponseDto[];
    filter: AuditLogFilterRequest;
    paging: PagingMeta;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AuditExportModal({ open, onClose, rows, filter, paging }: AuditExportModalProps) {
    const [scope, setScope] = useState<'page' | 'all'>('page');
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const filterSummary = useMemo(() => buildFilterSummary(filter), [filter]);
    const hasFilters = Object.keys(filterSummary).length > 0;

    if (!open) return null;

    const handleExport = async () => {
        setExporting(true);
        setError(null);
        try {
            if (scope === 'page') {
                exportCurrentPageCsv(rows, filter, paging);
            } else {
                // Server-side: export ALL matching records
                await requestServerExport({
                    ...filter,
                    page: 0,
                    size: 100000, // backend caps at 100K
                });
            }
            onClose();
        } catch (e: any) {
            setError(e.message || 'Export failed');
        } finally {
            setExporting(false);
        }
    };

    const exportRowCount = scope === 'page' ? rows.length : paging.totalElements;

    return (
        <div className="audit-export-modal__backdrop" onClick={!exporting ? onClose : undefined}>
            <div className="audit-export-modal__card" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="audit-export-modal__header">
                    <div className="audit-export-modal__title">
                        <FileSpreadsheet size={18} />
                        <span>Export Audit Logs</span>
                    </div>
                    <button className="audit-btn audit-btn--icon-sm" onClick={onClose} type="button" title="Close" disabled={exporting}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="audit-export-modal__body">
                    {/* Scope */}
                    <div className="audit-export-modal__section">
                        <h4 className="audit-export-modal__section-title">
                            <Download size={13} /> Export Scope
                        </h4>
                        <div className="audit-export-modal__scope-group">
                            <label className={`audit-export-modal__scope-option ${scope === 'page' ? 'audit-export-modal__scope-option--active' : ''}`}>
                                <input
                                    type="radio" name="scope" value="page"
                                    checked={scope === 'page'}
                                    onChange={() => setScope('page')}
                                    disabled={exporting}
                                />
                                <div className="audit-export-modal__scope-label">
                                    <span>Current Page</span>
                                    <span className="audit-export-modal__scope-meta">
                                        {rows.length} row{rows.length !== 1 ? 's' : ''} · Page {paging.page + 1} of {paging.totalPages}
                                    </span>
                                </div>
                                {scope === 'page' && <CheckCircle2 size={14} className="audit-export-modal__scope-check" />}
                            </label>
                            <label className={`audit-export-modal__scope-option ${scope === 'all' ? 'audit-export-modal__scope-option--active' : ''}`}>
                                <input
                                    type="radio" name="scope" value="all"
                                    checked={scope === 'all'}
                                    onChange={() => setScope('all')}
                                    disabled={exporting}
                                />
                                <div className="audit-export-modal__scope-label">
                                    <span>All Matching Records</span>
                                    <span className="audit-export-modal__scope-meta">
                                        {paging.totalElements.toLocaleString()} total · Server-streamed CSV
                                    </span>
                                </div>
                                {scope === 'all' && <CheckCircle2 size={14} className="audit-export-modal__scope-check" />}
                            </label>
                        </div>
                    </div>

                    {/* Format */}
                    <div className="audit-export-modal__section">
                        <h4 className="audit-export-modal__section-title">
                            <FileSpreadsheet size={13} /> Format
                        </h4>
                        <div className="audit-export-modal__format">
                            <Lock size={12} />
                            <span>CSV</span>
                            <span className="audit-export-modal__format-info">
                                RFC 4180 · UTF-8 BOM · Injection-safe
                                {scope === 'all' && ' · Max 100K rows'}
                            </span>
                        </div>
                    </div>

                    {/* Filter Summary */}
                    <div className="audit-export-modal__section">
                        <h4 className="audit-export-modal__section-title">
                            <FilterIcon size={13} /> Active Filters
                        </h4>
                        {hasFilters ? (
                            <div className="audit-export-modal__filter-tags">
                                {Object.entries(filterSummary).map(([key, val]) => (
                                    <span key={key} className="audit-export-modal__filter-tag">
                                        <span className="audit-export-modal__filter-tag-key">{key}:</span>
                                        <span className="audit-export-modal__filter-tag-val">{val}</span>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="audit-export-modal__no-filters">
                                <Info size={12} /> No filters applied — exporting {scope === 'page' ? 'current page' : 'all records'}
                            </p>
                        )}
                    </div>

                    {/* Metadata note */}
                    <div className="audit-export-modal__note">
                        <Clock size={12} />
                        <span>
                            {scope === 'page'
                                ? 'Export will include metadata headers with timestamp, filters, and paging info.'
                                : `Server will stream ${paging.totalElements.toLocaleString()} records. This action will be logged in the audit trail.`
                            }
                        </span>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="audit-export-modal__error">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="audit-export-modal__footer">
                    <button className="audit-btn audit-btn--ghost" onClick={onClose} type="button" disabled={exporting}>
                        Cancel
                    </button>
                    <button
                        className="audit-btn audit-btn--primary"
                        onClick={handleExport}
                        disabled={exportRowCount === 0 || exporting}
                        type="button"
                    >
                        {exporting ? (
                            <>
                                <Loader2 size={14} className="audit-spin" />
                                {scope === 'all' ? `Exporting ${paging.totalElements.toLocaleString()} records…` : 'Generating…'}
                            </>
                        ) : (
                            <>
                                <Download size={14} /> Generate CSV
                                {scope === 'all' && ` (${paging.totalElements.toLocaleString()} rows)`}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
