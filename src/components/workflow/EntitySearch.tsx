/**
 * EntitySearch - Searchable dropdown for selecting users, roles, or groups
 * Similar to permission selector with type filtering
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, Shield, Users, ChevronDown } from 'lucide-react';
import { entitySearchService } from '../../api/services/entitySearchService';
import { EntitySearchResult, AssigneeType } from '../../types/workflow-admin';

interface EntitySearchProps {
  value?: EntitySearchResult | null;
  onChange: (entity: EntitySearchResult | null) => void;
  type?: AssigneeType | 'ALL';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export const EntitySearch: React.FC<EntitySearchProps> = ({
  value,
  onChange,
  type = 'ALL',
  placeholder = 'Search users, roles, or groups...',
  disabled = false,
  className = '',
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<EntitySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search entities
  useEffect(() => {
    const searchEntities = async () => {
      if (!searchTerm.trim() || !isOpen) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        if (type === 'ALL') {
          const allResults = await entitySearchService.searchAll(searchTerm, 30);
          setResults(allResults);
        } else {
          const response = await entitySearchService.searchByType(type, searchTerm, 0, 20);
          setResults(response.content);
        }
      } catch (error) {
        console.error('Error searching entities:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchEntities, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, type, isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (entity: EntitySearchResult) => {
    onChange(entity);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'USER':
        return <User className="h-4 w-4" />;
      case 'ROLE':
        return <Shield className="h-4 w-4" />;
      case 'GROUP':
        return <Users className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'USER':
        return 'text-blue-600 bg-blue-100';
      case 'ROLE':
        return 'text-purple-600 bg-purple-100';
      case 'GROUP':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selected Value Display */}
      <div
        className={`
          flex items-center justify-between w-full px-3 py-2 border rounded-lg
          transition-colors cursor-pointer
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {value ? (
          <div className="flex items-center gap-2 flex-1">
            <div className={`p-1 rounded ${getEntityTypeColor(value.type)}`}>
              {getEntityIcon(value.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{value.displayName}</div>
              {value.email && (
                <div className="text-xs text-gray-500 truncate">{value.email}</div>
              )}
            </div>
            {!disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500 flex-1">
            <Search className="h-4 w-4" />
            <span className="text-sm">{placeholder}</span>
          </div>
        )}
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Error Message */}
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Results */}
          <div className="overflow-y-auto max-h-64">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <div className="mt-2 text-sm">Searching...</div>
              </div>
            ) : results.length > 0 ? (
              <div>
                {results.map((entity) => (
                  <button
                    key={`${entity.type}-${entity.id}`}
                    onClick={() => handleSelect(entity)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={`p-2 rounded ${getEntityTypeColor(entity.type)}`}>
                      {getEntityIcon(entity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{entity.displayName}</div>
                      {entity.email && (
                        <div className="text-xs text-gray-500 truncate">{entity.email}</div>
                      )}
                      {entity.description && (
                        <div className="text-xs text-gray-400 truncate">{entity.description}</div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getEntityTypeColor(entity.type)}`}>
                      {entity.type}
                    </span>
                  </button>
                ))}
              </div>
            ) : searchTerm.trim() ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <div className="text-sm">No results found for "{searchTerm}"</div>
                <div className="text-xs text-gray-400 mt-1">Try a different search term</div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <div className="text-sm">Start typing to search</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

