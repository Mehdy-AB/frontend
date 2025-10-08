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
  DocumentVersionResponse
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
   * Delete document
   */
  static async deleteDocument(id: number, options?: any): Promise<void> {
    return notificationApiClient.deleteDocument(id, options);
  }
}

export default DocumentService;
