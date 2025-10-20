import { notificationApiClient } from '../notificationClient';
import {
  DocumentResponseDto,
  FilingCategoryDocDto,
  UpdateDocumentMetadataRequestDto,
  TypeShareAccessDocWithTypeReq,
  TypeShareAccessDocumentRes,
  ExtractorLanguage,
  PageResponse,
  EditDocumentTitleRequestDto,
  DocumentVersionUploadRequestDto,
  DocumentVersionResponse,
  // Tag types
  CreateTagRequestDto,
  UpdateTagRequestDto,
  AddTagToDocumentRequestDto,
  TagResponseDto,
  DocumentTagResponseDto,
  // Link Rule types
  LinkRuleRequestDto,
  LinkRuleResponseDto,
  DocumentLinkRequestDto,
  DocumentLinkResponseDto,
  RelatedDocumentResponseDto,
  // Document search types
  DocumentSearchResponse,
  SearchRequestDto,
  AdvancedSearchRequestDto,
  AdvancedSearchResponseDto,
  // Rule execution types
  RuleExecutionRequest,
  RuleExecutionResponse,
  RuleStatistics,
  BulkRuleExecutionRequest,
  BulkRuleExecutionResponse,
  LinkRuleCacheStatistics
} from '../../types/api';

export class DocumentService {
  /**
   * Upload document
   */
  static async uploadDocument(
    file: File,
    folderId: number,
    title: string,
    lang: ExtractorLanguage,
    filingCategoryDto: FilingCategoryDocDto[],
    options?: any
  ): Promise<DocumentResponseDto> {
    return notificationApiClient.uploadDocument(file, folderId, title, lang, filingCategoryDto, options);
  }


  /**
   * Get document by ID
   */
  static async getDocument(
    id: number,
  ): Promise<DocumentResponseDto> {
    return notificationApiClient.getDocumentById(id);
  }

  /**
   * Rename document
   */
  static async renameDocument(id: number, name: string, options?: any): Promise<void> {
    return notificationApiClient.renameDocument(id, name, options);
  }

  /**
   * Edit document title
   */
  static async editDocumentTitle(id: number, request: EditDocumentTitleRequestDto, options?: any): Promise<void> {
    return notificationApiClient.editDocumentTitle(id, request, options);
  }

  /**
   * Update document metadata
   */
  static async updateDocumentMetadata(id: number, request: UpdateDocumentMetadataRequestDto, options?: any): Promise<void> {
    return notificationApiClient.updateDocumentMetadata(id, request, options);
  }

  /**
   * Get document versions list
   */
  static async getDocumentVersionsList(id: number, options?: any): Promise<DocumentVersionResponse[]> {
    return notificationApiClient.getDocumentVersionsList(id, options);
  }

  /**
   * Upload document version
   */
  static async uploadDocumentVersion(
    file: File,
    documentId: number,
    lang: ExtractorLanguage,
    options?: any
  ): Promise<DocumentResponseDto> {
    return notificationApiClient.uploadDocumentVersion(file, documentId, lang, options);
  }

  /**
   * Move document
   */
  static async moveDocument(id: number, to: number, options?: any): Promise<void> {
    return notificationApiClient.moveDocument(id, to, options);
  }

  /**
   * Download document
   */
  static async downloadDocument(id: number, params: {
    version?: number;
    page?: number;
    size?: number;
  } = {}, options?: any): Promise<string> {
    return notificationApiClient.downloadDocument(id, params, options);
  }

  /**
   * Log file download operation
   */
  static async fileDownloaded(id: number, params: {
    version?: number;
  } = {}, options?: any): Promise<void> {
    return notificationApiClient.fileDownloaded(id, params, options);
  }

  /**
   * Get document shared permissions
   */
  static async getDocumentShared(id: number, params: {
    page?: number;
    size?: number;
  } = {}, options?: any): Promise<PageResponse<TypeShareAccessDocumentRes>> {
    return notificationApiClient.getDocumentShared(id, params, options);
  }

