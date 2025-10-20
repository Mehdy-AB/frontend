'use client';

import { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { DocumentService } from '@/api/services/documentService';
import { TagResponseDto, CreateTagRequestDto, UpdateTagRequestDto } from '@/types/api';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function ModelsPage() {
  const { t } = useLanguage();
  const [models, setModels] = useState<TagResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'system'>('all');
  const [selectedModels, setSelectedModels] = useState<number[]>([]);

  // Fetch models (using tags API for now)
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await DocumentService.getAllTags({
        page: 0,
        size: 100,
        query: searchQuery || undefined,
        type: filterType === 'all' ? undefined : filterType.toUpperCase()
      });
      setModels(response);
    } catch (err: any) {
      console.error('Error fetching models:', err);
      setError(err.message || 'Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [searchQuery, filterType]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchModels();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateModel = async (modelData: CreateTagRequestDto) => {
    try {
      await DocumentService.createTag(modelData);
      fetchModels(); // Refresh data
    } catch (error: any) {
      console.error('Error creating model:', error);
      alert('Failed to create model: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUpdateModel = async (modelId: number, modelData: UpdateTagRequestDto) => {
    try {
      await DocumentService.updateTag(modelId, modelData);
      fetchModels(); // Refresh data
    } catch (error: any) {
      console.error('Error updating model:', error);
      alert('Failed to update model: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteModel = async (modelId: number) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      await DocumentService.deleteTag(modelId);
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

  if (loading) {
    return <ModelsSkeleton />;
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Model
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={(value: 'all' | 'user' | 'system') => setFilterType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              <SelectItem value="user">User Models</SelectItem>
              <SelectItem value="system">System Models</SelectItem>
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
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{model.name}</h3>
                    <p className="text-sm text-muted-foreground">{model.description}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDeleteModel(model.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant={model.type === 'SYSTEM' ? 'default' : 'secondary'}>
                    {model.type}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Color:</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border" 
                      style={{ backgroundColor: model.color || '#3b82f6' }}
                    />
                    <span className="text-xs">{model.color || '#3b82f6'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(model.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Documents:</span>
                  <span>{model.documentCount || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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

