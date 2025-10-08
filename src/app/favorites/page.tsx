// app/favorites/page.tsx
'use client';

import { useState, useEffect } from 'react';
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
import { Favorite, FolderFavorite } from '../../types/api';

interface FavoriteItem {
  id: number;
  name: string;
  type: 'document' | 'folder';
  favoritedAt: string;
  path: string;
  size: number;
  lastModified: string;
  owner?: string;
  mimeType?: string;
  versionNumber?: number;
  isPublic?: boolean;
}

export default function FavoritesPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'documents' | 'folders'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'favoritedAt' | 'lastModified'>('favoritedAt');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        
        // Fetch both document and folder favorites
        const [documentFavorites, folderFavorites] = await Promise.all([
          favoriteService.getMyFavorites({
            page: 0,
            size: 100,
            sortBy: 'createdAt',
            sortDir: 'desc'
          }),
          favoriteService.getMyFolderFavorites({
            page: 0,
            size: 100,
            sortBy: 'createdAt',
            sortDir: 'desc'
          })
        ]);

        // Transform document favorites
        const documentItems: FavoriteItem[] = documentFavorites.content.map(fav => ({
          id: fav.documentId,
          name: fav.documentName,
          type: 'document' as const,
          favoritedAt: fav.createdAt,
          path: '/Documents', // This would need to be fetched from document details
          size: 0, // This would need to be fetched from document details
          lastModified: fav.createdAt,
          owner: fav.username
        }));

        // Transform folder favorites
        const folderItems: FavoriteItem[] = folderFavorites.content.map(fav => ({
          id: fav.folderId,
          name: fav.folderName,
          type: 'folder' as const,
          favoritedAt: fav.createdAt,
          path: '/Folders', // This would need to be fetched from folder details
          size: 0, // This would need to be fetched from folder details
          lastModified: fav.createdAt,
          owner: fav.username
        }));

        // Combine and sort
        const allItems = [...documentItems, ...folderItems];
        setItems(allItems);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

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
        await favoriteService.removeFromFavorites(item.id);
      } else {
        await favoriteService.removeFolderFromFavorites(item.id);
      }
      setItems(prev => prev.filter(i => i.id !== item.id || i.type !== item.type));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter(item => {
      if (filterType !== 'all' && item.type !== filterType.slice(0, -1)) {
        return false;
      }
      if (searchQuery) {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
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
        case 'lastModified':
          aValue = new Date(a.lastModified).getTime();
          bValue = new Date(b.lastModified).getTime();
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
            {filteredAndSortedItems.length} favorite items • Quickly access your most important files
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-light h-4 w-4" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-surface border border-ui rounded-lg text-sm text-neutral-text-dark placeholder-neutral-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64"
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

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'favoritedAt' | 'lastModified')}
            className="text-sm border border-ui rounded px-3 py-2 bg-surface text-neutral-text-dark"
          >
            <option value="favoritedAt">Recently Favorited</option>
            <option value="name">Name</option>
            <option value="lastModified">Last Modified</option>
          </select>
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
              {filteredAndSortedItems.map((item) => (
                <FavoriteItemRow 
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onRemove={removeFromFavorites}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
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

  const handleDownload = async () => {
    if (item.type === 'document') {
      try {
        await notificationApiClient.downloadDocument(item.id);
      } catch (error) {
        console.error('Error downloading document:', error);
      }
    }
  };

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
        <div className="text-sm text-neutral-text-light">{item.owner || 'Unknown'}</div>
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
          {item.type === 'document' && (
            <button 
              onClick={handleDownload}
              className="p-2 rounded hover:bg-ui transition-colors opacity-0 group-hover:opacity-100"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded hover:bg-ui transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-ui rounded-lg shadow-medium z-10">
                <button 
                  onClick={handleView}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                {item.type === 'document' && (
                  <button 
                    onClick={handleDownload}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                )}
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background">
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <hr className="border-ui" />
                <button 
                  onClick={() => onRemove(item)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10"
                >
                  <Star className="h-4 w-4" />
                  Remove from Favorites
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}