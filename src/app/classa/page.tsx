'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { notificationApiClient } from '@/api/notificationClient';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  File as FileIcon,
  FileText,
  CheckCircle,
  Trash2,
  Calendar,
  RefreshCw,
  ChevronDown,
  Folder,
  Info
} from 'lucide-react';
import React from 'react';
import { unclassifiedDocumentService } from '@/api/services/unclassifiedDocumentService';
import { UnclassifiedDocumentResponseDto, UnclassifiedDocumentSearchRequestDto } from '@/types/api';
import { useLanguage } from '@/contexts/LanguageContext';
import ClassAValidationModal from '@/components/modals/ClassAValidationModal';
import ClassAFilterPanel, { ClassAFilters } from '@/components/modals/ClassAFilterPanel';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';

export default function ClassAPage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<UnclassifiedDocumentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<UnclassifiedDocumentResponseDto | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<ClassAFilters>({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<UnclassifiedDocumentResponseDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkValidating, setBulkValidating] = useState(false);
  const [validationQueue, setValidationQueue] = useState<number[]>([]);
  const [expandedModelId, setExpandedModelId] = useState<number | null>(null);
  const [modelDetails, setModelDetails] = useState<Record<number, any>>({});
  const router = useRouter();
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExpandedModelId(null);
      }
    };

    if (expandedModelId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedModelId]);

  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'size'>('createdAt');
  const [sortDesc, setSortDesc] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pageSize = 20;

  const fetchDocuments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // Prepare search request
      const searchRequest: UnclassifiedDocumentSearchRequestDto = {
        query: filters.query || searchTerm,
        userId: filters.userId,
        categoryId: filters.categoryId || selectedCategory || undefined,
        // name is removed - query handles name search with "starts with"
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        exactDate: filters.exactDate,
        page: currentPage,
        size: pageSize,
        sortBy: sortBy,
        sortDirection: sortDesc ? 'desc' : 'asc'
      };

      const response = await unclassifiedDocumentService.searchUnclassifiedDocuments(searchRequest);
      setDocuments(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Error fetching unclassified documents:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };


  useEffect(() => {
    fetchDocuments();
  }, [currentPage, searchTerm, selectedCategory, filters, sortBy, sortDesc]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0); // Reset to first page when searching
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDocuments(false);
  };

  const handleValidateDocument = (document: UnclassifiedDocumentResponseDto) => {
    // Navigate to full-page validation view
    // Pass current page documents as queue for next/previous navigation
    const queue = documents.map(d => d.id);
    router.push(`/classa/${document.id}?queue=${encodeURIComponent(JSON.stringify(queue))}`);
  };


  const handleDeleteDocument = (document: UnclassifiedDocumentResponseDto) => {
    setDocumentToDelete(document);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      setDeleting(true);
      await unclassifiedDocumentService.deleteUnclassifiedDocument(documentToDelete.id);
      fetchDocuments(false); // Refresh without showing skeleton
      setShowDeleteConfirmation(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkValidate = async () => {
    try {
      setBulkValidating(true);

      // Get all document IDs for sequential validation (sorted ascending)
      const documentIds = await unclassifiedDocumentService.getAllUnclassifiedDocumentIds();

      if (documentIds.length === 0) {
        setBulkValidating(false);
        return;
      }

      // Navigate to first document with full queue
      const firstDocumentId = documentIds[0];
      router.push(`/classa/${firstDocumentId}?queue=${encodeURIComponent(JSON.stringify(documentIds))}`);
    } catch (error) {
      console.error('Error fetching document IDs for bulk validation:', error);
    } finally {
      setBulkValidating(false);
    }
  };

  const handleDocumentValidated = async () => {
    // Remove the validated document from queue
    const remainingQueue = validationQueue.slice(1);
    setValidationQueue(remainingQueue);

    // Close modal first to prevent download triggers
    setShowValidationModal(false);
    setSelectedDocument(null);

    // Small delay before opening next modal to prevent download issues
    if (remainingQueue.length > 0) {
      setTimeout(async () => {
        try {
          // Fetch the next document by ID
          const nextDocumentId = remainingQueue[0];
          const nextDocument = await unclassifiedDocumentService.getUnclassifiedDocumentById(nextDocumentId);
          setSelectedDocument(nextDocument as any);
          setShowValidationModal(true);
        } catch (error) {
          console.error('Error fetching next document for validation:', error);
          // Skip this document and continue with the next one
          if (remainingQueue.length > 1) {
            const nextQueue = remainingQueue.slice(1);
            setValidationQueue(nextQueue);
            const nextId = nextQueue[0];
            const nextDoc = await unclassifiedDocumentService.getUnclassifiedDocumentById(nextId);
            setSelectedDocument(nextDoc as any);
            setShowValidationModal(true);
          } else {
            setBulkValidating(false);
            fetchDocuments(); // Refresh the list
          }
        }
      }, 300);
    } else {
      // All documents validated
      setBulkValidating(false);
      fetchDocuments(); // Refresh the list
    }
  };

  const handleApplyFilters = (newFilters: ClassAFilters) => {
    setFilters(newFilters);
    setCurrentPage(0); // Reset to first page when applying filters
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.userId) count++;
    if (filters.categoryId) count++;
    if (filters.dateFrom || filters.dateTo || filters.exactDate) count++;
    return count;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-GB', { month: 'short' }).toLowerCase();
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  };

  const getFileIcon = (_mimeType: string) => {
    return <FileIcon className="h-5 w-5 text-muted-foreground" />;
  };

  // Navigate to folder by path
  const navigateToPath = async (path: string) => {
    if (!path) return;
    try {
      const response = await notificationApiClient.getFolderIdByPath(path);
      router.push(`/folders/${response.id}`);
    } catch (error) {
      console.error('Error navigating to path:', error);
    }
  };

  // Format folder path (remove first segment if it's UUID)
  const formatFolderPath = (path: string | undefined): string[] => {
    if (!path) return [];
    const segments = path.split('.').filter(s => s.trim() !== '');

    // Check if first segment is UUID
    const uuidPatternDash = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const uuidPatternUnderscore = /^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$/i;
    const firstSegmentIsUuid = segments.length > 0 &&
      (uuidPatternDash.test(segments[0]) || uuidPatternUnderscore.test(segments[0]));

    // Remove UUID segment if present
    return firstSegmentIsUuid ? segments.slice(1) : segments;
  };

  // Get document type from mime type
  const getDocumentType = (mimeType: string): string => {
    if (!mimeType) return 'Unknown';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint';
    if (mimeType.includes('image')) return 'Image';
    if (mimeType.includes('text')) return 'Text';
    return mimeType.split('/')[1]?.toUpperCase() || 'Document';
  };

  // Load model details for hover display
  const loadModelDetails = async (docId: number) => {
    if (modelDetails[docId]) return; // Already loaded

    try {
      const detail = await unclassifiedDocumentService.getUnclassifiedDocumentById(docId);
      setModelDetails(prev => ({ ...prev, [docId]: detail }));
    } catch (e) {
      console.error('Failed to load model details', e);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <FileIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Unclassified Documents</h1>
              <p className="text-gray-500 font-medium">Process and validate incoming documents</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-4 w-full lg:w-auto">
          <div className="flex-1 lg:flex-none bg-white p-3 rounded-xl border border-gray-100 shadow-sm min-w-[140px]">
            <div className="text-sm text-gray-500 font-medium mb-1">Total Pending</div>
            <div className="text-2xl font-bold text-gray-900">{totalElements}</div>
          </div>
          <div className="flex-1 lg:flex-none bg-white p-3 rounded-xl border border-gray-100 shadow-sm min-w-[140px]">
            <div className="text-sm text-gray-500 font-medium mb-1">In Queue</div>
            <div className="text-2xl font-bold text-blue-600">{validationQueue.length > 0 ? validationQueue.length : '-'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="h-10 px-4 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleBulkValidate}
            disabled={documents.length === 0 || bulkValidating}
            className="h-10 px-6 bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl border-0"
          >
            {bulkValidating ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                Validating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Start Validate
              </>
            )}
          </Button>
        </div>
      </div>


      {/* Search and Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4 p-1">
        <div className="flex-1 flex gap-4 p-1.5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          {/* Search Section */}
          <div className="flex-1">
            <ServerSearchInput
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search documents..."
              className="h-11 border-0 bg-transparent focus-visible:ring-0 px-4 text-base placeholder:text-gray-400"
            />
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200 my-2"></div>

          {/* Filter Button */}
          <Button
            variant="ghost"
            onClick={() => setShowFilterPanel(true)}
            className="h-auto px-4 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1.5 bg-blue-100 text-blue-700">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>

          {/* Divider */}
          <div className="w-px bg-gray-200 my-2"></div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 pr-2">
            <Select value={`${sortBy}-${sortDesc ? 'desc' : 'asc'}`} onValueChange={(value) => {
              const [field, direction] = value.split('-');
              setSortBy(field as 'name' | 'createdAt' | 'size');
              setSortDesc(direction === 'desc');
            }}>
              <SelectTrigger className="w-[180px] h-9 border-0 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium focus:ring-0 transition-colors rounded-xl">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="size-desc">Size (Large)</SelectItem>
                <SelectItem value="size-asc">Size (Small)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/4 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-1/6 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No unclassified documents</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                All documents have been processed and moved to the main repository.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-50 hover:to-gray-100 border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-700 pl-6 py-4">Document</TableHead>
                      <TableHead className="font-semibold text-gray-700">Model</TableHead>
                      <TableHead className="font-semibold text-gray-700">Type</TableHead>
                      <TableHead className="font-semibold text-gray-700">Size</TableHead>
                      <TableHead className="font-semibold text-gray-700">Created</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc, index) => {
                      const pathSegments = formatFolderPath(doc.folderPath);
                      const isModelExpanded = expandedModelId === doc.id;
                      const modelDetail = modelDetails[doc.id];

                      return (
                        <React.Fragment key={doc.id}>
                          <TableRow
                            className={`group transition-all duration-200 border-b border-gray-100 last:border-0 cursor-pointer
                              ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                              hover:bg-blue-50/50 hover:shadow-sm`}
                            onClick={() => handleValidateDocument(doc)}
                          >
                            <TableCell className="pl-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                                  {getFileIcon(doc.mimeType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate max-w-[280px]" title={doc.name}>
                                    {doc.name}
                                  </div>
                                  {pathSegments.length > 0 && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); navigateToPath(doc.folderPath || ''); }}
                                      className="flex cursor-pointer hover:text-blue-600 hover:underline transition-colors items-center gap-1 text-xs text-gray-400 mt-1"
                                    >
                                      <Folder className="h-3 w-3" />
                                      {pathSegments.join(' / ')}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="relative group/model">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100 shadow-sm cursor-help">
                                  {doc.categoryName || 'Unclassified'}
                                  <Info className="h-3 w-3 opacity-50" />
                                </div>

                                {/* Hover Popup with Category Details */}
                                <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50 opacity-0 invisible group-hover/model:opacity-100 group-hover/model:visible transition-all duration-200">
                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-1">{doc.categoryName || 'Unclassified'}</h4>
                                      {doc.categoryDescription && (
                                        <p className="text-sm text-gray-600">{doc.categoryDescription}</p>
                                      )}
                                    </div>

                                    {doc.metadataDefinitions && doc.metadataDefinitions.length > 0 ? (
                                      <div>
                                        <div className="text-xs font-medium text-gray-700 mb-2">Metadata Fields ({doc.metadataDefinitions.length})</div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                          {doc.metadataDefinitions.map((def: any, idx: number) => {
                                            const isList = String(def.dataType || '').toUpperCase() === 'LIST';
                                            const options = def.list?.option || [];

                                            return (
                                              <div key={def.id || idx} className="text-xs border border-gray-200 rounded-lg p-2 bg-gray-50">
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className="font-medium text-gray-900">{def.key}</span>
                                                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                                    {(def.dataType || '').toLowerCase()}
                                                  </Badge>
                                                </div>
                                                {def.mandatory && (
                                                  <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Required</span>
                                                )}
                                                {isList && options.length > 0 && (
                                                  <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                                                    <div className="text-[10px] text-gray-500 mb-1">Options:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                      {options.slice(0, 5).map((opt: string, optIdx: number) => (
                                                        <span key={optIdx} className="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-600">
                                                          {opt}
                                                        </span>
                                                      ))}
                                                      {options.length > 5 && (
                                                        <span className="text-[10px] px-1.5 py-0.5 text-gray-400">+{options.length - 5} more</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500">No metadata fields defined for this category.</p>
                                    )}
                                  </div>
                                  {/* Arrow */}
                                  <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45"></div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Badge variant="outline" className="text-xs font-medium bg-gray-50 border-gray-200">
                                {getDocumentType(doc.mimeType)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm font-medium">{formatFileSize(doc.sizeBytes)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                {formatDate(doc.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleValidateDocument(doc)}
                                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1.5" />
                                  Validate
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc)}
                                  className="h-9 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Validation Modal */}
      {selectedDocument && (
        <ClassAValidationModal
          isOpen={showValidationModal}
          onClose={() => {
            setShowValidationModal(false);
            setSelectedDocument(null);
            if (bulkValidating) {
              setBulkValidating(false);
              setValidationQueue([]);
            }
            // Refresh list on close
            fetchDocuments();
          }}
          document={selectedDocument}
          onSuccess={handleDocumentValidated}
        />
      )}

      {/* Filter Panel */}
      <ClassAFilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setDocumentToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${documentToDelete?.title || documentToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={deleting}
      />

    </div>
  );
}
