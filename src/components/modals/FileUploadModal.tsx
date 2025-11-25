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
  Tag
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationApiClient } from '@/api/notificationClient';
import { tagService } from '@/api/services/tagService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchSelect } from '@/components/main/SearchSelect';
import {
  FilingCategoryResponseDto,
  FilingCategoryDocDto,
  ExtractorLanguage,
  MetaDataDto,
  CategoryMetadataDefinitionDto,
  MetadataType,
  TagResponseDto
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

export default function FileUploadModal({ isOpen, onClose, folderId, folderName, onSuccess }: FileUploadModalProps) {
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, fileName: '' });
  const [language, setLanguage] = useState<ExtractorLanguage>('ENG' as ExtractorLanguage);
  const [filingCategories, setFilingCategories] = useState<FilingCategoryResponseDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const { showWarning, showError, showSuccess } = useNotifications();

  // Tags states
  const [availableTags, setAvailableTags] = useState<TagResponseDto[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load filing categories and tags
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

    const loadAvailableTags = async () => {
      try {
        setIsLoadingTags(true);
        const tags = await tagService.getAvailableTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Error loading available tags:', error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    if (isOpen) {
      loadFilingCategories();
      loadAvailableTags();
    }
  }, [isOpen]);

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
      const newFiles: FileWithMetadata[] = Array.from(fileList).map(file => ({
        file,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for display name
        title: file.name.replace(/\.[^/.]+$/, ""), // Default title to filename without extension
        description: '',
        fileName: file.name, // Set fileName to original filename
        filingCategory: null,
        metadata: {},
        metadataErrors: {},
        tags: [],
        isValid: false
      }));

      setFiles(prev => [...prev, ...newFiles]);
      setCurrentFileIndex(0); // Start with the first file
      setShowConfiguration(true);
    }
  };

  const removeFile = (index?: number) => {
    const targetIndex = index !== undefined ? index : currentFileIndex;
    setFiles(prev => prev.filter((_, i) => i !== targetIndex));

    if (files.length <= 1) {
      setShowConfiguration(false);
      setCurrentFileIndex(0);
    } else if (currentFileIndex >= files.length - 1) {
      setCurrentFileIndex(Math.max(0, files.length - 2));
    }
  };

  const setAsMain = (index: number) => {
    if (index === 0) return; // Already main

    setFiles(prev => {
      const newFiles = [...prev];
      const mainFile = newFiles[0];
      const targetFile = newFiles[index];

      // Swap the files
      newFiles[0] = targetFile;
      newFiles[index] = mainFile;

      return newFiles;
    });

    setCurrentFileIndex(0); // Always show main file configuration
  };

  const getCurrentFile = () => files[currentFileIndex] || null;

  const updateCurrentFile = (updates: Partial<FileWithMetadata>) => {
    if (files[currentFileIndex]) {
      setFiles(prev => prev.map((file, index) =>
        index === currentFileIndex ? { ...file, ...updates } : file
      ));
    }
  };

  const updateFile = (updates: Partial<FileWithMetadata>) => {
    setFiles(prev => prev.map((file, index) =>
      index === 0 ? { ...file, ...updates } : file
    ));
  };

  // Category selection handler
  const onCategorySelect = (category: FilingCategoryResponseDto) => {
    updateFile({
      filingCategory: category,
      metadata: {},
      metadataErrors: {}
    });
  };

  // Tag selection handler
  const handleTagSelect = (tag: TagResponseDto) => {
    const mainFile = files[0];
    if (!mainFile) return;

    // Check if tag is already added
    if (mainFile.tags.some(t => t.id === tag.id)) {
      showWarning('Tag already added', 'This tag is already added to the document');
      return;
    }

    updateFile({
      tags: [...mainFile.tags, tag]
    });
  };

  // Tag removal handler
  const handleTagRemove = (tagId: number) => {
    const mainFile = files[0];
    if (!mainFile) return;

    updateFile({
      tags: mainFile.tags.filter(tag => tag.id !== tagId)
    });
  };

  // Create new tag handler
  const handleCreateTag = async (tagData: { name: string; description?: string; color?: string }) => {
    try {
      const newTag = await tagService.createTag(tagData);

      // Add the new tag to available tags
      setAvailableTags(prev => [...prev, newTag]);

      // Add the new tag to the current file
      const mainFile = files[0];
      if (mainFile) {
        updateFile({
          tags: [...mainFile.tags, newTag]
        });
      }

      showSuccess('Tag created', `Tag "${newTag.name}" created and added successfully`);
    } catch (error) {
      console.error('Error creating tag:', error);
      showError('Failed to create tag', 'Please try again');
    }
  };

  const validateMetadata = (): boolean => {
    const mainFile = files[0];
    if (!mainFile) return false;

    // Title is required
    if (!mainFile.title || mainFile.title.trim() === '') {
      updateFile({ isValid: false });
      return false;
    }
    if (!mainFile.filingCategory) return true; // No validation if no category selected

    const errors: Record<string, string> = {};
    let isValid = true;

    if (mainFile.filingCategory.metadataDefinitions) {
      mainFile.filingCategory.metadataDefinitions.forEach(definition => {
        if (definition.mandatory && (!mainFile.metadata[definition.key] || mainFile.metadata[definition.key].trim() === '')) {
          errors[definition.key] = 'This field is required';
          isValid = false;
        } else if (definition.dataType === MetadataType.NUMBER) {
          const value = mainFile.metadata[definition.key];
          if (value && isNaN(Number(value))) {
            errors[definition.key] = 'Must be a valid number';
            isValid = false;
          }
        } else if (definition.dataType === MetadataType.DATE) {
          const value = mainFile.metadata[definition.key];
          if (value && isNaN(Date.parse(value))) {
            errors[definition.key] = 'Must be a valid date';
            isValid = false;
          }
        }
      });
    }

    updateFile({ metadataErrors: errors, isValid });
    return isValid;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      showWarning('No files selected', 'Please select files to upload');
      return;
    }

    // Validate the main file (first file)
    if (!validateMetadata()) {
      showWarning('Validation errors', 'Please fix validation errors for the main document before uploading');
      return;
    }

    try {
      setUploading(true);

      const mainFile = files[0];
      const hasCategory = mainFile.filingCategory !== null;
      const totalFiles = files.length;
      let successCount = 0;
      const filesToRemove: number[] = []; // Track indices of successfully uploaded files

      // Prepare filing category DTO with metadata if category is selected
      const filingCategoryDto = mainFile.filingCategory ? {
        id: mainFile.filingCategory.id,
        metaDataDto: mainFile.filingCategory.metadataDefinitions
          ?.filter(def => mainFile.metadata[def.key])
          .map((def, index) => ({
            id: def.id || index + 1,
            value: mainFile.metadata[def.key]
          })) || []
      } : null;

      if (hasCategory) {
        // Scenario 1: User selected a category
        // First file goes to regular upload endpoint
        try {
          setUploadProgress({ current: 1, total: totalFiles, fileName: mainFile.name });
          await notificationApiClient.uploadDocument(
            mainFile.file,
            folderId,
            mainFile.title,
            language,
            filingCategoryDto,
            mainFile.fileName,
            mainFile.tags.map(tag => tag.id)
          );
          filesToRemove.push(0); // Mark first file for removal
          successCount++;
        } catch (error) {
          console.error('Error uploading main file:', error);
          showError('Upload failed', `Failed to upload main file: ${mainFile.name}`);
        }

        // Rest of the files go to unclassified endpoint
        if (files.length > 1) {
          for (let i = 1; i < files.length; i++) {
            const file = files[i];
            try {
              setUploadProgress({ current: i + 1, total: totalFiles, fileName: file.name });
              await notificationApiClient.uploadUnclassifiedDocument(
                file.file,
                folderId,
                mainFile.filingCategory!.id,  // Use same category as main file
                '', // createdBy will be set from token on backend
                file.title || file.name,
                file.fileName
              );
              filesToRemove.push(i); // Mark file for removal
              successCount++;
            } catch (error) {
              console.error(`Error uploading file ${file.name}:`, error);
              showError('Upload failed', `Failed to upload: ${file.name}`);
            }
          }
        }

        if (successCount > 0) {
          showSuccess(
            'Upload successful',
            successCount === 1
              ? 'Document uploaded successfully to repository'
              : `${successCount} file${successCount !== 1 ? 's' : ''} uploaded successfully`
          );
        }
      } else {
        // Scenario 2: No category selected
        // All files go to regular upload endpoint sequentially (without category/metadata)
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            setUploadProgress({ current: i + 1, total: totalFiles, fileName: file.name });
            await notificationApiClient.uploadDocument(
              file.file,
              folderId,
              file.title || file.name,
              language,
              null, // No category
              file.fileName,
              i === 0 ? mainFile.tags.map(tag => tag.id) : [] // Only first file gets tags
            );
            filesToRemove.push(i); // Mark file for removal
            successCount++;
          } catch (error) {
            console.error(`Error uploading file ${file.name}:`, error);
            showError('Upload failed', `Failed to upload: ${file.name}`);
          }
        }

        if (successCount > 0) {
          showSuccess(
            'Upload successful',
            `${successCount} file${successCount !== 1 ? 's' : ''} uploaded successfully to repository`
          );
        }
      }

      // Remove successfully uploaded files
      if (filesToRemove.length > 0) {
        setFiles(prevFiles => prevFiles.filter((_, index) => !filesToRemove.includes(index)));
        setCurrentFileIndex(0);

        // If all files uploaded successfully, close the modal
        if (filesToRemove.length === totalFiles) {
          setShowConfiguration(false);
          onSuccess?.();
          onClose();
        }
      }

      setUploadProgress({ current: 0, total: 0, fileName: '' });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      showError('Upload failed', error.message || 'Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0, fileName: '' });
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setCurrentFileIndex(0);
      setShowConfiguration(false);
      onClose();
    }
  };

  const renderMetadataField = (definition: CategoryMetadataDefinitionDto) => {
    const mainFile = files[0];
    if (!mainFile) return null;
    const value = mainFile.metadata[definition.key] || '';
    const error = mainFile.metadataErrors[definition.key];

    const getInputType = () => {
      switch (definition.dataType) {
        case MetadataType.NUMBER: return 'number';
        case MetadataType.FLOAT: return 'number';
        case MetadataType.DATE: return 'date';
        case MetadataType.DATETIME: return 'datetime-local';
        case MetadataType.BOOLEAN: return 'checkbox';
        case MetadataType.STRING: return 'text';
        default: return 'text';
      }
    };

    if (definition.dataType === MetadataType.LIST && definition.list) {
      const allowCustomValue = definition.list.mandatory ?? false;
      const isCustomValue = value && definition.list.option && !definition.list.option.includes(value);
      const showCustomInput = isCustomValue || value === "__custom__";

      return (
        <div key={definition.key}>
          <label className="block text-sm font-medium text-neutral-text-dark mb-2">
            {definition.key} {definition.mandatory && <span className="text-error">*</span>}
          </label>
          <Select
            value={showCustomInput ? "__custom__" : value}
            onValueChange={(newValue) => {
              if (newValue === "__custom__") {
                updateFile({
                  metadata: { ...mainFile.metadata, [definition.key]: "__custom__" }
                });
                return;
              }
              updateFile({
                metadata: { ...mainFile.metadata, [definition.key]: newValue }
              });
            }}
          >
            <SelectTrigger className={`w-full ${error ? 'border-error' : ''}`}>
              <SelectValue placeholder={`Select ${definition.key}`} />
            </SelectTrigger>
            <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
              {(definition.list.option || []).map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
              {allowCustomValue && (
                <SelectItem value="__custom__">
                  <div className="flex items-center gap-2">
                    <Plus className="h-3 w-3" />
                    Enter custom value
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {showCustomInput && (
            <input
              type="text"
              value={value === "__custom__" ? "" : value}
              placeholder={`Enter custom ${definition.key}`}
              onChange={(e) => updateFile({
                metadata: { ...mainFile.metadata, [definition.key]: e.target.value }
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
              metadata: { ...mainFile.metadata, [definition.key]: e.target.checked ? 'true' : 'false' }
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
            metadata: { ...mainFile.metadata, [definition.key]: e.target.value }
          })}
          className={`w-full p-2 border rounded text-sm bg-surface text-neutral-text-dark ${error ? 'border-error' : 'border-ui'
            }`}
          placeholder={`Enter ${definition.key}`}
          required={definition.mandatory}
          step={definition.dataType === MetadataType.NUMBER ? '1' : definition.dataType === MetadataType.FLOAT ? 'any' : undefined}
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
            {files.length === 0 && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary-light' : 'border-ui'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-neutral-text-light mb-4" />
                <p className="text-lg font-medium text-neutral-text-dark mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-neutral-text-light mb-4">
                  Upload multiple files. If category is selected: first file goes to repository, rest to unclassified. Without category: all go to repository.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
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
                  Choose Files
                </label>
              </div>
            )}

            {/* File Configuration */}
            {files.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-neutral-text-dark flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    File Configuration ({files.length} files)
                  </h3>
                  <button
                    onClick={() => removeFile(currentFileIndex)}
                    className="p-2 text-error hover:bg-error/10 rounded transition-colors"
                    disabled={uploading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* File List - Vertical Layout */}
                {files.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-600">Files ({files.length}):</span>
                      <button
                        onClick={() => {
                          // Create a new file input element
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = true;
                          input.style.display = 'none';

                          input.onchange = (e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.files) {
                              handleFiles(target.files);
                            }
                          };

                          document.body.appendChild(input);
                          input.click();
                          document.body.removeChild(input);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        disabled={uploading}
                      >
                        <Plus className="h-3 w-3" />
                        Add More
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {files.map((file, index) => {
                        const isUploading = uploading && uploadProgress.current === index + 1;
                        const isUploaded = uploading && uploadProgress.current > index + 1;

                        return (
                          <div
                            key={index}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded border text-sm transition-all ${isUploading
                              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                              : isUploaded
                                ? 'bg-green-50 border-green-200 opacity-60'
                                : index === 0
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-white border-gray-300'
                              }`}
                          >
                            {isUploading ? (
                              <div className="h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : isUploaded ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              getFileIcon(file.file)
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate text-xs">
                                {file.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatFileSize(file.file.size)}
                                {isUploading && <span className="ml-1 text-blue-600">- Uploading...</span>}
                                {isUploaded && <span className="ml-1 text-green-600">- ✓ Done</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {index === 0 ? (
                                <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                  Main
                                </span>
                              ) : (
                                <button
                                  onClick={() => setAsMain(index)}
                                  className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                  disabled={uploading}
                                >
                                  Set Main
                                </button>
                              )}

                              <button
                                onClick={() => removeFile(index)}
                                className="p-0.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                disabled={uploading}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="border border-ui rounded-lg overflow-hidden">
                  {/* File Header */}
                  <div className="p-4 bg-neutral-background border-b border-ui">
                    <div className="flex items-center gap-3">
                      {getFileIcon(files[0]?.file || ({} as File))}
                      <div>
                        <p className="font-medium text-neutral-text-dark">{files[0]?.name}</p>
                        <p className="text-sm text-neutral-text-light">
                          {formatFileSize(files[0]?.file.size || 0)} • {files[0]?.file.type || 'Unknown type'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            Main File
                          </span>
                          <span className="text-xs text-gray-500">
                            {files[0]?.filingCategory
                              ? `→ Repository${files.length > 1 ? ` (${files.length - 1} others → Unclassified)` : ''}`
                              : `→ Repository${files.length > 1 ? ` (all ${files.length} files)` : ''}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Configuration Content */}
                  <div className="p-4 space-y-4">
                    {/* Basic fields - available for all files */}
                    <div className="border-t border-ui pt-4">
                      <h4 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Main File Configuration
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                          Main File
                        </span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={files[0]?.name || ''}
                            onChange={(e) => updateFile({ name: e.target.value })}
                            className="w-full p-2 border border-ui rounded text-sm bg-surface text-neutral-text-dark"
                            disabled={uploading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                            Title <span className="text-error">*</span>
                          </label>
                          <input
                            type="text"
                            value={files[0]?.title || ''}
                            onChange={(e) => updateFile({ title: e.target.value })}
                            className="w-full p-2 border border-ui rounded text-sm bg-surface text-neutral-text-dark"
                            placeholder="Enter document title"
                            disabled={uploading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                            File Name (Optional)
                          </label>
                          <input
                            type="text"
                            value={files[0]?.fileName || ''}
                            onChange={(e) => updateFile({ fileName: e.target.value })}
                            className="w-full p-2 border border-ui rounded text-sm bg-surface text-neutral-text-dark"
                            placeholder="Enter custom file name"
                            disabled={uploading}
                          />
                          <p className="text-xs text-neutral-text-light mt-1">
                            Leave empty to use original filename
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                            Document Language
                          </label>
                          <Select
                            value={language}
                            onValueChange={(value) => setLanguage(value as ExtractorLanguage)}
                            disabled={uploading}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              {SUPPORTED_LANGUAGES.map(lang => (
                                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                            Description
                          </label>
                          <textarea
                            value={files[0]?.description || ''}
                            onChange={(e) => updateFile({ description: e.target.value })}
                            className="w-full p-2 border border-ui rounded text-sm bg-surface text-neutral-text-dark resize-none"
                            placeholder="Optional description"
                            rows={2}
                            disabled={uploading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Only show advanced features for main file (index 0) */}
                    {currentFileIndex === 0 && (
                      <>
                        {/* Document Model Section */}
                        <div className="border-t border-ui pt-4">
                          <h4 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Document Model
                          </h4>

                          <div>
                            <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                              Document Model
                            </label>
                            {files[0]?.filingCategory ? (
                              <div className="flex items-center gap-2 p-2 border border-ui rounded-lg bg-neutral-background">
                                <div className="flex-1">
                                  <div className="font-medium text-neutral-text-dark">{files[0]?.filingCategory?.name}</div>
                                  {files[0]?.filingCategory?.description && (
                                    <div className="text-xs text-neutral-text-light">{files[0]?.filingCategory?.description}</div>
                                  )}
                                  <div className="text-xs text-neutral-text-light mt-1">
                                    {files[0]?.filingCategory?.metadataDefinitions?.length || 0} metadata field{(files[0]?.filingCategory?.metadataDefinitions?.length || 0) !== 1 ? 's' : ''}
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
                              <SearchSelect
                                items={filingCategories}
                                fetchFunction={async (query: string) => {
                                  const response = await notificationApiClient.getAllFilingCategories(
                                    { size: 100, search: query },
                                    { silent: true }
                                  );
                                  return response.content;
                                }}
                                onSelect={onCategorySelect}
                                placeholder="Search document models..."
                                displayField="name"
                                descriptionField="description"
                              />
                            )}
                          </div>
                        </div>

                        {/* Tags Section */}
                        <div className="border-t border-ui pt-4">
                          <h4 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Tags
                          </h4>

                          {/* Search and Add Tag Interface */}
                          <div className="space-y-2 mb-4">
                            <SearchSelect
                              items={availableTags}
                              fetchFunction={async (query: string) => {
                                const response = await tagService.searchTags(query, 0, 20);
                                return response.content || [];
                              }}
                              onSelect={handleTagSelect}
                              placeholder="Search and select tags..."
                              displayField="name"
                              descriptionField="description"
                              debounceMs={300}
                            />

                            {/* Create New Tag Option */}
                            <div className="text-xs text-neutral-text-light">
                              Can't find the tag you're looking for?{' '}
                              <button
                                onClick={() => setIsCreateTagModalOpen(true)}
                                className="text-primary hover:text-primary-dark underline hover:no-underline transition-colors"
                                disabled={uploading}
                              >
                                Create a new tag
                              </button>
                            </div>
                          </div>

                          {/* Tags Display */}
                          <div className="flex flex-wrap gap-2 min-h-[32px]">
                            {isLoadingTags ? (
                              <div className="text-sm text-neutral-text-light">Loading tags...</div>
                            ) : files[0]?.tags.length ? (
                              files[0]?.tags.map((tag) => (
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
                                  <button
                                    onClick={() => handleTagRemove(tag.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black hover:bg-opacity-10"
                                    style={{ color: tag.color || '#1D4ED8' }}
                                    disabled={uploading}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-neutral-text-light italic">
                                No tags added yet
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Metadata Fields */}
                        {files[0]?.filingCategory && (
                          <div className="border-t border-ui pt-4">
                            <h4 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {files[0]?.filingCategory?.name} Metadata
                              <span className="text-xs text-neutral-text-light">
                                ({(files[0]?.filingCategory?.metadataDefinitions || []).filter(d => d.mandatory).length} required)
                              </span>
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(files[0]?.filingCategory?.metadataDefinitions || []).map(definition =>
                                renderMetadataField(definition)
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-ui bg-neutral-background">
          {/* Upload Progress Bar */}
          {uploading && uploadProgress.total > 0 && (
            <div className="px-6 pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-text-dark font-medium">
                    Uploading file {uploadProgress.current} of {uploadProgress.total}
                  </span>
                  <span className="text-neutral-text-light">
                    {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-neutral-text-light truncate">
                  {uploadProgress.fileName && (
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="truncate">{uploadProgress.fileName}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center p-6">
            <div className="text-sm text-neutral-text-light">
              {files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''} selected` : 'No files selected'}
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
                disabled={files.length === 0 || uploading}
                className="flex items-center gap-2 bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-surface border-t-transparent rounded-full animate-spin"></div>
                    {uploadProgress.current > 0
                      ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}...`
                      : 'Uploading...'
                    }
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload {files.length > 1 ? 'Files' : 'File'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Tag Modal */}
      <CreateTagModal
        isOpen={isCreateTagModalOpen}
        onClose={() => setIsCreateTagModalOpen(false)}
        onCreateTag={handleCreateTag}
      />
    </div>
  );
}

// Simple CreateTagModal component
function CreateTagModal({
  isOpen,
  onClose,
  onCreateTag
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateTag: (data: { name: string; description?: string; color?: string }) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#1D4ED8');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateTag({ name, description, color });
      setName('');
      setDescription('');
      setColor('#1D4ED8');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-surface rounded-lg border border-ui w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-neutral-text-dark mb-4">Create New Tag</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-text-dark mb-1">
              Tag Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-ui rounded text-sm"
              placeholder="e.g., Important, Review"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-text-dark mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-ui rounded text-sm resize-none"
              placeholder="Optional description"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-text-dark mb-1">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {['#1D4ED8', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-neutral-text-dark scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-text-light hover:bg-neutral-background rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-surface rounded hover:bg-primary-dark"
              disabled={!name.trim()}
            >
              Create Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}