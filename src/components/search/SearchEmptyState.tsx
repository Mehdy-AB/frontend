'use client';

import React, { memo } from 'react';
import { Search, Filter, Folder, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

interface SearchEmptyStateProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onShowAdvancedSearch: () => void;
  searchHistory: any[];
  onHistoryItemClick: (item: any) => void;
}

const SearchEmptyState = memo<SearchEmptyStateProps>(({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onShowAdvancedSearch,
  searchHistory,
  onHistoryItemClick
}) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <Search className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Smart Document Search</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find documents, folders, and content across your entire repository with powerful search capabilities and advanced filtering.
          </p>
        </div>

        {/* Main Search Interface */}
        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search documents, folders, or content..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit()}
                  className="pl-12 pr-4 py-4 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0"
                />
              </div>
              <Button
                onClick={onSearchSubmit}
                size="lg"
                className="px-8 py-4 text-lg rounded-xl"
              >
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Advanced Search Toggle */}
          <div className="text-center mb-8">
            <Button
              variant="outline"
              onClick={onShowAdvancedSearch}
              className="px-6 py-3 rounded-xl"
            >
              <Filter className="w-5 h-5 mr-2" />
              Show Advanced Search
            </Button>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Searches</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchHistory.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onHistoryItemClick(item)}
                    className="text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <div className="font-medium text-gray-900 mb-1">{item.query}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button
              onClick={onShowAdvancedSearch}
              className="px-8 py-3 text-lg rounded-xl"
              size="lg"
            >
              <Filter className="w-5 h-5 mr-2" />
              Advanced Search
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/folders')}
              className="px-8 py-3 text-lg rounded-xl"
              size="lg"
            >
              <Folder className="w-5 h-5 mr-2" />
              Browse Folders
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Smart Search</h3>
              <p className="text-sm text-gray-600">Search by name, content, metadata, and more</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                <Filter className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
              <p className="text-sm text-gray-600">Filter by categories, dates, and custom fields</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
                <Tag className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Tag Search</h3>
              <p className="text-sm text-gray-600">Find documents by tags and labels</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SearchEmptyState.displayName = 'SearchEmptyState';

export default SearchEmptyState;
