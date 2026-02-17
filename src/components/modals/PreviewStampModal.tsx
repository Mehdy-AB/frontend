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
import { resolveStampImageUrl } from '@/api/services/stampService';

/**
 * Resolve image URLs inside HTML content strings.
 * Finds <img src="..."> with proxy paths or raw object names
 * and converts them to absolute backend URLs.
 */
function resolveContentImageUrls(html: string | null | undefined): string {
  if (!html) return '';
  // Match src attributes in img tags
  return html.replace(/src="([^"]+)"/g, (match, url) => {
    const resolved = resolveStampImageUrl(url);
    return resolved ? `src="${resolved}"` : match;
  });
}

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
    const hasHtmlContent = stamp.content && stamp.content.trim().startsWith('<');

    if (stamp.stampType === 'TEXT') {
      if (hasHtmlContent) {
        const w = stamp.width || 800;
        const h = stamp.height || 400;
        // Scale down to fit inside the modal (max preview width ~480px)
        const maxDisplay = 480;
        const scale = Math.min(1, maxDisplay / w);
        return (
          <div
            className="border rounded overflow-hidden bg-white mx-auto"
            style={{
              width: `${w * scale}px`,
              height: `${h * scale}px`,
              position: 'relative',
              opacity: stamp.opacity || 1,
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: `${w}px`,
                height: `${h}px`,
              }}
              dangerouslySetInnerHTML={{ __html: resolveContentImageUrls(stamp.content) }}
            />
          </div>
        );
      }
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
            maxWidth: '100%',
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
    } else if (stamp.stampType === 'IMAGE') {
      // If stamp was edited in canvas editor (has editorElements), render the HTML content
      const hasEditorEls = stamp.editorElements && hasHtmlContent;
      if (hasEditorEls) {
        const w = stamp.width || 800;
        const h = stamp.height || 400;
        const maxDisplay = 480;
        const scale = Math.min(1, maxDisplay / w);
        return (
          <div
            className="border rounded overflow-hidden bg-white mx-auto"
            style={{
              width: `${w * scale}px`,
              height: `${h * scale}px`,
              position: 'relative',
              opacity: stamp.opacity || 1,
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: `${w}px`,
                height: `${h}px`,
              }}
              dangerouslySetInnerHTML={{ __html: resolveContentImageUrls(stamp.content) }}
            />
          </div>
        );
      }
      // Non-edited IMAGE stamp — show original image
      if (stamp.imageUrl) {
        return (
          <img
            src={resolveStampImageUrl(stamp.imageUrl) || ''}
            alt={stamp.name}
            className="object-contain"
            style={{
              maxWidth: '100%',
              maxHeight: '400px',
              width: `${stamp.width || 120}px`,
              height: `${stamp.height || 60}px`,
              opacity: stamp.opacity || 1,
              transform: `rotate(${stamp.rotation || 0}deg)`,
            }}
          />
        );
      }
      // Fallback: legacy IMAGE stamps with HTML content but no imageUrl
      if (hasHtmlContent) {
        const w = stamp.width || 800;
        const h = stamp.height || 400;
        const maxDisplay = 480;
        const scale = Math.min(1, maxDisplay / w);
        return (
          <div
            className="border rounded overflow-hidden bg-white mx-auto"
            style={{
              width: `${w * scale}px`,
              height: `${h * scale}px`,
              position: 'relative',
              opacity: stamp.opacity || 1,
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: `${w}px`,
                height: `${h}px`,
              }}
              dangerouslySetInnerHTML={{ __html: resolveContentImageUrls(stamp.content) }}
            />
          </div>
        );
      }
      return (
        <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
          <span className="text-muted-foreground">No preview available</span>
        </div>
      );
    } else if (stamp.stampType === 'QR_CODE' && stamp.content) {
      const isDataUri = stamp.content.startsWith('data:');
      if (isDataUri) {
        return (
          <div
            className="bg-white p-4 rounded"
            style={{
              maxWidth: '100%',
              width: `${stamp.width || 200}px`,
              height: `${stamp.height || 200}px`,
            }}
          >
            <img
              src={stamp.content}
              alt={stamp.name}
              className="w-full h-full object-contain"
            />
          </div>
        );
      }
      // Fallback for non-data-URI QR content (just text)
      return (
        <div
          className="bg-white p-4 rounded border-2 border-dashed flex items-center justify-center"
          style={{
            maxWidth: '100%',
            width: `${stamp.width || 200}px`,
            height: `${stamp.height || 200}px`,
          }}
        >
          <span className="text-muted-foreground text-sm text-center">{stamp.content}</span>
        </div>
      );
    } else if (stamp.stampType === 'DYNAMIC') {
      if (hasHtmlContent) {
        const w = stamp.width || 400;
        const h = stamp.height || 300;
        const maxDisplay = 480;
        const scale = Math.min(1, maxDisplay / w);
        return (
          <div
            className="border rounded overflow-hidden bg-white mx-auto"
            style={{
              width: `${w * scale}px`,
              height: `${h * scale}px`,
              position: 'relative',
              opacity: stamp.opacity || 1,
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: `${w}px`,
                height: `${h}px`,
              }}
              dangerouslySetInnerHTML={{ __html: resolveContentImageUrls(stamp.content) }}
            />
          </div>
        );
      }
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
            maxWidth: '100%',
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
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stamp Preview</DialogTitle>
          <DialogDescription>
            Preview of {stamp.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed overflow-hidden">
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

