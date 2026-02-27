'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Save, Upload, Type, Image as ImageIcon,
    FileText, Plus, Trash2, Eye, Download, Loader2, Maximize2, Minimize2, Sparkles, ChevronDown,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { stampService, resolveStampImageUrl } from '@/api/services/stampService';
import { useNotifications } from '@/hooks/useNotifications';
import { UpdateStampRequest, StampResponse } from '@/types/api';
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

// A4 size at 96 DPI: 210mm x 297mm = 794px x 1123px
const DEFAULT_CANVAS_WIDTH = 794;
const DEFAULT_CANVAS_HEIGHT = 1123;

export default function EditStampPage() {
    const router = useRouter();
    const params = useParams();
    const stampId = Number(params.id);
    const { showSuccess, showError } = useNotifications();

    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [stamp, setStamp] = useState<StampResponse | null>(null);
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
    const [stampCategory, setStampCategory] = useState('Custom');
    const [stampType, setStampType] = useState<'TEXT' | 'DYNAMIC' | 'QR_CODE' | 'IMAGE'>('TEXT');
    const [qrContent, setQrContent] = useState('');
    const [qrLoading, setQrLoading] = useState(false);
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

    // Store pending uploads: blobUrl -> File
    const pendingUploads = useRef<Map<string, File>>(new Map());

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

    // Resolve image URLs embedded inside HTML content strings to absolute backend URLs
    const resolveContentImageUrls = (html: string | null | undefined): string => {
        if (!html) return '';
        return html.replace(/src="([^"]+)"/g, (_match: string, url: string) => {
            const resolved = resolveStampImageUrl(url);
            return resolved ? `src="${resolved}"` : _match;
        });
    };

    // Load existing stamp data
    useEffect(() => {
        const loadStamp = async () => {
            try {
                setInitialLoading(true);
                const data = await stampService.getStampById(stampId);
                setStamp(data);
                setStampName(data.name);
                setStampDescription(data.description || '');
                setStampCategory(data.category || 'Custom');
                setStampType((data.stampType as any) || 'TEXT');

                // Restore canvas settings
                setCanvasSettings(prev => ({
                    ...prev,
                    opacity: data.opacity || 1,
                    defaultPosition: (data.position as any) || 'Center',
                    width: data.width || DEFAULT_CANVAS_WIDTH,
                    height: data.height || DEFAULT_CANVAS_HEIGHT,
                    rotation: data.rotation || 0,
                    backgroundColor: data.backgroundColor || '#FFFFFF',
                    borderColor: data.borderColor || '#000000',
                }));

                // Canvas dimensions from loaded data
                const canvasW = data.width || DEFAULT_CANVAS_WIDTH;
                const canvasH = data.height || DEFAULT_CANVAS_HEIGHT;

                // Helper: center an element on the canvas
                const centerX = (elW: number) => Math.max(0, Math.round((canvasW - elW) / 2));
                const centerY = (elH: number) => Math.max(0, Math.round((canvasH - elH) / 2));

                // Reconstruct canvas elements — prefer saved editorElements JSON for exact positioning
                if (data.editorElements) {
                    try {
                        const parsed = JSON.parse(data.editorElements) as CanvasElement[];
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            // Re-generate IDs to avoid stale references, resolve image URLs
                            const restored = parsed.map((el, idx) => ({
                                ...el,
                                id: generateId() + '_' + idx,
                                content: el.type === 'image'
                                    ? (resolveStampImageUrl(el.content) || el.content)
                                    : resolveContentImageUrls(el.content),
                            }));
                            setElements(restored);
                            setSelectedElementId(restored[0].id);
                            return; // editorElements takes precedence — skip fallback
                        }
                    } catch (parseErr) {
                        console.warn('Failed to parse editorElements, falling back to content parsing', parseErr);
                    }
                }

                // Fallback: reconstruct elements from stamp type + content (for stamps saved before editorElements existed)
                if (data.stampType === 'QR_CODE' && data.content) {
                    // Backend may store raw base64 OR HTML containing an <img src="data:...">
                    let qrSrc: string | null = null;
                    if (data.content.trim().startsWith('data:image')) {
                        qrSrc = data.content.trim();
                    } else {
                        const srcMatch = data.content.match(/src="(data:image[^"]+)"/);
                        qrSrc = srcMatch ? srcMatch[1] : null;
                    }
                    if (qrSrc) {
                        const elW = Math.min(data.width || 200, canvasW - 20);
                        const elH = Math.min(data.height || 200, canvasH - 20);
                        const newElement: CanvasElement = {
                            id: generateId(),
                            type: 'image',
                            x: centerX(elW),
                            y: centerY(elH),
                            width: elW,
                            height: elH,
                            zIndex: 0,
                            content: qrSrc,
                        };
                        setElements([newElement]);
                    }
                } else if (data.stampType === 'IMAGE' && data.imageUrl) {
                    const elW = data.width || 200;
                    const elH = data.height || 200;
                    const newElement: CanvasElement = {
                        id: generateId(),
                        type: 'image',
                        x: centerX(elW),
                        y: centerY(elH),
                        width: elW,
                        height: elH,
                        zIndex: 0,
                        content: resolveStampImageUrl(data.imageUrl) || data.imageUrl,
                    };
                    setElements([newElement]);
                } else if (data.content) {
                    const elW = Math.min(data.width || 400, canvasW - 40);
                    const elH = Math.min(data.height || 200, canvasH - 40);
                    const newElement: CanvasElement = {
                        id: generateId(),
                        type: 'text',
                        x: centerX(elW),
                        y: centerY(elH),
                        width: elW,
                        height: elH,
                        zIndex: 0,
                        content: resolveContentImageUrls(data.content),
                        style: {
                            fontSize: data.fontSize || 16,
                            fontFamily: data.fontFamily || 'Arial',
                            color: data.color || '#000000',
                            backgroundColor: 'transparent',
                            fontWeight: data.fontWeight || 'normal',
                            textAlign: 'left',
                        },
                    };
                    setElements([newElement]);
                }
            } catch (error: any) {
                showError('Error', 'Failed to load stamp data');
                router.push('/admin/documents/stamps');
            } finally {
                setInitialLoading(false);
            }
        };

        if (stampId) {
            loadStamp();
        }
    }, [stampId]);

    // Auto-size canvas to fit all elements (expand AND shrink, but never below minimums)
    const CANVAS_PADDING = 20;
    const MIN_CANVAS_WIDTH = 200;
    const MIN_CANVAS_HEIGHT = 100;
    useEffect(() => {
        if (elements.length === 0 || initialLoading) return;
        let maxRight = 0;
        let maxBottom = 0;
        elements.forEach(el => {
            maxRight = Math.max(maxRight, (el.x || 0) + (el.width || 100));
            maxBottom = Math.max(maxBottom, (el.y || 0) + (el.height || 50));
        });
        const neededW = Math.max(MIN_CANVAS_WIDTH, Math.ceil(maxRight + CANVAS_PADDING));
        const neededH = Math.max(MIN_CANVAS_HEIGHT, Math.ceil(maxBottom + CANVAS_PADDING));
        setCanvasSettings(prev => {
            if (neededW !== prev.width || neededH !== prev.height) {
                return {
                    ...prev,
                    width: neededW,
                    height: neededH,
                };
            }
            return prev;
        });
    }, [elements, initialLoading]);

    // Compute Y for a new element: stack below the lowest existing element
    const nextElementY = () => {
        if (elements.length === 0) return CANVAS_PADDING;
        let maxBottom = 0;
        elements.forEach(el => {
            maxBottom = Math.max(maxBottom, (el.y || 0) + (el.height || 50));
        });
        return maxBottom + 10;
    };

    const handleAddText = () => {
        const y = nextElementY();
        const newElement: CanvasElement = {
            id: generateId(),
            type: 'text',
            x: CANVAS_PADDING,
            y,
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
        const updated = [...elements, newElement];
        setElements(updated);
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
        const y = nextElementY();
        const newElement: CanvasElement = {
            id: generateId(),
            type: 'image',
            x: CANVAS_PADDING,
            y,
            width: 200,
            height: 80,
            zIndex: elements.length,
            content: dataUrl,
        };
        const updated = [...elements, newElement];
        setElements(updated);
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
            const y = nextElementY();
            // Cap QR size to fit within canvas
            const maxDim = Math.max(100, canvasSettings.width - 2 * CANVAS_PADDING);
            const qrSize = Math.min(200, maxDim);
            const newElement: CanvasElement = {
                id: generateId(),
                type: 'image',
                x: CANVAS_PADDING,
                y,
                width: qrSize,
                height: qrSize,
                zIndex: elements.length,
                content: result.qrImage,
            };
            const updated = [...elements, newElement];
            setElements(updated);
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
        const y = nextElementY();
        const newElement: CanvasElement = {
            id: generateId(),
            type: 'text',
            x: CANVAS_PADDING,
            y,
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
        const updated = [...elements, newElement];
        setElements(updated);
        setSelectedElementId(newElement.id);
        setStampType('DYNAMIC');

    };

    const handleSelectIcon = (iconName: string, IconComponent: React.ComponentType<any>) => {
        const y = nextElementY();
        const newElement: CanvasElement = {
            id: generateId(),
            type: 'icon',
            x: CANVAS_PADDING,
            y,
            width: 48,
            height: 48,
            zIndex: elements.length,
            content: iconName,
            style: {
                color: '#000000',
                iconSize: 24,
            },
        };
        const updated = [...elements, newElement];
        setElements(updated);
        setSelectedElementId(newElement.id);
        setShowIconPicker(false);

    };

    const handleSelectMedia = (url: string) => {
        if (mediaLibraryMode === 'image') {
            const y = nextElementY();
            // Cap image dimensions to fit within canvas
            const maxW = Math.max(50, canvasSettings.width - 2 * CANVAS_PADDING);
            const imgW = Math.min(150, maxW);
            const imgH = Math.min(150, maxW);
            const newElement: CanvasElement = {
                id: generateId(),
                type: 'image',
                x: CANVAS_PADDING,
                y,
                width: imgW,
                height: imgH,
                zIndex: elements.length,
                content: url,
            };
            const updated = [...elements, newElement];
            setElements(updated);
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

            const stampData: UpdateStampRequest = {
                name: stampName,
                description: stampDescription,
                content: contentToSend,
                editorElements: JSON.stringify(updatedElements),

                opacity: canvasSettings.opacity,
                position: canvasSettings.defaultPosition,
                rotation: canvasSettings.rotation,
                width: canvasSettings.width,
                height: canvasSettings.height,
                backgroundColor: canvasSettings.backgroundColor,
                borderColor: canvasSettings.borderColor,
                category: stampCategory,
            };

            await stampService.updateStamp(stampId, stampData);
            showSuccess('Success', 'Stamp updated successfully');
            router.push('/admin/documents/stamps');
        } catch (error: any) {
            showError('Error', error.response?.data?.message || 'Failed to update stamp');
        } finally {
            setLoading(false);
        }
    };

    const handleExportImage = async () => {
        try {
            const dataUrl = await renderCanvasToPng(elements);
            const link = document.createElement('a');
            link.download = `${stampName || 'stamp'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Export error:', error);
            showError('Error', 'Failed to export stamp as image');
        }
    };

    const handleExportTemplate = () => {
        try {
            const exportData = {
                name: stampName,
                description: '',
                stampType: stamp?.stampType || 'TEXT',
                content: generateStampHTML(),
                appearance: {
                    width: canvasSettings.width,
                    height: canvasSettings.height,
                    opacity: canvasSettings.opacity,
                    rotation: canvasSettings.rotation,
                },
                canvas: canvasSettings,
                elements: elements,
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${(stampName || 'stamp').replace(/\s+/g, '_')}_template.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export template error:', error);
            showError('Error', 'Failed to export stamp template');
        }
    };

    const selectedElement = elements.find((el) => el.id === selectedElementId);

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading stamp editor...</p>
                </div>
            </div>
        );
    }

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
                                    Edit Stamp
                                </h1>
                                <p className="text-sm text-gray-500">Modify your stamp design</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Input
                                placeholder="Stamp name..."
                                value={stampName}
                                onChange={(e) => setStampName(e.target.value)}
                                className="w-48"
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        disabled={elements.length === 0}
                                    >
                                        <Download className="w-4 h-4" />
                                        Export
                                        <ChevronDown className="w-3 h-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleExportImage} className="gap-2 cursor-pointer">
                                        <ImageIcon className="w-4 h-4" />
                                        <div>
                                            <p className="font-medium">Download as Image</p>
                                            <p className="text-xs text-muted-foreground">PNG with transparent background</p>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleExportTemplate} className="gap-2 cursor-pointer">
                                        <FileText className="w-4 h-4" />
                                        <div>
                                            <p className="font-medium">Download Template</p>
                                            <p className="text-xs text-muted-foreground">JSON file for backup or sharing</p>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                                        Save Changes
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
                                        <SelectItem value="IMAGE">Image Stamp</SelectItem>
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
