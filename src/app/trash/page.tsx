// app/trash/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Trash2, 
  Clock, 
  ArchiveRestore, 
  Trash, 
  Search, 
  Filter,
  File,
  Folder,
  MoreVertical,
  Calendar,
  User,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  Download
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { recycleBinService } from '../../api/services/recycleBinService';
import { RecycleBinEntry } from '../../types/api';

export default function TrashPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<RecycleBinEntry[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'document' | 'folder'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'deletedAt' | 'deletedBy'>('deletedAt');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const fetchTrashItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await recycleBinService.getMyRecycleBinEntries({
          page: 0,
          size: 100,
          sortBy: sortBy === 'deletedAt' ? 'deletedAt' : sortBy === 'deletedBy' ? 'deletedBy' : 'entityName',
          sortDir: sortDesc ? 'desc' : 'asc'
        });
        setItems(response.content);
      } catch (error) {
        console.error('Error fetching trash items:', error);
        setError('Failed to load trash items');
      } finally {
        setLoading(false);
      }
    };

    fetchTrashItems();
  }, [sortBy, sortDesc]);

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

  // Filter and sort items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.entityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.entityType.toLowerCase() === filterType;
    return matchesSearch && matchesType;
  });

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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-light h-4 w-4" />
              <input
                type="text"
                placeholder="Search deleted items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-neutral-background border border-ui rounded-lg text-sm text-neutral-text-dark placeholder-neutral-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64"
              />
            </div>
            
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'document' | 'folder')}
              className="text-sm border border-ui rounded px-3 py-2 bg-neutral-background text-neutral-text-dark"
            >
              <option value="all">All Items</option>
              <option value="document">Documents Only</option>
              <option value="folder">Folders Only</option>
            </select>

            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'deletedAt' | 'deletedBy')}
              className="text-sm border border-ui rounded px-3 py-2 bg-neutral-background text-neutral-text-dark"
            >
              <option value="deletedAt">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="deletedBy">Sort by User</option>
            </select>

            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="p-2 border border-ui rounded hover:bg-neutral-background transition-colors"
              title={sortDesc ? 'Sort Ascending' : 'Sort Descending'}
            >
              {sortDesc ? '↓' : '↑'}
            </button>
          </div>

          <div className="text-sm text-neutral-text-light">
            {selectedItems.length > 0 ? `${selectedItems.length} selected` : `${filteredItems.length} items`}
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
          <table className="w-full">
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
            <tbody>
              {filteredItems.map((item) => (
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
          <div className="h-6 w-6 bg-primary-light rounded-full flex items-center justify-center">
            <User className="h-3 w-3 text-primary" />
          </div>
          <div className="text-sm text-neutral-text-dark">{item.deletedByUsername}</div>
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