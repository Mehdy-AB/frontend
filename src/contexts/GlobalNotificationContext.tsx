'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { tokenManager } from '@/api/auth/tokenManager';
import { useNotification } from '@/contexts/NotificationContext';
import {
    notificationSystemService,
    NotificationDto,
} from '@/api/services/notificationSystemService';

// ─── Notification Route Resolver ────────────────────────
// Frontend controls routing. Add new types here as modules integrate.
type RouteResolver = (data: Record<string, any>) => string | null;

const NOTIFICATION_ROUTES: Record<string, RouteResolver> = {
    // ── Documents (all users) ────────────────────────────
    DOCUMENT_UPLOADED: (d) => d.documentId ? `/documents/${d.documentId}` : null,
    DOCUMENT_SHARED: (d) => d.documentId ? `/documents/${d.documentId}` : null,
    COMMENT_ADDED: (d) => d.documentId ? `/documents/${d.documentId}` : null,

    // ── Folders (all users) ──────────────────────────────
    FOLDER_SHARED: (d) => d.folderId ? `/folders/${d.folderId}` : null,

    // ── Workflows (admin panel) ─────────────────────────
    WORKFLOW_ASSIGNED: (d) => d.workflowId ? `/admin/workflow/${d.workflowId}` : null,
    WORKFLOW_COMPLETED: (d) => d.workflowId ? `/admin/workflow/${d.workflowId}` : null,

    // ── Tasks (all users — sidebar) ─────────────────────
    TASK_ASSIGNED: () => `/admin/tasks`,

    // ── Email Campaigns ─────────────────────────────────
    // Recipients (any user) — notification is self-contained, no route needed
    CAMPAIGN_EMAIL_RECEIVED: () => null,
    // Sender status (admin only) — route to admin emails page
    CAMPAIGN_COMPLETED: () => `/admin/system/emails`,
    CAMPAIGN_FAILED: () => `/admin/system/emails`,

    // ── Generic / test ──────────────────────────────────
    TEST_NOTIFICATION: () => null,
    SYSTEM_ALERT: () => null,

    // ── LDAP sync ────────────────────────────────────────
    LDAP_SYNC_COMPLETED: () => `/admin/users/ldap-servers`,
};

export function resolveNotificationRoute(type: string, data: Record<string, any>): string | null {
    const resolver = NOTIFICATION_ROUTES[type];
    if (!resolver) return null;
    return resolver(data);
}

// ─── Context ────────────────────────────────────────────

interface GlobalNotificationContextType {
    notifications: NotificationDto[];
    unreadCount: number;
    isConnected: boolean;
    isLoading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const GlobalNotificationContext = createContext<GlobalNotificationContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────

interface Props {
    children: ReactNode;
}

// Helper: normalize Jackson's boolean serialization (Boolean isRead → "read" in JSON)
function normalizeNotification(n: any): NotificationDto {
    return {
        ...n,
        isRead: n.isRead ?? n.read ?? false,
    };
}

export function GlobalNotificationProvider({ children }: Props) {
    const { data: session, status } = useSession();
    const { addNotification } = useNotification();

    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttemptRef = useRef(0);
    const isMountedRef = useRef(true);

    const userId = (session?.user as any)?.id;
    const isAuthenticated = status === 'authenticated' && !!userId;

    // ── Fetch initial data ──────────────────────────────
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            setIsLoading(true);
            const [notifPage, countResp] = await Promise.all([
                notificationSystemService.getNotifications(0, 20),
                notificationSystemService.getUnreadCount(),
            ]);
            if (isMountedRef.current) {
                setNotifications(notifPage.content.map(normalizeNotification));
                setUnreadCount(countResp.count);
            }
        } catch (err) {
            console.error('[GlobalNotification] Failed to fetch notifications:', err);
        } finally {
            if (isMountedRef.current) setIsLoading(false);
        }
    }, [isAuthenticated]);

    // ── SSE Connection ──────────────────────────────────
    const connectSSE = useCallback(async () => {
        if (!isAuthenticated || !isMountedRef.current) return;

        // Close existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        try {
            // Get the access token for SSE auth via query param
            const token = await tokenManager.getValidAccessToken();
            if (!token || !isMountedRef.current) return;

            // Determine the API base URL
            const apiUrl = (window as any).ENV?.API_URL || 'http://localhost:8080';
            const sseUrl = `${apiUrl}/api/notifications/stream?token=${encodeURIComponent(token)}`;

            const eventSource = new EventSource(sseUrl, { withCredentials: true });
            eventSourceRef.current = eventSource;

            eventSource.addEventListener('connected', () => {
                if (!isMountedRef.current) return;
                setIsConnected(true);
                reconnectAttemptRef.current = 0;
                console.log('[GlobalNotification] SSE connected');
            });

            eventSource.addEventListener('notification', (event: MessageEvent) => {
                if (!isMountedRef.current) return;
                try {
                    const notification = normalizeNotification(JSON.parse(event.data));

                    // Add to list (prepend)
                    setNotifications((prev) => [notification, ...prev].slice(0, 50));

                    // Increment unread count
                    setUnreadCount((prev) => prev + 1);

                    // Show toast via existing notification system
                    const toastType = notification.severity === 'CRITICAL'
                        ? 'error'
                        : notification.severity === 'WARNING'
                            ? 'warning'
                            : 'info';

                    addNotification({
                        type: toastType as any,
                        title: notification.title,
                        message: notification.message || undefined,
                        duration: 5000,
                    });
                } catch (err) {
                    console.error('[GlobalNotification] Failed to parse SSE event:', err);
                }
            });

            eventSource.onerror = () => {
                if (!isMountedRef.current) return;
                setIsConnected(false);
                eventSource.close();
                eventSourceRef.current = null;

                // Exponential backoff reconnect
                const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
                reconnectAttemptRef.current++;
                console.log(`[GlobalNotification] SSE disconnected, reconnecting in ${delay}ms...`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    if (isMountedRef.current) connectSSE();
                }, delay);
            };
        } catch (err) {
            console.error('[GlobalNotification] Failed to establish SSE:', err);
        }
    }, [isAuthenticated, addNotification]);

    // ── Lifecycle ───────────────────────────────────────
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            connectSSE();
        }

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [isAuthenticated, fetchNotifications, connectSSE]);

    // ── Actions ─────────────────────────────────────────
    const markAsRead = useCallback(async (id: string) => {
        try {
            // Optimistic update
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));

            await notificationSystemService.markAsRead(id);
        } catch (err) {
            console.error('[GlobalNotification] Failed to mark as read:', err);
            // Revert on error
            fetchNotifications();
        }
    }, [fetchNotifications]);

    const markAllAsRead = useCallback(async () => {
        try {
            // Optimistic update
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() }))
            );
            setUnreadCount(0);

            await notificationSystemService.markAllAsRead();
        } catch (err) {
            console.error('[GlobalNotification] Failed to mark all as read:', err);
            fetchNotifications();
        }
    }, [fetchNotifications]);

    const value: GlobalNotificationContextType = {
        notifications,
        unreadCount,
        isConnected,
        isLoading,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
    };

    return (
        <GlobalNotificationContext.Provider value={value}>
            {children}
        </GlobalNotificationContext.Provider>
    );
}

export function useGlobalNotifications() {
    const context = useContext(GlobalNotificationContext);
    if (context === undefined) {
        throw new Error('useGlobalNotifications must be used within a GlobalNotificationProvider');
    }
    return context;
}
