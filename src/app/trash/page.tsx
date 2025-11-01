// app/trash/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Trash2,
  ArchiveRestore,
  Trash,
  File,
  Folder,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { recycleBinService } from '../../api/services/recycleBinService';
import { RecycleBinEntry } from '../../types/api';
import ServerSearchInput from '../../components/main/ServerSearchInput';
import Pagination from '../../components/main/Pagination';
import UserAvatar from '../../components/main/UserAvatar';
import { useServerSideSearch } from '../../components/main/useServerSideSearch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TrashPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<RecycleBinEntry[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'document' | 'folder'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'deletedAt' | 'createdAt'>('deletedAt');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const {
    displayData,
    searchQuery,
    setSearchQuery,
    loading,
    tableLoading,
    totalPages: hookTotalPages,
    totalElements: hookTotalElements,
    fetchData
  } = useServerSideSearch<RecycleBinEntry>({
    fetchFunction: async (pageIdx: number, _query?: string) => {
      const resp = await recycleBinService.getMyRecycleBinEntries({
        page: pageIdx,
        size,
        sortBy: sortBy === 'deletedAt' ? 'deletedAt' : sortBy === 'createdAt' ? 'id' : 'deletedAt',
        sortDir: sortDesc ? 'desc' : 'asc'
      } as any & { entityType?: string });
      return resp;
    },
    searchFields: (item) => [item.entityName, item.entityType, String(item.entityId)],
    debounceMs: 500,
    initialPage: 0,
    fetchOnMount: true
  });

  useEffect(() => {
    setTotalPages(hookTotalPages);
    setTotalElements(hookTotalElements);
    setItems(displayData);
  }, [displayData, hookTotalElements, hookTotalPages]);

  useEffect(() => {
    fetchData(true);
  }, [sortBy, sortDesc, size]);

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

  const restoreItem = async (item: RecycleBinEntry) => {
    try {
      setIsRestoring(item.id);
      await recycleBinService.restoreFromRecycleBin({
        entityType: item.entityType,
        entityId: item.entityId
      });
      setItems(prev => prev.filter(i => i.id !== item.id));
      setSelectedItems(prev => prev.filter(itemId => itemId !== item.id));
    } catch (error) {
      console.error('Error restoring item:', error);
      setError('Failed to restore item');
    } finally {
      setIsRestoring(null);
    }
  };

  const permanentlyDelete = async (item: RecycleBinEntry) => {
    if (confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      try {
        setIsDeleting(item.id);
        await recycleBinService.permanentlyDelete({
          entityType: item.entityType,
          entityId: item.entityId
        });
        setItems(prev => prev.filter(i => i.id !== item.id));
        setSelectedItems(prev => prev.filter(itemId => itemId !== item.id));
      } catch (error) {
        console.error('Error permanently deleting item:', error);
        setError('Failed to permanently delete item');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const emptyTrash = async () => {
    if (confirm('Are you sure you want to empty the trash? This will permanently delete all items.')) {
      try {
        setLoading(true);
        await recycleBinService.emptyMyRecycleBin();
        setItems([]);
        setSelectedItems([]);
      } catch (error) {
        console.error('Error emptying trash:', error);
        setError('Failed to empty trash');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter items (search + type)
  const filteredItems = items.filter(item => {
    const matchesSearch = item.entityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.entityType.toLowerCase() === filterType;
    return matchesSearch && matchesType;
  });

  // Client-side sort by name if selected (page scope)
  const displayedItems = sortBy === 'name'
    ? [...filteredItems].sort((a, b) => {
        const an = a.entityName.toLowerCase();
        const bn = b.entityName.toLowerCase();
        if (an < bn) return sortDesc ? 1 : -1;
        if (an > bn) return sortDesc ? -1 : 1;
        return 0;
      })
    : filteredItems;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-neutral-ui rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-neutral-ui rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-neutral-ui rounded w-32 animate-pulse"></div>
        </div>
        <div className="bg-surface border border-ui rounded-lg animate-pulse h-64"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-error/10 to-warning/10 rounded-lg p-6 border border-error/20">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 bg-error/20 rounded-lg flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-error" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-neutral-text-dark">Recycle Bin</h1>
                <p className="text-neutral-text-light">
                  {items.length} deleted items • Items will be automatically deleted after 30 days
                </p>
              </div>
            </div>
            {error && (
              <div className="mt-3 p-3 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-error" />
                <span className="text-sm text-error">{error}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {selectedItems.length > 0 && (
              <>
                <button 
                  onClick={() => selectedItems.forEach(id => {
                    const item = items.find(i => i.id === id);
                    if (item) restoreItem(item);
                  })}
                  className="flex items-center gap-2 border border-ui text-neutral-text-dark px-4 py-2 rounded-lg hover:bg-neutral-background transition-colors"
                >
                  <ArchiveRestore className="h-4 w-4" />
                  Restore Selected ({selectedItems.length})
                </button>
                <button 
                  onClick={() => selectedItems.forEach(id => {
                    const item = items.find(i => i.id === id);
                    if (item) permanentlyDelete(item);
                  })}
                  className="flex items-center gap-2 bg-error text-surface px-4 py-2 rounded-lg hover:bg-error-dark transition-colors"
                >
                  <Trash className="h-4 w-4" />
                  Delete Selected ({selectedItems.length})
                </button>
              </>
            )}
            <button 
              onClick={emptyTrash}
              disabled={items.length === 0}
              className="flex items-center gap-2 bg-error text-surface px-4 py-2 rounded-lg hover:bg-error-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Empty Trash
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface rounded-lg border border-ui p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <ServerSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search deleted items..."
              className="w-64"
            />
            
            <Select value={filterType} onValueChange={(val) => setFilterType(val as any)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="document">Documents Only</SelectItem>
                <SelectItem value="folder">Folders Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deletedAt">Sort by Date</SelectItem>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="createdAt">Sort by Created</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="p-2 border border-ui rounded hover:bg-neutral-background transition-colors"
              title={sortDesc ? 'Sort Ascending' : 'Sort Descending'}
            >
              {sortDesc ? '↓' : '↑'}
            </button>
          </div>

          <div className="text-sm text-neutral-text-light">
            {selectedItems.length > 0 ? `${selectedItems.length} selected` : `${totalElements} items`}
          </div>
        </div>
      </div>

      {/* Trash Items */}
      <div className="bg-surface border border-ui rounded-lg">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="h-16 w-16 text-neutral-ui mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-text-dark mb-2">No deleted items</h3>
            <p className="text-neutral-text-light">
              {items.length === 0 
                ? "Your recycle bin is empty. Deleted items will appear here."
                : "No items match your current filters."
              }
            </p>
          </div>
        ) : (
          <table className="w-full relative">
            <thead className="bg-neutral-background">
              <tr>
                <th className="text-left p-4 w-8">
                  <input 
                    type="checkbox" 
                    className="rounded border-ui"
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredItems.map(item => item.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Name</th>
                <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Type</th>
                <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Deleted By</th>
                <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Deleted At</th>
                <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Actions</th>
              </tr>
            </thead>
            <tbody className="relative">
              {tableLoading && (
                <tr>
                  <td colSpan={6}>
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              )}
              {displayedItems.map((item) => (
                <TrashItemRow 
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  onSelect={() => setSelectedItems(prev => 
                    prev.includes(item.id) 
                      ? prev.filter(id => id !== item.id)
                      : [...prev, item.id]
                  )}
                  onRestore={() => restoreItem(item)}
                  onDelete={() => permanentlyDelete(item)}
                  formatDate={formatDate}
                  isRestoring={isRestoring === item.id}
                  isDeleting={isDeleting === item.id}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={size}
        onPageChange={(p) => { setPage(p); }}
      />
    </div>
  );
}

function TrashItemRow({ 
  item, 
  isSelected, 
  onSelect, 
  onRestore, 
  onDelete, 
  formatDate, 
  isRestoring, 
  isDeleting 
}: { 
  item: RecycleBinEntry;
  isSelected: boolean;
  onSelect: () => void;
  onRestore: () => void;
  onDelete: () => void;
  formatDate: (dateString: string) => string;
  isRestoring: boolean;
  isDeleting: boolean;
}) {
  const isDocument = item.entityType.toLowerCase() === 'document';
  const isFolder = item.entityType.toLowerCase() === 'folder';

  return (
    <tr className="border-b border-ui last:border-b-0 hover:bg-neutral-background/50">
      <td className="p-4">
        <input 
          type="checkbox" 
          className="rounded border-ui"
          checked={isSelected}
          onChange={onSelect}
        />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
            isDocument ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
          }`}>
            {isDocument ? <File className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
          </div>
          <div>
            <div className="font-medium text-neutral-text-dark">{item.entityName}</div>
            <div className="text-sm text-neutral-text-light capitalize">{item.entityType}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isDocument 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-orange-100 text-orange-700'
          }`}>
            {isDocument ? 'Document' : 'Folder'}
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <UserAvatar user={item.deletedBy} size="sm" />
          <div className="text-sm text-neutral-text-dark">{item.deletedBy?.displayName || item.deletedBy?.username || 'Unknown'}</div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-neutral-text-light" />
          <div className="text-sm text-neutral-text-light">{formatDate(item.deletedAt)}</div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <button 
            onClick={onRestore}
            disabled={isRestoring || isDeleting}
            className="p-2 rounded hover:bg-success/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Restore"
          >
            {isRestoring ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-success"></div>
            ) : (
              <ArchiveRestore className="h-4 w-4 text-success" />
            )}
          </button>
          <button 
            onClick={onDelete}
            disabled={isRestoring || isDeleting}
            className="p-2 rounded hover:bg-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Permanently Delete"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-error"></div>
            ) : (
              <Trash className="h-4 w-4 text-error" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}