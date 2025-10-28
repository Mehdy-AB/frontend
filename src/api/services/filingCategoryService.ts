import { apiClient } from '../client';
import {
  FilingCategoryRequestDto,
  FilingCategoryResponseDto,
  PageResponse,
  MetaDataListReq,
  MetaDataListRes,
  MetadataFieldDto,
  MetadataType,
} from '../../types/api';

export class FilingCategoryService {
  private baseUrl = '/api/v1/filing-categories';

  // Get all filing categories with pagination
  async getFilingCategories(
    page: number = 0,
    size: number = 20,
    name?: string,
    sortBy: string = 'name',
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<FilingCategoryResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });

    if (name) {
      params.append('name', name);
    }

    return apiClient.get<PageResponse<FilingCategoryResponseDto>>(`${this.baseUrl}?${params}`);
  }

  // Get filing category by ID
  async getFilingCategoryById(categoryId: number): Promise<FilingCategoryResponseDto> {
    return apiClient.get<FilingCategoryResponseDto>(`${this.baseUrl}/${categoryId}`);
  }

  // Create new filing category
  async createFilingCategory(categoryData: FilingCategoryRequestDto): Promise<FilingCategoryResponseDto> {
    return apiClient.post<FilingCategoryResponseDto>(this.baseUrl, categoryData);
  }

  // Update filing category
  async updateFilingCategory(categoryId: number, categoryData: FilingCategoryRequestDto): Promise<FilingCategoryResponseDto> {
    return apiClient.put<FilingCategoryResponseDto>(`${this.baseUrl}/${categoryId}`, categoryData);
  }

  // Delete filing category
  async deleteFilingCategory(categoryId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${categoryId}`);
  }

  // Search filing categories
  async searchFilingCategories(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<FilingCategoryResponseDto>> {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<FilingCategoryResponseDto>>(`${this.baseUrl}/search?${params}`);
  }

  // Get filing category statistics
  async getFilingCategoryStatistics(): Promise<{
    totalCategories: number;
    categoriesByMetadataCount: Record<string, number>;
    mostUsedCategories: Array<{ category: FilingCategoryResponseDto; count: number }>;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  // Bulk operations
  async bulkDeleteFilingCategories(categoryIds: number[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/bulk`, {
      data: { categoryIds },
    });
  }

  // ==================== METADATA LIST OPERATIONS ====================

  // Get all metadata lists with pagination
  async getMetadataLists(
    page: number = 0,
    size: number = 20,
    name?: string,
    sortBy: string = 'name',
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<MetaDataListRes>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });

    if (name) {
      params.append('name', name);
    }

    return apiClient.get<PageResponse<MetaDataListRes>>(`${this.baseUrl}/list?${params}`);
  }

  // Get metadata list by ID
  async getMetadataListById(listId: number): Promise<MetaDataListRes> {
    return apiClient.get<MetaDataListRes>(`${this.baseUrl}/list/${listId}`);
  }

  // Create new metadata list
  async createMetadataList(listData: MetaDataListReq): Promise<MetaDataListRes> {
    return apiClient.post<MetaDataListRes>(`${this.baseUrl}/list`, listData);
  }

  // Update metadata list
  async updateMetadataList(listId: number, listData: MetaDataListReq): Promise<MetaDataListRes> {
    return apiClient.put<MetaDataListRes>(`${this.baseUrl}/list/${listId}`, listData);
  }

  // Delete metadata list
  async deleteMetadataList(listId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/list/${listId}`);
  }

  // Search metadata lists
  async searchMetadataLists(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<MetaDataListRes>> {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<MetaDataListRes>>(`${this.baseUrl}/list/search?${params}`);
  }

  // Get metadata fields for list
  async getMetadataFieldsForList(listId: number): Promise<MetadataFieldDto[]> {
    return apiClient.get<MetadataFieldDto[]>(`${this.baseUrl}/list/${listId}/fields`);
  }

  // Add metadata field to list
  async addMetadataFieldToList(listId: number, fieldData: MetadataFieldDto): Promise<MetadataFieldDto> {
    return apiClient.post<MetadataFieldDto>(`${this.baseUrl}/list/${listId}/fields`, fieldData);
  }

  // Update metadata field
  async updateMetadataField(listId: number, fieldId: number, fieldData: MetadataFieldDto): Promise<MetadataFieldDto> {
    return apiClient.put<MetadataFieldDto>(`${this.baseUrl}/list/${listId}/fields/${fieldId}`, fieldData);
  }

  // Delete metadata field
  async deleteMetadataField(listId: number, fieldId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/list/${listId}/fields/${fieldId}`);
  }

  // Get metadata field types
  async getMetadataFieldTypes(): Promise<MetadataType[]> {
    return apiClient.get<MetadataType[]>(`${this.baseUrl}/metadata-field-types`);
  }

  // Get metadata list statistics
  async getMetadataListStatistics(): Promise<{
    totalLists: number;
    listsByFieldCount: Record<string, number>;
    mostUsedFields: Array<{ field: MetadataFieldDto; count: number }>;
  }> {
    return apiClient.get(`${this.baseUrl}/list/statistics`);
  }

  // Bulk operations for metadata lists
  async bulkDeleteMetadataLists(listIds: number[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/list/bulk`, {
      data: { listIds },
    });
  }

  // Clone metadata list
  async cloneMetadataList(listId: number, newListName: string): Promise<MetaDataListRes> {
    return apiClient.post<MetaDataListRes>(`${this.baseUrl}/list/${listId}/clone`, {
      name: newListName,
    });
  }
}

export const filingCategoryService = new FilingCategoryService();