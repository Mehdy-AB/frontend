'use client';

import { DocumentViewDto, DocumentTab } from '../../types/documentView';
import { AuditLog } from '../../types/api';
import {
  ConfigurationTab,
  ModelsTab,
  MetadataTab,
  ActivityTab
} from './index';
import { UnifiedComments } from '../comments/UnifiedComments';

interface DocumentContentProps {
  activeTab: DocumentTab;
  document: DocumentViewDto | null;
  auditLogs: AuditLog[];
  isLoadingConfig: boolean;
  isLoadingModels: boolean;
  isLoadingMetadata: boolean;
  isLoadingAuditLogs: boolean;
  isFavorite: boolean;
  onCopyLink: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
  onUpdateMetadata: (metadata: string[]) => void;
  onUpdateDocument?: (updatedDocument: DocumentViewDto) => void;
  onRefreshMetadata?: () => Promise<void>;
}

export default function DocumentContent({
  activeTab,
  document,
  auditLogs,
  isLoadingConfig,
  isLoadingModels,
  isLoadingMetadata,
  isLoadingAuditLogs,
  isFavorite,
  onCopyLink,
  onShare,
  onToggleFavorite,
  onUpdateMetadata,
  onUpdateDocument,
  onRefreshMetadata
}: DocumentContentProps) {
  if (!document) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {activeTab === 'config' && (
        <ConfigurationTab 
          document={document} 
          isLoading={isLoadingConfig}
          onCopyLink={onCopyLink}
          onShare={onShare}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite}
        />
      )}
      
      {activeTab === 'models' && (
        <ModelsTab 
          document={document} 
          isLoading={isLoadingModels} 
        />
      )}
      
      {activeTab === 'metadata' && (
        <MetadataTab 
          document={document} 
          isLoading={isLoadingMetadata}
          onUpdateMetadata={onUpdateMetadata}
          onUpdateDocument={onUpdateDocument}
          onRefreshMetadata={onRefreshMetadata}
        />
      )}
      
      {activeTab === 'activity' && (
        <ActivityTab 
          document={document} 
          auditLogs={auditLogs} 
          isLoading={isLoadingAuditLogs} 
        />
      )}
      
      {activeTab === 'comments' && (
        <UnifiedComments 
          entityType="DOCUMENT"
          entityId={document.documentId}
          entityName={document.name}
          displayMode="tab"
          canComment={document.userPermissions?.canEdit}
          showHeader={false}
          maxHeight="100%"
        />
      )}
    </div>
  );
}
