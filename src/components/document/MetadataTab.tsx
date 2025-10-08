// components/document/MetadataTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Tag, 
  Info, 
  FileText, 
  Eye, 
  X, 
  Plus,
  Edit3,
  Save,
  FolderOpen,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';
import { formatDate } from '../../utils/documentUtils';
import { notificationApiClient } from '../../api/notificationClient';
import { FilingCategoryService } from '../../api/services/filingCategoryService';
import { FilingCategoryResponseDto, FilingCategoryDocDto, MetaDataDto } from '../../types/api';

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
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [isAddingTag, setIsAddingTag] = useState<boolean>(false);
  
  // Filing Category Management
  const [availableFilingCategories, setAvailableFilingCategories] = useState<FilingCategoryResponseDto[]>([]);
  const [isEditingFilingCategory, setIsEditingFilingCategory] = useState<boolean>(false);
  const [selectedFilingCategoryId, setSelectedFilingCategoryId] = useState<number | null>(null);
  const [editingMetadata, setEditingMetadata] = useState<MetaDataDto[]>([]);
  const [isUpdatingFilingCategory, setIsUpdatingFilingCategory] = useState<boolean>(false);
  const [isLoadingFilingCategories, setIsLoadingFilingCategories] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['filing-category', 'metadata']));

  useEffect(() => {
    setEditingTags(document.metadata);
  }, [document.metadata]);

  // Initialize filing category data
  useEffect(() => {
    if (document.filingCategory) {
      setSelectedFilingCategoryId(document.filingCategory.id);
      // Convert DocumentMetadataResponseDto to MetaDataDto
      const metadata = document.filingCategory.metadata.map((meta: any) => ({
        id: meta.metadataId,
        value: meta.value
      }));
      setEditingMetadata(metadata);
    }
  }, [document.filingCategory]);

  // Load available filing categories
  useEffect(() => {
    loadAvailableFilingCategories();
  }, []);

  const loadAvailableFilingCategories = async () => {
    try {
      setIsLoadingFilingCategories(true);
      const response = await FilingCategoryService.getAllFilingCategories({ size: 100 });
      setAvailableFilingCategories(response.content || []);
    } catch (error) {
      console.error('Error loading filing categories:', error);
    } finally {
      setIsLoadingFilingCategories(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleFilingCategoryChange = (categoryId: number) => {
    setSelectedFilingCategoryId(categoryId);
    const selectedCategory = availableFilingCategories.find(cat => cat.id === categoryId);
    if (selectedCategory) {
      // Initialize metadata with empty values for the selected category
      const metadata = selectedCategory.metadataDefinitions.map(def => ({
        id: def.id || 0,
        value: ''
      }));
      setEditingMetadata(metadata);
    }
  };

  const updateMetadataValue = (metadataId: number, value: string) => {
    setEditingMetadata(prev => 
      prev.map(meta => 
        meta.id === metadataId ? { ...meta, value } : meta
      )
    );
  };

  const saveFilingCategory = async () => {
    if (!selectedFilingCategoryId) return;

    try {
      setIsUpdatingFilingCategory(true);
      
      const filingCategoryDto: FilingCategoryDocDto[] = [{
        id: selectedFilingCategoryId,
        metaDataDto: editingMetadata
      }];

      const updatedDocument = await notificationApiClient.updateDocumentFilingCategory(
        document.documentId, 
        filingCategoryDto
      );

      if (onUpdateDocument) {
        onUpdateDocument(updatedDocument as DocumentViewDto);
      }

      // Refresh metadata to get the latest data
      if (onRefreshMetadata) {
        await onRefreshMetadata();
      }

      setIsEditingFilingCategory(false);
    } catch (error) {
      console.error('Error updating filing category:', error);
    } finally {
      setIsUpdatingFilingCategory(false);
    }
  };

  const cancelFilingCategoryEdit = () => {
    setIsEditingFilingCategory(false);
    // Reset to original values
    if (document.filingCategory) {
      setSelectedFilingCategoryId(document.filingCategory.id);
      const metadata = document.filingCategory.metadata.map((meta: any) => ({
        id: meta.metadataId,
        value: meta.value
      }));
      setEditingMetadata(metadata);
    }
  };

  // Helper function to determine input type based on data type
  const getInputType = (dataType: string): string => {
    switch (dataType?.toLowerCase()) {
      case 'date':
        return 'date';
      case 'time':
        return 'time';
      case 'datetime':
      case 'timestamp':
        return 'datetime-local';
      case 'number':
      case 'integer':
      case 'decimal':
      case 'float':
        return 'number';
      case 'email':
        return 'email';
      case 'url':
        return 'url';
      case 'tel':
      case 'phone':
        return 'tel';
      case 'password':
        return 'password';
      case 'boolean':
        return 'checkbox';
      case 'text':
      case 'longtext':
      case 'textarea':
        return 'textarea';
      default:
        return 'text';
    }
  };

  // Helper function to get appropriate placeholder based on data type
  const getPlaceholder = (dataType: string, fieldName: string): string => {
    const fieldNameLower = fieldName?.toLowerCase() || '';
    
    switch (dataType?.toLowerCase()) {
      case 'date':
        return 'Select date...';
      case 'time':
        return 'Select time...';
      case 'datetime':
      case 'timestamp':
        return 'Select date and time...';
      case 'number':
      case 'integer':
      case 'decimal':
      case 'float':
        return 'Enter number...';
      case 'email':
        return 'Enter email address...';
      case 'url':
        return 'Enter URL...';
      case 'tel':
      case 'phone':
        return 'Enter phone number...';
      case 'password':
        return 'Enter password...';
      case 'text':
      case 'longtext':
      case 'textarea':
        return `Enter ${fieldNameLower}...`;
      default:
        return `Enter ${fieldNameLower}...`;
    }
  };

  // Helper function to validate required fields
  const validateRequiredFields = (): boolean => {
    const category = availableFilingCategories.find(cat => cat.id === selectedFilingCategoryId);
    if (!category) return true;

    const requiredFields = category.metadataDefinitions.filter(def => def.mandatory);
    
    for (const field of requiredFields) {
      const metadata = editingMetadata.find(meta => meta.id === field.id);
      if (!metadata || !metadata.value.trim()) {
        return false;
      }
    }
    
    return true;
  };

  const addTag = () => {
    if (newTag.trim() && !editingTags.includes(newTag.trim())) {
      const updatedTags = [...editingTags, newTag.trim()];
      setEditingTags(updatedTags);
      onUpdateMetadata(updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    const updatedTags = editingTags.filter((_, i) => i !== index);
    setEditingTags(updatedTags);
    onUpdateMetadata(updatedTags);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-ui rounded w-32 mb-4"></div>
          <div className="flex flex-wrap gap-2 mb-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 bg-neutral-ui rounded w-16"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-neutral-ui rounded w-20"></div>
                <div className="h-4 bg-neutral-ui rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Filing Category Section */}
      <div className="border border-ui rounded-lg">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-background transition-colors"
          onClick={() => toggleSection('filing-category')}
        >
          <div className="flex items-center gap-3">
            {expandedSections.has('filing-category') ? (
              <ChevronDown className="h-4 w-4 text-neutral-text-light" />
            ) : (
              <ChevronRight className="h-4 w-4 text-neutral-text-light" />
            )}
            <FolderOpen className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium text-neutral-text-dark">Filing Category</h3>
              <p className="text-sm text-neutral-text-light">
                {document.filingCategory ? document.filingCategory.name : 'No category assigned'}
              </p>
            </div>
          </div>
          {document.userPermissions?.canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingFilingCategory(!isEditingFilingCategory);
              }}
              className="p-2 text-neutral-text-light hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
        </div>

        {expandedSections.has('filing-category') && (
          <div className="px-4 pb-4 border-t border-ui">
            {isEditingFilingCategory ? (
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                    Select Filing Category
                  </label>
                  {isLoadingFilingCategories ? (
                    <div className="p-3 border border-ui rounded-lg bg-neutral-background">
                      <div className="animate-pulse text-sm text-neutral-text-light">Loading categories...</div>
                    </div>
                  ) : (
                    <select
                      value={selectedFilingCategoryId || ''}
                      onChange={(e) => handleFilingCategoryChange(parseInt(e.target.value))}
                      className="w-full p-3 border border-ui rounded-lg bg-surface text-neutral-text-dark focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select a filing category...</option>
                      {availableFilingCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedFilingCategoryId && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                      Category Metadata
                    </label>
                    <div className="space-y-3">
                      {editingMetadata.map((meta) => {
                        const category = availableFilingCategories.find(cat => cat.id === selectedFilingCategoryId);
                        const metadataDef = category?.metadataDefinitions.find(def => def.id === meta.id);
                        
                        if (!metadataDef) return null;
                        
                        const isRequired = metadataDef.mandatory;
                        const fieldType = getInputType(metadataDef.dataType);
                        const placeholder = getPlaceholder(metadataDef.dataType, metadataDef.key);
                        
                        return (
                          <div key={meta.id} className="flex flex-col gap-1">
                            <label className="text-sm text-neutral-text-light flex items-center gap-1">
                              {metadataDef.key}
                              {isRequired && (
                                <span className="text-error text-xs">*</span>
                              )}
                            </label>
                            
                            {/* Render different input types based on data type */}
                            {fieldType === 'checkbox' ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={meta.value === 'true' || meta.value === '1'}
                                  onChange={(e) => updateMetadataValue(meta.id, e.target.checked ? 'true' : 'false')}
                                  className="w-4 h-4 text-primary bg-surface border-ui rounded focus:ring-primary focus:ring-2"
                                />
                                <span className="text-sm text-neutral-text-light">
                                  {meta.value === 'true' || meta.value === '1' ? 'Yes' : 'No'}
                                </span>
                              </div>
                            ) : fieldType === 'textarea' || (metadataDef.key?.toLowerCase().includes('description') || metadataDef.key?.toLowerCase().includes('comment')) ? (
                              <textarea
                                value={meta.value}
                                onChange={(e) => updateMetadataValue(meta.id, e.target.value)}
                                placeholder={placeholder}
                                required={isRequired}
                                rows={3}
                                className={`p-2 border rounded-lg bg-surface text-neutral-text-dark focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                                  isRequired && !meta.value ? 'border-error' : 'border-ui'
                                }`}
                              />
                            ) : (
                              <input
                                type={fieldType}
                                value={meta.value}
                                onChange={(e) => updateMetadataValue(meta.id, e.target.value)}
                                placeholder={placeholder}
                                required={isRequired}
                                className={`p-2 border rounded-lg bg-surface text-neutral-text-dark focus:outline-none focus:ring-2 focus:ring-primary ${
                                  isRequired && !meta.value ? 'border-error' : 'border-ui'
                                }`}
                              />
                            )}
                            
                            {isRequired && !meta.value && (
                              <span className="text-xs text-error">This field is required</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  {/* Required fields validation info */}
                  {selectedFilingCategoryId && (() => {
                    const category = availableFilingCategories.find(cat => cat.id === selectedFilingCategoryId);
                    const requiredFields = category?.metadataDefinitions.filter(def => def.mandatory) || [];
                    const missingRequired = requiredFields.filter(field => {
                      const metadata = editingMetadata.find(meta => meta.id === field.id);
                      return !metadata || !metadata.value.trim();
                    });
                    
                    if (requiredFields.length > 0) {
                      return (
                        <div className="text-xs text-neutral-text-light bg-neutral-background p-2 rounded">
                          <span className="font-medium">Required fields:</span> {requiredFields.length - missingRequired.length} of {requiredFields.length} completed
                          {missingRequired.length > 0 && (
                            <span className="text-error ml-1">({missingRequired.length} missing)</span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelFilingCategoryEdit}
                      disabled={isUpdatingFilingCategory}
                      className="px-4 py-2 text-neutral-text-light hover:text-neutral-text-dark disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveFilingCategory}
                      disabled={!selectedFilingCategoryId || isUpdatingFilingCategory || !validateRequiredFields()}
                      className="px-4 py-2 bg-primary text-surface rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isUpdatingFilingCategory ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-surface"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-4">
                {document.filingCategory ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-primary-light rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FolderOpen className="h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">{document.filingCategory.name}</span>
                      </div>
                      {document.filingCategory.description && (
                        <p className="text-sm text-neutral-text-light">{document.filingCategory.description}</p>
                      )}
                    </div>
                    
                    {document.filingCategory.metadata && document.filingCategory.metadata.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-text-dark mb-2">Metadata</h4>
                        <div className="space-y-2">
                          {document.filingCategory.metadata.map((meta: any) => (
                            <div key={meta.metadataId} className="flex justify-between items-center p-2 bg-neutral-background rounded">
                              <span className="text-sm text-neutral-text-light">{meta.metadataName}:</span>
                              <span className="text-sm text-neutral-text-dark font-medium">{meta.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-neutral-text-light">
                    <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No filing category assigned</p>
                    <p className="text-xs">Click edit to assign a category and metadata</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Tags Section */}
      <div className="border border-ui rounded-lg">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-background transition-colors"
          onClick={() => toggleSection('tags')}
        >
          <div className="flex items-center gap-3">
            {expandedSections.has('tags') ? (
              <ChevronDown className="h-4 w-4 text-neutral-text-light" />
            ) : (
              <ChevronRight className="h-4 w-4 text-neutral-text-light" />
            )}
            <Tag className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium text-neutral-text-dark">Document Tags</h3>
              <p className="text-sm text-neutral-text-light">
                {editingTags.length} tag{editingTags.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {expandedSections.has('tags') && (
          <div className="px-4 pb-4 border-t border-ui">
            <div className="pt-4">
              <div className="flex flex-wrap gap-2">
                {editingTags.map((tag, index) => (
                  <div key={index} className="flex items-center gap-1 px-3 py-1 bg-primary-light text-primary rounded-full text-sm">
                    <span>{tag}</span>
                    {document.userPermissions?.canEdit && (
                      <button
                        onClick={() => removeTag(index)}
                        className="ml-1 text-primary hover:text-primary-dark"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                {document.userPermissions?.canEdit && (
                  <div className="flex items-center gap-1">
                    {isAddingTag ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addTag();
                            if (e.key === 'Escape') {
                              setNewTag('');
                              setIsAddingTag(false);
                            }
                          }}
                          className="px-2 py-1 text-sm border border-ui rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Add tag..."
                          autoFocus
                        />
                        <button
                          onClick={addTag}
                          className="p-1 text-success hover:bg-success/10 rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            setNewTag('');
                            setIsAddingTag(false);
                          }}
                          className="p-1 text-error hover:bg-error/10 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAddingTag(true)}
                        className="px-3 py-1 border border-dashed border-ui text-neutral-text-light rounded-full text-sm hover:bg-neutral-background transition-colors"
                      >
                        + Add Tag
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document Properties Section */}
      <div className="border border-ui rounded-lg">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-background transition-colors"
          onClick={() => toggleSection('properties')}
        >
          <div className="flex items-center gap-3">
            {expandedSections.has('properties') ? (
              <ChevronDown className="h-4 w-4 text-neutral-text-light" />
            ) : (
              <ChevronRight className="h-4 w-4 text-neutral-text-light" />
            )}
            <Info className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium text-neutral-text-dark">Document Properties</h3>
              <p className="text-sm text-neutral-text-light">Basic document information</p>
            </div>
          </div>
        </div>

        {expandedSections.has('properties') && (
          <div className="px-4 pb-4 border-t border-ui">
            <div className="pt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-text-light">Created:</span>
                <span className="text-neutral-text-dark">{formatDate(document.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-text-light">Modified:</span>
                <span className="text-neutral-text-dark">{formatDate(document.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-text-light">Owner:</span>
                <span className="text-neutral-text-dark">{document.ownedBy.firstName} {document.ownedBy.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-text-light">Created By:</span>
                <span className="text-neutral-text-dark">{document.createdBy.firstName} {document.createdBy.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-text-light">Path:</span>
                <span className="text-neutral-text-dark truncate max-w-[150px]">{document.path}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related Documents Section */}
      <div className="border border-ui rounded-lg">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-background transition-colors"
          onClick={() => toggleSection('related')}
        >
          <div className="flex items-center gap-3">
            {expandedSections.has('related') ? (
              <ChevronDown className="h-4 w-4 text-neutral-text-light" />
            ) : (
              <ChevronRight className="h-4 w-4 text-neutral-text-light" />
            )}
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium text-neutral-text-dark">Related Documents</h3>
              <p className="text-sm text-neutral-text-light">
                {document.relatedDocuments?.length || 0} related document{(document.relatedDocuments?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {expandedSections.has('related') && (
          <div className="px-4 pb-4 border-t border-ui">
            <div className="pt-4">
              {document.relatedDocuments && document.relatedDocuments.length > 0 ? (
                <div className="space-y-3">
                  {document.relatedDocuments.map((related) => (
                    <div key={related.documentId} className="p-3 border border-ui rounded-lg hover:bg-neutral-background cursor-pointer transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-neutral-text-dark mb-1">{related.name}</div>
                          <div className="text-xs text-neutral-text-light mb-2">{related.reason}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div className="w-16 h-2 bg-neutral-ui rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all duration-300"
                                  style={{ width: `${related.similarity * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-neutral-text-light">
                                {(related.similarity * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className="p-1 text-neutral-text-light hover:text-neutral-text-dark">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-text-light">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No related documents found</p>
                  <p className="text-xs">Similar documents will appear here based on content analysis</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
