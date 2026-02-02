'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Upload, Type, Image as ImageIcon,
  Palette, Layout, Settings, Sparkles, Copy, RotateCw,
  ZoomIn, ZoomOut, Move, Eye, Download, Grid, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { stampService } from '@/api/services/stampService';
import { useNotifications } from '@/hooks/useNotifications';
import { CreateStampRequest } from '@/types/api';

// Constants
const COLOR_PRESETS = {
  text: ['#000000', '#DC2626', '#059669', '#2563EB', '#7C3AED', '#D97706', '#475569'],
  background: ['#FFFFFF', '#FEF2F2', '#F0FDF4', '#EFF6FF', '#FAF5FF', '#FFFBEB', '#F8FAFC'],
  border: ['#000000', '#DC2626', '#059669', '#2563EB', '#7C3AED', '#D97706', '#64748B']
};

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Courier New', value: 'Courier New' }
];


const BORDER_STYLES = [
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
  { label: 'Double', value: 'double' }
];

const SHAPE_TYPES = [
  { label: 'Rectangle', value: 'rectangle' },
  { label: 'Rounded', value: 'rounded' },
  { label: 'Oval', value: 'oval' },
  { label: 'Diamond', value: 'diamond' }
];

const PLACEHOLDERS = [
  { label: 'Current Date', value: '{{DATE}}', preview: new Date().toLocaleDateString() },
  { label: 'Current Time', value: '{{TIME}}', preview: new Date().toLocaleTimeString() },
  { label: 'User Name', value: '{{USER}}', preview: 'John Doe' },
  { label: 'Document Name', value: '{{DOCUMENT}}', preview: 'Document.pdf' },
  { label: 'Year', value: '{{YEAR}}', preview: new Date().getFullYear().toString() }
];

const TEMPLATES = [
  { name: 'Approved', content: '✓ APPROVED', color: '#059669', bgColor: '#D1FAE5', borderColor: '#059669' },
  { name: 'Confidential', content: 'CONFIDENTIAL', color: '#DC2626', bgColor: '#FEE2E2', borderColor: '#DC2626' },
  { name: 'Draft', content: 'DRAFT', color: '#D97706', bgColor: '#FEF3C7', borderColor: '#D97706' },
  { name: 'Verified', content: '✓ VERIFIED', color: '#2563EB', bgColor: '#DBEAFE', borderColor: '#2563EB' },
  { name: 'Urgent', content: 'URGENT', color: '#DC2626', bgColor: '#FEE2E2', borderColor: '#DC2626' },
  { name: 'Completed', content: 'COMPLETED', color: '#059669', bgColor: '#D1FAE5', borderColor: '#059669' }
];

