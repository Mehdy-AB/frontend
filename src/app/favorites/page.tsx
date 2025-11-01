// app/favorites/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Star, 
  Search, 
  Filter,
  File,
  Folder,
  MoreVertical,
  Download,
  Share2,
  Eye,
  Heart,
  Clock,
  User,
  Calendar,
  HardDrive
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { favoriteService } from '../../api/services/favoriteService';
import { notificationApiClient } from '../../api/notificationClient';
import Pagination from '@/components/main/Pagination';
import SearchBar from '@/components/main/SearchBar';
import { PageResponse } from '../../types/api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  owner?: string;
  ownerEmail?: string;
  ownerUser?: UserDto | null;
  mimeType?: string;
  versionNumber?: number;
  isPublic?: boolean;
}

export default function FavoritesPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [visibleItems, setVisibleItems] = useState<FavoriteItem[]>([]);
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

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        if (items.length === 0) {
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
            size: isDocument ? (doc?.sizeBytes || 0) : (folder?.size || 0),
            lastModified: isDocument ? (doc?.updatedAt || doc?.createdAt) : (folder?.updatedAt || folder?.createdAt),
            owner: isDocument ? doc?.ownedBy?.username : folder?.ownedBy?.username,
            ownerEmail: isDocument ? doc?.ownedBy?.email : folder?.ownedBy?.email,
            ownerUser: (isDocument ? doc?.ownedBy : folder?.ownedBy) || null,
          } as FavoriteItem;
        });

        setItems(mapped);
        setVisibleItems(mapped);
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.totalElements || 0);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    };

    fetchFavorites();
  }, [page, size, sortBy, sortDesc, query, filterType]);

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

  const removeFromFavorites = async (item: FavoriteItem) => {
    try {
      if (item.type === 'document') {
        await favoriteService.removeDocumentFromFavorites(item.id);
      } else {
        await favoriteService.removeFolderFromFavorites(item.id);
      }
      setItems(prev => prev.filter(i => i.id !== item.id || i.type !== item.type));
      setVisibleItems(prev => prev.filter(i => i.id !== item.id || i.type !== item.type));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  // Stable callbacks for SearchBar to prevent re-render loops
  const getFields = useCallback((it: FavoriteItem) => [it.name], []);
  const handleLocalFilter = useCallback((filtered: any[]) => {
    setVisibleItems(filtered as FavoriteItem[]);
  }, []);
  const handleRemoteSearch = useCallback((q: string) => {
    setQuery(q);
    setPage(0);
  }, []);

  // Filter and sort items
  const filteredAndSortedItems = visibleItems.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'favoritedAt':
          aValue = new Date(a.favoritedAt).getTime();
          bValue = new Date(b.favoritedAt).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortDesc) {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-neutral-ui rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-neutral-ui rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="bg-surface border border-ui rounded-lg animate-pulse h-64"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-text-dark">{t('common.favorites')}</h1>
          <p className="text-neutral-text-light">
            {totalElements} favorite items • Quickly access your most important files
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-72">
            <SearchBar
              sourceData={items}
              getFields={getFields}
              onLocalFilter={handleLocalFilter}
              onRemoteSearch={handleRemoteSearch}
              placeholder={t('common.search')}
            />
          </div>
          
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'documents' | 'folders')}
            className="text-sm border border-ui rounded px-3 py-2 bg-surface text-neutral-text-dark"
          >
            <option value="all">All Favorites</option>
            <option value="documents">Documents Only</option>
            <option value="folders">Folders Only</option>
          </select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort: {sortBy === 'favoritedAt' ? 'Recently Favorited' : 'Name'} {sortDesc ? '↓' : '↑'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => { setSortBy('favoritedAt'); }}>
                Recently Favorited
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('name'); }}>
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortDesc(false); }}>
                Ascending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortDesc(true); }}>
                Descending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Favorites Items */}
      <div className="bg-surface border border-ui rounded-lg">
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-neutral-ui mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-text-dark mb-2">No Favorites Yet</h3>
            <p className="text-neutral-text-light">Star important items to see them here for quick access</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-background">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Name</th>
                <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Type</th>
                <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Owner</th>
                <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Favorited</th>
                <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Last Modified</th>
                <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Size</th>
                <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td className="p-4" colSpan={7}>
                    <div className="h-6 w-full bg-neutral-ui animate-pulse rounded" />
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item) => (
                  <FavoriteItemRow 
                    key={`${item.type}-${item.id}`}
                    item={item}
                    onRemove={removeFromFavorites}
                    formatFileSize={formatFileSize}
                    formatDate={formatDate}
                  />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={size}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}

function FavoriteItemRow({ item, onRemove, formatFileSize, formatDate }: any) {
  const [showMenu, setShowMenu] = useState(false);

  const handleView = () => {
    if (item.type === 'document') {
      window.open(`/documents/${item.id}`, '_blank');
    } else {
      window.open(`/folders/${item.id}`, '_blank');
    }
  };

  // Actions limited to View and Remove only per requirements

  return (
    <tr className="border-b border-ui last:border-b-0 hover:bg-neutral-background/50 group">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            item.type === 'document' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
          }`}>
            {item.type === 'document' ? <File className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
          </div>
          <div>
            <div className="font-medium text-neutral-text-dark flex items-center gap-2">
              {item.name}
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            </div>
            <div className="text-sm text-neutral-text-light capitalize">{item.type}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            item.type === 'document' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-orange-100 text-orange-700'
          }`}>
            {item.type === 'document' ? 'Document' : 'Folder'}
          </div>
          {item.versionNumber && (
            <div className="text-xs text-neutral-text-light">
              v{item.versionNumber}
            </div>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <UserAvatar user={item.ownerUser || null} size="sm" />
          <div className="text-sm text-neutral-text-light">
            {item.ownerEmail || 'Unknown'}
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-light">{formatDate(item.favoritedAt)}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-light">{formatDate(item.lastModified)}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-light">{formatFileSize(item.size)}</div>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <button 
            onClick={handleView}
            className="p-2 rounded hover:bg-ui transition-colors opacity-0 group-hover:opacity-100"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded hover:bg-ui transition-colors opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="h-4 w-4 mr-2" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRemove(item)} className="text-error">
                <Star className="h-4 w-4 mr-2" /> Remove from Favorites
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}