'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Calendar,
  User,
  Folder,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react';
import { UnclassifiedDocumentResponseDto, UnclassifiedDocumentDetailResponseDto, ExtractorLanguage, FilingCategoryDocDto, MetaDataDto, TagResponseDto, CategoryMetadataDefinitionDto } from '@/types/api';
import { useLanguage } from '@/contexts/LanguageContext';
import FileViewer from '@/components/viewers/FileViewer';
import { SearchSelect } from '@/components/main/SearchSelect';
import { unclassifiedDocumentService } from '@/api/services/unclassifiedDocumentService';
import { tagService } from '@/api/services/tagService';
import { X, Tag, Plus } from 'lucide-react';
import CreateTagModal from '@/components/modals/CreateTagModal';
import { useNotifications } from '@/hooks/useNotifications';

interface ClassAValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: UnclassifiedDocumentResponseDto;
  onSuccess: () => void;
}

export default function ClassAValidationModal({
  isOpen,
  onClose,
  document,
  onSuccess
}: ClassAValidationModalProps) {
  const { t } = useLanguage();
  const [documentDetails, setDocumentDetails] = useState<UnclassifiedDocumentDetailResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [title, setTitle] = useState(document.title || '');
  const [name, setName] = useState(document.name || '');
  const [description, setDescription] = useState((document as any).description || '');
  const [selectedTags, setSelectedTags] = useState<TagResponseDto[]>([]);
  const [availableTags, setAvailableTags] = useState<TagResponseDto[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [language, setLanguage] = useState<ExtractorLanguage>(ExtractorLanguage.ENG);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [loadingDownloadUrl, setLoadingDownloadUrl] = useState(false);
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);
  const { showError, showSuccess, showWarning } = useNotifications();

  useEffect(() => {
    if (isOpen && document) {
      fetchDocumentDetails();
      // Only fetch download URL if modal is actually visible (not during bulk validation transitions)
      const timer = setTimeout(() => {
        fetchDownloadUrl();
      }, 100);
      
      setTitle(document.title || document.name || '');
      setName(document.name || '');
      setDescription((document as any).description || '');
      loadAvailableTags();
      
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      // Clear download URL when modal closes to prevent unwanted downloads
      setDownloadUrl('');
    }
  }, [isOpen, document]);

  const loadAvailableTags = async () => {
    try {
      setIsLoadingTags(true);
      const tags = await tagService.getAvailableTags();
      setAvailableTags(tags);
    } catch (e) {
      console.error('Error loading available tags:', e);
    } finally {
      setIsLoadingTags(false);
    }
  };

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      const details = await unclassifiedDocumentService.getUnclassifiedDocumentById(document.id);
      setDocumentDetails(details);

      // Initialize metadata with empty values
      const initialMetadata: Record<string, string> = {};
      // Check both possible locations for metadata definitions
      const metadataDefs = (details as any).metadataDefinitions || (details as any).filingCategory?.metadataDefinitions || [];
      if (Array.isArray(metadataDefs) && metadataDefs.length > 0) {
        metadataDefs.forEach((def: any) => {
          if (def && (def.key || def.metadataName)) {
            initialMetadata[def.key || def.metadataName] = '';
          }
        });
      }
      setMetadata(initialMetadata);
    } catch (error: any) {
      console.error('Error fetching document details:', {
        error,
        documentId: document.id,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  const fetchDownloadUrl = async () => {
    try {
      setLoadingDownloadUrl(true);
      const response = await unclassifiedDocumentService.getDownloadUrl(document.id);
      setDownloadUrl(response.url);
    } catch (error: any) {
      console.error('Error fetching download URL:', {
        error,
        documentId: document.id,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    } finally {
      setLoadingDownloadUrl(false);
    }
  };

  // Tag handlers
  const handleTagSelect = (tag: TagResponseDto) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleTagRemove = (tagId: number) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleCreateTag = async (tagData: { name: string; description?: string; color?: string }) => {
    try {
      const newTag = await tagService.createTag(tagData);
      setSelectedTags([...selectedTags, newTag]);
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate title
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    // Validate required metadata fields
    const metadataDefs = (documentDetails as any)?.metadataDefinitions || [];
    metadataDefs.forEach((def: any) => {
      if (def && (def.mandatory || false)) {
        const fieldKey = def.key || def.metadataName;
        const value = metadata[fieldKey];
        if (!value || value.trim() === '' || value === '__custom__') {
          newErrors[fieldKey] = `${fieldKey} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid (for disabling submit button)
  const isFormValid = () => {
    // Check title
    if (!title.trim()) return false;

    // Check all required metadata fields
    const metadataDefs = (documentDetails as any)?.metadataDefinitions || [];
    for (const def of metadataDefs) {
      if (def && (def.mandatory || false)) {
        const fieldKey = def.key || def.metadataName;
        const value = metadata[fieldKey];
        
        // If value is empty, null, or "__custom__" (which means custom input is selected but not filled), it's invalid
        if (!value || value.trim() === '' || value === '__custom__') {
          return false;
        }
      }
    }

    return true;
  };

  const handleValidate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setValidating(true);

      // Prepare filing category data - send category even if no metadata
      let filingCategoryDto: FilingCategoryDocDto | undefined;

      // Get metadata definitions from details
      const metadataDefs = (documentDetails as any)?.metadataDefinitions || [];
      
      // Try to get categoryId from document, or fallback to documentDetails
      let categoryId: number | undefined = document.categoryId;
      if (!categoryId || categoryId === 0) {
        // Fallback to categoryId from documentDetails if available
        categoryId = (documentDetails as any)?.filingCategory?.id || 
                     (documentDetails as any)?.categoryId || 
                     undefined;
      }
      
      // Check if we have a valid categoryId (not null, undefined, or 0)
      const hasCategoryId = categoryId != null && categoryId !== 0;
      
      if (hasCategoryId) {
        const metaDataDto: MetaDataDto[] = [];
        
        // Only include metadata if definitions exist and values are provided
        if (documentDetails && Array.isArray(metadataDefs) && metadataDefs.length > 0) {
          metadataDefs.forEach((def: any) => {
            if (!def) return;
            const fieldKey = def.key || def.metadataName;
            const metadataId = def.id || def.metadataId;
            
            // Only include if we have a value and a valid ID
            if (metadata[fieldKey] && metadata[fieldKey].trim() !== '' && metadataId) {
              metaDataDto.push({
                id: metadataId, // Use the metadata definition's ID
                value: metadata[fieldKey].trim()
              });
            }
          });
        }

        // Always send filing category if we have categoryId, even with empty metadata
        // This ensures the category association is saved
        filingCategoryDto = {
          id: categoryId!, // Non-null assertion since we checked hasCategoryId
          metaDataDto: metaDataDto // Always include, even if empty array
        };
        
        console.log('Created filingCategoryDto:', {
          id: filingCategoryDto.id,
          metaDataDtoCount: filingCategoryDto.metaDataDto.length,
          metaDataDto: filingCategoryDto.metaDataDto
        });
      } else {
        console.warn('No valid categoryId found. Document categoryId:', document.categoryId, 
                     'DocumentDetails categoryId:', (documentDetails as any)?.filingCategory?.id);
      }

      // Allow user to change extension; if empty, fallback to original name
      const trimmed = (name || '').trim();
      const finalFileName = trimmed.length > 0 ? trimmed : (document.name || '');

      // Debug: Log what we're sending
      console.log('=== Classify Document Payload ===');
      console.log('Document ID:', document.id);
      console.log('Category ID:', document.categoryId);
      console.log('Filing Category DTO:', filingCategoryDto);
      console.log('Metadata DTO:', filingCategoryDto?.metaDataDto);
      console.log('Tags:', selectedTags.map(tag => tag.id));
      console.log('Description:', description.trim() || 'empty');
      console.log('================================');

      // Move ClassA document to main documents table (multipart form)
      await unclassifiedDocumentService.classifyDocument(document.id, {
        folderId: document.folderId,
        title: title.trim(),
        description: description.trim() || undefined, // Send undefined if empty
        lang: language,
        fileName: finalFileName,
        tagsIds: selectedTags.length > 0 ? selectedTags.map(tag => tag.id) : undefined,
        filingCategory: filingCategoryDto
      });

      showSuccess('Document Validated', 'Document has been successfully moved to repository');
      onSuccess();
    } catch (error: any) {
      console.error('Error validating document:', error);
      
      // Extract error message from ErrorDto response (backend returns {status, message})
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to validate document. Please try again.';
      const status = error?.response?.status;
      
      // Handle duplicate name error (409 Conflict)
      if (status === 409 || errorMessage.includes('already exists')) {
        showError('Duplicate Name', errorMessage);
      } else if (status === 400) {
        // Handle validation errors (missing required fields, invalid metadata, etc.)
        showError('Validation Failed', errorMessage);
      } else {
        showError('Validation Failed', errorMessage);
      }
    } finally {
      setValidating(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-GB', { month: 'short' }).toLowerCase();
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    return '📄';
  };

  const renderUserInfo = (user: any) => {
    if (!user) return 'Unknown';
    const display = user.displayName || user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Unknown';
    const email = user.email ? ` (${user.email})` : '';
    const avatar = user.imageUrl || user.imgUrl;
    return (
      <span className="flex items-center gap-2">
        {avatar && <img src={avatar} alt={display} className="h-5 w-5 rounded-full object-cover" />}
        <span>{display}{email}</span>
      </span>
    );
  };

  const renderMetadataField = (definition: any, index?: number) => {
    const isRequired = definition.mandatory || false;
    const hasError = errors[definition.key || definition.metadataName];

    if (definition.dataType === 'LIST' && definition.list) {
      // Handle different list structures safely
      let options = definition.list.option || definition.list.options || definition.list || [];

      // Ensure options is an array and normalize the values
      if (!Array.isArray(options)) {
        options = [];
      }

      // Convert any non-string options to strings
      options = options.map((option: any) => {
        if (typeof option === 'object' && option !== null) {
          return option.value || option.label || option.name || String(option);
        }
        return String(option);
      });

      const fieldKey = definition.key || definition.metadataName;
      const fieldName = definition.key || definition.metadataName;
      const currentValue = metadata[fieldKey] || '';
      const allowCustomValue = definition.list?.mandatory === true; // Only when mandatory=true
      const isCustomValue = currentValue && !options.includes(currentValue);
      const showCustomInput = allowCustomValue && (isCustomValue || currentValue === "__custom__");

      return (
        <div key={fieldKey} className="space-y-2">
          <Label htmlFor={fieldKey} className="text-sm font-medium">
            {fieldName} {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={showCustomInput ? "__custom__" : currentValue}
            onValueChange={(value) => {
              if (value === "__custom__") {
                setMetadata(prev => ({ ...prev, [fieldKey]: "__custom__" }));
              } else {
                setMetadata(prev => ({ ...prev, [fieldKey]: value }));
              }
            }}
          >
            <SelectTrigger className={hasError ? 'border-destructive' : ''}>
              <SelectValue placeholder={`Select ${fieldName}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: string, optionIndex: number) => (
                <SelectItem key={`${fieldKey}-option-${optionIndex}`} value={String(option)}>
                  {String(option)}
                </SelectItem>
              ))}
              {/* Custom input only allowed when list.mandatory = true */}
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

          {/* Show custom input field */}
          {showCustomInput && (
            <Input
              type="text"
              value={isCustomValue ? currentValue : ''}
              onChange={(e) => setMetadata(prev => ({ ...prev, [fieldKey]: e.target.value }))}
              placeholder={`Enter custom ${fieldName}`}
              className={hasError ? 'border-destructive' : ''}
            />
          )}

          {hasError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {hasError}
            </p>
          )}
        </div>
      );
    }

    if (definition.dataType === 'DATETIME' || definition.dataType === 'DATE') {
      const fieldKey = definition.key || definition.metadataName;
      const fieldName = definition.key || definition.metadataName;

      return (
        <div key={fieldKey} className="space-y-2">
          <Label htmlFor={fieldKey} className="text-sm font-medium">
            {fieldName} {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id={fieldKey}
            type={definition.dataType === 'DATE' ? 'date' : 'datetime-local'}
            value={metadata[fieldKey] || ''}
            onChange={(e) => setMetadata(prev => ({ ...prev, [fieldKey]: e.target.value }))}
            className={hasError ? 'border-destructive' : ''}
          />
          {hasError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {hasError}
            </p>
          )}
        </div>
      );
    }

    if (definition.dataType === 'NUMBER' || definition.dataType === 'FLOAT') {
      const fieldKey = definition.key || definition.metadataName;
      const fieldName = definition.key || definition.metadataName;

      return (
        <div key={fieldKey} className="space-y-2">
          <Label htmlFor={fieldKey} className="text-sm font-medium">
            {fieldName} {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id={fieldKey}
            type="number"
            value={metadata[fieldKey] || ''}
            onChange={(e) => setMetadata(prev => ({ ...prev, [fieldKey]: e.target.value }))}
            className={hasError ? 'border-destructive' : ''}
          />
          {hasError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {hasError}
            </p>
          )}
        </div>
      );
    }

    // Default to text input for STRING and BOOLEAN
    const fieldKey = definition.key || definition.metadataName;
    const fieldName = definition.key || definition.metadataName;

    return (
      <div key={fieldKey} className="space-y-2">
        <Label htmlFor={fieldKey} className="text-sm font-medium">
          {fieldName} {isRequired && <span className="text-destructive">*</span>}
        </Label>
        {definition.dataType === 'BOOLEAN' ? (
          <Select
            value={metadata[fieldKey] || ''}
            onValueChange={(value) => setMetadata(prev => ({ ...prev, [fieldKey]: value }))}
          >
            <SelectTrigger className={hasError ? 'border-destructive' : ''}>
              <SelectValue placeholder={`Select ${fieldName}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={`${fieldKey}-boolean-true`} value="true">Yes</SelectItem>
              <SelectItem key={`${fieldKey}-boolean-false`} value="false">No</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={fieldKey}
            value={metadata[fieldKey] || ''}
            onChange={(e) => setMetadata(prev => ({ ...prev, [fieldKey]: e.target.value }))}
            className={hasError ? 'border-destructive' : ''}
          />
        )}
        {hasError && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {hasError}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[98vw] !w-[98vw] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <DialogTitle className="flex items-center gap-3 text-2xl font-semibold text-gray-900">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-sm">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <span>Validate & Classify Document</span>
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1 ml-12">Review and complete document information before moving to repository</p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-gray-600 font-medium">Loading document details...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex gap-0 min-h-0">
            {/* Left Column - File Viewer */}
            <div className="w-1/2 border-r border-gray-200 bg-gray-50 flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  Document Preview
                </h4>
                {loadingDownloadUrl && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                    Loading preview...
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-hidden bg-white p-6">
                <div className="h-full w-full rounded-xl border-2 border-gray-200 bg-white shadow-lg overflow-hidden">
                  {downloadUrl && isOpen ? (
                    <FileViewer
                      document={{
                        documentId: document.id,
                        name: document.name,
                        mimeType: document.mimeType,
                        sizeBytes: document.sizeBytes
                      } as any}
                      downloadUrl={downloadUrl.trim()}
                      onError={(error) => console.error('File viewer error:', error)}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                      <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="h-10 w-10 text-gray-400" />
                      </div>
                      <p className="font-semibold text-gray-700">Preview not available</p>
                      <p className="text-sm mt-1 text-gray-500">The document preview could not be loaded.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="p-6 space-y-6">
                {/* Document Information Card */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl border-2 border-white shadow-md flex items-center justify-center text-3xl">
                        {getFileIcon(document.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 truncate" title={document.title || document.name}>
                          {document.title || document.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate mt-0.5" title={document.name}>{document.name}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {formatDate(document.createdAt)}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            {renderUserInfo(document.createdBy)}
                          </div>
                          <Badge variant="secondary" className="text-[10px] h-5 px-2 font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {formatFileSize(document.sizeBytes)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Validation Form */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="h-1 w-1 rounded-full bg-blue-600"></div>
                    <h4 className="font-semibold text-lg text-gray-900">Document Information</h4>
                  </div>


                  {/* Title */}
                  <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                      Document Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`h-11 ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                      placeholder="Enter document title"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600 flex items-center gap-1.5 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Name */}
                  <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      File Name <span className="text-red-500">*</span>
                      <span className="text-xs font-normal text-gray-500 ml-2">(Extension will be corrected automatically)</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`h-11 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                      placeholder="Enter file name (without extension)"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 flex items-center gap-1.5 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter document description (optional)"
                      rows={3}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Tags Section */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-1 w-1 rounded-full bg-blue-600"></div>
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-blue-600" />
                        Tags
                      </h4>
                    </div>

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
                      >
                        Create a new tag
                      </button>
                    </div>
                  </div>

                  {/* Tags Display */}
                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    {selectedTags.length ? (
                      selectedTags.map((tag) => (
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

                  {/* Language */}
                  <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                    <Label htmlFor="language" className="text-sm font-semibold text-gray-700">
                      Extraction Language
                    </Label>
                    <Select
                      value={language}
                      onValueChange={(value) => setLanguage(value as ExtractorLanguage)}
                    >
                      <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ExtractorLanguage.ENG}>English</SelectItem>
                        <SelectItem value={ExtractorLanguage.FRA}>French</SelectItem>
                        <SelectItem value={ExtractorLanguage.ARA}>Arabic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Metadata Fields */}
                  {documentDetails && ((documentDetails as any).metadataDefinitions || []).length > 0 && (
                    <div className="bg-white p-5 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-200">
                        <div className="h-1 w-1 rounded-full bg-blue-600"></div>
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          {document.categoryName} Metadata
                          <Badge variant="secondary" className="ml-2 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {((documentDetails as any).metadataDefinitions || []).filter((d: any) => d.mandatory || false).length} required
                          </Badge>
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {((documentDetails as any).metadataDefinitions || []).map((definition: any, index: number) =>
                          renderMetadataField(definition, index)
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6 pb-2 bg-white sticky bottom-0">
                  <Button 
                    variant="outline" 
                    onClick={onClose} 
                    disabled={validating || !isFormValid()}
                    className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleValidate} 
                    disabled={validating || !isFormValid()} 
                    className="min-w-[160px] h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                  >
                    {validating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Validate & Move
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Create Tag Modal */}
      <CreateTagModal
        isOpen={isCreateTagModalOpen}
        onClose={() => setIsCreateTagModalOpen(false)}
        onCreateTag={handleCreateTag}
      />
    </Dialog>
  );
}


