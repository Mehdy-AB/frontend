'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StampResponse } from '@/types/api';
import { Badge } from '@/components/ui/badge';

interface PreviewStampModalProps {
  isOpen: boolean;
  onClose: () => void;
  stamp: StampResponse | null;
}

export default function PreviewStampModal({
  isOpen,
  onClose,
  stamp,
}: PreviewStampModalProps) {
  if (!stamp) return null;

  const renderStampPreview = () => {
    if (stamp.stampType === 'TEXT') {
      return (
        <div
          className="inline-block px-4 py-2 rounded border-2 font-bold"
          style={{
            color: stamp.color || '#000',
            backgroundColor: stamp.backgroundColor || 'transparent',
            borderColor: stamp.borderColor || '#000',
            fontSize: `${stamp.fontSize || 16}px`,
            fontFamily: stamp.fontFamily || 'Arial',
            fontWeight: stamp.fontWeight || 'bold',
            opacity: stamp.opacity || 1,
            transform: `rotate(${stamp.rotation || 0}deg)`,
            width: `${stamp.width || 120}px`,
            height: `${stamp.height || 60}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {stamp.content || stamp.name}
        </div>
      );
    } else if (stamp.stampType === 'IMAGE' && stamp.imageUrl) {
      return (
        <img
          src={stamp.imageUrl}
          alt={stamp.name}
          className="object-contain"
          style={{
            width: `${stamp.width || 120}px`,
            height: `${stamp.height || 60}px`,
            opacity: stamp.opacity || 1,
            transform: `rotate(${stamp.rotation || 0}deg)`,
          }}
        />
      );
    } else {
      return (
        <div className="w-24 h-24 bg-muted rounded flex items-center justify-center">
          <span className="text-muted-foreground">No preview available</span>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Stamp Preview</DialogTitle>
          <DialogDescription>
            Preview of {stamp.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed">
            {renderStampPreview()}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground mb-1">Type</p>
              <Badge>{stamp.stampType}</Badge>
            </div>
            <div>
              <p className="font-medium text-muted-foreground mb-1">Status</p>
              <Badge variant={stamp.isActive ? 'default' : 'secondary'}>
                {stamp.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {stamp.category && (
              <div>
                <p className="font-medium text-muted-foreground mb-1">Category</p>
                <p>{stamp.category}</p>
              </div>
            )}
            <div>
              <p className="font-medium text-muted-foreground mb-1">Usage Count</p>
              <p>{stamp.usageCount} times</p>
            </div>
            {stamp.width && stamp.height && (
              <div>
                <p className="font-medium text-muted-foreground mb-1">Size</p>
                <p>{stamp.width} × {stamp.height} px</p>
              </div>
            )}
            {stamp.opacity && (
              <div>
                <p className="font-medium text-muted-foreground mb-1">Opacity</p>
                <p>{(stamp.opacity * 100).toFixed(0)}%</p>
              </div>
            )}
          </div>

          {stamp.description && (
            <div>
              <p className="font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{stamp.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