  /**
   * Create or update document shared permission
   */
  static async createOrUpdateDocumentShared(
    folderId: number,
    data: TypeShareAccessDocWithTypeReq,
    options?: any
  ): Promise<TypeShareAccessDocumentRes> {
    return notificationApiClient.createOrUpdateDocumentShared(folderId, data, options);
  }

  /**
   * Delete document shared permission
   */
  static async deleteDocumentShared(folderId: number, granteeId: string, options?: any): Promise<void> {
    return notificationApiClient.deleteDocumentShared(folderId, granteeId, options);
  }

  /**
   * Update document filing category
   */
  static async updateDocumentFilingCategory(id: number, filingCategoryDto: FilingCategoryDocDto[], options?: any): Promise<DocumentResponseDto> {
    return notificationApiClient.updateDocumentFilingCategory(id, filingCategoryDto, options);
  }

  /**
   * Delete document
   */
  static async deleteDocument(id: number, options?: any): Promise<void> {
    return notificationApiClient.deleteDocument(id, options);
  }

  // ==================== TAG METHODS ====================

  /**
   * Create a new tag
   */
  static async createTag(request: CreateTagRequestDto, options?: any): Promise<TagResponseDto> {
    return notificationApiClient.createTag(request, options);
  }

  /**
   * Get tag by ID
   */
  static async getTagById(id: number, options?: any): Promise<TagResponseDto> {
    return notificationApiClient.getTagById(id, options);
  }


  /**
   * Get tag by name
   */
  static async getTagByName(name: string, options?: any): Promise<TagResponseDto> {
    return notificationApiClient.getTagByName(name, options);
  }

  /**
   * Get all tags
   */
  static async getAllTags(options?: any): Promise<TagResponseDto[]> {
    return notificationApiClient.getAllTags(options);
  }

  /**
   * Get tags by user
   */
  static async getTagsByUser(userId: string, options?: any): Promise<TagResponseDto[]> {
    return notificationApiClient.getTagsByUser(userId, options);
  }

  /**
   * Get current user's tags
   */
  static async getMyTags(options?: any): Promise<TagResponseDto[]> {
    return notificationApiClient.getMyTags(options);
  }

  /**
   * Get available tags for current user
   */
  static async getAvailableTags(options?: any): Promise<TagResponseDto[]> {
    return notificationApiClient.getAvailableTags(options);
  }

  /**
   * Get system tags
   */
  static async getSystemTags(options?: any): Promise<TagResponseDto[]> {
    return notificationApiClient.getSystemTags(options);
  }

  /**
   * Search tags by name
   */
  static async searchTags(name: string, page: number = 0, size: number = 20, options?: any): Promise<PageResponse<TagResponseDto>> {
    return notificationApiClient.searchTags(name, page, size, options);
  }

  /**
   * Update tag
   */
  static async updateTag(id: number, request: UpdateTagRequestDto, options?: any): Promise<TagResponseDto> {
    return notificationApiClient.updateTag(id, request, options);
  }

  /**
   * Delete tag
   */
  static async deleteTag(id: number, options?: any): Promise<void> {
    return notificationApiClient.deleteTag(id, options);
  }

  /**
   * Add tag to document
   */
  static async addTagToDocument(documentId: number, request: AddTagToDocumentRequestDto, options?: any): Promise<DocumentTagResponseDto> {
    return notificationApiClient.addTagToDocument(documentId, request, options);
  }

  /**
   * Remove tag from document
   */
  static async removeTagFromDocument(documentId: number, tagId: number, options?: any): Promise<void> {
    return notificationApiClient.removeTagFromDocument(documentId, tagId, options);
  }

  /**
   * Remove all tags from document
   */
  static async removeAllTagsFromDocument(documentId: number, options?: any): Promise<void> {
    return notificationApiClient.removeAllTagsFromDocument(documentId, options);
  }

