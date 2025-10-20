// components/document/MetadataTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { Tag, FileText, Plus, X, Edit3, Save, ChevronDown, FolderOpen, Calendar, Hash, ToggleLeft, List, MoreHorizontal, User } from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';
import { DocumentService } from '../../api/services/documentService';
import { FilingCategoryService } from '../../api/services/filingCategoryService';
import { FilingCategoryResponseDto, FilingCategoryDocDto, MetaDataDto, MetadataType, UpdateDocumentMetadataRequestDto, DocumentFilingCategoryResponseDto, TagResponseDto, CreateTagRequestDto, AddTagToDocumentRequestDto } from '../../types/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { SearchSelect } from '../main/SearchSelect';
import CreateTagModal from '../modals/CreateTagModal';
import RelatedDocumentsSection from './RelatedDocumentsSection';
import { formatFileSize, formatDate } from '../../utils/documentUtils';

interface MetadataTabProps {
  document: DocumentViewDto;
  isLoading: boolean;
  onUpdateMetadata: (metadata: string[]) => void;
  onUpdateDocument?: (updatedDocument: DocumentViewDto) => void;
  onRefreshMetadata?: () => Promise<void>;
}

export default function MetadataTab({ 
  document, 
  isLoading, 
  onUpdateMetadata,
  onUpdateDocument,
  onRefreshMetadata
}: MetadataTabProps) {
  const [tags, setTags] = useState<TagResponseDto[]>([]);
  const [availableTags, setAvailableTags] = useState<TagResponseDto[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);
  
  const [availableModels, setAvailableModels] = useState<FilingCategoryResponseDto[]>([]);
  const [isEditingModel, setIsEditingModel] = useState(false);
  const [isEditingExistingMetadata, setIsEditingExistingMetadata] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<FilingCategoryResponseDto | DocumentFilingCategoryResponseDto | null>(null);
  const [editingMetadata, setEditingMetadata] = useState<MetaDataDto[]>([]);
  const [isUpdatingModel, setIsUpdatingModel] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [customValueFields, setCustomValueFields] = useState<Set<number>>(new Set());
  
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['model', 'tags']));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Load document tags
    loadDocumentTags();
    // Load available tags
    loadAvailableTags();
  }, [document.documentId]);

  const loadDocumentTags = async () => {
    try {
      setIsLoadingTags(true);
      const documentTags = await DocumentService.getTagsByDocumentId(document.documentId);
      setTags(documentTags);
    } catch (error) {
      console.error('Error loading document tags:', error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  const loadAvailableTags = async () => {
    try {
      const tags = await DocumentService.getAvailableTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading available tags:', error);
    }
  };

  const handleLinkCreated = () => {
    setSuccess('Document link created successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  useEffect(() => {
    if (document.filingCategory) {
      setSelectedModelId(document.filingCategory.id);
      setSelectedModel(document.filingCategory);
      const metadata = document.filingCategory.metadata.map((meta: any) => ({
        id: meta.metadataId,
        value: meta.value
      }));
      setEditingMetadata(metadata);
    }
  }, [document.filingCategory]);

  // Helper function to get metadata definitions for editing
  const getMetadataDefinitionsForEditing = () => {
    // If we have a selected model, use its definitions
    if (selectedModel && 'metadataDefinitions' in selectedModel) {
      return selectedModel.metadataDefinitions;
    }
    
    // If we have document metadata definitions, use those
    if (document.metadataDefinitions && document.metadataDefinitions.length > 0) {
      return document.metadataDefinitions;
    }
    
    // Fallback to empty array
    return [];
  };

  // Initialize editing of existing metadata
  const startEditingExistingMetadata = () => {
    if (document.filingCategory && document.filingCategory.metadata) {
      const metadata = document.filingCategory.metadata.map((meta: any) => ({
        id: meta.metadataId,
        value: meta.value
      }));
      setEditingMetadata(metadata);
      setIsEditingExistingMetadata(true);
    }
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoadingModels(true);
        const response = await FilingCategoryService.getAllFilingCategories({ size: 100 });
        const models = response.content || [];
        setAvailableModels(models);
      } catch (error) {
        console.error('Error loading models:', error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    loadModels();
  }, []);

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      newSet.has(section) ? newSet.delete(section) : newSet.add(section);
      return newSet;
    });
  };

  // Helper function to render input based on metadata type
  const renderMetadataInput = (meta: MetaDataDto, metadataDef: any) => {
    const { dataType, key, mandatory } = metadataDef;
    
    const commonInputProps = {
      value: meta.value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        updateMetadataValue(meta.id, e.target.value),
      placeholder: key,
      required: mandatory
    };

    switch (dataType) {
      case MetadataType.DATE:
        return (
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Input
              {...commonInputProps}
              type="date"
              className="pl-10"
            />
          </div>
        );
      
      case MetadataType.DATETIME:
        return (
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Input
              {...commonInputProps}
              type="datetime-local"
              className="pl-10"
            />
          </div>
        );
      
      case MetadataType.NUMBER:
        return (
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Input
              {...commonInputProps}
              type="number"
              className="pl-10"
              step="1"
            />
          </div>
        );
      
      case MetadataType.FLOAT:
        return (
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Input
              {...commonInputProps}
              type="number"
              className="pl-10"
              step="any"
            />
          </div>
        );
      
      case MetadataType.STRING:
        return (
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Input
              {...commonInputProps}
              type="text"
              className="pl-10"
            />
          </div>
        );
      
      case MetadataType.BOOLEAN:
        return (
          <div className="flex items-center gap-2">
            <ToggleLeft className="h-4 w-4 text-gray-400" />
            <Select
              value={meta.value}
              onValueChange={(value) => updateMetadataValue(meta.id, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      
      case MetadataType.LIST:
        const listData = metadataDef.list;
        const hasOptions = listData?.option && listData.option.length > 0;
        const allowCustomValue = mandatory; // When mandatory=true, user can enter custom values
        const isCustomValueMode = customValueFields.has(meta.id);
        
        return (
          <div className="space-y-2">
            {isCustomValueMode ? (
              <div className="space-y-2">
                <div className="relative">
                  <List className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    {...commonInputProps}
                    type="text"
                    className="pl-10"
                    placeholder="Enter custom value..."
                  />
                </div>
                <button
                  onClick={() => {
                    setCustomValueFields(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(meta.id);
                      return newSet;
                    });
                    updateMetadataValue(meta.id, "");
                  }}
                  className="text-xs text-gray-600 hover:text-gray-800 underline"
                >
                  Back to list selection
                </button>
              </div>
            ) : hasOptions ? (
              <div className="space-y-2">
                <div className="relative">
                  <List className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Select
                    value={meta.value}
                    onValueChange={(value) => updateMetadataValue(meta.id, value)}
                  >
                    <SelectTrigger className="w-full pl-10">
                      <SelectValue placeholder="Select from list..." />
                    </SelectTrigger>
                    <SelectContent>
                      {listData.option.map((option: string, index: number) => (
                        <SelectItem key={index} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 {allowCustomValue && (
                   <button
                     onClick={() => {
                       setCustomValueFields(prev => new Set(prev).add(meta.id));
                       updateMetadataValue(meta.id, "");
                     }}
                     className="text-xs text-gray-600 hover:text-gray-800 underline"
                   >
                     {mandatory ? "Enter custom value" : "Enter custom value instead"}
                   </button>
                 )}
              </div>
            ) : allowCustomValue ? (
              <div className="relative">
                <List className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Input
                  {...commonInputProps}
                  type="text"
                  className="pl-10"
                  placeholder="Enter custom value..."
                />
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
                No options available
              </div>
            )}
            {listData?.description && (
              <div className="text-xs text-gray-500 rounded">
               {listData.description}
              </div>
            )}
          </div>
        );
      
      case MetadataType.TEXT:
      default:
        return (
          <Input
            {...commonInputProps}
            type="text"
          />
        );
    }
  };

  // Helper function to get metadata type icon
  const getMetadataTypeIcon = (dataType: MetadataType) => {
    switch (dataType) {
      case MetadataType.DATE:
        return <Calendar className="h-3 w-3 text-blue-500" />;
      case MetadataType.NUMBER:
        return <Hash className="h-3 w-3 text-green-500" />;
      case MetadataType.BOOLEAN:
        return <ToggleLeft className="h-3 w-3 text-purple-500" />;
      case MetadataType.LIST:
        return <List className="h-3 w-3 text-orange-500" />;
      case MetadataType.TEXT:
      default:
        return <FileText className="h-3 w-3 text-gray-500" />;
    }
  };

  // Helper function to format metadata value for display
  const formatMetadataValue = (value: string, dataType: MetadataType) => {
    if (!value) return 'Not set';
    
    switch (dataType) {
      case MetadataType.DATE:
        return new Date(value).toLocaleDateString();
      case MetadataType.BOOLEAN:
        return value === 'true' ? 'Yes' : value === 'false' ? 'No' : value;
      default:
        return value;
    }
  };

  const handleModelChange = async (modelId: number) => {
    setSelectedModelId(modelId);
    const model = availableModels.find(m => m.id === modelId);
    if (model) {
      setSelectedModel(model);
      const metadata = model.metadataDefinitions.map(def => ({
        id: def.id || 0,
        value: ''
      }));
      setEditingMetadata(metadata);
      
      // Refetch categories to get updated metadata definitions
      try {
        const response = await FilingCategoryService.getAllFilingCategories({ size: 100 });
        const updatedModels = response.content || [];
        setAvailableModels(updatedModels);
        
        // Update selected model with fresh data
        const updatedModel = updatedModels.find(m => m.id === modelId);
        if (updatedModel) {
          setSelectedModel(updatedModel);
        }
      } catch (error) {
        console.error('Error refetching categories:', error);
      }
    }
  };

  const updateMetadataValue = (metadataId: number, value: string) => {
    setEditingMetadata(prev => 
      prev.map(meta => meta.id === metadataId ? { ...meta, value } : meta)
    );
  };

  const saveModel = async () => {
    if (!selectedModelId) return;

    try {
      setIsUpdatingModel(true);
      setError(null);
      setSuccess(null);
      
      // Validate mandatory fields
      const metadataDefinitions = getMetadataDefinitionsForEditing();
      if (metadataDefinitions.length > 0) {
        const mandatoryFields = metadataDefinitions.filter(def => def.mandatory);
        const missingFields = mandatoryFields.filter(def => {
          const meta = editingMetadata.find(m => m.id === def.id);
          return !meta || !meta.value.trim();
        });
        
        if (missingFields.length > 0) {
          setError(`Please fill in all mandatory fields: ${missingFields.map(f => f.key).join(', ')}`);
          return;
        }
      }

      const filingCategory: FilingCategoryDocDto = {
        id: selectedModelId,
        metaDataDto: editingMetadata
      };

      const request: UpdateDocumentMetadataRequestDto = {
        filingCategory: filingCategory
      };

      await DocumentService.updateDocumentMetadata(
        document.documentId, 
        request
      );

      // Update local state with the new model and metadata
      if (onUpdateDocument && selectedModel) {
        const updatedDocument = {
          ...document,
          filingCategory: {
            id: selectedModelId,
            name: selectedModel.name,
            description: selectedModel.description,
            metadata: editingMetadata.map(meta => {
              let metadataName = '';
              if (selectedModel && 'metadataDefinitions' in selectedModel) {
                const metadataDef = selectedModel.metadataDefinitions.find((def: any) => def.id === meta.id);
                metadataName = metadataDef?.key || '';
              }
              return {
                metadataId: meta.id,
                metadataName: metadataName,
                value: meta.value
              };
            })
          }
        };
        onUpdateDocument(updatedDocument as DocumentViewDto);
      }

      setSuccess('Model and metadata updated successfully');
      setIsEditingModel(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating model:', error);
      setError('Failed to update model and metadata. Please try again.');
    } finally {
      setIsUpdatingModel(false);
    }
  };

  const saveExistingMetadata = async () => {
    if (!document.filingCategory) return;

    try {
      setIsUpdatingModel(true);
      setError(null);
      setSuccess(null);
      
      // Validate mandatory fields
      const metadataDefinitions = getMetadataDefinitionsForEditing();
      if (metadataDefinitions.length > 0) {
        const mandatoryFields = metadataDefinitions.filter(def => def.mandatory);
        const missingFields = mandatoryFields.filter(def => {
          const meta = editingMetadata.find(m => m.id === def.id);
          return !meta || !meta.value.trim();
        });
        
        if (missingFields.length > 0) {
          setError(`Please fill in all mandatory fields: ${missingFields.map(f => f.key).join(', ')}`);
          return;
        }
      }

      const filingCategory: FilingCategoryDocDto = {
        id: document.filingCategory.id,
        metaDataDto: editingMetadata
      };

      const request: UpdateDocumentMetadataRequestDto = {
        filingCategory: filingCategory
      };

      await DocumentService.updateDocumentMetadata(
        document.documentId, 
        request
      );

      // Update local state with the updated metadata
      if (onUpdateDocument && document.filingCategory) {
        const updatedDocument = {
          ...document,
          filingCategory: {
            ...document.filingCategory,
            metadata: editingMetadata.map(meta => {
              const existingMeta = document.filingCategory?.metadata.find(m => m.metadataId === meta.id);
              return {
                metadataId: meta.id,
                metadataName: existingMeta?.metadataName || '',
                value: meta.value
              };
            })
          }
        };
        onUpdateDocument(updatedDocument as DocumentViewDto);
      }

      setSuccess('Metadata updated successfully');
      setIsEditingExistingMetadata(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating metadata:', error);
      setError('Failed to update metadata. Please try again.');
    } finally {
      setIsUpdatingModel(false);
    }
  };

  const handleTagSelect = async (tag: TagResponseDto) => {
    try {
      // Check if tag is already added
      if (tags.some(t => t.id === tag.id)) {
        setError('This tag is already added to the document');
        return;
      }

      // Add tag to document
      await DocumentService.addTagToDocument(document.documentId, { tagId: tag.id });
      
      // Update local state
      setTags(prev => [...prev, tag]);
      setSuccess(`Tag "${tag.name}" added successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error adding tag:', error);
      setError('Failed to add tag. Please try again.');
    }
  };

  const handleTagRemove = async (tagId: number) => {
    try {
      await DocumentService.removeTagFromDocument(document.documentId, tagId);
      
      // Update local state
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      setSuccess('Tag removed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error removing tag:', error);
      setError('Failed to remove tag. Please try again.');
    }
  };

  const handleCreateNewTag = async (tagData: { name: string; description?: string; color?: string }) => {
    try {
      const newTag: CreateTagRequestDto = {
        name: tagData.name,
        description: tagData.description || `Tag created for document: ${document.name}`,
        color: tagData.color
      };
      
      const createdTag = await DocumentService.createTag(newTag);
      
      // Add the new tag to the document
      await DocumentService.addTagToDocument(document.documentId, { tagId: createdTag.id });
      
      // Update local state
      setTags(prev => [...prev, createdTag]);
      setAvailableTags(prev => [...prev, createdTag]);
      setSuccess(`Tag "${createdTag.name}" created and added successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error creating tag:', error);
      setError('Failed to create tag. Please try again.');
      throw error; // Re-throw to let modal handle the error
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-6 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Model Section */}
      <div className="border-b pb-4">
        <div 
          className="flex items-center justify-between cursor-pointer mb-2"
          onClick={() => toggleSection('model')}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-900">Model</span>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {document.filingCategory ? document.filingCategory.name : 'No model'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {document.userPermissions?.canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingModel(!isEditingModel);
                }}
                className="p-1 text-gray-500 hover:text-blue-600"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openSections.has('model') ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {openSections.has('model') && (
          <div className="ml-2 mt-3 space-y-3">
            {isEditingModel ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Model
                  </label>
                  
                  {selectedModel ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <div className="font-medium text-blue-900">{selectedModel.name}</div>
                        {selectedModel.description && (
                          <div className="text-sm text-blue-700 mt-1">{selectedModel.description}</div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedModel(null);
                          setSelectedModelId(null);
                          setEditingMetadata([]);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                      >
                        Change Model
                      </button>
                    </div>
                  ) : (
                    <SearchSelect
                      items={availableModels}
                      fetchFunction={async (query: string) => {
                        const response = await FilingCategoryService.getAllFilingCategories({ 
                          size: 100,
                          name: query 
                        });
                        return response.content || [];
                      }}
                      onSelect={(model) => handleModelChange(model.id)}
                      placeholder="Search and select model..."
                      displayField="name"
                      descriptionField="description"
                      debounceMs={500}
                    />
                  )}
                </div>

                {selectedModelId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model Metadata
                    </label>
                    <div className="space-y-3">
                      {editingMetadata.map((meta) => {
                        const metadataDefinitions = getMetadataDefinitionsForEditing();
                        const metadataDef = metadataDefinitions.find(def => def.id === meta.id);
                        if (!metadataDef) {
                          console.warn(`Metadata definition not found for id: ${meta.id}`);
                          return null;
                        }

                        return (
                          <div key={meta.id} className="space-y-1">
                            <label className="flex items-center gap-2 text-xs text-gray-600">
                              {getMetadataTypeIcon(metadataDef.dataType)}
                              <span className="font-medium">{metadataDef.key}</span>
                              {metadataDef.mandatory && <span className="text-red-500">*</span>}
                              <span className="text-gray-400 text-xs">({metadataDef.dataType.toLowerCase()})</span>
                            </label>
                            {renderMetadataInput(meta, metadataDef)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingModel(false)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveModel}
                    disabled={!selectedModelId || isUpdatingModel}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {isUpdatingModel ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {document.filingCategory ? (
                  <>
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="font-medium text-blue-900">{document.filingCategory.name}</div>
                      {document.filingCategory.description && (
                        <div className="text-sm text-blue-700 mt-1">{document.filingCategory.description}</div>
                      )}
                    </div>
                    
                    {document.filingCategory.metadata && document.filingCategory.metadata.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-700">Model Metadata</div>
                          {document.userPermissions?.canEdit && !isEditingExistingMetadata && (
                            <button
                              onClick={startEditingExistingMetadata}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Edit Metadata
                            </button>
                          )}
                        </div>
                        
                        {isEditingExistingMetadata ? (
                          <div className="space-y-3">
                            {editingMetadata.map((meta) => {
                              const metadataDefinitions = getMetadataDefinitionsForEditing();
                              const metadataDef = metadataDefinitions.find(def => def.id === meta.id);
                              if (!metadataDef) {
                                console.warn(`Metadata definition not found for id: ${meta.id}`);
                                return null;
                              }

                              return (
                                <div key={meta.id} className="space-y-1">
                                  <label className="flex items-center gap-2 text-xs text-gray-600">
                                    {getMetadataTypeIcon(metadataDef.dataType)}
                                    <span className="font-medium">{metadataDef.key}</span>
                                    {metadataDef.mandatory && <span className="text-red-500">*</span>}
                                    <span className="text-gray-400 text-xs">({metadataDef.dataType.toLowerCase()})</span>
                                  </label>
                                  {renderMetadataInput(meta, metadataDef)}
                                </div>
                              );
                            })}
                            
                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                onClick={() => setIsEditingExistingMetadata(false)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveExistingMetadata}
                                disabled={isUpdatingModel}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                {isUpdatingModel ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {document.filingCategory.metadata.map((meta: any) => {
                              // Use document metadata definitions if available, otherwise fallback to model definitions
                              const metadataDefinitions = getMetadataDefinitionsForEditing();
                              const metadataDef = metadataDefinitions.find(
                                (def: any) => def.id === meta.metadataId
                              );
                              const dataType = metadataDef?.dataType || MetadataType.TEXT;
                              
                              return (
                                <div key={meta.metadataId} className="p-3 bg-gray-50 rounded border">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {getMetadataTypeIcon(dataType)}
                                      <span className="text-sm font-medium text-gray-700">{meta.metadataName}</span>
                                      {metadataDef && (
                                        <span className="text-xs text-gray-400">({dataType.toLowerCase()})</span>
                                      )}
                                    </div>
                                    <span className="text-sm text-gray-900 font-medium">
                                      {formatMetadataValue(meta.value, dataType)}
                                    </span>
                                  </div>
                                  
                                  {/* Show list description if it's a LIST type */}
                                  {dataType === MetadataType.LIST && metadataDef?.list?.description && (
                                    <div className="text-xs text-gray-500 rounded ">
                                       {metadataDef.list.description}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500">
                    No model assigned
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div className="border-b pb-4">
        <div 
          className="flex items-center justify-between cursor-pointer mb-3"
          onClick={() => toggleSection('tags')}
        >
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-900">Tags</span>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {tags.length} tag{tags.length !== 1 ? 's' : ''}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openSections.has('tags') ? 'rotate-180' : ''}`} />
        </div>

        {openSections.has('tags') && (
          <div className="ml-6 space-y-3">
            {/* Search and Add Tag Interface */}
            {document.userPermissions?.canEdit && (
              <div className="space-y-2">
                <SearchSelect
                  items={availableTags}
                  fetchFunction={async (query: string) => {
                    const response = await DocumentService.searchTags(query, 0, 20);
                    return response.content || [];
                  }}
                  onSelect={handleTagSelect}
                  placeholder="Search and select tags..."
                  displayField="name"
                  descriptionField="description"
                  debounceMs={300}
                />
                
                {/* Create New Tag Option */}
                <div className="text-xs text-gray-500">
                  Can't find the tag you're looking for?{' '}
                  <button
                    onClick={() => setIsCreateTagModalOpen(true)}
                    className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors"
                  >
                    Create a new tag
                  </button>
                </div>
              </div>
            )}

            {/* Tags Display */}
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {isLoadingTags ? (
                <div className="text-sm text-gray-500">Loading tags...</div>
              ) : tags.length > 0 ? (
                tags.map((tag) => (
                  <div 
                    key={tag.id} 
                    className="group flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
                    style={{ 
                      backgroundColor: tag.color ? `${tag.color}20` : '#EFF6FF',
                      borderColor: tag.color ? `${tag.color}40` : '#DBEAFE',
                      color: tag.color || '#1D4ED8'
                    }}
                  >
                    <span className="text-sm font-medium">{tag.name}</span>
                    {tag.color && (
                      <div 
                        className="w-3 h-3 rounded-full border"
                        style={{ 
                          backgroundColor: tag.color,
                          borderColor: tag.color
                        }}
                      />
                    )}
                    {document.userPermissions?.canEdit && (
                      <button 
                        onClick={() => handleTagRemove(tag.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black hover:bg-opacity-10"
                        style={{ color: tag.color || '#1D4ED8' }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400 italic">
                  No tags added yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Related Documents */}
      <div className="border-b pb-4">
        <RelatedDocumentsSection
          documentId={document.documentId}
          documentName={document.name}
          canEdit={document.userPermissions?.canEdit || false}
          onLinkCreated={handleLinkCreated}
        />
      </div>

      {/* Create Tag Modal */}
      <CreateTagModal
        isOpen={isCreateTagModalOpen}
        onClose={() => setIsCreateTagModalOpen(false)}
        onCreateTag={handleCreateNewTag}
      />
    </div>
  );
}