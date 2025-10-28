import { apiClient } from '../client';
import {
  DocumentResponseDto,
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
  TypeShareAccessDocWithTypeReq,
  TypeShareAccessDocumentRes,
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

  // Upload new document
  async uploadDocument(documentData: DocumentUploadRequestDto): Promise<DocumentResponseDto> {
    const formData = new FormData();
    formData.append('file', documentData.file);
    formData.append('folderId', documentData.folderId.toString());
    formData.append('createdBy', documentData.createdBy);
    formData.append('lang', documentData.lang);
    formData.append('title', documentData.title);

    return apiClient.uploadFile<DocumentResponseDto>(`${this.baseUrl}/upload`, formData);
  }

  // Upload new version
  async uploadNewVersion(versionData: DocumentVersionUploadRequestDto): Promise<DocumentResponseDto> {
    const formData = new FormData();
    formData.append('file', versionData.file);
    formData.append('documentId', versionData.documentId.toString());
    formData.append('lang', versionData.lang);
    formData.append('createdBy', versionData.createdBy);
    
    if (versionData.filingCategory) {
      formData.append('filingCategory', JSON.stringify(versionData.filingCategory));
    }

    return apiClient.uploadFile<DocumentResponseDto>(`${this.baseUrl}/upload-version`, formData);
  }

  // Edit document title
  async editDocumentTitle(documentId: number, titleData: EditDocumentTitleRequestDto): Promise<DocumentResponseDto> {
    return apiClient.put<DocumentResponseDto>(`${this.baseUrl}/${documentId}/title`, titleData);
  }

  // Update document description
  async updateDocumentDescription(documentId: number, descriptionData: UpdateDocumentDescriptionRequestDto): Promise<DocumentResponseDto> {
    return apiClient.put<DocumentResponseDto>(`${this.baseUrl}/${documentId}/description`, descriptionData);
  }

  // Update document metadata
  async updateDocumentMetadata(documentId: number, metadataData: UpdateDocumentMetadataRequestDto): Promise<DocumentResponseDto> {
    return apiClient.put<DocumentResponseDto>(`${this.baseUrl}/${documentId}/metadata`, metadataData);
  }

  // Delete document
  async deleteDocument(documentId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${documentId}`);
  }

  // Download document
  async downloadDocument(documentId: number, versionId?: number): Promise<Blob> {
    const url = versionId 
      ? `${this.baseUrl}/${documentId}/versions/${versionId}/download`
      : `${this.baseUrl}/${documentId}/download`;
    
    return apiClient.downloadFile(url);
  }

  // Get document permissions
  async getDocumentPermissions(documentId: number): Promise<DocumentPermissionResDto> {
    return apiClient.get<DocumentPermissionResDto>(`${this.baseUrl}/${documentId}/permissions`);
  }

  // Share document with user/group/role
  async shareDocumentWithType(
    documentId: number,
    shareData: TypeShareAccessDocWithTypeReq
  ): Promise<TypeShareAccessDocumentRes> {
    return apiClient.post<TypeShareAccessDocumentRes>(`${this.baseUrl}/${documentId}/share`, shareData);
  }

  // Revoke document access
  async revokeDocumentAccess(documentId: number, granteeId: string): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${documentId}/share/${granteeId}`);
  }

  // Get document sharing list
  async getDocumentSharingList(documentId: number): Promise<TypeShareAccessDocumentRes[]> {
    return apiClient.get<TypeShareAccessDocumentRes[]>(`${this.baseUrl}/${documentId}/sharing`);
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
  async getDocumentVersions(documentId: number): Promise<DocumentResponseDto[]> {
    return apiClient.get<DocumentResponseDto[]>(`${this.baseUrl}/${documentId}/versions`);
  }

  // Set active version
  async setActiveVersion(documentId: number, versionId: number): Promise<DocumentResponseDto> {
    return apiClient.patch<DocumentResponseDto>(`${this.baseUrl}/${documentId}/versions/${versionId}/active`);
  }
}

export const documentService = new DocumentService();