  /**
   * Get tags by document ID
   */
  static async getTagsByDocumentId(documentId: number, options?: any): Promise<TagResponseDto[]> {
    return notificationApiClient.getTagsByDocumentId(documentId, options);
  }

  /**
   * Get document IDs by tag ID
   */
  static async getDocumentIdsByTagId(tagId: number, options?: any): Promise<number[]> {
    return notificationApiClient.getDocumentIdsByTagId(tagId, options);
  }

  /**
   * Get tag statistics
   */
  static async getTagStatistics(options?: any): Promise<{ totalTags: number; userTags: number }> {
    return notificationApiClient.getTagStatistics(options);
  }

  /**
   * Get tag statistics by tag ID
   */
  static async getTagStatisticsById(tagId: number, options?: any): Promise<{ tagId: number; documentCount: number }> {
    return notificationApiClient.getTagStatisticsById(tagId, options);
  }

  // ==================== LINK RULE METHODS ====================


  /**
   * Get incoming links for a document
   */
  static async getIncomingLinks(documentId: number, options?: any): Promise<DocumentLinkResponseDto[]> {
    return notificationApiClient.getIncomingLinks(documentId, options);
  }

  /**
   * Unified smart search
   */
  static async unifiedSearch(params: {
    q?: string;
    categoryId?: number;
    categoryIds?: number[];
    folders?: boolean;
    documents?: boolean;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDesc?: boolean;
  } = {}, options?: any): Promise<any> {
    return notificationApiClient.unifiedSearch(params, options);
  }



  /**
   * Get outgoing links for a document
   */
  static async getOutgoingLinks(documentId: number, options?: any): Promise<DocumentLinkResponseDto[]> {
    return notificationApiClient.getOutgoingLinks(documentId, options);
  }

  // ==================== LINK RULE METHODS ====================

  /**
   * Create a link rule
   */
  static async createLinkRule(request: LinkRuleRequestDto, options?: any): Promise<LinkRuleResponseDto> {
    return notificationApiClient.createLinkRule(request, options);
  }

  /**
   * Update a link rule
   */
  static async updateLinkRule(ruleId: number, request: LinkRuleRequestDto, options?: any): Promise<LinkRuleResponseDto> {
    return notificationApiClient.updateLinkRule(ruleId, request, options);
  }

  /**
   * Get all link rules
   */
  static async getAllLinkRules(options?: any): Promise<LinkRuleResponseDto[]> {
    return notificationApiClient.getAllLinkRules(options);
  }

  /**
   * Get all link rules with pagination and filters
   */
  static async getAllLinkRulesPaginated(params: {
    page?: number;
    size?: number;
    enabled?: boolean;
    linkType?: string;
    name?: string;
  } = {}, options?: any): Promise<PageResponse<LinkRuleResponseDto>> {
    return notificationApiClient.getAllLinkRulesPaginated(params, options);
  }

  /**
   * Toggle rule enabled/disabled
   */
  static async toggleLinkRule(ruleId: number, enabled: boolean, options?: any): Promise<void> {
    return notificationApiClient.toggleLinkRule(ruleId, enabled, options);
  }

  /**
   * Enable a link rule
   */
  static async enableLinkRule(ruleId: number, options?: any): Promise<void> {
    return notificationApiClient.enableLinkRule(ruleId, options);
  }

  /**
   * Disable a link rule
   */
  static async disableLinkRule(ruleId: number, options?: any): Promise<void> {
    return notificationApiClient.disableLinkRule(ruleId, options);
  }

  /**
   * Delete a link rule
   */
  static async deleteLinkRule(ruleId: number, options?: any): Promise<void> {
    return notificationApiClient.deleteLinkRule(ruleId, options);
  }

  /**
   * Apply a specific rule to all documents (async)
   */
  static async applyLinkRule(ruleId: number, options?: any): Promise<{ message: string; status: string; ruleId: number }> {
    return notificationApiClient.applyLinkRule(ruleId, options);
  }

