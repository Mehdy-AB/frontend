import { apiClient } from '../client';

// =====================================================================
// RECORDS MANAGEMENT TYPES
// =====================================================================

export type LifecycleState = 'DRAFT' | 'ACTIVE' | 'DECLARED_RECORD' | 'UNDER_RETENTION' | 'PENDING_DISPOSITION' | 'ARCHIVED' | 'DESTROYED' | 'TRANSFERRED';
export type DispositionType = 'ARCHIVE' | 'DESTROY' | 'TRANSFER' | 'REVIEW';
export type DispositionStatus = 'PENDING' | 'APPROVED' | 'EXECUTED' | 'REJECTED' | 'CANCELLED';
export type RetentionTriggerType = 'CREATION_DATE' | 'LAST_MODIFIED' | 'RECORD_DECLARATION' | 'WORKFLOW_COMPLETION' | 'CUSTOM_DATE_FIELD';

// ── Retention Policy ──

export interface RetentionPolicyDto {
    id: number;
    name: string;
    code: string;
    description: string | null;
    retentionYears: number;
    retentionMonths: number;
    retentionDays: number;
    formattedDuration: string;
    triggerType: RetentionTriggerType;
    triggerField: string | null;
    dispositionAction: DispositionType;
    contentLockedDefault: boolean;
    metadataLockedDefault: boolean;
    versioningAllowedDefault: boolean;
    appliesToWorkspaceId: string | null;
    appliesToFilingCategoryId: number | null;
    active: boolean;
    documentCount: number;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface RetentionPolicyRequest {
    name: string;
    code: string;
    description?: string;
    retentionYears?: number;
    retentionMonths?: number;
    retentionDays?: number;
    triggerType?: RetentionTriggerType;
    triggerField?: string;
    dispositionAction?: DispositionType;
    contentLockedDefault?: boolean;
    metadataLockedDefault?: boolean;
    versioningAllowedDefault?: boolean;
    appliesToWorkspaceId?: string;
    appliesToFilingCategoryId?: number;
    isActive?: boolean;
}

// ── Record Category ──

export interface RecordCategoryDto {
    id: number;
    name: string;
    code: string;
    description: string | null;
    parentId: number | null;
    parentName: string | null;
    retentionPolicyId: number;
    retentionPolicyName: string | null;
    retentionDuration: string | null;
    workspaceId: string | null;
    active: boolean;
    documentCount: number;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string | null;
    children: RecordCategoryDto[] | null;
}

export interface RecordCategoryRequest {
    name: string;
    code: string;
    description?: string;
    parentId?: number;
    retentionPolicyId: number;
    workspaceId?: string;
    isActive?: boolean;
}

// ── Legal Hold ──

export interface LegalHoldDto {
    id: number;
    name: string;
    description: string | null;
    matterId: string | null;
    status: string;
    placedBy: string;
    placedByName: string | null;
    placedAt: string;
    releasedBy: string | null;
    releasedByName: string | null;
    releasedAt: string | null;
    releaseReason: string | null;
    documentCount: number;
    createdAt: string;
    updatedAt: string | null;
}

export interface LegalHoldRequest {
    name: string;
    description?: string;
    matterId?: string;
}

// ── Disposition Action ──

export interface DispositionActionDto {
    id: number;
    documentId: number;
    documentName: string | null;
    actionType: DispositionType;
    status: DispositionStatus;
    scheduledAt: string;
    approvedAt: string | null;
    approvedBy: string | null;
    approvedByName: string | null;
    executedAt: string | null;
    executedBy: string | null;
    executedByName: string | null;
    rejectedAt: string | null;
    rejectedBy: string | null;
    rejectedByName: string | null;
    rejectReason: string | null;
    retentionPolicyId: number | null;
    retentionPolicyName: string | null;
    createdAt: string;
    updatedAt: string | null;
}

// ── Document Lifecycle ──

export interface DocumentLifecycleDto {
    documentId: number;
    documentName: string;
    lifecycleState: string;
    declaredRecordAt: string | null;
    declaredRecordBy: string | null;
    declaredRecordByName: string | null;
    recordCategoryId: number | null;
    recordCategoryName: string | null;
    retentionPolicyId: number | null;
    retentionPolicyName: string | null;
    retentionDuration: string | null;
    retentionStartDate: string | null;
    retentionEndDate: string | null;
    dispositionDate: string | null;
    archivedAt: string | null;
    contentLocked: boolean;
    metadataLocked: boolean;
    versioningAllowed: boolean;
    underLegalHold: boolean;
    activeLegalHoldCount: number;
    activeHolds: { id: number; name: string; matterId: string; status: string; documentCount: number; placedAt: string; }[];
}

// ── Lifecycle Audit ──

export interface LifecycleAuditLogDto {
    id: number;
    documentId: number;
    documentName: string | null;
    eventType: string;
    fromState: string | null;
    toState: string | null;
    actorId: string;
    actorName: string | null;
    detail: string | null;
    metadata: Record<string, any> | null;
    ipAddress: string | null;
    createdAt: string;
}

// ── Analytics ──

export interface RecordsAnalytics {
    lifecycleDistribution: Record<string, number>;
    totalDocuments: number;
    declaredRecords: number;
    pendingDisposition: number;
    archivedDocuments: number;
    totalRetentionPolicies: number;
    activeRetentionPolicies: number;
    totalRecordCategories: number;
    activeLegalHolds: number;
    documentsUnderLegalHold: number;
    pendingDispositions: number;
    executedDispositionsLast30Days: number;
    dispositionByType: { type: string; count: number }[];
    dispositionByStatus: { status: string; count: number }[];
    contentLockedDocuments: number;
    metadataLockedDocuments: number;
    versioningDisabledDocuments: number;
    documentsExpiringSoon: number;
}

// ── Page Response ──

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

// =====================================================================
// API SERVICE
// =====================================================================

const RP_BASE = '/api/v1/records/retention-policies';
const RC_BASE = '/api/v1/records/categories';
const LH_BASE = '/api/v1/records/legal-holds';
const DA_BASE = '/api/v1/records/dispositions';
const AN_BASE = '/api/v1/records/analytics';
const AU_BASE = '/api/v1/records/audit';
const DOC_BASE = '/api/v1/documents';

export const recordsManagementService = {

    // ═══ RETENTION POLICIES ═══

    getRetentionPolicies: async (page = 0, size = 20, search?: string, isActive?: boolean, sort = 'createdAt', direction = 'desc'): Promise<PageResponse<RetentionPolicyDto>> => {
        const params = new URLSearchParams({ page: String(page), size: String(size), sort, direction });
        if (search) params.append('search', search);
        if (isActive !== undefined) params.append('isActive', String(isActive));
        return apiClient.get(`${RP_BASE}?${params}`);
    },

    getActiveRetentionPolicies: async (): Promise<RetentionPolicyDto[]> => {
        return apiClient.get(`${RP_BASE}/active`);
    },

    getRetentionPolicyById: async (id: number): Promise<RetentionPolicyDto> => {
        return apiClient.get(`${RP_BASE}/${id}`);
    },

    createRetentionPolicy: async (data: RetentionPolicyRequest): Promise<RetentionPolicyDto> => {
        return apiClient.post(RP_BASE, data);
    },

    updateRetentionPolicy: async (id: number, data: RetentionPolicyRequest): Promise<RetentionPolicyDto> => {
        return apiClient.put(`${RP_BASE}/${id}`, data);
    },

    deleteRetentionPolicy: async (id: number): Promise<void> => {
        return apiClient.delete(`${RP_BASE}/${id}`);
    },

    getRetentionPolicyInfo: async (): Promise<{ totalPolicies: number; activePolicies: number }> => {
        return apiClient.get(`${RP_BASE}/info`);
    },

    // ═══ RECORD CATEGORIES ═══

    getRecordCategories: async (page = 0, size = 20, search?: string, isActive?: boolean, retentionPolicyId?: number, sort = 'createdAt', direction = 'desc'): Promise<PageResponse<RecordCategoryDto>> => {
        const params = new URLSearchParams({ page: String(page), size: String(size), sort, direction });
        if (search) params.append('search', search);
        if (isActive !== undefined) params.append('isActive', String(isActive));
        if (retentionPolicyId) params.append('retentionPolicyId', String(retentionPolicyId));
        return apiClient.get(`${RC_BASE}?${params}`);
    },

    getRecordCategoryTree: async (workspaceId?: string): Promise<RecordCategoryDto[]> => {
        const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
        return apiClient.get(`${RC_BASE}/tree${params}`);
    },

    getRecordCategoryById: async (id: number): Promise<RecordCategoryDto> => {
        return apiClient.get(`${RC_BASE}/${id}`);
    },

    createRecordCategory: async (data: RecordCategoryRequest): Promise<RecordCategoryDto> => {
        return apiClient.post(RC_BASE, data);
    },

    updateRecordCategory: async (id: number, data: RecordCategoryRequest): Promise<RecordCategoryDto> => {
        return apiClient.put(`${RC_BASE}/${id}`, data);
    },

    deleteRecordCategory: async (id: number): Promise<void> => {
        return apiClient.delete(`${RC_BASE}/${id}`);
    },

    // ═══ LEGAL HOLDS ═══

    getLegalHolds: async (page = 0, size = 20, search?: string, status?: string, sort = 'createdAt', direction = 'desc'): Promise<PageResponse<LegalHoldDto>> => {
        const params = new URLSearchParams({ page: String(page), size: String(size), sort, direction });
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        return apiClient.get(`${LH_BASE}?${params}`);
    },

    getLegalHoldById: async (id: number): Promise<LegalHoldDto> => {
        return apiClient.get(`${LH_BASE}/${id}`);
    },

    getLegalHoldDocuments: async (id: number): Promise<number[]> => {
        return apiClient.get(`${LH_BASE}/${id}/documents`);
    },

    createLegalHold: async (data: LegalHoldRequest): Promise<LegalHoldDto> => {
        return apiClient.post(LH_BASE, data);
    },

    updateLegalHold: async (id: number, data: LegalHoldRequest): Promise<LegalHoldDto> => {
        return apiClient.put(`${LH_BASE}/${id}`, data);
    },

    applyLegalHold: async (holdId: number, documentId: number): Promise<void> => {
        return apiClient.post(`${LH_BASE}/${holdId}/apply/${documentId}`);
    },

    applyLegalHoldBulk: async (holdId: number, documentIds: number[]): Promise<void> => {
        return apiClient.post(`${LH_BASE}/${holdId}/apply-bulk`, documentIds);
    },

    removeLegalHoldFromDocument: async (holdId: number, documentId: number): Promise<void> => {
        return apiClient.delete(`${LH_BASE}/${holdId}/documents/${documentId}`);
    },

    releaseLegalHold: async (holdId: number, releaseReason: string): Promise<LegalHoldDto> => {
        return apiClient.post(`${LH_BASE}/${holdId}/release`, { releaseReason });
    },

    // ═══ DISPOSITIONS ═══

    getDispositions: async (page = 0, size = 20, status?: string, actionType?: string, sort = 'scheduledAt', direction = 'desc'): Promise<PageResponse<DispositionActionDto>> => {
        const params = new URLSearchParams({ page: String(page), size: String(size), sort, direction });
        if (status) params.append('status', status);
        if (actionType) params.append('actionType', actionType);
        return apiClient.get(`${DA_BASE}?${params}`);
    },

    getDispositionById: async (id: number): Promise<DispositionActionDto> => {
        return apiClient.get(`${DA_BASE}/${id}`);
    },

    getDispositionsByDocument: async (documentId: number): Promise<DispositionActionDto[]> => {
        return apiClient.get(`${DA_BASE}/document/${documentId}`);
    },

    approveDisposition: async (id: number): Promise<DispositionActionDto> => {
        return apiClient.post(`${DA_BASE}/${id}/approve`);
    },

    rejectDisposition: async (id: number, reason: string): Promise<DispositionActionDto> => {
        return apiClient.post(`${DA_BASE}/${id}/reject`, { reason });
    },

    executeDisposition: async (id: number): Promise<DispositionActionDto> => {
        return apiClient.post(`${DA_BASE}/${id}/execute`);
    },

    // ═══ DOCUMENT LIFECYCLE ═══

    getDocumentLifecycle: async (documentId: number): Promise<DocumentLifecycleDto> => {
        return apiClient.get(`${DOC_BASE}/${documentId}/lifecycle`);
    },

    getDocumentLifecycleAudit: async (documentId: number, page = 0, size = 20): Promise<PageResponse<LifecycleAuditLogDto>> => {
        return apiClient.get(`${DOC_BASE}/${documentId}/lifecycle/audit?page=${page}&size=${size}`);
    },

    declareRecord: async (documentId: number, recordCategoryId: number): Promise<DocumentLifecycleDto> => {
        return apiClient.post(`${DOC_BASE}/${documentId}/declare-record`, { recordCategoryId });
    },

    undeclareRecord: async (documentId: number): Promise<DocumentLifecycleDto> => {
        return apiClient.post(`${DOC_BASE}/${documentId}/undeclare-record`);
    },

    archiveDocument: async (documentId: number): Promise<DocumentLifecycleDto> => {
        return apiClient.post(`${DOC_BASE}/${documentId}/archive`);
    },

    restoreDocument: async (documentId: number): Promise<DocumentLifecycleDto> => {
        return apiClient.post(`${DOC_BASE}/${documentId}/restore`);
    },

    // ═══ ANALYTICS ═══

    getDashboardAnalytics: async (): Promise<RecordsAnalytics> => {
        return apiClient.get(`${AN_BASE}/dashboard`);
    },

    getRetentionPolicyAnalytics: async (): Promise<any> => {
        return apiClient.get(`${AN_BASE}/retention-policies`);
    },

    // ═══ AUDIT LOGS ═══

    getAuditByEventType: async (eventType: string, page = 0, size = 20): Promise<PageResponse<LifecycleAuditLogDto>> => {
        return apiClient.get(`${AU_BASE}/by-event?eventType=${eventType}&page=${page}&size=${size}`);
    },

    getAuditByActor: async (actorId: string, page = 0, size = 20): Promise<PageResponse<LifecycleAuditLogDto>> => {
        return apiClient.get(`${AU_BASE}/by-actor/${actorId}?page=${page}&size=${size}`);
    },

    getAuditByDateRange: async (from: string, to: string, page = 0, size = 20): Promise<PageResponse<LifecycleAuditLogDto>> => {
        return apiClient.get(`${AU_BASE}/by-date-range?from=${from}&to=${to}&page=${page}&size=${size}`);
    },
};
