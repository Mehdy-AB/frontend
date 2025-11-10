'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Eye,
  Download,
  Unlink,
  Settings,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  FolderOpen,
  Mail,
  Calendar,
  Trash2,
  Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { linkRuleService } from '../../api/services/linkRuleService';
import { notificationApiClient } from '../../api/notificationClient';
import { RelatedDocumentResponseDto } from '../../types/api';
import { formatFileSize, formatDate, getLinkTypeColor } from '../../utils/documentUtils';
import { useServerSideSearch } from '../main/useServerSideSearch';
import ServerSearchInput from '../main/ServerSearchInput';
import SearchPagination from '../search/SearchPagination';
import UserAvatar from '../main/UserAvatar';

interface ViewRelatedDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkDeleted?: () => void;
  sourceDocumentId: number;
  sourceDocumentName: string;
  canEdit: boolean;
}

const LINK_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'related', label: 'Related Document' },
  { value: 'reference', label: 'Reference' },
  { value: 'attachment', label: 'Attachment' },
  { value: 'version', label: 'Version' },
  { value: 'parent', label: 'Parent Document' },
  { value: 'child', label: 'Child Document' },
  { value: 'similar', label: 'Similar Document' },
  { value: 'alternative', label: 'Alternative Version' }
];

export default function ViewRelatedDocumentsModal({ 
  isOpen, 
  onClose, 
  onLinkDeleted,
  sourceDocumentId,
  sourceDocumentName,
  canEdit
}: ViewRelatedDocumentsModalProps) {
  const pageSize = 15;
  
  // Filters
  const [linkTypeFilter, setLinkTypeFilter] = useState('all');
  const [isManualFilter, setIsManualFilter] = useState<boolean | undefined>(undefined);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<{ linkId: number; documentName: string; isManual: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use server-side search for related documents
  const {
    displayData: relatedDocuments,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalElements,
    loading: isLoading,
    tableLoading,
    fetchData: fetchRelatedDocuments,
    removeItem: removeDocumentFromList
  } = useServerSideSearch<RelatedDocumentResponseDto>({
    fetchFunction: async (currentPage, searchTerm) => {
      // Format dates to ISO format if provided
      const formattedFromDate = fromDate ? new Date(fromDate).toISOString() : undefined;
      const formattedToDate = toDate ? new Date(toDate + 'T23:59:59').toISOString() : undefined;
      
      const response = await linkRuleService.getRelatedDocuments(
        sourceDocumentId,
        {
          page: currentPage,
          size: pageSize,
          search: searchTerm || undefined,
          linkType: linkTypeFilter !== 'all' ? linkTypeFilter : undefined,
          isManual: isManualFilter,
          fromDate: formattedFromDate,
          toDate: formattedToDate
        }
      );
      return response;
    },
    searchFields: (doc) => [
      doc.documentName || '',
      doc.documentTitle || '',
      doc.documentDescription || '',
      doc.ownedBy?.firstName || '',
      doc.ownedBy?.lastName || ''
    ],
    debounceMs: 300,
    fetchOnMount: false
  });

  // Load related documents when modal opens or filters change
  useEffect(() => {
    if (isOpen) {
      fetchRelatedDocuments(false);
    }
  }, [isOpen, linkTypeFilter, isManualFilter, fromDate, toDate]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setLinkTypeFilter('all');
    setIsManualFilter(undefined);
    setFromDate('');
    setToDate('');
  };

  const handleDeleteLinkClick = (linkId: number, documentName: string, isManual: boolean) => {
    setLinkToDelete({ linkId, documentName, isManual });
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteLink = async () => {
    if (!linkToDelete) return;
    
    try {
      setIsDeleting(true);
      await linkRuleService.deleteDocumentLink(linkToDelete.linkId);
      
      // Remove from list optimistically
      removeDocumentFromList(linkToDelete.linkId, (doc) => doc.linkId || 0);
      
      // Notify parent
      onLinkDeleted?.();
      
      // Close confirmation modal
      setShowDeleteConfirmation(false);
      setLinkToDelete(null);
      
      // Refresh to sync with server
      fetchRelatedDocuments(false);
    } catch (error) {
      console.error('Error unlinking document:', error);
      setError('Failed to unlink document');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteLink = () => {
    setShowDeleteConfirmation(false);
    setLinkToDelete(null);
  };

  const handleViewDocument = (docId: number) => {
    window.open(`/documents/${docId}`, '_blank');
  };

  const handleDownloadDocument = async (docId: number) => {
    try {
      const downloadUrl = await notificationApiClient.downloadDocument(docId);
      await notificationApiClient.fileDownloaded(docId);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document');
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setLinkTypeFilter('all');
    setIsManualFilter(undefined);
    setFromDate('');
    setToDate('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <LinkIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Related Documents</h2>
              <p className="text-sm text-gray-600">
                For "{sourceDocumentName}" • {totalElements} document{totalElements !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 border-b bg-gray-50">
          {/* Main Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            {/* Search */}
            <div className="md:col-span-2">
              <ServerSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search documents by name, title, or description..."
              />
            </div>

            {/* Link Type */}
            <div>
              <Select value={linkTypeFilter} onValueChange={setLinkTypeFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Link Type" />
                </SelectTrigger>
                <SelectContent>
                  {LINK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Manual/Auto */}
            <div>
              <Select 
                value={isManualFilter === undefined ? 'all' : isManualFilter ? 'manual' : 'auto'} 
                onValueChange={(v) => setIsManualFilter(v === 'all' ? undefined : v === 'manual')}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                  <SelectItem value="auto">Auto Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div>
              <Button onClick={handleClearFilters} variant="outline" className="w-full h-10">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-9 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-9 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tableLoading && relatedDocuments.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">Loading related documents...</p>
              </div>
            </div>
          ) : relatedDocuments.length > 0 ? (
            <div className="space-y-3">
              {relatedDocuments.map((doc) => (
                <div key={doc.documentId} className="group bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Document Icon */}
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          doc.isManual ? 'bg-blue-50' : 'bg-green-50'
                        }`}>
                          <FileText className={`h-6 w-6 ${
                            doc.isManual ? 'text-blue-600' : 'text-green-600'
                          }`} />
                        </div>
                      </div>
                      
                      {/* Document Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate text-base mb-1">
                              {doc.documentName}
                            </h4>
                            
                            {/* Badges */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getLinkTypeColor(doc.linkType)}`}>
                                {doc.linkType}
                              </span>
                              {doc.isManual ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  <Settings className="h-3 w-3" />
                                  Manual
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3" />
                                  Auto {doc.ruleName && `- ${doc.ruleName}`}
                                </span>
                              )}
                              {doc.filingCategoryName && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  📁 {doc.filingCategoryName}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {doc.userPermissions?.canView && (
                              <button
                                onClick={() => handleViewDocument(doc.documentId)}
                                className="p-2 rounded hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-colors"
                                title="View Document"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            {canEdit && doc.linkId && (
                              <button
                                onClick={() => handleDeleteLinkClick(doc.linkId!, doc.documentName, doc.isManual)}
                                className="p-2 rounded hover:bg-red-100 text-gray-600 hover:text-red-700 transition-colors"
                                title={doc.isManual ? "Remove Manual Link" : "Remove Auto Link"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Owner & Email */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <UserAvatar user={doc.ownedBy as any} size="sm" />
                            <div>
                              <div className="text-sm font-medium text-gray-700">
                                {doc.ownedBy.firstName} {doc.ownedBy.lastName}
                              </div>
                              {doc.ownedBy.email && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Mail className="h-3 w-3" />
                                  <span>{doc.ownedBy.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Metadata Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                          {/* Folder Path */}
                          {doc.path && (
                            <div className="flex items-center gap-1">
                              <FolderOpen className="h-3 w-3 text-gray-400" />
                              <span className="truncate" title={doc.path}>{doc.path}</span>
                            </div>
                          )}
                          
                          {/* File Size */}
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-gray-400" />
                            <span>{formatFileSize(doc.sizeBytes)}</span>
                          </div>
                          
                          {/* Created Date */}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>{formatDate(doc.documentCreatedAt)}</span>
                          </div>
                        </div>
                        
                        {/* Description if available */}
                        {doc.documentDescription && (
                          <p className="text-sm text-gray-600 mt-3 p-2 bg-gray-50 rounded italic border-l-2 border-blue-300">
                            {doc.documentDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No related documents found</h3>
              <p className="text-sm text-gray-500">
                {searchQuery || linkTypeFilter !== 'all' || isManualFilter !== undefined || fromDate || toDate
                  ? 'Try adjusting your filters or search criteria.'
                  : 'This document has no related documents yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && relatedDocuments.length > 0 && (
          <div className="px-6 pb-4">
            <SearchPagination
              totalPages={totalPages}
              currentPage={page}
              totalElements={totalElements}
              itemsPerPage={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Showing {relatedDocuments.length} of {totalElements} document{totalElements !== 1 ? 's' : ''}
          </div>
          <Button onClick={handleClose} variant="outline">
            Close
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && linkToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Remove Document Link
                </h3>
              </div>
              
              <p className="text-gray-600 mb-2">
                Are you sure you want to remove the link to{' '}
                <span className="font-medium text-gray-900">"{linkToDelete.documentName}"</span>?
              </p>
              
              {!linkToDelete.isManual && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 mb-4">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">This is an automatic link</p>
                    <p className="text-xs mt-1">It was created by a link rule and may be recreated automatically.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDeleteLink}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteLink}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Remove Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