  /**
   * Apply all enabled rules to a specific document (async)
   */
  static async applyRulesToDocument(documentId: number, options?: any): Promise<{ message: string; status: string; documentId: number }> {
    return notificationApiClient.applyRulesToDocument(documentId, options);
  }

  /**
   * Reapply all enabled rules (async)
   */
  static async reapplyAllLinkRules(options?: any): Promise<{ message: string; status: string }> {
    return notificationApiClient.reapplyAllLinkRules(options);
  }

  /**
   * Get link rules by metadata
   */
  static async getLinkRulesByMetadata(metadataId: number, options?: any): Promise<LinkRuleResponseDto[]> {
    return notificationApiClient.getLinkRulesByMetadata(metadataId, options);
  }

  // ==================== RULE EXECUTION METHODS ====================

  /**
   * Execute a specific link rule
   */
  static async executeRule(request: RuleExecutionRequest, options?: any): Promise<RuleExecutionResponse> {
    return notificationApiClient.executeRule(request, options);
  }

  /**
   * Execute multiple link rules in bulk
   */
  static async executeBulkRules(request: BulkRuleExecutionRequest, options?: any): Promise<BulkRuleExecutionResponse> {
    return notificationApiClient.executeBulkRules(request, options);
  }

  /**
   * Revalidate all link rules
   */
  static async revalidateAllRules(options?: any): Promise<{ message: string; rulesProcessed: number }> {
    return notificationApiClient.revalidateAllRules(options);
  }

  /**
   * Revalidate a specific link rule
   */
  static async revalidateRule(ruleId: number, options?: any): Promise<RuleExecutionResponse> {
    return notificationApiClient.revalidateRule(ruleId, options);
  }

  /**
   * Get rule execution statistics
   */
  static async getRuleStatistics(ruleId: number, options?: any): Promise<RuleStatistics> {
    return notificationApiClient.getRuleStatistics(ruleId, options);
  }

  /**
   * Get all rule statistics
   */
  static async getAllRuleStatistics(options?: any): Promise<RuleStatistics[]> {
    return notificationApiClient.getAllRuleStatistics(options);
  }

  /**
   * Get link rule cache statistics
   */
  static async getLinkRuleCacheStatistics(options?: any): Promise<LinkRuleCacheStatistics> {
    return notificationApiClient.getLinkRuleCacheStatistics(options);
  }

  /**
   * Clear cache for a specific document
   */
  static async clearDocumentCache(documentId: number, options?: any): Promise<void> {
    return notificationApiClient.clearDocumentCache(documentId, options);
  }

  /**
   * Clear cache for a specific rule
   */
  static async clearRuleCache(ruleId: number, options?: any): Promise<void> {
    return notificationApiClient.clearRuleCache(ruleId, options);
  }

  /**
   * Clear all link rule cache
   */
  static async clearAllRuleCache(options?: any): Promise<void> {
    return notificationApiClient.clearAllRuleCache(options);
  }

  // ==================== NEW DOCUMENT LINK METHODS ====================

  /**
   * Create a document link
   */
  static async createDocumentLink(request: DocumentLinkRequestDto, options?: any): Promise<DocumentLinkResponseDto> {
    return notificationApiClient.createDocumentLink(request, options);
  }

  /**
   * Delete a document link
   */
  static async deleteDocumentLink(linkId: number, options?: any): Promise<void> {
    return notificationApiClient.deleteDocumentLink(linkId, options);
  }

  /**
   * Get related documents for a document with search and filters
   */
  static async getRelatedDocuments(documentId: number, params: {
    search?: string;
    linkType?: string;
    isManual?: boolean;
    fromDate?: string;
    toDate?: string;
    mimeType?: string;
    page?: number;
    size?: number;
  } = {}, options?: any): Promise<PageResponse<RelatedDocumentResponseDto>> {
    return notificationApiClient.getRelatedDocuments(documentId, params, options);
  }
}

export default DocumentService;
