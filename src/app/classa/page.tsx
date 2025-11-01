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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  File as FileIcon, 
  Eye, 
  CheckCircle,
  Trash2,
  Calendar,
  User
} from 'lucide-react';
import { unclassifiedDocumentService } from '@/api/services/unclassifiedDocumentService';
import { UnclassifiedDocumentResponseDto, UnclassifiedDocumentSearchRequestDto } from '@/types/api';
import { useLanguage } from '@/contexts/LanguageContext';
import ClassAValidationModal from '@/components/modals/ClassAValidationModal';
import ClassAFilterPanel, { ClassAFilters } from '@/components/modals/ClassAFilterPanel';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

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
  const [validationQueue, setValidationQueue] = useState<UnclassifiedDocumentResponseDto[]>([]);
  const [showModelModal, setShowModelModal] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelDetails, setModelDetails] = useState<any | null>(null);

  const pageSize = 20;

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      // Prepare search request
      const searchRequest: UnclassifiedDocumentSearchRequestDto = {
        query: filters.query || searchTerm,
        userId: filters.userId,
        categoryId: filters.categoryId || selectedCategory || undefined,
        name: filters.name,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        exactDate: filters.exactDate,
        page: currentPage,
        size: pageSize
      };
      
      const response = await unclassifiedDocumentService.searchUnclassifiedDocuments(searchRequest);
      setDocuments(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Error fetching unclassified documents:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDocuments();
  }, [currentPage, searchTerm, selectedCategory, filters]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0); // Reset to first page when searching
  };

  const handleValidateDocument = (document: UnclassifiedDocumentResponseDto) => {
    setSelectedDocument(document);
    setShowValidationModal(true);
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
      fetchDocuments(); // Refresh the list
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
      
      // Fetch ALL unclassified documents ordered by ID ascending
      const response = await unclassifiedDocumentService.searchUnclassifiedDocuments({
        page: 0,
        size: 1000, // Large size to get all documents
        sortBy: 'id',
        sortDirection: 'asc'
      });
      
      const allDocuments = response.content || [];
      
      if (allDocuments.length === 0) {
        setBulkValidating(false);
        return;
      }
      
      setValidationQueue(allDocuments);
      setSelectedDocument(allDocuments[0]);
      setShowValidationModal(true);
    } catch (error) {
      console.error('Error fetching documents for bulk validation:', error);
      setBulkValidating(false);
    }
  };

  const handleDocumentValidated = () => {
    setShowValidationModal(false);
    setSelectedDocument(null);
    
    // Remove the validated document from queue
    const remainingQueue = validationQueue.slice(1);
    setValidationQueue(remainingQueue);
    
    if (remainingQueue.length > 0) {
      // Continue with next document
      setSelectedDocument(remainingQueue[0]);
      setShowValidationModal(true);
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
    if (filters.name) count++;
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

  const renderUserInfo = (user: any) => {
    if (!user) return 'Unknown';
    const display = user.displayName || user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Unknown';
    const email = user.email ? ` ${user.email}` : '';
    const avatar = user.imageUrl || user.imgUrl;
    return (
      <span className="flex items-center gap-2">
        {avatar && <img src={avatar} alt={display} className="h-5 w-5 rounded-full object-cover" />}
        <div className='flex flex-col'>
        <span>{display}</span>
        <span>{email}</span>
        </div>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Unclassified Documents</h1>
          <p className="text-muted-foreground">
            Process documents that need metadata validation before moving to the main repository
          </p>
        </div>
        <Button 
          onClick={handleBulkValidate}
          disabled={documents.length === 0 || bulkValidating}
          className="flex items-center gap-2"
        >
          {bulkValidating ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              Validating... ({validationQueue.length} remaining)
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Start Validate
            </>
          )}
        </Button>
      </div>


      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilterPanel(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1.5">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents Requiring Validation</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="text-muted-foreground">Loading documents...</span>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No unclassified documents</h3>
              <p className="text-muted-foreground">
                All documents have been processed and moved to the main repository.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span>{getFileIcon(doc.mimeType)}</span>
                          <div>
                            <div className="font-medium">{doc.title}</div>
                            <div className="text-sm text-muted-foreground">{doc.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          className="underline text-blue-600 hover:text-blue-800"
                          onClick={async () => {
                            try {
                              setShowModelModal(true);
                              setModelLoading(true);
                              const detail = await unclassifiedDocumentService.getUnclassifiedDocumentById(doc.id);
                              setModelDetails(detail);
                            } catch (e) {
                              console.error('Failed to load model details', e);
                              setModelDetails(null);
                            } finally {
                              setModelLoading(false);
                            }
                          }}
                          title="View model details"
                        >
                          <Badge variant="outline">{doc.categoryName}</Badge>
                        </button>
                      </TableCell>
                      <TableCell>{formatFileSize(doc.sizeBytes)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(doc.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderUserInfo(doc.ownedBy)}
                      </TableCell>
                      <TableCell>
                        {renderUserInfo(doc.createdBy)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleValidateDocument(doc)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Validate & Move
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteDocument(doc)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {documents.length} of {totalElements} documents
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPage >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
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
        message={`Are you sure you want to delete "${documentToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={deleting}
      />

      {/* Model Details Modal */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Model details</h3>
              <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => { setShowModelModal(false); setModelDetails(null); }}>
                Close
              </button>
            </div>
            {modelLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            ) : modelDetails ? (
              <div className="space-y-3">
                <div>
                  <div className="text-lg font-medium">{modelDetails.categoryName}</div>
                  {modelDetails.categoryDescription && (
                    <div className="text-sm text-muted-foreground">{modelDetails.categoryDescription}</div>
                  )}
                </div>
                {modelDetails.metadataDefinitions && modelDetails.metadataDefinitions.length > 0 ? (
                  <div>
                    <div className="text-sm font-medium mb-2">Metadata fields</div>
                    <ul className="space-y-1 max-h-64 overflow-auto pr-1">
                      {modelDetails.metadataDefinitions.map((def: any) => {
                        const isList = String(def.dataType || '').toUpperCase() === 'LIST';
                        const listData = def.list || {};
                        const options = Array.isArray(listData.option) ? listData.option : (Array.isArray(listData.options) ? listData.options : []);
                        const customAllowed = listData.mandatory === true; // per spec: mandatory=true allows custom
                        return (
                          <li key={def.id || def.metadataId} className="text-sm border rounded px-2 py-1">
                            <div className="flex items-center justify-between">
                              <span className="truncate">
                                <span className="font-medium">{def.key || def.metadataName}</span>
                                <span className="text-xs text-gray-500">{' '}({(def.dataType || '').toString().toLowerCase()})</span>
                              </span>
                              {def.mandatory && <span className="text-xs text-red-500">required</span>}
                            </div>
                            {isList && (
                              <div className="mt-2 pl-1">
                                <div className="text-xs text-gray-600 mb-1">Options:</div>
                                {options.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {options.map((opt: any, idx: number) => (
                                      <span key={idx} className="text-xs px-2 py-0.5 border rounded bg-gray-50">{String(opt.name)}</span>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400 italic">No options defined</div>
                                )}
                                <div className="text-xs mt-1 {customAllowed ? 'text-green-600' : 'text-gray-500'}">
                                  {customAllowed ? 'Custom values allowed' : 'Custom values not allowed'}
                                </div>
                                {listData.description && (
                                  <div className="text-xs text-gray-500 mt-1">{listData.description}</div>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No metadata defined.</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-red-600">Failed to load model details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
