import { apiClient } from '../client';
import {
  ClassAUploadRequestDto,
  ClassAResponseDto,
  ClassADetailResponseDto,
  ClassASearchRequestDto,
  ClassAStatisticsResponseDto,
  PageResponse,
} from '../../types/api';

export class ClassAService {
  private baseUrl = '/api/v1/class-a';

  // Get all Class A documents with pagination
  async getClassADocuments(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<PageResponse<ClassAResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });

    return apiClient.get<PageResponse<ClassAResponseDto>>(`${this.baseUrl}?${params}`);
  }

  // Get Class A document by ID
  async getClassADocumentById(documentId: number): Promise<ClassADetailResponseDto> {
    return apiClient.get<ClassADetailResponseDto>(`${this.baseUrl}/${documentId}`);
  }

  // Upload Class A document
  async uploadClassADocument(documentData: ClassAUploadRequestDto): Promise<ClassAResponseDto> {
    return apiClient.post<ClassAResponseDto>(`${this.baseUrl}/upload`, documentData);
  }

  // Update Class A document
  async updateClassADocument(documentId: number, documentData: Partial<ClassAUploadRequestDto>): Promise<ClassAResponseDto> {
    return apiClient.put<ClassAResponseDto>(`${this.baseUrl}/${documentId}`, documentData);
  }

  // Delete Class A document
  async deleteClassADocument(documentId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${documentId}`);
  }

  // Search Class A documents
  async searchClassADocuments(searchData: ClassASearchRequestDto): Promise<PageResponse<ClassAResponseDto>> {
    return apiClient.post<PageResponse<ClassAResponseDto>>(`${this.baseUrl}/search`, searchData);
  }

  // Get Class A documents by category
  async getClassADocumentsByCategory(
    categoryId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ClassAResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<ClassAResponseDto>>(`${this.baseUrl}/category/${categoryId}?${params}`);
  }

  // Get Class A documents by user
  async getClassADocumentsByUser(
    userId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ClassAResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<ClassAResponseDto>>(`${this.baseUrl}/user/${userId}?${params}`);
  }

  // Get Class A documents by date range
  async getClassADocumentsByDateRange(
    startDate: string,
    endDate: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ClassAResponseDto>> {
    const params = new URLSearchParams({
      startDate,
      endDate,
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<ClassAResponseDto>>(`${this.baseUrl}/date-range?${params}`);
  }

  // Get Class A document statistics
  async getClassAStatistics(): Promise<ClassAStatisticsResponseDto> {
    return apiClient.get<ClassAStatisticsResponseDto>(`${this.baseUrl}/statistics`);
  }

  // Get Class A document by exact date
  async getClassADocumentsByExactDate(
    exactDate: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ClassAResponseDto>> {
    const params = new URLSearchParams({
      exactDate,
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<ClassAResponseDto>>(`${this.baseUrl}/exact-date?${params}`);
  }

  // Download Class A document
  async downloadClassADocument(documentId: number): Promise<Blob> {
    return apiClient.downloadFile(`${this.baseUrl}/${documentId}/download`);
  }

  // Get Class A document metadata
  async getClassADocumentMetadata(documentId: number): Promise<any> {
    return apiClient.get(`${this.baseUrl}/${documentId}/metadata`);
  }

  // Update Class A document metadata
  async updateClassADocumentMetadata(documentId: number, metadata: any): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/${documentId}/metadata`, metadata);
  }

  // Get Class A document filing category
  async getClassADocumentFilingCategory(documentId: number): Promise<any> {
    return apiClient.get(`${this.baseUrl}/${documentId}/filing-category`);
  }

  // Update Class A document filing category
  async updateClassADocumentFilingCategory(documentId: number, filingCategory: any): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/${documentId}/filing-category`, filingCategory);
  }

  // Bulk operations
  async bulkDeleteClassADocuments(documentIds: number[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/bulk`, {
      data: { documentIds },
    });
  }

  async bulkUpdateClassADocuments(documentIds: number[], updateData: Partial<ClassAUploadRequestDto>): Promise<void> {
    return apiClient.patch<void>(`${this.baseUrl}/bulk`, {
      documentIds,
      updateData,
    });
  }

  // Export Class A documents
  async exportClassADocuments(
    categoryId?: number,
    userId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (categoryId) params.append('categoryId', categoryId.toString());
    if (userId) params.append('userId', userId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/export?${queryString}` : `${this.baseUrl}/export`;

    return apiClient.downloadFile(url);
  }

  // Get Class A document trends
  async getClassADocumentTrends(
    period: 'day' | 'week' | 'month' | 'year' = 'month',
    limit: number = 12
  ): Promise<Array<{
    period: string;
    count: number;
    categories: Record<string, number>;
  }>> {
    return apiClient.get(`${this.baseUrl}/trends`, {
      params: { period, limit },
    });
  }

  // Get Class A document summary
  async getClassADocumentSummary(): Promise<{
    totalDocuments: number;
    documentsThisMonth: number;
    documentsThisWeek: number;
    documentsToday: number;
    topCategories: Array<{ categoryId: number; categoryName: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    return apiClient.get(`${this.baseUrl}/summary`);
  }
}

export const classAService = new ClassAService();

