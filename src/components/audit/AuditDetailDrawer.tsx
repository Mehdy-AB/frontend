'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, Copy, Check, ChevronDown, ChevronUp, AlertTriangle, Loader2 } from 'lucide-react';
import { auditLogService, type AuditLogResponseDto } from '../../api/services/auditLogService';

// ============================================================================
// TYPES
// ============================================================================

interface AuditDetailDrawerProps {
    eventId: number | null;
    onClose: () => void;
}

const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'secret', 'credential', 'apikey', 'api_key'];

function maskSensitive(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(maskSensitive);
    const result: any = {};
    for (const [k, v] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.some(s => k.toLowerCase().includes(s))) {
            result[k] = '••••••••';
        } else {
            result[k] = maskSensitive(v);
        }
    }
    return result;
}

function tryParseJson(str: string | null): any | null {
    if (!str) return null;
    try { return JSON.parse(str); } catch { return null; }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AuditDetailDrawer({ eventId, onClose }: AuditDetailDrawerProps) {
    const [event, setEvent] = useState<AuditLogResponseDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [jsonExpanded, setJsonExpanded] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (eventId === null) { setEvent(null); return; }
        let cancelled = false;
        setLoading(true);
        setError(null);
        auditLogService.getById(eventId)
            .then(data => { if (!cancelled) setEvent(data); })
            .catch(err => {
                if (!cancelled) {
                    const status = (err as any)?.status;
                    if (status === 403 || status === 401) setError('Administrator access required.');
                    else setError('Failed to load event details.');
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [eventId]);

    // ESC to close
    useEffect(() => {
        if (eventId === null) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [eventId, onClose]);

    // Focus trap
    useEffect(() => {
        if (eventId !== null && drawerRef.current) {
            drawerRef.current.focus();
        }
    }, [eventId, loading]);

    const copyToClipboard = useCallback(async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(label);
            setTimeout(() => setCopiedField(null), 1500);
        } catch { /* clipboard not available */ }
    }, []);

    if (eventId === null) return null;

    const parsedDetails = event ? tryParseJson(event.details) : null;
    const maskedDetails = parsedDetails ? maskSensitive(parsedDetails) : null;

    const fields: { label: string; value: string | null; copyable?: boolean }[] = event ? [
        { label: 'Event ID', value: String(event.id), copyable: true },
        { label: 'Timestamp', value: event.timestamp ? new Date(event.timestamp).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' }) : null },
        { label: 'Action', value: event.action },
        { label: 'Action Description', value: event.actionDescription },
        { label: 'Entity Type', value: event.entityType },
        { label: 'Entity ID', value: event.entityId, copyable: true },
        { label: 'Entity Name', value: event.entityName },
        { label: 'User', value: event.user ? `${event.user.displayName || event.user.username} (${event.user.email})` : event.username },
        { label: 'User ID', value: event.user?.id || null, copyable: true },
        { label: 'User Email', value: event.userEmail },
        { label: 'HTTP Method', value: event.httpMethod },
        { label: 'Endpoint', value: event.endpoint },
        { label: 'IP Address', value: event.ipAddress },
        { label: 'Response Status', value: event.responseStatus !== null ? String(event.responseStatus) : null },
        { label: 'Duration', value: event.durationMs !== null ? `${event.durationMs}ms` : null },
        { label: 'Success', value: event.success !== null ? (event.success ? 'Yes' : 'No') : null },
        { label: 'Error Message', value: event.errorMessage },
    ] : [];

    return (
        <>
            <div className="audit-drawer-overlay" onClick={onClose} aria-hidden />
            <div className="audit-drawer" ref={drawerRef} tabIndex={-1} role="dialog" aria-label="Audit event detail">
                <div className="audit-drawer__header">
                    <h2 className="audit-drawer__title">Event Detail</h2>
                    <button className="audit-btn audit-btn--icon" onClick={onClose} title="Close (Esc)" type="button">
                        <X size={18} />
                    </button>
                </div>

                <div className="audit-drawer__body">
                    {loading && (
                        <div className="audit-drawer__loading">
                            <Loader2 size={24} className="audit-spin" /> Loading event…
                        </div>
                    )}
                    {error && (
                        <div className="audit-drawer__error">
                            <AlertTriangle size={18} /> {error}
                        </div>
                    )}
                    {event && !loading && (
                        <>
                            {/* Identity bar */}
                            <div className="audit-drawer__identity">
                                <span className={`audit-status-dot audit-status-dot--${event.success !== false ? 'ok' : 'fail'}`} />
                                <strong>{event.action}</strong>
                                <span className="audit-text--muted">#{event.id}</span>
                            </div>

                            {/* Structured fields */}
                            <div className="audit-drawer__fields">
                                {fields.map(f => {
                                    if (f.value === null || f.value === undefined) return null;
                                    return (
                                        <div key={f.label} className="audit-drawer__field">
                                            <span className="audit-drawer__field-label">{f.label}</span>
                                            <span className="audit-drawer__field-value">
                                                {f.value}
                                                {f.copyable && (
                                                    <button
                                                        className="audit-btn audit-btn--icon-sm"
                                                        onClick={() => copyToClipboard(f.value!, f.label)}
                                                        title={`Copy ${f.label}`}
                                                        type="button"
                                                    >
                                                        {copiedField === f.label ? <Check size={12} /> : <Copy size={12} />}
                                                    </button>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Raw JSON */}
                            {maskedDetails && (
                                <div className="audit-drawer__json-section">
                                    <button
                                        className="audit-label audit-label--collapsible"
                                        onClick={() => setJsonExpanded(!jsonExpanded)}
                                        type="button"
                                    >
                                        Raw Details (JSON)
                                        {jsonExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    {jsonExpanded && (
                                        <pre className="audit-drawer__json">
                                            {JSON.stringify(maskedDetails, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
