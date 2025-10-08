// app/documents/[documentId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '../../../contexts/LanguageContext';
import { notificationApiClient } from '../../../api/notificationClient';
import { DocumentViewDto, DocumentTab } from '../../../types/documentView';
import { useDocumentOperations } from '../../../hooks/useDocumentOperations';
import { copyToClipboard, downloadFile } from '../../../utils/documentUtils';
import FileViewer from '../../../components/viewers/FileViewer';
import {
  DocumentHeader,
  DocumentActions,
  DocumentTabs,
  DocumentContent,
  DocumentModals,
  DocumentViewSkeleton
} from '../../../components/document';

export default function DocumentViewPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<DocumentViewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DocumentTab>('config');
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(false);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isUpdatingDocument, setIsUpdatingDocument] = useState<boolean>(false);
  const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);
  const [showManagePermissions, setShowManagePermissions] = useState<boolean>(false);
  const [showUploadVersion, setShowUploadVersion] = useState<boolean>(false);
  const [showMoveDocument, setShowMoveDocument] = useState<boolean>(false);
  const [versions, setVersions] = useState<any[]>([]);

  // Use custom hook for document operations
  const {
    auditLogs,
    comments,
    isFavorite,
    isLoadingAuditLogs,
    isLoadingComments,
    isLoadingMetadata,
    fetchAuditLogs,
    fetchComments,
    fetchMetadata,
    checkFavoriteStatus,
    toggleFavorite,
    addComment,
    updateDocumentName,
    downloadDocument
  } = useDocumentOperations(parseInt(documentId));

  // Fetch document from API
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get document data and download URL
        const [docData, downloadUrl] = await Promise.all([
          notificationApiClient.getDocument(parseInt(documentId), { silent: true }),
          notificationApiClient.downloadDocument(parseInt(documentId), {}, { silent: true })
        ]);
        
        // Extend the document with viewing-specific data
        const documentView: DocumentViewDto = {
          ...docData,
          contentUrl: downloadUrl,
          thumbnailUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/document/${docData.documentId}/thumbnail`,
          modelConfigurations: [
            {
              id: 1,
              name: 'Text Extraction',
              type: 'extraction',
              status: 'active',
              confidence: 0.95,
              lastRun: new Date().toISOString(),
              parameters: { language: 'auto' }
            },
            {
              id: 2,
              name: 'Document Classification',
              type: 'classification',
              status: 'active',
              confidence: 0.87,
              lastRun: new Date().toISOString(),
              parameters: { category: 'business' }
            }
          ],
          aiModels: [
            {
              id: 1,
              name: 'GPT-4',
              provider: 'OpenAI',
              version: '4.0',
              purpose: 'Text Analysis',
              accuracy: 0.92,
              lastUsed: new Date().toISOString()
            }
          ],
          relatedDocuments: [
            {
              documentId: 123,
              name: 'Related Document.pdf',
              similarity: 0.85,
              reason: 'Similar content and keywords'
            }
          ],
          accessLogs: [
            {
              id: 1,
              user: docData.createdBy,
              action: 'viewed',
              timestamp: new Date().toISOString(),
              ipAddress: '127.0.0.1'
            }
          ]
        };
        
        setDocument(documentView);
        
        // Fetch additional data in background (don't block main loading)
        fetchAuditLogs(parseInt(documentId));
        fetchComments(parseInt(documentId));
        checkFavoriteStatus(parseInt(documentId));
        fetchVersions();
        fetchMetadata(parseInt(documentId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
        setError(errorMessage);
        console.error('Error fetching document:', err);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDocument();
    }
  }, [documentId, fetchAuditLogs, fetchComments, checkFavoriteStatus]);

  // Fetch document versions
  const fetchVersions = async () => {
    if (!document) return;
    
    try {
      const response = await notificationApiClient.getDocumentVersions(document.documentId);
      const versionInfos = response.documents.map(doc => ({
        versionId: doc.document.documentId,
        versionNumber: doc.document.versionNumber,
        sizeBytes: doc.document.sizeBytes,
        mimeType: doc.document.mimeType,
        createdAt: doc.document.createdAt,
        updatedAt: doc.document.updatedAt,
        createdBy: doc.document.createdBy
      }));
      setVersions(versionInfos);
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  // Update document name
  const handleUpdateDocumentName = async (newName: string) => {
    if (!document || !newName.trim() || newName === document.name) return;
    
    try {
      setIsUpdatingDocument(true);
      // Use the actual API to rename the document
      await notificationApiClient.renameDocument(document.documentId, newName.trim());
      // Update local state
      setDocument(prev => prev ? { ...prev, name: newName.trim() } : null);
    } catch (error) {
      console.error('Error updating document name:', error);
      throw error;
    } finally {
      setIsUpdatingDocument(false);
    }
  };

  // Update document title
  const handleUpdateDocumentTitle = async (newTitle: string) => {
    if (!document || newTitle === document.title) return;
    
    try {
      setIsUpdatingDocument(true);
      // Use the actual API to update the document title
      await notificationApiClient.editDocumentTitle(document.documentId, { title: newTitle.trim() });
      // Update local state
      setDocument(prev => prev ? { ...prev, title: newTitle.trim() } : null);
    } catch (error) {
      console.error('Error updating document title:', error);
      throw error;
    } finally {
      setIsUpdatingDocument(false);
    }
  };

  // Update document description
  const handleUpdateDocumentDescription = async (newDescription: string) => {
    if (!document || newDescription === document.description) return;
    
    try {
      setIsUpdatingDocument(true);
      // Use the actual API to update the document description
      await notificationApiClient.editDocumentDescription(document.documentId, newDescription.trim());
      // Update local state
      setDocument(prev => prev ? { ...prev, description: newDescription.trim() } : null);
    } catch (error) {
      console.error('Error updating document description:', error);
      throw error;
    } finally {
      setIsUpdatingDocument(false);
    }
  };

  // Set active version
  const handleSetActiveVersion = async (versionNumber: number) => {
    if (!document) return;
    
    try {
      setIsUpdatingDocument(true);
      // For now, just update the local state since the API method doesn't exist
      setDocument(prev => prev ? { ...prev, versionNumber } : null);
      // In a real implementation, you would call the API here
      // await notificationApiClient.setActiveVersion(document.documentId, versionNumber);
    } catch (error) {
      console.error('Error setting active version:', error);
    } finally {
      setIsUpdatingDocument(false);
    }
  };

  // Revert to old version
  const handleRevertToVersion = async (versionNumber: number) => {
    if (!document) return;
    
    try {
      setIsUpdatingDocument(true);
      // For now, just update the local state since the API method doesn't exist
      setDocument(prev => prev ? { ...prev, versionNumber } : null);
      // In a real implementation, you would call the API here
      // await notificationApiClient.revertToVersion(document.documentId, versionNumber);
    } catch (error) {
      console.error('Error reverting to version:', error);
    } finally {
      setIsUpdatingDocument(false);
    }
  };


  // Copy document link
  const copyDocumentLink = () => {
    const link = `${window.location.origin}/documents/${document?.documentId}`;
    copyToClipboard(link);
    // You could add a toast notification here
  };

  // Handle download
  const handleDownload = async () => {
    if (!document) return;
    
    try {
      // Download the current active version
      const downloadUrl = await notificationApiClient.downloadDocument(document.documentId, { version: document.versionNumber });
      
      // Log the download operation
      try {
        await notificationApiClient.fileDownloaded(document.documentId, { version: document.versionNumber });
      } catch (logError) {
        console.warn('Failed to log download operation:', logError);
      }
      
      downloadFile(downloadUrl, `${document.name}_v${document.versionNumber}`);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download document');
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async () => {
    if (!document) return;
    await toggleFavorite(document);
  };

  if (loading) {
    return <DocumentViewSkeleton />;
  }

  if (error || !document) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-background">
        <div className="text-center">
        <div className="text-error text-lg mb-4">{error || 'Document not found'}</div>
        <button 
          onClick={() => router.back()}
          className="bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Go Back
        </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-neutral-background">
      {/* Main Document Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <DocumentHeader
          document={document}
          versions={versions}
          isUpdatingDocument={isUpdatingDocument}
          isFavorite={isFavorite}
          onBack={() => router.back()}
          onUpdateName={handleUpdateDocumentName}
          onUpdateTitle={handleUpdateDocumentTitle}
          onUpdateDescription={handleUpdateDocumentDescription}
          onSetActiveVersion={handleSetActiveVersion}
          onRevertToVersion={handleRevertToVersion}
        onShowVersionHistory={() => setShowVersionHistory(true)}
        onShowUploadVersion={() => setShowUploadVersion(true)}
          onToggleFavorite={handleToggleFavorite}
          onDownload={handleDownload}
          onShare={() => setShowManagePermissions(true)}
          onMove={() => setShowMoveDocument(true)}
          onShowComments={() => setActiveTab('comments')}
          onCopyLink={copyDocumentLink}
        />

        {/* Document Content Area */}
        <div className="flex-1 overflow-hidden">
          <FileViewer 
            document={document} 
            downloadUrl={document.contentUrl}
            onError={(error) => setError(error)}
          />
        </div>
      </div>

      {/* Sidebar - Document Configuration */}
      <div className="w-80 bg-surface border-l border-ui flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-ui">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-neutral-text-dark">Document Details</h2>
          </div>
        </div>

        {/* Sidebar Tabs */}
        <DocumentTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        <DocumentContent
          activeTab={activeTab}
            document={document} 
          auditLogs={auditLogs}
          isLoadingConfig={isLoadingConfig}
          isLoadingModels={isLoadingModels}
          isLoadingMetadata={isLoadingMetadata}
          isLoadingAuditLogs={isLoadingAuditLogs}
          isFavorite={isFavorite}
            onCopyLink={copyDocumentLink}
            onShare={() => setShowManagePermissions(true)}
            onToggleFavorite={handleToggleFavorite}
            onUpdateMetadata={(metadata) => {
              setDocument(prev => prev ? { ...prev, metadata } : null);
            }}
            onUpdateDocument={(updatedDocument) => setDocument(updatedDocument)}
            onRefreshMetadata={async () => {
              const updatedDocument = await fetchMetadata(parseInt(documentId));
              if (updatedDocument) {
                setDocument(updatedDocument as DocumentViewDto);
              }
            }}
        />
      </div>

      {/* Modals */}
      <DocumentModals
        document={document}
        showVersionHistory={showVersionHistory}
        showManagePermissions={showManagePermissions}
        showUploadVersion={showUploadVersion}
        showMoveDocument={showMoveDocument}
        onCloseVersionHistory={() => setShowVersionHistory(false)}
        onCloseManagePermissions={() => setShowManagePermissions(false)}
        onCloseUploadVersion={() => setShowUploadVersion(false)}
        onCloseMoveDocument={() => setShowMoveDocument(false)}
        onVersionUploadSuccess={() => {
          // Refresh document data after successful version upload
          window.location.reload();
        }}
        onMoveSuccess={() => {
          // Refresh document data after successful move
          window.location.reload();
        }}
      />
    </div>
  );
}