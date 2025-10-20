'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearch } from '../../hooks/useSearch';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../hooks/useNotifications';
import {
  SearchHeader,
  SearchEmptyState,
  SearchPagination
} from '../../components/search';

// Dynamic imports for heavy components
const AdvancedSearchModal = dynamic(() => import('../../components/modals/AdvancedSearchModal'), {
  loading: () => <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 p-8"><div className="animate-pulse">Loading advanced search...</div></div>
});

const SearchResultsTable = dynamic(() => import('../../components/search/SearchResultsTable'), {
  loading: () => <div className="bg-white rounded-2xl shadow-lg p-8"><div className="animate-pulse">Loading table view...</div></div>
});

const SearchResultsGrid = dynamic(() => import('../../components/search/SearchResultsGrid'), {
  loading: () => <div className="bg-white rounded-2xl shadow-lg p-8"><div className="animate-pulse">Loading grid view...</div></div>
});

export default function SearchResultsPage() {
  const { t } = useLanguage();
  const { showNotification } = useNotifications();
  
  const {
    // State
    localSearchQuery,
    searchResults,
    loading,
    tableLoading,
    error,
    currentPage,
    viewMode,
    openDropdownId,
    searchHistory,
    showAdvancedSearch,
    selectedUser,
    selectedModel,
    users,
    models,
    metadataOperation,
    metadataFilters,
    userSearchQuery,
    showUserDropdown,
    filteredUsers,
    searchingUsers,
    modelSearchQuery,
    showModelDropdown,
    filteredModels,
    searchingModels,
    searchScope,
    sortBy,
    sortDesc,
    searchItems,
    totalResults,
    hasSearchCriteria,
    activeFiltersCount,
    
    // Actions
    setLocalSearchQuery,
    setCurrentPage,
    setViewMode,
    setOpenDropdownId,
    setShowAdvancedSearch,
    setSelectedUser,
    setSelectedModel,
    setMetadataOperation,
    setMetadataFilters,
    setUserSearchQuery,
    setShowUserDropdown,
    setModelSearchQuery,
    setShowModelDropdown,
    setSearchScope,
    setSortBy,
    setSortDesc,
    handleSearchInputChange,
    handleSearch,
    addMetadataFilter,
    removeMetadataFilter,
    updateMetadataFilter,
    formatFileSize,
    formatDate,
    fetchSearchResults
  } = useSearch();

  // Show empty state when no search criteria
  if (!hasSearchCriteria) {
    return (
      <SearchEmptyState
        searchQuery={localSearchQuery}
        onSearchChange={handleSearchInputChange}
        onSearchSubmit={handleSearch}
        onShowAdvancedSearch={() => setShowAdvancedSearch(true)}
        searchHistory={searchHistory}
        onHistoryItemClick={(item) => {
          setLocalSearchQuery(item.query);
          handleSearch();
        }}
      />
    );
  }

  if (error && !tableLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-error text-lg mb-4">{error}</div>
        <Button onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // Check if there are any search parameters
  const hasSearchParams = localSearchQuery.trim() || selectedUser || selectedModel || metadataFilters.length > 0 || 
    Object.values(searchScope).some(value => value === false) || sortBy !== 'score' || sortDesc !== false;

  // Empty state design when no search parameters
  if (!hasSearchParams) {
    return (
      <SearchEmptyState
        searchQuery={localSearchQuery}
        onSearchChange={handleSearchInputChange}
        onSearchSubmit={handleSearch}
        onShowAdvancedSearch={() => setShowAdvancedSearch(true)}
        searchHistory={searchHistory}
        onHistoryItemClick={(item) => {
          setLocalSearchQuery(item.query);
          handleSearch();
        }}
      />
    );
  }

  // Search results design when there are search parameters
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <SearchHeader
          searchQuery={localSearchQuery}
          onSearchChange={handleSearchInputChange}
          onSearchSubmit={handleSearch}
          showAdvancedSearch={showAdvancedSearch}
          onToggleAdvancedSearch={() => setShowAdvancedSearch(!showAdvancedSearch)}
          totalResults={totalResults}
          selectedUser={selectedUser}
          selectedModel={selectedModel}
          metadataFiltersCount={metadataFilters.length}
        />

        {/* Advanced Search Modal */}
        <AdvancedSearchModal
          open={showAdvancedSearch}
          onClose={() => setShowAdvancedSearch(false)}
          onSearch={async (searchRequest) => {
            // Update the search state with the advanced search request
            if (searchRequest.query) {
              setLocalSearchQuery(searchRequest.query);
            }
            
            // Update other search parameters from the advanced search request
            if (searchRequest.ownerId) {
              const user = users.find(u => u.id === searchRequest.ownerId);
              if (user) {
                setSelectedUser(user);
              }
            }
            
            if (searchRequest.metadataOperations) {
              setMetadataOperation(searchRequest.metadataOperations.operationType);
              setMetadataFilters(searchRequest.metadataOperations.conditions.map((condition: any) => ({
                key: condition.metadataDefinitionId.toString(),
                value: condition.value,
                operator: condition.operator
              })));
            }
            
            // Update search scope
            if (searchRequest.lookUpNames !== undefined) {
              setSearchScope(prev => ({
                ...prev,
                lookUpNames: searchRequest.lookUpNames,
                lookUpDescription: searchRequest.lookUpDescription,
                lookUpMetadataValue: searchRequest.lookUpMetadataValue,
                lookUpOcrContent: searchRequest.lookUpOcrContent,
                lookUpTags: searchRequest.lookUpTags
              }));
            }
            
            // Update content type filters
            if (searchRequest.includeFolders !== undefined && searchRequest.includeDocuments !== undefined) {
              setSearchScope(prev => ({
                ...prev,
                includeFolders: searchRequest.includeFolders,
                includeDocuments: searchRequest.includeDocuments
              }));
            }
            
            // Trigger search with the new request
            handleSearch();
          }}
          initialQuery={localSearchQuery}
        />

        {/* Search Results */}
        {searchItems.length === 0 && !tableLoading && searchResults ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="h-16 w-16 text-gray-400 mx-auto mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button onClick={() => setShowAdvancedSearch(true)}>
              Modify Search
            </Button>
          </div>
        ) : (
          viewMode === 'list' ? (
            <SearchResultsTable 
              items={searchItems} 
              formatFileSize={formatFileSize} 
              formatDate={formatDate}
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              showLoadingRows={tableLoading}
            />
          ) : (
            <SearchResultsGrid 
              items={searchItems} 
              formatFileSize={formatFileSize} 
              formatDate={formatDate}
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              showLoadingRows={tableLoading}
            />
          )
        )}

        {/* Loading indicator */}
        {tableLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex items-center justify-center text-gray-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              Loading search results...
            </div>
          </div>
        )}

        {/* Pagination */}
        {searchResults && searchResults.totalPages > 1 && (
          <SearchPagination
            totalPages={searchResults.totalPages}
            currentPage={currentPage}
            totalElements={totalResults}
            itemsPerPage={20}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}