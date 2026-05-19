import { apiClient } from '../client';

// ═══ Types ═══

export interface ClassificationTypeDto {
    id: number;
    workspaceId: string;
    name: string;
    code: string;
    description: string;
    targetFolderId: number | null;
    targetFolderName: string | null;
    targetFolderPath: string | null;
    color: string;
    icon: string;
    autoMove: boolean;
    active: boolean;
    documentCount: number;
    retentionYears: number;
    retentionMonths: number;
    retentionDays: number;
    formattedRetention: string;
    retentionTrigger: string;
    dispositionAction: string;
    autoDeclareRecord: boolean;
    recordCategoryId: number | null;
    recordCategoryName: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClassificationTypeRequest {
    name: string;
    code: string;
    description?: string;
    targetFolderId?: number | null;
    color?: string;
    icon?: string;
    autoMove: boolean;
    isActive: boolean;
    retentionYears?: number;
    retentionMonths?: number;
    retentionDays?: number;
    retentionTrigger?: string;
    dispositionAction?: string;
    autoDeclareRecord?: boolean;
    recordCategoryId?: number | null;
}

export interface ClassifyDocumentRequest {
    classificationTypeId: number;
    acceptRouting?: boolean;
    notes?: string;
}

export interface RoutingSuggestionDto {
    documentId: number;
    documentName: string;
    currentFolderId: number;
    currentFolderName: string;
    classificationTypeId: number;
    classificationTypeName: string;
    suggestedFolderId: number | null;
    suggestedFolderName: string | null;
    suggestedFolderPath: string | null;
    autoMoveEnabled: boolean;
    alreadyInTarget: boolean;
}

export interface ClassificationAuditDto {
    id: number;
    documentId: number;
    documentName: string;
    classificationTypeId: number;
    classificationTypeName: string;
    action: string;
    fromFolderId: number | null;
    fromFolderName: string | null;
    toFolderId: number | null;
    toFolderName: string | null;
    wasAutoMoved: boolean;
    actorId: string;
    actorName: string;
    notes: string;
    createdAt: string;
}

interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
}

// ═══ Service ═══

export const classificationService = {

    // ─── Classification Types CRUD ───

    getTypes: (workspaceId: string, page = 0, size = 20, search?: string) =>
        apiClient.get<PageResponse<ClassificationTypeDto>>(`/api/v1/workspaces/${workspaceId}/classification-types`, {
            params: { page, size, search },
        }),

    getActiveTypes: (workspaceId: string) =>
        apiClient.get<ClassificationTypeDto[]>(`/api/v1/workspaces/${workspaceId}/classification-types/active`),

    getTypeById: (id: number) =>
        apiClient.get<ClassificationTypeDto>(`/api/v1/classification-types/${id}`),

    createType: (workspaceId: string, data: ClassificationTypeRequest) =>
        apiClient.post<ClassificationTypeDto>(`/api/v1/workspaces/${workspaceId}/classification-types`, data),

    updateType: (id: number, data: ClassificationTypeRequest) =>
        apiClient.put<ClassificationTypeDto>(`/api/v1/classification-types/${id}`, data),

    deleteType: (id: number) =>
        apiClient.delete(`/api/v1/classification-types/${id}`),

    // ─── Document Classification ───

    classifyDocument: (documentId: number, data: ClassifyDocumentRequest) =>
        apiClient.post<RoutingSuggestionDto>(`/api/v1/documents/${documentId}/classify`, data),

    getRoutingSuggestion: (documentId: number) =>
        apiClient.get<RoutingSuggestionDto>(`/api/v1/documents/${documentId}/routing-suggestion`),

    acceptRouting: (documentId: number) =>
        apiClient.post(`/api/v1/documents/${documentId}/accept-routing`),

    rejectRouting: (documentId: number, reason?: string) =>
        apiClient.post(`/api/v1/documents/${documentId}/reject-routing`, { reason }),

    // ─── Audit ───

    getDocumentHistory: (documentId: number, page = 0, size = 20) =>
        apiClient.get<PageResponse<ClassificationAuditDto>>(`/api/v1/documents/${documentId}/classification-history`, {
            params: { page, size },
        }),

    getWorkspaceAudit: (workspaceId: string, page = 0, size = 20) =>
        apiClient.get<PageResponse<ClassificationAuditDto>>(`/api/v1/workspaces/${workspaceId}/classification-audit`, {
            params: { page, size },
        }),

    // ─── Analytics ───

    getWorkspaceStats: (workspaceId: string) =>
        apiClient.get<Record<string, unknown>>(`/api/v1/workspaces/${workspaceId}/classification-stats`),
};
