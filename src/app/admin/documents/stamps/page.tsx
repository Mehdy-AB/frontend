'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useLanguage } from '../../../../contexts/LanguageContext';
import { stampService } from '@/api/services/stampService';
import { StampResponse, CreateStampRequest } from '@/types/api';
import { useNotifications } from '@/hooks/useNotifications';
import PreviewStampModal from '@/components/modals/PreviewStampModal';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';

const categories = ['All', 'Approval', 'Security', 'Status', 'Branding', 'Custom'];
const stampTypes = ['All', 'TEXT', 'IMAGE', 'DYNAMIC', 'QR_CODE'];

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

  const handleDeleteStamp = async (id: number) => {
    if (!confirm('Are you sure you want to delete this stamp? This action cannot be undone.')) {
      return;
    }

    try {
      await stampService.deleteStamp(id);
      showSuccess('Stamp Deleted', 'The stamp has been deleted successfully');
      removeItem(id);
      fetchStatistics();
    } catch (error: any) {
      console.error('Failed to delete stamp:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete stamp. Please try again.';
      showError('Deletion Failed', errorMessage);
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
    try {
      const exportData = {
        name: stamp.name,
        description: stamp.description,
        type: stamp.stampType,
        content: stamp.content,
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

      showSuccess('Stamp Exported', 'The stamp has been exported successfully');
    } catch (error) {
      console.error('Failed to export stamp:', error);
      showError('Export Failed', 'Failed to export stamp. Please try again.');
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

  const renderStampPreview = (stamp: StampResponse) => {
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
          }}
        >
          {stamp.content || stamp.name}
        </div>
      );
    } else if (stamp.stampType === 'IMAGE') {
      return (
        <div className="w-24 h-24 bg-muted rounded flex items-center justify-center">
          <Image className="w-12 h-12 text-muted-foreground" />
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
            Manage stamps and watermarks for document branding and approval
          </p>
        </div>
        <Button onClick={() => router.push('/admin/documents/stamps/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Stamp
        </Button>
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
                      {stamp.stampType === 'TEXT' && (
                        <>
                          <div>
                            <p className="font-medium mb-1">Content</p>
                            <p className="text-muted-foreground">{stamp.content}</p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Font</p>
                            <p className="text-muted-foreground">{stamp.fontFamily}, {stamp.fontSize}px, {stamp.fontWeight}</p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Colors</p>
                            <div className="flex gap-2">
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded border" style={{ backgroundColor: stamp.color }} />
                                <span className="text-muted-foreground">Text</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded border" style={{ backgroundColor: stamp.backgroundColor }} />
                                <span className="text-muted-foreground">Background</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded border" style={{ backgroundColor: stamp.borderColor }} />
                                <span className="text-muted-foreground">Border</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
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
                          <p className="text-muted-foreground">{stamp.creator.displayName || stamp.creator.username}</p>
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
    </div>
  );
}
