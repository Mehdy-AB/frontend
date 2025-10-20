// app/models/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FolderTree, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Tag,
  List,
  Text,
  Hash,
  Calendar,
  ToggleLeft,
  X,
  Save,
  Copy,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { notificationApiClient } from '../../../../api/notificationClient';
import { useNotification } from '../../../../contexts/NotificationContext';
import { 
  FilingCategoryRequestDto, 
  FilingCategoryResponseDto, 
  MetaDataListReq, 
  MetaDataListRes,
  CategoryMetadataDefinitionDto,
  MetadataType
} from '../../../../types/api';

// Extended interface for inline list creation
interface ExtendedMetaDataListReq extends MetaDataListReq {
  newOption?: string;
}

// Extended interface for metadata definition with inline list creation
interface ExtendedCategoryMetadataDefinitionDto extends CategoryMetadataDefinitionDto {
  list?: ExtendedMetaDataListReq;
}

export default function ModelsPage() {
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const [categories, setCategories] = useState<FilingCategoryResponseDto[]>([]);
  const [lists, setLists] = useState<MetaDataListRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'lists'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    categories: FilingCategoryResponseDto[];
    lists: MetaDataListRes[];
  }>({ categories: [], lists: [] });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FilingCategoryResponseDto | null>(null);
  const [editingList, setEditingList] = useState<MetaDataListRes | null>(null);
  const [duplicatingCategory, setDuplicatingCategory] = useState<FilingCategoryResponseDto | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  // Set up notification callback for API client
  useEffect(() => {
    notificationApiClient.setNotificationCallback((type, title, message) => {
      addNotification({
        type: type === 'success' ? 'success' : 'error',
        title,
        message
      });
    });
  }, [addNotification]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both categories and lists in parallel
        const [categoriesResponse, listsResponse] = await Promise.all([
          notificationApiClient.getAllFilingCategories({ size: 1000 }),
          notificationApiClient.getAllMetadataLists({ size: 1000 })
        ]);
        
        setCategories(categoriesResponse.content);
        setLists(listsResponse.content);
      } catch (error) {
        console.error('Error fetching data:', error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load models and lists'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addNotification]);

  // Backend search function
  const performBackendSearch = useCallback(async (query: string) => {
    if (query.trim().length === 0) {
      setSearchResults({ categories: [], lists: [] });
      return;
    }

    setIsSearching(true);
    try {
      // Search categories and lists in parallel
      const [categoryResults, listResults] = await Promise.all([
        notificationApiClient.getAllFilingCategories({
          name: query.trim(),
          size: 100
        }),
        notificationApiClient.getAllMetadataLists({
          name: query.trim(),
          size: 100
        })
      ]);
      
      setSearchResults({
        categories: categoryResults.content || [],
        lists: listResults.content || []
      });
    } catch (error) {
      console.error('Search error:', error);
      addNotification({
        type: 'error',
        title: 'Search Error',
        message: 'Failed to search models and lists'
      });
    } finally {
      setIsSearching(false);
    }
  }, [addNotification]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          performBackendSearch(query);
        }, 400);
      };
    })(),
    [performBackendSearch]
  );

  // Local filtering function
  const filterLocally = useCallback((items: any[], query: string, fields: string[]) => {
    if (!query.trim()) return items;
    
    const lowercaseQuery = query.toLowerCase();
    return items.filter(item => 
      fields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value && value.toString().toLowerCase().includes(lowercaseQuery);
      })
    );
  }, []);

  // Memoized filtered data - always show local results first
  const filteredCategories = useMemo(() => {
    // Always get local results first
    const localResults = filterLocally(categories, searchQuery, ['name', 'description']);
    
    // If we have backend search results and they're different from local, combine them
    if (searchQuery.trim().length > 2 && searchResults.categories.length > 0) {
      // Merge local and backend results, removing duplicates
      const combined = [...localResults];
      searchResults.categories.forEach(backendItem => {
        if (!combined.find(localItem => localItem.id === backendItem.id)) {
          combined.push(backendItem);
        }
      });
      return combined;
    }
    
    return localResults;
  }, [categories, searchQuery, searchResults.categories, filterLocally]);

  const filteredLists = useMemo(() => {
    // Always get local results first
    const localResults = filterLocally(lists, searchQuery, ['name', 'description']);
    
    // If we have backend search results and they're different from local, combine them
    if (searchQuery.trim().length > 2 && searchResults.lists.length > 0) {
      // Merge local and backend results, removing duplicates
      const combined = [...localResults];
      searchResults.lists.forEach(backendItem => {
        if (!combined.find(localItem => localItem.id === backendItem.id)) {
          combined.push(backendItem);
        }
      });
      return combined;
    }
    
    return localResults;
  }, [lists, searchQuery, searchResults.lists, filterLocally]);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Handle Enter key press for immediate search
  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performBackendSearch(searchQuery);
    }
  }, [searchQuery, performBackendSearch]);

  const getDataTypeIcon = (dataType: MetadataType) => {
    switch (dataType) {
      case MetadataType.LIST: return <List className="h-4 w-4" />;
      case MetadataType.STRING: return <Text className="h-4 w-4" />;
      case MetadataType.NUMBER: return <Hash className="h-4 w-4" />;
      case MetadataType.DATE: return <Calendar className="h-4 w-4" />;
      case MetadataType.BOOLEAN: return <ToggleLeft className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getDataTypeColor = (dataType: MetadataType) => {
    switch (dataType) {
      case MetadataType.LIST: return 'text-purple-600 bg-purple-100';
      case MetadataType.STRING: return 'text-blue-600 bg-blue-100';
      case MetadataType.NUMBER: return 'text-green-600 bg-green-100';
      case MetadataType.DATE: return 'text-orange-600 bg-orange-100';
      case MetadataType.BOOLEAN: return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // CRUD operations for categories
  const handleCreateCategory = async (categoryData: FilingCategoryRequestDto) => {
    try {
      const newCategory = await notificationApiClient.createFilingCategory(categoryData);
      setCategories(prev => [...prev, newCategory]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleUpdateCategory = async (id: number, categoryData: FilingCategoryRequestDto) => {
    try {
      const updatedCategory = await notificationApiClient.updateFilingCategory(id, categoryData);
      setCategories(prev => prev.map(cat => cat.id === id ? updatedCategory : cat));
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await notificationApiClient.deleteFilingCategory(id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // CRUD operations for lists
  const handleCreateList = async (listData: MetaDataListReq) => {
    try {
      const newList = await notificationApiClient.createMetadataList(listData);
      setLists(prev => [...prev, newList]);
      setShowCreateListModal(false);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleUpdateList = async (id: number, listData: MetaDataListReq) => {
    try {
      const updatedList = await notificationApiClient.updateMetadataList(id, listData);
      setLists(prev => prev.map(list => list.id === id ? updatedList : list));
      setEditingList(null);
    } catch (error) {
      console.error('Error updating list:', error);
    }
  };

  const handleDeleteList = async (id: number) => {
    try {
      await notificationApiClient.deleteMetadataList(id);
      setLists(prev => prev.filter(list => list.id !== id));
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  // Duplicate functionality
  const handleDuplicateCategory = (category: FilingCategoryResponseDto) => {
    setDuplicatingCategory(category);
    setDuplicateName(`${category.name} (Copy)`);
    setShowDuplicateModal(true);
  };

  const handleConfirmDuplicate = async () => {
    if (!duplicatingCategory || !duplicateName.trim()) return;

    try {
      const duplicateData: FilingCategoryRequestDto = {
        name: duplicateName.trim(),
        description: duplicatingCategory.description,
        metadataDefinitions: duplicatingCategory.metadataDefinitions.map(def => ({
          key: def.key,
          dataType: def.dataType,
          mandatory: def.mandatory,
          listId: def.listId
        }))
      };

      const newCategory = await notificationApiClient.createFilingCategory(duplicateData);
      setCategories(prev => [...prev, newCategory]);
      setShowDuplicateModal(false);
      setDuplicatingCategory(null);
      setDuplicateName('');
    } catch (error) {
      console.error('Error duplicating category:', error);
    }
  };

  if (loading) {
    return <ModelsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">{t('models.title')}</h1>
              <p className="text-slate-600 text-lg">{t('models.manageModels')}</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <FolderTree className="h-4 w-4" />
                  {searchQuery ? filteredCategories.length : categories.length} Models
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                  <List className="h-4 w-4" />
                  {searchQuery ? filteredLists.length : lists.length} Lists
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {activeTab === 'lists' && (
                <Button 
                  onClick={() => setShowCreateListModal(true)}
                  variant="outline"
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 border-slate-300"
                >
                  <Plus className="h-4 w-4" />
                  Create List
                </Button>
              )}
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                {t('models.createModel')}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'categories' | 'lists')}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <TabsList className="grid w-full lg:w-auto grid-cols-2 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="categories" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <FolderTree className="h-4 w-4" />
                  {t('models.title')} ({searchQuery ? filteredCategories.length : categories.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="lists" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <List className="h-4 w-4" />
                  Metadata Lists ({searchQuery ? filteredLists.length : lists.length})
                </TabsTrigger>
              </TabsList>

              {/* Search Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder={t('common.search')}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="pl-10 w-64 h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {isSearching ? (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => performBackendSearch(searchQuery)}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {searchQuery && (
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      {activeTab === 'categories' ? filteredCategories.length : filteredLists.length} result{(activeTab === 'categories' ? filteredCategories.length : filteredLists.length) !== 1 ? 's' : ''}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults({ categories: [], lists: [] });
                      }}
                      className="h-8 px-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            <TabsContent value="categories" className="mt-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {searchQuery && filteredCategories.length === 0 && !isSearching ? (
                  <div className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <Search className="h-8 w-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium">No models found for "{searchQuery}"</p>
                        <p className="text-sm">Try adjusting your search terms or create a new model</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <CategoriesTab 
                    categories={filteredCategories} 
                    lists={lists}
                    getDataTypeIcon={getDataTypeIcon}
                    getDataTypeColor={getDataTypeColor}
                    onEdit={setEditingCategory}
                    onDelete={handleDeleteCategory}
                    onDuplicate={handleDuplicateCategory}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="lists" className="mt-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {searchQuery && filteredLists.length === 0 && !isSearching ? (
                  <div className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <Search className="h-8 w-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium">No lists found for "{searchQuery}"</p>
                        <p className="text-sm">Try adjusting your search terms or create a new list</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ListsTab 
                    lists={filteredLists}
                    onEdit={setEditingList}
                    onDelete={handleDeleteList}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create/Edit Category Modal */}
      {(showCreateModal || editingCategory) && (
        <CategoryModal 
          category={editingCategory}
          lists={lists}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCategory(null);
          }}
          getDataTypeIcon={getDataTypeIcon}
          onSave={async (categoryData: FilingCategoryRequestDto) => {
            try {
              // Clean the data before sending - remove newOption fields
              const cleanedCategoryData = {
                ...categoryData,
                metadataDefinitions: categoryData.metadataDefinitions.map(metadata => {
                  if (metadata.list) {
                    return {
                      ...metadata,
                      list: {
                        name: metadata.list.name,
                        description: metadata.list.description,
                        mandatory: metadata.list.mandatory,
                        option: metadata.list.option
                      }
                    };
                  }
                  return metadata;
                })
              };

              // Send the cleaned category data with inline list creation to the backend
              // The backend will handle creating new lists and linking them
              if (editingCategory) {
                handleUpdateCategory(editingCategory.id, cleanedCategoryData);
              } else {
                handleCreateCategory(cleanedCategoryData);
              }
            } catch (error) {
              console.error('Error saving category with lists:', error);
            }
          }}
        />
      )}

      {/* Create/Edit List Modal */}
      {(showCreateListModal || editingList) && (
        <ListModal 
          list={editingList}
          onClose={() => {
            setShowCreateListModal(false);
            setEditingList(null);
          }}
          onSave={(listData: MetaDataListReq) => {
            if (editingList) {
              handleUpdateList(editingList.id, listData);
            } else {
              handleCreateList(listData);
            }
          }}
        />
      )}

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDuplicateModal(false)}
          />
          
          {/* Modal */}
          <div className="relative w-[500px] max-w-[90vw] bg-background border rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-6 border-b bg-muted/20">
              <h2 className="text-xl font-semibold">Duplicate Model</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDuplicateModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="duplicate-name">New Model Name</Label>
                <Input
                  id="duplicate-name"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  placeholder="Enter new model name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDuplicateModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmDuplicate}
                  disabled={!duplicateName.trim()}
                >
                  Duplicate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Categories Tab Component
function CategoriesTab({ categories, lists, getDataTypeIcon, getDataTypeColor, onEdit, onDelete, onDuplicate }: any) {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const toggleCategoryExpansion = (categoryId: number) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
            <FolderTree className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <p className="text-lg font-medium">No models found</p>
            <p className="text-sm">Create your first document model to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-6 text-xs font-semibold text-slate-600 uppercase tracking-wider w-12"></th>
              <th className="text-left p-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Model Name</th>
              <th className="text-left p-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
              <th className="text-left p-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Metadata Fields</th>
              <th className="text-left p-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created By</th>
              <th className="text-left p-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
        <tbody>
          {categories.map((category: FilingCategoryResponseDto,index:number) => {
            const isExpanded = expandedCategories.includes(category.id);

            return (
              <>
                <tr key={category.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="p-6">
                    <button 
                      onClick={() => toggleCategoryExpansion(category.id)}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-600" />
                      )}
                    </button>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FolderTree className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-lg">{category.name}</div>
                        <div className="text-sm text-slate-500">ID: {category.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-sm text-slate-700 max-w-xs truncate">{category.description || 'No description'}</div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {category.metadataDefinitions.length} fields
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-sm text-slate-600">{category.createdBy.firstName} {category.createdBy.lastName}</div>
                  </td>
                  <td className="p-6">
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(category)}
                        title="Edit"
                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => onDuplicate(category)}
                        title="Duplicate"
                        className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(category.id)}
                        title="Delete"
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Metadata Definitions */}
                {isExpanded && (
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="p-6">
                      <div className="ml-16">
                        <h4 className="font-semibold text-slate-900 mb-4 text-lg">Metadata Fields</h4>
                        <div className="grid gap-4">
                          {category.metadataDefinitions.map((metadata: CategoryMetadataDefinitionDto) => (
                            <MetadataDefinitionCard 
                              key={metadata.id} 
                              metadata={metadata}
                              getDataTypeIcon={getDataTypeIcon}
                              getDataTypeColor={getDataTypeColor}
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}

// Metadata Definition Card Component
function MetadataDefinitionCard({ metadata, getDataTypeIcon, getDataTypeColor }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${getDataTypeColor(metadata.dataType)}`}>
          {getDataTypeIcon(metadata.dataType)}
        </div>
        <div>
          <div className="font-semibold text-slate-900 text-lg">{metadata.key}</div>
          <div className="text-sm text-slate-600 capitalize">
            {metadata.dataType.toLowerCase()}
            {metadata.mandatory && ' • Required'}
            {metadata.list && ` • List: ${metadata.list.name}`}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {metadata.mandatory && (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Required</span>
        )}
        {metadata.list && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {metadata.list.mandatory ? 'Fixed List' : 'Open List'}
          </span>
        )}
      </div>
    </div>
  );
}

// Lists Tab Component
function ListsTab({ lists, onEdit, onDelete }: any) {
  if (lists.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
            <List className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <p className="text-lg font-medium">No lists found</p>
            <p className="text-sm">Create your first metadata list to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">List Name</th>
              <th className="text-left p-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
              <th className="text-left p-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Options</th>
              <th className="text-left p-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
              <th className="text-left p-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
        <tbody>
          {lists.map((list: MetaDataListRes) => (
            <tr key={list.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
              <td className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <List className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-lg">{list.name}</div>
                    <div className="text-sm text-slate-500">ID: {list.id}</div>
                  </div>
                </div>
              </td>
              <td className="p-6">
                <div className="text-sm text-slate-700 max-w-xs truncate">{list.description || 'No description'}</div>
              </td>
              <td className="p-6">
                <div className="flex flex-wrap gap-2">
                  {list.option.slice(0, 3).map((option: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                      {option}
                    </span>
                  ))}
                  {list.option.length > 3 && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                      +{list.option.length - 3} more
                    </span>
                  )}
                </div>
              </td>
              <td className="p-6">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  list.mandatory 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {list.mandatory ? 'Fixed Options' : 'Open List'}
                </span>
              </td>
              <td className="p-6">
                <div className="flex gap-2">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(list)}
                    title="Edit"
                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(list.id)}
                    title="Delete"
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}

// Category Modal Component
function CategoryModal({ category, lists, getDataTypeIcon, onClose, onSave }: any) {
  const [formData, setFormData] = useState<FilingCategoryRequestDto>({
    name: category?.name || '',
    description: category?.description || '',
    metadataDefinitions: category?.metadataDefinitions || []
  });

  const [newMetadata, setNewMetadata] = useState<ExtendedCategoryMetadataDefinitionDto>({
    key: '',
    dataType: MetadataType.STRING,
    mandatory: false,
    listId: undefined
  });

  const [showNewMetadata, setShowNewMetadata] = useState(false);

  const addMetadataDefinition = () => {
    if (newMetadata.key.trim()) {
      setFormData(prev => ({
        ...prev,
        metadataDefinitions: [...prev.metadataDefinitions, { ...newMetadata }]
      }));
      setNewMetadata({
        key: '',
        dataType: MetadataType.STRING,
        mandatory: false,
        listId: undefined
      });
      setShowNewMetadata(false);
    }
  };

  const removeMetadataDefinition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metadataDefinitions: prev.metadataDefinitions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-[90vw] max-w-6xl max-h-[90vh] bg-background border rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-muted/20">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">
              {category ? 'Edit Document Model' : 'Create New Document Model'}
            </h2>
            <p className="text-muted-foreground">
              {category ? 'Update the document model configuration' : 'Define a new document model with metadata fields'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[70vh] p-6 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model-name">Model Name *</Label>
                  <Input
                    id="model-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Invoice, Contract, Report"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model-description">Description</Label>
                  <Input
                    id="model-description"
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this document model"
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Definitions */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Metadata Fields</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define the metadata fields that will be captured for documents using this model
                  </p>
                </div>
                <Button
                  onClick={() => setShowNewMetadata(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent>

              {/* New Metadata Form */}
              {showNewMetadata && (
                <Card className="mb-6 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">Add New Field</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="field-key">Field Key *</Label>
                        <Input
                          id="field-key"
                          type="text"
                          value={newMetadata.key}
                          onChange={(e) => setNewMetadata(prev => ({ ...prev, key: e.target.value }))}
                          placeholder="e.g., invoice_number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data-type">Data Type</Label>
                        <Select
                          value={newMetadata.dataType}
                          onValueChange={(value) => setNewMetadata(prev => ({ ...prev, dataType: value as MetadataType }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={MetadataType.LIST}>List</SelectItem>
                            <SelectItem value={MetadataType.STRING}>String</SelectItem>
                            <SelectItem value={MetadataType.NUMBER}>Number</SelectItem>
                            <SelectItem value={MetadataType.DATETIME}>DateTime</SelectItem>
                            <SelectItem value={MetadataType.DATE}>Date</SelectItem>
                            <SelectItem value={MetadataType.FLOAT}>Float</SelectItem>
                            <SelectItem value={MetadataType.BOOLEAN}>Boolean</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Options</Label>
                        <div className="flex items-center space-x-2 pt-2">
                          <input
                            type="checkbox"
                            id="mandatory"
                            checked={newMetadata.mandatory}
                            onChange={(e) => setNewMetadata(prev => ({ ...prev, mandatory: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label htmlFor="mandatory" className="text-sm">Required field</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Actions</Label>
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={addMetadataDefinition}
                            size="sm"
                            className="flex-1"
                          >
                            Add Field
                          </Button>
                          <Button
                            onClick={() => setShowNewMetadata(false)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* List Selection for LIST type */}
                    {newMetadata.dataType === MetadataType.LIST && (
                      <div className="space-y-4 pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="select-list">Select List</Label>
                            <Select
                              value={newMetadata.listId?.toString() || ''}
                              onValueChange={(value) => setNewMetadata(prev => ({ 
                                ...prev, 
                                listId: value ? parseInt(value) : undefined 
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="-- Create new list --" />
                              </SelectTrigger>
                              <SelectContent>
                                {lists.map((list: MetaDataListRes) => (
                                  <SelectItem key={list.id} value={list.id.toString()}>
                                    {list.name} ({list.mandatory ? 'Fixed' : 'Open'})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>List Behavior</Label>
                            <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                              {newMetadata.listId ? 
                                lists.find((l: MetaDataListRes) => l.id === newMetadata.listId)?.mandatory ? 
                                  'Users must choose from predefined options' : 
                                  'Users can add custom values to the list' :
                                'A new list will be created when saving this model'
                              }
                            </div>
                          </div>
                        </div>
                    
                        {/* Inline List Creation */}
                        {!newMetadata.listId && (
                          <Card className="mt-6 border-dashed border-2 border-primary/30 bg-primary/5">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-lg flex items-center gap-3">
                                <div className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center">
                                  <List className="h-4 w-4 text-primary" />
                                </div>
                                Create New List
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Define a new metadata list that will be created when saving this model
                              </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                  <Label htmlFor="list-name" className="text-sm font-medium">List Name *</Label>
                                  <Input
                                    id="list-name"
                                    type="text"
                                    value={newMetadata.list?.name || ''}
                                    onChange={(e) => setNewMetadata(prev => ({ 
                                      ...prev, 
                                      list: { 
                                        ...prev.list, 
                                        name: e.target.value,
                                        description: prev.list?.description || '',
                                        mandatory: prev.list?.mandatory || false,
                                        option: prev.list?.option || []
                                      }
                                    }))}
                                    placeholder="e.g., Document Status"
                                    className="h-10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="list-description" className="text-sm font-medium">Description</Label>
                                  <Input
                                    id="list-description"
                                    type="text"
                                    value={newMetadata.list?.description || ''}
                                    onChange={(e) => setNewMetadata(prev => ({ 
                                      ...prev, 
                                      list: { 
                                        ...prev.list, 
                                        description: e.target.value,
                                        name: prev.list?.name || '',
                                        mandatory: prev.list?.mandatory || false,
                                        option: prev.list?.option || []
                                      }
                                    }))}
                                    placeholder="Describe this list"
                                    className="h-10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">List Type</Label>
                                  <div className="flex items-center space-x-3 pt-2">
                                    <input
                                      type="checkbox"
                                      id="list-mandatory"
                                      checked={newMetadata.list?.mandatory || false}
                                      onChange={(e) => setNewMetadata(prev => ({ 
                                        ...prev, 
                                        list: { 
                                          ...prev.list, 
                                          mandatory: e.target.checked,
                                          name: prev.list?.name || '',
                                          description: prev.list?.description || '',
                                          option: prev.list?.option || []
                                        }
                                      }))}
                                      className="rounded border-input h-4 w-4"
                                    />
                                    <Label htmlFor="list-mandatory" className="text-sm">Fixed options only</Label>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {newMetadata.list?.mandatory ? 
                                      'Users must choose from predefined options' : 
                                      'Users can add custom values to the list'
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="list-options" className="text-sm font-medium">List Options</Label>
                                  <span className="text-xs text-muted-foreground">
                                    {newMetadata.list?.option?.length || 0} option{(newMetadata.list?.option?.length || 0) !== 1 ? 's' : ''} added
                                  </span>
                                </div>
                                
                                <div className="flex gap-3">
                                  <Input
                                    id="list-options"
                                    type="text"
                                    value={newMetadata.list?.newOption || ''}
                                    onChange={(e) => setNewMetadata(prev => ({ 
                                      ...prev, 
                                      list: { 
                                        ...prev.list, 
                                        newOption: e.target.value,
                                        name: prev.list?.name || '',
                                        description: prev.list?.description || '',
                                        mandatory: prev.list?.mandatory || false,
                                        option: prev.list?.option || []
                                      }
                                    }))}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && newMetadata.list?.newOption?.trim()) {
                                        const newOption = newMetadata.list.newOption.trim();
                                        if (!newMetadata.list.option.includes(newOption)) {
                                          setNewMetadata(prev => ({ 
                                            ...prev, 
                                            list: { 
                                              ...prev.list, 
                                              option: [...(prev.list?.option || []), newOption],
                                              newOption: '',
                                              name: prev.list?.name || '',
                                              description: prev.list?.description || '',
                                              mandatory: prev.list?.mandatory || false
                                            }
                                          }));
                                        }
                                      }
                                    }}
                                    placeholder="Enter option value"
                                    className="h-10"
                                  />
                                  <Button
                                    onClick={() => {
                                      if (newMetadata.list?.newOption?.trim()) {
                                        const newOption = newMetadata.list.newOption.trim();
                                        if (!newMetadata.list.option.includes(newOption)) {
                                          setNewMetadata(prev => ({ 
                                            ...prev, 
                                            list: { 
                                              ...prev.list, 
                                              option: [...(prev.list?.option || []), newOption],
                                              newOption: '',
                                              name: prev.list?.name || '',
                                              description: prev.list?.description || '',
                                              mandatory: prev.list?.mandatory || false
                                            }
                                          }));
                                        }
                                      }
                                    }}
                                    variant="secondary"
                                    className="h-10 px-6"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Option
                                  </Button>
                                </div>
                                
                                {newMetadata.list?.option && newMetadata.list.option.length > 0 ? (
                                  <div className="space-y-3">
                                    <div className="text-sm font-medium text-muted-foreground">Current Options:</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {newMetadata.list.option.map((option, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-background border rounded-lg">
                                          <span className="text-sm font-medium">{option}</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setNewMetadata(prev => ({ 
                                              ...prev, 
                                              list: { 
                                                ...prev.list, 
                                                option: prev.list?.option?.filter((_, i) => i !== index) || [],
                                                name: prev.list?.name || '',
                                                description: prev.list?.description || '',
                                                mandatory: prev.list?.mandatory || false
                                              }
                                            }))}
                                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                                    <div className="flex flex-col items-center gap-2">
                                      <List className="h-6 w-6" />
                                      <p className="text-sm">No options added yet</p>
                                      <p className="text-xs">Add options to create the list</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

              {/* Existing Metadata Definitions */}
              <div className="space-y-3">
                {formData.metadataDefinitions.map((metadata, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getDataTypeIcon(metadata.dataType)}
                      </div>
                      <div>
                        <div className="font-medium">{metadata.key}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {metadata.dataType.toLowerCase()}
                          {metadata.mandatory && ' • Required'}
                          {metadata.listId && ` • List ID: ${metadata.listId}`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMetadataDefinition(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {formData.metadataDefinitions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Tag className="h-8 w-8" />
                      <p>No metadata fields defined</p>
                      <p className="text-sm">Add fields to capture structured information for documents</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {formData.metadataDefinitions.length} metadata field{formData.metadataDefinitions.length !== 1 ? 's' : ''} defined
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onSave(formData)} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {category ? 'Update Model' : 'Create Model'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// List Modal Component
function ListModal({ list, onClose, onSave }: any) {
  const [formData, setFormData] = useState<MetaDataListReq>({
    name: list?.name || '',
    description: list?.description || '',
    mandatory: list?.mandatory || false,
    option: list?.option || []
  });

  const [newOption, setNewOption] = useState('');

  const addOption = () => {
    if (newOption.trim() && !formData.option.includes(newOption.trim())) {
      setFormData(prev => ({
        ...prev,
        option: [...prev.option, newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      option: prev.option.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (formData.name.trim() && formData.option.length > 0) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-[80vw] max-w-4xl max-h-[85vh] bg-background border rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-muted/20">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">
              {list ? 'Edit Metadata List' : 'Create New Metadata List'}
            </h2>
            <p className="text-muted-foreground">
              {list ? 'Update the metadata list configuration' : 'Define a new metadata list with options'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[60vh] p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="list-name">List Name *</Label>
                    <Input
                      id="list-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Document Status, Priority Levels"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="list-description">Description</Label>
                    <Input
                      id="list-description"
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this metadata list"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>List Type</Label>
                    <div className="flex items-center space-x-3 pt-2">
                      <input
                        type="checkbox"
                        id="list-mandatory"
                        checked={formData.mandatory}
                        onChange={(e) => setFormData(prev => ({ ...prev, mandatory: e.target.checked }))}
                        className="rounded border-input h-4 w-4"
                      />
                      <Label htmlFor="list-mandatory" className="text-sm">
                        Fixed options only
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.mandatory ? 
                        'Users must choose from predefined options' : 
                        'Users can add custom values to the list'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">List Options</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Define the available options for this metadata list
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formData.option.length} option{formData.option.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addOption()}
                    placeholder="Enter option value"
                    className="h-10"
                  />
                  <Button
                    onClick={addOption}
                    className="h-10 px-6"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>

                {formData.option.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">Current Options:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {formData.option.map((option, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-background border rounded-lg">
                          <span className="text-sm font-medium">{option}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                      <List className="h-6 w-6" />
                      <p className="text-sm">No options added yet</p>
                      <p className="text-xs">Add options to create the list</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {formData.option.length} option{formData.option.length !== 1 ? 's' : ''} defined
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name.trim() || formData.option.length === 0}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {list ? 'Update List' : 'Create List'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton
function ModelsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-neutral-ui rounded w-64 animate-pulse mb-2"></div>
          <div className="h-4 bg-neutral-ui rounded w-96 animate-pulse"></div>
        </div>
        <div className="h-10 bg-neutral-ui rounded w-32 animate-pulse"></div>
      </div>

      <div className="flex gap-8 border-b border-ui pb-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-6 bg-neutral-ui rounded w-32 animate-pulse"></div>
        ))}
      </div>

      <div className="h-10 bg-neutral-ui rounded w-64 animate-pulse"></div>

      <div className="bg-surface border border-ui rounded-lg animate-pulse">
        <div className="h-12 bg-neutral-ui rounded-t-lg"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 border-b border-ui flex items-center px-4">
            <div className="h-4 bg-neutral-ui rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}