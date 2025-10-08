import React from 'react';
import { 
  Search, 
  Grid, 
  List, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type';
type ViewMode = 'grid' | 'list';

interface FolderToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortOption;
  onSortByChange: (sortBy: SortOption) => void;
  sortDesc: boolean;
  onSortDescToggle: () => void;
}

export function FolderToolbar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortByChange,
  sortDesc,
  onSortDescToggle
}: FolderToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search folders and documents..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
            />
          </div>
        </div>

        {/* View and Sort Controls */}
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-md p-1">
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="createdAt">Date Created</option>
              <option value="updatedAt">Date Modified</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
            </select>
            <button
              onClick={onSortDescToggle}
              className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              title={sortDesc ? 'Sort Ascending' : 'Sort Descending'}
            >
              {sortDesc ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
