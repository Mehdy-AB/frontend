'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { stampService } from '@/api/services/stampService';
import { useNotifications } from '@/hooks/useNotifications';

interface MediaLibraryProps {
  uploadedMedia: string[];
  onSelectMedia: (url: string) => void;
  onMediaUploaded: (url: string) => void;
  onMediaRemoved?: (url: string) => void;
  selectedMedia?: string;
  insertMode?: 'inline' | 'separate';
  onUploadFile?: (file: File) => Promise<string>;
}

export function MediaLibrary({
  uploadedMedia,
  onSelectMedia,
  onMediaUploaded,
  onMediaRemoved,
  selectedMedia,
  insertMode = 'separate',
  onUploadFile
}: MediaLibraryProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useNotifications();

  const handleMediaUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please select an image file (PNG, JPG, SVG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      let imageUrl: string;
      if (onUploadFile) {
        // Delegate upload to parent (e.g. for deferred upload)
        imageUrl = await onUploadFile(file);
      } else {
        // Default behavior: upload immediately
        const response = await stampService.uploadImage(file);
        imageUrl = response.displayUrl;
      }

      onMediaUploaded(imageUrl);
      if (!onUploadFile) {
        showSuccess('Success', 'Image uploaded successfully');
      }
    } catch (error: any) {
      showError('Upload Failed', error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMediaRemoved) {
      onMediaRemoved(url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0])}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload {insertMode === 'inline' ? 'Image/Icon' : 'Image'}
            </>
          )}
        </Button>
      </div>

      {/* Media Grid */}
      {uploadedMedia.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Uploaded Media</h4>
          <div className="grid grid-cols-3 gap-2">
            {uploadedMedia.map((url, index) => (
              <div
                key={index}
                onClick={() => onSelectMedia(url)}
                className={`
                  relative aspect-square border-2 rounded-lg overflow-hidden transition-all cursor-pointer group
                  ${selectedMedia === url
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'border-gray-200 hover:border-primary'
                  }
                `}
              >
                <img
                  src={url}
                  alt={`Media ${index + 1}`}
                  className="w-full h-full object-contain p-2"
                />
                {onMediaRemoved && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(url, e)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedMedia.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No media uploaded yet</p>
        </div>
      )}
    </div>
  );
}


