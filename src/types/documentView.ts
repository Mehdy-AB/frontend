// types/documentView.ts
import { DocumentResponseDto, UserDto, AuditLog, Comment, DocumentFilingCategoryResponseDto } from './api';

// Extended document interface for viewing
export interface DocumentViewDto extends DocumentResponseDto {
  contentUrl: string;
  thumbnailUrl?: string;
  description?: string;
  filingCategory?: DocumentFilingCategoryResponseDto;
  modelConfigurations?: ModelConfiguration[];
  aiModels?: AIModel[];
  relatedDocuments?: RelatedDocument[];
  accessLogs?: AccessLog[];
}

export interface ModelConfiguration {
  id: number;
  name: string;
  type: 'extraction' | 'classification' | 'analysis';
  status: 'active' | 'inactive' | 'processing';
  confidence: number;
  lastRun: string;
  parameters: { [key: string]: any };
}

export interface AIModel {
  id: number;
  name: string;
  provider: string;
  version: string;
  purpose: string;
  accuracy: number;
  lastUsed: string;
}

export interface RelatedDocument {
  documentId: number;
  name: string;
  similarity: number;
  reason: string;
}

export interface AccessLog {
  id: number;
  user: UserDto;
  action: 'viewed' | 'downloaded' | 'modified' | 'shared';
  timestamp: string;
  ipAddress: string;
}

export type DocumentTab = 'config' | 'workflows' | 'metadata' | 'activity' | 'comments';
