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
  Loader2
} from 'lucide-react';
import { ClassAResponseDto, ClassADetailResponseDto, ExtractorLanguage, FilingCategoryDocDto, MetaDataDto, TagResponseDto, CategoryMetadataDefinitionDto } from '@/types/api';
import { useLanguage } from '@/contexts/LanguageContext';
import FileViewer from '@/components/viewers/FileViewer';
import { SearchSelect } from '@/components/main/SearchSelect';
import { unclassifiedDocumentService } from '@/api/services/unclassifiedDocumentService';
import { tagService } from '@/api/services/tagService';
import { X, Tag, Plus } from 'lucide-react';
import CreateTagModal from '@/components/modals/CreateTagModal';

interface ClassAValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ClassAResponseDto;
  onSuccess: () => void;
}

export default function ClassAValidationModal({
  isOpen,
  onClose,
  document,
  onSuccess
}: ClassAValidationModalProps) {
  const { t } = useLanguage();
  const [documentDetails, setDocumentDetails] = useState<ClassADetailResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [title, setTitle] = useState(document.title || '');
  const [name, setName] = useState(document.name || '');
  const [description, setDescription] = useState(document.description || '');
  const [selectedTags, setSelectedTags] = useState<TagResponseDto[]>([]);
  const [availableTags, setAvailableTags] = useState<TagResponseDto[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [language, setLanguage] = useState<ExtractorLanguage>(ExtractorLanguage.ENG);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [loadingDownloadUrl, setLoadingDownloadUrl] = useState(false);
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && document) {
      fetchDocumentDetails();
      fetchDownloadUrl();
      setTitle(document.title || '');
      setName(document.name || '');
      setDescription(document.description || '');
      loadAvailableTags();
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
      if (details.filingCategory?.metadataDefinitions && Array.isArray(details.filingCategory.metadataDefinitions)) {
        details.filingCategory.metadataDefinitions.forEach(def => {
          if (def && def.key) {
            initialMetadata[def.key] = '';
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

    if (!title.trim()) newErrors.title = 'Title is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleValidate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setValidating(true);

      // Prepare filing category data - always required
      let filingCategoryDto: FilingCategoryDocDto | undefined;
      
      if (document.categoryId && documentDetails && documentDetails.metadataDefinitions && Array.isArray(documentDetails.metadataDefinitions) && documentDetails.metadataDefinitions.length > 0) {
        const metaDataDto: MetaDataDto[] = documentDetails.metadataDefinitions
          .filter(def => {
            if (!def) return false;
            const fieldKey = (def as any).key || def.metadataName;
            return metadata[fieldKey];
          })
          .map((def, index) => {
            const fieldKey = (def as any).key || def.metadataName;
            return {
              id: (def as any).id || def.metadataId, // Use the metadata definition's ID, not category ID
              value: metadata[fieldKey]
            };
          });

        filingCategoryDto = {
          id: document.categoryId,
          metaDataDto
        };
      }

      // Allow user to change extension; if empty, fallback to original name
      const trimmed = (name || '').trim();
      const finalFileName = trimmed.length > 0 ? trimmed : (document.name || '');

      // Move ClassA document to main documents table (multipart form)
      await unclassifiedDocumentService.classifyDocument(document.id, {
        folderId: document.folderId,
        title: title.trim(),
        lang: language,
        fileName: finalFileName,
        tagsIds: selectedTags.length > 0 ? selectedTags.map(tag => tag.id) : undefined,
        filingCategory: filingCategoryDto
      });

      onSuccess();
    } catch (error) {
      console.error('Error validating document:', error);
      // You might want to show an error notification here
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
      <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[95vh] overflow-hidden flex flex-col sm:!max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Validate Document
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-muted-foreground">Loading document details...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex gap-6 min-h-0">
            {/* Left Column - File Viewer */}
            <div className="w-1/2 border-r border-ui pr-6">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Document Preview</h4>
                  {loadingDownloadUrl && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading preview...
                    </div>
                  )}
                </div>
                
                <div className="flex-1 border border-ui rounded-lg overflow-hidden">
                  {downloadUrl ? (
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
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Preview not available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="flex-1 overflow-y-auto space-y-6 pl-4">
              {/* Document Information */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{getFileIcon(document.mimeType)}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{document.title}</h3>
                      <p className="text-muted-foreground">{document.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(document.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {renderUserInfo(document.createdBy)}
                        </div>
                      </div>
                      <Badge variant="outline" className="mt-2">
                        {formatFileSize(document.sizeBytes)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Validation Form */}
              <div className="space-y-4">
                <h4 className="font-semibold">Document Validation</h4>
                
                
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Document Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={errors.title ? 'border-destructive' : ''}
                    placeholder="Enter document title"
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Document Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={errors.name ? 'border-destructive' : ''}
                    placeholder="Enter document name"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter document description"
                    rows={3}
                  />
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
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium">
                    Extraction Language
                  </Label>
                  <Select
                    value={language}
                    onValueChange={(value) => setLanguage(value as ExtractorLanguage)}
                  >
                    <SelectTrigger>
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
                {documentDetails && documentDetails.metadataDefinitions && documentDetails.metadataDefinitions.length > 0 && (
                  <div className="border-t border-ui pt-4">
                    <h4 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {document.categoryName} Metadata
                      <span className="text-xs text-neutral-text-light">
                        ({documentDetails.metadataDefinitions.filter(d => (d as any).mandatory || false).length} required)
                      </span>
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {documentDetails.metadataDefinitions.map((definition, index) => 
                        renderMetadataField(definition, index)
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose} disabled={validating}>
                  Cancel
                </Button>
                <Button onClick={handleValidate} disabled={validating}>
                  {validating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Validate & Move to Repository
                    </>
                  )}
                </Button>
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


