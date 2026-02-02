import React from 'react';
import {
  Search,
  ChevronDown,
  Grid,
  Folder,
  FileText,
  ArrowUpDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type SortField = 'name' | 'createdAt' | 'updatedAt' | 'size';

interface FolderToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  sortBy: SortField;
  onSortByChange: (sortBy: SortField) => void;
  sortDesc: boolean;
  onSortDescToggle: (desc: boolean) => void;
  showDocumentsOnly: boolean;
  onToggleDocumentsOnly: (show: boolean) => void;
}

// Combined sort options for the UI
type CombinedSortOption = {
  label: string;
  field: SortField;
  desc: boolean;
};

const sortOptions: CombinedSortOption[] = [
  { label: 'Name (A-Z)', field: 'name', desc: false },
  { label: 'Name (Z-A)', field: 'name', desc: true },
  { label: 'Date Modified (Newest)', field: 'updatedAt', desc: true },
  { label: 'Date Modified (Oldest)', field: 'updatedAt', desc: false },
  { label: 'Size (Large-Small)', field: 'size', desc: true },
  { label: 'Size (Small-Large)', field: 'size', desc: false },
];

export function FolderToolbar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  sortBy,
  onSortByChange,
  sortDesc,
  onSortDescToggle,
  showDocumentsOnly,
  onToggleDocumentsOnly
}: FolderToolbarProps) {

  // Find the current selected option
  const currentOption = sortOptions.find(
    option => option.field === sortBy && option.desc === sortDesc
  ) || sortOptions[0];

  const handleSortSelect = (option: CombinedSortOption) => {
    onSortByChange(option.field);
    onSortDescToggle(option.desc);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Search */}
        <div className="relative max-w-md w-full flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
          />
        </div>

        {/* Right: Documents Only Button and Sort */}
        <div className="flex items-center gap-4">
          {/* Documents Only Button */}
          <button
            onClick={() => onToggleDocumentsOnly(!showDocumentsOnly)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-colors ${showDocumentsOnly
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <FileText className="h-4 w-4" />
            Documents Only
          </button>

          {/* Sort Controls */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap min-w-[180px] justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-gray-500" />
                  <span>{currentOption.label}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={`${option.field}-${option.desc}`}
                  onClick={() => handleSortSelect(option)}
                  className={`cursor-pointer ${currentOption.field === option.field && currentOption.desc === option.desc
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : ''
                    }`}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
