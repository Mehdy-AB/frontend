'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiUrl } from '@/api/client';
import { tokenManager } from '@/api/auth/tokenManager';

export interface LogEntry {
    id: string;
    timestamp: string;
    level: string;
    service: string;
    tenantId?: string;
    requestId?: string;
    userId?: string;
    thread?: string;
    message: string;
    stacktrace?: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'paused' | 'disconnected';

interface UseLogStreamOptions {
    maxBuffer?: number;
}

interface UseLogStreamReturn {
    logs: LogEntry[];
    status: ConnectionStatus;
    pause: () => void;
    resume: () => void;
    clear: () => void;
    lastEventTime: number | null;
    droppedCount: number;
}

let idCounter = 0;

/**
 * Custom hook for SSE-based live log streaming with auto-reconnect.
 */
export function useLogStream(options: UseLogStreamOptions = {}): UseLogStreamReturn {
    const { maxBuffer = 50_000 } = options;

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [lastEventTime, setLastEventTime] = useState<number | null>(null);
    const [droppedCount, setDroppedCount] = useState(0);

    const eventSourceRef = useRef<EventSource | null>(null);
    const isPausedRef = useRef(false);
    const retryCountRef = useRef(0);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingBufferRef = useRef<LogEntry[]>([]);
    const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Batch flush: push pending logs every 100ms to avoid re-renders per event
    const scheduleFlush = useCallback(() => {
        if (flushTimerRef.current) return;
        flushTimerRef.current = setTimeout(() => {
            flushTimerRef.current = null;
            const batch = pendingBufferRef.current;
            if (batch.length === 0) return;
            pendingBufferRef.current = [];

            setLogs(prev => {
                const combined = [...prev, ...batch];
                if (combined.length > maxBuffer) {
                    const overflow = combined.length - maxBuffer;
                    setDroppedCount(d => d + overflow);
                    return combined.slice(overflow);
                }
                return combined;
            });
        }, 100);
    }, [maxBuffer]);

    const connect = useCallback(async () => {
        // Clean up existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        if (isPausedRef.current) return;

        setStatus('connecting');

        try {
            const token = await tokenManager.getValidAccessToken();
            if (!token) {
                setStatus('disconnected');
                return;
            }

            const baseUrl = getApiUrl();
            const url = `${baseUrl}/api/admin/logs/stream?token=${encodeURIComponent(token)}`;
            const es = new EventSource(url);
            eventSourceRef.current = es;

            es.addEventListener('connected', () => {
                setStatus('connected');
                retryCountRef.current = 0;
            });

            es.addEventListener('log', (event: MessageEvent) => {
                if (isPausedRef.current) return;

                try {
                    const data = JSON.parse(event.data);
                    const entry: LogEntry = {
                        id: `log-${++idCounter}`,
                        timestamp: data.timestamp,
                        level: data.level,
                        service: data.service,
                        tenantId: data.tenantId,
                        requestId: data.requestId,
                        userId: data.userId,
                        thread: data.thread,
                        message: data.message,
                        stacktrace: data.stacktrace,
                    };

                    pendingBufferRef.current.push(entry);
                    setLastEventTime(Date.now());
                    scheduleFlush();
                } catch {
                    // Ignore parse errors
                }
            });

            es.onerror = () => {
                es.close();
                eventSourceRef.current = null;

                if (isPausedRef.current) {
                    setStatus('paused');
                    return;
                }

                setStatus('reconnecting');
                const backoff = Math.min(1000 * Math.pow(2, retryCountRef.current), 30_000);
                retryCountRef.current++;
                retryTimerRef.current = setTimeout(() => {
                    retryTimerRef.current = null;
                    connect();
                }, backoff);
            };
        } catch {
            setStatus('disconnected');
        }
    }, [scheduleFlush]);

    const pause = useCallback(() => {
        isPausedRef.current = true;
        setStatus('paused');
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }
    }, []);

    const resume = useCallback(() => {
        isPausedRef.current = false;
        retryCountRef.current = 0;
        connect();
    }, [connect]);

    const clear = useCallback(() => {
        setLogs([]);
        setDroppedCount(0);
        pendingBufferRef.current = [];
    }, []);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connect();
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
            if (flushTimerRef.current) {
                clearTimeout(flushTimerRef.current);
                flushTimerRef.current = null;
            }
            // Clear buffer on navigation away (no persistence)
            pendingBufferRef.current = [];
        };
    }, [connect]);

    return { logs, status, pause, resume, clear, lastEventTime, droppedCount };
}
