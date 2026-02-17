'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { useRouter } from 'next/navigation';
import {
  Stamp,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Image,
  Eye,
  EyeOff,
  Type,
  Copy,
  BarChart3,
  Download,
  Upload,
  Loader2,
  History,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  FileText,
  Clock,
  Lock,
  Verified,
  Save,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { stampService, resolveStampImageUrl } from '@/api/services/stampService';
import { StampResponse, CreateStampRequest, StampApplicationResponse } from '@/types/api';
import { useNotifications } from '@/hooks/useNotifications';
import PreviewStampModal from '@/components/modals/PreviewStampModal';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import UserAvatar from '@/components/main/UserAvatar';

/** Resolve image URLs inside HTML content strings for export rendering. */
function resolveContentImageUrls(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/src="([^"]+)"/g, (match, url) => {
    const resolved = resolveStampImageUrl(url);
    return resolved ? `src="${resolved}"` : match;
  });
}

const categories = ['All', 'Approval', 'Security', 'Status', 'Branding', 'Custom'];
const stampTypes = ['All', 'TEXT', 'IMAGE', 'DYNAMIC', 'QR_CODE'];

// Predefined stamp templates
const STAMP_TEMPLATES: Array<{
  name: string;
  content: string;
  category: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon: React.ReactNode;
}> = [
    {
      name: 'APPROVED',
      content: 'APPROVED',
      category: 'Approval',
      color: '#16a34a',
      backgroundColor: '#f0fdf4',
      borderColor: '#16a34a',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    },
    {
      name: 'REJECTED',
      content: 'REJECTED',
      category: 'Approval',
      color: '#dc2626',
      backgroundColor: '#fef2f2',
      borderColor: '#dc2626',
      icon: <XCircle className="w-5 h-5 text-red-600" />,
    },
    {
      name: 'CONFIDENTIAL',
      content: 'CONFIDENTIAL',
      category: 'Security',
      color: '#ea580c',
      backgroundColor: '#fff7ed',
      borderColor: '#ea580c',
      icon: <ShieldAlert className="w-5 h-5 text-orange-600" />,
    },
    {
      name: 'DRAFT',
      content: 'DRAFT',
      category: 'Status',
      color: '#6b7280',
      backgroundColor: '#f9fafb',
      borderColor: '#6b7280',
      icon: <FileText className="w-5 h-5 text-gray-500" />,
    },
    {
      name: 'FINAL',
      content: 'FINAL',
      category: 'Status',
      color: '#2563eb',
      backgroundColor: '#eff6ff',
      borderColor: '#2563eb',
      icon: <Verified className="w-5 h-5 text-blue-600" />,
    },
    {
      name: 'PENDING REVIEW',
      content: 'PENDING REVIEW',
      category: 'Status',
      color: '#d97706',
      backgroundColor: '#fffbeb',
      borderColor: '#d97706',
      icon: <Clock className="w-5 h-5 text-amber-600" />,
    },
    {
      name: 'RESTRICTED',
      content: 'RESTRICTED',
      category: 'Security',
      color: '#7c3aed',
      backgroundColor: '#f5f3ff',
      borderColor: '#7c3aed',
      icon: <Lock className="w-5 h-5 text-purple-600" />,
    },
    {
      name: 'FOR INTERNAL USE ONLY',
      content: 'FOR INTERNAL USE ONLY',
      category: 'Security',
      color: '#0891b2',
      backgroundColor: '#ecfeff',
      borderColor: '#0891b2',
      icon: <ShieldAlert className="w-5 h-5 text-cyan-600" />,
    },
  ];

