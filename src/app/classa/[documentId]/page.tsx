'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    X,
    Tag,
    Plus,
    Settings,
    Eye
} from 'lucide-react';
import { UnclassifiedDocumentDetailResponseDto, ExtractorLanguage, FilingCategoryDocDto, MetaDataDto, TagResponseDto } from '@/types/api';
import { useLanguage } from '@/contexts/LanguageContext';
import FileViewer from '@/components/viewers/FileViewer';
import { SearchSelect } from '@/components/main/SearchSelect';
import { unclassifiedDocumentService } from '@/api/services/unclassifiedDocumentService';
import { tagService } from '@/api/services/tagService';
import CreateTagModal from '@/components/modals/CreateTagModal';
import { useNotifications } from '@/hooks/useNotifications';

export default function ClassAValidationPage() {
    const { t } = useLanguage();
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const documentId = parseInt(params.documentId as string);

    // Queue navigation from URL params
    const queueParam = searchParams.get('queue');
    const documentQueue: number[] = queueParam ? JSON.parse(decodeURIComponent(queueParam)) : [];
    const currentIndex = documentQueue.indexOf(documentId);

    const [documentDetails, setDocumentDetails] = useState<UnclassifiedDocumentDetailResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);
    const [metadata, setMetadata] = useState<Record<string, string>>({});
    const [name, setName] = useState('');
    const [fileExtension, setFileExtension] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTags, setSelectedTags] = useState<TagResponseDto[]>([]);
    const [availableTags, setAvailableTags] = useState<TagResponseDto[]>([]);
    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const [language, setLanguage] = useState<ExtractorLanguage>(ExtractorLanguage.ENG);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [downloadUrl, setDownloadUrl] = useState<string>('');
    const [loadingDownloadUrl, setLoadingDownloadUrl] = useState(false);
    const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);
    const { showError, showSuccess } = useNotifications();

    // Fetch document details and initialize form
    const fetchDocumentDetails = useCallback(async () => {
        try {
            setLoading(true);
            const details = await unclassifiedDocumentService.getUnclassifiedDocumentById(documentId);
            setDocumentDetails(details);

            // Initialize form fields - strip extension from name
            const fullName = details.name || '';
            const lastDotIndex = fullName.lastIndexOf('.');
            if (lastDotIndex > 0) {
                setName(fullName.substring(0, lastDotIndex));
                setFileExtension(fullName.substring(lastDotIndex));
            } else {
                setName(fullName);
                setFileExtension('');
            }
            setDescription((details as any).description || '');

            // Initialize metadata with saved values from DB
            const initialMetadata: Record<string, string> = {};
            const metadataDefs = (details as any).metadataDefinitions || (details as any).filingCategory?.metadataDefinitions || [];

            // Parse metadataValues JSON string from backend
            // Format: [{id: number, value: string}, ...]
            let savedMetadata: Array<{ id: number, value: string }> = [];
            if ((details as any).metadataValues) {
                try {
                    savedMetadata = JSON.parse((details as any).metadataValues);
                } catch (e) {
                    console.error('Error parsing metadataValues:', e);
                }
            }

            if (Array.isArray(metadataDefs) && metadataDefs.length > 0) {
                metadataDefs.forEach((def: any) => {
                    if (def && (def.key || def.metadataName)) {
                        const fieldKey = def.key || def.metadataName;
                        // Try to find saved value from DB by matching definition ID
                        const savedValue = savedMetadata.find((m: any) => m.id === def.id);
                        initialMetadata[fieldKey] = savedValue?.value || '';
                    }
                });
            }
            setMetadata(initialMetadata);

            // Load tags if available
            if ((details as any).tags) {
                setSelectedTags((details as any).tags);
            }
        } catch (error: any) {
            console.error('Error fetching document details:', error);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [documentId]);

    const fetchDownloadUrl = useCallback(async () => {
        try {
            setLoadingDownloadUrl(true);
            const response = await unclassifiedDocumentService.getDownloadUrl(documentId);
            setDownloadUrl(response.url);
        } catch (error: any) {
            console.error('Error fetching download URL:', error);
        } finally {
            setLoadingDownloadUrl(false);
        }
    }, [documentId]);

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

    useEffect(() => {
        if (documentId) {
            fetchDocumentDetails();
            fetchDownloadUrl();
            loadAvailableTags();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [documentId]);

    // Navigation functions
    const goBack = () => router.push('/classa');

    const goToNext = () => {
        if (currentIndex >= 0 && currentIndex < documentQueue.length - 1) {
            const nextId = documentQueue[currentIndex + 1];
            router.push(`/classa/${nextId}?queue=${encodeURIComponent(JSON.stringify(documentQueue))}`);
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            const prevId = documentQueue[currentIndex - 1];
            router.push(`/classa/${prevId}?queue=${encodeURIComponent(JSON.stringify(documentQueue))}`);
        }
    };

    const canGoNext = currentIndex >= 0 && currentIndex < documentQueue.length - 1;
    const canGoPrevious = currentIndex > 0;

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

    // Form validation
    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        // Validate name (used as title)
        if (!name.trim()) {
            newErrors.name = 'File name is required';
        }

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

    const isFormValid = () => {
        if (!name.trim()) return false;

        const metadataDefs = (documentDetails as any)?.metadataDefinitions || [];
        for (const def of metadataDefs) {
            if (def && (def.mandatory || false)) {
                const fieldKey = def.key || def.metadataName;
                const value = metadata[fieldKey];
                if (!value || value.trim() === '' || value === '__custom__') {
                    return false;
                }
            }
        }
        return true;
    };

    // Handle validation submit
    const handleValidate = async () => {
        if (!validateForm() || !documentDetails) return;

        try {
            setValidating(true);

            let filingCategoryDto: FilingCategoryDocDto | undefined;
            const metadataDefs = (documentDetails as any)?.metadataDefinitions || [];
            let categoryId: number | undefined = (documentDetails as any).categoryId;

            if (!categoryId || categoryId === 0) {
                categoryId = (documentDetails as any)?.filingCategory?.id || undefined;
            }

            const hasCategoryId = categoryId != null && categoryId !== 0;

            if (hasCategoryId) {
                const metaDataDto: MetaDataDto[] = [];

                if (Array.isArray(metadataDefs) && metadataDefs.length > 0) {
                    metadataDefs.forEach((def: any) => {
                        if (!def) return;
                        const fieldKey = def.key || def.metadataName;
                        const metadataId = def.id || def.metadataId;

                        if (metadata[fieldKey] && metadata[fieldKey].trim() !== '' && metadataId) {
                            metaDataDto.push({
                                id: metadataId,
                                value: metadata[fieldKey].trim()
                            });
                        }
                    });
                }

                filingCategoryDto = {
                    id: categoryId!,
                    metaDataDto: metaDataDto
                };
            }

            const trimmed = (name || '').trim();
            const finalFileName = (trimmed.length > 0 ? trimmed : (documentDetails.name?.replace(/\.[^/.]+$/, '') || '')) + fileExtension;

            await unclassifiedDocumentService.classifyDocument(documentId, {
                folderId: (documentDetails as any).folderId,
                title: name.trim(),
                description: description.trim() || undefined,
                lang: language,
                fileName: finalFileName,
                tagsIds: selectedTags.length > 0 ? selectedTags.map(tag => tag.id) : undefined,
                filingCategory: filingCategoryDto
            });

            showSuccess('Document Validated', 'Document has been successfully moved to repository');

            // Navigate to next or back to list
            if (canGoNext) {
                goToNext();
            } else {
                router.push('/classa');
            }
        } catch (error: any) {
            console.error('Error validating document:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to validate document';
            showError('Validation Failed', errorMessage);
        } finally {
            setValidating(false);
        }
    };

    // Helper functions
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderMetadataField = (definition: any) => {
        const isRequired = definition.mandatory || false;
        const hasError = errors[definition.key || definition.metadataName];
        const fieldKey = definition.key || definition.metadataName;
        const fieldName = definition.key || definition.metadataName;

        if (definition.dataType === 'LIST' && definition.list) {
            let options = definition.list.option || definition.list.options || definition.list || [];
            if (!Array.isArray(options)) options = [];
            options = options.map((opt: any) => typeof opt === 'object' ? (opt.value || opt.label || opt.name || String(opt)) : String(opt));

            const currentValue = metadata[fieldKey] || '';
            const allowCustomValue = definition.list?.mandatory === true;
            const isCustomValue = currentValue && !options.includes(currentValue);
            const showCustomInput = allowCustomValue && (isCustomValue || currentValue === "__custom__");

            return (
                <div key={fieldKey} className="space-y-2">
                    <Label className="text-sm font-medium">
                        {fieldName} {isRequired && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                        value={showCustomInput ? "__custom__" : currentValue}
                        onValueChange={(value) => setMetadata(prev => ({ ...prev, [fieldKey]: value }))}
                    >
                        <SelectTrigger className={hasError ? 'border-red-500' : ''}>
                            <SelectValue placeholder={`Select ${fieldName}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((option: string, idx: number) => (
                                <SelectItem key={`${fieldKey}-${idx}`} value={option}>{option}</SelectItem>
                            ))}
                            {allowCustomValue && (
                                <SelectItem value="__custom__">
                                    <div className="flex items-center gap-2"><Plus className="h-3 w-3" /> Enter custom value</div>
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    {showCustomInput && (
                        <Input
                            value={isCustomValue ? currentValue : ''}
                            onChange={(e) => setMetadata(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                            placeholder={`Enter custom ${fieldName}`}
                            className={hasError ? 'border-red-500' : ''}
                        />
                    )}
                    {hasError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{hasError}</p>}
                </div>
            );
        }

        if (definition.dataType === 'DATE' || definition.dataType === 'DATETIME') {
            return (
                <div key={fieldKey} className="space-y-2">
                    <Label className="text-sm font-medium">
                        {fieldName} {isRequired && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                        type={definition.dataType === 'DATE' ? 'date' : 'datetime-local'}
                        value={metadata[fieldKey] || ''}
                        onChange={(e) => setMetadata(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        className={hasError ? 'border-red-500' : ''}
                    />
                    {hasError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{hasError}</p>}
                </div>
            );
        }

        if (definition.dataType === 'NUMBER' || definition.dataType === 'FLOAT') {
            return (
                <div key={fieldKey} className="space-y-2">
                    <Label className="text-sm font-medium">
                        {fieldName} {isRequired && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                        type="number"
                        value={metadata[fieldKey] || ''}
                        onChange={(e) => setMetadata(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        className={hasError ? 'border-red-500' : ''}
                    />
                    {hasError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{hasError}</p>}
                </div>
            );
        }

        if (definition.dataType === 'BOOLEAN') {
            return (
                <div key={fieldKey} className="space-y-2">
                    <Label className="text-sm font-medium">
                        {fieldName} {isRequired && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                        value={metadata[fieldKey] || ''}
                        onValueChange={(value) => setMetadata(prev => ({ ...prev, [fieldKey]: value }))}
                    >
                        <SelectTrigger className={hasError ? 'border-red-500' : ''}>
                            <SelectValue placeholder={`Select ${fieldName}`} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                    </Select>
                    {hasError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{hasError}</p>}
                </div>
            );
        }

        // Default text input
        return (
            <div key={fieldKey} className="space-y-2">
                <Label className="text-sm font-medium">
                    {fieldName} {isRequired && <span className="text-red-500">*</span>}
                </Label>
                <Input
                    value={metadata[fieldKey] || ''}
                    onChange={(e) => setMetadata(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                    className={hasError ? 'border-red-500' : ''}
                />
                {hasError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{hasError}</p>}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-neutral-background items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="text-gray-600 font-medium">Loading document...</span>
                </div>
            </div>
        );
    }

    if (!documentDetails) {
        return (
            <div className="flex h-screen bg-neutral-background items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-lg mb-4">Document not found</div>
                    <Button onClick={goBack}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-neutral-background">
            {/* Main Document Viewer */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={goBack} className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to List
                            </Button>
                            <div className="h-6 w-px bg-gray-200" />
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold text-gray-900">Validate Document</h1>
                                    <p className="text-xs text-gray-500">
                                        {documentQueue.length > 0 && `${currentIndex + 1} of ${documentQueue.length}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToPrevious}
                                disabled={!canGoPrevious}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToNext}
                                disabled={!canGoNext}
                                className="gap-2"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Document Viewer */}
                <div className="flex-1 overflow-hidden bg-gray-100 p-4">
                    <div className="h-full w-full rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        {downloadUrl ? (
                            <FileViewer
                                document={{
                                    documentId: documentId,
                                    name: documentDetails.name,
                                    mimeType: documentDetails.mimeType,
                                    sizeBytes: documentDetails.sizeBytes
                                } as any}
                                downloadUrl={downloadUrl.trim()}
                                onError={(error) => console.error('File viewer error:', error)}
                            />
                        ) : loadingDownloadUrl ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                                <p className="font-medium">Preview not available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar - Form */}
            <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
                {/* Sidebar Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-gray-500" />
                        <h2 className="font-semibold text-gray-900">Document Configuration</h2>
                    </div>
                </div>

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Document Info Card */}
                    <Card className="border-gray-200">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 truncate">{documentDetails.name}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                        <span>{formatFileSize(documentDetails.sizeBytes)}</span>
                                        <span>•</span>
                                        <span>{formatDate(documentDetails.createdAt)}</span>
                                    </div>
                                    {(documentDetails as any).categoryName && (
                                        <Badge variant="secondary" className="mt-2 text-xs">
                                            {(documentDetails as any).categoryName}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* File Name */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            File Name <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-0">
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter file name"
                                className={`rounded-r-none ${errors.name ? 'border-red-500' : ''}`}
                            />
                            {fileExtension && (
                                <div className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-600">
                                    {fileExtension}
                                </div>
                            )}
                        </div>
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter description (optional)"
                            rows={3}
                        />
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Extraction Language</Label>
                        <Select value={language} onValueChange={(v) => setLanguage(v as ExtractorLanguage)}>
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

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Tag className="h-4 w-4" /> Tags
                        </Label>
                        <SearchSelect
                            items={availableTags}
                            fetchFunction={async (q) => (await tagService.searchTags(q, 0, 20)).content || []}
                            onSelect={handleTagSelect}
                            placeholder="Search tags..."
                            displayField="name"
                            debounceMs={300}
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedTags.map((tag) => (
                                <div
                                    key={tag.id}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm"
                                    style={{
                                        backgroundColor: tag.color ? `${tag.color}20` : '#EFF6FF',
                                        color: tag.color || '#1D4ED8'
                                    }}
                                >
                                    {tag.name}
                                    <button onClick={() => handleTagRemove(tag.id)} className="p-0.5 hover:opacity-70">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsCreateTagModalOpen(true)}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            + Create new tag
                        </button>
                    </div>

                    {/* Metadata Fields */}
                    {((documentDetails as any)?.metadataDefinitions || []).length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                            <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                {(documentDetails as any).categoryName} Metadata
                            </h3>
                            {((documentDetails as any).metadataDefinitions || []).map((def: any) => renderMetadataField(def))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={goBack} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleValidate}
                            disabled={!isFormValid() || validating}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            {validating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Validating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {canGoNext ? 'Validate & Next' : 'Validate'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Create Tag Modal */}
            <CreateTagModal
                isOpen={isCreateTagModalOpen}
                onClose={() => setIsCreateTagModalOpen(false)}
                onSuccess={handleCreateTag}
            />
        </div>
    );
}