export default function CreateStampPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    stampType: 'TEXT' as 'TEXT' | 'IMAGE',
    content: 'SAMPLE TEXT',
    color: '#000000',
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    fontSize: 24,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    borderRadius: 8,
    borderWidth: 2,
    opacity: 1,
    rotation: 0,
    width: 200,
    height: 80,
    // Border style and shape
    borderStyle: 'solid' as 'solid' | 'dashed' | 'dotted' | 'double',
    shapeType: 'rectangle' as 'rectangle' | 'rounded' | 'oval' | 'diamond',
    // Text effects
    textShadow: false,
    textShadowX: 2,
    textShadowY: 2,
    textShadowBlur: 4,
    textShadowColor: '#00000080',
    textOutline: false,
    textOutlineWidth: 1,
    textOutlineColor: '#000000',
    // Box shadow
    shadowBlur: 0,
    shadowColor: '#00000020'
  });

  // Handlers
  const updateForm = (key: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (file: File) => {
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
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const response = await stampService.uploadImage(file);
      showSuccess('Success', 'Image uploaded successfully');
    } catch (error: any) {
      showError('Upload Failed', error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showError('Error', 'Stamp name is required');
      return;
    }

    if (form.stampType === 'TEXT' && !form.content.trim()) {
      showError('Error', 'Stamp content is required');
      return;
    }

    if (form.stampType === 'IMAGE' && !imagePreview) {
      showError('Error', 'Please upload an image');
      return;
    }

    setLoading(true);
    try {
      const stampData: CreateStampRequest = {
        name: form.name,
        description: form.description,
        stampType: form.stampType,
        content: form.content,
        color: form.color,
        backgroundColor: form.backgroundColor,
        borderColor: form.borderColor,
        fontSize: form.fontSize,
        fontFamily: form.fontFamily,
        fontWeight: form.fontWeight,
        position: 'Center',
        opacity: form.opacity,
        rotation: form.rotation,
        width: form.width,
        height: form.height,
        category: 'Custom',
        language: 'en'
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

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setForm(prev => ({
      ...prev,
      content: template.content,
      color: template.color,
      backgroundColor: template.bgColor,
      borderColor: template.borderColor
    }));
  };

  // Render preview
  const renderPreview = () => {
    const style: React.CSSProperties = {
      color: form.color,
      backgroundColor: form.backgroundColor,
      borderWidth: `${form.borderWidth}px`,
      borderStyle: 'solid',
      borderColor: form.borderColor,
      borderRadius: `${form.borderRadius}px`,
      fontSize: `${form.fontSize}px`,
      fontFamily: form.fontFamily,
      fontWeight: form.fontWeight,
      opacity: form.opacity,
      transform: `rotate(${form.rotation}deg)`,
      width: `${form.width}px`,
      height: `${form.height}px`,
      boxShadow: form.shadowBlur > 0 ?
        `0 4px ${form.shadowBlur}px ${form.shadowColor}` : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      textAlign: 'center' as const,
      wordBreak: 'break-word' as const,
      overflow: 'hidden'
    };

    if (form.stampType === 'TEXT') {
      return (
        <div style={style}>
          {form.content}
        </div>
      );
    } else if (imagePreview) {
      return (
        <div style={{ position: 'relative', ...style, borderWidth: 0, background: 'none' }}>
          <img
            src={imagePreview}
            alt="Stamp preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: `${form.borderRadius}px`,
              borderWidth: `${form.borderWidth}px`,
              borderStyle: 'solid',
              borderColor: form.borderColor
            }}
          />
        </div>
      );
    }

    return (
      <div
        style={{ ...style, borderStyle: 'dashed', cursor: 'pointer' }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 mx-auto mb-2" />
        <span className="text-sm">Upload Image</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
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
                <h1 className="text-2xl font-bold">Create New Stamp</h1>
                <p className="text-sm text-gray-500">Design and customize your stamp</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => router.push('/admin/documents/stamps')}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Design Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="w-4 h-4" />
                  Quick Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                    >
                      <div className="font-medium text-sm mb-2">{template.name}</div>
                      <div
                        className="px-3 py-2 rounded text-sm font-bold"
                        style={{
                          color: template.color,
                          backgroundColor: template.bgColor,
                          border: `2px solid ${template.borderColor}`
                        }}
                      >
                        {template.content}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Design Form */}
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="basic" className="text-xs">
                    <Settings className="w-3 h-3 mr-2" />
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="style" className="text-xs">
                    <Palette className="w-3 h-3 mr-2" />
                    Style
                  </TabsTrigger>
                  <TabsTrigger value="text" className="text-xs">
                    <Type className="w-3 h-3 mr-2" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="layout" className="text-xs">
                    <Layout className="w-3 h-3 mr-2" />
                    Layout
                  </TabsTrigger>
                </TabsList>

                {/* Basic Tab */}
                <TabsContent value="basic">
                  <Card>
                    <CardContent className="space-y-4 pt-6">
                      <div>
                        <Label htmlFor="name">Stamp Name *</Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => updateForm('name', e.target.value)}
                          placeholder="e.g., Approved Stamp"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={form.description}
                          onChange={(e) => updateForm('description', e.target.value)}
                          placeholder="Optional description"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Stamp Type</Label>
                        <div className="flex gap-4 mt-2">
                          <Button
                            type="button"
                            variant={form.stampType === 'TEXT' ? 'default' : 'outline'}
                            onClick={() => updateForm('stampType', 'TEXT')}
                            className="flex-1"
                          >
                            <Type className="w-4 h-4 mr-2" />
                            Text Stamp
                          </Button>
                          <Button
                            type="button"
                            variant={form.stampType === 'IMAGE' ? 'default' : 'outline'}
                            onClick={() => updateForm('stampType', 'IMAGE')}
                            className="flex-1"
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Image Stamp
                          </Button>
                        </div>
                      </div>

                      {form.stampType === 'IMAGE' && (
                        <div>
                          <Label>Upload Image</Label>
                          <div className="mt-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
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
                                  Choose Image
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Style Tab */}
                <TabsContent value="style">
                  <Card>
                    <CardContent className="space-y-6 pt-6">
                      {/* Color Picker Component */}
                      <div className="space-y-4">
                        <div>
                          <Label>Text Color</Label>
                          <div className="flex gap-2 mt-2">
                            <div className="flex gap-1 flex-wrap flex-1">
                              {COLOR_PRESETS.text.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => updateForm('color', color)}
                                  className={`w-8 h-8 rounded border ${form.color === color ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-105'
                                    }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <Input
                              type="color"
                              value={form.color}
                              onChange={(e) => updateForm('color', e.target.value)}
                              className="w-12 h-10 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Background Color</Label>
                          <div className="flex gap-2 mt-2">
                            <div className="flex gap-1 flex-wrap flex-1">
                              {COLOR_PRESETS.background.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => updateForm('backgroundColor', color)}
                                  className={`w-8 h-8 rounded border ${form.backgroundColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-105'
                                    }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <Input
                              type="color"
                              value={form.backgroundColor}
                              onChange={(e) => updateForm('backgroundColor', e.target.value)}
                              className="w-12 h-10 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Border Color</Label>
                          <div className="flex gap-2 mt-2">
                            <div className="flex gap-1 flex-wrap flex-1">
                              {COLOR_PRESETS.border.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => updateForm('borderColor', color)}
                                  className={`w-8 h-8 rounded border ${form.borderColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-105'
                                    }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <Input
                              type="color"
                              value={form.borderColor}
                              onChange={(e) => updateForm('borderColor', e.target.value)}
                              className="w-12 h-10 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div>
                          <Label>Border Width: {form.borderWidth}px</Label>
                          <Slider
                            value={[form.borderWidth]}
                            onValueChange={([value]) => updateForm('borderWidth', value)}
                            min={0}
                            max={10}
                            step={1}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>Border Radius: {form.borderRadius}px</Label>
                          <Slider
                            value={[form.borderRadius]}
                            onValueChange={([value]) => updateForm('borderRadius', value)}
                            min={0}
                            max={50}
                            step={1}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>Opacity: {Math.round(form.opacity * 100)}%</Label>
                          <Slider
                            value={[form.opacity]}
                            onValueChange={([value]) => updateForm('opacity', value)}
                            min={0.1}
                            max={1}
                            step={0.1}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>Shadow Blur: {form.shadowBlur}px</Label>
                          <Slider
                            value={[form.shadowBlur]}
                            onValueChange={([value]) => updateForm('shadowBlur', value)}
                            min={0}
                            max={20}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Text Tab */}
                <TabsContent value="text">
                  {form.stampType === 'TEXT' && (
                    <Card>
                      <CardContent className="space-y-4 pt-6">
                        <div>
                          <Label>Stamp Text</Label>
                          <Input
                            value={form.content}
                            onChange={(e) => updateForm('content', e.target.value)}
                            placeholder="Enter stamp text"
                            className="text-lg font-bold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Font Family</Label>
                            <Select
                              value={form.fontFamily}
                              onValueChange={(value) => updateForm('fontFamily', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FONT_FAMILIES.map((font) => (
                                  <SelectItem key={font.value} value={font.value}>
                                    {font.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Font Weight</Label>
                            <Select
                              value={form.fontWeight}
                              onValueChange={(value) => updateForm('fontWeight', value)}
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

                        <div>
                          <Label>Font Size: {form.fontSize}px</Label>
                          <Slider
                            value={[form.fontSize]}
                            onValueChange={([value]) => updateForm('fontSize', value)}
                            min={12}
                            max={72}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Layout Tab */}
                <TabsContent value="layout">
                  <Card>
                    <CardContent className="space-y-4 pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Width: {form.width}px</Label>
                          <Slider
                            value={[form.width]}
                            onValueChange={([value]) => updateForm('width', value)}
                            min={100}
                            max={500}
                            step={10}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>Height: {form.height}px</Label>
                          <Slider
                            value={[form.height]}
                            onValueChange={([value]) => updateForm('height', value)}
                            min={50}
                            max={300}
                            step={10}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Rotation: {form.rotation}°</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateForm('rotation', form.rotation - 15)}
                          >
                            -15°
                          </Button>
                          <Slider
                            value={[form.rotation]}
                            onValueChange={([value]) => updateForm('rotation', value)}
                            min={-180}
                            max={180}
                            step={1}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateForm('rotation', form.rotation + 15)}
                          >
                            +15°
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Live Preview
                  </span>
                  <Badge variant="secondary">
                    {form.stampType}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Zoom Controls */}
                <div className="flex items-center justify-between">
                  <Label>Zoom</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.max(50, zoom - 25))}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium w-12 text-center">
                      {zoom}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.min(200, zoom + 25))}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Document Preview */}
                <div
                  ref={canvasRef}
                  className="relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden"
                  style={{
                    width: '100%',
                    aspectRatio: '210/297',
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center'
                  }}
                >
                  {/* Document Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white p-8">
                    <div className="h-full w-full bg-white shadow-inner rounded">
                      {/* Simulated document content */}
                      <div className="p-6 space-y-3">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-2 bg-gray-200 rounded"
                            style={{ width: `${Math.random() * 40 + 60}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stamp Preview */}
                  <div className="absolute bottom-8 right-8">
                    {renderPreview()}
                  </div>
                </div>

                {/* Standalone Preview */}
                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium mb-3 block">Stamp Only</Label>
                  <div className="flex items-center justify-center min-h-[120px] bg-gray-50 rounded-lg border-2 border-dashed">
                    {renderPreview()}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setForm({
                        name: '',
                        description: '',
                        stampType: 'TEXT',
                        content: 'SAMPLE TEXT',
                        color: '#000000',
                        backgroundColor: '#FFFFFF',
                        borderColor: '#000000',
                        fontSize: 24,
                        fontFamily: 'Arial',
                        fontWeight: 'bold',
                        borderRadius: 8,
                        borderWidth: 2,
                        opacity: 1,
                        rotation: 0,
                        width: 200,
                        height: 80,
                        borderStyle: 'solid',
                        shapeType: 'rectangle',
                        textShadow: false,
                        textShadowX: 2,
                        textShadowY: 2,
                        textShadowBlur: 4,
                        textShadowColor: '#00000080',
                        textOutline: false,
                        textOutlineWidth: 1,
                        textOutlineColor: '#000000',
                        shadowBlur: 0,
                        shadowColor: '#00000020'
                      });
                      setImagePreview(null);
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // Add download functionality here
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}