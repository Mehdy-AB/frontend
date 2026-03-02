'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ScrollText,
    Pause,
    Play,
    Trash2,
    Copy,
    Search,
    X,
    ChevronDown,
    ChevronRight,
    ArrowDownToLine,
    Wifi,
    WifiOff,
    Loader2,
    Shield,
    Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePermissions } from '@/hooks/usePermissions';
import { Permissions } from '@/constants/permissions';
import { useLogStream, LogEntry, ConnectionStatus } from '@/hooks/useLogStream';

// ─── Constants ───────────────────────────────────────────────
const LOG_LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'] as const;
const MAX_BUFFER = 50_000;
const ROW_HEIGHT = 32; // px per log row
const OVERSCAN = 20; // extra rows to render above/below viewport

// ─── Redaction ───────────────────────────────────────────────
const REDACT_PATTERNS = [
    /(?<=Authorization[:\s=]["']?\s*(?:Bearer\s)?)[A-Za-z0-9\-_+/=.]{8,}/gi,
    /(?<=token[:\s=]["']?\s*)[A-Za-z0-9\-_+/=.]{8,}/gi,
    /(?<=password[:\s=]["']?\s*)\S+/gi,
    /(?<=secret[:\s=]["']?\s*)\S+/gi,
    /(?<=apikey[:\s=]["']?\s*)\S+/gi,
    /(?<=api_key[:\s=]["']?\s*)\S+/gi,
];

function redact(text: string): string {
    let result = text;
    for (const pattern of REDACT_PATTERNS) {
        result = result.replace(pattern, '●●●●●●●●');
    }
    return result;
}

// ─── Helpers ─────────────────────────────────────────────────
function levelColor(level: string) {
    switch (level) {
        case 'ERROR': return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
        case 'WARN': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
        case 'INFO': return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
        case 'DEBUG': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
        case 'TRACE': return 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30';
        default: return 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30';
    }
}

function statusConfig(status: ConnectionStatus) {
    switch (status) {
        case 'connected': return { label: 'Connected', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', pulse: false, icon: Wifi };
        case 'connecting': return { label: 'Connecting', color: 'bg-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400', pulse: true, icon: Loader2 };
        case 'reconnecting': return { label: 'Reconnecting', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', pulse: true, icon: Loader2 };
        case 'paused': return { label: 'Paused', color: 'bg-gray-500', textColor: 'text-gray-600 dark:text-gray-400', pulse: false, icon: Pause };
        case 'disconnected': return { label: 'Disconnected', color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400', pulse: false, icon: WifiOff };
    }
}

function formatTimestamp(ts: string): string {
    try {
        const d = new Date(ts);
        return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    } catch {
        return ts;
    }
}

function shortService(name: string): string {
    if (!name) return '';
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : name;
}

// ─── Main Component ──────────────────────────────────────────
export default function LiveLogsPage() {
    const router = useRouter();
    const { hasPermission } = usePermissions();
    const canView = hasPermission(Permissions.SERVER_MANAGE_LOGS);

    // Stream hook
    const { logs, status, pause, resume, clear, lastEventTime, droppedCount } = useLogStream({ maxBuffer: MAX_BUFFER });

    // Filters
    const [activeLevels, setActiveLevels] = useState<Set<string>>(new Set(LOG_LEVELS));
    const [serviceFilter, setServiceFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);

    // Detail drawer
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [stacktraceExpanded, setStacktraceExpanded] = useState(false);

    // Virtualization refs
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    // Redirect if no permission
    useEffect(() => {
        if (!canView) {
            router.push('/');
        }
    }, [canView, router]);

    // Filtered logs
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            if (!activeLevels.has(log.level)) return false;
            if (serviceFilter && !log.service.toLowerCase().includes(serviceFilter.toLowerCase())) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    log.message.toLowerCase().includes(q) ||
                    log.service.toLowerCase().includes(q) ||
                    (log.requestId && log.requestId.toLowerCase().includes(q)) ||
                    (log.thread && log.thread.toLowerCase().includes(q))
                );
            }
            return true;
        });
    }, [logs, activeLevels, serviceFilter, searchQuery]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (autoScroll && scrollContainerRef.current) {
            const el = scrollContainerRef.current;
            el.scrollTop = el.scrollHeight;
        }
    }, [filteredLogs.length, autoScroll]);

    // Measure container
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height);
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Track scroll position
    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        setScrollTop(el.scrollTop);

        // Disable auto-scroll if user scrolled up
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
        if (!atBottom && autoScroll) {
            setAutoScroll(false);
        }
    }, [autoScroll]);

    // Virtualization calculations
    const totalHeight = filteredLogs.length * ROW_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const endIndex = Math.min(filteredLogs.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
    const visibleLogs = filteredLogs.slice(startIndex, endIndex);
    const offsetY = startIndex * ROW_HEIGHT;

    const toggleLevel = (level: string) => {
        setActiveLevels(prev => {
            const next = new Set(prev);
            if (next.has(level)) {
                next.delete(level);
            } else {
                next.add(level);
            }
            return next;
        });
    };

    const handleCopySelected = () => {
        if (selectedLog) {
            const text = `[${selectedLog.timestamp}] [${selectedLog.level}] [${selectedLog.service}] ${selectedLog.message}${selectedLog.stacktrace ? '\n' + selectedLog.stacktrace : ''}`;
            navigator.clipboard.writeText(text);
        }
    };

    const latencyMs = lastEventTime ? Date.now() - lastEventTime : null;
    const stConfig = statusConfig(status);
    const StatusIcon = stConfig.icon;

    if (!canView) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-destructive text-lg">You don&apos;t have permission to view live logs</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* ─── Header ──────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0">
                <div className="flex items-center gap-3">
                    <ScrollText className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-semibold text-foreground">Live Logs</h1>
                    <Badge variant="outline" className="text-[10px] font-mono">
                        {process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV'}
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    {/* Connection status pill */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${stConfig.textColor} bg-muted border border-border`}>
                        <span className={`h-2 w-2 rounded-full ${stConfig.color} ${stConfig.pulse ? 'animate-pulse' : ''}`} />
                        <StatusIcon className={`h-3 w-3 ${status === 'connecting' || status === 'reconnecting' ? 'animate-spin' : ''}`} />
                        <span>{stConfig.label}</span>
                    </div>

                    <div className="h-5 w-px bg-border mx-1" />

                    {/* Action buttons */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={status === 'paused' ? resume : pause}
                            >
                                {status === 'paused' ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{status === 'paused' ? 'Resume' : 'Pause'}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={clear}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Clear view</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={handleCopySelected}
                                disabled={!selectedLog}
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy selected</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* ─── Filter Bar ──────────────────────────────────── */}
            <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border bg-muted/50 flex-shrink-0">
                <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />

                {/* Level toggles */}
                <div className="flex gap-1">
                    {LOG_LEVELS.map(level => (
                        <button
                            key={level}
                            onClick={() => toggleLevel(level)}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border transition-all
                ${activeLevels.has(level)
                                    ? levelColor(level)
                                    : 'border-border text-muted-foreground bg-transparent hover:border-muted-foreground/50'
                                }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Service filter */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Service..."
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="h-6 w-28 text-[11px] pl-2 pr-5 bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary font-mono"
                    />
                    {serviceFilter && (
                        <button
                            onClick={() => setServiceFilter('')}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* Search box */}
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-6 w-full text-[11px] pl-6 pr-5 bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Auto-scroll toggle */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => {
                                setAutoScroll(!autoScroll);
                                if (!autoScroll && scrollContainerRef.current) {
                                    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
                                }
                            }}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-all
                ${autoScroll
                                    ? 'border-primary/50 text-primary bg-primary/10'
                                    : 'border-border text-muted-foreground bg-transparent hover:border-muted-foreground/50'
                                }`}
                        >
                            <ArrowDownToLine className="h-3 w-3" />
                            Auto
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Auto-scroll to latest</TooltipContent>
                </Tooltip>
            </div>

            {/* ─── Log List (Virtualized) ──────────────────────── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto font-mono text-[12px] leading-none bg-background"
                >
                    <div style={{ height: totalHeight, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
                            {visibleLogs.map((log) => (
                                <div
                                    key={log.id}
                                    onClick={() => { setSelectedLog(log); setStacktraceExpanded(false); }}
                                    className={`flex items-center gap-2 px-3 cursor-pointer border-b border-border/50 transition-colors
                    ${selectedLog?.id === log.id
                                            ? 'bg-primary/10 border-l-2 border-l-primary'
                                            : 'hover:bg-muted/60 border-l-2 border-l-transparent'
                                        }
                    ${log.level === 'ERROR' ? 'bg-red-500/5' : ''}
                  `}
                                    style={{ height: ROW_HEIGHT }}
                                >
                                    {/* Timestamp */}
                                    <span className="text-muted-foreground w-[85px] flex-shrink-0 tabular-nums">
                                        {formatTimestamp(log.timestamp)}
                                    </span>

                                    {/* Level badge */}
                                    <span className={`w-[46px] text-center rounded px-1 py-0.5 text-[10px] font-bold flex-shrink-0 border ${levelColor(log.level)}`}>
                                        {log.level}
                                    </span>

                                    {/* Service */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="text-primary/70 w-[120px] truncate flex-shrink-0">
                                                {shortService(log.service)}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="font-mono text-xs max-w-md">
                                            {log.service}
                                        </TooltipContent>
                                    </Tooltip>

                                    {/* Message */}
                                    <span className={`flex-1 truncate ${log.level === 'ERROR' ? 'text-red-600 dark:text-red-300' : log.level === 'WARN' ? 'text-amber-700 dark:text-amber-200' : 'text-foreground'}`}>
                                        {redact(log.message)}
                                    </span>

                                    {/* Stacktrace indicator */}
                                    {log.stacktrace && (
                                        <span className="text-red-500/60 text-[10px] flex-shrink-0">⚠ stack</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Empty state */}
                    {filteredLogs.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <ScrollText className="h-10 w-10 mb-3 opacity-30" />
                            <p className="text-sm">{logs.length === 0 ? 'Waiting for log events...' : 'No logs match filters'}</p>
                            {status === 'connecting' && <Loader2 className="h-4 w-4 mt-2 animate-spin" />}
                        </div>
                    )}
                </div>

                {/* ─── Detail Drawer ────────────────────────────── */}
                {selectedLog && (
                    <div className="w-[380px] border-l border-border bg-background flex flex-col flex-shrink-0 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card">
                            <span className="text-xs font-semibold text-foreground">Log Details</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setSelectedLog(null)}
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-[11px]">
                            <DetailRow label="Timestamp" value={selectedLog.timestamp} />
                            <DetailRow label="Level">
                                <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold border ${levelColor(selectedLog.level)}`}>
                                    {selectedLog.level}
                                </span>
                            </DetailRow>
                            <DetailRow label="Service" value={selectedLog.service} mono />
                            <DetailRow label="Thread" value={selectedLog.thread || '—'} mono />
                            <DetailRow label="Request ID" value={selectedLog.requestId || '—'} mono />
                            <DetailRow label="Tenant ID" value={selectedLog.tenantId || '—'} mono />
                            <DetailRow label="User ID" value={selectedLog.userId || '—'} mono />

                            <div>
                                <span className="text-muted-foreground text-[10px] uppercase tracking-wider block mb-1">Message</span>
                                <div className="bg-muted rounded p-2 text-foreground font-mono text-[11px] whitespace-pre-wrap break-all border border-border">
                                    {redact(selectedLog.message)}
                                </div>
                            </div>

                            {selectedLog.stacktrace && (
                                <div>
                                    <button
                                        onClick={() => setStacktraceExpanded(!stacktraceExpanded)}
                                        className="flex items-center gap-1 text-muted-foreground text-[10px] uppercase tracking-wider hover:text-foreground mb-1"
                                    >
                                        {stacktraceExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                        Stacktrace
                                    </button>
                                    {stacktraceExpanded && (
                                        <div className="bg-red-500/5 rounded p-2 text-red-700 dark:text-red-300 font-mono text-[10px] whitespace-pre-wrap break-all border border-red-500/20 max-h-[300px] overflow-y-auto">
                                            {redact(selectedLog.stacktrace)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Footer ──────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-1 border-t border-border bg-card text-[11px] text-muted-foreground flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span>
                        <span className="text-foreground font-medium">{filteredLogs.length.toLocaleString()}</span>
                        {filteredLogs.length !== logs.length && (
                            <span> / {logs.length.toLocaleString()}</span>
                        )} lines
                        <span className="opacity-60"> / {MAX_BUFFER.toLocaleString()} max</span>
                    </span>
                    {droppedCount > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">
                            ⚠ {droppedCount.toLocaleString()} dropped
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {latencyMs !== null && (
                        <span>
                            Last event: <span className={`${latencyMs > 5000 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                                {latencyMs < 1000 ? `${latencyMs}ms` : `${Math.round(latencyMs / 1000)}s`} ago
                            </span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Sub-component ───────────────────────────────────────────
function DetailRow({ label, value, mono, children }: {
    label: string;
    value?: string;
    mono?: boolean;
    children?: React.ReactNode;
}) {
    return (
        <div>
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider block mb-0.5">{label}</span>
            {children || (
                <span className={`text-foreground ${mono ? 'font-mono' : ''} break-all`}>
                    {value}
                </span>
            )}
        </div>
    );
}
