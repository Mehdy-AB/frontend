import { apiClient } from '../client';

export interface AllowedFileTypeDto {
  id: number;
  mimeType: string;
  category: 'DOCUMENT' | 'IMAGE' | 'EMAIL' | 'ARCHIVE' | 'CAD' | 'MEDIA' | 'DATA' | 'EBOOK' | 'POSTSCRIPT' | 'RICH_TEXT';
  tier: number;
  label: string;
  extensions: string;
  previewSupported: boolean;
  ocrSupported: boolean;
  allowed: boolean;
}

export interface UpdateFileTypeRequest {
  id: number;
  allowed: boolean;
}

class FileTypeService {
  private baseUrl = '/api/v1';

  /**
   * Admin: Get all file types (enabled and disabled).
   */
  async getAllFileTypes(): Promise<AllowedFileTypeDto[]> {
    return apiClient.get<AllowedFileTypeDto[]>(`${this.baseUrl}/admin/file-types`);
  }

  /**
   * Admin: Bulk update allowed status of file types.
   */
  async updateFileTypes(updates: UpdateFileTypeRequest[]): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/admin/file-types`, updates);
  }

  /**
   * Public (authenticated): Get only allowed file types for the upload modal.
   */
  async getAllowedFileTypes(): Promise<AllowedFileTypeDto[]> {
    return apiClient.get<AllowedFileTypeDto[]>(`${this.baseUrl}/file-types/allowed`);
  }
}

export const fileTypeService = new FileTypeService();
