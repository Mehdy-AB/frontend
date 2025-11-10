'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: File) => void;
}

export function ImageCropDialog({ isOpen, onClose, imageSrc, onCropComplete }: ImageCropDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isOpen && imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        drawCanvas();
      };
      img.src = imageSrc;
    }
  }, [isOpen, imageSrc]);

  useEffect(() => {
    if (imageRef.current) {
      drawCanvas();
    }
  }, [zoom]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    // Calculate dimensions to fit image
    const scale = Math.max(size / img.width, size / img.height) * zoom;
    const x = (size - img.width * scale) / 2;
    const y = (size - img.height * scale) / 2;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw image
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

    // Draw crop overlay (darken area outside the circle)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, size, size);

    // Cut out circle in the middle
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';

    // Draw circle border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.stroke();
  };

  const handleCropSave = async () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    try {
      setIsProcessing(true);

      // Create a new canvas for the cropped image
      const cropCanvas = document.createElement('canvas');
      const size = 400;
      cropCanvas.width = size;
      cropCanvas.height = size;

      const ctx = cropCanvas.getContext('2d');
      if (!ctx) throw new Error('No 2d context');

      // Calculate dimensions
      const scale = Math.max(size / img.width, size / img.height) * zoom;
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;

      // Draw the image
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Create circular mask
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        cropCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas is empty'));
        }, 'image/png', 0.95);
      });

      const croppedFile = new File([blob], 'profile-photo.png', {
        type: 'image/png',
      });

      onCropComplete(croppedFile);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Profile Photo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Canvas for crop preview */}
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="border rounded-lg"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

          {/* Zoom control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Zoom</span>
              <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[zoom]}
                onValueChange={handleZoomChange}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleCropSave} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Crop & Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
