'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Upload, 
  X, 
  File, 
  FileText, 
  Image, 
  Video, 
  Music,
  Folder,
  Check,
  ChevronDown,
  Plus,
  Trash2,
  AlertTriangle,
  Settings,
  Info,
  Search
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationApiClient } from '@/api/notificationClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FilingCategoryResponseDto, 
  FilingCategoryDocDto, 
  ExtractorLanguage,
  MetaDataDto,
  CategoryMetadataDefinitionDto,
  MetadataType
} from '@/types/api';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: number;
  folderName?: string;
  onSuccess?: () => void;
}

interface FileWithMetadata {
  file: File;
  name: string;
  description: string;
  filingCategory: FilingCategoryResponseDto | null;
  metadata: Record<string, string>;
  metadataErrors: Record<string, string>;
  isValid: boolean;
}

const SUPPORTED_LANGUAGES = [
  { value: 'ENG', label: 'English' },
  { value: 'FRA', label: 'French' },
  { value: 'ARA', label: 'Arabic' }
];

const getFileIcon = (file: File) => {
  const type = file.type;
  if (type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
  if (type.startsWith('video/')) return <Video className="h-8 w-8 text-purple-500" />;
  if (type.startsWith('audio/')) return <Music className="h-8 w-8 text-green-500" />;
  if (type.includes('pdf') || type.includes('document')) return <FileText className="h-8 w-8 text-red-500" />;
  return <File className="h-8 w-8 text-gray-500" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function FileUploadModal({ isOpen, onClose, folderId, folderName, onSuccess }: FileUploadModalProps) {
  const [currentFile, setCurrentFile] = useState<FileWithMetadata | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [language, setLanguage] = useState<ExtractorLanguage>('ENG' as ExtractorLanguage);
  const [filingCategories, setFilingCategories] = useState<FilingCategoryResponseDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const { showWarning, showError, showSuccess } = useNotifications();

  // Search states for filing categories
  const [categorySearch, setCategorySearch] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<FilingCategoryResponseDto[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [searchingCategories, setSearchingCategories] = useState(false);
  const categorySearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load filing categories
  useEffect(() => {
  const loadFilingCategories = async () => {
    try {
      setLoadingCategories(true);
        const response = await notificationApiClient.getAllFilingCategories({ size: 100 }, { silent: true });
      setFilingCategories(response.content);
    } catch (error) {
      console.error('Error loading filing categories:', error);
        showError('Failed to load filing categories', 'Please try again later');
    } finally {
      setLoadingCategories(false);
    }
  };

    if (isOpen) {
      loadFilingCategories();
    }
  }, [isOpen]); // Removed showError from dependencies

  // Debounced search function for filing categories
  const performCategorySearch = async (query: string) => {
    if (query.trim().length < 2) return;
    
    try {
      setSearchingCategories(true);
      const response = await notificationApiClient.getAllFilingCategories(
        { size: 100, search: query }, 
        { silent: true }
      );
      setFilingCategories(prev => {
        // Merge with existing categories, avoiding duplicates
        const existingIds = new Set(prev.map(cat => cat.id));
        const newCategories = response.content.filter(cat => !existingIds.has(cat.id));
        return [...prev, ...newCategories];
      });
    } catch (error) {
      console.error('Error searching filing categories:', error);
    } finally {
      setSearchingCategories(false);
    }
  };

  // Filter categories locally
  useEffect(() => {
    const filtered = filingCategories.filter(category => 
      category.name?.toLowerCase().includes(categorySearch.toLowerCase()) ||
      category.description?.toLowerCase().includes(categorySearch.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categorySearch, filingCategories]);

  // Debounced API search for categories
  useEffect(() => {
    // Clear existing timeout
    if (categorySearchTimeoutRef.current) {
      clearTimeout(categorySearchTimeoutRef.current);
    }
    
    // Set new timeout for API search
    if (categorySearch.trim().length >= 2) {
      categorySearchTimeoutRef.current = setTimeout(() => {
        performCategorySearch(categorySearch);
      }, 500);
    }
    
    // Cleanup function
    return () => {
      if (categorySearchTimeoutRef.current) {
        clearTimeout(categorySearchTimeoutRef.current);
      }
    };
  }, [categorySearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.searchable-select-container')) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    if (fileList.length > 0) {
      const file = fileList[0]; // Only take the first file
      setCurrentFile({
      file,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for display name
      description: '',
      filingCategory: null,
        metadata: {},
        metadataErrors: {},
        isValid: false
      });
      setShowConfiguration(true);
    }
  };

  const removeFile = () => {
    setCurrentFile(null);
    setShowConfiguration(false);
  };

  const updateFile = (updates: Partial<FileWithMetadata>) => {
    if (currentFile) {
      setCurrentFile({ ...currentFile, ...updates });
    }
  };

  // Category selection handler
  const onCategorySelect = (category: FilingCategoryResponseDto) => {
    if (!currentFile) return;
    
    updateFile({ 
      filingCategory: category,
      metadata: {},
      metadataErrors: {}
    });
    
    setCategorySearch('');
    setShowCategoryDropdown(false);
  };

  // SearchableSelect component
  const SearchableSelect = useCallback(({ 
    search,
    setSearch, 
    showDropdown, 
    setShowDropdown,
    searching, 
    items, 
    onSelect, 
    placeholder 
  }: any) => (
    <div className="relative searchable-select-container">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-light h-4 w-4" />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          className="w-full pl-10 pr-4 py-2 border border-ui rounded-lg text-sm bg-surface text-neutral-text-dark placeholder-neutral-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>
      
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-surface border border-ui rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {items.length > 0 ? (
            items.map((item: FilingCategoryResponseDto) => (
              <button
                key={item.id}
                type="button"
                onClick={(e) => {e.preventDefault();e.stopPropagation(); onSelect(item)}}
                className="w-full px-4 py-2 text-left text-sm text-neutral-text-dark hover:bg-neutral-background focus:bg-neutral-background focus:outline-none"
              >
                <div className="font-medium">{item.name}</div>
                {item.description && (
                  <div className="text-xs text-neutral-text-light">{item.description}</div>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-neutral-text-light text-center">
              No filing categories found
            </div>
          )}
        </div>
      )}
    </div>
  ), []);

  const validateMetadata = (): boolean => {
    if (!currentFile) return false;
    if (!currentFile.filingCategory) return true; // No validation if no category selected

    const errors: Record<string, string> = {};
    let isValid = true;

    currentFile.filingCategory.metadataDefinitions.forEach(definition => {
      if (definition.mandatory && (!currentFile.metadata[definition.key] || currentFile.metadata[definition.key].trim() === '')) {
        errors[definition.key] = 'This field is required';
        isValid = false;
      } else if (definition.dataType === MetadataType.NUMBER) {
        const value = currentFile.metadata[definition.key];
        if (value && isNaN(Number(value))) {
          errors[definition.key] = 'Must be a valid number';
          isValid = false;
        }
      } else if (definition.dataType === MetadataType.DATE) {
        const value = currentFile.metadata[definition.key];
        if (value && isNaN(Date.parse(value))) {
          errors[definition.key] = 'Must be a valid date';
          isValid = false;
        }
      }
    });

    updateFile({ metadataErrors: errors, isValid });
    return isValid;
  };

  const handleUpload = async () => {
    if (!currentFile) {
      showWarning('No file selected', 'Please select a file to upload');
      return;
    }

    // Validate the file
    if (!validateMetadata()) {
      showWarning('Validation errors', 'Please fix validation errors before uploading');
      return;
    }

    try {
      setUploading(true);
      
      // Prepare filing category data
        const filingCategoryDto: FilingCategoryDocDto[] = [];
        
      if (currentFile.filingCategory) {
        const metaDataDto: MetaDataDto[] = currentFile.filingCategory.metadataDefinitions
          .filter(def => currentFile.metadata[def.key])
          .map((def, index) => ({
            id: def.id || index + 1,
            value: currentFile.metadata[def.key]
          }));

            filingCategoryDto.push({
          id: currentFile.filingCategory.id,
          metaDataDto
        });
      }

      // Upload the file using the API
      await notificationApiClient.uploadDocument(
        currentFile.file,
          folderId,
          language,
          filingCategoryDto
        );

      // Success
      setCurrentFile(null);
      setShowConfiguration(false);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      showError('Upload failed', error.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setCurrentFile(null);
      setShowConfiguration(false);
      onClose();
    }
  };

  const renderMetadataField = (definition: CategoryMetadataDefinitionDto) => {
    if (!currentFile) return null;
    const value = currentFile.metadata[definition.key] || '';
    const error = currentFile.metadataErrors[definition.key];

    const getInputType = () => {
      switch (definition.dataType) {
        case MetadataType.NUMBER: return 'number';
        case MetadataType.DATE: return 'date';
        case MetadataType.BOOLEAN: return 'checkbox';
        default: return 'text';
      }
    };

    if (definition.dataType === MetadataType.LIST && definition.list) {
      return (
        <div key={definition.key}>
          <label className="block text-sm font-medium text-neutral-text-dark mb-2">
            {definition.key} {definition.mandatory && <span className="text-error">*</span>}
          </label>
          <Select
            value={value}
            onValueChange={(newValue) => {
              if (newValue === "__custom__") {
                // Don't update the value, just show the custom input
                return;
              }
              updateFile({
                metadata: { ...currentFile.metadata, [definition.key]: newValue }
              });
            }}
          >
            <SelectTrigger className={`w-full ${error ? 'border-error' : ''}`}>
              <SelectValue placeholder={`Select ${definition.key}`} />
            </SelectTrigger>
            <SelectContent>
              {definition.list.option.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
              {/* If list is not mandatory, allow custom input */}
              {!definition.list.mandatory && (
                <SelectItem value="__custom__">
                  <div className="flex items-center gap-2">
                    <Plus className="h-3 w-3" />
                    Enter custom value
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          
          {/* Show custom input field if custom option is selected or if value is not in the list */}
          {(!definition.list.mandatory && (value === "__custom__" || (value && !definition.list.option.includes(value)))) && (
            <input
              type="text"
              value={value === "__custom__" ? "" : value}
              placeholder={`Enter custom ${definition.key}`}
              onChange={(e) => updateFile({
                metadata: { ...currentFile.metadata, [definition.key]: e.target.value }
              })}
              className="w-full mt-2 p-2 border border-ui rounded text-sm bg-surface text-neutral-text-dark"
            />
          )}
          
          {error && <p className="text-error text-xs mt-1">{error}</p>}
        </div>
      );
    }

    if (definition.dataType === MetadataType.BOOLEAN) {
      return (
        <div key={definition.key} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => updateFile({
              metadata: { ...currentFile.metadata, [definition.key]: e.target.checked ? 'true' : 'false' }
            })}
            className="rounded border-ui"
          />
          <label className="text-sm text-neutral-text-dark">
            {definition.key} {definition.mandatory && <span className="text-error">*</span>}
          </label>
        </div>
      );
    }

    return (
      <div key={definition.key}>
        <label className="block text-sm font-medium text-neutral-text-dark mb-2">
          {definition.key} {definition.mandatory && <span className="text-error">*</span>}
        </label>
        <input
          type={getInputType()}
          value={value}
          onChange={(e) => updateFile({
            metadata: { ...currentFile.metadata, [definition.key]: e.target.value }
          })}
          className={`w-full p-2 border rounded text-sm bg-surface text-neutral-text-dark ${
            error ? 'border-error' : 'border-ui'
          }`}
          placeholder={`Enter ${definition.key}`}
          required={definition.mandatory}
          step={definition.dataType === MetadataType.NUMBER ? '0.01' : undefined}
        />
        {error && <p className="text-error text-xs mt-1">{error}</p>}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg border border-ui w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-ui">
          <div>
            <h2 className="text-xl font-semibold text-neutral-text-dark">
              Upload Document
            </h2>
            <p className="text-sm text-neutral-text-light">
              {folderName ? `Uploading to: ${folderName}` : `Folder ID: ${folderId}`}
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-neutral-background transition-colors text-neutral-text-light"
            disabled={uploading}
          >
            <X className="h-5 w-5" />
          </button>
          </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* File Drop Area - Only show when no file is selected */}
            {!currentFile && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary-light' : 'border-ui'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
                <Upload className="mx-auto h-12 w-12 text-neutral-text-light mb-4" />
                <p className="text-lg font-medium text-neutral-text-dark mb-2">
                  Drop a file here or click to browse
                </p>
                <p className="text-neutral-text-light mb-4">
                  Upload one file at a time
                </p>
            <input
              type="file"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
                  disabled={uploading}
                />
                <label 
                  htmlFor="file-upload" 
                  className="inline-flex items-center gap-2 bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
              </label>
          </div>
            )}

            {/* File Configuration */}
            {currentFile && (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-neutral-text-dark flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    File Configuration
                  </h3>
                  <button 
                    onClick={removeFile}
                    className="p-2 text-error hover:bg-error/10 rounded transition-colors"
                    disabled={uploading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="border border-ui rounded-lg overflow-hidden">
                  {/* File Header */}
                  <div className="p-4 bg-neutral-background border-b border-ui">
                    <div className="flex items-center gap-3">
                      {getFileIcon(currentFile.file)}
                      <div>
                        <p className="font-medium text-neutral-text-dark">{currentFile.name}</p>
                        <p className="text-sm text-neutral-text-light">
                          {formatFileSize(currentFile.file.size)} • {currentFile.file.type || 'Unknown type'}
                        </p>
                      </div>
                          </div>
                        </div>

                  {/* Configuration Content */}
                  <div className="p-4 space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                        <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={currentFile.name}
                          onChange={(e) => updateFile({ name: e.target.value })}
                          className="w-full p-2 border border-ui rounded text-sm bg-surface text-neutral-text-dark"
                              disabled={uploading}
                            />
                          </div>
                          
                          <div>
                        <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                          Document Language
                        </label>
                        <select 
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as ExtractorLanguage)}
                          className="w-full p-2 border border-ui rounded text-sm bg-surface text-neutral-text-dark"
                          disabled={uploading}
                        >
                          {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </select>
                        </div>

                        <div>
                        <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                          Filing Category <span className="text-error">*</span>
                        </label>
                        {currentFile.filingCategory ? (
                          <div className="flex items-center gap-2 p-2 border border-ui rounded-lg bg-neutral-background">
                            <div className="flex-1">
                              <div className="font-medium text-neutral-text-dark">{currentFile.filingCategory.name}</div>
                              {currentFile.filingCategory.description && (
                                <div className="text-xs text-neutral-text-light">{currentFile.filingCategory.description}</div>
                              )}
                              <div className="text-xs text-neutral-text-light mt-1">
                                {currentFile.filingCategory.metadataDefinitions.length} metadata field{currentFile.filingCategory.metadataDefinitions.length !== 1 ? 's' : ''}
                              </div>
                        </div>
                            <button
                              type="button"
                              onClick={() => updateFile({ filingCategory: null, metadata: {}, metadataErrors: {} })}
                              className="p-1 text-error hover:bg-error/10 rounded transition-colors"
                              disabled={uploading}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <SearchableSelect
                            search={categorySearch}
                            setSearch={setCategorySearch}
                            showDropdown={showCategoryDropdown}
                            setShowDropdown={setShowCategoryDropdown}
                            searching={searchingCategories}
                            items={filteredCategories}
                            onSelect={onCategorySelect}
                            placeholder="Search filing categories..."
                          />
                        )}
                        {!currentFile.filingCategory && (
                          <p className="text-warning text-xs mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Please select a filing category
                          </p>
                        )}
                      </div>
                          </div>
                          
                    <div>
                      <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                        Description
                      </label>
                      <textarea
                        value={currentFile.description}
                        onChange={(e) => updateFile({ description: e.target.value })}
                        className="w-full p-2 border border-ui rounded text-sm bg-surface text-neutral-text-dark resize-none"
                        placeholder="Optional description"
                        rows={2}
                                    disabled={uploading}
                                  />
                                </div>

                    {/* Metadata Fields */}
                    {currentFile.filingCategory && (
                      <div className="border-t border-ui pt-4">
                        <h4 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {currentFile.filingCategory.name} Metadata
                          <span className="text-xs text-neutral-text-light">
                            ({currentFile.filingCategory.metadataDefinitions.filter(d => d.mandatory).length} required)
                          </span>
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentFile.filingCategory.metadataDefinitions.map(definition =>
                            renderMetadataField(definition)
                          )}
                        </div>
                      </div>
                    )}
                      </div>
                    </div>
            </div>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-ui bg-neutral-background">
          <div className="text-sm text-neutral-text-light">
            {currentFile ? '1 file selected' : 'No file selected'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-ui rounded-lg text-neutral-text-dark hover:bg-surface transition-colors disabled:opacity-50"
              disabled={uploading}
            >
            Cancel
            </button>
            <button
            onClick={handleUpload} 
              disabled={!currentFile || uploading}
              className="flex items-center gap-2 bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-surface border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload File
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}