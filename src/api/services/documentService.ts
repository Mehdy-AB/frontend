import { apiClient } from '../client';
import {
  DocumentResponseDto,
  DocumentVersionResponseDto,
  DocumentUploadRequestDto,
  DocumentVersionUploadRequestDto,
  EditDocumentTitleRequestDto,
  UpdateDocumentDescriptionRequestDto,
  UpdateDocumentMetadataRequestDto,
  DocumentPermissionReq,
  DocumentPermissionResDto,
  PageResponse,
  SortFields,
  GranteeType,
  TypeShareAccessWithTypeReq,
  TypeShareAccessRes,
  FilingCategoryDocDto,
} from '../../types/api';

export class DocumentService {
  private baseUrl = '/api/v1/documents';

  // Get all documents with pagination
  async getDocuments(
    page: number = 0,
    size: number = 20,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<DocumentResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy || SortFields.NAME,
      sortDirection,
    });

    return apiClient.get<PageResponse<DocumentResponseDto>>(`${this.baseUrl}?${params}`);
  }

  // Get document by ID
  async getDocumentById(documentId: number): Promise<DocumentResponseDto> {
    return apiClient.get<DocumentResponseDto>(`${this.baseUrl}/${documentId}`);
  }

  // Upload new document (single file only)
  async uploadDocument(
    file: File,
    folderId: number,
    title: string,
    lang: string,
    fileName?: string,
    tagsJson?: string,
    filingCategory?: FilingCategoryDocDto
  ): Promise<DocumentResponseDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId.toString());
    formData.append('title', title);
    formData.append('lang', lang);
    
    if (fileName) {
      formData.append('fileName', fileName);
    }
    
    if (tagsJson) {
      formData.append('tags', tagsJson);
    }
    
    if (filingCategory) {
      formData.append('filingCategory', JSON.stringify(filingCategory));
    }

    return apiClient.uploadFile<DocumentResponseDto>(`${this.baseUrl}/upload`, formData);
  }

  // Upload new version
  async uploadNewVersion(
    file: File,
    documentId: number,
    lang: string,
    filingCategory?: FilingCategoryDocDto
  ): Promise<DocumentResponseDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', documentId.toString());
    formData.append('lang', lang.toUpperCase());
    
    if (filingCategory) {
      formData.append('filingCategory', JSON.stringify(filingCategory));
    }

    return apiClient.uploadFile<DocumentResponseDto>(`${this.baseUrl}/version`, formData);
  }

  // Rename document
  async renameDocument(documentId: number, newName: string): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/rename/${documentId}?name=${encodeURIComponent(newName)}`);
  }

  // Edit document title
  async editDocumentTitle(documentId: number, titleData: EditDocumentTitleRequestDto): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/title/${documentId}`, titleData);
  }

  // Update document description
  async updateDocumentDescription(documentId: number, descriptionData: UpdateDocumentDescriptionRequestDto): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/${documentId}/description`, descriptionData);
  }

  // Update document metadata
  async updateDocumentMetadata(documentId: number, metadataData: UpdateDocumentMetadataRequestDto): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/${documentId}/metadata`, metadataData);
  }

  // Delete document
  async deleteDocument(documentId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${documentId}`);
  }

  // Move document
  async moveDocument(documentId: number, targetFolderId: number): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/move/${documentId}/${targetFolderId}`);
  }

  // Download document (returns download URL)
  async getDownloadUrl(documentId: number, versionId?: number): Promise<string> {
    const params = versionId ? `?version=${versionId}` : '';
    return apiClient.get<string>(`${this.baseUrl}/download/${documentId}${params}`);
  }

  // Mark file as downloaded
  async markFileAsDownloaded(documentId: number, versionId?: number): Promise<void> {
    const params = versionId ? `?version=${versionId}` : '';
    return apiClient.post<void>(`${this.baseUrl}/fileDownloaded/${documentId}${params}`);
  }

  // Get document permissions
  async getDocumentPermissions(documentId: number): Promise<DocumentPermissionResDto> {
    return apiClient.get<DocumentPermissionResDto>(`${this.baseUrl}/${documentId}/permissions`);
  }

  // Get document sharing list (permissions) - matches folder pattern
  async getDocumentSharingList(
    documentId: number,
    page: number = 0,
    size: number = 20,
    search?: string
  ): Promise<PageResponse<TypeShareAccessRes>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    // Add search parameter if provided
    if (search) {
      params.append('search', search);
    }

    return apiClient.get<PageResponse<TypeShareAccessRes>>(`${this.baseUrl}/${documentId}/share?${params}`);
  }

  // Create new document permission (POST) - matches folder pattern
  async createDocumentPermission(
    documentId: number,
    shareData: TypeShareAccessWithTypeReq
  ): Promise<TypeShareAccessRes> {
    return apiClient.post<TypeShareAccessRes>(`${this.baseUrl}/${documentId}/share`, shareData);
  }

  // Update existing document permission (PUT) - matches folder pattern
  async updateDocumentPermission(
    documentId: number,
    shareData: TypeShareAccessWithTypeReq
  ): Promise<TypeShareAccessRes> {
    return apiClient.put<TypeShareAccessRes>(`${this.baseUrl}/${documentId}/share`, shareData);
  }

  // Legacy method - uses POST for creating permission
  async shareDocumentWithType(
    documentId: number,
    shareData: TypeShareAccessWithTypeReq
  ): Promise<TypeShareAccessRes> {
    return this.createDocumentPermission(documentId, shareData);
  }

  // Revoke document access - matches folder pattern
  async revokeDocumentAccess(documentId: number, granteeId: string): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${documentId}/share/${granteeId}`);
  }

  // Get documents by folder
  async getDocumentsByFolder(
    folderId: number,
    page: number = 0,
    size: number = 20,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<DocumentResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy || SortFields.NAME,
      sortDirection,
    });

    return apiClient.get<PageResponse<DocumentResponseDto>>(`${this.baseUrl}/folder/${folderId}?${params}`);
  }

  // Get documents by owner
  async getDocumentsByOwner(
    ownerId: string,
    page: number = 0,
    size: number = 20,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<DocumentResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy || SortFields.NAME,
      sortDirection,
    });

    return apiClient.get<PageResponse<DocumentResponseDto>>(`${this.baseUrl}/owner/${ownerId}?${params}`);
  }

  // Search documents
  async searchDocuments(
    query: string,
    page: number = 0,
    size: number = 20,
    sortBy?: SortFields,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<DocumentResponseDto>> {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy || SortFields.NAME,
      sortDirection,
    });

    return apiClient.get<PageResponse<DocumentResponseDto>>(`${this.baseUrl}/search?${params}`);
  }

  // Get document statistics
  async getDocumentStatistics(): Promise<{
    totalDocuments: number;
    documentsByOwner: Record<string, number>;
    documentsByFolder: Record<string, number>;
    documentsByType: Record<string, number>;
    totalSize: number;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  // Bulk operations
  async bulkDeleteDocuments(documentIds: number[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/bulk`, {
      data: { documentIds },
    });
  }

  async bulkMoveDocuments(documentIds: number[], targetFolderId: number): Promise<void> {
    return apiClient.patch<void>(`${this.baseUrl}/bulk/move`, {
      documentIds,
      targetFolderId,
    });
  }

  // Get document versions
  async getDocumentVersions(documentId: number): Promise<DocumentVersionResponseDto[]> {
    return apiClient.get<DocumentVersionResponseDto[]>(`${this.baseUrl}/${documentId}/versions`);
  }

  // Set active version
  async setActiveVersion(documentId: number, versionId: number): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/${documentId}/activeVersion/${versionId}`);
  }

  // Get related documents (linked documents)
  async getRelatedDocuments(
    documentId: number,
    options?: {
      page?: number;
      size?: number;
      search?: string;
      linkType?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<PageResponse<any>> {
    const params = new URLSearchParams({
      page: (options?.page || 0).toString(),
      size: (options?.size || 20).toString(),
    });

    if (options?.search) {
      params.append('search', options.search);
    }
    if (options?.linkType) {
      params.append('linkType', options.linkType);
    }
    if (options?.fromDate) {
      params.append('fromDate', options.fromDate);
    }
    if (options?.toDate) {
      params.append('toDate', options.toDate);
    }

    return apiClient.get<PageResponse<any>>(`/api/v1/document-links/document/${documentId}/related?${params}`);
  }
  
  // Get tags by document ID  
  async getTagsByDocumentId(documentId: number): Promise<any[]> {
    return apiClient.get<any[]>(`/api/v1/tags/documents/${documentId}/tags`);
  }
  
  // Get all available tags
  async getAvailableTags(): Promise<any[]> {
    return apiClient.get<any[]>(`/api/v1/tags/my-tags`);
  }

  // Delete document link
  async deleteDocumentLink(linkId: number): Promise<void> {
    return apiClient.delete<void>(`/api/v1/document-links/${linkId}`);
  }
  
  // Download document (alias for getDownloadUrl)
  async downloadDocument(documentId: number, versionId?: number): Promise<string> {
    return this.getDownloadUrl(documentId, versionId);
  }
  
  // File downloaded (alias for markFileAsDownloaded)
  async fileDownloaded(documentId: number, versionId?: number): Promise<void> {
    return this.markFileAsDownloaded(documentId, versionId);
  }

  // Aliases for permission management modal (to match folder pattern)
  async getDocumentShared(documentId: number, params?: { page?: number; size?: number; search?: string }): Promise<PageResponse<any>> {
    return this.getDocumentSharingList(
      documentId,
      params?.page || 0,
      params?.size || 20,
      params?.search
    );
  }

  async createOrUpdateDocumentShared(documentId: number, data: any): Promise<any> {
    return this.shareDocumentWithType(documentId, data);
  }

  async updateDocumentShared(documentId: number, data: any): Promise<any> {
    return this.updateDocumentPermission(documentId, data);
  }

  async deleteDocumentShared(documentId: number, granteeId: string): Promise<void> {
    return this.revokeDocumentAccess(documentId, granteeId);
  }

  // Get available users/roles/groups for document sharing
  async getAvailableUsersForDocument(documentId: number, params?: { page?: number; size?: number; search?: string }): Promise<PageResponse<any>> {
    const urlParams = new URLSearchParams({
      page: (params?.page || 0).toString(),
      size: (params?.size || 20).toString(),
    });
    if (params?.search) {
      urlParams.append('search', params.search);
    }
    return apiClient.get<PageResponse<any>>(`${this.baseUrl}/${documentId}/share/available-users?${urlParams}`);
  }

  // Get shared documents for the current user
  async getSharedDocuments(params?: { page?: number; size?: number; search?: string; sortBy?: string; sortDir?: string }): Promise<PageResponse<DocumentResponseDto>> {
    // The backend endpoint uses limit/offset, so we need to calculate it
    const page = params?.page || 0;
    const size = params?.size || 20;
    const limit = size;
    const offset = page * size;
    
    const urlParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    // Note: The backend endpoint doesn't support search/sort yet, but we can add client-side filtering
    const documents = await apiClient.get<DocumentResponseDto[]>(`${this.baseUrl}/shared?${urlParams}`);
    
    // Return proper PageResponse structure
    const totalElements = documents?.length || 0;
    const totalPages = Math.ceil(totalElements / size);
    
    const sortInfo = {
      empty: !params?.sortBy,
      sorted: !!params?.sortBy,
      unsorted: !params?.sortBy,
    };
    
    return {
      content: documents || [],
      totalPages,
      totalElements,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: sortInfo,
        offset: offset,
        paged: true,
        unpaged: false,
      },
      last: page >= totalPages - 1,
      size: size,
      number: page,
      first: page === 0,
      numberOfElements: documents?.length || 0,
      empty: !documents || documents.length === 0,
      sort: sortInfo,
    };
  }

  async getAvailableRolesForDocument(documentId: number, params?: { page?: number; size?: number; search?: string }): Promise<PageResponse<any>> {
    const urlParams = new URLSearchParams({
      page: (params?.page || 0).toString(),
      size: (params?.size || 20).toString(),
    });
    if (params?.search) {
      urlParams.append('search', params.search);
    }
    return apiClient.get<PageResponse<any>>(`${this.baseUrl}/${documentId}/share/available-roles?${urlParams}`);
  }

  async getAvailableGroupsForDocument(documentId: number, params?: { page?: number; size?: number; search?: string }): Promise<PageResponse<any>> {
    const urlParams = new URLSearchParams({
      page: (params?.page || 0).toString(),
      size: (params?.size || 20).toString(),
    });
    if (params?.search) {
      urlParams.append('search', params.search);
    }
    return apiClient.get<PageResponse<any>>(`${this.baseUrl}/${documentId}/share/available-groups?${urlParams}`);
  }
}

export const documentService = new DocumentService();