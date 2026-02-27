import { apiClient } from '../client';

// ─── Types ──────────────────────────────────────────────

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface NotificationDto {
    id: string;
    recipientUserId: string;
    type: string;
    title: string;
    message: string | null;
    data: Record<string, any>;
    severity: NotificationSeverity;
    isRead: boolean;  // Note: comes as "read" from Jackson due to boolean getter naming
    read?: boolean;   // Jackson may serialize Boolean isRead as "read"
    createdAt: string;
    readAt: string | null;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
}

export interface UnreadCountResponse {
    count: number;
}

export interface EmitNotificationRequest {
    recipientUserId: string;
    type: string;
    title: string;
    message?: string;
    severity?: NotificationSeverity;
    data?: Record<string, any>;
}

// ─── API ────────────────────────────────────────────────

export const notificationSystemService = {
    /**
     * Get paginated notifications for the current user.
     */
    async getNotifications(page = 0, size = 10): Promise<PageResponse<NotificationDto>> {
        return apiClient.get<PageResponse<NotificationDto>>(
            `/api/notifications?page=${page}&size=${size}`
        );
    },

    /**
     * Get unread count for the current user.
     */
    async getUnreadCount(): Promise<UnreadCountResponse> {
        return apiClient.get<UnreadCountResponse>('/api/notifications/unread-count');
    },

    /**
     * Mark a single notification as read.
     */
    async markAsRead(id: string): Promise<NotificationDto> {
        return apiClient.patch<NotificationDto>(`/api/notifications/${id}/read`);
    },

    /**
     * Mark all notifications as read.
     */
    async markAllAsRead(): Promise<{ updated: number }> {
        return apiClient.patch<{ updated: number }>('/api/notifications/read-all');
    },

    /**
     * Emit a test notification (internal endpoint).
     */
    async emitTestNotification(request: EmitNotificationRequest): Promise<NotificationDto> {
        return apiClient.post<NotificationDto>('/api/internal/notifications/emit', request);
    },
};
