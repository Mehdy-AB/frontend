'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { notificationApiClient } from '@/api/notificationClient';
import { UserService } from '@/api/services/userService';
import { EnhancedSearchService, SearchConfiguration, SearchHistoryItem } from '@/api/services/enhancedSearchService';
import { GlobalSearchResultDto, UserDto, FilingCategoryResponseDto } from '@/types/api';

interface MetadataFilter {
  key: string;
  value: string;
  operator: string;
}

interface SearchScope {
  lookUpNames: boolean;
  lookUpMetadataValue: boolean;
  lookUpOcrContent: boolean;
  lookUpDescription: boolean;
  lookUpTags: boolean;
  includeFolders: boolean;
  includeDocuments: boolean;
}

export const useSearch = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get search parameters from URL
  const query = searchParams.get('query') || '';
  
  // Local search query state for input
  const [localSearchQuery, setLocalSearchQuery] = useState(query);
  
  // Search results and loading states
  const [searchResults, setSearchResults] = useState<GlobalSearchResultDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  
  // Advanced search states
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [selectedModel, setSelectedModel] = useState<FilingCategoryResponseDto | null>(null);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [models, setModels] = useState<FilingCategoryResponseDto[]>([]);
  const [metadataOperation, setMetadataOperation] = useState<'AND' | 'OR'>('AND');
  const [metadataFilters, setMetadataFilters] = useState<MetadataFilter[]>([]);
  
  // User search states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<UserDto[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  // Model search states
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [filteredModels, setFilteredModels] = useState<FilingCategoryResponseDto[]>([]);
  const [searchingModels, setSearchingModels] = useState(false);
  
  // Search scope states
  const [searchScope, setSearchScope] = useState<SearchScope>({
    lookUpNames: true,
    lookUpMetadataValue: true,
    lookUpOcrContent: true,
    lookUpDescription: true,
    lookUpTags: true,
    includeFolders: true,
    includeDocuments: true
  });
  
  // Sorting
  const [sortBy, setSortBy] = useState<string>('score');
  const [sortDesc, setSortDesc] = useState(false);

  // Parse selected categories from URL
  const selectedCategories = useMemo(() => {
    try {
      const categoriesParam = searchParams.get('selectedCategories');
      if (categoriesParam) {
        return JSON.parse(decodeURIComponent(categoriesParam));
      }
      return [];
    } catch (error) {
      console.error('Error parsing selectedCategories from URL:', error);
      return [];
    }
  }, [searchParams]);

  // Combine search results for unified display
  const getSearchItems = useCallback((): any[] => {
    if (!searchResults) return [];
    
    const folderItems = searchResults.folders.map(folder => ({
      ...folder,
      type: 'folder' as const
    }));
    
    const documentItems = searchResults.documents.map(doc => ({
      ...doc,
      type: 'document' as const
    }));
    
    return [...folderItems, ...documentItems];
  }, [searchResults]);

  // Load users and models on component mount
  useEffect(() => {
    const loadUsersAndModels = async () => {
      try {
        const [usersData, modelsData] = await Promise.all([
          UserService.getAllUsers({ size: 100 }),
          // Add model loading here when API is available
          Promise.resolve([] as FilingCategoryResponseDto[])
        ]);
        setUsers(usersData);
        setModels(modelsData);
        setFilteredUsers(usersData);
        setFilteredModels(modelsData);
      } catch (error) {
        console.error('Error loading users and models:', error);
      }
    };
    
    loadUsersAndModels();
  }, []);

  // User search functionality
  const performUserSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setFilteredUsers(users);
      return;
    }
    
    setSearchingUsers(true);
    try {
      const searchResults = await UserService.getAllUsers({ 
        query: query,
        size: 50
      });
      setFilteredUsers(searchResults);
    } catch (error) {
      console.error('Error searching users:', error);
      setFilteredUsers(users);
    } finally {
      setSearchingUsers(false);
    }
  }, [users]);

  // Model search functionality
  const performModelSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setFilteredModels(models);
      return;
    }
    
    setSearchingModels(true);
    try {
      // Filter models locally for now since we don't have API
      const filtered = models.filter(model => 
        model.name.toLowerCase().includes(query.toLowerCase()) ||
        model.description.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredModels(filtered);
    } catch (error) {
      console.error('Error searching models:', error);
      setFilteredModels(models);
    } finally {
      setSearchingModels(false);
    }
  }, [models]);

  // Debounced user search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performUserSearch(userSearchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [userSearchQuery, performUserSearch]);

  // Debounced model search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performModelSearch(modelSearchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [modelSearchQuery, performModelSearch]);

  // Fetch search results
  const fetchSearchResults = useCallback(async () => {
    const hasQuery = localSearchQuery.trim();
    const hasSelectedUser = selectedUser !== null;
    const hasSelectedModel = selectedModel !== null;
    const hasMetadataFilters = metadataFilters.length > 0;
    const hasOtherFilters = Object.values(searchScope).some(value => value === false);
    
    if (!hasQuery && !hasSelectedUser && !hasSelectedModel && !hasMetadataFilters && !hasOtherFilters) {
      setError('No search criteria provided');
      setTableLoading(false);
      return;
    }

    try {
      setTableLoading(true);
      setError(null);
      
      const searchParams: any = {
        query: localSearchQuery || '',
        page: currentPage,
        size: 20,
        includeFolders: searchScope.includeFolders,
        includeDocuments: searchScope.includeDocuments,
        ownerId: selectedUser?.id,
        createdAt: undefined, // Will be set if date filters are used
        createdAtFrom: undefined, // Will be set if date range filters are used
        createdAtTo: undefined, // Will be set if date range filters are used
        lookUpNames: searchScope.lookUpNames,
        lookUpMetadataValue: searchScope.lookUpMetadataValue,
        lookUpOcrContent: searchScope.lookUpOcrContent,
        lookUpDescription: searchScope.lookUpDescription,
        lookUpTags: searchScope.lookUpTags,
        sortBy,
        sortDesc
      };

      // Add metadata operations if filters exist and filter out empty ones
      const validMetadataFilters = metadataFilters.filter(filter => 
        filter.value && filter.value.trim() !== ''
      );
      
      if (validMetadataFilters.length > 0) {
        searchParams.metadataOperations = {
          operationType: metadataOperation,
          conditions: validMetadataFilters.map(filter => ({
            metadataDefinitionId: parseInt(filter.key) || 0, // Convert key to metadataDefinitionId
            operator: filter.operator,
            value: filter.value
          }))
        };
      }
      
      const response = await notificationApiClient.unifiedSearch(searchParams);
      setSearchResults(response);
    } catch (err) {
      setError('Failed to load search results');
      console.error('Error fetching search results:', err);
    } finally {
      setTableLoading(false);
    }
  }, [localSearchQuery, currentPage, selectedUser, selectedModel, metadataFilters, searchScope, sortBy, sortDesc, metadataOperation]);

  // Load search history on component mount
  useEffect(() => {
    setSearchHistory(EnhancedSearchService.getSearchHistory());
  }, []);

  // Update local search query when URL query changes
  useEffect(() => {
    setLocalSearchQuery(query);
  }, [query]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Check if there are any search criteria
      const hasQuery = localSearchQuery.trim();
      const hasSelectedUser = selectedUser !== null;
      const hasSelectedModel = selectedModel !== null;
      const hasMetadataFilters = metadataFilters.length > 0;
      const hasOtherFilters = Object.values(searchScope).some(value => value === false);
      
      if (hasQuery || hasSelectedUser || hasSelectedModel || hasMetadataFilters || hasOtherFilters) {
        fetchSearchResults();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, currentPage, selectedUser, selectedModel, metadataFilters, searchScope, sortBy, sortDesc, fetchSearchResults]);

  // Smart search with local filtering first, then API call
  const performSmartSearch = useCallback((query: string) => {
    // First, filter locally for immediate response
    if (query.trim() && searchResults) {
      const localResults = {
        ...searchResults,
        documents: searchResults.documents.filter(doc => 
          doc.name.toLowerCase().includes(query.toLowerCase()) ||
          doc.description?.toLowerCase().includes(query.toLowerCase()) ||
          doc.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        ),
        folders: searchResults.folders.filter(folder => 
          folder.name.toLowerCase().includes(query.toLowerCase()) ||
          folder.description?.toLowerCase().includes(query.toLowerCase())
        )
      };
      // Update display with local results immediately
      setSearchResults(localResults);
    }

    // Set up delayed API call
    const timeout = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        setTableLoading(true);
        try {
          await fetchSearchResults();
        } finally {
          setTableLoading(false);
          setIsSearching(false);
        }
      }
    }, 500); // 500ms delay

    return timeout;
  }, [searchResults, fetchSearchResults]);

  // Handle search input change with smart search
  const handleSearchInputChange = useCallback((value: string) => {
    setLocalSearchQuery(value);
    
    if (value.trim()) {
      // Save search to history
      EnhancedSearchService.saveSearchToHistory({
        query: value.trim(),
        searchType: 'unified',
        filters: searchScope
      });

      // Update search history state
      setSearchHistory(EnhancedSearchService.getSearchHistory());

      // Perform smart search
      performSmartSearch(value);
    }
  }, [searchScope, performSmartSearch]);

  // Handle search execution
  const handleSearch = useCallback(() => {
    setCurrentPage(0);
    fetchSearchResults();
  }, [fetchSearchResults]);

  // Add metadata filter
  const addMetadataFilter = useCallback(() => {
    setMetadataFilters([...metadataFilters, { key: '', value: '', operator: 'CONTAINS' }]);
  }, [metadataFilters]);

  // Remove metadata filter
  const removeMetadataFilter = useCallback((index: number) => {
    setMetadataFilters(metadataFilters.filter((_, i) => i !== index));
  }, [metadataFilters]);

  // Update metadata filter
  const updateMetadataFilter = useCallback((index: number, field: 'key' | 'value' | 'operator', value: string) => {
    const updated = [...metadataFilters];
    updated[index] = { ...updated[index], [field]: value };
    setMetadataFilters(updated);
  }, [metadataFilters]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (!searchScope.lookUpNames) count++;
    if (!searchScope.lookUpMetadataValue) count++;
    if (!searchScope.lookUpOcrContent) count++;
    if (!searchScope.lookUpDescription) count++;
    if (!searchScope.lookUpTags) count++;
    if (!searchScope.includeFolders) count++;
    if (!searchScope.includeDocuments) count++;
    if (sortBy !== 'score') count++;
    if (sortDesc) count++;
    if (selectedUser) count++;
    if (selectedModel) count++;
    if (metadataFilters.length > 0) count++;
    return count;
  }, [searchScope, sortBy, sortDesc, selectedUser, selectedModel, metadataFilters]);

  const activeFiltersCount = useMemo(() => getActiveFiltersCount(), [getActiveFiltersCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        setOpenDropdownId(null);
        setShowSearchHistory(false);
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  // Show empty state when no search criteria
  const hasSearchCriteria = useMemo(() => {
    return localSearchQuery.trim() || selectedUser || selectedModel || metadataFilters.length > 0 || 
      Object.values(searchScope).some(value => value === false);
  }, [localSearchQuery, selectedUser, selectedModel, metadataFilters, searchScope]);

  const searchItems = useMemo(() => getSearchItems(), [getSearchItems]);
  const totalResults = useMemo(() => searchResults?.totalElements || 0, [searchResults]);

  return {
    // State
    localSearchQuery,
    searchResults,
    loading,
    tableLoading,
    isSearching,
    error,
    currentPage,
    viewMode,
    openDropdownId,
    searchHistory,
    showSearchHistory,
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
    selectedCategories,
    searchItems,
    totalResults,
    hasSearchCriteria,
    activeFiltersCount,
    
    // Actions
    setLocalSearchQuery,
    setCurrentPage,
    setViewMode,
    setOpenDropdownId,
    setShowSearchHistory,
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
  };
};
