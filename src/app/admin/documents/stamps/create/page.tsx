'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Save, Upload, Type, Image as ImageIcon,
  FileText, Plus, Trash2, Eye, Download, Loader2, Maximize2, Minimize2, Sparkles,
  QrCode, Variable, Pen
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getIconSvgString } from '@/components/stamp-editor/utils/iconSvg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { stampService } from '@/api/services/stampService';
import { useNotifications } from '@/hooks/useNotifications';
import { CreateStampRequest } from '@/types/api';
import { CanvasEditor } from '@/components/stamp-editor/CanvasEditor';
import { StampSettingsPanel } from '@/components/stamp-editor/StampSettingsPanel';
import { MediaLibrary } from '@/components/stamp-editor/MediaLibrary';
import { IconPicker } from '@/components/stamp-editor/IconPicker';
import { SignaturePad } from '@/components/stamp-editor/SignaturePad';
import { CanvasElement, CanvasSettings } from '@/types/stamp-editor';
import * as htmlToImage from 'html-to-image';
import '@/styles/stamp-editor.css';

// Simple ID generator
const generateId = () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Initial stamp size — auto-sizes based on content
const DEFAULT_CANVAS_WIDTH = 300;
const DEFAULT_CANVAS_HEIGHT = 150;
const CANVAS_PADDING = 20; // Padding around content bounding box
const MIN_CANVAS_WIDTH = 150;
const MIN_CANVAS_HEIGHT = 80;

