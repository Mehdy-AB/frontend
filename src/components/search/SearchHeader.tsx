'use client';

import React, { memo } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  showAdvancedSearch: boolean;
  onToggleAdvancedSearch: () => void;
  totalResults: number;
  selectedUser: any;
  selectedModel: any;
  metadataFiltersCount: number;
  isSearching?: boolean;
}

const SearchHeader = memo<SearchHeaderProps>(({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  showAdvancedSearch,
  onToggleAdvancedSearch,
  totalResults,
  selectedUser,
  selectedModel,
  metadataFiltersCount,
  isSearching = false
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="text-lg">
              {totalResults} result{totalResults !== 1 ? 's' : ''} found
            </span>
            {searchQuery && (
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                "{searchQuery}"
              </span>
            )}
            {selectedUser && (
              <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                Owner: {selectedUser.firstName} {selectedUser.lastName}
              </span>
            )}
            {selectedModel && (
              <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                Model: {selectedModel.name}
              </span>
            )}
            {metadataFiltersCount > 0 && (
              <span className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                {metadataFiltersCount} metadata filter{metadataFiltersCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit()}
              className="pl-10 pr-4"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Advanced Search Toggle */}
          <Button
            variant="outline"
            onClick={onToggleAdvancedSearch}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedSearch ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
});

SearchHeader.displayName = 'SearchHeader';

export default SearchHeader;
