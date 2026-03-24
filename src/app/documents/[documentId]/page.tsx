// app/documents/[documentId]/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '../../../contexts/LanguageContext';
import { notificationApiClient } from '../../../api/notificationClient';
import { DocumentViewDto, DocumentTab } from '../../../types/documentView';
import { DocumentVersionResponseDto } from '../../../types/api';
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
import WorkflowStepAction from '../../../components/document/WorkflowStepAction';
import DocumentWorkflowPanel from '../../../components/document/DocumentWorkflowPanel';
import ConfirmationModal from '../../../components/modals/ConfirmationModal';
import RenameModal from '@/components/modals/RenameModal';
import { documentService, stampService } from '../../../api/services';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { WorkflowNodeInstanceResponse, WorkflowInstanceResponse } from '@/types/workflow';
import { StampResponse } from '../../../types/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';

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
  const [showAddStamp, setShowAddStamp] = useState<boolean>(false);
  const [stamps, setStamps] = useState<StampResponse[]>([]);
  const [loadingStamps, setLoadingStamps] = useState<boolean>(false);
  const [selectedStampId, setSelectedStampId] = useState<number | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [optimisticFile, setOptimisticFile] = useState<File | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [fileViewerKey, setFileViewerKey] = useState<number>(0);
  const fileViewerRefreshRef = useRef<(() => void) | null>(null);
  const [pendingStep, setPendingStep] = useState<WorkflowNodeInstanceResponse | null>(null);
  const [refreshingAfterAction, setRefreshingAfterAction] = useState(false);
  const [showComposedChildren, setShowComposedChildren] = useState(false);
  const [workflowInstances, setWorkflowInstances] = useState<WorkflowInstanceResponse[]>([]);
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(false);
  const { showSuccess, showError } = useNotifications();

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

  // Fetch pending workflow steps
  useEffect(() => {
    const fetchPendingSteps = async () => {
      try {
        const steps = await workflowAdminService.getDocumentNodes(parseInt(documentId));
        // Get the first actionable step (ACTIVE or SCHEDULED status)
        const actionableStep = steps.find((step: WorkflowNodeInstanceResponse) =>
          step.status === 'ACTIVE' || step.status === 'SCHEDULED'
        );
        setPendingStep(actionableStep || null);
      } catch (error) {
        // Silently fail - workflow steps are optional
        console.debug('No workflow steps found for document:', error);
      }
    };

    if (documentId) {
      fetchPendingSteps();

      // Also fetch all workflow instances for this document
      workflowAdminService.getAllWorkflowInstancesForDocument(parseInt(documentId))
        .then(instances => setWorkflowInstances(instances))
        .catch(() => setWorkflowInstances([]));
    }
  }, [documentId]);

  // Fetch document versions
  const fetchVersions = useCallback(async () => {
    if (!documentId) return;

    try {
      const versions = await notificationApiClient.getDocumentVersionsList(parseInt(documentId)) as unknown as DocumentVersionResponseDto[];
      // Sort versions by version number
      const sortedVersions = versions.sort((a, b) => a.versionNumber - b.versionNumber);

      const versionInfos = sortedVersions.map((version, index) => ({
        versionId: version.id,
        versionNumber: version.versionNumber,
        sequentialNumber: index + 1, // Map to sequential numbers (1, 2, 3, etc.)
        sizeBytes: version.sizeBytes,
        mimeType: version.mimeType,
        createdAt: version.createdAt,
        updatedAt: version.createdAt, // DocumentVersionResponseDto doesn't have updatedAt, use createdAt
        createdBy: undefined // DocumentVersionResponseDto doesn't include user info
      }));
      setVersions(versionInfos);
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  }, [documentId]);

  // Fetch document from API
  const fetchDocument = useCallback(async () => {
    if (!documentId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch document data and download URL in parallel
      const versionToFetch = versionParam ? parseInt(versionParam) : null;

      // If no version param, just fetch without version (backend returns active version automatically)
      // If version param exists, fetch that specific version
      const [docData, contentUrl] = await Promise.all([
        notificationApiClient.getDocument(parseInt(documentId), { silent: true }),
        notificationApiClient.getContentUrl(
          parseInt(documentId),
          versionToFetch || undefined,
          { silent: true }
        )
      ]);

      // Set current version from URL param or from the document's active version
      setCurrentVersion(versionToFetch || docData.activeVersion || null);

      // Extend the document with viewing-specific data
      const documentView: DocumentViewDto = {
        ...docData,
        contentUrl: contentUrl,
        thumbnailUrl: `${(typeof window !== 'undefined' && (window as any).ENV?.API_URL) || 'http://localhost:8080'}/api/v1/document/${docData.documentId}/thumbnail`,
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
  }, [documentId, versionParam, fetchAuditLogs, fetchComments, checkFavoriteStatus, fetchMetadata, fetchVersions]);

  // Fetch document on mount and when dependencies change
  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // Handle rename document
  const handleRenameDocument = () => {
    setShowRenameDocument(true);
  };

  // Handle upload new version
  const handleUploadVersion = () => {
    setShowUploadVersion(true);
  };

  // Handle add stamp
  const handleAddStamp = async () => {
    if (!document) return;

    try {
      setLoadingStamps(true);
      // Fetch active stamps
      const response = await stampService.getAllStamps(0, 100, undefined, undefined, undefined, true);
      setStamps(response.content || []);
      setShowAddStamp(true);
    } catch (error) {
      console.error('Error fetching stamps:', error);
      showError('Error', 'Failed to load stamps. Please try again.');
    } finally {
      setLoadingStamps(false);
    }
  };

  // Handle apply stamp
  const handleApplyStamp = async () => {
    if (!document || !selectedStampId) return;

    try {
      setIsUpdatingDocument(true);
      const versionId = currentVersion || document.versionId;
      await documentService.setStampOnVersion(document.documentId, versionId, selectedStampId);
      showSuccess('Success', 'Stamp has been applied to the document version successfully.');
      setShowAddStamp(false);
      setSelectedStampId(null);
      // Refresh document to show the stamp
      fetchDocument();
    } catch (error) {
      console.error('Error applying stamp:', error);
      showError('Error', 'Failed to apply stamp. Please try again.');
    } finally {
      setIsUpdatingDocument(false);
    }
  };

  // Handle remove stamp
  const handleRemoveStamp = async () => {
    if (!document) return;

    try {
      setIsUpdatingDocument(true);
      const versionId = currentVersion || document.versionId;
      await documentService.setStampOnVersion(document.documentId, versionId);
      showSuccess('Success', 'Stamp has been removed from the document version successfully.');
      setShowAddStamp(false);
      setSelectedStampId(null);
      // Refresh document
      fetchDocument();
    } catch (error) {
      console.error('Error removing stamp:', error);
      showError('Error', 'Failed to remove stamp. Please try again.');
    } finally {
      setIsUpdatingDocument(false);
    }
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
      await notificationApiClient.downloadDocument(
        document.documentId,
        currentVersion || undefined
      );

      // Log the download operation
      try {
        await notificationApiClient.fileDownloaded(
          document.documentId,
          currentVersion || undefined
        );
      } catch (logError) {
        console.warn('Failed to log download operation:', logError);
      }
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

      // Fetch the specific version content URL for the viewer
      const newContentUrl = await notificationApiClient.getContentUrl(
        document.documentId,
        versionId, // Explicitly fetch the restored version
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
        contentUrl: newContentUrl
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
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {t('documentNotFound') || 'Document Not Found'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {error || t('documentNotFoundDesc') || 'This document may have been deleted, moved, or you don\'t have permission to view it.'}
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('goBack') || 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-neutral-background">
      {/* Main Document Viewer */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
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
          workflowInstances={workflowInstances}
          onShowWorkflows={() => setShowWorkflowPanel(true)}
        />



        {/* Workflow Step Action - Banner under title */}
        {refreshingAfterAction && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-500">{t('processingWorkflow') || 'Processing workflow...'}</span>
            </div>
          </div>
        )}

        {pendingStep && !refreshingAfterAction && (
          <div className="px-4 py-2 flex-shrink-0">
            <WorkflowStepAction
              stepInstance={pendingStep}
              onComplete={async () => {
                setRefreshingAfterAction(true);
                setPendingStep(null);
                try {
                  // Wait for the workflow engine to process the next node
                  await new Promise(resolve => setTimeout(resolve, 1500));

                  // Re-check document access — it may have been moved/deleted
                  try {
                    await notificationApiClient.getDocument(parseInt(documentId), { silent: true });
                  } catch {
                    // Document no longer accessible
                    setError('This document has been moved or deleted by the workflow.');
                    setRefreshingAfterAction(false);
                    return;
                  }

                  // Fetch next pending steps
                  const steps = await workflowAdminService.getDocumentNodes(parseInt(documentId));
                  const actionableStep = steps.find((step: WorkflowNodeInstanceResponse) =>
                    step.status === 'ACTIVE' || step.status === 'SCHEDULED'
                  );
                  setPendingStep(actionableStep || null);

                  // Refresh document data to pick up any changes (metadata, status, etc.)
                  await fetchDocument();
                } catch {
                  setPendingStep(null);
                } finally {
                  setRefreshingAfterAction(false);
                }
              }}
            />
          </div>
        )}

        {/* Document Content Area */}
        <div className="min-h-[70vh] flex-shrink-0">
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
            // Update metadata without changing fileViewerKey to prevent content view from disappearing
            setDocument(prev => prev ? { ...prev, metadata } : null);
          }}
          onUpdateDocument={(updatedDocument) => setDocument(updatedDocument)}
          onRefreshMetadata={async () => {
            const updatedDocument = await fetchMetadata(parseInt(documentId));
            if (updatedDocument) {
              setDocument(updatedDocument as DocumentViewDto);
            }
          }}
          onRefreshDocument={fetchDocument}
          onSwitchToWorkflowTab={() => setActiveTab('workflows')}
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
            const [docData, contentUrl] = await Promise.all([
              notificationApiClient.getDocument(parseInt(documentId), { silent: true }),
              notificationApiClient.getContentUrl(parseInt(documentId), undefined, { silent: true })
            ]);

            // Update document with new data
            setDocument(prev => prev ? {
              ...prev,
              ...docData,
              contentUrl: contentUrl,
              thumbnailUrl: `${(typeof window !== 'undefined' && (window as any).ENV?.API_URL) || 'http://localhost:8080'}/api/v1/document/${docData.documentId}/thumbnail`
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
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteDocument}
          title="Delete Document"
          message="Are you sure you want to delete this document?"
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          loading={isUpdatingDocument}
          itemName={document?.name || 'document'}
          itemType="document"
        />
      )}

      {/* Rename Document Modal */}
      {showRenameDocument && document && (
        <RenameModal
          isOpen={showRenameDocument}
          onClose={() => setShowRenameDocument(false)}
          item={document}
          itemType="document"
          onSuccess={handleRenameSuccess}
        />
      )}

      {/* Add Stamp Modal */}
      <Dialog open={showAddStamp} onOpenChange={setShowAddStamp}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Stamp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {loadingStamps ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : stamps.length === 0 ? (
              <div className="text-center py-8 text-neutral-text-light">
                <p>No active stamps available.</p>
                <p className="text-sm mt-2">Create a stamp in the admin section to use it here.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {stamps.map((stamp) => (
                    <button
                      key={stamp.id}
                      onClick={() => setSelectedStampId(stamp.id === selectedStampId ? null : stamp.id)}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${selectedStampId === stamp.id
                        ? 'border-primary bg-primary/10'
                        : 'border-ui hover:border-primary/50'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {stamp.stampType === 'IMAGE' && stamp.imageUrl && (
                          <img
                            src={stamp.imageUrl}
                            alt={stamp.name}
                            className="w-16 h-16 object-contain rounded"
                          />
                        )}
                        {stamp.stampType === 'TEXT' && (
                          <div
                            className="w-16 h-16 flex items-center justify-center rounded text-xs font-bold"
                            style={{
                              color: stamp.color || '#000',
                              backgroundColor: stamp.backgroundColor || 'transparent',
                              border: stamp.borderColor ? `2px solid ${stamp.borderColor}` : 'none',
                            }}
                          >
                            {stamp.content || 'TEXT'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-neutral-text-dark truncate">
                            {stamp.name}
                          </h3>
                          {stamp.description && (
                            <p className="text-xs text-neutral-text-light mt-1 line-clamp-2">
                              {stamp.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 bg-neutral-background rounded">
                              {stamp.stampType}
                            </span>
                            {stamp.category && (
                              <span className="text-xs px-2 py-0.5 bg-neutral-background rounded">
                                {stamp.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-ui">
                  <div className="flex items-center gap-2">
                    {document.stamp && (
                      <Button
                        variant="outline"
                        onClick={handleRemoveStamp}
                        disabled={isUpdatingDocument}
                      >
                        Remove Current Stamp
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddStamp(false);
                        setSelectedStampId(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleApplyStamp}
                      disabled={!selectedStampId || isUpdatingDocument}
                    >
                      {isUpdatingDocument ? 'Applying...' : 'Apply Stamp'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Workflow Instances Panel */}
      <DocumentWorkflowPanel
        isOpen={showWorkflowPanel}
        onClose={() => setShowWorkflowPanel(false)}
        workflowInstances={workflowInstances}
      />

    </div>
  );
}