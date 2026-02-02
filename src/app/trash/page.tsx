'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Trash2,
  ArchiveRestore,
  RefreshCw,
  File,
  Folder,
  FileText,
  Eye,
  Filter
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { trashService, TrashItemDto } from '../../api/services/trashService';
import { notificationApiClient } from '../../api/notificationClient';
import ServerSearchInput from '../../components/main/ServerSearchInput';
import Pagination from '../../components/main/Pagination';
import UserAvatar from '../../components/main/UserAvatar';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { useNotifications } from '@/hooks/useNotifications';

export default function TrashPage() {
  const { t } = useLanguage();
  const { showError, showSuccess } = useNotifications();
  const router = useRouter();
  const [items, setItems] = useState<TrashItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'document' | 'folder'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'deletedAt'>('deletedAt');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [query, setQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRestoring, setIsRestoring] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TrashItemDto | null>(null);

  const fetchTrash = useCallback(async (isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setTableLoading(true);
      }
      const backendSortBy = sortBy === 'deletedAt' ? 'deletedAt' : sortBy === 'name' ? 'entityName' : 'deletedAt';
      const backendSortDir = sortDesc ? 'desc' as const : 'asc' as const;
      const resp = await trashService.getMyTrash({
        page,
        size,
        sortBy: backendSortBy,
        sortDir: backendSortDir,
        entityType: filterType === 'all' ? undefined : filterType,
        query: query || undefined
      });

      setItems(resp.content || []);
      setTotalPages(resp.totalPages || 0);
      setTotalElements(resp.totalElements || 0);
    } catch (error) {
      console.error('Error fetching trash:', error);
      showError('Failed to load trash items');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [page, size, sortBy, sortDesc, query, filterType, showError]);

  useEffect(() => {
    const isInitialLoad = items.length === 0;
    fetchTrash(isInitialLoad);
  }, [page, size, sortBy, sortDesc, query, filterType]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(0);
    await fetchTrash(false);
    setIsRefreshing(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const restoreItem = async (item: TrashItemDto) => {
    try {
      setIsRestoring(item.id);
      await trashService.restoreItem(item.entityType, item.entityId);
      showSuccess('Item restored successfully');
      // Remove from local state
      setItems(prev => prev.filter(i => i.id !== item.id));
      setTotalElements(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error restoring item:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to restore item';
      if (errorMessage.includes('name') || errorMessage.includes('conflict')) {
        showError('A file or folder with the same name already exists. Please rename it first.');
      } else {
        showError(errorMessage);
      }
    } finally {
      setIsRestoring(null);
    }
  };

  const handleDeleteClick = (item: TrashItemDto) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const permanentlyDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      setIsDeleting(itemToDelete.id);
      await trashService.permanentlyDelete(itemToDelete.entityType, itemToDelete.entityId);
      showSuccess('Item permanently deleted');
      // Remove from local state
      setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
      setTotalElements(prev => Math.max(0, prev - 1));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error: any) {
      console.error('Error permanently deleting item:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to permanently delete item';
      showError(errorMessage);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEmptyTrashClick = () => {
    setShowEmptyTrashModal(true);
  };

  const emptyTrash = async () => {
    try {
      await trashService.emptyTrash();
      showSuccess('Trash emptied successfully');
      setItems([]);
      setTotalElements(0);
      setTotalPages(0);
      setShowEmptyTrashModal(false);
    } catch (error: any) {
      console.error('Error emptying trash:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to empty trash';
      showError(errorMessage);
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FileText className="h-5 w-5" />;
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-5 w-5" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileText className="h-5 w-5" />;
    if (mimeType.includes('image')) return <FileText className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const getDocumentType = (mimeType?: string): string => {
    if (!mimeType) return 'Unknown';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel';
    if (mimeType.includes('image')) return 'Image';
    return mimeType.split('/')[1]?.toUpperCase() || 'File';
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

  const navigateToPath = async (path: string) => {
    if (!path) return;
    try {
      const response = await notificationApiClient.getFolderIdByPath(path);
      router.push(`/folders/${response.id}`);
    } catch (error) {
      console.error('Error navigating to path:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-6">
        {/* Main Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-red-400 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                <Trash2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Recycle Bin
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                  Restore or permanently delete deleted items
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm min-w-[120px]">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Items</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="text-xl font-bold text-gray-900">{totalElements || 0}</span>
              </div>
            </div>

            {query && (
              <div className="flex flex-col px-4 py-2 bg-emerald-50/50 rounded-xl border border-emerald-100 shadow-sm min-w-[120px]">
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Results</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xl font-bold text-emerald-900">{items.length}</span>
                </div>
              </div>
            )}
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
            onClick={handleEmptyTrashClick}
            disabled={items.length === 0}
            className="h-10 px-6 bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl border-0"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Empty Trash
          </Button>
        </div>
      </div>

      {/* Search and Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4 p-1">
        <div className="flex-1 flex gap-4 p-1.5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          {/* Search Section */}
          <div className="flex-1">
            <ServerSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search deleted items..."
              className="h-11 border-0 bg-transparent focus-visible:ring-0 px-4 text-base placeholder:text-gray-400"
            />
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200 my-2"></div>

          {/* Filter Type */}
          <div className="flex items-center gap-2 pr-2">
            <Select value={filterType} onValueChange={(value) => {
              setFilterType(value as 'all' | 'document' | 'folder');
              setPage(0);
            }}>
              <SelectTrigger className="w-[160px] h-9 border-0 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium focus:ring-0 transition-colors rounded-xl">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="document">Documents Only</SelectItem>
                <SelectItem value="folder">Folders Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200 my-2"></div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 pr-2">
            <Select value={`${sortBy}-${sortDesc ? 'desc' : 'asc'}`} onValueChange={(value) => {
              const [field, direction] = value.split('-');
              setSortBy(field as 'name' | 'deletedAt');
              setSortDesc(direction === 'desc');
              setPage(0);
            }}>
              <SelectTrigger className="w-[180px] h-9 border-0 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium focus:ring-0 transition-colors rounded-xl">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deletedAt-desc">Recently Deleted</SelectItem>
                <SelectItem value="deletedAt-asc">Oldest Deleted</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Trash Table */}
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
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Deleted Items</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Your recycle bin is empty. Deleted items will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                      <TableHead className="font-semibold text-gray-600 pl-6">Name</TableHead>
                      <TableHead className="font-semibold text-gray-600">Type</TableHead>
                      <TableHead className="font-semibold text-gray-600">Deleted By</TableHead>
                      <TableHead className="font-semibold text-gray-600">Size</TableHead>
                      <TableHead className="font-semibold text-gray-600">Deleted At</TableHead>
                      <TableHead className="font-semibold text-gray-600 text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="p-4">
                          <div className="h-6 w-full bg-gray-100 animate-pulse rounded" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => {
                        const isDocument = item.entityType?.toLowerCase() === 'document';
                        const pathSegments = formatFolderPath(item.path);
                        return (
                          <TableRow key={item.id} className="group hover:bg-blue-50/30 transition-colors border-b border-gray-50 last:border-0">
                            <TableCell className="pl-6 py-3">
                              <div className="flex items-start gap-3">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isDocument ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                }`}>
                                  {isDocument ? getFileIcon(undefined) : <Folder className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                                    {item.entityName || 'Unknown'}
                                  </div>
                                  {/* Folder Path */}
                                  {pathSegments.length > 0 && (
                                    <button 
                                      onClick={() => navigateToPath(item.path || '')} 
                                      className="flex cursor-pointer hover:text-blue-600 hover:underline transition-colors items-center gap-1 text-xs text-gray-400 mt-1 flex-wrap"
                                    >
                                      /{pathSegments.join(' / ')}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {isDocument ? 'Document' : 'Folder'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {item.deletedBy ? (
                                  <>
                                    <UserAvatar user={item.deletedBy} size="sm" />
                                    <div className="text-sm text-gray-600">
                                      {item.deletedBy.displayName || item.deletedBy.username || item.deletedBy.email || 'Unknown'}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-sm text-gray-500">Unknown</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600">
                                {item.sizeBytes ? formatFileSize(item.sizeBytes) : '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600">
                                {item.deletedAt ? formatDate(item.deletedAt.toString()) : '-'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => restoreItem(item)}
                                  disabled={isRestoring === item.id || isDeleting === item.id}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Restore"
                                >
                                  {isRestoring === item.id ? (
                                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <ArchiveRestore className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(item)}
                                  disabled={isRestoring === item.id || isDeleting === item.id}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Permanently Delete"
                                >
                                  {isDeleting === item.id ? (
                                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={size}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={permanentlyDelete}
        title="Permanently Delete Item"
        message={`Are you sure you want to permanently delete "${itemToDelete?.entityName}"? This action cannot be undone and will delete all related data including files from storage.`}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting !== null}
      />

      {/* Empty Trash Confirmation Modal */}
      <ConfirmationModal
        isOpen={showEmptyTrashModal}
        onClose={() => setShowEmptyTrashModal(false)}
        onConfirm={emptyTrash}
        title="Empty Trash"
        message={`Are you sure you want to permanently delete all ${totalElements} items in the trash? This action cannot be undone and will delete all related data including files from storage.`}
        confirmText="Empty Trash"
        cancelText="Cancel"
        variant="destructive"
        loading={false}
      />
    </div>
  );
}
