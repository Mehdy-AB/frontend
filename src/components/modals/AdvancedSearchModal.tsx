'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  X, 
  FileText, 
  Folder, 
  Tag, 
  Eye, 
  Calendar,
  User,
  Hash,
  Type
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface SearchFilters {
  query: string;
  lookUpFolderName: boolean;
  lookUpDocumentName: boolean;
  lookUpMetadataKey: boolean;
  lookUpMetadataValue: boolean;
  lookUpCategoryName: boolean;
  lookUpOcrContent: boolean;
  lookUpDescription: boolean;
  includeFolders: boolean;
  includeDocuments: boolean;
  sortBy: 'score' | 'name' | 'createdAt' | 'updatedAt';
  sortDesc: boolean;
}

const defaultFilters: SearchFilters = {
  query: '',
  lookUpFolderName: true,
  lookUpDocumentName: true,
  lookUpMetadataKey: false,
  lookUpMetadataValue: false,
  lookUpCategoryName: false,
  lookUpOcrContent: false,
  lookUpDescription: true,
  includeFolders: true,
  includeDocuments: true,
  sortBy: 'score',
  sortDesc: false
};

export default function AdvancedSearchModal({ isOpen, onClose, initialQuery = '' }: AdvancedSearchModalProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>({
    ...defaultFilters,
    query: initialQuery
  });
  const [isSearching, setIsSearching] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
    if (!filters.query.trim()) return;

    setIsSearching(true);
    
    // Build search parameters
    const searchParams = new URLSearchParams();
    searchParams.set('query', filters.query);
    searchParams.set('lookUpFolderName', filters.lookUpFolderName.toString());
    searchParams.set('lookUpDocumentName', filters.lookUpDocumentName.toString());
    searchParams.set('lookUpMetadataKey', filters.lookUpMetadataKey.toString());
    searchParams.set('lookUpMetadataValue', filters.lookUpMetadataValue.toString());
    searchParams.set('lookUpCategoryName', filters.lookUpCategoryName.toString());
    searchParams.set('lookUpOcrContent', filters.lookUpOcrContent.toString());
    searchParams.set('lookUpDescription', filters.lookUpDescription.toString());
    searchParams.set('includeFolders', filters.includeFolders.toString());
    searchParams.set('includeDocuments', filters.includeDocuments.toString());
    searchParams.set('sortBy', filters.sortBy);
    searchParams.set('sortDesc', filters.sortDesc.toString());

    // Navigate to search results page
    router.push(`/search?${searchParams.toString()}`);
    onClose();
    setIsSearching(false);
  };

  const resetFilters = () => {
    setFilters({ ...defaultFilters, query: initialQuery });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.lookUpFolderName !== defaultFilters.lookUpFolderName) count++;
    if (filters.lookUpDocumentName !== defaultFilters.lookUpDocumentName) count++;
    if (filters.lookUpMetadataKey !== defaultFilters.lookUpMetadataKey) count++;
    if (filters.lookUpMetadataValue !== defaultFilters.lookUpMetadataValue) count++;
    if (filters.lookUpCategoryName !== defaultFilters.lookUpCategoryName) count++;
    if (filters.lookUpOcrContent !== defaultFilters.lookUpOcrContent) count++;
    if (filters.lookUpDescription !== defaultFilters.lookUpDescription) count++;
    if (filters.includeFolders !== defaultFilters.includeFolders) count++;
    if (filters.includeDocuments !== defaultFilters.includeDocuments) count++;
    if (filters.sortBy !== defaultFilters.sortBy) count++;
    if (filters.sortDesc !== defaultFilters.sortDesc) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Query */}
          <div className="space-y-2">
            <Label htmlFor="search-query" className="text-sm font-medium">
              Search Query
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="search-query"
                placeholder="Enter your search terms..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search Scope */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Search Scope
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-folders"
                      checked={filters.includeFolders}
                      onCheckedChange={(checked) => handleFilterChange('includeFolders', checked)}
                    />
                    <Label htmlFor="include-folders" className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Include Folders
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-documents"
                      checked={filters.includeDocuments}
                      onCheckedChange={(checked) => handleFilterChange('includeDocuments', checked)}
                    />
                    <Label htmlFor="include-documents" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Include Documents
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sort Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Sort Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sort-by">Sort by</Label>
                  <Select value={filters.sortBy} onValueChange={(value: any) => handleFilterChange('sortBy', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Relevance Score</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="createdAt">Date Created</SelectItem>
                      <SelectItem value="updatedAt">Date Modified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sort-desc"
                    checked={filters.sortDesc}
                    onCheckedChange={(checked) => handleFilterChange('sortDesc', checked)}
                  />
                  <Label htmlFor="sort-desc">Sort in descending order</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Search Fields
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lookup-folder-name"
                      checked={filters.lookUpFolderName}
                      onCheckedChange={(checked) => handleFilterChange('lookUpFolderName', checked)}
                    />
                    <Label htmlFor="lookup-folder-name" className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Folder Names
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lookup-document-name"
                      checked={filters.lookUpDocumentName}
                      onCheckedChange={(checked) => handleFilterChange('lookUpDocumentName', checked)}
                    />
                    <Label htmlFor="lookup-document-name" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Document Names
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lookup-description"
                      checked={filters.lookUpDescription}
                      onCheckedChange={(checked) => handleFilterChange('lookUpDescription', checked)}
                    />
                    <Label htmlFor="lookup-description" className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Descriptions
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lookup-metadata-key"
                      checked={filters.lookUpMetadataKey}
                      onCheckedChange={(checked) => handleFilterChange('lookUpMetadataKey', checked)}
                    />
                    <Label htmlFor="lookup-metadata-key" className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Metadata Keys
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lookup-metadata-value"
                      checked={filters.lookUpMetadataValue}
                      onCheckedChange={(checked) => handleFilterChange('lookUpMetadataValue', checked)}
                    />
                    <Label htmlFor="lookup-metadata-value" className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Metadata Values
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lookup-category-name"
                      checked={filters.lookUpCategoryName}
                      onCheckedChange={(checked) => handleFilterChange('lookUpCategoryName', checked)}
                    />
                    <Label htmlFor="lookup-category-name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Category Names
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lookup-ocr-content"
                      checked={filters.lookUpOcrContent}
                      onCheckedChange={(checked) => handleFilterChange('lookUpOcrContent', checked)}
                    />
                    <Label htmlFor="lookup-ocr-content" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      OCR Content
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={resetFilters} className="gap-2">
              <X className="h-4 w-4" />
              Reset Filters
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSearch} 
                disabled={!filters.query.trim() || isSearching}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
