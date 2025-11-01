import React from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  ArrowUpDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type';

interface FolderToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  sortBy: SortOption;
  onSortByChange: (sortBy: SortOption) => void;
  sortDesc: boolean;
  onSortDescToggle: () => void;
}

const sortOptions = {
  name: 'Name',
  createdAt: 'Date Created',
  updatedAt: 'Date Modified',
  size: 'Size',
  type: 'Type'
};

export function FolderToolbar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
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

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 hover:bg-gray-50 transition-colors">
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort by: {sortOptions[sortBy]}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {Object.entries(sortOptions).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onSortByChange(key as SortOption)}
                  className={sortBy === key ? 'bg-gray-100' : ''}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
  );
}
