'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  User, 
  Calendar, 
  Download, 
  Eye,
  Unlink,
  AlertCircle,
  CheckCircle,
  Settings,
  Maximize2,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { RelatedDocumentResponseDto } from '../../types/api';
import { DocumentService } from '../../api/services/documentService';
import { formatFileSize, formatDate, getLinkTypeColor } from '../../utils/documentUtils';
import ViewRelatedDocumentsModal from '../modals/ViewRelatedDocumentsModal';
import LinkDocumentModal from '../modals/LinkDocumentModal';

interface RelatedDocumentsSectionProps {
  documentId: number;
  documentName: string;
  canEdit: boolean;
  onLinkCreated?: () => void;
}

export default function RelatedDocumentsSection({
  documentId,
  documentName,
  canEdit,
  onLinkCreated
}: RelatedDocumentsSectionProps) {
  const [relatedDocuments, setRelatedDocuments] = useState<RelatedDocumentResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 5;

  useEffect(() => {
    loadRelatedDocuments(0);
  }, [documentId]);

  const loadRelatedDocuments = async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const response = await DocumentService.getRelatedDocuments(documentId, {
        page,
        size: pageSize
      });
      
      if (append) {
        setRelatedDocuments(prev => [...prev, ...response.content]);
      } else {
        setRelatedDocuments(response.content);
      }
      
      setCurrentPage(response.number);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Error loading related documents:', error);
      setError('Failed to load related documents');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages - 1) {
      loadRelatedDocuments(currentPage + 1, true);
    }
  };

  const handleLinkCreated = () => {
    loadRelatedDocuments(0);
    onLinkCreated?.();
  };

  const handleUnlinkDocument = async (linkId: number) => {
    try {
      await DocumentService.deleteDocumentLink(linkId);
      loadRelatedDocuments(0);
    } catch (error) {
      console.error('Error unlinking document:', error);
      setError('Failed to unlink document');
    }
  };

  const handleViewDocument = (docId: number) => {
    window.open(`/documents/${docId}`, '_blank');
  };

  const handleDownloadDocument = async (docId: number) => {
    try {
      const downloadUrl = await DocumentService.downloadDocument(docId);
      await DocumentService.fileDownloaded(docId);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-900 text-sm">Related Documents</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {totalElements}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsViewModalOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="View all related documents"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
          {canEdit && (
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Link
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Related Documents List */}
      <div className="space-y-2">
        {relatedDocuments.length > 0 ? (
          <>
            {relatedDocuments.map((doc) => (
              <div key={doc.documentId} className="group relative bg-white border border-gray-200 rounded hover:border-blue-300 hover:shadow-sm transition-all duration-200">
                <div className="p-2">
                  <div className="flex items-start gap-2">
                    {/* Document Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-7 h-7 bg-blue-50 rounded flex items-center justify-center">
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                    </div>
                    
                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 truncate text-xs">
                            {doc.documentName}
                          </h4>
                          
                          {/* Link Type and Manual/Auto indicators */}
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${getLinkTypeColor(doc.linkType)}`}>
                              {doc.linkType}
                            </span>
                            {doc.isManual ? (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                <Settings className="h-2.5 w-2.5" />
                                Manual
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-2.5 w-2.5" />
                                Auto
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Menu */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {doc.userPermissions?.canView && (
                            <button
                              onClick={() => handleViewDocument(doc.documentId)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                              title="View Document"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                          )}
                          {doc.userPermissions?.canView && (
                            <button
                              onClick={() => handleDownloadDocument(doc.documentId)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                              title="Download Document"
                            >
                              <Download className="h-3 w-3" />
                            </button>
                          )}
                          {canEdit && doc.isManual && (
                            <button
                              onClick={() => handleUnlinkDocument(doc.documentId)}
                              className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"
                              title="Unlink Document"
                            >
                              <Unlink className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load More Button */}
            {currentPage < totalPages - 1 && (
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full py-2 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Load More ({relatedDocuments.length} of {totalElements})
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="text-xs font-medium text-gray-900 mb-1">No related documents</h3>
            <p className="text-xs text-gray-500 mb-2">
              This document isn't linked to any other documents yet.
            </p>
          </div>
        )}
      </div>

      {/* View Related Documents Modal (Full Screen) */}
      <ViewRelatedDocumentsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        onLinkDeleted={handleLinkCreated}
        sourceDocumentId={documentId}
        sourceDocumentName={documentName}
        canEdit={canEdit}
      />

      {/* Link Document Modal (Manual Linking Only) */}
      <LinkDocumentModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onLinkCreated={handleLinkCreated}
        sourceDocumentId={documentId}
        sourceDocumentName={documentName}
      />
    </div>
  );
}