export default function CreateStampPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<string[]>([]);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaLibraryMode, setMediaLibraryMode] = useState<'text' | 'image' | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [stampName, setStampName] = useState('');
  const [stampDescription, setStampDescription] = useState('');
  const [stampType, setStampType] = useState<'TEXT' | 'DYNAMIC' | 'QR_CODE'>('TEXT');
  const [qrContent, setQrContent] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  // Store pending uploads: blobUrl -> File
  const pendingUploads = useRef<Map<string, File>>(new Map());
  const [dynamicVariables] = useState([
    { name: 'date', label: 'Current Date', example: '2026-02-14' },
    { name: 'datetime', label: 'Date & Time', example: '2026-02-14T14:30:00' },
    { name: 'time', label: 'Current Time', example: '14:30:00' },
    { name: 'username', label: 'Username', example: 'john.doe' },
    { name: 'fullname', label: 'Full Name', example: 'John Doe' },
    { name: 'email', label: 'Email', example: 'john@example.com' },
    { name: 'year', label: 'Year', example: '2026' },
    { name: 'month', label: 'Month', example: 'FEBRUARY' },
    { name: 'day', label: 'Day', example: '14' },
  ]);

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

  // Helper to create a single text element (fallback when HTML can't be parsed into individual elements)
  const createSingleTextElement = (data: any, importedW: number, importedH: number, cX: (w: number) => number, cY: (h: number) => number) => {
    const elW = Math.min(importedW || 300, 600);
    const elH = Math.min(importedH || 80, 200);
    const importedElement: CanvasElement = {
      id: generateId(),
      type: 'text',
      x: cX(elW),
      y: cY(elH),
      width: elW,
      height: elH,
      zIndex: 0,
      content: data.content,
      style: {
        fontSize: data.fontSize || data.font?.size || 16,
        fontFamily: data.fontFamily || data.font?.family || 'Arial',
        color: data.color || data.colors?.text || '#000000',
        backgroundColor: 'transparent',
        fontWeight: data.fontWeight || data.font?.weight || 'normal',
        textAlign: 'left',
      },
    };
    setElements([importedElement]);
    setSelectedElementId(importedElement.id);
  };

  // Load imported JSON data from sessionStorage when ?import=true
  useEffect(() => {
    if (searchParams.get('import') === 'true') {
      try {
        const raw = sessionStorage.getItem('stamp_import_data');
        if (raw) {
          const data = JSON.parse(raw);
          sessionStorage.removeItem('stamp_import_data');

          // Pre-fill form fields
          setStampName(data.name || '');
          setStampDescription(data.description || '');
          setStampType(data.stampType || 'TEXT');

          // Pre-fill canvas settings (from either top-level, nested canvas, or appearance object)
          const canvasData = data.canvas || {};
          const appearance = data.appearance || {};
          const importedW = data.width ?? canvasData.width ?? appearance.width ?? 400;
          const importedH = data.height ?? canvasData.height ?? appearance.height ?? 200;
          setCanvasSettings(prev => ({
            ...prev,
            opacity: data.opacity ?? canvasData.opacity ?? appearance.opacity ?? prev.opacity,
            defaultPosition: data.position || canvasData.defaultPosition || appearance.position || prev.defaultPosition,
            rotation: data.rotation ?? canvasData.rotation ?? appearance.rotation ?? prev.rotation,
            width: importedW,
            height: importedH,
            backgroundColor: data.backgroundColor || canvasData.backgroundColor || prev.backgroundColor,
            borderColor: data.borderColor || canvasData.borderColor || prev.borderColor,
            borderWidth: canvasData.borderWidth ?? prev.borderWidth,
            borderStyle: canvasData.borderStyle || prev.borderStyle,
            borderRadius: canvasData.borderRadius ?? prev.borderRadius,
          }));

          // Helper: center on imported canvas
          const cX = (elW: number) => Math.max(0, Math.round((importedW - elW) / 2));
          const cY = (elH: number) => Math.max(0, Math.round((importedH - elH) / 2));

          // Restore canvas elements: prefer the full elements array from the export
          if (data.elements && Array.isArray(data.elements) && data.elements.length > 0) {
            // Re-generate IDs to avoid conflicts
            const imported = data.elements.map((el: any, idx: number) => ({
              ...el,
              id: generateId() + '_' + idx,
              // Ensure element is positioned within canvas bounds
              x: Math.max(0, Math.min(el.x ?? 10, importedW - 20)),
              y: Math.max(0, Math.min(el.y ?? 10, importedH - 20)),
            }));
            setElements(imported);
            setSelectedElementId(imported[0].id);
          } else if (data.editorElements && typeof data.editorElements === 'string') {
            // Parse editorElements JSON string (from list page export or API)
            try {
              const parsed = JSON.parse(data.editorElements);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const imported = parsed.map((el: any, idx: number) => ({
                  ...el,
                  id: generateId() + '_' + idx,
                  x: Math.max(0, Math.min(el.x ?? 10, importedW - 20)),
                  y: Math.max(0, Math.min(el.y ?? 10, importedH - 20)),
                }));
                setElements(imported);
                setSelectedElementId(imported[0].id);
              }
            } catch (e) {
              console.warn('Failed to parse editorElements from import:', e);
            }
          } else if (data.content && (
            data.content.startsWith('data:image') ||
            (data.stampType || data.type) === 'QR_CODE' ||
            (data.stampType || data.type) === 'IMAGE'
          )) {
            // Base64 image content (QR code or imported image)
            const isBase64 = data.content.startsWith('data:image');
            // If content is HTML containing an img src, extract it
            let imgSrc = data.content;
            if (!isBase64) {
              const srcMatch = data.content.match(/src="(data:image[^"]+)"/);
              if (srcMatch) imgSrc = srcMatch[1];
            }
            const elW = Math.min(importedW || 200, 400);
            const elH = Math.min(importedH || 200, 400);
            const importedElement: CanvasElement = {
              id: generateId(),
              type: 'image',
              x: cX(elW),
              y: cY(elH),
              width: elW,
              height: elH,
              zIndex: 0,
              content: imgSrc,
            };
            setElements([importedElement]);
            setSelectedElementId(importedElement.id);
          } else if (data.content) {
            // Fallback: if HTML content has positioned divs, try to parse individual elements
            const hasAbsolutePositioning = data.content.includes('position: absolute') || data.content.includes('position:absolute');
            if (hasAbsolutePositioning) {
              // Parse positioned elements from HTML
              const parser = new DOMParser();
              const doc = parser.parseFromString(data.content, 'text/html');
              const positioned = doc.querySelectorAll('[style*="position"]');
              if (positioned.length > 0) {
                const parsedElements: CanvasElement[] = [];
                positioned.forEach((node, idx) => {
                  const style = (node as HTMLElement).style;
                  const x = parseInt(style.left) || 10;
                  const y = parseInt(style.top) || 10;
                  const w = parseInt(style.width) || 200;
                  const h = parseInt(style.height) || 50;
                  const img = node.querySelector('img');
                  if (img) {
                    parsedElements.push({
                      id: generateId() + '_' + idx,
                      type: 'image',
                      x: Math.max(0, Math.min(x, importedW - 20)),
                      y: Math.max(0, Math.min(y, importedH - 20)),
                      width: w,
                      height: h,
                      zIndex: idx,
                      content: img.src || img.getAttribute('src') || '',
                    });
                  } else {
                    parsedElements.push({
                      id: generateId() + '_' + idx,
                      type: 'text',
                      x: Math.max(0, Math.min(x, importedW - 20)),
                      y: Math.max(0, Math.min(y, importedH - 20)),
                      width: w,
                      height: h,
                      zIndex: idx,
                      content: (node as HTMLElement).innerHTML,
                      style: {
                        fontSize: parseInt(style.fontSize) || 16,
                        fontFamily: style.fontFamily || 'Arial',
                        color: style.color || '#000000',
                        backgroundColor: style.backgroundColor || 'transparent',
                        fontWeight: style.fontWeight || 'normal',
                        textAlign: (style.textAlign as any) || 'left',
                      },
                    });
                  }
                });
                if (parsedElements.length > 0) {
                  setElements(parsedElements);
                  setSelectedElementId(parsedElements[0].id);
                } else {
                  // Couldn't parse, fallback to single element
                  createSingleTextElement(data, importedW, importedH, cX, cY);
                }
              } else {
                createSingleTextElement(data, importedW, importedH, cX, cY);
              }
            } else {
              createSingleTextElement(data, importedW, importedH, cX, cY);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load imported stamp data:', e);
      }
    }
  }, [searchParams]);

  // Auto-size canvas to hug elements tightly
  useEffect(() => {
    if (elements.length === 0) {
      // Reset to small default when empty
      setCanvasSettings(prev => ({
        ...prev,
        width: DEFAULT_CANVAS_WIDTH,
        height: DEFAULT_CANVAS_HEIGHT,
      }));
      return;
    }

    // Calculate bounding box of all elements
    let maxRight = 0;
    let maxBottom = 0;

    elements.forEach(el => {
      const elRight = el.x + (el.width || 100);
      const elBottom = el.y + (el.height || 50);
      if (elRight > maxRight) maxRight = elRight;
      if (elBottom > maxBottom) maxBottom = elBottom;
    });

    const newWidth = Math.max(MIN_CANVAS_WIDTH, maxRight + CANVAS_PADDING);
    const newHeight = Math.max(MIN_CANVAS_HEIGHT, maxBottom + CANVAS_PADDING);

    setCanvasSettings(prev => ({
      ...prev,
      width: Math.ceil(newWidth),
      height: Math.ceil(newHeight),
    }));
  }, [elements]);

  const handleAddText = () => {
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'text',
      x: 10,
      y: elements.length === 0 ? 10 : canvasSettings.height - CANVAS_PADDING + 5,
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

  const handleSignatureSave = (dataUrl: string) => {
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'image',
      x: 10,
      y: elements.length === 0 ? 10 : canvasSettings.height - CANVAS_PADDING + 5,
      width: 200,
      height: 80,
      zIndex: elements.length,
      content: dataUrl,
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  // Generate QR code and add to canvas
  const handleGenerateQr = async () => {
    if (!qrContent.trim()) {
      showError('Error', 'Please enter content for the QR code');
      return;
    }
    setQrLoading(true);
    try {
      const result = await stampService.generateQrCode(qrContent, 200, 200);
      // Cap QR size to fit within canvas
      const maxDim = Math.max(100, canvasSettings.width - 2 * CANVAS_PADDING);
      const qrSize = Math.min(200, maxDim);
      const newElement: CanvasElement = {
        id: generateId(),
        type: 'image',
        x: 10,
        y: elements.length === 0 ? 10 : canvasSettings.height - CANVAS_PADDING + 5,
        width: qrSize,
        height: qrSize,
        zIndex: elements.length,
        content: result.qrImage,
      };
      setElements([...elements, newElement]);
      setSelectedElementId(newElement.id);
      setStampType('QR_CODE');
      showSuccess('QR Code', 'QR code generated and added to canvas');
    } catch (error) {
      showError('Error', 'Failed to generate QR code. Make sure the backend is running.');
    } finally {
      setQrLoading(false);
    }
  };

  // Insert dynamic variable into a text element
  const handleInsertVariable = (variableName: string) => {
    const varText = `{{${variableName}}}`;
    // Always create a new separate element for each variable
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'text',
      x: 10,
      y: elements.length === 0 ? 10 : canvasSettings.height - CANVAS_PADDING + 5,
      width: 200,
      height: 50,
      zIndex: elements.length,
      content: `<p>${varText}</p>`,
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
    setStampType('DYNAMIC');
  };

  const handleSelectIcon = (iconName: string, IconComponent: React.ComponentType<any>) => {
    // Create SVG string from icon component
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- Icon paths will be inserted here --></svg>`;

    // For now, we'll store the icon name and render it as a component
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'icon',
      x: 10,
      y: elements.length === 0 ? 10 : canvasSettings.height - CANVAS_PADDING + 5,
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
      // Cap image dimensions to fit within canvas
      const maxW = Math.max(50, canvasSettings.width - 2 * CANVAS_PADDING);
      const imgW = Math.min(150, maxW);
      const imgH = Math.min(150, maxW);
      const newElement: CanvasElement = {
        id: generateId(),
        type: 'image',
        x: 10,
        y: elements.length === 0 ? 10 : canvasSettings.height - CANVAS_PADDING + 5,
        width: imgW,
        height: imgH,
        zIndex: elements.length,
        content: url,
      };
      setElements([...elements, newElement]);
      setSelectedElementId(newElement.id);
      setShowMediaLibrary(false);
      setMediaLibraryMode(null);
    }
  };

  // Handle deferred upload: store file locally and return blob URL
  const handleDeferredUpload = async (file: File): Promise<string> => {
    const blobUrl = URL.createObjectURL(file);
    pendingUploads.current.set(blobUrl, file);
    return blobUrl;
  };

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      pendingUploads.current.forEach((_file, blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
      pendingUploads.current.clear();
    };
  }, []);

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

  const generateStampHTML = (currentElements: CanvasElement[] = elements): string => {
    const elementsHTML = currentElements
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
        } else if (element.type === 'icon') {
          const iconSize = element.style?.iconSize || 24;
          const iconColor = element.style?.color || '#000000';
          const iconSvg = getIconSvgString(element.content, iconSize, iconColor);
          return `<div style="${style}; display: flex; align-items: center; justify-content: center;">${iconSvg}</div>`;
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

  /** Render all canvas elements into a single PNG data URL. */
  const renderCanvasToPng = async (currentElements: CanvasElement[]): Promise<string> => {
    const tempContainer = document.createElement('div');
    tempContainer.style.width = `${canvasSettings.width}px`;
    tempContainer.style.height = `${canvasSettings.height}px`;
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.backgroundColor = canvasSettings.backgroundColor || '#FFFFFF';
    tempContainer.style.borderWidth = `${canvasSettings.borderWidth || 0}px`;
    tempContainer.style.borderStyle = canvasSettings.borderStyle || 'solid';
    tempContainer.style.borderColor = canvasSettings.borderColor || '#000000';
    tempContainer.style.borderRadius = `${canvasSettings.borderRadius || 0}px`;
    tempContainer.style.overflow = 'hidden';

    currentElements.forEach((element) => {
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
        iconDiv.innerHTML = getIconSvgString(element.content, element.style?.iconSize || 24, element.style?.color || '#000000');
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

    try {
      // Wait for images to load
      const images = tempContainer.querySelectorAll('img');
      if (images.length > 0) {
        await Promise.all(Array.from(images).map(img =>
          img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
        ));
      }

      const dataUrl = await htmlToImage.toPng(tempContainer, {
        backgroundColor: undefined,
        quality: 1.0,
        pixelRatio: 2,
        width: canvasSettings.width,
        height: canvasSettings.height,
      });

      return dataUrl;
    } finally {
      document.body.removeChild(tempContainer);
    }
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
      // 1) Process pending uploads FIRST so blob URLs become real server URLs.
      //    html-to-image cannot render blob: URLs (SVG foreignObject security).
      const updatedElements = [...elements];
      const processedUrls = new Map<string, string>(); // blobUrl -> serverUrl

      for (let i = 0; i < updatedElements.length; i++) {
        const el = updatedElements[i];
        if (el.type === 'image' && el.content && pendingUploads.current.has(el.content)) {
          const blobUrl = el.content;

          if (!processedUrls.has(blobUrl)) {
            const file = pendingUploads.current.get(blobUrl);
            if (file) {
              const response = await stampService.uploadImage(file);
              processedUrls.set(blobUrl, response.displayUrl);
            }
          }

          // Update element content with real server URL
          if (processedUrls.has(blobUrl)) {
            updatedElements[i] = {
              ...el,
              content: processedUrls.get(blobUrl)!,
            };
          }
        }
      }

      // Update state with confirmed URLs
      setElements(updatedElements);



      // 2) Regenerate HTML with server URLs
      const stampHTML = generateStampHTML(updatedElements);

      // For QR_CODE stamps, send raw base64 as content so the backend
      // doesn't regenerate a different QR from the HTML string.
      let contentToSend = stampHTML;
      if (stampType === 'QR_CODE') {
        const qrEl = updatedElements.find(el => el.type === 'image' && el.content?.startsWith('data:'));
        if (qrEl) contentToSend = qrEl.content;
      }

      const stampData: CreateStampRequest = {
        name: stampName,
        description: stampDescription,
        stampType: stampType,
        content: contentToSend,
        editorElements: JSON.stringify(updatedElements),

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
      const dataUrl = await renderCanvasToPng(elements);
      const link = document.createElement('a');
      link.download = `${stampName || 'stamp'}.png`;
      link.href = dataUrl;
      link.click();
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
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setShowSignaturePad(true)}
                >
                  <Pen className="w-4 h-4" />
                  Draw Signature
                </Button>
              </CardContent>
            </Card>

            {/* Stamp Type Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stamp Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={stampType} onValueChange={(v) => setStampType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Text Stamp</SelectItem>

                    <SelectItem value="DYNAMIC">Dynamic Stamp</SelectItem>
                    <SelectItem value="QR_CODE">QR Code Stamp</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* QR Code Panel */}
            {(stampType === 'QR_CODE') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm">Content (URL or text)</Label>
                    <Input
                      placeholder="https://example.com"
                      value={qrContent}
                      onChange={(e) => setQrContent(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleGenerateQr}
                    disabled={qrLoading || !qrContent.trim()}
                    className="w-full gap-2"
                  >
                    {qrLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <QrCode className="w-4 h-4" />
                    )}
                    Generate QR Code
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Generates a QR code image and adds it to the canvas.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Dynamic Variables Panel */}
            {(stampType === 'DYNAMIC') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Variable className="w-4 h-4" />
                    Template Variables
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Click a variable to insert it. Variables resolve when the stamp is applied.
                  </p>
                  {dynamicVariables.map((v) => (
                    <Button
                      key={v.name}
                      variant="outline"
                      size="sm"
                      className="w-full justify-between text-xs"
                      onClick={() => handleInsertVariable(v.name)}
                    >
                      <span className="font-mono">{`{{${v.name}}}`}</span>
                      <span className="text-muted-foreground">{v.example}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

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
                <div className="stamp-canvas-wrapper overflow-auto max-h-[800px] p-4">
                  <div className="border border-gray-200 rounded p-4 bg-gray-50 inline-block shadow-lg">
                    <div className="text-xs text-gray-500 mb-2 text-center">
                      Stamp Size: {canvasSettings.width}px × {canvasSettings.height}px (auto)
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
                <div className="stamp-canvas-wrapper overflow-auto max-h-[400px] p-4">
                  <div
                    ref={previewRef}
                    className="border-2 border-gray-200 rounded-lg overflow-visible"
                    style={{
                      width: `${canvasSettings.width}px`,
                      height: `${canvasSettings.height}px`,
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
                      const elementStyle: React.CSSProperties = {
                        position: 'absolute',
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        zIndex: element.zIndex,
                        width: element.width ? `${element.width}px` : 'auto',
                        height: element.height ? `${element.height}px` : 'auto',
                        color: element.style?.color || undefined,
                        fontSize: element.style?.fontSize ? `${element.style.fontSize}px` : undefined,
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
                                size={element.style?.iconSize || 24}
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
            onUploadFile={handleDeferredUpload}
          />
        </DialogContent>
      </Dialog>

      {/* Icon Picker Dialog */}
      <IconPicker
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        onSelectIcon={handleSelectIcon}
      />

      {/* Signature Pad Dialog */}
      <SignaturePad
        open={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        onSave={handleSignatureSave}
      />
    </div>
  );
}
