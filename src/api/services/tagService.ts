import { apiClient } from '../client';
import {
  TagResponseDto,
  CreateTagRequestDto,
  UpdateTagRequestDto,
  PageResponse,
  DocumentTagResponseDto,
  AddTagToDocumentRequestDto,
} from '../../types/api';

export class TagService {
  private baseUrl = '/api/v1/tags';

  // Get all tags with pagination
  async getTags(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'name',
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<TagResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });

    return apiClient.get<PageResponse<TagResponseDto>>(`${this.baseUrl}?${params}`);
  }

  // Get tag by ID
  async getTagById(tagId: number): Promise<TagResponseDto> {
    return apiClient.get<TagResponseDto>(`${this.baseUrl}/${tagId}`);
  }

  // Get all tags (no pagination)
  async getAllTags(): Promise<TagResponseDto[]> {
    return apiClient.get<TagResponseDto[]>(`${this.baseUrl}`);
  }

  // Get system tags
  async getSystemTags(): Promise<TagResponseDto[]> {
    return apiClient.get<TagResponseDto[]>(`${this.baseUrl}/system`);
  }

  // Get current user's tags
  async getMyTags(): Promise<TagResponseDto[]> {
    return apiClient.get<TagResponseDto[]>(`${this.baseUrl}/my-tags`);
  }

  // Create new tag
  async createTag(tagData: CreateTagRequestDto): Promise<TagResponseDto> {
    return apiClient.post<TagResponseDto>(this.baseUrl, tagData);
  }

  // Update tag
  async updateTag(tagId: number, tagData: UpdateTagRequestDto): Promise<TagResponseDto> {
    return apiClient.put<TagResponseDto>(`${this.baseUrl}/${tagId}`, tagData);
  }

  // Delete tag
  async deleteTag(tagId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${tagId}`);
  }

  // Search tags
  async searchTags(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<TagResponseDto>> {
    const params = new URLSearchParams({
      q: query, // Backend expects 'q' parameter
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<TagResponseDto>>(`${this.baseUrl}/search?${params}`);
  }

  // Simple search (no pagination) matching backend /search returning List
  async searchTagsSimple(query: string): Promise<TagResponseDto[]> {
    const params = new URLSearchParams({ q: query });
    return apiClient.get<TagResponseDto[]>(`${this.baseUrl}/search?${params}`);
  }

  // Paged fetch with filters/sort
  async getTagsPaged(
    page: number = 0,
    size: number = 20,
    sortBy: 'name' | 'createdAt' | 'updatedAt' = 'name',
    sortDirection: 'asc' | 'desc' = 'asc',
    filters?: { type?: 'SYSTEM' | 'USER'; q?: string }
  ): Promise<PageResponse<TagResponseDto>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortBy,
      sortDirection,
    });
    if (filters?.type) params.set('type', filters.type);
    if (filters?.q) params.set('q', filters.q);
    return apiClient.get<PageResponse<TagResponseDto>>(`${this.baseUrl}/page?${params.toString()}`);
  }

  // Get tags by creator
  async getTagsByCreator(
    creatorId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<TagResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<TagResponseDto>>(`${this.baseUrl}/creator/${creatorId}?${params}`);
  }

  // Get available tags for user
  async getAvailableTagsForUser(
    userId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<TagResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<TagResponseDto>>(`${this.baseUrl}/available/${userId}?${params}`);
  }

  // Get tag statistics
  async getTagStatistics(): Promise<{
    totalTags: number;
    tagsByCreator: Record<string, number>;
    mostUsedTags: Array<{ tag: TagResponseDto; count: number }>;
    tagsByColor: Record<string, number>;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  // Bulk operations
  async bulkDeleteTags(tagIds: number[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/bulk`, {
      data: { tagIds },
    });
  }

  // ==================== DOCUMENT TAG OPERATIONS ====================

  // Add tag to document
  async addTagToDocument(documentId: number, tagData: AddTagToDocumentRequestDto): Promise<DocumentTagResponseDto> {
    return apiClient.post<DocumentTagResponseDto>(`${this.baseUrl}/documents/${documentId}/tags`, tagData);
  }

  // Remove tag from document
  async removeTagFromDocument(documentId: number, tagId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/documents/${documentId}/tags/${tagId}`);
  }

  // Get document tags
  async getDocumentTags(documentId: number): Promise<TagResponseDto[]> {
    return apiClient.get<TagResponseDto[]>(`${this.baseUrl}/documents/${documentId}/tags`);
  }
  
  // Get all available tags (no pagination)
  async getAvailableTags(): Promise<TagResponseDto[]> {
    return apiClient.get<TagResponseDto[]>(`${this.baseUrl}/my-tags`);
  }
  
  // Get tags by document ID (alias for getDocumentTags)
  async getTagsByDocumentId(documentId: number): Promise<TagResponseDto[]> {
    return this.getDocumentTags(documentId);
  }

  // Get documents by tag
  async getDocumentsByTag(
    tagId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<any>> { // DocumentResponseDto would be more appropriate
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<any>>(`${this.baseUrl}/${tagId}/documents?${params}`);
  }

  // Bulk add tags to document
  async bulkAddTagsToDocument(documentId: number, tagIds: number[]): Promise<DocumentTagResponseDto[]> {
    return apiClient.post<DocumentTagResponseDto[]>(`${this.baseUrl}/documents/${documentId}/bulk`, {
      tagIds,
    });
  }

  // Bulk remove tags from document
  async bulkRemoveTagsFromDocument(documentId: number, tagIds: number[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/documents/${documentId}/bulk`, {
      data: { tagIds },
    });
  }

  // Get tag usage statistics
  async getTagUsageStatistics(tagId: number): Promise<{
    tag: TagResponseDto;
    documentCount: number;
    usageByMonth: Record<string, number>;
    mostTaggedDocuments: Array<{ document: any; taggedAt: string }>;
  }> {
    return apiClient.get(`${this.baseUrl}/${tagId}/usage`);
  }
}

export const tagService = new TagService();

