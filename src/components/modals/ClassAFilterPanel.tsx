'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  User,
  FileText,
  X,
  Filter,
  RotateCcw,
  Search,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { FilingCategoryResponseDto } from '@/types/api';

interface ClassAFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ClassAFilters) => void;
  currentFilters: ClassAFilters;
}

export interface ClassAFilters {
  query?: string;
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  exactDate?: string;
  dateSearchType?: 'exact' | 'range';
  page?: number;
  size?: number;
}

export default function ClassAFilterPanel({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters
}: ClassAFilterPanelProps) {
  const [filters, setFilters] = useState<ClassAFilters>(currentFilters);
  
  // Removed Created By filter per request

  // Category selection state
  const [categories, setCategories] = useState<FilingCategoryResponseDto[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<FilingCategoryResponseDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FilingCategoryResponseDto | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  // Removed Created By filter logic

  // Local filter for categories
  useEffect(() => {
    if (!categorySearchQuery.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const q = categorySearchQuery.toLowerCase();
    setFilteredCategories(
      categories.filter(
        (category) => 
          category.name.toLowerCase().includes(q) ||
          (category.description && category.description.toLowerCase().includes(q))
      )
    );
  }, [categorySearchQuery, categories]);

  // Removed Created By fetch

  const fetchCategories = async (searchQuery?: string) => {
    try {
      setLoadingCategories(true);
      const params = searchQuery ? { name: searchQuery, size: 100 } : { size: 100 };
      const response = await filingCategoryService.getAllFilingCategories(params);
      const fetchedCategories = response.content || [];
      setCategories(fetchedCategories);
      setFilteredCategories(fetchedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleFilterChange = (key: keyof ClassAFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters: ClassAFilters = {};
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.categoryId) count++;
    if (filters.dateFrom || filters.dateTo || filters.exactDate) count++;
    return count;
  };

  // Selection functions
  // Removed Created By selector

  const selectCategory = (category: FilingCategoryResponseDto) => {
    setSelectedCategory(category);
    handleFilterChange('categoryId', category.id);
    setShowCategoryDropdown(false);
    setCategorySearchQuery('');
  };

  // Removed Created By remove

  const removeCategory = () => {
    setSelectedCategory(null);
    handleFilterChange('categoryId', undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-surface rounded-t-lg border-t border-ui w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-ui">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Filter Documents</h2>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-background transition-colors text-neutral-text-light"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Query Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search Query
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Enter search query for documents"
                  value={filters.query || ''}
                  onChange={(e) => handleFilterChange('query', e.target.value || undefined)}
                />
              </CardContent>
            </Card>

            {/* Date Search */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Search Type</Label>
                    <Select
                      value={filters.dateSearchType || 'exact'}
                      onValueChange={(value) => handleFilterChange('dateSearchType', value as 'exact' | 'range')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select date search type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exact">Exact Date</SelectItem>
                        <SelectItem value="range">Date Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filters.dateSearchType === 'exact' ? (
                    <div>
                      <Label htmlFor="exactDate" className="text-xs text-muted-foreground">Exact Date & Time</Label>
                      <Input
                        id="exactDate"
                        type="datetime-local"
                        value={filters.exactDate ? filters.exactDate.slice(0, 16) : ''}
                        onChange={(e) => handleFilterChange('exactDate', e.target.value ? e.target.value + ':00Z' : undefined)}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">From Date</Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={filters.dateFrom || ''}
                          onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateTo" className="text-xs text-muted-foreground">To Date</Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={filters.dateTo || ''}
                          onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Search Dropdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Document Model</CardTitle>
              </CardHeader>
              <CardContent>
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

                {selectedCategory && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{selectedCategory.name}</div>
                        {selectedCategory.description && <div className="text-xs text-slate-500">{selectedCategory.description}</div>}
                      </div>
                      <button onClick={() => removeCategory()} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Filters Summary */}
          {getActiveFiltersCount() > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {filters.query && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Query: {filters.query}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleFilterChange('query', undefined)}
                      />
                    </Badge>
                  )}
                  {/* Created By filter removed */}
                  {selectedCategory && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Model: {selectedCategory.name}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeCategory()}
                      />
                    </Badge>
                  )}
                  {filters.exactDate && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Exact Date: {new Date(filters.exactDate).toLocaleDateString()}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleFilterChange('exactDate', undefined)}
                      />
                    </Badge>
                  )}
                  {(filters.dateFrom || filters.dateTo) && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Date Range: {filters.dateFrom || 'Start'} - {filters.dateTo || 'End'}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => {
                          handleFilterChange('dateFrom', undefined);
                          handleFilterChange('dateTo', undefined);
                        }}
                      />
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center p-6 border-t border-ui bg-neutral-background">
          <Button variant="outline" onClick={handleClearFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
