import { apiClient } from '../client';

export interface DashboardStats {
    totalDocuments: number;
    totalFolders: number;
    activeUsers: number;
    totalWorkspaces: number;
    pendingWorkflowTasks: number;
    totalWorkflows: number;
    recentDocuments: RecentDocument[];
    recentActivity: ActivityItem[];
}

export interface RecentDocument {
    id: number;
    name: string;
    folderName: string | null;
    contentType: string;
    size: number;
    createdByName: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ActivityItem {
    action: string;
    entityType: string;
    entityName: string;
    actorName: string;
    timestamp: string;
}

export const dashboardService = {
    getStats: (): Promise<DashboardStats> =>
        apiClient.get('/api/v1/dashboard/stats'),
};
