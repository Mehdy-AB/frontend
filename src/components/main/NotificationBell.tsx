'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, AlertTriangle, Info, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalNotifications, resolveNotificationRoute } from '@/contexts/GlobalNotificationContext';
import { NotificationDto } from '@/api/services/notificationSystemService';
import { Button } from '@/components/ui/button';

// ─── Time Ago Helper ────────────────────────────────────
function timeAgo(dateInput: any): string {
    if (dateInput == null || dateInput === '') return 'just now';

    let dateMs: number;

    if (typeof dateInput === 'number') {
        // Numeric timestamp: if < 1 trillion, it's epoch seconds → convert to ms
        dateMs = dateInput < 1e12 ? dateInput * 1000 : dateInput;
    } else if (typeof dateInput === 'string') {
        // Try parsing as date string (ISO-8601)
        const parsed = new Date(dateInput).getTime();
        if (!isNaN(parsed)) {
            dateMs = parsed;
        } else {
            // Maybe it's a numeric string (epoch seconds)
            const num = Number(dateInput);
            if (!isNaN(num) && num > 0) {
                dateMs = num < 1e12 ? num * 1000 : num;
            } else {
                return 'just now';
            }
        }
    } else {
        return 'just now';
    }

    // Safety: if dateMs is 0 or negative, show fallback
    if (dateMs <= 0) return 'just now';

    const now = Date.now();
    const diff = now - dateMs;

    // If diff is negative (future date), show "just now"
    if (diff < 0) return 'just now';

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateMs).toLocaleDateString();
}

// ─── Severity Icon ──────────────────────────────────────
function SeverityIcon({ severity }: { severity: string }) {
    switch (severity) {
        case 'CRITICAL':
            return <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
        case 'WARNING':
            return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />;
        default:
            return <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    }
}

// ─── Single Notification Item ───────────────────────────
function NotificationListItem({
    notification,
    onRead,
    onClick,
}: {
    notification: NotificationDto;
    onRead: (id: string) => void;
    onClick: (n: NotificationDto) => void;
}) {
    const isUnread = !notification.isRead;

    return (
        <div
            onClick={() => onClick(notification)}
            className={`
        relative px-4 py-3 border-b border-border 
        cursor-pointer transition-all duration-150
        hover:bg-muted/60
        ${isUnread ? 'bg-primary/5' : ''}
      `}
        >
            <div className="flex items-start gap-3">
                {/* Unread dot */}
                <div className="flex-shrink-0 mt-1.5">
                    {isUnread ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                    ) : (
                        <div className="h-2.5 w-2.5 rounded-full bg-transparent" />
                    )}
                </div>

                {/* Severity icon */}
                <div className="mt-0.5">
                    <SeverityIcon severity={notification.severity} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                        {notification.title}
                    </p>
                    {notification.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground/70">
                            {timeAgo(notification.createdAt)}
                        </span>
                        {notification.type !== 'TEST_NOTIFICATION' && notification.type !== 'SYSTEM_ALERT' && (
                            <span className="text-xs text-blue-500 dark:text-blue-400">
                                → Click to open
                            </span>
                        )}
                    </div>
                </div>

                {/* Mark as read button */}
                {isUnread && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRead(notification.id);
                        }}
                        className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                        title="Mark as read"
                    >
                        <Check className="h-3.5 w-3.5 text-gray-400 hover:text-green-500" />
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Bell Component ─────────────────────────────────────
export default function NotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        unreadCount,
        isConnected,
        isLoading,
        markAsRead,
        markAllAsRead,
    } = useGlobalNotifications();

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Handle notification click — mark as read + route
    const handleNotificationClick = async (notification: NotificationDto) => {
        // Mark as read
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }

        // Resolve route from type + data
        const route = resolveNotificationRoute(notification.type, notification.data);
        if (route) {
            setIsOpen(false);
            router.push(route);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell className={`h-4 w-4 transition-transform ${isOpen ? 'scale-110' : ''}`} />

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-card animate-in zoom-in-50 duration-200">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-popover text-popover-foreground rounded-xl shadow-2xl border border-border overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in-0 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Connection indicator */}
                            <div className="flex items-center gap-1 mr-2" title={isConnected ? 'Live connection active' : 'Reconnecting...'}>
                                {isConnected ? (
                                    <Wifi className="h-3 w-3 text-green-500" />
                                ) : (
                                    <WifiOff className="h-3 w-3 text-muted-foreground animate-pulse" />
                                )}
                            </div>
                            {/* Mark all as read */}
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {isLoading && notifications.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Bell className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.slice(0, 20).map((notification) => (
                                <NotificationListItem
                                    key={notification.id}
                                    notification={notification}
                                    onRead={markAsRead}
                                    onClick={handleNotificationClick}
                                />
                            ))
                        )}
                    </div>


                </div>
            )}
        </div>
    );
}
