import { apiClient } from '../client';
import {
  LinkRuleRequestDto,
  LinkRuleResponseDto,
  PageResponse,
  DocumentLinkRequestDto,
  DocumentLinkResponseDto,
  RelatedDocumentResponseDto,
  RuleExecutionRequest,
  RuleExecutionResponse,
  RuleStatistics,
  BulkRuleExecutionRequest,
  BulkRuleExecutionResponse,
  LinkRuleCacheStatistics,
  LinkRuleExecutionLogDto,
  LinkRuleTrendDto,
  LinkRuleAggregatedStats,
  LinkRuleAuditLogDto,
} from '../../types/api';

export class LinkRuleService {
  // Backend uses "/api/link-rules" (no v1 prefix)
  private baseUrl = '/api/link-rules';

  // Get all link rules with pagination and optional filters
  async getLinkRules(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'name',
    sortDirection: 'asc' | 'desc' = 'asc',
    filters?: { enabled?: boolean; linkType?: string; name?: string }
  ): Promise<PageResponse<LinkRuleResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });

    if (filters?.enabled !== undefined) params.append('enabled', String(filters.enabled));
    if (filters?.linkType) params.append('linkType', filters.linkType);
    if (filters?.name) params.append('name', filters.name);

    return apiClient.get<PageResponse<LinkRuleResponseDto>>(`${this.baseUrl}?${params}`);
  }

  // Get link rule by ID
  async getLinkRuleById(ruleId: number): Promise<LinkRuleResponseDto> {
    return apiClient.get<LinkRuleResponseDto>(`${this.baseUrl}/${ruleId}`);
  }

  // Create new link rule
  async createLinkRule(ruleData: LinkRuleRequestDto): Promise<LinkRuleResponseDto> {
    return apiClient.post<LinkRuleResponseDto>(this.baseUrl, ruleData);
  }

  // Update link rule
  async updateLinkRule(ruleId: number, ruleData: LinkRuleRequestDto): Promise<LinkRuleResponseDto> {
    return apiClient.put<LinkRuleResponseDto>(`${this.baseUrl}/${ruleId}`, ruleData);
  }

  // Delete link rule
  async deleteLinkRule(ruleId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${ruleId}`);
  }

  // Enable/disable link rule
  async toggleLinkRuleStatus(ruleId: number, enabled: boolean): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/${ruleId}/toggle?enabled=${enabled}`);
  }

  // Execute link rule
  async executeLinkRule(executionData: RuleExecutionRequest): Promise<{ status: string }> {
    const { ruleId } = executionData;
    return apiClient.post<{ status: string }>(`${this.baseUrl}/${ruleId}/apply`);
  }

  // Bulk execute link rules
  async bulkExecuteLinkRules(executionData: BulkRuleExecutionRequest): Promise<void> {
    const { ruleIds } = executionData;
    await Promise.all(ruleIds.map((id) => this.executeLinkRule({ ruleId: id })));
  }

  // Get link rule statistics
  async getLinkRuleStatistics(ruleId: number): Promise<RuleStatistics> {
    // Not implemented in backend; caller should use getAllLinkRuleStatistics
    const all = await this.getAllLinkRuleStatistics();
    const found = all.find(s => s.ruleId === ruleId);
    if (!found) throw new Error('Statistics not found for rule');
    return found;
  }

  // Get all link rule statistics
  async getAllLinkRuleStatistics(): Promise<RuleStatistics[]> {
    return apiClient.get<RuleStatistics[]>(`${this.baseUrl}/statistics`);
  }

  // Get cache statistics
  async getCacheStatistics(): Promise<LinkRuleCacheStatistics> {
    return apiClient.get<LinkRuleCacheStatistics>(`${this.baseUrl}/cache-statistics`);
  }

  // Get paginated execution history for a specific rule
  async getRuleExecutionHistory(
    ruleId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<LinkRuleExecutionLogDto>> {
    return apiClient.get<PageResponse<LinkRuleExecutionLogDto>>(
      `${this.baseUrl}/${ruleId}/executions?page=${page}&size=${size}`
    );
  }

  // Get single execution detail
  async getRuleExecutionDetail(
    ruleId: number,
    executionId: number
  ): Promise<LinkRuleExecutionLogDto> {
    return apiClient.get<LinkRuleExecutionLogDto>(
      `${this.baseUrl}/${ruleId}/executions/${executionId}`
    );
  }

  // Get aggregated stats for a specific rule
  async getRuleAggregatedStats(ruleId: number): Promise<LinkRuleAggregatedStats> {
    return apiClient.get<LinkRuleAggregatedStats>(`${this.baseUrl}/${ruleId}/stats`);
  }

  // Get recent executions across all rules
  async getRecentExecutions(
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<LinkRuleExecutionLogDto>> {
    return apiClient.get<PageResponse<LinkRuleExecutionLogDto>>(
      `${this.baseUrl}/executions/recent?page=${page}&size=${size}`
    );
  }

  // Clear cache
  async clearCache(): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/cache`);
  }

  // ==================== GOVERNANCE & COLLABORATION ====================

  // Approve a pending rule
  async approveRule(ruleId: number): Promise<LinkRuleResponseDto> {
    return apiClient.put<LinkRuleResponseDto>(`${this.baseUrl}/${ruleId}/approve`, {});
  }

  // Reject a pending rule
  async rejectRule(ruleId: number, reason?: string): Promise<LinkRuleResponseDto> {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return apiClient.put<LinkRuleResponseDto>(`${this.baseUrl}/${ruleId}/reject${params}`, {});
  }

  // Get audit logs for a rule
  async getRuleAuditLogs(
    ruleId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<LinkRuleAuditLogDto>> {
    return apiClient.get<PageResponse<LinkRuleAuditLogDto>>(
      `${this.baseUrl}/${ruleId}/audit-logs?page=${page}&size=${size}`
    );
  }

  // Search link rules
  async searchLinkRules(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<LinkRuleResponseDto>> {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<LinkRuleResponseDto>>(`${this.baseUrl}/search?${params}`);
  }

  // Get enabled link rules
  async getEnabledLinkRules(): Promise<LinkRuleResponseDto[]> {
    const page = await this.getLinkRules(0, 1000, 'createdAt', 'desc', { enabled: true });
    return page.content || [];
  }

  // Export / Import
  async exportLinkRules(): Promise<LinkRuleResponseDto[]> {
    return apiClient.get<LinkRuleResponseDto[]>(`${this.baseUrl}/export`);
  }

  async importLinkRules(rules: LinkRuleRequestDto[]): Promise<LinkRuleResponseDto[]> {
    return apiClient.post<LinkRuleResponseDto[]>(`${this.baseUrl}/import`, rules);
  }

  // Bulk operations
  async bulkDeleteLinkRules(ruleIds: number[]): Promise<void> {
    await Promise.all(ruleIds.map((id) => this.deleteLinkRule(id)));
  }

  async bulkToggleLinkRuleStatus(ruleIds: number[], enabled: boolean): Promise<void> {
    await Promise.all(ruleIds.map((id) => this.toggleLinkRuleStatus(id, enabled)));
  }

  // ==================== DOCUMENT LINK OPERATIONS ====================

  // Get all document links with pagination
  async getDocumentLinks(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<PageResponse<DocumentLinkResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });

    return apiClient.get<PageResponse<DocumentLinkResponseDto>>(`/api/v1/document-links?${params}`);
  }

  // Get document link by ID
  async getDocumentLinkById(linkId: number): Promise<DocumentLinkResponseDto> {
    return apiClient.get<DocumentLinkResponseDto>(`/api/v1/document-links/${linkId}`);
  }

  // Create manual document link
  async createDocumentLink(linkData: DocumentLinkRequestDto): Promise<DocumentLinkResponseDto> {
    return apiClient.post<DocumentLinkResponseDto>('/api/v1/document-links', linkData);
  }

  // Update document link
  async updateDocumentLink(linkId: number, linkData: Partial<DocumentLinkRequestDto>): Promise<DocumentLinkResponseDto> {
    return apiClient.put<DocumentLinkResponseDto>(`/api/v1/document-links/${linkId}`, linkData);
  }

  // Delete document link
  async deleteDocumentLink(linkId: number): Promise<void> {
    return apiClient.delete<void>(`/api/v1/document-links/${linkId}`);
  }

  // Get links for document
  async getDocumentLinksForDocument(
    documentId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<RelatedDocumentResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<RelatedDocumentResponseDto>>(`/api/v1/document-links/document/${documentId}/related?${params}`);
  }

  // Get related documents with full search and filtering
  async getRelatedDocuments(
    documentId: number,
    params?: {
      search?: string;
      linkType?: string;
      isManual?: boolean;
      fromDate?: string;
      toDate?: string;
      page?: number;
      size?: number;
    }
  ): Promise<PageResponse<RelatedDocumentResponseDto>> {
    const searchParams = new URLSearchParams({
      page: (params?.page || 0).toString(),
      size: (params?.size || 20).toString(),
    });

    if (params?.search) searchParams.append('search', params.search);
    if (params?.linkType && params.linkType !== 'all') searchParams.append('linkType', params.linkType);
    if (params?.isManual !== undefined) searchParams.append('isManual', params.isManual.toString());
    if (params?.fromDate) searchParams.append('fromDate', params.fromDate);
    if (params?.toDate) searchParams.append('toDate', params.toDate);

    return apiClient.get<PageResponse<RelatedDocumentResponseDto>>(`/api/v1/document-links/document/${documentId}/related?${searchParams}`);
  }

  // Get link statistics
  async getLinkStatistics(): Promise<{
    totalLinks: number;
    linksByType: Record<string, number>;
    linksByRule: Record<string, number>;
    manualLinks: number;
    automaticLinks: number;
  }> {
    return apiClient.get(`/api/v1/document-links/statistics`);
  }

  // Bulk operations for document links
  async bulkDeleteDocumentLinks(linkIds: number[]): Promise<void> {
    return apiClient.delete<void>(`/api/v1/document-links/bulk`, {
      data: { linkIds },
    });
  }

  // Search document links
  async searchDocumentLinks(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<DocumentLinkResponseDto>> {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<DocumentLinkResponseDto>>(`/api/v1/document-links/search?${params}`);
  }

  // Get rule execution trends
  async getRuleTrends(days: number = 30): Promise<LinkRuleTrendDto[]> {
    return apiClient.get<LinkRuleTrendDto[]>(`/api/admin/link-rules/analytics/trends?days=${days}`);
  }

  // Export execution history to CSV
  async exportExecutionHistoryAsCsv(ruleId: number): Promise<void> {
    const response = await apiClient.get<Blob>(`/api/admin/link-rules/${ruleId}/export-csv`, {
      responseType: 'blob',
    });

    // Create a download link for the Blob
    const url = window.URL.createObjectURL(new Blob([response as any])); // axios returns data directly in some setups, or response.data
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rule-${ruleId}-executions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const linkRuleService = new LinkRuleService();

