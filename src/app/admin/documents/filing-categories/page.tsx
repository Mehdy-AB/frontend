// app/models/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  Upload,
  Download,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../components/ui/tooltip';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { notificationApiClient } from '../../../../api/notificationClient';
import { useNotification } from '../../../../contexts/NotificationContext';
import UserAvatar from '../../../../components/main/UserAvatar';
import ServerSearchInput from '../../../../components/main/ServerSearchInput';
import Pagination from '../../../../components/main/Pagination';
import { useServerSideSearch } from '../../../../components/main/useServerSideSearch';
import { useAdminPagePermissions } from '@/hooks/useAdminPagePermissions';
import FolderPickerModal from '../../../../components/modals/FolderPickerModal';
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
  const router = useRouter();
  const { canView, canCreate, canUpdate, canDelete } = useAdminPagePermissions();
  const [activeTab, setActiveTab] = useState<'categories' | 'lists'>('categories');

  // Redirect if user doesn't have view permission
  useEffect(() => {
    if (!canView) {
      router.push('/');
    }
  }, [canView, router]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FilingCategoryResponseDto | null>(null);
  const [editingList, setEditingList] = useState<MetaDataListRes | null>(null);
  const [duplicatingCategory, setDuplicatingCategory] = useState<FilingCategoryResponseDto | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: 'category' | 'list', id: number, name: string } | null>(null);
  const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string>('');
  const [errorModalTitle, setErrorModalTitle] = useState<string>('Cannot Delete');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportQuantity, setExportQuantity] = useState(100);

  const pageSize = 20;

  // Categories server-side search
  const {
    displayData: displayCategories,
    searchQuery: categoriesSearchQuery,
    setSearchQuery: setCategoriesSearchQuery,
    page: categoriesPage,
    setPage: setCategoriesPage,
    totalPages: categoriesTotalPages,
    totalElements: categoriesTotalElements,
    loading: categoriesLoading,
    tableLoading: categoriesTableLoading,
    addItem: addCategory,
    updateItem: updateCategory,
    removeItem: removeCategory,
    fetchData: fetchCategories
  } = useServerSideSearch<FilingCategoryResponseDto>({
    fetchFunction: async (page, searchTerm) => {
      return await notificationApiClient.getAllFilingCategories({
        page,
        size: pageSize,
        name: searchTerm || undefined,
      });
    },
    searchFields: (category) => [category.name, category.description || ''],
    debounceMs: 500
  });

  // Lists server-side search
  const {
    displayData: displayLists,
    searchQuery: listsSearchQuery,
    setSearchQuery: setListsSearchQuery,
    page: listsPage,
    setPage: setListsPage,
    totalPages: listsTotalPages,
    totalElements: listsTotalElements,
    loading: listsLoading,
    tableLoading: listsTableLoading,
    addItem: addList,
    updateItem: updateList,
    removeItem: removeList,
    fetchData: fetchLists
  } = useServerSideSearch<MetaDataListRes>({
    fetchFunction: async (page, searchTerm) => {
      return await notificationApiClient.getAllMetadataLists({
        page,
        size: pageSize,
        name: searchTerm || undefined,
      });
    },
    searchFields: (list) => [list.name, list.description || ''],
    debounceMs: 500
  });

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

  // Handle editing category - fetch latest data from backend
  const handleEditCategory = async (category: FilingCategoryResponseDto) => {
    try {
      const latestCategory = await notificationApiClient.getFilingCategoryById(category.id);
      setEditingCategory(latestCategory);
    } catch (error) {
      console.error('Error fetching category:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load category details'
      });
    }
  };

  // Handle editing list - fetch latest data from backend
  const handleEditList = async (list: MetaDataListRes) => {
    try {
      const latestList = await notificationApiClient.getMetadataListById(list.id);
      setEditingList(latestList);
    } catch (error) {
      console.error('Error fetching list:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load list details'
      });
    }
  };

  // Handle editing list from metadata click
  const handleEditListFromMetadata = async (listData: any) => {
    // Find the actual list object from our lists state
    const actualList = displayLists.find(l => l.name === listData.name);
    if (actualList) {
      await handleEditList(actualList);
    }
  };


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
      addCategory(newCategory);

      // Refetch lists to get any new lists that were created
      fetchLists(false);

      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleUpdateCategory = async (id: number, categoryData: FilingCategoryRequestDto) => {
    try {

      const updatedCategory = await notificationApiClient.updateFilingCategory(id, categoryData, { showError: false });
      updateCategory(id, () => updatedCategory);

      // Refetch lists to get any new lists that were created
      fetchLists(false);

      setEditingCategory(null);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Filing category updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating category:', error);
      // Extract error message from API response
      let errorMessage = 'Failed to update filing category';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setDeleteErrorMessage(errorMessage);
      setErrorModalTitle('Cannot Update Model');
      setShowDeleteErrorModal(true);
    }
  };

  const handleDeleteCategory = (category: FilingCategoryResponseDto) => {
    setDeletingItem({ type: 'category', id: category.id, name: category.name });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingItem) return;
    try {
      await notificationApiClient.deleteFilingCategory(deletingItem.id, { showError: false });
      removeCategory(deletingItem.id);
      setShowDeleteConfirm(false);
      setDeletingItem(null);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Filing category deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      // Extract error message from API response
      let errorMessage = 'Failed to delete filing category';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setDeleteErrorMessage(errorMessage);
      setErrorModalTitle('Cannot Delete Model');
      setShowDeleteErrorModal(true);
      setShowDeleteConfirm(false);
    }
  };

  // CRUD operations for lists
  const handleCreateList = async (listData: MetaDataListReq) => {
    try {
      const newList = await notificationApiClient.createMetadataList(listData);
      addList(newList);
      setShowCreateListModal(false);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleUpdateList = async (id: number, listData: MetaDataListReq) => {
    try {
      const updatedList = await notificationApiClient.updateMetadataList(id, listData);
      updateList(id, () => updatedList);
      setEditingList(null);
    } catch (error) {
      console.error('Error updating list:', error);
    }
  };

  const handleDeleteList = (list: MetaDataListRes) => {
    setDeletingItem({ type: 'list', id: list.id, name: list.name });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteList = async () => {
    if (!deletingItem) return;
    try {
      await notificationApiClient.deleteMetadataList(deletingItem.id, { showError: false });
      removeList(deletingItem.id);
      setShowDeleteConfirm(false);
      setDeletingItem(null);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'List deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting list:', error);
      // Extract error message from API response
      let errorMessage = 'Failed to delete list';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setDeleteErrorMessage(errorMessage);
      setErrorModalTitle('Cannot Delete List');
      setShowDeleteErrorModal(true);
      setShowDeleteConfirm(false);
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
        metadataDefinitions: (duplicatingCategory.metadataDefinitions?.map(def => ({
          key: def.key,
          dataType: def.dataType,
          mandatory: def.mandatory,
          listId: def.listId
        })) || [])
      };

      const newCategory = await notificationApiClient.createFilingCategory(duplicateData);
      addCategory(newCategory);
      setShowDuplicateModal(false);
      setDuplicatingCategory(null);
      setDuplicateName('');
    } catch (error) {
      console.error('Error duplicating category:', error);
    }
  };

  // Import/Export functions
  const handleImportCSV = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      // Expected headers for category import with metadata support
      const expectedHeaders = ['name', 'description', 'metadata_fields'];
      const hasValidHeaders = expectedHeaders.every(header => headers.includes(header));

      if (!hasValidHeaders) {
        addNotification({
          type: 'error',
          title: 'Import Error',
          message: 'CSV file must contain "name", "description", and "metadata_fields" columns'
        });
        return;
      }

      const categoriesToImport = [];
      const listsToCreate = new Map<string, { name: string, description: string, mandatory: boolean, options: string[] }>();

      // Parse CSV data
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const name = values[headers.indexOf('name')] || '';
          const description = values[headers.indexOf('description')] || '';
          const metadataFieldsStr = values[headers.indexOf('metadata_fields')] || '';

          // Parse metadata fields (format: "field1:STRING:true,field2:LIST:listName:false")
          const metadataDefinitions: any[] = [];
          if (metadataFieldsStr) {
            const fieldDefinitions = metadataFieldsStr.split(';').map(f => f.trim());

            for (const fieldDef of fieldDefinitions) {
              const parts = fieldDef.split(':');
              if (parts.length >= 2) {
                const fieldKey = parts[0];
                const dataType = parts[1] as MetadataType;
                const isMandatory = parts[2] === 'true';

                if (dataType === MetadataType.LIST && parts.length >= 4) {
                  const listName = parts[3];
                  const listMandatory = parts[4] === 'true';

                  // Collect list information for later creation
                  if (!listsToCreate.has(listName)) {
                    listsToCreate.set(listName, {
                      name: listName,
                      description: `List for ${listName}`,
                      mandatory: listMandatory,
                      options: []
                    });
                  }

                  metadataDefinitions.push({
                    key: fieldKey,
                    dataType: dataType,
                    mandatory: isMandatory,
                    list: {
                      name: listName,
                      description: `List for ${listName}`,
                      mandatory: listMandatory,
                      option: []
                    }
                  });
                } else {
                  metadataDefinitions.push({
                    key: fieldKey,
                    dataType: dataType,
                    mandatory: isMandatory
                  });
                }
              }
            }
          }

          categoriesToImport.push({
            name,
            description,
            metadataDefinitions
          });
        }
      }

      // Step 1: Create lists first (avoiding duplicates)
      const createdLists = new Map<string, number>();

      for (const [listName, listData] of listsToCreate) {
        try {
          // Check if list already exists
          const existingList = displayLists.find(l => l.name === listName);
          if (existingList) {
            createdLists.set(listName, existingList.id);
            continue;
          }

          // Create new list
          const newList = await notificationApiClient.createMetadataList({
            name: listData.name,
            description: listData.description,
            mandatory: listData.mandatory,
            option: listData.options
          });

          createdLists.set(listName, newList.id);
        } catch (error) {
          console.error(`Error creating list ${listName}:`, error);
          addNotification({
            type: 'error',
            title: 'List Creation Error',
            message: `Failed to create list: ${listName}`
          });
        }
      }

      // Step 2: Update metadata definitions with actual list IDs
      for (const category of categoriesToImport) {
        for (const metadata of category.metadataDefinitions) {
          if (metadata.dataType === MetadataType.LIST && metadata.list) {
            const listId = createdLists.get(metadata.list.name);
            if (listId) {
              metadata.listId = listId;
              delete metadata.list; // Remove the list object, keep only listId
            }
          }
        }
      }

      // Step 3: Create categories
      let successCount = 0;
      for (const categoryData of categoriesToImport) {
        try {
          await notificationApiClient.createFilingCategory(categoryData);
          successCount++;
        } catch (error) {
          console.error(`Error creating category ${categoryData.name}:`, error);
        }
      }

      // Refresh data
      await Promise.all([
        fetchCategories(false),
        fetchLists(false)
      ]);

      setShowImportModal(false);

      addNotification({
        type: 'success',
        title: 'Import Successful',
        message: `Successfully imported ${successCount} categories and created ${createdLists.size} lists`
      });
    } catch (error) {
      console.error('Import error:', error);
      addNotification({
        type: 'error',
        title: 'Import Error',
        message: 'Failed to import CSV file'
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const categoriesToExport = displayCategories.slice(0, exportQuantity);

      // Helper function to format metadata fields for export
      const formatMetadataFields = (metadataDefinitions: CategoryMetadataDefinitionDto[] | undefined) => {
        return (metadataDefinitions ?? []).map(metadata => {
          let fieldStr = `${metadata.key}:${metadata.dataType}:${metadata.mandatory}`;
          if (metadata.dataType === MetadataType.LIST && metadata.list) {
            fieldStr += `:${metadata.list.name}:${metadata.list.mandatory}`;
          }
          return fieldStr;
        }).join(';');
      };

      const csvContent = [
        'name,description,metadata_fields,created_by',
        ...categoriesToExport.map(cat =>
          `"${cat.name}","${cat.description || ''}","${formatMetadataFields(cat.metadataDefinitions)}","${cat.createdBy?.firstName ?? ''} ${cat.createdBy?.lastName ?? ''}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filing-categories-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setShowExportModal(false);
      addNotification({
        type: 'success',
        title: 'Export Successful',
        message: `Exported ${categoriesToExport.length} categories to CSV`
      });
    } catch (error) {
      console.error('Export error:', error);
      addNotification({
        type: 'error',
        title: 'Export Error',
        message: 'Failed to export CSV file'
      });
    }
  };

  // Permission guard
  if (categoriesLoading && !canView) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive text-lg">You don't have permission to view this page</p>
        </div>
      </div>
    );
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
                  {categoriesTotalElements} Models
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                  <List className="h-4 w-4" />
                  {listsTotalElements} Lists
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (activeTab === 'categories') {
                    fetchCategories(false);
                  } else {
                    fetchLists(false);
                  }
                }}
                variant="outline"
                disabled={activeTab === 'categories' ? categoriesLoading : listsLoading}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 border-slate-300"
              >
                <RefreshCw className={`h-4 w-4 ${activeTab === 'categories' ? (categoriesLoading ? 'animate-spin' : '') : (listsLoading ? 'animate-spin' : '')}`} />
                {activeTab === 'categories' ? (categoriesLoading ? 'Refreshing...' : 'Refresh') : (listsLoading ? 'Refreshing...' : 'Refresh')}
              </Button>
              <Button
                onClick={() => setShowImportModal(true)}
                variant="outline"
                className="flex items-center gap-2 bg-white hover:bg-slate-50 border-slate-300"
              >
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
              <Button
                onClick={() => setShowExportModal(true)}
                variant="outline"
                className="flex items-center gap-2 bg-white hover:bg-slate-50 border-slate-300"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              {activeTab === 'lists' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => canCreate && setShowCreateListModal(true)}
                      disabled={!canCreate}
                      variant="outline"
                      className="flex items-center gap-2 bg-white hover:bg-slate-50 border-slate-300"
                    >
                      <Plus className="h-4 w-4" />
                      Create List
                    </Button>
                  </TooltipTrigger>
                  {!canCreate && (
                    <TooltipContent>
                      <p>You don't have permission to create lists</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => canCreate && setShowCreateModal(true)}
                    disabled={!canCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    {t('models.createModel')}
                  </Button>
                </TooltipTrigger>
                {!canCreate && (
                  <TooltipContent>
                    <p>You don't have permission to create categories</p>
                  </TooltipContent>
                )}
              </Tooltip>
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
                  {t('models.title')} ({categoriesTotalElements})
                </TabsTrigger>
                <TabsTrigger
                  value="lists"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <List className="h-4 w-4" />
                  Metadata Lists ({listsTotalElements})
                </TabsTrigger>
              </TabsList>

              {/* Search Section */}
              <div className="flex items-center gap-4">
                {activeTab === 'categories' ? (
                  <>
                    <ServerSearchInput
                      value={categoriesSearchQuery}
                      onChange={setCategoriesSearchQuery}
                      placeholder="Search filing categories by name or description..."
                    />
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {categoriesTotalElements} {categoriesTotalElements !== 1 ? 'categories' : 'category'}
                    </div>
                  </>
                ) : (
                  <>
                    <ServerSearchInput
                      value={listsSearchQuery}
                      onChange={setListsSearchQuery}
                      placeholder="Search metadata lists by name or description..."
                    />
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {listsTotalElements} {listsTotalElements !== 1 ? 'lists' : 'list'}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Content Area */}
            <TabsContent value="categories" className="mt-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <CategoriesTab
                  categories={displayCategories}
                  lists={displayLists}
                  getDataTypeIcon={getDataTypeIcon}
                  getDataTypeColor={getDataTypeColor}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  onDuplicate={handleDuplicateCategory}
                  onEditList={handleEditListFromMetadata}
                  loading={categoriesTableLoading}
                />
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={categoriesPage}
                totalPages={categoriesTotalPages}
                totalElements={categoriesTotalElements}
                pageSize={pageSize}
                onPageChange={(newPage) => {
                  setCategoriesPage(newPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </TabsContent>

            <TabsContent value="lists" className="mt-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <ListsTab
                  lists={displayLists}
                  onEdit={handleEditList}
                  onDelete={handleDeleteList}
                  loading={listsTableLoading}
                />
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={listsPage}
                totalPages={listsTotalPages}
                totalElements={listsTotalElements}
                pageSize={pageSize}
                onPageChange={(newPage) => {
                  setListsPage(newPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create/Edit Category Modal */}
      {(showCreateModal || editingCategory) && (
        <CategoryModal
          category={editingCategory}
          lists={displayLists}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCategory(null);
          }}
          getDataTypeIcon={getDataTypeIcon}
          onSave={async (categoryData: FilingCategoryRequestDto) => {
            try {
              // First, validate all LIST type fields
              const invalidListFields = (categoryData.metadataDefinitions ?? []).filter(metadata =>
                metadata.dataType === MetadataType.LIST && !metadata.list && !metadata.listId
              );

              if (invalidListFields.length > 0) {
                const fieldNames = invalidListFields.map(f => `"${f.key}"`).join(', ');
                throw new Error(
                  `The following LIST fields are missing list configuration: ${fieldNames}. ` +
                  `Please select an existing list or create a new one for each LIST field.`
                );
              }

              // Clean the data before sending
              const cleanedCategoryData: FilingCategoryRequestDto = {
                name: categoryData.name,
                description: categoryData.description,
                nameStructure: categoryData.nameStructure,
                // Auto-classification fields
                autoClassificationEnabled: categoryData.autoClassificationEnabled,
                targetFolderId: categoryData.targetFolderId,
                classificationRules: categoryData.classificationRules,
                metadataDefinitions: (categoryData.metadataDefinitions ?? []).map(metadata => {
                  // Keep id field for updates so backend can recognize existing definitions
                  const cleanedMetadata: any = {
                    id: metadata.id, // Keep ID for updates
                    key: metadata.key,
                    dataType: metadata.dataType,
                    mandatory: metadata.mandatory
                  };

                  // Handle LIST type fields
                  if (metadata.dataType === MetadataType.LIST) {
                    if (metadata.list) {
                      // Inline list creation - send list object without listId
                      cleanedMetadata.list = {
                        name: metadata.list.name,
                        description: metadata.list.description,
                        mandatory: metadata.list.mandatory,
                        option: metadata.list.option
                      };
                    } else if (metadata.listId) {
                      // Existing list - send only listId
                      cleanedMetadata.listId = metadata.listId;
                    }
                    // Note: This should never happen due to validation above
                  }

                  return cleanedMetadata;
                })
              };



              // Send the cleaned category data to the backend
              if (editingCategory) {
                handleUpdateCategory(editingCategory.id, cleanedCategoryData);
              } else {
                handleCreateCategory(cleanedCategoryData);
              }
            } catch (error) {
              console.error('Error saving category with lists:', error);
              addNotification({
                type: 'error',
                title: 'Validation Error',
                message: error instanceof Error ? error.message : 'Failed to save category'
              });
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />

          {/* Modal */}
          <div className="relative w-[500px] max-w-[90vw] bg-background border rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-6 border-b bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold">Confirm Delete</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-lg text-slate-700 mb-2">
                  Are you sure you want to delete this {deletingItem.type}?
                </p>
                <p className="text-sm text-slate-500">
                  <strong>{deletingItem.name}</strong> will be permanently removed.
                </p>
                <p className="text-xs text-red-600 mt-2">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={deletingItem.type === 'category' ? confirmDeleteCategory : confirmDeleteList}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Error Modal */}
      {showDeleteErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteErrorModal(false)}
          />

          {/* Modal */}
          <div className="relative w-[500px] max-w-[90vw] bg-background border rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-6 border-b bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold">{errorModalTitle}</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteErrorModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-lg text-slate-700 mb-2">
                  {deleteErrorMessage || 'This model cannot be deleted.'}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setShowDeleteErrorModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowImportModal(false)}
          />

          {/* Modal */}
          <div className="relative w-[600px] max-w-[90vw] bg-background border rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-6 border-b bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Upload className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold">Import Categories from CSV</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImportModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Upload a CSV file with the following columns:
                </p>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <code className="text-sm">name, description, metadata_fields</code>
                </div>
                <div className="space-y-2 text-xs text-slate-500">
                  <p><strong>metadata_fields format:</strong></p>
                  <p>• For simple fields: <code>fieldName:dataType:mandatory</code></p>
                  <p>• For list fields: <code>fieldName:LIST:mandatory:listName:listMandatory</code></p>
                  <p>• Multiple fields separated by semicolon (;)</p>
                  <p><strong>Example:</strong> <code>invoice_number:STRING:true;status:LIST:true:DocumentStatus:false</code></p>
                </div>
                <p className="text-xs text-slate-500">
                  The CSV should have a header row with these exact column names.
                </p>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportCSV(file);
                    }
                  }}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-slate-400" />
                  <span className="text-sm font-medium">Click to upload CSV file</span>
                  <span className="text-xs text-slate-500">or drag and drop</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowImportModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export CSV Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowExportModal(false)}
          />

          {/* Modal */}
          <div className="relative w-[500px] max-w-[90vw] bg-background border rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-6 border-b bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Download className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">Export Categories to CSV</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExportModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <Label htmlFor="export-quantity">Number of categories to export</Label>
                <Select
                  value={exportQuantity.toString()}
                  onValueChange={(value) => setExportQuantity(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 categories</SelectItem>
                    <SelectItem value="100">100 categories</SelectItem>
                    <SelectItem value="250">250 categories</SelectItem>
                    <SelectItem value="500">500 categories</SelectItem>
                    <SelectItem value="1000">1000 categories</SelectItem>
                    <SelectItem value={categoriesTotalElements.toString()}>All categories ({categoriesTotalElements})</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  The CSV will include: name, description, metadata fields (with full configuration), and created by information.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowExportModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleExportCSV}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
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
function CategoriesTab({ categories, lists, getDataTypeIcon, getDataTypeColor, onEdit, onDelete, onDuplicate, onEditList, loading }: any) {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const toggleCategoryExpansion = (categoryId: number) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

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
            {categories.map((category: FilingCategoryResponseDto, index: number) => {
              const isExpanded = expandedCategories.includes(category.id);

              return (
                <React.Fragment key={category.id}>
                  <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
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
                          {(category.metadataDefinitions?.length ?? 0)} fields
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      {category.createdBy ? (
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            user={category.createdBy}
                            size="sm"
                          />
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-slate-900">
                              {category.createdBy.displayName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {category.createdBy.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic">Unknown</div>
                      )}
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
                          onClick={() => onDelete(category)}
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
                            {(category.metadataDefinitions ?? []).map((metadata: CategoryMetadataDefinitionDto) => (
                              <MetadataDefinitionCard
                                key={metadata.id}
                                metadata={metadata}
                                getDataTypeIcon={getDataTypeIcon}
                                getDataTypeColor={getDataTypeColor}
                                onEditList={onEditList}
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Metadata Definition Card Component
function MetadataDefinitionCard({ metadata, getDataTypeIcon, getDataTypeColor, onEditList }: any) {
  const handleListClick = () => {
    if (metadata.list && onEditList) {
      onEditList(metadata.list);
    }
  };

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
          <button
            onClick={handleListClick}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors cursor-pointer"
            title="Click to edit list"
          >
            {metadata.list.mandatory ? 'Fixed List' : 'Open List'}
          </button>
        )}
      </div>
    </div>
  );
}

// Lists Tab Component
function ListsTab({ lists, onEdit, onDelete, loading }: any) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

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
                    {(list.option ?? []).slice(0, 3).map((option: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                        {option}
                      </span>
                    ))}
                    {(list.option?.length ?? 0) > 3 && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                        +{(list.option?.length ?? 0) - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${list.mandatory
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
                      onClick={() => onDelete(list)}
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
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState<FilingCategoryRequestDto>({
    name: category?.name || '',
    description: category?.description || '',
    metadataDefinitions: category?.metadataDefinitions || [],
    // Auto-classification fields
    autoClassificationEnabled: category?.autoClassificationEnabled || false,
    targetFolderId: category?.autoClassificationTarget?.folderId || undefined,
    classificationRules: category?.classificationRules || [],
    // Name structure for auto-generated filenames
    nameStructure: category?.nameStructure || ''
  });

  // Auto-classification UI state
  const [targetFolderName, setTargetFolderName] = useState<string>(
    category?.autoClassificationTarget?.folderPath || ''
  );
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  // Sync formData when category changes (for edit mode)
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        metadataDefinitions: category.metadataDefinitions || [],
        autoClassificationEnabled: category.autoClassificationEnabled || false,
        targetFolderId: category.autoClassificationTarget?.folderId || undefined,
        classificationRules: category.classificationRules || [],
        nameStructure: category.nameStructure || ''
      });
      setTargetFolderName(category.autoClassificationTarget?.folderPath || '');
    }
  }, [category?.id]); // Only reset when category ID changes, not object reference

  const [newMetadata, setNewMetadata] = useState<ExtendedCategoryMetadataDefinitionDto>({
    key: '',
    dataType: MetadataType.STRING,
    mandatory: false,
    listId: undefined
  });

  const [showNewMetadata, setShowNewMetadata] = useState(false);
  const [editingMetadataIndex, setEditingMetadataIndex] = useState<number | null>(null);
  const [editingMetadata, setEditingMetadata] = useState<ExtendedCategoryMetadataDefinitionDto | null>(null);
  const [listSearchQuery, setListSearchQuery] = useState('');

  // Helper: Check if list name already exists
  const isListNameDuplicate = (listName: string, excludeListId?: number) => {
    const trimmedName = listName.trim().toLowerCase();
    // Check against existing lists
    const existsInLists = lists.some((l: MetaDataListRes) =>
      l.name.toLowerCase() === trimmedName && l.id !== excludeListId
    );
    // Check against inline lists being created in current form
    const existsInInlineLists = (formData.metadataDefinitions?.some(md =>
      md.list && md.list.name.toLowerCase() === trimmedName && md.listId !== excludeListId
    ) ?? false);
    return existsInLists || existsInInlineLists;
  };

  // Helper: Validate list before adding/updating metadata
  const validateListMetadata = (metadata: ExtendedCategoryMetadataDefinitionDto): string | null => {
    if (metadata.dataType !== MetadataType.LIST) return null;

    if (!metadata.listId && !metadata.list) {
      return 'Please select an existing list or create a new one';
    }

    if (metadata.list) {
      if (!metadata.list.name.trim()) {
        return 'List name is required';
      }
      if (isListNameDuplicate(metadata.list.name)) {
        return `A list with the name "${metadata.list.name}" already exists`;
      }
      if (!metadata.list.option || metadata.list.option.length === 0) {
        return 'At least one option is required for the list';
      }
    }

    return null;
  };

  // Filtered lists based on search query
  const filteredLists = useMemo(() => {
    if (!listSearchQuery.trim()) return lists;
    const query = listSearchQuery.toLowerCase();
    return lists.filter((list: MetaDataListRes) =>
      list.name.toLowerCase().includes(query) ||
      (list.description && list.description.toLowerCase().includes(query))
    );
  }, [lists, listSearchQuery]);

  const addMetadataDefinition = () => {
    if (!newMetadata.key?.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Field key is required'
      });
      return;
    }

    // Validate list metadata if applicable
    const validationError = validateListMetadata(newMetadata);
    if (validationError) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: validationError
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      metadataDefinitions: [...(prev.metadataDefinitions ?? []), { ...newMetadata }]
    }));
    setNewMetadata({
      key: '',
      dataType: MetadataType.STRING,
      mandatory: false,
      listId: undefined
    });
    setShowNewMetadata(false);
  };

  const removeMetadataDefinition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metadataDefinitions: (prev.metadataDefinitions ?? []).filter((_, i) => i !== index)
    }));
  };

  const startEditingMetadata = (index: number) => {
    const metadata = (formData.metadataDefinitions ?? [])[index];
    if (!metadata) return;
    setEditingMetadata({
      id: metadata.id, // Preserve ID when editing
      key: metadata.key,
      dataType: metadata.dataType,
      mandatory: metadata.mandatory,
      listId: metadata.listId,
      list: metadata.list
    });
    setEditingMetadataIndex(index);
  };

  const saveEditingMetadata = () => {
    if (!editingMetadata || editingMetadataIndex === null) return;

    if (!editingMetadata.key?.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Field key is required'
      });
      return;
    }

    // Validate list metadata if applicable
    const validationError = validateListMetadata(editingMetadata);
    if (validationError) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: validationError
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      metadataDefinitions: (prev.metadataDefinitions ?? []).map((metadata, index) =>
        index === editingMetadataIndex ? editingMetadata : metadata
      )
    }));
    setEditingMetadata(null);
    setEditingMetadataIndex(null);
  };

  const cancelEditingMetadata = () => {
    setEditingMetadata(null);
    setEditingMetadataIndex(null);
    setListSearchQuery('');
  };

  // Clear search when modal closes or metadata type changes
  useEffect(() => {
    return () => {
      setListSearchQuery('');
    };
  }, []);

  // Clear search when switching away from LIST type
  useEffect(() => {
    if (newMetadata.dataType !== MetadataType.LIST) {
      setListSearchQuery('');
    }
  }, [newMetadata.dataType]);

  useEffect(() => {
    if (editingMetadata?.dataType !== MetadataType.LIST) {
      setListSearchQuery('');
    }
  }, [editingMetadata?.dataType]);

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

              {/* Name Structure */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="nameStructure">Name Structure</Label>
                <Input
                  id="nameStructure"
                  placeholder="e.g., invoice_{client}_{number}_{date}"
                  value={formData.nameStructure || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameStructure: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generate filenames using {'{'}<code>fieldName</code>{'}'} placeholders. Leave empty to use original filename.
                </p>
                {/* Quick Add Buttons */}
                {(formData.metadataDefinitions?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {(formData.metadataDefinitions || []).map((md, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          nameStructure: (prev.nameStructure || '') + `{${md.key}}`
                        }))}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {'{' + md.key + '}'}
                      </Button>
                    ))}
                  </div>
                )}
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
                            <Label htmlFor="select-list">Select Existing List or Create New</Label>
                            <Input
                              placeholder="Search lists..."
                              value={listSearchQuery}
                              onChange={(e) => setListSearchQuery(e.target.value)}
                              className="mb-2"
                            />
                            <Select
                              value={newMetadata.listId?.toString() || ''}
                              onValueChange={(value) => {
                                setNewMetadata(prev => ({
                                  ...prev,
                                  listId: value ? parseInt(value) : undefined,
                                  list: undefined // Clear inline list when selecting existing
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="-- Select a list or create new --" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {filteredLists.length > 0 ? (
                                  filteredLists.map((list: MetaDataListRes) => (
                                    <SelectItem key={list.id} value={list.id.toString()}>
                                      {list.name} ({list.mandatory ? 'Fixed' : 'Open'} - {(list.option?.length ?? 0)} options)
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                    {listSearchQuery ? 'No lists found matching your search' : 'No lists available'}
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setNewMetadata(prev => ({
                                  ...prev,
                                  listId: undefined,
                                  list: prev.list || {
                                    name: '',
                                    description: '',
                                    mandatory: false,
                                    option: []
                                  }
                                }));
                                setListSearchQuery('');
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              {newMetadata.listId ? 'Create new list instead' : 'Creating new list'}
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label>List Behavior</Label>
                            <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                              {newMetadata.listId ?
                                lists.find((l: MetaDataListRes) => l.id === newMetadata.listId)?.mandatory ?
                                  '✓ Fixed list - Users must choose from predefined options' :
                                  '✓ Open list - Users can add custom values' :
                                '✎ A new list will be created when saving this model'
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
                                    className={`h-10 ${newMetadata.list?.name && isListNameDuplicate(newMetadata.list.name) ? 'border-red-500' : ''}`}
                                  />
                                  {newMetadata.list?.name && isListNameDuplicate(newMetadata.list.name) && (
                                    <p className="text-xs text-red-600">
                                      ⚠️ A list with this name already exists
                                    </p>
                                  )}
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
                                        if (!(newMetadata.list.option ?? []).includes(newOption)) {
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
                                        if (!(newMetadata.list.option ?? []).includes(newOption)) {
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
                {(formData.metadataDefinitions ?? []).map((metadata, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                    {editingMetadataIndex === index ? (
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-field-key-${index}`}>Field Key *</Label>
                            <Input
                              id={`edit-field-key-${index}`}
                              type="text"
                              value={editingMetadata?.key || ''}
                              onChange={(e) => setEditingMetadata(prev => prev ? ({ ...prev, key: e.target.value }) : null)}
                              placeholder="e.g., invoice_number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-data-type-${index}`}>Data Type</Label>
                            <Select
                              value={editingMetadata?.dataType || MetadataType.STRING}
                              onValueChange={(value) => setEditingMetadata(prev => prev ? ({ ...prev, dataType: value as MetadataType }) : null)}
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
                                id={`edit-mandatory-${index}`}
                                checked={editingMetadata?.mandatory || false}
                                onChange={(e) => setEditingMetadata(prev => prev ? ({ ...prev, mandatory: e.target.checked }) : null)}
                                className="rounded border-input"
                              />
                              <Label htmlFor={`edit-mandatory-${index}`} className="text-sm">Required field</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Actions</Label>
                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={saveEditingMetadata}
                                size="sm"
                                className="flex-1"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={cancelEditingMetadata}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* List Selection for LIST type when editing */}
                        {editingMetadata?.dataType === MetadataType.LIST && (
                          <div className="space-y-4 pt-4 border-t mt-4">
                            <div className="space-y-2">
                              <Label>List Configuration</Label>
                              <Input
                                placeholder="Search lists..."
                                value={listSearchQuery}
                                onChange={(e) => setListSearchQuery(e.target.value)}
                                className="mb-2"
                              />
                              <Select
                                value={editingMetadata.listId?.toString() || ''}
                                onValueChange={(value) => {
                                  setEditingMetadata(prev => prev ? ({
                                    ...prev,
                                    listId: value ? parseInt(value) : undefined,
                                    list: undefined // Clear inline list when selecting existing
                                  }) : null);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="-- Select a list --" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {filteredLists.length > 0 ? (
                                    filteredLists.map((list: MetaDataListRes) => (
                                      <SelectItem key={list.id} value={list.id.toString()}>
                                        {list.name} ({list.mandatory ? 'Fixed' : 'Open'} - {(list.option?.length ?? 0)} options)
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                      {listSearchQuery ? 'No lists found matching your search' : 'No lists available'}
                                    </div>
                                  )}
                                </SelectContent>
                              </Select>
                              {editingMetadata.list && (
                                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                  ⚠️ This field has an inline list. To modify it, select an existing list or save and edit the category again.
                                </div>
                              )}
                              {editingMetadata.listId && (
                                <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
                                  ✓ Using existing list: {lists.find((l: MetaDataListRes) => l.id === editingMetadata.listId)?.name}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            {getDataTypeIcon(metadata.dataType)}
                          </div>
                          <div>
                            <div className="font-medium">{metadata.key}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {metadata.dataType?.toLowerCase()}
                              {metadata.mandatory && ' • Required'}
                              {metadata.listId && ` • List ID: ${metadata.listId}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingMetadata(index)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMetadataDefinition(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {(formData.metadataDefinitions?.length ?? 0) === 0 && (
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

          {/* Auto-Classification Section */}
          <div className="mt-6">
            <Card className="border-blue-100 bg-blue-50/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <FolderTree className="h-4 w-4" />
                  </div>
                  Auto-Classification
                </CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="auto-class-enabled"
                    checked={formData.autoClassificationEnabled || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoClassificationEnabled: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="auto-class-enabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Enable auto-classification for documents in this category
                  </Label>
                </div>
              </CardHeader>

              {formData.autoClassificationEnabled && (
                <CardContent className="space-y-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border">
                    <div className="space-y-2">
                      <Label>Target Root Folder</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 px-3 py-2 border rounded-md bg-background text-sm text-muted-foreground flex items-center overflow-hidden">
                          {targetFolderName ? (
                            <span className="text-foreground">{targetFolderName}</span>
                          ) : (
                            <span className="italic">No folder selected</span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setShowFolderPicker(true)}
                          className="flex items-center gap-2"
                        >
                          <FolderTree className="h-4 w-4" />
                          Browse
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Documents will be automatically moved to this folder, organized by the rules below.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Classification Rules (Path Structure)</Label>
                      <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[50px] bg-background items-center">
                        <span className="px-2 py-1 bg-muted rounded text-xs font-mono text-muted-foreground">
                          {targetFolderName || '[Root]'} /
                        </span>
                        {(formData.classificationRules || []).map((rule, idx) => (
                          <div key={idx} className="flex items-center animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 text-sm">
                              <Tag className="h-3 w-3 mr-1" />
                              {rule}
                              <button
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  classificationRules: (prev.classificationRules || []).filter((_, i) => i !== idx)
                                }))}
                                className="ml-2 hover:bg-blue-100 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="mx-1 text-muted-foreground">/</span>
                          </div>
                        ))}
                        <span className="text-xs text-muted-foreground italic">[Document]</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground font-semibold">Available Metadata Fields</Label>
                      <div className="flex flex-wrap gap-2">
                        {(formData.metadataDefinitions || []).map((md, idx) => (
                          <Button
                            key={idx}
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              classificationRules: [...(prev.classificationRules || []), md.key]
                            }))}
                            disabled={(formData.classificationRules || []).includes(md.key)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {md.key}
                          </Button>
                        ))}
                        {(formData.metadataDefinitions?.length ?? 0) === 0 && (
                          <span className="text-xs text-muted-foreground">No metadata fields available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {(formData.metadataDefinitions?.length ?? 0)} metadata field{(formData.metadataDefinitions?.length ?? 0) !== 1 ? 's' : ''} defined
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => {
              onSave(formData);
            }} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {category ? 'Update Model' : 'Create Model'}
            </Button>
          </div>
        </div>
      </div>

      {/* Folder Picker Modal */}
      <FolderPickerModal
        isOpen={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        onSelect={(folderId, folderName, folderPath) => {
          setFormData(prev => ({ ...prev, targetFolderId: folderId }));
          setTargetFolderName(folderPath);
        }}
      />
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
    if (newOption.trim() && !(formData.option ?? []).includes(newOption.trim())) {
      setFormData(prev => ({
        ...prev,
        option: [...(prev.option ?? []), newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      option: (prev.option ?? []).filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (formData.name.trim() && (formData.option?.length ?? 0) > 0) {
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
                    {(formData.option?.length ?? 0)} option{(formData.option?.length ?? 0) !== 1 ? 's' : ''}
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

                {(formData.option?.length ?? 0) > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">Current Options:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {(formData.option ?? []).map((option, index) => (
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
            {(formData.option?.length ?? 0)} option{(formData.option?.length ?? 0) !== 1 ? 's' : ''} defined
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim() || (formData.option?.length ?? 0) === 0}
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