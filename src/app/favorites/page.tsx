'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Star, 
  Search, 
  Filter,
  File,
  Folder,
  Eye,
  RefreshCw,
  FileText,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { favoriteService } from '../../api/services/favoriteService';
import { notificationApiClient } from '../../api/notificationClient';
import Pagination from '@/components/main/Pagination';
import { PageResponse } from '../../types/api';
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
import ServerSearchInput from '@/components/main/ServerSearchInput';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/components/main/UserAvatar';
import { UserDto } from '@/types/api';

interface FavoriteItem {
  id: number;
  name: string;
  type: 'document' | 'folder';
  favoritedAt: string;
  path: string;
  size: number;
  lastModified: string;
  description?: string;
  owner?: string;
  ownerEmail?: string;
  ownerUser?: UserDto | null;
  mimeType?: string;
  versionNumber?: number;
  isPublic?: boolean;
  documentId?: number;
  folderId?: number;
}

export default function FavoritesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'documents' | 'folders'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'favoritedAt'>('favoritedAt');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [query, setQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFavorites = useCallback(async (isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setTableLoading(true);
      }
      const backendSortBy = sortBy === 'favoritedAt' ? 'createdAt' : 'name';
      const backendSortDir = sortDesc ? 'desc' as const : 'asc' as const;
      const res: PageResponse<any> = await favoriteService.getFavorites(page, size, backendSortBy, backendSortDir, query, filterType);

      const mapped: FavoriteItem[] = (res.content || []).map((fav: any) => {
        const isDocument = (fav.type === 'DOCUMENT') || (fav.type === 'document');
        const doc = fav.document;
        const folder = fav.folder;
        return {
          id: isDocument ? doc?.documentId : folder?.id,
          name: isDocument ? doc?.name : folder?.name,
          type: isDocument ? 'document' : 'folder',
          favoritedAt: fav.favoritedAt,
          path: isDocument ? doc?.path : folder?.path,
          description: isDocument ? doc?.description : folder?.description,
          size: isDocument ? (doc?.sizeBytes || 0) : (folder?.size || 0),
          lastModified: isDocument ? (doc?.updatedAt || doc?.createdAt) : (folder?.updatedAt || folder?.createdAt),
          owner: isDocument ? doc?.ownedBy?.username : folder?.ownedBy?.username,
          ownerEmail: isDocument ? doc?.ownedBy?.email : folder?.ownedBy?.email,
          ownerUser: (isDocument ? doc?.ownedBy : folder?.ownedBy) || null,
          mimeType: doc?.mimeType,
          versionNumber: doc?.versionNumber,
          documentId: doc?.documentId,
          folderId: folder?.id,
        } as FavoriteItem;
      });

      setItems(mapped);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [page, size, sortBy, sortDesc, query, filterType]);

  useEffect(() => {
    // Only fetch when filters/search/sort/page change, not when items change
    const isInitialLoad = items.length === 0;
    fetchFavorites(isInitialLoad);
  }, [page, size, sortBy, sortDesc, query, filterType]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(0);
    await fetchFavorites(false);
    setIsRefreshing(false);
  };

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const removeFromFavorites = async (item: FavoriteItem) => {
    try {
      if (item.type === 'document') {
        await favoriteService.removeDocumentFromFavorites(item.id);
      } else {
        await favoriteService.removeFolderFromFavorites(item.id);
      }
      // Remove from local state without refetching - allows user to re-favorite
      setItems(prev => prev.filter(i => !(i.id === item.id && i.type === item.type)));
      setTotalElements(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const handleView = (item: FavoriteItem) => {
    if (item.type === 'document') {
      router.push(`/documents/${item.id}`);
    } else {
      router.push(`/folders/${item.id}`);
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
              <div className="h-12 w-12 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-200">
                <Star className="h-6 w-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {t('common.favorites')}
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                  Quickly access your most important files and folders
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm min-w-[120px]">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Favorites</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
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
              placeholder="Search favorites..."
              className="h-11 border-0 bg-transparent focus-visible:ring-0 px-4 text-base placeholder:text-gray-400"
            />
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200 my-2"></div>

          {/* Filter Type */}
          <div className="flex items-center gap-2 pr-2">
            <Select value={filterType} onValueChange={(value) => {
              setFilterType(value as 'all' | 'documents' | 'folders');
              setPage(0);
            }}>
              <SelectTrigger className="w-[160px] h-9 border-0 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium focus:ring-0 transition-colors rounded-xl">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Favorites</SelectItem>
                <SelectItem value="documents">Documents Only</SelectItem>
                <SelectItem value="folders">Folders Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200 my-2"></div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 pr-2">
            <Select value={`${sortBy}-${sortDesc ? 'desc' : 'asc'}`} onValueChange={(value) => {
              const [field, direction] = value.split('-');
              setSortBy(field as 'name' | 'favoritedAt');
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
                <SelectItem value="favoritedAt-desc">Recently Favorited</SelectItem>
                <SelectItem value="favoritedAt-asc">Oldest Favorited</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Favorites Table */}
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
                <Star className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Favorites Yet</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Star important items to see them here for quick access
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                      <TableHead className="font-semibold text-gray-600 pl-6">Document</TableHead>
                      <TableHead className="font-semibold text-gray-600">Type</TableHead>
                      <TableHead className="font-semibold text-gray-600">Owner</TableHead>
                      <TableHead className="font-semibold text-gray-600">Size</TableHead>
                      <TableHead className="font-semibold text-gray-600">Created</TableHead>
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
                        const pathSegments = formatFolderPath(item.path);
                        return (
                          <TableRow key={`${item.type}-${item.id}`} className="group hover:bg-blue-50/30 transition-colors border-b border-gray-50 last:border-0">
                            <TableCell className="pl-6 py-3">
                              <div className="flex items-start gap-3">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  item.type === 'document' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                }`}>
                                  {item.type === 'document' ? getFileIcon(item.mimeType) : <Folder className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{item.name}</div>
                                  {/* Folder Path */}
                                  {pathSegments.length > 0 && (
                                    <button 
                                      onClick={() => navigateToPath(item.path)} 
                                      className="flex cursor-pointer hover:text-blue-600 hover:underline transition-colors items-center gap-1 text-xs text-gray-400 mt-1 flex-wrap"
                                    >
                                      /{pathSegments.join(' / ')}
                                    </button>
                                  )}
                                  {/* Description */}
                                  {item.description && (
                                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {item.type === 'document' ? getDocumentType(item.mimeType) : 'Folder'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <UserAvatar user={item.ownerUser || null} size="sm" />
                                <div className="text-sm text-gray-600">
                                  {item.ownerEmail || 'Unknown'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600">{formatFileSize(item.size)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600">{formatDate(item.favoritedAt)}</div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleView(item)}
                                  className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                  title="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromFavorites(item)}
                                  className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                                  title="Remove from Favorites"
                                >
                                  <Star className="h-4 w-4 fill-current" />
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
    </div>
  );
}
