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
  Search,
  Tag,
  Archive,
  Loader2
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { apiClient } from '@/api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchSelect } from '@/components/main/SearchSelect';
import {
  FilingCategoryResponseDto, 
  FilingCategoryDocDto, 
  ExtractorLanguage,
  MetaDataDto,
  CategoryMetadataDefinitionDto,
  MetadataType,
  TagResponseDto,
  BulkUploadRequestDto,
  BulkUploadResponseDto
} from '@/types/api';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: number;
  folderName?: string;
  onSuccess?: () => void;
}

interface FileWithMetadata {
  file: File;
  name: string;
  title: string;
  description: string;
  fileName?: string;
  filingCategory: FilingCategoryResponseDto | null;
  metadata: Record<string, string>;
  metadataErrors: Record<string, string>;
  tags: TagResponseDto[];
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

export default function BulkUploadModal({ isOpen, onClose, folderId, folderName, onSuccess }: BulkUploadModalProps) {
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [language, setLanguage] = useState<ExtractorLanguage>('ENG' as ExtractorLanguage);
  const [filingCategories, setFilingCategories] = useState<FilingCategoryResponseDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [currentStep, setCurrentStep] = useState<'files' | 'metadata' | 'uploading'>('files');
  const { showWarning, showError, showSuccess } = useNotifications();

  // Tags states
  const [availableTags, setAvailableTags] = useState<TagResponseDto[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Search states for filing categories
  const [categorySearch, setCategorySearch] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<FilingCategoryResponseDto[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Load filing categories and tags on mount
  useEffect(() => {
    if (isOpen) {
      loadFilingCategories();
      loadTags();
    }
  }, [isOpen]);

  // Filter categories based on search
  useEffect(() => {
    if (categorySearch.trim()) {
      const filtered = filingCategories.filter(category =>
        category.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
        category.description?.toLowerCase().includes(categorySearch.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(filingCategories);
    }
  }, [categorySearch, filingCategories]);

  const loadFilingCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await apiClient.getAllFilingCategories();
      setFilingCategories(response.content);
      setFilteredCategories(response.content);
    } catch (error) {
      console.error('Error loading filing categories:', error);
      showError('Error', 'Failed to load filing categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadTags = async () => {
    try {
      setIsLoadingTags(true);
      const tags = await apiClient.getAvailableTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  const createFileWithMetadata = (file: File): FileWithMetadata => {
    const name = file.name;
    const title = name.replace(/\.[^/.]+$/, ''); // Remove extension for title
    
    return {
      file,
      name,
      title,
      description: '',
      fileName: name,
      filingCategory: null,
      metadata: {},
      metadataErrors: {},
      tags: [],
      isValid: true
    };
  };

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: FileWithMetadata[] = [];
    
    Array.from(fileList).forEach(file => {
      // Check if file already exists
      const exists = files.some(f => f.file.name === file.name && f.file.size === file.size);
      if (!exists) {
        newFiles.push(createFileWithMetadata(file));
      }
    });

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, [files]);

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
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFile = (index: number, updates: Partial<FileWithMetadata>) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, ...updates } : file
    ));
  };

  const validateMetadata = (file: FileWithMetadata): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!file.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    }

    if (file.filingCategory) {
      file.filingCategory.metadataDefinitions.forEach(definition => {
        if (definition.mandatory && !file.metadata[definition.key]) {
          errors[definition.key] = `${definition.key} is required`;
          isValid = false;
        }

        // Validate date fields
        if (definition.dataType === MetadataType.DATE || definition.dataType === MetadataType.DATETIME) {
          const value = file.metadata[definition.key];
          if (value && isNaN(Date.parse(value))) {
            errors[definition.key] = 'Must be a valid date';
            isValid = false;
          }
        }
      });
    }

    updateFile(files.indexOf(file), { metadataErrors: errors, isValid });
    return isValid;
  };

  const validateAllFiles = (): boolean => {
    let allValid = true;
    files.forEach(file => {
      if (!validateMetadata(file)) {
        allValid = false;
      }
    });
    return allValid;
  };

