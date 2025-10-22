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
  FileText, 
  Eye, 
  CheckCircle,
  Trash2,
  Calendar,
  User
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { ClassAResponseDto, PageResponse, ClassASearchRequestDto } from '@/types/api';
import { useLanguage } from '@/contexts/LanguageContext';
import ClassAValidationModal from '@/components/modals/ClassAValidationModal';
import ClassAFilterModal, { ClassAFilters } from '@/components/modals/ClassAFilterModal';

export default function ClassAPage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<ClassAResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<ClassAResponseDto | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<ClassAFilters>({});

  const pageSize = 20;

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      // Prepare search request
      const searchRequest: ClassASearchRequestDto = {
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
      
      const response = await apiClient.searchClassADocuments(searchRequest);
      setDocuments(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Error fetching ClassA documents:', error);
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

  const handleValidateDocument = (document: ClassAResponseDto) => {
    setSelectedDocument(document);
    setShowValidationModal(true);
  };

  const handleDocumentValidated = () => {
    setShowValidationModal(false);
    setSelectedDocument(null);
    fetchDocuments(); // Refresh the list
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await apiClient.deleteClassADocument(documentId);
        fetchDocuments(); // Refresh the list
      } catch (error) {
        console.error('Error deleting document:', error);
      }
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
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    return '📄';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Unclassified Documents</h1>
        <p className="text-muted-foreground">
          Process documents that need metadata validation before moving to the main repository
        </p>
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
                onClick={() => setShowFilterModal(true)}
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
                    <TableHead>Category</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(doc.mimeType)}</span>
                          <div>
                            <div className="font-medium">{doc.title}</div>
                            <div className="text-sm text-muted-foreground">{doc.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.categoryName}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(doc.sizeBytes)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(doc.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {doc.createdBy?.username || doc.createdBy?.firstName || 'Unknown'}
                        </div>
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
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteDocument(doc.id)}
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
          onClose={() => setShowValidationModal(false)}
          document={selectedDocument}
          onSuccess={handleDocumentValidated}
        />
      )}

      {/* Filter Modal */}
      <ClassAFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
    </div>
  );
}
