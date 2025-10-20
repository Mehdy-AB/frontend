'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle, File, Image, Video, Music } from 'lucide-react';
import { notificationApiClient } from '../../api/notificationClient';

interface UploadVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number;
  onSuccess?: () => void;
  onOptimisticUpdate?: (file: File) => void;
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

export default function UploadVersionModal({
  isOpen,
  onClose,
  documentId,
  onSuccess,
  onOptimisticUpdate
}: UploadVersionModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [language, setLanguage] = useState<'ENG' | 'FRA' | 'ARA'>('ENG');

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
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null);
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Optimistic update - immediately show the new file in the viewer
      if (onOptimisticUpdate) {
        onOptimisticUpdate(selectedFile);
      }

      // Close modal immediately for better UX
      onClose();

      // Upload in background
      await notificationApiClient.uploadDocumentVersion(
        selectedFile,
        documentId,
        language.toLowerCase() as 'eng' | 'fra' | 'ara' 
      );

      setSelectedFile(null);
      setError(null);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error uploading document version:', err);
      setError('Failed to upload document version. Please try again.');
      // Note: The optimistic update will remain in the viewer
      // In a real app, you might want to show a toast notification about the error
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg border border-ui w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-ui">
          <div>
            <h2 className="text-xl font-semibold text-neutral-text-dark">
              Upload New Version
            </h2>
            <p className="text-sm text-neutral-text-light">
              Document ID: {documentId}
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-neutral-background transition-colors text-neutral-text-light"
            disabled={isUploading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* File Drop Area */}
            {!selectedFile && (
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
                  onChange={handleFileSelect}
                  className="hidden"
                  id="version-file-input"
                  disabled={isUploading}
                />
                <label 
                  htmlFor="version-file-input" 
                  className="inline-flex items-center gap-2 bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </label>
              </div>
            )}

            {/* Selected File Info */}
            {selectedFile && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-neutral-text-dark">
                    Selected File
                  </h3>
                  <button 
                    onClick={removeFile}
                    className="p-2 text-error hover:bg-error/10 rounded transition-colors"
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="border border-ui rounded-lg overflow-hidden">
                  <div className="p-4 bg-neutral-background border-b border-ui">
                    <div className="flex items-center gap-3">
                      {getFileIcon(selectedFile)}
                      <div>
                        <p className="font-medium text-neutral-text-dark">{selectedFile.name}</p>
                        <p className="text-sm text-neutral-text-light">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                          Document Language
                        </label>
                        <select 
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as 'ENG' | 'FRA' | 'ARA')}
                          className="w-full p-2 border border-ui rounded text-sm bg-surface text-neutral-text-dark"
                          disabled={isUploading}
                        >
                          {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-error" />
                  <p className="text-sm text-error">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-ui bg-neutral-background">
          <div className="text-sm text-neutral-text-light">
            {selectedFile ? '1 file selected' : 'No file selected'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-ui rounded-lg text-neutral-text-dark hover:bg-surface transition-colors disabled:opacity-50"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2 bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-surface border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Version
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}