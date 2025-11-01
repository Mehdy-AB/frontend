'use client';

import { useState } from 'react';
import { X, Link, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { linkRuleService } from '../../api/services/linkRuleService';
import { DocumentLinkRequestDto, DocumentResponseDto } from '../../types/api';
import { formatFileSize } from '../../utils/documentUtils';
import FolderNavigationPicker from './FolderNavigationPicker';

interface LinkDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkCreated: () => void;
  sourceDocumentId: number;
  sourceDocumentName: string;
}

const LINK_TYPES = [
  { value: 'related', label: 'Related Document' },
  { value: 'reference', label: 'Reference' },
  { value: 'attachment', label: 'Attachment' },
  { value: 'version', label: 'Version' },
  { value: 'parent', label: 'Parent Document' },
  { value: 'child', label: 'Child Document' },
  { value: 'similar', label: 'Similar Document' },
  { value: 'alternative', label: 'Alternative Version' }
];

export default function LinkDocumentModal({ 
  isOpen, 
  onClose, 
  onLinkCreated, 
  sourceDocumentId, 
  sourceDocumentName 
}: LinkDocumentModalProps) {
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponseDto | null>(null);
  const [linkType, setLinkType] = useState('related');
  const [description, setDescription] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle document selection from folder navigation
  const handleSelectDocument = (document: DocumentResponseDto) => {
    setSelectedDocument(document);
    setError(null);
  };

  const handleLink = async () => {
    if (!selectedDocument) {
      setError('Please select a document to link');
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      const linkRequest: DocumentLinkRequestDto = {
        sourceDocumentId: sourceDocumentId,
        targetDocumentId: selectedDocument.documentId,
        linkType: linkType,
        description: description.trim() || undefined
      };

      await linkRuleService.createDocumentLink(linkRequest);
      onLinkCreated();
      handleClose();
    } catch (error) {
      console.error('Error creating link:', error);
      setError('Failed to create link. Please try again.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    if (!isLinking) {
      setSelectedDocument(null);
      setLinkType('related');
      setDescription('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create Manual Link</h2>
              <p className="text-sm text-gray-500">Link "{sourceDocumentName}" to another document</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLinking}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Folder Navigation Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Document from Folders
            </label>
            <FolderNavigationPicker
              excludeDocumentId={sourceDocumentId}
              onSelectDocument={handleSelectDocument}
              selectedDocument={selectedDocument}
            />
          </div>

          {/* Link Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link Type
            </label>
            <Select value={linkType} onValueChange={setLinkType} disabled={isLinking}>
              <SelectTrigger>
                <SelectValue placeholder="Select link type" />
              </SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the relationship between these documents..."
              disabled={isLinking}
            />
          </div>

          {/* Selected Document Summary */}
          {selectedDocument && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Selected Document</h4>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">{selectedDocument.name}</p>
                  {selectedDocument.title && selectedDocument.title !== selectedDocument.name && (
                    <p className="text-sm text-blue-700">{selectedDocument.title}</p>
                  )}
                   <div className="flex items-center gap-4 text-xs text-blue-600 mt-1">
                     <span>{formatFileSize(selectedDocument.sizeBytes)}</span>
                     <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                       {selectedDocument.mimeType}
                     </span>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLinking}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedDocument || isLinking}
            className="flex-1"
          >
            {isLinking ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Link...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Create Link
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
