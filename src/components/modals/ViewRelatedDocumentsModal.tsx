'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  Calendar, 
  User, 
  Filter,
  Eye,
  Download,
  Unlink,
  Settings,
  CheckCircle,
  Loader2,
  ChevronDown,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DocumentService } from '../../api/services/documentService';
import { RelatedDocumentResponseDto } from '../../types/api';
import { formatFileSize, formatDate, getLinkTypeColor } from '../../utils/documentUtils';

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

const MIME_TYPES = [
  { value: 'all', label: 'All File Types' },
  { value: 'application/pdf', label: 'PDF' },
  { value: 'application/msword', label: 'Word (DOC)' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word (DOCX)' },
  { value: 'application/vnd.ms-excel', label: 'Excel (XLS)' },
  { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel (XLSX)' },
  { value: 'application/vnd.ms-powerpoint', label: 'PowerPoint (PPT)' },
  { value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PowerPoint (PPTX)' },
  { value: 'image/jpeg', label: 'JPEG Image' },
  { value: 'image/png', label: 'PNG Image' },
  { value: 'image/gif', label: 'GIF Image' },
  { value: 'image/svg+xml', label: 'SVG Image' },
  { value: 'text/plain', label: 'Text File' },
  { value: 'text/csv', label: 'CSV File' },
  { value: 'application/zip', label: 'ZIP Archive' },
  { value: 'application/x-rar-compressed', label: 'RAR Archive' }
];

export default function ViewRelatedDocumentsModal({ 
  isOpen, 
  onClose, 
  onLinkDeleted,
  sourceDocumentId,
  sourceDocumentName,
  canEdit
}: ViewRelatedDocumentsModalProps) {
  const [relatedDocuments, setRelatedDocuments] = useState<RelatedDocumentResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 15;
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [linkTypeFilter, setLinkTypeFilter] = useState('all');
  const [isManualFilter, setIsManualFilter] = useState<boolean | undefined>(undefined);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [mimeType, setMimeType] = useState('all');
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRelatedDocuments(0);
    }
  }, [isOpen]);

  const loadRelatedDocuments = async (page: number, append: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: any = {
        page,
        size: pageSize
      };
      
      if (searchQuery) params.search = searchQuery;
      if (linkTypeFilter && linkTypeFilter !== 'all') params.linkType = linkTypeFilter;
      if (isManualFilter !== undefined) params.isManual = isManualFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (mimeType && mimeType !== 'all') params.mimeType = mimeType;
      
      const response = await DocumentService.getRelatedDocuments(sourceDocumentId, params);
      
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
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    loadRelatedDocuments(0);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages - 1) {
      loadRelatedDocuments(currentPage + 1, true);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setLinkTypeFilter('all');
    setIsManualFilter(undefined);
    setFromDate('');
    setToDate('');
    setMimeType('all');
    loadRelatedDocuments(0);
  };

  const handleUnlink = async (linkId: number) => {
    if (!confirm('Are you sure you want to unlink this document?')) return;
    
    try {
      await DocumentService.deleteDocumentLink(linkId);
      loadRelatedDocuments(0);
      onLinkDeleted?.();
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

  const handleClose = () => {
    setSearchQuery('');
    setLinkTypeFilter('all');
    setIsManualFilter(undefined);
    setFromDate('');
    setToDate('');
    setMimeType('all');
    setRelatedDocuments([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl mx-4 max-h-[95vh] overflow-hidden flex flex-col">
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search documents..."
                  className="pl-10 h-9"
                />
              </div>
            </div>

            {/* Link Type */}
            <div>
              <Select value={linkTypeFilter} onValueChange={setLinkTypeFilter}>
                <SelectTrigger className="h-9">
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
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                  <SelectItem value="auto">Auto Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* MIME Type */}
            <div>
              <Select value={mimeType} onValueChange={setMimeType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="File Type" />
                </SelectTrigger>
                <SelectContent>
                  {MIME_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleSearch} size="sm" className="flex-1">
                <Search className="h-3 w-3 mr-1" />
                Search
              </Button>
              <Button onClick={handleClearFilters} size="sm" variant="outline">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Date Range (Collapsible) */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9"
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
          {isLoading && currentPage === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
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
                            <div className="flex items-center gap-2 flex-wrap">
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
                                  {doc.ruleName || 'Auto'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {doc.userPermissions?.canView && (
                              <button
                                onClick={() => handleViewDocument(doc.documentId)}
                                className="p-2 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                title="View Document"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            {doc.userPermissions?.canView && (
                              <button
                                onClick={() => handleDownloadDocument(doc.documentId)}
                                className="p-2 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                title="Download Document"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                            {canEdit && doc.isManual && (
                              <button
                                onClick={() => handleUnlink(doc.documentId)}
                                className="p-2 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"
                                title="Unlink Document"
                              >
                                <Unlink className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mt-3">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{doc.ownedBy.firstName} {doc.ownedBy.lastName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{formatFileSize(doc.sizeBytes)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">{doc.mimeType}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Linked {formatDate(doc.linkedAt)}</span>
                          </div>
                        </div>
                        
                        {/* Description if available */}
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{doc.description}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load More Button */}
              {currentPage < totalPages - 1 && (
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="w-full py-3 text-sm font-medium text-blue-600 hover:text-blue-800 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Load More ({relatedDocuments.length} of {totalElements})
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No related documents found</h3>
              <p className="text-sm text-gray-500">
                {searchQuery || (linkTypeFilter && linkTypeFilter !== 'all') || isManualFilter !== undefined || fromDate || toDate || (mimeType && mimeType !== 'all')
                  ? 'Try adjusting your filters or search criteria.'
                  : 'This document has no related documents yet.'}
              </p>
            </div>
          )}
        </div>

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
    </div>
  );
}

