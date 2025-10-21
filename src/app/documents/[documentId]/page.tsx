// app/documents/[documentId]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '../../../contexts/LanguageContext';
import { notificationApiClient } from '../../../api/notificationClient';
import { DocumentViewDto, DocumentTab } from '../../../types/documentView';
import { useDocumentOperations } from '../../../hooks/useDocumentOperations';
import { copyToClipboard } from '../../../utils/documentUtils';
import FileViewer from '../../../components/viewers/FileViewer';
import {
  DocumentHeader,
  DocumentActions,
  DocumentTabs,
  DocumentContent,
  DocumentModals,
  DocumentViewSkeleton
} from '../../../components/document';
import DeleteConfirmationModal from '../../../components/modals/DeleteConfirmationModal';
import FolderActionModal from '../../../components/modals/FolderActionModal';

export default function DocumentViewPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = params.documentId as string;
  const versionParam = searchParams.get('version');

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showRenameDocument, setShowRenameDocument] = useState<boolean>(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [optimisticFile, setOptimisticFile] = useState<File | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [fileViewerKey, setFileViewerKey] = useState<number>(0);
  const fileViewerRefreshRef = useRef<(() => void) | null>(null);

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
        
        // Fetch document data and download URL in parallel
        const versionToFetch = versionParam ? parseInt(versionParam) : null;
        
        // If no version param, just fetch without version (backend returns active version automatically)
        // If version param exists, fetch that specific version
        const [docData, downloadUrl] = await Promise.all([
          notificationApiClient.getDocument(parseInt(documentId), { silent: true }),
          notificationApiClient.downloadDocument(
            parseInt(documentId), 
            versionToFetch ? { version: versionToFetch } : {}, 
            { silent: true }
          )
        ]);
        
        // Set current version from URL param or from the document's active version
        setCurrentVersion(versionToFetch || docData.activeVersion || null);
        
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
  }, [documentId, versionParam, fetchAuditLogs, fetchComments, checkFavoriteStatus]);

  // Fetch document versions
  const fetchVersions = async () => {
    if (!document) return;
    
    try {
      const versions = await notificationApiClient.getDocumentVersionsList(document.documentId);
      // Sort versions by version number
      const sortedVersions = versions.sort((a, b) => a.versionNumber - b.versionNumber);
      
      const versionInfos = sortedVersions.map((version, index) => ({
        versionId: version.id,
        versionNumber: version.versionNumber,
        sequentialNumber: index + 1, // Map to sequential numbers (1, 2, 3, etc.)
        sizeBytes: version.sizeBytes,
        mimeType: version.mimeType,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt,
        createdBy: version.createdBy
      }));
      setVersions(versionInfos);
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  // Handle rename document
  const handleRenameDocument = () => {
    setShowRenameDocument(true);
  };

  // Handle upload new version
  const handleUploadVersion = () => {
    setShowUploadVersion(true);
  };

  // Handle rename success
  const handleRenameSuccess = async (updatedItem?: { id: number; name: string; type: 'folder' | 'document'; action: 'rename' | 'move' }) => {
    if (updatedItem && updatedItem.type === 'document') {
      // Update local state with new name
      setDocument(prev => prev ? { ...prev, name: updatedItem.name } : null);
    }
    setShowRenameDocument(false);
  };

  // Set active version
  const handleSetActiveVersion = async (versionId: number) => {
    if (!document) return;
    
    try {
      setIsUpdatingDocument(true);
      // Update URL to show the selected version
      const newUrl = `/documents/${documentId}?version=${versionId}`;
      router.push(newUrl);
    } catch (error) {
      console.error('Error setting active version:', error);
    } finally {
      setIsUpdatingDocument(false);
    }
  };

  // Revert to old version
  const handleRevertToVersion = async (versionId: number) => {
    if (!document) return;
    
    try {
      setIsUpdatingDocument(true);
      // Update URL to show the reverted version
      const newUrl = `/documents/${documentId}?version=${versionId}`;
      router.push(newUrl);
    } catch (error) {
      console.error('Error reverting to version:', error);
    } finally {
      setIsUpdatingDocument(false);
    }
  };


  // Copy document link
  const copyDocumentLink = () => {
    const baseLink = `${window.location.origin}/documents/${document?.documentId}`;
    const link = currentVersion ? `${baseLink}?version=${currentVersion}` : baseLink;
    copyToClipboard(link);
    // You could add a toast notification here
  };

  // Handle download
  const handleDownload = async () => {
    if (!document) return;
    
    try {
      // Download the current version (use versionId if available, otherwise latest)
      const versionToDownload = currentVersion || document.documentId;
      const downloadUrl = await notificationApiClient.downloadDocument(document.documentId, { version: versionToDownload });
      
      // Log the download operation
      try {
        await notificationApiClient.fileDownloaded(document.documentId, { version: versionToDownload });
      } catch (logError) {
        console.warn('Failed to log download operation:', logError);
      }
      
      // Create download link that starts in browser download section
      const link = window.document.createElement('a');
      link.href = downloadUrl;
      link.download = document.name;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
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

  // Handle optimistic file update
  const handleOptimisticFileUpdate = (file: File) => {
    setOptimisticFile(file);
    // Update document metadata optimistically
    setDocument(prev => prev ? {
      ...prev,
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
      updatedAt: new Date().toISOString()
    } : null);
  };

  // Handle delete document
  const handleDeleteDocument = async () => {
    if (!document) return;
    
    try {
      setIsUpdatingDocument(true);
      await notificationApiClient.deleteDocument(document.documentId);
      
      // Redirect to parent folder or home after successful deletion
      if (document.folderId) {
        router.push(`/folders/${document.folderId}`);
      } else {
        router.push('/folders');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    } finally {
      setIsUpdatingDocument(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle restore version
  const handleRestoreVersion = async (versionId: number, versionNumber: number): Promise<void> => {
    if (!document) return;
    
    try {
      setIsUpdatingDocument(true);
      
      // Call API to set the version as active (this sets it in the backend)
      await notificationApiClient.setActiveVersion(document.documentId, versionId);
      
      // Fetch the specific version content with version parameter
      const newDownloadUrl = await notificationApiClient.downloadDocument(
        document.documentId, 
        { version: versionId }, // Explicitly fetch the restored version
        { silent: true }
      );
      
      // Update local state with the restored version
      setCurrentVersion(versionId);
      setOptimisticFile(null);
      
      // Find the version info from versions list
      const version = versions.find(v => v.versionId === versionId);
      
      // Update document state with restored version info
      setDocument(prev => prev ? {
        ...prev,
        activeVersion: versionId,
        versionNumber: versionNumber,
        sizeBytes: version?.sizeBytes || prev.sizeBytes,
        mimeType: version?.mimeType || prev.mimeType,
        updatedAt: new Date().toISOString(),
        contentUrl: newDownloadUrl
      } : null);
      
      // Force FileViewer to re-render with new content
      setFileViewerKey(prev => prev + 1);
      
      // Manually trigger FileViewer refresh
      setTimeout(() => {
        if (fileViewerRefreshRef.current) {
          fileViewerRefreshRef.current();
        }
      }, 100);
      
    } catch (error) {
      console.error('Error restoring version:', error);
      setError('Failed to restore version');
    } finally {
      setIsUpdatingDocument(false);
    }
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
          currentVersion={currentVersion}
          isUpdatingDocument={isUpdatingDocument}
          isFavorite={isFavorite}
          onBack={() => router.back()}
          onShowVersionHistory={() => setShowVersionHistory(true)}
          onToggleFavorite={handleToggleFavorite}
          onDownload={handleDownload}
          onShare={() => setShowManagePermissions(true)}
          onMove={() => setShowMoveDocument(true)}
          onShowComments={() => setActiveTab('comments')}
          onCopyLink={copyDocumentLink}
          onDelete={() => setShowDeleteConfirm(true)}
          onRename={handleRenameDocument}
          onUploadVersion={handleUploadVersion}
        />

        {/* Document Content Area */}
        <div className="flex-1 overflow-hidden">
          <FileViewer 
            key={`${document.documentId}-${currentVersion || 'latest'}-${fileViewerKey}`}
            document={document} 
            downloadUrl={document.contentUrl}
            onError={(error) => setError(error)}
            optimisticFile={optimisticFile || undefined}
            refreshTrigger={fileViewerKey}
            onRef={(refreshFn) => {
              fileViewerRefreshRef.current = refreshFn;
            }}
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
        onVersionUploadSuccess={async () => {
          // Fetch the updated document data first
          try {
            const [docData, downloadUrl] = await Promise.all([
              notificationApiClient.getDocument(parseInt(documentId), { silent: true }),
              notificationApiClient.downloadDocument(parseInt(documentId), {}, { silent: true })
            ]);
            
            // Update document with new data
            setDocument(prev => prev ? {
              ...prev,
              ...docData,
              contentUrl: downloadUrl,
              thumbnailUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/document/${docData.documentId}/thumbnail`
            } : null);
            
            // Update current version based on activeVersion from response
            setCurrentVersion(docData.activeVersion || null);
            
            // Now clear optimistic file and refresh versions
            setOptimisticFile(null);
            fetchVersions();
          } catch (error) {
            console.error('Error refreshing document after upload:', error);
            // Keep optimistic file if refresh fails
          }
        }}
        onMoveSuccess={() => {
          // Refresh document data after successful move
          window.location.reload();
        }}
        onOptimisticFileUpdate={handleOptimisticFileUpdate}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteDocument}
          itemName={document?.name || 'document'}
          itemType="document"
          isLoading={isUpdatingDocument}
        />
      )}

      {/* Rename Document Modal */}
      {showRenameDocument && document && (
        <FolderActionModal
          isOpen={showRenameDocument}
          onClose={() => setShowRenameDocument(false)}
          folder={null}
          document={document}
          action="rename"
          onSuccess={handleRenameSuccess}
        />
      )}
    </div>
  );
}