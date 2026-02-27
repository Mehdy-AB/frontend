'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { stampService } from '@/api/services/stampService';
import { CreateStampRequest, UpdateStampRequest, StampResponse } from '@/types/api';
import { useNotifications } from '@/hooks/useNotifications';
import { Loader2, Upload, X, Move, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { apiClient } from '@/api/client';

interface CreateStampModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editStamp?: StampResponse | null;
}

export default function CreateStampModal({
  isOpen,
  onClose,
  onSuccess,
  editStamp,
}: CreateStampModalProps) {
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [stampPosition, setStampPosition] = useState({ x: 0, y: 0 });
  const [isDraggingStamp, setIsDraggingStamp] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [formData, setFormData] = useState<CreateStampRequest>({
    name: '',
    description: '',
    stampType: 'TEXT',
    content: '',
    color: '#000000',
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    fontSize: 16,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    position: 'Bottom Right',
    opacity: 1.0,
    rotation: 0,
    width: 120,
    height: 60,
    category: '',
    language: 'en',
  });

  // Initialize form data when editing
  React.useEffect(() => {
    if (editStamp) {
      setFormData({
        name: editStamp.name || '',
        description: editStamp.description || '',
        stampType: editStamp.stampType as any || 'TEXT',
        content: editStamp.content || '',
        color: editStamp.color || '#000000',
        backgroundColor: editStamp.backgroundColor || '#ffffff',
        borderColor: editStamp.borderColor || '#000000',
        fontSize: editStamp.fontSize || 16,
        fontFamily: editStamp.fontFamily || 'Arial',
        fontWeight: editStamp.fontWeight || 'normal',
        position: editStamp.position || 'Bottom Right',
        opacity: editStamp.opacity || 1.0,
        rotation: editStamp.rotation || 0,
        width: editStamp.width || 120,
        height: editStamp.height || 60,
        category: editStamp.category || '',
        language: editStamp.language || 'en',
        imageUrl: editStamp.imageUrl || '',
      });
      if (editStamp.imageUrl) {
        setImagePreview(editStamp.imageUrl);
      }
    } else {
      // Reset form
      setFormData({
        name: '',
        description: '',
        stampType: 'TEXT',
        content: '',
        color: '#000000',
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        position: 'Bottom Right',
        opacity: 1.0,
        rotation: 0,
        width: 120,
        height: 60,
        category: '',
        language: 'en',
      });
      setImagePreview(null);
    }
  }, [editStamp, isOpen]);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please upload an image file');
      return;
    }

    setUploadingImage(true);
    try {
      // Create preview immediately for better UX
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const response = await stampService.uploadImage(file);

      // Update form data with the raw server URL (this is the actual URL we'll save)
      const serverImageUrl = response.imageUrl;
      setFormData(prev => ({ ...prev, imageUrl: serverImageUrl }));

      // Update preview to show the resolved display URL
      setImagePreview(response.displayUrl);

      showSuccess('Image Uploaded', 'Image has been uploaded successfully');
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload image. Please try again.';
      showError('Upload Failed', errorMessage);
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError('Validation Error', 'Stamp name is required');
      return;
    }

    if (formData.stampType === 'TEXT' && !formData.content?.trim()) {
      showError('Validation Error', 'Content is required for text stamps');
      return;
    }

    if (formData.stampType === 'IMAGE' && !imagePreview && !formData.imageUrl) {
      showError('Validation Error', 'Please upload an image or provide an image URL');
      return;
    }

    setLoading(true);
    try {
      if (editStamp) {
        // Update existing stamp
        const updateData: UpdateStampRequest = {
          name: formData.name,
          description: formData.description,
          content: formData.content,
          color: formData.color,
          backgroundColor: formData.backgroundColor,
          borderColor: formData.borderColor,
          fontSize: formData.fontSize,
          fontFamily: formData.fontFamily,
          fontWeight: formData.fontWeight,
          imageUrl: formData.imageUrl || undefined,
          position: formData.position,
          opacity: formData.opacity,
          rotation: formData.rotation,
          width: formData.width,
          height: formData.height,
          category: formData.category,
          isActive: editStamp.isActive,
        };
        await stampService.updateStamp(editStamp.id, updateData);
        showSuccess('Stamp Updated', 'The stamp has been updated successfully');
      } else {
        // Create new stamp
        const createData: CreateStampRequest = {
          ...formData,
          imageUrl: formData.imageUrl || undefined,
        };
        await stampService.createStamp(createData);
        showSuccess('Stamp Created', 'The stamp has been created successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to save stamp:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save stamp. Please try again.';
      showError('Save Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateStampRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStampMouseDown = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setIsDraggingStamp(true);
      setDragStart({
        x: e.clientX - rect.left - stampPosition.x,
        y: e.clientY - rect.top - stampPosition.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingStamp && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const A4_WIDTH = 595; // A4 width in pixels at 72 DPI
      const A4_HEIGHT = 842; // A4 height in pixels at 72 DPI
      const stampWidth = formData.width || 120;
      const stampHeight = formData.height || 60;
      const newX = Math.max(0, Math.min(e.clientX - rect.left - dragStart.x, A4_WIDTH - stampWidth));
      const newY = Math.max(0, Math.min(e.clientY - rect.top - dragStart.y, A4_HEIGHT - stampHeight));
      setStampPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingStamp(false);
  };

  const renderStampPreview = () => {
    if (formData.stampType === 'TEXT') {
      return (
        <div
          className="inline-block px-4 py-2 rounded border-2 font-bold cursor-move select-none"
          style={{
            color: formData.color || '#000',
            backgroundColor: formData.backgroundColor || 'transparent',
            borderColor: formData.borderColor || '#000',
            fontSize: `${formData.fontSize || 16}px`,
            fontFamily: formData.fontFamily || 'Arial',
            fontWeight: formData.fontWeight || 'bold',
            opacity: formData.opacity || 1,
            transform: `rotate(${formData.rotation || 0}deg)`,
            width: `${formData.width || 120}px`,
            height: `${formData.height || 60}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseDown={handleStampMouseDown}
        >
          {formData.content || 'Preview'}
        </div>
      );
    } else if (formData.stampType === 'IMAGE' && imagePreview) {
      return (
        <img
          src={imagePreview}
          alt="Stamp preview"
          className="cursor-move select-none"
          style={{
            width: `${formData.width || 120}px`,
            height: `${formData.height || 60}px`,
            objectFit: 'contain',
            opacity: formData.opacity || 1,
            transform: `rotate(${formData.rotation || 0}deg)`,
          }}
          onMouseDown={handleStampMouseDown}
          draggable={false}
        />
      );
    } else {
      return (
        <div className="w-24 h-24 bg-muted rounded flex items-center justify-center border-2 border-dashed">
          <Upload className="w-12 h-12 text-muted-foreground" />
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[98vw] !w-[98vw] !sm:max-w-[98vw] !md:max-w-[98vw] !lg:max-w-[98vw] max-h-[95vh] overflow-hidden p-0">
        <div className="flex h-[90vh]">
          {/* Left Panel - Editor */}
          <div className="w-[45%] min-w-[500px] border-r overflow-y-auto p-6 space-y-4">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle>{editStamp ? 'Edit Stamp' : 'Create New Stamp'}</DialogTitle>
              <DialogDescription>
                {editStamp ? 'Update stamp properties and preview' : 'Create a new stamp for document branding and approval'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Stamp Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Approved, Confidential"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Brief description of the stamp"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stampType">Stamp Type *</Label>
                    <Select
                      value={formData.stampType}
                      onValueChange={(value) => {
                        handleChange('stampType', value);
                        if (value !== 'IMAGE') {
                          setImagePreview(null);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEXT">Text</SelectItem>
                        <SelectItem value="IMAGE">Image</SelectItem>
                        <SelectItem value="DYNAMIC">Dynamic</SelectItem>
                        <SelectItem value="QR_CODE">QR Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      placeholder="e.g., Approval, Security"
                    />
                  </div>
                </div>
              </div>

              {/* Text Stamp Options */}
              {formData.stampType === 'TEXT' && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium">Text Settings</h3>

                  <div>
                    <Label htmlFor="content">Content *</Label>
                    <Input
                      id="content"
                      value={formData.content}
                      onChange={(e) => handleChange('content', e.target.value)}
                      placeholder="e.g., APPROVED, CONFIDENTIAL"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="fontSize">Font Size</Label>
                      <Input
                        id="fontSize"
                        type="number"
                        value={formData.fontSize}
                        onChange={(e) => handleChange('fontSize', parseInt(e.target.value) || 16)}
                        min="8"
                        max="72"
                      />
                    </div>

                    <div>
                      <Label htmlFor="fontFamily">Font Family</Label>
                      <Select
                        value={formData.fontFamily}
                        onValueChange={(value) => handleChange('fontFamily', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Courier New">Courier New</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="fontWeight">Font Weight</Label>
                      <Select
                        value={formData.fontWeight}
                        onValueChange={(value) => handleChange('fontWeight', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="bolder">Bolder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="color">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color"
                          type="color"
                          value={formData.color}
                          onChange={(e) => handleChange('color', e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.color}
                          onChange={(e) => handleChange('color', e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="backgroundColor">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={formData.backgroundColor}
                          onChange={(e) => handleChange('backgroundColor', e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.backgroundColor}
                          onChange={(e) => handleChange('backgroundColor', e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="borderColor">Border Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="borderColor"
                          type="color"
                          value={formData.borderColor}
                          onChange={(e) => handleChange('borderColor', e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.borderColor}
                          onChange={(e) => handleChange('borderColor', e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Stamp Options */}
              {formData.stampType === 'IMAGE' && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium">Image Settings</h3>

                  {/* Image Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {imagePreview ? (
                      <div className="space-y-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-32 mx-auto rounded"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImagePreview(null);
                            handleChange('imageUrl', '');
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Drag and drop an image here, or
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Browse
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <Label htmlFor="imageUrl">Or Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl || ''}
                      onChange={(e) => {
                        handleChange('imageUrl', e.target.value);
                        if (e.target.value) {
                          setImagePreview(e.target.value);
                        }
                      }}
                      placeholder="https://example.com/image.png"
                    />
                  </div>
                </div>
              )}

              {/* Position and Appearance */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Position & Appearance</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value) => handleChange('position', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Top Left">Top Left</SelectItem>
                        <SelectItem value="Top Center">Top Center</SelectItem>
                        <SelectItem value="Top Right">Top Right</SelectItem>
                        <SelectItem value="Center">Center</SelectItem>
                        <SelectItem value="Bottom Left">Bottom Left</SelectItem>
                        <SelectItem value="Bottom Center">Bottom Center</SelectItem>
                        <SelectItem value="Bottom Right">Bottom Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="opacity">Opacity (0-1)</Label>
                    <Input
                      id="opacity"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={formData.opacity}
                      onChange={(e) => handleChange('opacity', parseFloat(e.target.value) || 1.0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="width">Width (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={formData.width}
                      onChange={(e) => handleChange('width', parseInt(e.target.value) || 120)}
                      min="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="height">Height (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height}
                      onChange={(e) => handleChange('height', parseInt(e.target.value) || 60)}
                      min="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="rotation">Rotation (degrees)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="rotation"
                        type="number"
                        value={formData.rotation}
                        onChange={(e) => handleChange('rotation', parseInt(e.target.value) || 0)}
                        min="-180"
                        max="180"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleChange('rotation', ((formData.rotation || 0) + 90) % 360)}
                      >
                        <RotateCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editStamp ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editStamp ? 'Update Stamp' : 'Create Stamp'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-[55%] flex-1 bg-muted/30 p-6 flex flex-col">
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Live Preview</h3>
              <p className="text-sm text-muted-foreground">
                See how your stamp will look on documents
              </p>
            </div>

            {/* Document Preview Canvas - A4 Format */}
            <div className="flex-1 flex items-center justify-center bg-gray-100 p-4 overflow-auto">
              <div
                ref={canvasRef}
                className="bg-white shadow-lg relative"
                style={{
                  width: '595px', // A4 width at 72 DPI
                  height: '842px', // A4 height at 72 DPI
                  aspectRatio: '210 / 297', // A4 ratio
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Simulated Document Content */}
                <div className="absolute inset-0 p-8 text-sm text-gray-400">
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5 mt-6"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6 mt-6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mt-6"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mt-6"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5 mt-6"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>

                {/* Stamp Preview on Document */}
                <div
                  className="absolute"
                  style={{
                    left: `${Math.min(stampPosition.x, 595 - (formData.width || 120))}px`,
                    top: `${Math.min(stampPosition.y, 842 - (formData.height || 60))}px`,
                    cursor: isDraggingStamp ? 'grabbing' : 'grab',
                  }}
                >
                  {renderStampPreview()}
                </div>

                {/* Position Indicator */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Position: {Math.round(Math.min(stampPosition.x, 595 - (formData.width || 120)))}, {Math.round(Math.min(stampPosition.y, 842 - (formData.height || 60)))}
                </div>

                {/* A4 Label */}
                <div className="absolute top-2 right-2 bg-blue-500/80 text-white text-xs px-2 py-1 rounded">
                  A4 (210 × 297 mm)
                </div>
              </div>
            </div>

            {/* Quick Preview (Standalone) */}
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <p className="text-sm font-medium mb-2">Standalone Preview</p>
              <div className="flex items-center justify-center min-h-[100px] bg-gray-50 rounded">
                {renderStampPreview()}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
