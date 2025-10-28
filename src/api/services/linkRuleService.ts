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
} from '../../types/api';

export class LinkRuleService {
  private baseUrl = '/api/v1/link-rules';

  // Get all link rules with pagination
  async getLinkRules(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'name',
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<LinkRuleResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });

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
  async toggleLinkRuleStatus(ruleId: number, enabled: boolean): Promise<LinkRuleResponseDto> {
    return apiClient.patch<LinkRuleResponseDto>(`${this.baseUrl}/${ruleId}/status`, { enabled });
  }

  // Execute link rule
  async executeLinkRule(executionData: RuleExecutionRequest): Promise<RuleExecutionResponse> {
    return apiClient.post<RuleExecutionResponse>(`${this.baseUrl}/execute`, executionData);
  }

  // Bulk execute link rules
  async bulkExecuteLinkRules(executionData: BulkRuleExecutionRequest): Promise<BulkRuleExecutionResponse> {
    return apiClient.post<BulkRuleExecutionResponse>(`${this.baseUrl}/bulk-execute`, executionData);
  }

  // Get link rule statistics
  async getLinkRuleStatistics(ruleId: number): Promise<RuleStatistics> {
    return apiClient.get<RuleStatistics>(`${this.baseUrl}/${ruleId}/statistics`);
  }

  // Get all link rule statistics
  async getAllLinkRuleStatistics(): Promise<RuleStatistics[]> {
    return apiClient.get<RuleStatistics[]>(`${this.baseUrl}/statistics`);
  }

  // Get cache statistics
  async getCacheStatistics(): Promise<LinkRuleCacheStatistics> {
    return apiClient.get<LinkRuleCacheStatistics>(`${this.baseUrl}/cache-statistics`);
  }

  // Clear cache
  async clearCache(): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/cache`);
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
    return apiClient.get<LinkRuleResponseDto[]>(`${this.baseUrl}/enabled`);
  }

  // Bulk operations
  async bulkDeleteLinkRules(ruleIds: number[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/bulk`, {
      data: { ruleIds },
    });
  }

  async bulkToggleLinkRuleStatus(ruleIds: number[], enabled: boolean): Promise<void> {
    return apiClient.patch<void>(`${this.baseUrl}/bulk/status`, {
      ruleIds,
      enabled,
    });
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

    return apiClient.get<PageResponse<DocumentLinkResponseDto>>(`${this.baseUrl}/links?${params}`);
  }

  // Get document link by ID
  async getDocumentLinkById(linkId: number): Promise<DocumentLinkResponseDto> {
    return apiClient.get<DocumentLinkResponseDto>(`${this.baseUrl}/links/${linkId}`);
  }

  // Create manual document link
  async createDocumentLink(linkData: DocumentLinkRequestDto): Promise<DocumentLinkResponseDto> {
    return apiClient.post<DocumentLinkResponseDto>(`${this.baseUrl}/links`, linkData);
  }

  // Update document link
  async updateDocumentLink(linkId: number, linkData: Partial<DocumentLinkRequestDto>): Promise<DocumentLinkResponseDto> {
    return apiClient.put<DocumentLinkResponseDto>(`${this.baseUrl}/links/${linkId}`, linkData);
  }

  // Delete document link
  async deleteDocumentLink(linkId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/links/${linkId}`);
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

    return apiClient.get<PageResponse<RelatedDocumentResponseDto>>(`${this.baseUrl}/links/document/${documentId}?${params}`);
  }

  // Get related documents
  async getRelatedDocuments(
    documentId: number,
    linkType?: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<RelatedDocumentResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (linkType) {
      params.append('linkType', linkType);
    }

    return apiClient.get<PageResponse<RelatedDocumentResponseDto>>(`${this.baseUrl}/links/related/${documentId}?${params}`);
  }

  // Get link statistics
  async getLinkStatistics(): Promise<{
    totalLinks: number;
    linksByType: Record<string, number>;
    linksByRule: Record<string, number>;
    manualLinks: number;
    automaticLinks: number;
  }> {
    return apiClient.get(`${this.baseUrl}/links/statistics`);
  }

  // Bulk operations for document links
  async bulkDeleteDocumentLinks(linkIds: number[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/links/bulk`, {
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

    return apiClient.get<PageResponse<DocumentLinkResponseDto>>(`${this.baseUrl}/links/search?${params}`);
  }
}

export const linkRuleService = new LinkRuleService();

