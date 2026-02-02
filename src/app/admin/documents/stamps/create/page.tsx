'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Upload, Type, Image as ImageIcon,
  FileText, Plus, Trash2, Eye, Download, Loader2, Maximize2, Minimize2, Sparkles
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { stampService } from '@/api/services/stampService';
import { useNotifications } from '@/hooks/useNotifications';
import { CreateStampRequest } from '@/types/api';
import { CanvasEditor } from '@/components/stamp-editor/CanvasEditor';
import { StampSettingsPanel } from '@/components/stamp-editor/StampSettingsPanel';
import { MediaLibrary } from '@/components/stamp-editor/MediaLibrary';
import { IconPicker } from '@/components/stamp-editor/IconPicker';
import { CanvasElement, CanvasSettings } from '@/types/stamp-editor';
import * as htmlToImage from 'html-to-image';
import '@/styles/stamp-editor.css';

// Simple ID generator
const generateId = () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// A4 size at 96 DPI: 210mm x 297mm = 794px x 1123px
const DEFAULT_CANVAS_WIDTH = 794;
const DEFAULT_CANVAS_HEIGHT = 1123;

export default function CreateStampPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<string[]>([]);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaLibraryMode, setMediaLibraryMode] = useState<'text' | 'image' | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [stampName, setStampName] = useState('');
  const [stampDescription, setStampDescription] = useState('');

  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    opacity: 1,
    defaultPosition: 'Center',
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
    rotation: 0,
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: 0,
    pagePlacement: 'all',
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleAddText = () => {
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      zIndex: elements.length,
      content: '<p>Click to edit text</p>',
      style: {
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
        backgroundColor: 'transparent',
        fontWeight: 'normal',
        textAlign: 'left',
      },
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
    setEditingElementId(newElement.id);
  };

  const handleAddImage = () => {
    setMediaLibraryMode('image');
    setShowMediaLibrary(true);
  };

  const handleAddIcon = () => {
    setShowIconPicker(true);
  };

  const handleSelectIcon = (iconName: string, IconComponent: React.ComponentType<any>) => {
    // Create SVG string from icon component
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- Icon paths will be inserted here --></svg>`;
    
    // For now, we'll store the icon name and render it as a component
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'icon',
      x: 100,
      y: 100,
      width: 48,
      height: 48,
      zIndex: elements.length,
      content: iconName, // Store icon name
      style: {
        color: '#000000',
        iconSize: 24,
      },
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
    setShowIconPicker(false);
  };

  const handleSelectMedia = (url: string) => {
    if (mediaLibraryMode === 'image') {
      const newElement: CanvasElement = {
        id: generateId(),
        type: 'image',
        x: 100,
        y: 100,
        width: 150,
        height: 150,
        zIndex: elements.length,
        content: url,
      };
      setElements([...elements, newElement]);
      setSelectedElementId(newElement.id);
      setShowMediaLibrary(false);
      setMediaLibraryMode(null);
    }
  };

  const handleMediaUploaded = (url: string) => {
    setUploadedMedia((prev) => [...prev, url]);
  };

  const handleElementSelect = (id: string | null) => {
    setSelectedElementId(id);
    if (id !== editingElementId) {
      setEditingElementId(null);
    }
  };

  const handleElementStartEdit = (id: string) => {
    setEditingElementId(id);
  };

  const handleElementStopEdit = () => {
    setEditingElementId(null);
  };

  const handleElementUpdate = (id: string, updates: Partial<CanvasElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const handleElementDelete = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
    if (editingElementId === id) {
      setEditingElementId(null);
    }
  };

  const handleInsertImage = (url: string) => {
    // This will be handled by the RichTextElement component
    // We just need to ensure the URL is available
    if (!uploadedMedia.includes(url)) {
      setUploadedMedia((prev) => [...prev, url]);
    }
  };

  const generateStampHTML = (): string => {
    const elementsHTML = elements
      .map((element) => {
        const style = [
          `position: absolute`,
          `left: ${element.x}px`,
          `top: ${element.y}px`,
          `z-index: ${element.zIndex}`,
          element.width ? `width: ${element.width}px` : '',
          element.height ? `height: ${element.height}px` : '',
          element.style?.color ? `color: ${element.style.color}` : '',
          element.style?.fontSize ? `font-size: ${element.style.fontSize}px` : '',
          element.style?.fontFamily ? `font-family: ${element.style.fontFamily}` : '',
          element.style?.fontWeight ? `font-weight: ${element.style.fontWeight}` : '',
          element.style?.textAlign ? `text-align: ${element.style.textAlign}` : '',
          element.style?.backgroundColor ? `background-color: ${element.style.backgroundColor}` : '',
        ]
          .filter(Boolean)
          .join('; ');

        if (element.type === 'text') {
          return `<div style="${style}">${element.content}</div>`;
        } else {
          return `<img src="${element.content}" style="${style}" alt="Stamp image" />`;
        }
      })
      .join('\n');

    const containerStyle = [
      `position: relative`,
      `width: ${canvasSettings.width}px`,
      `height: ${canvasSettings.height}px`,
      `background-color: ${canvasSettings.backgroundColor || '#FFFFFF'}`,
      canvasSettings.borderWidth ? `border: ${canvasSettings.borderWidth}px ${canvasSettings.borderStyle} ${canvasSettings.borderColor}` : '',
      canvasSettings.borderRadius ? `border-radius: ${canvasSettings.borderRadius}px` : '',
      `opacity: ${canvasSettings.opacity}`,
      canvasSettings.rotation ? `transform: rotate(${canvasSettings.rotation}deg)` : '',
    ]
      .filter(Boolean)
      .join('; ');

    return `<div style="${containerStyle}">${elementsHTML}</div>`;
  };

  const handleSave = async () => {
    if (!stampName.trim()) {
      showError('Error', 'Stamp name is required');
      return;
    }

    if (elements.length === 0) {
      showError('Error', 'Please add at least one element to the stamp');
      return;
    }

    setLoading(true);
    try {
      const stampHTML = generateStampHTML();

      const stampData: CreateStampRequest = {
        name: stampName,
        description: stampDescription,
        stampType: 'TEXT',
        content: stampHTML,
        opacity: canvasSettings.opacity,
        position: canvasSettings.defaultPosition,
        rotation: canvasSettings.rotation,
        width: canvasSettings.width,
        height: canvasSettings.height,
        backgroundColor: canvasSettings.backgroundColor,
        borderColor: canvasSettings.borderColor,
        category: 'Custom',
        language: 'en',
      };

      await stampService.createStamp(stampData);
      showSuccess('Success', 'Stamp created successfully');
      router.push('/admin/documents/stamps');
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Failed to create stamp');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Create a temporary container with actual size for export
      const tempContainer = document.createElement('div');
      tempContainer.style.width = `${canvasSettings.width}px`;
      tempContainer.style.height = `${canvasSettings.height}px`;
      tempContainer.style.position = 'relative';
      tempContainer.style.backgroundColor = canvasSettings.backgroundColor || '#FFFFFF';
      tempContainer.style.borderWidth = `${canvasSettings.borderWidth || 0}px`;
      tempContainer.style.borderStyle = canvasSettings.borderStyle || 'solid';
      tempContainer.style.borderColor = canvasSettings.borderColor || '#000000';
      tempContainer.style.borderRadius = `${canvasSettings.borderRadius || 0}px`;
      tempContainer.style.opacity = `${canvasSettings.opacity}`;
      tempContainer.style.transform = `rotate(${canvasSettings.rotation}deg)`;
      tempContainer.style.transformOrigin = 'center center';
      tempContainer.style.overflow = 'hidden';
      
      // Clone elements at full size
      elements.forEach((element) => {
        if (element.type === 'text') {
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.left = `${element.x}px`;
          div.style.top = `${element.y}px`;
          div.style.zIndex = `${element.zIndex}`;
          if (element.width) div.style.width = `${element.width}px`;
          if (element.height) div.style.height = `${element.height}px`;
          if (element.style?.color) div.style.color = element.style.color;
          if (element.style?.fontSize) div.style.fontSize = `${element.style.fontSize}px`;
          if (element.style?.fontFamily) div.style.fontFamily = element.style.fontFamily;
          if (element.style?.fontWeight) div.style.fontWeight = element.style.fontWeight;
          if (element.style?.textAlign) div.style.textAlign = element.style.textAlign;
          if (element.style?.backgroundColor) div.style.backgroundColor = element.style.backgroundColor;
          div.innerHTML = element.content;
          tempContainer.appendChild(div);
        } else if (element.type === 'icon') {
          // For icons, we need to render them as SVG
          const iconDiv = document.createElement('div');
          iconDiv.style.position = 'absolute';
          iconDiv.style.left = `${element.x}px`;
          iconDiv.style.top = `${element.y}px`;
          iconDiv.style.zIndex = `${element.zIndex}`;
          iconDiv.style.width = `${element.width || 48}px`;
          iconDiv.style.height = `${element.height || 48}px`;
          iconDiv.style.display = 'flex';
          iconDiv.style.alignItems = 'center';
          iconDiv.style.justifyContent = 'center';
          iconDiv.style.color = element.style?.color || '#000000';
          // We'll use a placeholder for now - in production, you'd render the actual icon SVG
          iconDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${element.style?.iconSize || 24}" height="${element.style?.iconSize || 24}" viewBox="0 0 24 24" fill="none" stroke="${element.style?.color || '#000000'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
          tempContainer.appendChild(iconDiv);
        } else {
          const img = document.createElement('img');
          img.src = element.content;
          img.style.position = 'absolute';
          img.style.left = `${element.x}px`;
          img.style.top = `${element.y}px`;
          img.style.zIndex = `${element.zIndex}`;
          if (element.width) img.style.width = `${element.width}px`;
          if (element.height) img.style.height = `${element.height}px`;
          img.style.objectFit = 'contain';
          tempContainer.appendChild(img);
        }
      });
      
      document.body.appendChild(tempContainer);
      
      const dataUrl = await htmlToImage.toPng(tempContainer, {
        backgroundColor: canvasSettings.backgroundColor || '#ffffff',
        quality: 1.0,
        pixelRatio: 2,
        width: canvasSettings.width,
        height: canvasSettings.height,
      });
      
      document.body.removeChild(tempContainer);

      const link = document.createElement('a');
      link.download = `${stampName || 'stamp'}.png`;
      link.href = dataUrl;
      link.click();

      showSuccess('Success', 'Stamp exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      showError('Error', 'Failed to export stamp');
    }
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Stamp Editor
                </h1>
                <p className="text-sm text-gray-500">Design your stamp with rich text and images</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Stamp name..."
                value={stampName}
                onChange={(e) => setStampName(e.target.value)}
                className="w-48"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2"
                disabled={elements.length === 0}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || !stampName.trim() || elements.length === 0}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Stamp
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Tools */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Elements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleAddText}
                >
                  <Type className="w-4 h-4" />
                  Add Text
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleAddImage}
                >
                  <ImageIcon className="w-4 h-4" />
                  Add Image
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleAddIcon}
                >
                  <Sparkles className="w-4 h-4" />
                  Add Icon
                </Button>
              </CardContent>
            </Card>

            {selectedElement && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Selected Element</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Type:</span> {selectedElement.type}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleElementDelete(selectedElement.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Optional description..."
                  value={stampDescription}
                  onChange={(e) => setStampDescription(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Center - Canvas */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Canvas</span>
                  <Badge variant="secondary">
                    {elements.length} element{elements.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center overflow-auto max-h-[800px] p-4">
                  <div className="border border-gray-200 rounded p-4 bg-gray-50 inline-block shadow-lg">
                    <div className="text-xs text-gray-500 mb-2 text-center">
                      A4 Size: {canvasSettings.width}px × {canvasSettings.height}px
                    </div>
                    <CanvasEditor
                      elements={elements}
                      selectedElementId={selectedElementId}
                      editingElementId={editingElementId}
                      canvasWidth={canvasSettings.width}
                      canvasHeight={canvasSettings.height}
                      onElementSelect={handleElementSelect}
                      onElementStartEdit={handleElementStartEdit}
                      onElementStopEdit={handleElementStopEdit}
                      onElementUpdate={handleElementUpdate}
                      onElementDelete={handleElementDelete}
                      onInsertImage={handleInsertImage}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center overflow-auto max-h-[400px] p-4">
                  <div
                    ref={previewRef}
                    className="border-2 border-gray-200 rounded-lg overflow-visible"
                    style={{
                      width: `${Math.min(canvasSettings.width, 600)}px`,
                      height: `${Math.min(canvasSettings.height, 400)}px`,
                      position: 'relative',
                      backgroundColor: canvasSettings.backgroundColor || '#FFFFFF',
                      borderWidth: `${canvasSettings.borderWidth || 0}px`,
                      borderStyle: canvasSettings.borderStyle || 'solid',
                      borderColor: canvasSettings.borderColor || '#000000',
                      borderRadius: `${canvasSettings.borderRadius || 0}px`,
                      opacity: canvasSettings.opacity,
                      transform: `rotate(${canvasSettings.rotation}deg)`,
                      transformOrigin: 'center center',
                    }}
                  >
                    {elements.map((element) => {
                      const scaleX = Math.min(canvasSettings.width, 600) / canvasSettings.width;
                      const scaleY = Math.min(canvasSettings.height, 400) / canvasSettings.height;
                      
                      const elementStyle: React.CSSProperties = {
                        position: 'absolute',
                        left: `${element.x * scaleX}px`,
                        top: `${element.y * scaleY}px`,
                        zIndex: element.zIndex,
                        width: element.width ? `${(element.width * scaleX)}px` : 'auto',
                        height: element.height ? `${(element.height * scaleY)}px` : 'auto',
                        color: element.style?.color || undefined,
                        fontSize: element.style?.fontSize ? `${(element.style.fontSize * Math.min(scaleX, scaleY))}px` : undefined,
                        fontFamily: element.style?.fontFamily || undefined,
                        fontWeight: element.style?.fontWeight || undefined,
                        textAlign: element.style?.textAlign || undefined,
                        backgroundColor: element.style?.backgroundColor || undefined,
                      };

                      if (element.type === 'text') {
                        return (
                          <div
                            key={element.id}
                            style={elementStyle}
                            dangerouslySetInnerHTML={{ __html: element.content }}
                          />
                        );
                      } else if (element.type === 'icon') {
                        const IconComponent = (LucideIcons as any)[element.content];
                        if (IconComponent) {
                          return (
                            <div
                              key={element.id}
                              style={{
                                ...elementStyle,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <IconComponent
                                size={element.style?.iconSize ? element.style.iconSize * Math.min(scaleX, scaleY) : 24}
                                color={element.style?.color || '#000000'}
                              />
                            </div>
                          );
                        }
                        return null;
                      } else {
                        return (
                          <img
                            key={element.id}
                            src={element.content}
                            alt="Stamp"
                            style={elementStyle}
                            className="object-contain"
                          />
                        );
                      }
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Settings */}
          <div className="lg:col-span-1">
            <StampSettingsPanel
              settings={canvasSettings}
              onChange={setCanvasSettings}
            />
          </div>
        </div>
      </div>

      {/* Media Library Dialog */}
      <Dialog open={showMediaLibrary} onOpenChange={setShowMediaLibrary}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
          </DialogHeader>
          <MediaLibrary
            uploadedMedia={uploadedMedia}
            onSelectMedia={handleSelectMedia}
            onMediaUploaded={handleMediaUploaded}
            insertMode={mediaLibraryMode === 'text' ? 'inline' : 'separate'}
          />
        </DialogContent>
      </Dialog>

      {/* Icon Picker Dialog */}
      <IconPicker
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        onSelectIcon={handleSelectIcon}
      />
    </div>
  );
}