export default function DocumentStampsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { showSuccess, showError } = useNotifications();
  const [expandedStamps, setExpandedStamps] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState<StampResponse | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [pageSize, setPageSize] = useState(20);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStamp, setHistoryStamp] = useState<StampResponse | null>(null);
  const [applications, setApplications] = useState<StampApplicationResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showImageImportModal, setShowImageImportModal] = useState(false);
  const [importImagePreview, setImportImagePreview] = useState<string | null>(null);
  const [importImageName, setImportImageName] = useState('');
  const [importImageOpacity, setImportImageOpacity] = useState(1);
  const [importImageFile, setImportImageFile] = useState<File | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStampId, setDeleteStampId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStamp, setExportStamp] = useState<StampResponse | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const filterRef = useRef({ selectedCategory, selectedType, selectedStatus });

  // Update ref when filters change
  useEffect(() => {
    filterRef.current = { selectedCategory, selectedType, selectedStatus };
  }, [selectedCategory, selectedType, selectedStatus]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await stampService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Use server-side search hook
  const {
    displayData: stamps,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalElements,
    loading,
    tableLoading,
    error,
    fetchData,
    removeItem
  } = useServerSideSearch<StampResponse>({
    fetchFunction: useCallback(async (currentPage, searchTerm) => {
      const isActive = selectedStatus === 'All' ? undefined : selectedStatus === 'Active';
      const response = await stampService.getAllStamps(
        currentPage,
        pageSize,
        searchTerm || undefined,
        selectedCategory !== 'All' ? selectedCategory : undefined,
        selectedType !== 'All' ? selectedType : undefined,
        isActive
      );
      return response;
    }, [pageSize, selectedCategory, selectedType, selectedStatus]),
    searchFields: (stamp) => [
      stamp.name,
      stamp.description || '',
      stamp.category || ''
    ],
    debounceMs: 800
  });

  // Refetch when filters change
  useEffect(() => {
    setPage(0);
    fetchData(true);
  }, [selectedCategory, selectedType, selectedStatus, pageSize]);

  const handleToggleExpand = (id: number) => {
    setExpandedStamps(prev =>
      prev.includes(id)
        ? prev.filter(stampId => stampId !== id)
        : [...prev, id]
    );
  };

  const handleToggleActive = async (id: number) => {
    try {
      await stampService.toggleStampActive(id);
      showSuccess('Status Updated', 'Stamp status has been updated successfully');
      fetchData(false);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to toggle stamp status:', error);
      showError('Update Failed', 'Failed to update stamp status. Please try again.');
    }
  };

  const handleDeleteStamp = (id: number) => {
    setDeleteStampId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteStamp = async () => {
    if (deleteStampId === null) return;
    setDeleteLoading(true);
    try {
      await stampService.deleteStamp(deleteStampId);
      showSuccess('Stamp Deleted', 'The stamp has been deleted successfully');
      removeItem(deleteStampId);
      fetchStatistics();
    } catch (error: any) {
      console.error('Failed to delete stamp:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete stamp. Please try again.';
      showError('Deletion Failed', errorMessage);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteStampId(null);
    }
  };

  const handleEditStamp = (stamp: StampResponse) => {
    router.push(`/admin/documents/stamps/${stamp.id}/edit`);
  };

  const handlePreviewStamp = (stamp: StampResponse) => {
    setSelectedStamp(stamp);
    setIsPreviewModalOpen(true);
  };

  const handleDuplicateStamp = async (stamp: StampResponse) => {
    try {
      const duplicateData: CreateStampRequest = {
        name: `${stamp.name} (Copy)`,
        description: stamp.description || '',
        stampType: stamp.stampType,
        content: stamp.content || '',
        color: stamp.color || '#000000',
        backgroundColor: stamp.backgroundColor || '#ffffff',
        borderColor: stamp.borderColor || '#000000',
        fontSize: stamp.fontSize || 16,
        fontFamily: stamp.fontFamily || 'Arial',
        fontWeight: stamp.fontWeight || 'normal',
        imageUrl: stamp.imageUrl || '',
        position: stamp.position || 'Bottom Right',
        opacity: stamp.opacity || 1.0,
        rotation: stamp.rotation || 0,
        width: stamp.width || 120,
        height: stamp.height || 60,
        category: stamp.category || '',
        language: stamp.language || 'en',
      };

      await stampService.createStamp(duplicateData);
      showSuccess('Stamp Duplicated', 'The stamp has been duplicated successfully');
      fetchData(false);
      fetchStatistics();
    } catch (error: any) {
      console.error('Failed to duplicate stamp:', error);
      const errorMessage = error.response?.data?.message || 'Failed to duplicate stamp. Please try again.';
      showError('Duplication Failed', errorMessage);
    }
  };

  const handleExportStamp = (stamp: StampResponse) => {
    setExportStamp(stamp);
    setShowExportModal(true);
  };

  const handleExportAsImage = async (stamp: StampResponse) => {
    setExportLoading(true);
    try {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';

      const hasHtmlContent = stamp.content && stamp.content.trim().startsWith('<');

      if (hasHtmlContent) {
        // Render the full HTML content
        tempContainer.innerHTML = resolveContentImageUrls(stamp.content);
        const innerDiv = tempContainer.firstElementChild as HTMLElement;
        if (innerDiv) {
          innerDiv.style.backgroundColor = 'transparent';
        }
      } else if (stamp.stampType === 'IMAGE' && stamp.imageUrl) {
        const img = document.createElement('img');
        img.src = resolveStampImageUrl(stamp.imageUrl) || '';
        img.crossOrigin = 'anonymous';
        img.style.width = `${stamp.width || 200}px`;
        img.style.height = `${stamp.height || 100}px`;
        img.style.objectFit = 'contain';
        tempContainer.appendChild(img);
      } else if (stamp.stampType === 'QR_CODE' && stamp.content?.startsWith('data:')) {
        const img = document.createElement('img');
        img.src = stamp.content;
        img.style.width = `${stamp.width || 200}px`;
        img.style.height = `${stamp.height || 200}px`;
        tempContainer.appendChild(img);
      } else {
        // Plain text stamp
        const div = document.createElement('div');
        div.style.color = stamp.color || '#000';
        div.style.backgroundColor = 'transparent';
        div.style.borderWidth = '2px';
        div.style.borderStyle = 'solid';
        div.style.borderColor = stamp.borderColor || '#000';
        div.style.borderRadius = '4px';
        div.style.padding = '8px 16px';
        div.style.fontSize = `${stamp.fontSize || 16}px`;
        div.style.fontFamily = stamp.fontFamily || 'Arial';
        div.style.fontWeight = stamp.fontWeight || 'bold';
        div.style.display = 'inline-flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.width = `${stamp.width || 200}px`;
        div.style.height = `${stamp.height || 80}px`;
        div.textContent = stamp.content || stamp.name;
        tempContainer.appendChild(div);
      }

      document.body.appendChild(tempContainer);

      // Wait for images to load
      const images = tempContainer.querySelectorAll('img');
      if (images.length > 0) {
        await Promise.all(Array.from(images).map(img =>
          img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
        ));
      }

      const target = (tempContainer.children.length === 1 ? tempContainer.firstElementChild : tempContainer) as HTMLElement;
      const dataUrl = await htmlToImage.toPng(target, {
        backgroundColor: undefined, // transparent
        quality: 1.0,
        pixelRatio: 2,
      });

      document.body.removeChild(tempContainer);

      const link = document.createElement('a');
      link.download = `${stamp.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();

      setShowExportModal(false);
    } catch (error) {
      console.error('Failed to export stamp as image:', error);
      showError('Export Failed', 'Failed to export stamp as image. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportAsTemplate = (stamp: StampResponse) => {
    try {
      const exportData = {
        name: stamp.name,
        description: stamp.description,
        type: stamp.stampType,
        stampType: stamp.stampType,
        content: stamp.content,
        // Include individual element data for round-trip editing
        elements: stamp.editorElements ? (() => { try { return JSON.parse(stamp.editorElements); } catch { return undefined; } })() : undefined,
        editorElements: stamp.editorElements,
        colors: {
          text: stamp.color,
          background: stamp.backgroundColor,
          border: stamp.borderColor,
        },
        font: {
          family: stamp.fontFamily,
          size: stamp.fontSize,
          weight: stamp.fontWeight,
        },
        appearance: {
          position: stamp.position,
          opacity: stamp.opacity,
          rotation: stamp.rotation,
          width: stamp.width,
          height: stamp.height,
        },
        category: stamp.category,
        imageUrl: stamp.imageUrl,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${stamp.name.replace(/\s+/g, '_')}_stamp.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowExportModal(false);
    } catch (error) {
      console.error('Failed to export stamp:', error);
      showError('Export Failed', 'Failed to export stamp. Please try again.');
    }
  };

  // Import stamp — dual mode (image vs JSON)
  const handleImportStamp = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const imageExtensions = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'];

    if (imageExtensions.includes(extension || '')) {
      // --- Image import: show preview modal ---
      const reader = new FileReader();
      reader.onload = (e) => {
        setImportImagePreview(e.target?.result as string);
        setImportImageName(file.name.replace(/\.[^/.]+$/, ''));
        setImportImageOpacity(1);
        setImportImageFile(file);
        setShowImageImportModal(true);
      };
      reader.readAsDataURL(file);
    } else if (extension === 'json') {
      // --- JSON import: parse and redirect to editor ---
      setImportLoading(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Store parsed data in sessionStorage so the create page can pick it up
        const importPayload = {
          name: data.name || 'Imported Stamp',
          description: data.description || '',
          stampType: data.type || data.stampType || 'TEXT',
          content: data.content || data.name || '',
          color: data.colors?.text || data.color || '#000000',
          backgroundColor: data.colors?.background || data.backgroundColor || '#ffffff',
          borderColor: data.colors?.border || data.borderColor || '#000000',
          fontSize: data.font?.size || data.fontSize || 16,
          fontFamily: data.font?.family || data.fontFamily || 'Arial',
          fontWeight: data.font?.weight || data.fontWeight || 'normal',
          imageUrl: data.imageUrl || '',
          position: data.appearance?.position || data.position || 'Center',
          opacity: data.appearance?.opacity || data.opacity || 1.0,
          rotation: data.appearance?.rotation || data.rotation || 0,
          width: data.appearance?.width || data.width || 200,
          height: data.appearance?.height || data.height || 100,
          category: data.category || 'Custom',
          language: data.language || 'en',
        };

        sessionStorage.setItem('stamp_import_data', JSON.stringify(importPayload));
        showSuccess('JSON Loaded', 'Redirecting to stamp editor with imported settings...');
        router.push('/admin/documents/stamps/create?import=true');
      } catch (error: any) {
        console.error('Import error:', error);
        showError('Import Failed', 'Failed to parse JSON file. Please check the file format.');
      } finally {
        setImportLoading(false);
        if (importFileRef.current) {
          importFileRef.current.value = '';
        }
      }
    } else {
      showError('Unsupported File', 'Please upload a PNG, JPG, SVG, or JSON file.');
    }

    // Reset file input
    if (importFileRef.current) {
      importFileRef.current.value = '';
    }
  };

  // Confirm image import from modal
  const handleConfirmImageImport = async () => {
    if (!importImageFile || !importImagePreview) return;

    setImportLoading(true);
    try {
      // Upload the image first
      const uploadResult = await stampService.uploadImage(importImageFile);

      // Create the stamp with the uploaded image
      const stampData: CreateStampRequest = {
        name: importImageName || 'Imported Image Stamp',
        description: '',
        stampType: 'IMAGE',
        content: '',
        imageUrl: uploadResult.imageUrl,
        position: 'Center',
        opacity: importImageOpacity,
        rotation: 0,
        width: 200,
        height: 200,
        category: 'Custom',
        language: 'en',
      };

      await stampService.createStamp(stampData);
      showSuccess('Image Stamp Created', `Stamp "${stampData.name}" created successfully`);
      setShowImageImportModal(false);
      setImportImagePreview(null);
      setImportImageFile(null);
      fetchData(false);
      fetchStatistics();
    } catch (error: any) {
      console.error('Image import error:', error);
      showError('Import Failed', error.response?.data?.message || 'Failed to create stamp from image.');
    } finally {
      setImportLoading(false);
    }
  };

  // View stamp application history
  const handleViewHistory = async (stamp: StampResponse) => {
    setHistoryStamp(stamp);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const apps = await stampService.getStampApplications(stamp.id);
      setApplications(apps);
    } catch (error) {
      console.error('Failed to load history:', error);
      showError('Error', 'Failed to load stamp application history');
      setApplications([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Create stamp from template
  const handleCreateFromTemplate = async (template: typeof STAMP_TEMPLATES[0]) => {
    try {
      const stampData: CreateStampRequest = {
        name: template.name,
        description: `Predefined ${template.name} stamp`,
        stampType: 'TEXT',
        content: template.content,
        color: template.color,
        backgroundColor: template.backgroundColor,
        borderColor: template.borderColor,
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        position: 'Center',
        opacity: 0.85,
        rotation: 0,
        width: 250,
        height: 80,
        category: template.category,
        language: 'en',
      };

      await stampService.createStamp(stampData);
      showSuccess('Template Created', `"${template.name}" stamp created successfully`);
      fetchData(false);
      fetchStatistics();
      setShowTemplates(false);
    } catch (error: any) {
      console.error('Failed to create from template:', error);
      showError('Creation Failed', error.response?.data?.message || 'Failed to create stamp from template');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Resolve image URLs embedded inside HTML content strings
   * (e.g. <img src="/api/v1/documents/stamps/image/xxx">) to absolute backend URLs.
   */
  const resolveContentImageUrls = (html: string | null | undefined): string => {
    if (!html) return '';
    return html.replace(/src="([^"]+)"/g, (_match: string, url: string) => {
      const resolved = resolveStampImageUrl(url);
      return resolved ? `src="${resolved}"` : _match;
    });
  };

  const renderStampPreview = (stamp: StampResponse) => {
    // For stamps created via the canvas editor, content is HTML – render it
    const hasHtmlContent = stamp.content && stamp.content.trim().startsWith('<');

    if (stamp.stampType === 'TEXT' || stamp.stampType === 'DYNAMIC') {
      if (hasHtmlContent) {
        // Calculate bounding box from editorElements to center content in preview
        let scale = 0.12;
        let offsetX = 0;
        let offsetY = 0;
        const previewSize = 96; // w-24 = 96px
        const canvasW = stamp.width || 800;
        const canvasH = stamp.height || 600;

        if (stamp.editorElements) {
          try {
            const els = JSON.parse(stamp.editorElements);
            if (els.length > 0) {
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              els.forEach((el: any) => {
                minX = Math.min(minX, el.x || 0);
                minY = Math.min(minY, el.y || 0);
                maxX = Math.max(maxX, (el.x || 0) + (el.width || 100));
                maxY = Math.max(maxY, (el.y || 0) + (el.height || 50));
              });
              const contentW = Math.max(maxX - minX, 1);
              const contentH = Math.max(maxY - minY, 1);
              const padding = 8; // px padding inside preview
              scale = Math.min(
                (previewSize - padding * 2) / contentW,
                (previewSize - padding * 2) / contentH,
                1
              );
              const scaledW = contentW * scale;
              const scaledH = contentH * scale;
              offsetX = (previewSize - scaledW) / 2 - minX * scale;
              offsetY = (previewSize - scaledH) / 2 - minY * scale;
            }
          } catch {
            // Fallback to simple proportional scale
            scale = Math.min(previewSize / canvasW, previewSize / canvasH);
          }
        } else {
          scale = Math.min(previewSize / canvasW, previewSize / canvasH);
        }

        return (
          <div
            className="w-24 h-24 rounded border overflow-hidden relative"
            style={{ opacity: stamp.opacity || 1 }}
          >
            <div
              style={{
                transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                transformOrigin: 'top left',
                width: `${canvasW}px`,
                height: `${canvasH}px`,
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              dangerouslySetInnerHTML={{ __html: resolveContentImageUrls(stamp.content) }}
            />
          </div>
        );
      }
      return (
        <div
          className="inline-block px-4 py-2 rounded border-2 font-bold max-w-[96px] max-h-[96px] overflow-hidden"
          style={{
            color: stamp.color || '#000',
            backgroundColor: stamp.backgroundColor || 'transparent',
            borderColor: stamp.borderColor || '#000',
            fontSize: `${Math.min(stamp.fontSize || 14, 14)}px`,
            fontFamily: stamp.fontFamily || 'Arial',
            fontWeight: stamp.fontWeight || 'bold',
            opacity: stamp.opacity || 1,
          }}
        >
          {stamp.content || stamp.name}
        </div>
      );
    } else if (stamp.stampType === 'IMAGE') {
      // If stamp has editorElements, it was customized in the canvas editor — render HTML content
      const imgHasEditor = stamp.editorElements && stamp.content && stamp.content.trim().startsWith('<');
      if (imgHasEditor) {
        let imgScale = 0.12;
        let imgOffsetX = 0;
        let imgOffsetY = 0;
        const imgPreviewSize = 96;
        const imgCanvasW = stamp.width || 800;
        const imgCanvasH = stamp.height || 600;

        try {
          const els = JSON.parse(stamp.editorElements!);
          if (els.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            els.forEach((el: any) => {
              minX = Math.min(minX, el.x || 0);
              minY = Math.min(minY, el.y || 0);
              maxX = Math.max(maxX, (el.x || 0) + (el.width || 100));
              maxY = Math.max(maxY, (el.y || 0) + (el.height || 50));
            });
            const cw = Math.max(maxX - minX, 1);
            const ch = Math.max(maxY - minY, 1);
            const pad = 8;
            imgScale = Math.min((imgPreviewSize - pad * 2) / cw, (imgPreviewSize - pad * 2) / ch, 1);
            imgOffsetX = (imgPreviewSize - cw * imgScale) / 2 - minX * imgScale;
            imgOffsetY = (imgPreviewSize - ch * imgScale) / 2 - minY * imgScale;
          }
        } catch {
          imgScale = Math.min(imgPreviewSize / imgCanvasW, imgPreviewSize / imgCanvasH);
        }

        return (
          <div
            className="w-24 h-24 rounded border overflow-hidden relative"
            style={{ opacity: stamp.opacity || 1 }}
          >
            <div
              style={{
                transform: `translate(${imgOffsetX}px, ${imgOffsetY}px) scale(${imgScale})`,
                transformOrigin: 'top left',
                width: `${imgCanvasW}px`,
                height: `${imgCanvasH}px`,
                position: 'absolute',
                top: 0,
                left: 0,
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
            className="w-24 h-24 object-contain rounded"
            style={{ opacity: stamp.opacity || 1 }}
          />
        );
      }
      // Fallback: legacy IMAGE stamps with HTML content but no imageUrl or editorElements
      const legacyImgHtml = stamp.content && stamp.content.trim().startsWith('<');
      if (legacyImgHtml) {
        const fallbackScale = Math.min(96 / (stamp.width || 800), 96 / (stamp.height || 600));
        return (
          <div
            className="w-24 h-24 rounded border overflow-hidden relative"
            style={{ opacity: stamp.opacity || 1 }}
          >
            <div
              style={{
                transform: `scale(${fallbackScale})`,
                transformOrigin: 'top left',
                width: `${stamp.width || 800}px`,
                height: `${stamp.height || 600}px`,
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              dangerouslySetInnerHTML={{ __html: resolveContentImageUrls(stamp.content) }}
            />
          </div>
        );
      }
      return (
        <div className="w-24 h-24 bg-muted rounded flex items-center justify-center">
          <Image className="w-12 h-12 text-muted-foreground" />
        </div>
      );
    } else if (stamp.stampType === 'QR_CODE') {
      // QR content is a data URI if generated server-side, or just text
      const isDataUri = stamp.content && stamp.content.startsWith('data:');
      if (isDataUri) {
        return (
          <div className="w-24 h-24 bg-white rounded flex items-center justify-center border p-1">
            <img
              src={stamp.content}
              alt={stamp.name}
              className="w-full h-full object-contain"
            />
          </div>
        );
      }
      // Fallback: show QR icon with the text content
      return (
        <div className="w-24 h-24 bg-white rounded flex flex-col items-center justify-center border p-1 text-center">
          <Stamp className="w-8 h-8 text-muted-foreground mb-1" />
          <span className="text-[10px] text-muted-foreground truncate w-full">{stamp.content || 'QR'}</span>
        </div>
      );
    } else {
      return (
        <div className="w-24 h-24 bg-muted rounded flex items-center justify-center">
          <Stamp className="w-12 h-12 text-muted-foreground" />
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Stamp className="w-8 h-8 text-primary" />
            Document Stamps
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage stamps for document branding and approval
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Hidden file input for import — accepts images + JSON */}
          <input
            ref={importFileRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,.webp,.gif,.json"
            className="hidden"
            onChange={handleImportStamp}
          />
          <Button
            variant="outline"
            onClick={() => setShowTemplates(true)}
            className="gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            Templates
          </Button>
          <Button
            variant="outline"
            onClick={() => importFileRef.current?.click()}
            disabled={importLoading}
            className="gap-2"
          >
            {importLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Import
          </Button>
          <Button onClick={() => router.push('/admin/documents/stamps/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Stamp
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Stamps</p>
                  <p className="text-2xl font-bold">{statistics.totalStamps || 0}</p>
                </div>
                <Stamp className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.activeStamps || 0}</p>
                </div>
                <Eye className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold text-gray-600">{statistics.inactiveStamps || 0}</p>
                </div>
                <EyeOff className="w-8 h-8 text-gray-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Usage</p>
                  <p className="text-2xl font-bold">{statistics.totalUsage || 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Text Stamps</p>
                  <p className="text-2xl font-bold">{statistics.textStamps || 0}</p>
                </div>
                <Type className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Image Stamps</p>
                  <p className="text-2xl font-bold">{statistics.imageStamps || 0}</p>
                </div>
                <Image className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <ServerSearchInput
                placeholder="Search stamps..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {stampTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && !tableLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-medium text-red-600">Error loading stamps</p>
            <p className="text-muted-foreground mt-1">{error}</p>
            <Button onClick={() => fetchData(true)} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stamps Grid/List */}
      {loading && !tableLoading ? (
        <Card>
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Loading stamps...</span>
          </CardContent>
        </Card>
      ) : stamps.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Stamp className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-lg font-medium">No stamps found</p>
            <p className="text-muted-foreground mt-1">Try adjusting your filters or create a new stamp</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {stamps.map((stamp) => (
            <Card key={stamp.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {renderStampPreview(stamp)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{stamp.name}</h3>
                        <Badge variant={stamp.isActive ? 'default' : 'secondary'}>
                          {stamp.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {stamp.category && (
                          <Badge variant="outline">{stamp.category}</Badge>
                        )}
                      </div>
                      {stamp.description && (
                        <p className="text-sm text-muted-foreground mb-2">{stamp.description}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="ml-2 font-medium">{stamp.stampType}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Usage:</span>
                          <span className="ml-2 font-medium">{stamp.usageCount} times</span>
                        </div>
                        {stamp.position && (
                          <div>
                            <span className="text-muted-foreground">Position:</span>
                            <span className="ml-2 font-medium">{stamp.position}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <span className="ml-2 font-medium">{formatDate(stamp.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleExpand(stamp.id)}
                    >
                      {expandedStamps.includes(stamp.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreviewStamp(stamp)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditStamp(stamp)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateStamp(stamp)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(stamp.id)}>
                          {stamp.isActive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                          {stamp.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewHistory(stamp)}>
                          <History className="w-4 h-4 mr-2" />
                          View History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExportStamp(stamp)}>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteStamp(stamp.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {expandedStamps.includes(stamp.id) && (
                  <div className="border-t bg-muted/30 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

                      {stamp.width && stamp.height && (
                        <div>
                          <p className="font-medium mb-1">Size</p>
                          <p className="text-muted-foreground">{stamp.width} × {stamp.height} px</p>
                        </div>
                      )}
                      {stamp.opacity && (
                        <div>
                          <p className="font-medium mb-1">Opacity</p>
                          <p className="text-muted-foreground">{(stamp.opacity * 100).toFixed(0)}%</p>
                        </div>
                      )}
                      {stamp.rotation !== undefined && stamp.rotation !== 0 && (
                        <div>
                          <p className="font-medium mb-1">Rotation</p>
                          <p className="text-muted-foreground">{stamp.rotation}°</p>
                        </div>
                      )}
                      {stamp.creator && (
                        <div>
                          <p className="font-medium mb-1">Created By</p>
                          <div className="flex items-center gap-2">
                            <UserAvatar user={stamp.creator} size="xs" />
                            <p className="text-muted-foreground">{stamp.creator.displayName || stamp.creator.username}</p>
                          </div>
                        </div>
                      )}
                      {stamp.lastUsedAt && (
                        <div>
                          <p className="font-medium mb-1">Last Used</p>
                          <p className="text-muted-foreground">{formatDate(stamp.lastUsedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Preview Stamp Modal */}
      <PreviewStampModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setSelectedStamp(null);
        }}
        stamp={selectedStamp}
      />

      {/* Application History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Application History — {historyStamp?.name}
            </DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading history...</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>This stamp has not been applied to any documents yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Applied to {applications.length} document{applications.length !== 1 ? 's' : ''}
              </p>
              {applications.map((app) => (
                <Card key={app.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{app.documentName || `Document #${app.documentId}`}</p>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span>Version: {app.versionNumber || app.documentVersionId}</span>
                          <span>Page: {app.pageNumber || '—'}</span>
                          <span>Position: ({app.positionX}, {app.positionY})</span>
                        </div>
                        {app.reason && (
                          <p className="text-sm"><span className="text-muted-foreground">Reason:</span> {app.reason}</p>
                        )}
                        {app.notes && (
                          <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {app.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                        <p>{app.appliedByName || app.appliedBy}</p>
                        <p>{app.appliedAt ? formatDate(app.appliedAt as any) : '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Templates Gallery Modal */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" />
              Stamp Templates
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Choose a predefined template to quickly create a stamp.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
            {STAMP_TEMPLATES.map((template) => (
              <button
                key={template.name}
                onClick={() => handleCreateFromTemplate(template)}
                className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <div
                  className="w-full py-3 px-2 rounded-lg border-2 font-bold text-center text-xs leading-tight overflow-hidden break-words group-hover:scale-105 transition-transform"
                  style={{
                    color: template.color,
                    backgroundColor: template.backgroundColor,
                    borderColor: template.borderColor,
                  }}
                >
                  {template.content}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {template.icon}
                  <span>{template.category}</span>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Import Preview Modal */}
      <Dialog open={showImageImportModal} onOpenChange={(open) => {
        setShowImageImportModal(open);
        if (!open) {
          setImportImagePreview(null);
          setImportImageFile(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Image as Stamp
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Image preview */}
            {importImagePreview && (
              <div className="flex justify-center p-4 bg-muted/30 rounded-xl border-2 border-dashed">
                <img
                  src={importImagePreview}
                  alt="Import preview"
                  className="max-w-full max-h-64 object-contain rounded"
                  style={{ opacity: importImageOpacity }}
                />
              </div>
            )}

            {/* Stamp name */}
            <div className="space-y-2">
              <Label htmlFor="import-name" className="text-sm font-medium">Stamp Name</Label>
              <Input
                id="import-name"
                value={importImageName}
                onChange={(e) => setImportImageName(e.target.value)}
                placeholder="Enter stamp name..."
              />
            </div>

            {/* Opacity control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Opacity</Label>
                <span className="text-sm text-muted-foreground">{Math.round(importImageOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={importImageOpacity}
                onChange={(e) => setImportImageOpacity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => {
                setShowImageImportModal(false);
                setImportImagePreview(null);
                setImportImageFile(null);
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmImageImport}
                disabled={importLoading || !importImageName.trim()}
                className="gap-2"
              >
                {importLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Stamp
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => {
        if (!deleteLoading) {
          setShowDeleteModal(open);
          if (!open) setDeleteStampId(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-2">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-center">Delete Stamp</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete this stamp? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteStampId(null);
              }}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteStamp}
              disabled={deleteLoading}
              className="gap-2"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Choice Modal */}
      <Dialog open={showExportModal} onOpenChange={(open) => {
        if (!exportLoading) {
          setShowExportModal(open);
          if (!open) setExportStamp(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Stamp
            </DialogTitle>
            <DialogDescription>
              Choose how you want to export &ldquo;{exportStamp?.name}&rdquo;
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 mt-2">
            <button
              onClick={() => exportStamp && handleExportAsImage(exportStamp)}
              disabled={exportLoading}
              className="flex items-start gap-4 p-4 rounded-lg border-2 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
            >
              <div className="flex-shrink-0 mt-0.5 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Image className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold group-hover:text-primary transition-colors">
                  {exportLoading ? 'Generating...' : 'Download as Image'}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  PNG with transparent background — use in Word, Excel, or email
                </p>
              </div>
              {exportLoading && <Loader2 className="w-4 h-4 animate-spin ml-auto mt-1" />}
            </button>
            <button
              onClick={() => exportStamp && handleExportAsTemplate(exportStamp)}
              disabled={exportLoading}
              className="flex items-start gap-4 p-4 rounded-lg border-2 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
            >
              <div className="flex-shrink-0 mt-0.5 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold group-hover:text-primary transition-colors">Download Template</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  JSON file — backup, share with colleagues, or edit later
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
