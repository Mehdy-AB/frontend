'use client';

import { useState } from 'react';
import { 
  Share2, 
  Search, 
  Filter,
  MoreVertical,
  Download,
  Eye,
  Star,
  Calendar,
  User,
  FileText,
  RefreshCw,
  Grid,
  List,
  FolderOpen,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';
import { notificationApiClient } from '@/api/notificationClient';
import { useRouter } from 'next/navigation';

// Types
interface SharedDocument {
  id: number;
  name: string;
  title?: string;
  folderId: number;
  folderPath?: string;
  createdBy: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  ownedBy: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
  sizeBytes: number;
  mimeType: string;
  isPublic: boolean;
}

export default function SharedDocumentsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [userFilter, setUserFilter] = useState<string>('all');

  // Use server-side search hook
  const {
    displayData,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalElements,
    loading,
    tableLoading,
    error,
    fetchData
  } = useServerSideSearch<SharedDocument>({
    fetchFunction: async (page, searchTerm) => {
      try {
        const response = await notificationApiClient.getSharedDocuments({
          page,
          size: 20,
          query: searchTerm,
          sortBy,
          sortDir,
          userId: userFilter !== 'all' ? userFilter : undefined
        });
        return response;
      } catch (error) {
        console.error('Error fetching shared documents:', error);
        return { content: [], totalPages: 0, totalElements: 0 };
      }
    },
    searchFields: (doc) => [
      doc.name,
      doc.title || '',
      doc.ownedBy?.username || '',
      doc.ownedBy?.firstName || '',
      doc.ownedBy?.lastName || ''
    ],
    debounceMs: 800,
    fetchOnMount: true
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownload = async (doc: SharedDocument) => {
    try {
      await notificationApiClient.downloadDocument(doc.id);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleView = (doc: SharedDocument) => {
    router.push(`/documents/${doc.id}`);
  };

  const handleRefresh = async () => {
    await fetchData();
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [field, direction] = value.split('-');
    setSortBy(field);
    setSortDir(direction as 'asc' | 'desc');
    fetchData();
  };

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CardContent className="text-center">
          <div className="text-destructive text-lg mb-4">{error}</div>
          <Button onClick={handleRefresh}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-6">
        {/* Main Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500/10 to-green-500/20 rounded-xl flex items-center justify-center shadow-sm">
                <Share2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Shared Documents
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Documents shared with you by other users
                </p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="font-medium text-foreground">{totalElements || 0}</span>
                <span className="text-muted-foreground">documents</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="font-medium text-foreground">
                  {formatFileSize(displayData.reduce((acc, doc) => acc + (doc.sizeBytes || 0), 0))}
                </span>
                <span className="text-muted-foreground">total size</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || tableLoading}
              className="h-9 px-3"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(loading || tableLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Controls Bar */}
        <div className="flex flex-col lg:flex-row gap-4 p-4 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl border">
          {/* Search Section */}
          <div className="flex-1">
            <ServerSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search shared documents..."
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={`${sortBy}-${sortDir}`} onValueChange={handleSortChange}>
                <SelectTrigger className="w-48 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
                  <SelectItem value="updatedAt-asc">Least Updated</SelectItem>
                  <SelectItem value="createdAt-desc">Newest</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest</SelectItem>
                  <SelectItem value="sizeBytes-desc">Size (Large)</SelectItem>
                  <SelectItem value="sizeBytes-asc">Size (Small)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* View Toggle */}
            <div className="flex bg-background rounded-lg p-1 border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Show skeleton cards */}
          {loading && displayData.length === 0 && [...Array(8)].map((_, i) => (
            <Card key={`skeleton-${i}`} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Show actual document cards */}
          {displayData.map((doc) => (
            <DocumentCard 
              key={doc.id} 
              doc={doc} 
              formatFileSize={formatFileSize} 
              formatDate={formatDate}
              onDownload={handleDownload}
              onView={handleView}
            />
          ))}
          
          {/* Show empty state */}
          {!loading && displayData.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Share2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No shared documents</h3>
              <p className="text-muted-foreground mb-4 text-center">
                {searchQuery ? `No documents found matching "${searchQuery}"` : "No documents have been shared with you yet"}
              </p>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <div>
            <table className="w-full">
              <thead className="bg-gradient-to-r from-muted/30 to-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Name</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Shared By</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Size</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Last Modified</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Show skeleton rows */}
                {loading && displayData.length === 0 && [...Array(5)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b last:border-b-0">
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-4 animate-pulse"></div>
                    </td>
                  </tr>
                ))}
                
                {/* Show actual document rows */}
                {displayData.map((doc) => (
                  <DocumentRow 
                    key={doc.id} 
                    doc={doc} 
                    formatFileSize={formatFileSize} 
                    formatDate={formatDate}
                    onDownload={handleDownload}
                    onView={handleView}
                  />
                ))}
                
                {/* Show empty state */}
                {!loading && displayData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                          <Share2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-foreground mb-2">No shared documents</h3>
                          <p className="text-muted-foreground mb-4">
                            {searchQuery ? `No documents found matching "${searchQuery}"` : "No documents have been shared with you yet"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Loading indicator */}
      {tableLoading && (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          Loading comprehensive results...
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={20}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

// Document Card Component for Grid View
function DocumentCard({ 
  doc, 
  formatFileSize, 
  formatDate,
  onDownload,
  onView
}: { 
  doc: SharedDocument; 
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  onDownload: (doc: SharedDocument) => void;
  onView: (doc: SharedDocument) => void;
}) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 hover:border-green-500/20 cursor-pointer" onClick={() => onView(doc)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500/10 to-blue-500/20 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
            <FileText className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(doc); }}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(doc); }}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <h3 className="font-medium mb-1 truncate">{doc.name}</h3>
          <p className="text-sm text-muted-foreground mb-3 truncate">{doc.title || 'No title'}</p>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {doc.ownedBy.firstName} {doc.ownedBy.lastName}
            </span>
            <span>{formatFileSize(doc.sizeBytes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(doc.updatedAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Document Row Component for List View
function DocumentRow({ 
  doc, 
  formatFileSize, 
  formatDate,
  onDownload,
  onView
}: { 
  doc: SharedDocument; 
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  onDownload: (doc: SharedDocument) => void;
  onView: (doc: SharedDocument) => void;
}) {
  return (
    <tr className="border-b last:border-b-0 hover:bg-gradient-to-r hover:from-muted/30 hover:to-muted/50 group transition-all duration-200 cursor-pointer" onClick={() => onView(doc)}>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500/10 to-blue-500/20 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
            <FileText className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
          </div>
          <div>
            <div className="font-medium">{doc.name}</div>
            <div className="text-sm text-muted-foreground truncate max-w-xs">{doc.title || 'No title'}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm">{doc.ownedBy.firstName} {doc.ownedBy.lastName}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-muted-foreground">{formatFileSize(doc.sizeBytes)}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-muted-foreground">{formatDate(doc.updatedAt)}</div>
      </td>
      <td className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(doc); }}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(doc); }}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}



