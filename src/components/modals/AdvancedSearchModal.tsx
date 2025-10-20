"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, Search, Filter, ChevronDown, Trash2, Loader2, Plus, X as XIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FilingCategoryService } from "../../api/services/filingCategoryService";
import { UserService } from "../../api/services/userService";
import { EnhancedSearchService, SearchConfiguration } from "../../api/services/enhancedSearchService";
import {
  AdvancedSearchRequestDto,
  FilingCategoryResponseDto,
  MetadataFilter,
  SearchScope,
  FilterOperator,
  CategoryMetadataDefinitionDto,
  UserDto,
} from "../../types/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";

interface AdvancedSearchModalProps {
  open?: boolean;
  onClose?: () => void;
  onSearch?: (results: any) => void;
  initialQuery?: string;
  initialConfiguration?: SearchConfiguration;
}

/**
 * Changes made for multi-model selection & filter-only model component:
 * - Users can select multiple models (categories).
 * - Each metadata filter entry is associated with a categoryId.
 * - The model selector only manages models (no search results shown inside it).
 * - Filters are displayed grouped by their model.
 */
export default function AdvancedSearchModal({
  open = false,
  onClose = () => {},
  onSearch,
  initialQuery = "",
  initialConfiguration,
}: AdvancedSearchModalProps) {
  const router = useRouter();
  
  // Basic search state
  const [query, setQuery] = useState("");
  const [contentType, setContentType] = useState<"documents" | "folders" | "both">("both");

  // Search scope - updated to match new field names
  const [searchScope, setSearchScope] = useState({
    lookUpNames: true,
    lookUpDescription: true,
    lookUpMetadataValue: true,
    lookUpOcrContent: true,
    lookUpTags: true,
  });

  // User selection for "Created By"
  const [users, setUsers] = useState<UserDto[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserDto[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Model/Category state (single selection only)
  const [categories, setCategories] = useState<FilingCategoryResponseDto[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<FilingCategoryResponseDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FilingCategoryResponseDto | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  // Metadata filters (each filter optionally carries categoryId)
  const [metadataFilters, setMetadataFilters] = useState<(MetadataFilter & { categoryId?: string })[]>([]);
  const [metadataOperation, setMetadataOperation] = useState<'AND' | 'OR'>('AND');

  // Date filters with checkbox/button selection
  const [createdFrom, setCreatedFrom] = useState<string>("");
  const [createdTo, setCreatedTo] = useState<string>("");
  const [dateFilterType, setDateFilterType] = useState<'single' | 'range'>('single');
  const [createdDate, setCreatedDate] = useState<string>("");
  const [enableDateFilter, setEnableDateFilter] = useState(false);

  // Loading state
  const [searching, setSearching] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchUsers();
      // Initialize with provided configuration
      if (initialQuery) {
        setQuery(initialQuery);
      }
      if (initialConfiguration) {
        if (initialConfiguration.filters?.contentType) {
          setContentType(initialConfiguration.filters.contentType);
        }
        if (initialConfiguration.filters?.searchScope) {
          // Map old search scope to new structure
          const oldScope = initialConfiguration.filters.searchScope as any;
          setSearchScope({
            lookUpNames: oldScope.searchInName || oldScope.lookUpNames || true,
            lookUpDescription: oldScope.searchInDescription || oldScope.lookUpDescription || true,
            lookUpMetadataValue: oldScope.searchInMetadata || oldScope.lookUpMetadataValue || false,
            lookUpOcrContent: oldScope.searchInOcrText || oldScope.lookUpOcrContent || false,
            lookUpTags: oldScope.searchInTags || oldScope.lookUpTags || false,
          });
        }
        if (initialConfiguration.filters?.dateRange) {
          if (initialConfiguration.filters.dateRange.from && initialConfiguration.filters.dateRange.to) {
            setDateFilterType('range');
            setCreatedFrom(initialConfiguration.filters.dateRange.from);
            setCreatedTo(initialConfiguration.filters.dateRange.to);
            setEnableDateFilter(true);
          } else if (initialConfiguration.filters.dateRange.from) {
            setDateFilterType('single');
            setCreatedDate(initialConfiguration.filters.dateRange.from);
            setEnableDateFilter(true);
          }
        }
        // Load selected category if provided
        if (initialConfiguration.filters?.selectedCategories && initialConfiguration.filters.selectedCategories.length > 0) {
          // This would need to be implemented based on your category loading logic
          // For now, we'll just set the query
        }
      }
    }
  }, [open, initialQuery, initialConfiguration]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose]);

  const fetchUsers = async (searchQuery?: string) => {
    try {
      setLoadingUsers(true);
      const params = searchQuery ? { query: searchQuery, size: 100 } : { size: 100 };
      const fetchedUsers = await UserService.getAllUsers(params);
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCategories = async (searchQuery?: string) => {
    try {
      setLoadingCategories(true);
      const params = searchQuery ? { name: searchQuery, size: 100 } : { size: 100 };
      const response = await FilingCategoryService.getAllFilingCategories(params);
      const fetchedCategories = response.content || [];
      setCategories(fetchedCategories);
      setFilteredCategories(fetchedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Local filter for users
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const q = userSearchQuery.toLowerCase();
    setFilteredUsers(
      users.filter(
        (user) => 
          user.firstName.toLowerCase().includes(q) || 
          user.lastName.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          user.username.toLowerCase().includes(q)
      )
    );
  }, [userSearchQuery, users]);

  // Local filter for categories
  useEffect(() => {
    if (!categorySearchQuery.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const q = categorySearchQuery.toLowerCase();
    setFilteredCategories(
      categories.filter(
        (cat) => cat.name.toLowerCase().includes(q) || (cat.description && cat.description.toLowerCase().includes(q))
      )
    );
  }, [categorySearchQuery, categories]);

  // Debounced API fetch for users
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      fetchUsers();
      return;
    }
    const timer = setTimeout(() => fetchUsers(userSearchQuery), 500);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // Debounced API fetch for categories
  useEffect(() => {
    if (!categorySearchQuery.trim()) {
      // When clearing search query, refetch all categories
      fetchCategories();
      return;
    }
    const timer = setTimeout(() => fetchCategories(categorySearchQuery), 500);
    return () => clearTimeout(timer);
  }, [categorySearchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    }
    if (showCategoryDropdown) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showCategoryDropdown]);

  // Escape closes modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Default operator determination
  const getDefaultOperator = (fieldType: string): FilterOperator => {
    switch (fieldType.toUpperCase()) {
      case "STRING":
        return FilterOperator.CONTAINS;
      case "NUMBER":
      case "FLOAT":
        return FilterOperator.EQUALS;
      case "DATE":
      case "DATETIME":
        return FilterOperator.EQUALS;
      case "LIST":
        return FilterOperator.IN;
      case "BOOLEAN":
        return FilterOperator.EQUALS;
      default:
        return FilterOperator.EQUALS;
    }
  };

  // Select a single category (replaces multi-select)
  const selectCategory = (category: FilingCategoryResponseDto) => {
    // Clear previous selection and its filters
    setSelectedCategory(null);
    setMetadataFilters([]);
    
    // Set new selection
    setSelectedCategory(category);

    // add its metadata definitions as filters (category-scoped)
    if (category.metadataDefinitions && category.metadataDefinitions.length > 0) {
      const newFilters = category.metadataDefinitions.map((def: CategoryMetadataDefinitionDto) => ({
        categoryId: String(category.id),
        metadataDefinitionId: def.id,
        fieldName: def.key,
        fieldType: def.dataType,
        operator: getDefaultOperator(def.dataType),
        value: "",
        caseInsensitive: true,
        inclusive: true,
      }));

      setMetadataFilters(newFilters);
    }
  };

  // Select a user
  const selectUser = (user: UserDto) => {
    setSelectedUser(user);
    setShowUserDropdown(false);
  };

  const updateFilter = (index: number, updates: Partial<MetadataFilter & { categoryId?: string }>) => {
    setMetadataFilters((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const removeFilter = (index: number) => {
    setMetadataFilters((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove selected category and its filters
  const removeCategory = () => {
    setSelectedCategory(null);
    setMetadataFilters([]);
  };

  const handleSearch = async () => {
    // Allow search even without query if there are selected categories or metadata filters
    const hasQuery = query.trim();
    const hasSelectedCategory = selectedCategory !== null;
    const hasMetadataFilters = metadataFilters.some(f => f.value || f.fromValue || f.toValue || (f.values && f.values.length > 0));
    const hasDateFilter = enableDateFilter && ((dateFilterType === 'single' && createdDate) || (dateFilterType === 'range' && (createdFrom || createdTo)));
    const hasSelectedUser = selectedUser !== null;
    
    if (!hasQuery && !hasSelectedCategory && !hasMetadataFilters && !hasDateFilter && !hasSelectedUser) {
      return;
    }
    
    setSearching(true);
    try {
      // Filter metadata filters to only include those with actual values
      const configuredMetadataFilters = metadataFilters.filter(f => 
        f.value && f.value.trim() !== ''
      );
      
      // Create search request using new DTO structure
      const searchRequest = {
        query: hasQuery ? query.trim() : '',
        page: 0,
        size: 20,
        includeFolders: contentType === 'folders' || contentType === 'both',
        includeDocuments: contentType === 'documents' || contentType === 'both',
        ownerId: selectedUser?.id,
        lookUpNames: searchScope.lookUpNames,
        lookUpDescription: searchScope.lookUpDescription,
        lookUpOcrContent: searchScope.lookUpOcrContent,
        lookUpMetadataValue: searchScope.lookUpMetadataValue,
        lookUpTags: searchScope.lookUpTags,
        sortBy: 'score',
        sortDesc: false,
        // Date filters
        createdAt: enableDateFilter && dateFilterType === 'single' ? createdDate : undefined,
        createdAtFrom: enableDateFilter && dateFilterType === 'range' ? createdFrom : undefined,
        createdAtTo: enableDateFilter && dateFilterType === 'range' ? createdTo : undefined,
        // Metadata operations
        metadataOperations: configuredMetadataFilters.length > 0 ? {
          operationType: metadataOperation,
          conditions: configuredMetadataFilters.map(f => ({
            metadataDefinitionId: f.metadataDefinitionId || 0,
            operator: f.operator,
            value: f.value || f.fromValue || f.toValue || '',
            fromValue: f.fromValue,
            toValue: f.toValue,
            values: f.values
          }))
        } : undefined
      };

      // Save search to history
      EnhancedSearchService.saveSearchToHistory({
        query: hasQuery ? query.trim() : '',
        searchType: 'unified',
        filters: {
          lookUpNames: searchScope.lookUpNames,
          lookUpDescription: searchScope.lookUpDescription,
          lookUpOcrContent: searchScope.lookUpOcrContent,
          lookUpMetadataValue: searchScope.lookUpMetadataValue,
          lookUpTags: searchScope.lookUpTags,
          includeFolders: contentType === 'folders' || contentType === 'both',
          includeDocuments: contentType === 'documents' || contentType === 'both',
          dateRange: hasDateFilter ? {
            from: dateFilterType === 'single' ? createdDate : createdFrom,
            to: dateFilterType === 'range' ? createdTo : undefined,
            enabled: true
          } : undefined
        }
      });

      // If onSearch callback is provided, use it instead of navigating
      if (onSearch) {
        await onSearch(searchRequest);
      } else {
        // Navigate to search page with query parameter
        const searchParams = new URLSearchParams();
        if (hasQuery) {
          searchParams.set('query', query.trim());
        }
        router.push(`/search?${searchParams.toString()}`);
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setQuery("");
    setSelectedCategory(null);
    setSelectedUser(null);
    setMetadataFilters([]);
    setCreatedFrom("");
    setCreatedTo("");
    setCreatedDate("");
    setDateFilterType('single');
    setEnableDateFilter(false);
    setCategorySearchQuery("");
    setUserSearchQuery("");
    setSearchScope({
      lookUpNames: true,
      lookUpDescription: true,
      lookUpMetadataValue: true,
      lookUpOcrContent: true,
      lookUpTags: true,
    });
    setContentType("both");
    setMetadataOperation('AND');
  };

  const renderFilterInput = (filter: MetadataFilter & { categoryId?: string }, index: number) => {
    const metadataDef = selectedCategory
      ?.metadataDefinitions?.find((d: CategoryMetadataDefinitionDto) => d.id === filter.metadataDefinitionId);

    const fieldType = (filter.fieldType || "").toUpperCase();
    const isMandatory = metadataDef?.mandatory || false;
    const isInOperator = filter.operator === FilterOperator.IN;

    if (fieldType === "LIST" && metadataDef?.list) {
      // For LIST type with mandatory=true, allow custom input
      if (isMandatory) {
        return (
          <div className="space-y-2">
            <Select
              value={filter.value || ""}
              onValueChange={(value) => updateFilter(index, { value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select or type custom value..." />
              </SelectTrigger>
              <SelectContent>
                {metadataDef.list.option?.map((opt: string) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={filter.value || ""}
              onChange={(e) => updateFilter(index, { value: e.target.value })}
              placeholder="Or enter custom value..."
              className="w-full"
            />
          </div>
        );
      }

      // For operation 'in', allow multiple values
      if (isInOperator) {
        const values = filter.values || [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {values.map((value, idx) => (
                <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                  {value}
                  <button
                    onClick={() => {
                      const newValues = values.filter((_, i) => i !== idx);
                      updateFilter(index, { values: newValues });
                    }}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !values.includes(value)) {
                    updateFilter(index, { values: [...values, value] });
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add from list..." />
                </SelectTrigger>
                <SelectContent>
                  {metadataDef.list.option?.map((opt: string) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const customValue = prompt("Enter custom value:");
                  if (customValue && !values.includes(customValue)) {
                    updateFilter(index, { values: [...values, customValue] });
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      }

      // Regular LIST dropdown
      return (
        <Select
          value={filter.value || ""}
          onValueChange={(value) => updateFilter(index, { value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
          {metadataDef.list.option?.map((opt: string) => (
              <SelectItem key={opt} value={opt}>
              {opt}
              </SelectItem>
          ))}
          </SelectContent>
        </Select>
      );
    }

    if (fieldType === "NUMBER" || fieldType === "FLOAT") {
      if (filter.operator === FilterOperator.RANGE) {
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step={fieldType === "FLOAT" ? "any" : "1"}
              value={filter.fromValue || ""}
              onChange={(e) => updateFilter(index, { fromValue: e.target.value })}
              placeholder="From"
              className="flex-1"
            />
            <span className="text-gray-400 text-sm">to</span>
            <Input
              type="number"
              step={fieldType === "FLOAT" ? "any" : "1"}
              value={filter.toValue || ""}
              onChange={(e) => updateFilter(index, { toValue: e.target.value })}
              placeholder="To"
              className="flex-1"
            />
          </div>
        );
      }
      return (
        <Input
          type="number"
          step={fieldType === "FLOAT" ? "any" : "1"}
          value={filter.value || ""}
          onChange={(e) => updateFilter(index, { value: e.target.value })}
          placeholder="Enter value"
          className="w-full"
        />
      );
    }

    if (fieldType === "DATE" || fieldType === "DATETIME") {
      if (filter.operator === FilterOperator.RANGE) {
        return (
          <div className="flex items-center gap-2">
            <Input
              type={fieldType === "DATETIME" ? "datetime-local" : "date"}
              value={filter.fromValue || ""}
              onChange={(e) => updateFilter(index, { fromValue: e.target.value })}
              className="flex-1"
            />
            <span className="text-gray-400 text-sm">to</span>
            <Input
              type={fieldType === "DATETIME" ? "datetime-local" : "date"}
              value={filter.toValue || ""}
              onChange={(e) => updateFilter(index, { toValue: e.target.value })}
              className="flex-1"
            />
          </div>
        );
      }
      return (
        <Input
          type={fieldType === "DATETIME" ? "datetime-local" : "date"}
          value={filter.value || ""}
          onChange={(e) => updateFilter(index, { value: e.target.value })}
          className="w-full"
        />
      );
    }

    if (fieldType === "BOOLEAN") {
      return (
        <Select
          value={filter.value || ""}
          onValueChange={(value) => updateFilter(index, { value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (fieldType === "STRING") {
      return (
        <Input
          type="text"
          value={filter.value || ""}
          onChange={(e) => updateFilter(index, { value: e.target.value })}
          placeholder="Enter text value"
          className="w-full"
        />
      );
    }

    return (
      <Input
        type="text"
        value={filter.value || ""}
        onChange={(e) => updateFilter(index, { value: e.target.value })}
        placeholder="Enter value"
        className="w-full"
      />
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="relative w-full max-w-6xl max-h-[88vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Advanced Search"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-md shadow-sm flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Advanced Search</h3>
              <p className="text-sm text-slate-500">Compose precise searches using model fields, date ranges and filters.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleReset} title="Reset" className="px-3 py-2 text-sm rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-100 text-slate-700">Reset</button>
            <button onClick={onClose} aria-label="Close" className="p-2 rounded-md hover:bg-gray-100"><X className="w-5 h-5 text-slate-700" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Core search + configured filters */}
          <section className="space-y-5">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <label className="text-sm font-medium text-slate-800">Search Query</label>
              <div className="mt-2">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter keywords, phrases or IDs (optional)..." className="w-full" />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-slate-500 mr-2">Search In:</span>
                {[
                  { key: "lookUpNames", label: "Name" },
                  { key: "lookUpDescription", label: "Description" },
                  { key: "lookUpMetadataValue", label: "Metadata" },
                  { key: "lookUpOcrContent", label: "File Content" },
                  { key: "lookUpTags", label: "Tags" },
                ].map(({ key, label }) => {
                  const isActive = searchScope[key as keyof typeof searchScope];
                  return (
                    <button 
                      key={key} 
                      onClick={() => setSearchScope((s) => ({ ...s, [key]: !s[key as keyof typeof s] }))} 
                      className={`px-3 py-1.5 text-xs rounded-full transition-all border ${
                        isActive 
                          ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                          : "bg-white border-gray-100 text-slate-600 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600">Content</label>
                  <Select value={contentType} onValueChange={(value: "documents" | "folders" | "both") => setContentType(value)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Documents & Folders</SelectItem>
                      <SelectItem value="documents">Documents Only</SelectItem>
                      <SelectItem value="folders">Folders Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-slate-600">Created By</label>
                  <div className="relative mt-1">
                    <input 
                      type="text" 
                      value={userSearchQuery} 
                      onChange={(e) => { setUserSearchQuery(e.target.value); setShowUserDropdown(true); }} 
                      onFocus={() => setShowUserDropdown(true)} 
                      placeholder={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : "Search users..."} 
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                    />
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${showUserDropdown ? 'rotate-180' : ''}`} />
                    
                    {showUserDropdown && (
                      <div className="absolute z-30 w-full mt-2 bg-white border border-gray-100 rounded-md shadow-lg max-h-64 overflow-auto">
                        {loadingUsers ? (
                          <div className="p-4 text-center text-sm text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                            Loading...
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-500">No users found</div>
                        ) : (
                          filteredUsers.map((user) => (
                            <button key={user.id} onClick={() => selectUser(user)} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b last:border-b-0">
                              <div className="font-medium text-slate-900">{user.firstName} {user.lastName}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {selectedUser && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {selectedUser.firstName} {selectedUser.lastName}
                        <button onClick={() => setSelectedUser(null)} className="ml-2 text-gray-400 hover:text-gray-600">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Date Filter Section */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input 
                    type="checkbox" 
                    id="enableDateFilter"
                    checked={enableDateFilter}
                    onChange={(e) => setEnableDateFilter(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="enableDateFilter" className="text-xs text-slate-600">Enable Date Filter</label>
                </div>
                
                {enableDateFilter && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setDateFilterType('single')}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                          dateFilterType === 'single' 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                        }`}
                      >
                        Single Date
                      </button>
                      <button 
                        onClick={() => setDateFilterType('range')}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                          dateFilterType === 'range' 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                        }`}
                      >
                        Date Range
                      </button>
                    </div>

                    {dateFilterType === 'single' ? (
                      <div>
                        <label className="text-xs text-slate-600">Created Date</label>
                        <Input 
                          type="datetime-local" 
                          value={createdDate} 
                          onChange={(e) => setCreatedDate(e.target.value)} 
                          className="mt-1 w-full" 
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-600">Created From</label>
                          <Input type="datetime-local" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="mt-1 w-full" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600">Created To</label>
                          <Input type="datetime-local" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="mt-1 w-full" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>


            {/* Model selector section */}
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-slate-800">Document Model</div>
                  <div className="text-xs text-slate-500">Single selection</div>
                </div>

                <div ref={dropdownRef} className="relative">
                  <div className="relative">
                  <input 
                    type="text" 
                    value={categorySearchQuery} 
                    onChange={(e) => { setCategorySearchQuery(e.target.value); setShowCategoryDropdown(true); }} 
                    onFocus={() => setShowCategoryDropdown(true)} 
                    placeholder={selectedCategory ? selectedCategory.name : "Search or select a model..."} 
                    className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </div>

                  {showCategoryDropdown && (
                    <div className="absolute z-30 w-full mt-2 bg-white border border-gray-100 rounded-md shadow-lg max-h-64 overflow-auto">
                      {loadingCategories ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                          Loading...
                        </div>
                      ) : filteredCategories.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No models found</div>
                      ) : (
                        filteredCategories.map((cat) => {
                          const isSelected = selectedCategory?.id === cat.id;
                          return (
                            <button key={cat.id} onClick={() => selectCategory(cat)} className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b last:border-b-0 ${isSelected ? 'bg-blue-50' : ''}`}>
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900 truncate">{cat.name}</div>
                                  {cat.description && <div className="text-xs text-slate-500 truncate">{cat.description}</div>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-xs text-slate-400">{cat.metadataDefinitions?.length || 0} fields</div>
                                  <div className={`h-4 w-4 rounded-sm border ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}></div>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {selectedCategory && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{selectedCategory.name}</div>
                        {selectedCategory.description && <div className="text-xs text-slate-500">{selectedCategory.description}</div>}
                      </div>
                      <button onClick={removeCategory} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-xs text-slate-500">Tip: select a model to expose its fields for filtering.</div>
              </div>

            {/* Metadata Filters Section */}
            {selectedCategory && metadataFilters.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-slate-800">Metadata Filters</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Operation:</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setMetadataOperation('AND')}
                        className={`px-2 py-1 text-xs rounded border transition-all ${
                          metadataOperation === 'AND' 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                        }`}
                      >
                        AND
                      </button>
                      <button 
                        onClick={() => setMetadataOperation('OR')}
                        className={`px-2 py-1 text-xs rounded border transition-all ${
                          metadataOperation === 'OR' 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                        }`}
                      >
                        OR
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {metadataFilters.map((filter, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700 mb-2">{filter.fieldName}</div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={filter.operator}
                            onValueChange={(value) => updateFilter(index, { operator: value as FilterOperator })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EQUALS">Equals</SelectItem>
                              <SelectItem value="CONTAINS">Contains</SelectItem>
                              <SelectItem value="STARTS_WITH">Starts With</SelectItem>
                              <SelectItem value="ENDS_WITH">Ends With</SelectItem>
                              <SelectItem value="GT">Greater Than</SelectItem>
                              <SelectItem value="LT">Less Than</SelectItem>
                              <SelectItem value="GTE">Greater or Equal</SelectItem>
                              <SelectItem value="LTE">Less or Equal</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex-1">
                            {renderFilterInput(filter, index)}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFilter(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
          <div className="text-sm text-slate-600">Advanced search helps you find exact documents quickly.</div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-md text-sm bg-white border border-gray-100 hover:bg-gray-50">Cancel</button>
            <button 
              onClick={handleSearch} 
              disabled={searching || (!query.trim() && !selectedCategory && !metadataFilters.some(f => f.value && f.value.trim() !== '') && !selectedUser && !(enableDateFilter && ((dateFilterType === 'single' && createdDate) || (dateFilterType === 'range' && (createdFrom || createdTo)))))} 
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}<span>Run search</span>
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
