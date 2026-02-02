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
  ChevronUp,
  ChevronRight,
  Plus,
  Trash2,
  AlertTriangle,
  Settings,
  Info,
  Search,
  Tag,
  Wand2,
  AlertCircle,
  Edit,
  GripVertical
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
  filingCategory: FilingCategoryResponseDto | null;
  metadata: Record<string, string>;
  metadataErrors: Record<string, string>;
  tags: TagResponseDto[];
  isValid: boolean;
  convertToPdf?: boolean;
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
  const [uploadPercentage, setUploadPercentage] = useState(0); // Byte-based progress percentage
  const [language, setLanguage] = useState<ExtractorLanguage>('ENG' as ExtractorLanguage);
  const [filingCategories, setFilingCategories] = useState<FilingCategoryResponseDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const { showWarning, showError, showSuccess } = useNotifications();

  // Tags states
  const [availableTags, setAvailableTags] = useState<TagResponseDto[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);

  // Metadata extraction from filename states
  const [separator, setSeparator] = useState<string>('#');
  const [autoExtractEnabled, setAutoExtractEnabled] = useState<boolean>(false);
  const [extractionExpanded, setExtractionExpanded] = useState<boolean>(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null);
  const [editingFileName, setEditingFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFetchedRef = useRef<boolean>(false);

  // Load filing categories and tags ONLY ONCE when modal opens
  useEffect(() => {
    // Skip if already fetched for this modal session
    if (hasFetchedRef.current) return;

    const loadFilingCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await notificationApiClient.getAllFilingCategories({ size: 100 }, { silent: true });
        setFilingCategories(response.content);
      } catch (error) {
        console.error('Error loading filing categories:', error);
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
      if (hasFetchedRef.current) {
        console.log('[FileUploadModal] Skipping fetch - already loaded');
        return;
      }
      console.log('[FileUploadModal] Loading categories and tags...');
      hasFetchedRef.current = true;
      loadFilingCategories();
      loadAvailableTags();
    }
  }, [isOpen]);

  // Reset the fetch flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasFetchedRef.current = false;
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
      const newFiles: FileWithMetadata[] = Array.from(fileList).map(file => {
        // Use webkitRelativePath if available (for folder uploads), otherwise fallback to name
        const relativePath = (file as any).webkitRelativePath || file.name;

        return {
          file,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for display name
          title: file.name.replace(/\.[^/.]+$/, ""), // Default title to filename without extension
          description: '',
          fileName: relativePath, // Send full relative path to backend
          filingCategory: null,
          metadata: {},
          metadataErrors: {},
          tags: [],
          isValid: false,
          convertToPdf: false
        };
      });

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

  const moveFileUp = (index: number) => {
    if (index <= 0) return; // Already at top
    setFiles(prev => {
      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      return newFiles;
    });
    if (currentFileIndex === index) setCurrentFileIndex(index - 1);
    else if (currentFileIndex === index - 1) setCurrentFileIndex(index);
  };

  const moveFileDown = (index: number) => {
    if (index >= files.length - 1) return; // Already at bottom
    setFiles(prev => {
      const newFiles = [...prev];
      [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
      return newFiles;
    });
    if (currentFileIndex === index) setCurrentFileIndex(index + 1);
    else if (currentFileIndex === index + 1) setCurrentFileIndex(index);
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
    // Check auto-classification permission
    if (category.autoClassificationEnabled && category.autoClassificationTarget) {
      if (!category.autoClassificationTarget.hasUploadPermission) {
        showError(
          'Access Denied',
          `You don't have permission to upload to the auto-classification target folder: "${category.autoClassificationTarget.folderName}". You cannot use this document model.`
        );
        return;
      }
    }

    // Initialize selected fields with all fields from the category
    const allFields = category.metadataDefinitions?.map(d => d.key) || [];
    setSelectedFields(allFields);

    // When selecting a category, auto-extract if enabled
    if (autoExtractEnabled && files.length > 0) {
      const updatedFiles = files.map((file, index) => {
        const { metadata, errors, isValid } = extractMetadataFromFilename(
          file.file.name,
          category.metadataDefinitions || [],
          allFields
        );
        return index === 0
          ? { ...file, filingCategory: category, metadata, metadataErrors: errors, isValid }
          : file;
      });
      setFiles(updatedFiles);
    } else {
      updateFile({
        filingCategory: category,
        metadata: {},
        metadataErrors: {}
      });
    }
  };

  // Extract metadata from filename based on separator and selected fields
  const extractMetadataFromFilename = (
    filename: string,
    allDefinitions: CategoryMetadataDefinitionDto[],
    fieldsToExtract?: string[]
  ): { metadata: Record<string, string>; errors: Record<string, string>; isValid: boolean } => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const parts = nameWithoutExt.split(separator).map(p => p.trim());

    // Use selected fields in order (important: use the passed order, not filter order)
    const activeFieldKeys = fieldsToExtract || selectedFields;

    const metadata: Record<string, string> = {};
    const errors: Record<string, string> = {};

    // Iterate over activeFieldKeys in order - this preserves the custom order
    activeFieldKeys.forEach((fieldKey, index) => {
      const def = allDefinitions.find(d => d.key === fieldKey);
      if (!def) return;

      const value = parts[index] || '';
      metadata[def.key] = value;

      // Validate based on data type
      if (def.mandatory && !value) {
        errors[def.key] = `Missing from filename (position ${index + 1})`;
      } else if (value) {
        switch (def.dataType) {
          case MetadataType.DATE:
          case MetadataType.DATETIME:
            if (isNaN(Date.parse(value))) {
              errors[def.key] = 'Invalid date format';
            }
            break;
          case MetadataType.NUMBER:
            if (!/^\d+$/.test(value)) {
              errors[def.key] = 'Must be a valid integer';
            }
            break;
          case MetadataType.FLOAT:
            if (isNaN(Number(value))) {
              errors[def.key] = 'Must be a valid number';
            }
            break;
          case MetadataType.BOOLEAN:
            if (value.toLowerCase() !== 'true' && value.toLowerCase() !== 'false') {
              errors[def.key] = 'Must be true or false';
            }
            break;
        }
      }
    });

    return { metadata, errors, isValid: Object.keys(errors).length === 0 };
  };

  // Apply metadata extraction to all files
  const applyExtractionToAllFiles = () => {
    const mainFile = files[0];
    if (!mainFile?.filingCategory?.metadataDefinitions) {
      showWarning('No model selected', 'Please select a document model first');
      return;
    }

    if (selectedFields.length === 0) {
      showWarning('No fields selected', 'Please select at least one field to extract');
      return;
    }

    const allDefinitions = mainFile.filingCategory.metadataDefinitions;
    const updatedFiles = files.map(file => {
      const { metadata, errors, isValid } = extractMetadataFromFilename(
        file.file.name,
        allDefinitions,
        selectedFields
      );
      return { ...file, metadata, metadataErrors: errors, isValid };
    });

    setFiles(updatedFiles);

    const validCount = updatedFiles.filter(f => f.isValid).length;
    const invalidCount = updatedFiles.length - validCount;

    if (invalidCount > 0) {
      showWarning(
        'Extraction complete',
        `${validCount} file(s) valid, ${invalidCount} file(s) have validation errors`
      );
    } else {
      showSuccess('Extraction complete', `All ${validCount} file(s) metadata extracted successfully`);
    }
  };

  // Toggle field selection for extraction
  const toggleFieldSelection = (fieldKey: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey)
        ? prev.filter(k => k !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  // Drag and drop state
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [dragOverField, setDragOverField] = useState<string | null>(null);

  // Drag handlers for field reordering
  const handleFieldDragStart = (e: React.DragEvent, fieldKey: string) => {
    setDraggedField(fieldKey);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fieldKey);
  };

  const handleFieldDragOver = (e: React.DragEvent, fieldKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedField && fieldKey !== draggedField) {
      setDragOverField(fieldKey);
    }
  };

  const handleFieldDragLeave = () => {
    setDragOverField(null);
  };

  const handleFieldDrop = (e: React.DragEvent, targetFieldKey: string) => {
    e.preventDefault();
    if (!draggedField || draggedField === targetFieldKey) {
      setDraggedField(null);
      setDragOverField(null);
      return;
    }

    setSelectedFields(prev => {
      const newOrder = [...prev];
      const draggedIndex = newOrder.indexOf(draggedField);
      const targetIndex = newOrder.indexOf(targetFieldKey);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      // Remove dragged item and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedField);

      return newOrder;
    });

    setDraggedField(null);
    setDragOverField(null);
  };

  const handleFieldDragEnd = () => {
    setDraggedField(null);
    setDragOverField(null);
  };

  // Start editing filename
  const startEditingFileName = (index: number) => {
    setEditingFileIndex(index);
    setEditingFileName(files[index].file.name.replace(/\.[^/.]+$/, ""));
  };

  // Save edited filename
  const saveEditedFileName = (index: number) => {
    if (editingFileName.trim()) {
      const originalExt = files[index].file.name.match(/\.[^/.]+$/)?.[0] || '';
      const newFullName = editingFileName.trim() + originalExt;

      // Create new File object with new name
      const originalFile = files[index].file;
      const FileConstructor = window.File;
      const newFile = new FileConstructor([originalFile], newFullName, { type: originalFile.type });

      setFiles(prev => prev.map((f, i) =>
        i === index
          ? {
            ...f,
            file: newFile,
            name: editingFileName.trim(),
            title: editingFileName.trim()
          }
          : f
      ));
    }
    setEditingFileIndex(null);
    setEditingFileName('');
  };

  // Cancel editing filename
  const cancelEditingFileName = () => {
    setEditingFileIndex(null);
    setEditingFileName('');
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
      setUploadPercentage(0); // Reset byte progress

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
        // Scenario 1: User selected a category - Use BULK UPLOAD with filing category
        if (files.length >= 2) {
          // Use bulk upload for 2+ files with category
          try {
            setUploadProgress({ current: 0, total: totalFiles, fileName: 'Preparing bulk upload with metadata...' });

            // Prepare files array
            const fileArray = files.map(f => f.file);

            // Prepare metadata list with filing category info per file
            const metadataList = files.map((f, index) => {
              const metaDataDtoArray = mainFile.filingCategory?.metadataDefinitions
                ?.filter(def => f.metadata && f.metadata[def.key])
                .map((def, idx) => ({
                  id: def.id || idx + 1,
                  value: f.metadata[def.key]
                })) || [];

              return {
                fileName: f.name,
                title: f.title || f.name,
                filingCategoryId: mainFile.filingCategory?.id,
                metadataJson: metaDataDtoArray.length > 0 ? JSON.stringify(metaDataDtoArray) : undefined,
                tagsJson: index === 0 && mainFile.tags.length > 0
                  ? JSON.stringify(mainFile.tags.map(t => t.id))
                  : undefined,
                convertToPdf: f.convertToPdf
              };
            });

            // Call bulk upload API
            const response = await notificationApiClient.uploadBulkDocuments(
              fileArray,
              folderId,
              language,
              metadataList,
              (current, total, fileName) => {
                setUploadProgress({ current, total, fileName: `Uploading ${fileName}...` });
              },
              (loaded, total, percentage) => {
                setUploadPercentage(percentage);
              }
            );

            successCount = response.successCount;

            // Mark all successful uploads for removal
            response.results.forEach((result, index) => {
              if (result.success) {
                filesToRemove.push(index);
              }
            });

            if (response.failedCount > 0) {
              showWarning(
                'Partial upload',
                `${response.successCount} of ${response.totalFiles} files uploaded. ${response.failedCount} failed.`
              );
            } else {
              showSuccess(
                'Upload successful',
                `${successCount} file${successCount !== 1 ? 's' : ''} uploaded with metadata. OCR processing queued.`
              );
            }

          } catch (error) {
            console.error('Bulk upload with category failed:', error);
            showError('Bulk upload failed', 'Failed to upload files. Please try again.');
          }
        } else {
          // Single file with category - use regular upload
          try {
            setUploadProgress({ current: 1, total: totalFiles, fileName: mainFile.name });
            await notificationApiClient.uploadDocument(
              mainFile.file,
              folderId,
              mainFile.title,
              language,
              filingCategoryDto,
              mainFile.name,
              mainFile.tags.map(tag => tag.id),
              mainFile.convertToPdf
            );
            filesToRemove.push(0);
            successCount++;
            showSuccess('Upload successful', 'Document uploaded successfully with metadata');
          } catch (error) {
            console.error('Error uploading main file:', error);
            showError('Upload failed', `Failed to upload main file: ${mainFile.name}`);
          }
        }
      } else {
        // Scenario 2: No category selected - Use BULK UPLOAD for faster processing
        // This uses RabbitMQ for background OCR processing

        if (files.length >= 2) {
          // Use bulk upload endpoint for 2+ files
          try {
            setUploadProgress({ current: 0, total: totalFiles, fileName: 'Preparing bulk upload...' });

            // Prepare files array
            const fileArray = files.map(f => f.file);

            // Prepare metadata list (titles only since no filing category)
            const metadataList = files.map((f, index) => ({
              fileName: f.name,
              title: f.title || f.name,
              tagsJson: index === 0 && mainFile.tags.length > 0
                ? JSON.stringify(mainFile.tags.map(t => t.id))
                : undefined,
              convertToPdf: f.convertToPdf
            }));

            // Call bulk upload API
            const response = await notificationApiClient.uploadBulkDocuments(
              fileArray,
              folderId,
              language,
              metadataList,
              (current, total, fileName) => {
                setUploadProgress({ current, total, fileName: `Uploading ${fileName}...` });
              },
              (loaded, total, percentage) => {
                setUploadPercentage(percentage);
              }
            );

            successCount = response.successCount;

            // Mark all successful uploads for removal
            response.results.forEach((result, index) => {
              if (result.success) {
                filesToRemove.push(index);
              }
            });

            if (response.failedCount > 0) {
              showWarning(
                'Partial upload',
                `${response.successCount} of ${response.totalFiles} files uploaded. ${response.failedCount} failed.`
              );
            } else {
              showSuccess(
                'Upload successful',
                `${successCount} file${successCount !== 1 ? 's' : ''} uploaded successfully. OCR processing queued.`
              );
            }

          } catch (error) {
            console.error('Bulk upload failed:', error);
            showError('Bulk upload failed', 'Failed to upload files. Please try again.');
          }
        } else {
          // Single file - use regular upload
          const file = files[0];
          try {
            setUploadProgress({ current: 1, total: 1, fileName: file.name });
            await notificationApiClient.uploadDocument(
              file.file,
              folderId,
              file.title || file.name,
              language,
              null,
              file.name,
              mainFile.tags.map(tag => tag.id),
              file.convertToPdf
            );
            filesToRemove.push(0);
            successCount++;
            showSuccess('Upload successful', 'Document uploaded successfully to repository');
          } catch (error) {
            console.error('Error uploading file:', error);
            showError('Upload failed', `Failed to upload: ${file.name}`);
          }
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
                        const hasErrors = Object.keys(file.metadataErrors || {}).length > 0;
                        const isValidFile = file.isValid && !hasErrors;

                        return (
                          <div
                            key={index}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded border text-sm transition-all ${isUploading
                              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                              : isUploaded
                                ? 'bg-green-50 border-green-200 opacity-60'
                                : hasErrors
                                  ? 'bg-red-50 border-red-300'
                                  : index === 0
                                    ? 'bg-green-50 border-green-200'
                                    : isValidFile
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-white border-gray-300'
                              }`}
                          >
                            {isUploading ? (
                              <div className="h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : isUploaded ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : hasErrors ? (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : isValidFile ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              getFileIcon(file.file)
                            )}
                            <div className="flex-1 min-w-0">
                              {editingFileIndex === index ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editingFileName}
                                    onChange={(e) => setEditingFileName(e.target.value)}
                                    className="flex-1 px-1 py-0.5 text-xs border border-blue-400 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEditedFileName(index);
                                      if (e.key === 'Escape') cancelEditingFileName();
                                    }}
                                  />
                                  <button
                                    onClick={() => saveEditedFileName(index)}
                                    className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                                    title="Save"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={cancelEditingFileName}
                                    className="p-0.5 text-gray-500 hover:bg-gray-100 rounded"
                                    title="Cancel"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className={`font-medium truncate text-xs ${hasErrors ? 'text-red-700' : 'text-gray-900'}`}>
                                    {file.name}
                                    {hasErrors && (
                                      <button
                                        onClick={() => startEditingFileName(index)}
                                        className="ml-1 p-0.5 text-blue-500 hover:bg-blue-50 rounded inline-flex items-center"
                                        title="Edit filename"
                                        disabled={uploading}
                                      >
                                        <Edit className="h-2.5 w-2.5" />
                                      </button>
                                    )}
                                    {file.filingCategory?.nameStructure && (
                                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded" title="Filename will be auto-generated based on name structure">
                                        ✨ Auto-name
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatFileSize(file.file.size)}
                                    {isUploading && <span className="ml-1 text-blue-600">- Uploading...</span>}
                                    {isUploaded && <span className="ml-1 text-green-600">- ✓ Done</span>}
                                    {hasErrors && (
                                      <span className="ml-1 text-red-600" title={Object.values(file.metadataErrors || {}).join(', ')}>
                                        - {Object.keys(file.metadataErrors || {}).length} error(s)
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
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

                              {/* Move up/down buttons */}
                              <button
                                onClick={() => moveFileUp(index)}
                                className="p-0.5 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                                disabled={uploading || index === 0}
                                title="Move up"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => moveFileDown(index)}
                                className="p-0.5 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                                disabled={uploading || index === files.length - 1}
                                title="Move down"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>

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
                            {files[0]?.filingCategory?.nameStructure && (
                              <span className="ml-2 text-xs text-purple-600 font-normal">(Auto-generated)</span>
                            )}
                          </label>
                          {files[0]?.filingCategory?.nameStructure ? (
                            <div className="w-full p-2 border border-purple-300 rounded text-sm bg-purple-50 text-purple-700">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-purple-500">Pattern:</span>
                                <code className="font-mono">{files[0].filingCategory.nameStructure}</code>
                              </div>
                              <p className="text-xs text-purple-500 mt-1">
                                Filename will be auto-generated from metadata values
                              </p>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={files[0]?.name || ''}
                              onChange={(e) => updateFile({ name: e.target.value })}
                              className="w-full p-2 border border-ui rounded text-sm bg-surface text-neutral-text-dark"
                              disabled={uploading}
                            />
                          )}
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

                        {(files[0]?.file.type.startsWith('image/') || /\.(jpg|jpeg|png|tiff|tif|bmp|gif)$/i.test(files[0]?.file.name)) && (
                          <div className="md:col-span-2 flex items-center gap-2 mt-1">
                            <input
                              type="checkbox"
                              id="convertToPdf"
                              checked={files[0]?.convertToPdf || false}
                              onChange={(e) => updateFile({ convertToPdf: e.target.checked })}
                              className="h-4 w-4 text-ui-primary border-ui rounded focus:ring-ui-primary cursor-pointer"
                              disabled={uploading}
                            />
                            <label htmlFor="convertToPdf" className="text-sm font-medium text-neutral-text-dark select-none cursor-pointer">
                              Convert to searchable PDF
                            </label>
                          </div>
                        )}
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
                                openUpward={true}
                                items={filingCategories}
                                fetchFunction={async (query: string) => {
                                  const response = await notificationApiClient.getAllFilingCategories(
                                    { size: 100, name: query },
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

                        {/* Metadata Extraction from Filename Section - Only show when category is selected */}
                        {files[0]?.filingCategory && files.length > 0 && (
                          <div className="border-t border-ui pt-4">
                            <button
                              type="button"
                              onClick={() => setExtractionExpanded(!extractionExpanded)}
                              className="w-full font-medium text-neutral-text-dark flex items-center gap-2 hover:text-primary transition-colors"
                              disabled={uploading}
                            >
                              {extractionExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <Wand2 className="h-4 w-4" />
                              Extract Metadata from Filename
                              <span className="text-xs text-neutral-text-light font-normal ml-1">
                                (Optional)
                              </span>
                            </button>

                            {extractionExpanded && (
                              <div className="mt-3 space-y-3 bg-neutral-background/50 p-3 rounded-lg">
                                {/* Separator and Auto-extract */}
                                <div className="flex items-center gap-3 flex-wrap">
                                  <label className="text-sm text-neutral-text-dark whitespace-nowrap">
                                    Separator:
                                  </label>
                                  <input
                                    type="text"
                                    value={separator}
                                    onChange={(e) => setSeparator(e.target.value.slice(0, 5))}
                                    className="w-16 p-1.5 border border-ui rounded text-sm text-center bg-surface"
                                    placeholder="#"
                                    disabled={uploading}
                                  />

                                  <label className="flex items-center gap-2 text-sm text-neutral-text-dark cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={autoExtractEnabled}
                                      onChange={(e) => setAutoExtractEnabled(e.target.checked)}
                                      className="rounded border-ui"
                                      disabled={uploading}
                                    />
                                    Auto-extract on model select
                                  </label>
                                </div>

                                {/* Field Selection - Customize order and which fields to extract */}
                                <div className="border-t border-ui/50 pt-3">
                                  <p className="text-xs text-neutral-text-dark font-medium mb-2">
                                    Drag fields to reorder extraction order:
                                  </p>
                                  <div className="space-y-1">
                                    {/* Show selected fields in order - draggable */}
                                    {selectedFields.map((fieldKey, idx) => {
                                      const def = files[0]?.filingCategory?.metadataDefinitions?.find(d => d.key === fieldKey);
                                      if (!def) return null;
                                      const isDragging = draggedField === fieldKey;
                                      const isDragOver = dragOverField === fieldKey;
                                      return (
                                        <div
                                          key={def.key}
                                          draggable={!uploading}
                                          onDragStart={(e) => handleFieldDragStart(e, fieldKey)}
                                          onDragOver={(e) => handleFieldDragOver(e, fieldKey)}
                                          onDragLeave={handleFieldDragLeave}
                                          onDrop={(e) => handleFieldDrop(e, fieldKey)}
                                          onDragEnd={handleFieldDragEnd}
                                          className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded border cursor-move transition-all ${isDragging
                                            ? 'opacity-50 bg-primary/20 border-primary scale-95'
                                            : isDragOver
                                              ? 'bg-primary/30 border-primary-dark border-2'
                                              : 'bg-primary/10 border-primary'
                                            }`}
                                        >
                                          <GripVertical className="h-4 w-4 text-primary/60 cursor-grab active:cursor-grabbing" />
                                          <span className="w-5 h-5 flex items-center justify-center bg-primary text-white rounded-full text-[10px] font-bold">
                                            {idx + 1}
                                          </span>
                                          <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => !def.mandatory && toggleFieldSelection(fieldKey)}
                                            disabled={uploading || def.mandatory}
                                            className="h-3 w-3"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className={`flex-1 ${def.mandatory ? 'font-medium' : ''} text-primary`}>
                                            {def.key}
                                            {def.mandatory && <span className="text-error text-[10px] ml-1">*</span>}
                                          </span>
                                          <span className="text-[10px] text-gray-400">({def.dataType})</span>
                                        </div>
                                      );
                                    })}

                                    {/* Show unselected fields */}
                                    {files[0]?.filingCategory?.metadataDefinitions
                                      ?.filter(d => !selectedFields.includes(d.key))
                                      .map((def) => (
                                        <div
                                          key={def.key}
                                          className="flex items-center gap-2 px-2 py-1.5 text-xs rounded border bg-gray-50 border-gray-200 opacity-60"
                                        >
                                          <div className="w-4"></div>
                                          <span className="w-5 h-5 flex items-center justify-center bg-gray-300 text-gray-600 rounded-full text-[10px]">
                                            —
                                          </span>
                                          <input
                                            type="checkbox"
                                            checked={false}
                                            onChange={() => toggleFieldSelection(def.key)}
                                            disabled={uploading}
                                            className="h-3 w-3"
                                          />
                                          <span className="flex-1 text-gray-500">{def.key}</span>
                                          <span className="text-[10px] text-gray-400">({def.dataType})</span>
                                        </div>
                                      ))}
                                  </div>
                                </div>

                                {/* Format Preview - Uses selectedFields order */}
                                <div className="text-xs text-neutral-text-light border-t border-ui/50 pt-3">
                                  <p className="mb-1">
                                    <strong>Expected format:</strong>{' '}
                                    {selectedFields.map((fieldKey, i) => {
                                      const def = files[0]?.filingCategory?.metadataDefinitions?.find(d => d.key === fieldKey);
                                      if (!def) return null;
                                      return (
                                        <span key={fieldKey}>
                                          <span className={def.mandatory ? 'text-error font-medium' : ''}>
                                            {def.key}
                                          </span>
                                          {i < selectedFields.length - 1 && (
                                            <span className="text-primary font-bold">{separator}</span>
                                          )}
                                        </span>
                                      );
                                    })}.ext
                                  </p>
                                  <p className="text-neutral-text-light/70">
                                    Example: <code className="bg-gray-200 px-1 rounded">
                                      {selectedFields.map((fieldKey, i) => {
                                        const def = files[0]?.filingCategory?.metadataDefinitions?.find(d => d.key === fieldKey);
                                        if (!def) return null;
                                        return (
                                          <span key={fieldKey}>
                                            {def.dataType === 'DATE' ? '2025-01-15' : def.dataType === 'NUMBER' ? '123' : `value${i + 1}`}
                                            {i < selectedFields.length - 1 && separator}
                                          </span>
                                        );
                                      })}.pdf
                                    </code>
                                  </p>
                                </div>

                                {/* Apply Button */}
                                <div className="flex items-center gap-2 border-t border-ui/50 pt-3">
                                  <button
                                    type="button"
                                    onClick={applyExtractionToAllFiles}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                                    disabled={uploading || selectedFields.length === 0}
                                  >
                                    <Wand2 className="h-3 w-3" />
                                    Apply to All Files ({files.length})
                                  </button>

                                  <span className="text-xs text-neutral-text-light">
                                    {selectedFields.length} of {files[0]?.filingCategory?.metadataDefinitions?.length || 0} fields selected
                                  </span>
                                </div>

                                {/* Files Status Summary */}
                                {files.some(f => Object.keys(f.metadataErrors || {}).length > 0) && (
                                  <div className="text-xs text-red-600 flex items-center gap-1 border-t border-ui/50 pt-2">
                                    <AlertCircle className="h-3 w-3" />
                                    {files.filter(f => Object.keys(f.metadataErrors || {}).length > 0).length} file(s) have validation errors - click ✏️ to edit filename
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tags Section */}
                        <div className="border-t border-ui pt-4">
                          <h4 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Tags
                          </h4>

                          {/* Search and Add Tag Interface */}
                          <div className="space-y-2 mb-4">
                            <SearchSelect
                              openUpward={true}
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
          {uploading && (
            <div className="px-6 pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-text-dark font-medium">
                    {uploadProgress.total > 0
                      ? `Uploading file ${uploadProgress.current} of ${uploadProgress.total}`
                      : 'Uploading...'}
                  </span>
                  <span className="text-neutral-text-light font-semibold">
                    {uploadPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-150 ease-out"
                    style={{ width: `${uploadPercentage}%` }}
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