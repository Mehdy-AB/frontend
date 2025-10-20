'use client';

import React, { memo, useRef, useEffect } from 'react';
import { 
  Search, 
  Database, 
  X, 
  Plus, 
  Minus, 
  Zap,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserDto, FilingCategoryResponseDto } from '@/types/api';

interface MetadataFilter {
  key: string;
  value: string;
  operator: string;
}

interface SearchScope {
  lookUpFolderName: boolean;
  lookUpDocumentName: boolean;
  lookUpMetadataValue: boolean;
  lookUpOcrContent: boolean;
  lookUpDescription: boolean;
  lookUpTags: boolean;
  includeFolders: boolean;
  includeDocuments: boolean;
}

interface AdvancedSearchPanelProps {
  showAdvancedSearch: boolean;
  onClose: () => void;
  selectedUser: UserDto | null;
  onUserSelect: (user: UserDto | null) => void;
  selectedModel: FilingCategoryResponseDto | null;
  onModelSelect: (model: FilingCategoryResponseDto | null) => void;
  users: UserDto[];
  models: FilingCategoryResponseDto[];
  userSearchQuery: string;
  onUserSearchChange: (query: string) => void;
  modelSearchQuery: string;
  onModelSearchChange: (query: string) => void;
  showUserDropdown: boolean;
  setShowUserDropdown: (show: boolean) => void;
  showModelDropdown: boolean;
  setShowModelDropdown: (show: boolean) => void;
  filteredUsers: UserDto[];
  filteredModels: FilingCategoryResponseDto[];
  searchingUsers: boolean;
  searchingModels: boolean;
  metadataOperation: 'AND' | 'OR';
  onMetadataOperationChange: (operation: 'AND' | 'OR') => void;
  metadataFilters: MetadataFilter[];
  onAddMetadataFilter: () => void;
  onRemoveMetadataFilter: (index: number) => void;
  onUpdateMetadataFilter: (index: number, field: 'key' | 'value' | 'operator', value: string) => void;
  searchScope: SearchScope;
  onSearchScopeChange: (scope: SearchScope) => void;
  onSearch: () => void;
}

const AdvancedSearchPanel = memo<AdvancedSearchPanelProps>(({
  showAdvancedSearch,
  onClose,
  selectedUser,
  onUserSelect,
  selectedModel,
  onModelSelect,
  users,
  models,
  userSearchQuery,
  onUserSearchChange,
  modelSearchQuery,
  onModelSearchChange,
  showUserDropdown,
  setShowUserDropdown,
  showModelDropdown,
  setShowModelDropdown,
  filteredUsers,
  filteredModels,
  searchingUsers,
  searchingModels,
  metadataOperation,
  onMetadataOperationChange,
  metadataFilters,
  onAddMetadataFilter,
  onRemoveMetadataFilter,
  onUpdateMetadataFilter,
  searchScope,
  onSearchScopeChange,
  onSearch
}) => {
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowUserDropdown, setShowModelDropdown]);

  if (!showAdvancedSearch) return null;

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Advanced Search Options</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Document Owner</Label>
          <Select
            value={selectedUser ? selectedUser.id : 'all'}
            onValueChange={(value) => {
              if (value === "all") {
                onUserSelect(null);
              } else {
                const user = users.find(u => u.id === value);
                onUserSelect(user || null);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select document owner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {user.firstName} {user.lastName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Document Model</Label>
          <Select
            value={selectedModel ? selectedModel.id.toString() : 'all'}
            onValueChange={(value) => {
              if (value === "all") {
                onModelSelect(null);
              } else {
                const model = models.find(m => m.id.toString() === value);
                onModelSelect(model || null);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select document model..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    {model.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metadata Filters */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">Metadata Filters</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMetadataOperationChange(metadataOperation === 'AND' ? 'OR' : 'AND')}
              className="gap-2"
            >
              {metadataOperation === 'AND' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              {metadataOperation}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddMetadataFilter}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Filter
            </Button>
          </div>
        </div>

        {metadataFilters.map((filter, index) => (
          <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
            <Input
              placeholder="Metadata key"
              value={filter.key}
              onChange={(e) => onUpdateMetadataFilter(index, 'key', e.target.value)}
              className="flex-1"
            />
            <Select
              value={filter.operator}
              onValueChange={(value) => onUpdateMetadataFilter(index, 'operator', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONTAINS">Contains</SelectItem>
                <SelectItem value="EQUALS">Equals</SelectItem>
                <SelectItem value="NOT_EQUALS">Not Equals</SelectItem>
                <SelectItem value="GT">Greater Than</SelectItem>
                <SelectItem value="LT">Less Than</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Value"
              value={filter.value}
              onChange={(e) => onUpdateMetadataFilter(index, 'value', e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemoveMetadataFilter(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Minus className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Search Scope */}
      <div className="mt-6 space-y-3">
        <Label className="text-sm font-medium text-gray-700">Search In</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(searchScope).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={value}
                onCheckedChange={(checked) => 
                  onSearchScopeChange({ ...searchScope, [key]: checked })
                }
              />
              <Label htmlFor={key} className="text-sm">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Search Button */}
      <div className="mt-6 text-center">
        <Button
          onClick={onSearch}
          size="lg"
          className="px-8 py-3"
        >
          <Zap className="w-5 h-5 mr-2" />
          Update Search
        </Button>
      </div>
    </div>
  );
});

AdvancedSearchPanel.displayName = 'AdvancedSearchPanel';

export default AdvancedSearchPanel;
