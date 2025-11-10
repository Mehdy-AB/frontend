'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Database, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Palette,
  FileText,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';
import UserAvatar from '@/components/main/UserAvatar';
import { tagService } from '@/api/services/tagService';
import { TagResponseDto, CreateTagRequestDto, UpdateTagRequestDto, PageResponse } from '@/types/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useAdminPagePermissions } from '@/hooks/useAdminPagePermissions';

export default function ModelsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { canView, canCreate, canUpdate, canDelete } = useAdminPagePermissions();
  
  // Redirect if user doesn't have view permission
  useEffect(() => {
    if (!canView) {
      router.push('/');
    }
  }, [canView, router]);
  const [models, setModels] = useState<TagResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'system'>('all');
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [editingModel, setEditingModel] = useState<TagResponseDto | null>(null);
  const [deletingModel, setDeletingModel] = useState<TagResponseDto | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch models (tags)
  const fetchModels = async () => {
    try {
      if (!initialized) setLoading(true);
      setIsFetching(true);
      setError(null);
      const filters = {
        type: filterType === 'all' ? undefined : (filterType.toUpperCase() as 'SYSTEM' | 'USER'),
        q: searchQuery || undefined,
      };
      try {
        const page: PageResponse<TagResponseDto> = await tagService.getTagsPaged(
          currentPage,
          pageSize,
          sortBy,
          sortDirection,
          filters
        );
        setModels(page.content || []);
        setTotalPages(page.totalPages || 0);
        setTotalElements(page.totalElements || 0);
      } catch (e: any) {
        console.warn('Paged tags endpoint failed, falling back to simple list. Details:', e?.message || e);
        // Fallback: fetch list and paginate client-side
        let list: TagResponseDto[] = [];
        if (filters.q) {
          list = await tagService.searchTagsSimple(filters.q);
        } else if (filters.type === 'SYSTEM') {
          list = await tagService.getSystemTags();
        } else if (filters.type === 'USER') {
          list = await tagService.getMyTags();
        } else {
          list = await tagService.getAllTags();
        }
        // Basic sort fallback
        const sorted = [...list].sort((a, b) => {
          const dir = sortDirection === 'asc' ? 1 : -1;
          if (sortBy === 'name') return a.name.localeCompare(b.name) * dir;
          const av = (a as any)[sortBy];
          const bv = (b as any)[sortBy];
          return ((new Date(av).getTime()) - (new Date(bv).getTime())) * dir;
        });
        setTotalElements(sorted.length);
        setTotalPages(Math.max(1, Math.ceil(sorted.length / pageSize)));
        const start = currentPage * pageSize;
        setModels(sorted.slice(start, start + pageSize));
      }
    } catch (err: any) {
      console.error('Error fetching models:', err);
      setError(err.message || 'Failed to load models');
    } finally {
      setLoading(false);
      setInitialized(true);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [currentPage, pageSize, filterType, sortBy, sortDirection]);

  // Debounce search query and reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0);
      fetchModels();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateModel = async (modelData: CreateTagRequestDto) => {
    try {
      await tagService.createTag(modelData);
      fetchModels(); // Refresh data
    } catch (error: any) {
      console.error('Error creating model:', error);
      alert('Failed to create model: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUpdateModel = async (modelId: number, modelData: UpdateTagRequestDto) => {
    try {
      await tagService.updateTag(modelId, modelData);
      fetchModels(); // Refresh data
    } catch (error: any) {
      console.error('Error updating model:', error);
      alert('Failed to update model: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteModel = async (modelId: number) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      await tagService.deleteTag(modelId);
      fetchModels(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting model:', error);
      alert('Failed to delete model: ' + (error.message || 'Unknown error'));
    }
  };

  const toggleModelSelection = (modelId: number) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedModels.length === models.length) {
      setSelectedModels([]);
    } else {
      setSelectedModels(models.map(model => model.id));
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Do not fully replace page during fetch; keep content and show a subtle indicator instead

  if (loading && !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tags...</p>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive text-lg">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CardContent className="text-center">
          <div className="text-destructive text-lg mb-4">{error}</div>
          <Button onClick={() => fetchModels()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Document Models Management</h1>
          <p className="text-muted-foreground">Manage document models and templates for better organization</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              className="gap-2"
              onClick={() => {/* TODO: Open create modal */}}
              disabled={!canCreate}
            >
              <Plus className="h-4 w-4" />
              Create Model
            </Button>
          </TooltipTrigger>
          {!canCreate && (
            <TooltipContent>
              <p>You don't have permission to create tags</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {isFetching && (
        <div className="h-1 w-full bg-muted overflow-hidden rounded">
          <div className="h-full w-1/3 bg-primary animate-[progress_1.2s_ease-in-out_infinite]"></div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <ServerSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tags by name or description..."
            className="w-64"
          />
          
          <Select value={filterType} onValueChange={(value: 'all' | 'user' | 'system') => { setFilterType(value); setCurrentPage(0); }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              <SelectItem value="user">User Models</SelectItem>
              <SelectItem value="system">System Models</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v: 'name' | 'createdAt' | 'updatedAt') => { setSortBy(v); setCurrentPage(0);} }>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="createdAt">Sort: Created</SelectItem>
              <SelectItem value="updatedAt">Sort: Updated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortDirection} onValueChange={(v: 'asc' | 'desc') => { setSortDirection(v); setCurrentPage(0);} }>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>

          <Select value={String(pageSize) as any} onValueChange={(v: any) => { setPageSize(parseInt(v, 10)); setCurrentPage(0);} }>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">8 / page</SelectItem>
              <SelectItem value="12">12 / page</SelectItem>
              <SelectItem value="24">24 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedModels.length} selected
          </span>
          {selectedModels.length > 0 && (
            <>
              <Button variant="outline" size="sm">
                Bulk Edit
              </Button>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {models.map((model) => (
          <Card key={model.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-lg">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base leading-tight">{model.name}</h3>
                      <Badge variant={model.type === 'SYSTEM' ? 'default' : 'secondary'} className="text-[10px]">
                        {model.type}
                      </Badge>
                    </div>
                    {model.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {model.description}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingModel(model)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeletingModel(model)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Color row */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Color</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-md border"
                    style={{ backgroundColor: model.color || '#3b82f6' }}
                  />
                  <span className="text-[11px]">{model.color || '#3b82f6'}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={model.createdBy} size="sm" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate">{model.createdBy?.displayName || model.createdBy?.username}</span>
                    <span className="text-[11px] text-muted-foreground truncate">{model.createdBy?.email}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[11px]">
                  {model.documentCount || 0} docs
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {models.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <Database className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Models Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No models match your search criteria.' : 'Get started by creating your first document model.'}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Model
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Edit Modal */}
      <Dialog open={!!editingModel} onOpenChange={(open) => !open && setEditingModel(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          {editingModel && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Name</Label>
                <Input
                  id="tag-name"
                  value={editingModel.name}
                  onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-desc">Description</Label>
                <Input
                  id="tag-desc"
                  value={editingModel.description || ''}
                  onChange={(e) => setEditingModel({ ...editingModel, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-color">Color</Label>
                <Input
                  id="tag-color"
                  value={editingModel.color || ''}
                  onChange={(e) => setEditingModel({ ...editingModel, color: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingModel(null)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!editingModel) return;
                    await tagService.updateTag(editingModel.id, {
                      name: editingModel.name,
                      description: editingModel.description,
                      color: editingModel.color,
                    });
                    setEditingModel(null);
                    fetchModels();
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={!!deletingModel} onOpenChange={(open) => !open && setDeletingModel(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete tag "{deletingModel?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingModel(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!deletingModel) return;
                  await tagService.deleteTag(deletingModel.id);
                  setDeletingModel(null);
                  fetchModels();
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}// Loading Skeleton
function ModelsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-muted rounded w-64 animate-pulse shimmer mb-2"></div>
          <div className="h-4 bg-muted rounded w-96 animate-pulse shimmer"></div>
        </div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse shimmer"></div>
      </div>

      <div className="flex gap-4">
        <div className="h-10 bg-muted rounded w-64 animate-pulse shimmer"></div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse shimmer"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-muted rounded-lg shimmer"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24 shimmer"></div>
                    <div className="h-3 bg-muted rounded w-32 shimmer"></div>
                  </div>
                </div>
                <div className="w-8 h-8 bg-muted rounded shimmer"></div>
              </div>
              <div className="space-y-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-3 bg-muted rounded w-16 shimmer"></div>
                    <div className="h-3 bg-muted rounded w-12 shimmer"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