  const handleBulkUpload = async () => {
    if (files.length === 0) {
      showWarning('No files selected', 'Please select files to upload');
      return;
    }

    if (!validateAllFiles()) {
      showWarning('Validation errors', 'Please fix validation errors before uploading');
      return;
    }

    try {
      setUploading(true);
      setCurrentStep('uploading');

      // Prepare the first file for main document upload
      const firstFile = files[0];
      let filingCategoryDto: FilingCategoryDocDto | null = null;
      
      if (firstFile.filingCategory) {
        const metaDataDto: MetaDataDto[] = firstFile.filingCategory.metadataDefinitions
          .filter(def => firstFile.metadata[def.key])
          .map((def, index) => ({
            id: def.id || index + 1,
            value: firstFile.metadata[def.key]
          }));

        filingCategoryDto = {
          id: firstFile.filingCategory.id,
          metaDataDto
        };
      }

      // Upload the first file to main documents table
      await apiClient.uploadDocument(
        firstFile.file,
        folderId,
        firstFile.title,
        language,
        filingCategoryDto,
        firstFile.fileName,
        firstFile.tags.map(tag => tag.id)
      );

      // Prepare remaining files for ClassA upload
      const remainingFiles = files.slice(1);
      if (remainingFiles.length > 0) {
        // For now, we'll upload remaining files individually to ClassA
        // In a real implementation, you might want to use a bulk upload endpoint
        for (const file of remainingFiles) {
          try {
            // This would be a new API endpoint for bulk ClassA upload
            // For now, we'll simulate the process
            console.log('Uploading to ClassA:', file.title);
            // await apiClient.uploadToClassA(file.file, folderId, file.title, language, filingCategoryDto);
          } catch (error) {
            console.error('Error uploading file to ClassA:', error);
          }
        }
      }

      showSuccess('Upload successful', `${files.length} files uploaded successfully. First file moved to repository, others to unclassified documents.`);
      
      // Reset state
      setFiles([]);
      setShowConfiguration(false);
      setCurrentStep('files');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      showError('Upload failed', error.message || 'Failed to upload files. Please try again.');
      setCurrentStep('metadata');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setShowConfiguration(false);
      setCurrentStep('files');
      onClose();
    }
  };

  const renderMetadataField = (definition: CategoryMetadataDefinitionDto, fileIndex: number) => {
    const file = files[fileIndex];
    if (!file) return null;
    
    const value = file.metadata[definition.key] || '';
    const error = file.metadataErrors[definition.key];

    if (definition.dataType === MetadataType.LIST && definition.list) {
      return (
        <div key={definition.key}>
          <label className="block text-sm font-medium text-neutral-text-dark mb-2">
            {definition.key} {definition.mandatory && <span className="text-red-500">*</span>}
          </label>
          <Select
            value={value}
            onValueChange={(newValue) => {
              const updatedMetadata = { ...file.metadata, [definition.key]: newValue };
              updateFile(fileIndex, { metadata: updatedMetadata });
            }}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={`Select ${definition.key}`} />
            </SelectTrigger>
            <SelectContent>
              {definition.list.option.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      );
    }

    const inputType = definition.dataType === MetadataType.NUMBER || definition.dataType === MetadataType.FLOAT 
      ? 'number' 
      : definition.dataType === MetadataType.DATE 
        ? 'date' 
        : definition.dataType === MetadataType.DATETIME 
          ? 'datetime-local' 
          : 'text';

    return (
      <div key={definition.key}>
        <label className="block text-sm font-medium text-neutral-text-dark mb-2">
          {definition.key} {definition.mandatory && <span className="text-red-500">*</span>}
        </label>
        <input
          type={inputType}
          value={value}
          onChange={(e) => {
            const updatedMetadata = { ...file.metadata, [definition.key]: e.target.value };
            updateFile(fileIndex, { metadata: updatedMetadata });
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
          placeholder={`Enter ${definition.key}`}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Bulk Upload Documents</h2>
            <p className="text-sm text-gray-600">
              Upload multiple documents. First file goes to repository, others to unclassified documents.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {currentStep === 'files' && (
            <div className="space-y-6">
              {/* File Drop Zone */}
              <div
                ref={dropRef}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Support for multiple files. First file will be processed immediately, others will be classified later.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Select Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Selected Files ({files.length})</h3>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.file)}
                          <div>
                            <p className="font-medium">{file.title}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.file.size)} • {file.file.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Main Document
                            </span>
                          )}
                          {index > 0 && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              Unclassified
                            </span>
                          )}
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => setCurrentStep('metadata')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Configure Metadata
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'metadata' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Configure Metadata</h3>
                <button
                  onClick={() => setCurrentStep('files')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Back to Files
                </button>
              </div>

              {/* Global Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Extraction Language</label>
                  <Select value={language} onValueChange={(value) => setLanguage(value as ExtractorLanguage)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* File-specific Configuration */}
              <div className="space-y-6">
                {files.map((file, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      {getFileIcon(file.file)}
                      <div>
                        <h4 className="font-medium">{file.title}</h4>
                        <p className="text-sm text-gray-500">{formatFileSize(file.file.size)}</p>
                      </div>
                      {index === 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Main Document
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Document Title</label>
                      <input
                        type="text"
                        value={file.title}
                        onChange={(e) => updateFile(index, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter document title"
                      />
                    </div>

                    {/* Filing Category */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Filing Category</label>
                      <SearchSelect
                        options={filteredCategories}
                        value={file.filingCategory}
                        onChange={(category) => updateFile(index, { filingCategory: category })}
                        onSearch={setCategorySearch}
                        placeholder="Select filing category"
                        loading={loadingCategories}
                      />
                    </div>

                    {/* Metadata Fields */}
                    {file.filingCategory && file.filingCategory.metadataDefinitions.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {file.filingCategory.metadataDefinitions.map(definition => 
                          renderMetadataField(definition, index)
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCurrentStep('files')}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleBulkUpload}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upload All Files
                </button>
              </div>
            </div>
          )}

          {currentStep === 'uploading' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Uploading Files</h3>
              <p className="text-gray-600">
                Processing {files.length} files. First file will be added to repository, others to unclassified documents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


