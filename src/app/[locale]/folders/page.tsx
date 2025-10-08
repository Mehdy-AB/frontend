// app/folders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Folder, 
  MoreVertical, 
  Users, 
  Lock, 
  Globe, 
  Calendar,
  User,
  Download,
  Share2,
  Edit,
  Trash2,
  Plus,
  Grid,
  List,
  Search,
  Filter,
  Upload,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { notificationApiClient } from '@/api/notificationClient';
import { FolderResDto, PageResponse, SortFields } from '@/types/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { CommentCountBadge } from '../../components/comments';
import FileUploadModal from '@/components/modals/FileUploadModal';
import CreateFolderModal from '@/components/modals/CreateFolderModal';
import RenameFolderModal from '@/components/modals/RenameFolderModal';

// Types from API
type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'size';
type FilterOption = 'all' | 'my' | 'shared' | 'public';

export default function FoldersPage() {
  const { t } = useLanguage();
  const [folders, setFolders] = useState<FolderResDto[]>([]);
  const [pageData, setPageData] = useState<PageResponse<FolderResDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0); // API uses 0-based pagination
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [pageSize] = useState(12);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameFolder, setRenameFolder] = useState<{ id: number; name: string } | null>(null);

  // Real API call to fetch folders
  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sortField = sortBy as SortFields;
      
      let response: PageResponse<FolderResDto>;
      
      if (filterBy === 'shared') {
        // Get shared folders
        const sharedData = await notificationApiClient.getSharedFolders({
          page: currentPage,
          size: pageSize,
          name: searchQuery || undefined,
          desc: sortDesc,
          sort: sortField,
          showFolder: true
        });
        
        // Convert to PageResponse format
        response = {
          content: sharedData.folders || [],
          page: {
            page: currentPage,
            size: pageSize,
            totalElements: sharedData.page?.totalElements || 0,
            totalPages: sharedData.page?.totalPages || 0,
            first: currentPage === 0,
            last: currentPage >= (sharedData.page?.totalPages || 1) - 1
          }
        };
      } else {
        // Get regular folders (repository)
        response = await notificationApiClient.getRepository({
          page: currentPage,
          size: pageSize,
          name: searchQuery || undefined,
          desc: sortDesc,
          sort: sortField
        });
      }
      
      setFolders(response.content);
      setPageData(response);
    } catch (err: any) {
      console.error('Error fetching folders:', err);
      setError(err.message || 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch folders when dependencies change
  useEffect(() => {
    fetchFolders();
  }, [currentPage, searchQuery, sortBy, sortDesc, filterBy]);
  
  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 0) {
        setCurrentPage(0); // Reset to first page on search
      } else {
        fetchFolders();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Folder operations
  const handleCreateFolder = () => {
    setShowCreateModal(true);
  };
  
  const handleUploadFiles = () => {
    setShowUploadModal(true);
  };

  const handleRenameFolder = (folderId: number, currentName: string) => {
    setRenameFolder({ id: folderId, name: currentName });
    setShowRenameModal(true);
  };

  const handleDeleteFolder = async (folderId: number, folderName: string) => {
    if (!confirm(`Are you sure you want to delete "${folderName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await notificationApiClient.deleteFolder(folderId);
      fetchFolders(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDownloadFolder = async (folderId: number) => {
    // This would need to be implemented on the backend
    alert('Download folder functionality not yet implemented');
  };

  const handleShareFolder = async (folderId: number) => {
    // This would open a share modal
    alert('Share folder functionality not yet implemented');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-muted rounded w-64 animate-pulse shimmer"></div>
          <div className="flex gap-3">
            <div className="h-10 bg-muted rounded w-32 animate-pulse shimmer"></div>
            <div className="h-10 bg-muted rounded w-10 animate-pulse shimmer"></div>
            <div className="h-10 bg-muted rounded w-10 animate-pulse shimmer"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded w-3/4 mb-2 shimmer"></div>
                <div className="h-4 bg-muted rounded w-full mb-4 shimmer"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-20 shimmer"></div>
                  <div className="h-4 bg-muted rounded w-16 shimmer"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CardContent className="text-center">
          <div className="text-destructive text-lg mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('folders.title')}</h1>
          <p className="text-muted-foreground">
            {pageData?.totalElements || 0} folders • {formatFileSize(folders.reduce((acc, folder) => acc + folder.size, 0))} total
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* View Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleUploadFiles}>
              <Upload className="h-4 w-4" />
              Upload Files
            </Button>
            <Button className="gap-2" onClick={handleCreateFolder}>
              <Plus className="h-4 w-4" />
              New Folder
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              <SelectItem value="my">My Folders</SelectItem>
              <SelectItem value="shared">Shared with me</SelectItem>
              <SelectItem value="public">Public Folders</SelectItem>
            </SelectContent>
          </Select>
          <Select value={`${sortBy}-${sortDesc ? 'desc' : 'asc'}`} onValueChange={(value) => {
            const [field, direction] = value.split('-');
            setSortBy(field as SortOption);
            setSortDesc(direction === 'desc');
          }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Sort by: Name A-Z</SelectItem>
              <SelectItem value="name-desc">Sort by: Name Z-A</SelectItem>
              <SelectItem value="updatedAt-desc">Sort by: Newest</SelectItem>
              <SelectItem value="updatedAt-asc">Sort by: Oldest</SelectItem>
              <SelectItem value="size-desc">Sort by: Size (Large)</SelectItem>
              <SelectItem value="size-asc">Sort by: Size (Small)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Folders Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {folders.map((folder) => (
            <FolderCard 
              key={folder.id} 
              folder={folder} 
              formatFileSize={formatFileSize} 
              formatDate={formatDate}
              onRename={(id, name) => handleRenameFolder(id, name)}
              onDelete={(id, name) => handleDeleteFolder(id, name)}
              onDownload={handleDownloadFolder}
              onShare={handleShareFolder}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
              <th className="text-left p-4 text-sm font-medium">Name</th>
              <th className="text-left p-4 text-sm font-medium">Owner</th>
              <th className="text-left p-4 text-sm font-medium">Size</th>
              <th className="text-left p-4 text-sm font-medium">Last Modified</th>
              <th className="text-left p-4 text-sm font-medium">Visibility</th>
              <th className="text-left p-4 text-sm font-medium">Comments</th>
              <th className="text-left p-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
              {folders.map((folder) => (
                <FolderRow 
                  key={folder.id} 
                  folder={folder} 
                  formatFileSize={formatFileSize} 
                  formatDate={formatDate}
                  onRename={(id, name) => handleRenameFolder(id, name)}
                  onDelete={(id, name) => handleDeleteFolder(id, name)}
                  onDownload={handleDownloadFolder}
                  onShare={handleShareFolder}
                />
              ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pageData && pageData.totalPages > 1 && (
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {folders.length} of {pageData.totalElements} folders
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
              disabled={pageData.first}
            >
              Previous
            </Button>
            {[...Array(Math.min(pageData.totalPages, 5))].map((_, i) => {
              const pageNumber = currentPage > 2 ? currentPage - 2 + i : i;
              if (pageNumber >= pageData.totalPages) return null;
              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                  className="w-9"
                >
                  {pageNumber + 1}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageData.totalPages - 1))}
              disabled={pageData.last}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* Modals */}
      <CreateFolderModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        parentId={0}
        onSuccess={fetchFolders}
      />
      
      <FileUploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        folderId={0} // Root folder for now
        onSuccess={fetchFolders}
      />
      
      <RenameFolderModal 
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setRenameFolder(null);
        }}
        folderId={renameFolder?.id || null}
        currentName={renameFolder?.name || ''}
        onSuccess={fetchFolders}
      />
    </div>
  );
}

// Folder Card Component for Grid View
function FolderCard({ 
  folder, 
  formatFileSize, 
  formatDate,
  onRename,
  onDelete,
  onDownload,
  onShare
}: { 
  folder: FolderResDto; 
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number, name: string) => void;
  onDownload: (id: number) => void;
  onShare: (id: number) => void;
}) {
  return (
    <Card className="group hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Folder className="h-6 w-6 text-primary" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRename(folder.id, folder.name)}>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(folder.id)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                Comments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(folder.id)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(folder.id, folder.name)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-medium mb-1 truncate">{folder.name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{folder.description}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(folder.updatedAt)}
            </span>
            <span>{formatFileSize(folder.size)}</span>
          </div>
        <div className="flex items-center gap-2">
            <Badge variant={folder.isPublic ? "outline" : "secondary"} className="h-5 px-1">
          {folder.isPublic ? (
                <><Globe className="h-3 w-3 mr-1" />Public</>
          ) : (
                <><Lock className="h-3 w-3 mr-1" />Private</>
          )}
            </Badge>
            <CommentCountBadge 
              entityType="FOLDER" 
              entityId={folder.id} 
              showIcon={true}
              className="text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Folder Row Component for List View
function FolderRow({ 
  folder, 
  formatFileSize, 
  formatDate,
  onRename,
  onDelete,
  onDownload,
  onShare
}: { 
  folder: FolderResDto; 
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number, name: string) => void;
  onDownload: (id: number) => void;
  onShare: (id: number) => void;
}) {
  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/50 group">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Folder className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">{folder.name}</div>
            <div className="text-sm text-muted-foreground">{folder.description}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm">{folder.ownedBy.firstName} {folder.ownedBy.lastName}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-muted-foreground">{formatFileSize(folder.size)}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-muted-foreground">{formatDate(folder.updatedAt)}</div>
      </td>
      <td className="p-4">
        <Badge variant={folder.isPublic ? "outline" : "secondary"}>
          {folder.isPublic ? (
            <><Globe className="h-3 w-3 mr-1" />Public</>
          ) : (
            <><Lock className="h-3 w-3 mr-1" />Private</>
          )}
        </Badge>
      </td>
      <td className="p-4">
        <CommentCountBadge 
          entityType="FOLDER" 
          entityId={folder.id} 
          showIcon={true}
          className="text-sm"
        />
      </td>
      <td className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRename(folder.id, folder.name)}>
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShare(folder.id)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MessageSquare className="mr-2 h-4 w-4" />
              Comments
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(folder.id)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(folder.id, folder.name)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Move to Trash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}