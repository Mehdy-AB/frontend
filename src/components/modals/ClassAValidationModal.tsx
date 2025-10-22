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
import { apiClient } from '@/api/client';
import { ClassAResponseDto, ClassADetailResponseDto, ExtractorLanguage, FilingCategoryDocDto, MetaDataDto } from '@/types/api';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const [title, setTitle] = useState(document.title);
  const [language, setLanguage] = useState<ExtractorLanguage>(ExtractorLanguage.ENG);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && document) {
      fetchDocumentDetails();
      setTitle(document.title);
    }
  }, [isOpen, document]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      const details = await apiClient.getClassADocument(document.id);
      setDocumentDetails(details);
      
      // Initialize metadata with empty values
      const initialMetadata: Record<string, string> = {};
      details.metadataDefinitions.forEach(def => {
        initialMetadata[def.key] = '';
      });
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (documentDetails) {
      documentDetails.metadataDefinitions.forEach(def => {
        if (def.mandatory && !metadata[def.key]?.trim()) {
          newErrors[def.key] = `${def.key} is required`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleValidate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setValidating(true);

      // Prepare filing category data
      let filingCategoryDto: FilingCategoryDocDto | undefined;
      
      if (documentDetails && documentDetails.metadataDefinitions.length > 0) {
        const metaDataDto: MetaDataDto[] = documentDetails.metadataDefinitions
          .filter(def => metadata[def.key])
          .map((def, index) => ({
            id: def.id || index + 1,
            value: metadata[def.key]
          }));

        filingCategoryDto = {
          id: document.categoryId,
          metaDataDto
        };
      }

      // Move ClassA document to main documents table
      await apiClient.moveClassAToDocument(document.id, {
        title: title.trim(),
        lang: language,
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
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    return '📄';
  };

  const renderMetadataField = (definition: any) => {
    const isRequired = definition.mandatory;
    const hasError = errors[definition.key];

    if (definition.dataType === 'LIST' && definition.list) {
      return (
        <div key={definition.key} className="space-y-2">
          <Label htmlFor={definition.key} className="text-sm font-medium">
            {definition.key} {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={metadata[definition.key] || ''}
            onValueChange={(value) => setMetadata(prev => ({ ...prev, [definition.key]: value }))}
          >
            <SelectTrigger className={hasError ? 'border-destructive' : ''}>
              <SelectValue placeholder={`Select ${definition.key}`} />
            </SelectTrigger>
            <SelectContent>
              {definition.list.option.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      return (
        <div key={definition.key} className="space-y-2">
          <Label htmlFor={definition.key} className="text-sm font-medium">
            {definition.key} {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id={definition.key}
            type={definition.dataType === 'DATE' ? 'date' : 'datetime-local'}
            value={metadata[definition.key] || ''}
            onChange={(e) => setMetadata(prev => ({ ...prev, [definition.key]: e.target.value }))}
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
      return (
        <div key={definition.key} className="space-y-2">
          <Label htmlFor={definition.key} className="text-sm font-medium">
            {definition.key} {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id={definition.key}
            type="number"
            value={metadata[definition.key] || ''}
            onChange={(e) => setMetadata(prev => ({ ...prev, [definition.key]: e.target.value }))}
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
    return (
      <div key={definition.key} className="space-y-2">
        <Label htmlFor={definition.key} className="text-sm font-medium">
          {definition.key} {isRequired && <span className="text-destructive">*</span>}
        </Label>
        {definition.dataType === 'BOOLEAN' ? (
          <Select
            value={metadata[definition.key] || ''}
            onValueChange={(value) => setMetadata(prev => ({ ...prev, [definition.key]: value }))}
          >
            <SelectTrigger className={hasError ? 'border-destructive' : ''}>
              <SelectValue placeholder={`Select ${definition.key}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={definition.key}
            value={metadata[definition.key] || ''}
            onChange={(e) => setMetadata(prev => ({ ...prev, [definition.key]: e.target.value }))}
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <div className="space-y-6">
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
                        <Folder className="h-4 w-4" />
                        {document.categoryName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(document.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {document.createdBy}
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
              {documentDetails && documentDetails.metadataDefinitions.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Metadata Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documentDetails.metadataDefinitions.map(renderMetadataField)}
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
        )}
      </DialogContent>
    </Dialog>
  );
}


