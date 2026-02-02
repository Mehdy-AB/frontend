'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { stampService } from '@/api/services/stampService';
import { useNotifications } from '@/hooks/useNotifications';

interface IconLibraryProps {
  uploadedIcons: string[];
  onSelectIcon: (iconUrl: string) => void;
  onIconUploaded: (iconUrl: string) => void;
  selectedIcon?: string;
}

const BUILT_IN_ICONS = [
  // You can add icon URLs or use Lucide icons as SVGs
  'check', 'x', 'star', 'heart', 'shield', 'lock', 'unlock',
  'alert-circle', 'info', 'warning', 'check-circle', 'x-circle'
];

export function IconLibrary({ 
  uploadedIcons, 
  onSelectIcon, 
  onIconUploaded,
  selectedIcon 
}: IconLibraryProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useNotifications();

  const handleIconUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please select an image file (PNG, JPG, SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const response = await stampService.uploadImage(file);
      onIconUploaded(response.imageUrl);
      showSuccess('Success', 'Icon uploaded successfully');
    } catch (error: any) {
      showError('Upload Failed', error.response?.data?.message || 'Failed to upload icon');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleIconUpload(e.target.files[0])}
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
              Upload Custom Icon
            </>
          )}
        </Button>
      </div>

      {/* Uploaded Icons Grid */}
      {uploadedIcons.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Your Icons</h4>
          <div className="grid grid-cols-4 gap-2">
            {uploadedIcons.map((iconUrl, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSelectIcon(iconUrl)}
                className={`
                  relative aspect-square border-2 rounded-lg overflow-hidden transition-all
                  ${selectedIcon === iconUrl ? 'border-primary ring-2 ring-primary' : 'border-gray-200 hover:border-primary'}
                `}
              >
                <img
                  src={iconUrl}
                  alt={`Icon ${index + 1}`}
                  className="w-full h-full object-contain p-2"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


