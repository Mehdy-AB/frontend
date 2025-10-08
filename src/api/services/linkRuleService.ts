import { notificationApiClient } from '../notificationClient';
import {
  ManualLinkRequest,
  ManualLinkResponse,
  RelatedDocumentResponse,
  LinkRuleCacheStatistics
} from '../../types/api';

export class LinkRuleService {
  /**
   * Create a manual link between two documents
   */
  static async createManualLink(
    data: ManualLinkRequest,
    options?: any
  ): Promise<ManualLinkResponse> {
    return notificationApiClient.createManualLink(data, options);
  }

  /**
   * Get all manual links for a document
   */
  static async getDocumentManualLinks(
    documentId: number,
    options?: any
  ): Promise<ManualLinkResponse[]> {
    return notificationApiClient.getDocumentManualLinks(documentId, options);
  }

  /**
   * Get outgoing manual links for a document
   */
  static async getOutgoingManualLinks(
    documentId: number,
    options?: any
  ): Promise<ManualLinkResponse[]> {
    return notificationApiClient.getOutgoingManualLinks(documentId, options);
  }

  /**
   * Get incoming manual links for a document
   */
  static async getIncomingManualLinks(
    documentId: number,
    options?: any
  ): Promise<ManualLinkResponse[]> {
    return notificationApiClient.getIncomingManualLinks(documentId, options);
  }

  /**
   * Update a manual link
   */
  static async updateManualLink(
    linkId: number,
    data: ManualLinkRequest,
    options?: any
  ): Promise<ManualLinkResponse> {
    return notificationApiClient.updateManualLink(linkId, data, options);
  }

  /**
   * Delete a manual link
   */
  static async deleteManualLink(
    linkId: number,
    options?: any
  ): Promise<void> {
    return notificationApiClient.deleteManualLink(linkId, options);
  }

  /**
   * Get all related documents (manual + automatic) for a document
   */
  static async getRelatedDocuments(
    documentId: number,
    options?: any
  ): Promise<RelatedDocumentResponse[]> {
    return notificationApiClient.getRelatedDocuments(documentId, options);
  }

  /**
   * Trigger manual revalidation of all rules (admin only)
   */
  static async triggerRevalidation(options?: any): Promise<void> {
    return notificationApiClient.triggerLinkRuleRevalidation(options);
  }

  /**
   * Revalidate a specific rule (admin only)
   */
  static async revalidateRule(
    ruleId: number,
    options?: any
  ): Promise<void> {
    return notificationApiClient.revalidateLinkRule(ruleId, options);
  }

  /**
   * Get cache statistics (admin only)
   */
  static async getCacheStatistics(options?: any): Promise<LinkRuleCacheStatistics> {
    return notificationApiClient.getLinkRuleCacheStatistics(options);
  }

  /**
   * Clear cache for a specific document (admin only)
   */
  static async clearDocumentCache(
    documentId: number,
    options?: any
  ): Promise<void> {
    return notificationApiClient.clearDocumentLinkCache(documentId, options);
  }

  /**
   * Clear cache for a specific rule (admin only)
   */
  static async clearRuleCache(
    ruleId: number,
    options?: any
  ): Promise<void> {
    return notificationApiClient.clearRuleLinkCache(ruleId, options);
  }
}

// Create and export a singleton instance
export const linkRuleService = new LinkRuleService();
export default linkRuleService;
