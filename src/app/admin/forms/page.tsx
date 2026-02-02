'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  LayoutGrid,
  List,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  BarChart3,
  FileText,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Loader2
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
import { useRouter } from 'next/navigation';
import { formService } from '@/api/services/formService';
import { FormResponse } from '@/types/api';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';

export default function FormsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotifications();
  const [forms, setForms] = useState<FormResponse[]>([]);
  const [filteredForms, setFilteredForms] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch forms
  const fetchForms = async () => {
    setLoading(true);
    try {
      const response = await formService.getMyForms(page, 20);
      setForms(response.content);
      setFilteredForms(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
      showError('Load Failed', 'Unable to load forms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const cats = await formService.getAllCategories();
      // Filter out empty or null categories
      setCategories(cats.filter(cat => cat && cat.trim() !== ''));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchForms();
    fetchCategories();
  }, [page]);

  // Filter forms
  useEffect(() => {
    let filtered = forms;

    if (searchQuery) {
      filtered = filtered.filter(form =>
        form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(form => form.status === statusFilter.toUpperCase());
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(form => form.category === categoryFilter);
    }

    setFilteredForms(filtered);
  }, [searchQuery, statusFilter, categoryFilter, forms]);

  const handlePublish = async (id: number) => {
    try {
      await formService.publishForm(id);
      showSuccess('Form Published', 'The form is now live and accepting submissions');
      fetchForms();
    } catch (error: any) {
      showError('Publish Failed', error.message || 'Failed to publish form');
    }
  };

  const handleClose = async (id: number) => {
    try {
      await formService.closeForm(id);
      showSuccess('Form Closed', 'The form is no longer accepting submissions');
      fetchForms();
    } catch (error: any) {
      showError('Close Failed', error.message || 'Failed to close form');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const duplicated = await formService.duplicateForm(id);
      showSuccess('Form Duplicated', 'A copy has been created');
      router.push(`/admin/forms/${duplicated.id}/edit`);
    } catch (error: any) {
      showError('Duplicate Failed', error.message || 'Failed to duplicate form');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    try {
      await formService.deleteForm(id);
      showSuccess('Form Deleted', 'The form has been permanently deleted');
      fetchForms();
    } catch (error: any) {
      showError('Delete Failed', error.message || 'Failed to delete form');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      DRAFT: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
      PUBLISHED: { color: 'bg-green-100 text-green-700', label: 'Published' },
      CLOSED: { color: 'bg-red-100 text-red-700', label: 'Closed' },
      ARCHIVED: { color: 'bg-yellow-100 text-yellow-700', label: 'Archived' }
    };

    const variant = variants[status] || variants.DRAFT;
    return (
      <Badge className={variant.color}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Forms</h1>
          <p className="text-gray-500 mt-1">Create and manage custom forms for your organization</p>
        </div>
        <Button onClick={() => router.push('/admin/forms/create')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Form
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Forms</p>
                <p className="text-2xl font-bold mt-1">{forms.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Published</p>
                <p className="text-2xl font-bold mt-1">
                  {forms.filter(f => f.status === 'PUBLISHED').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Submissions</p>
                <p className="text-2xl font-bold mt-1">
                  {forms.reduce((acc, f) => acc + f.submissionCount, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Completion</p>
                <p className="text-2xl font-bold mt-1">
                  {forms.length > 0
                    ? Math.round(
                        forms.reduce((acc, f) => acc + (f.completionRate || 0), 0) / forms.length
                      )
                    : 0}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forms List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredForms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first form'}
            </p>
            {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
              <Button onClick={() => router.push('/admin/forms/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Form
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{form.name}</CardTitle>
                    {getStatusBadge(form.status)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/forms/${form.id}/edit`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/admin/forms/${form.id}/submissions`)}>
                        <Users className="w-4 h-4 mr-2" />
                        Submissions ({form.submissionCount})
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/admin/forms/${form.id}/analytics`)}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {form.status === 'DRAFT' && (
                        <DropdownMenuItem onClick={() => handlePublish(form.id)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      {form.status === 'PUBLISHED' && (
                        <DropdownMenuItem onClick={() => handleClose(form.id)}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Close
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDuplicate(form.id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`/forms/${form.slug}`, '_blank')}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(form.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {form.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{form.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Views</p>
                    <p className="font-semibold">{form.viewCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Submissions</p>
                    <p className="font-semibold">{form.submissionCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fields</p>
                    <p className="font-semibold">{form.fields.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Completion</p>
                    <p className="font-semibold">{form.completionRate?.toFixed(0) || 0}%</p>
                  </div>
                </div>
                {form.category && (
                  <Badge variant="outline" className="mt-4">
                    {form.category}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredForms.map((form) => (
                <div key={form.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{form.name}</h3>
                        {getStatusBadge(form.status)}
                        {form.category && (
                          <Badge variant="outline">{form.category}</Badge>
                        )}
                      </div>
                      {form.description && (
                        <p className="text-sm text-gray-500 mt-1">{form.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {form.viewCount} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {form.submissionCount} submissions
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {form.fields.length} fields
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/forms/${form.id}/edit`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/forms/${form.id}/submissions`)}>
                          <Users className="w-4 h-4 mr-2" />
                          Submissions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/forms/${form.id}/analytics`)}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {form.status === 'DRAFT' && (
                          <DropdownMenuItem onClick={() => handlePublish(form.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {form.status === 'PUBLISHED' && (
                          <DropdownMenuItem onClick={() => handleClose(form.id)}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Close
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDuplicate(form.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/forms/${form.slug}`, '_blank')}>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(form.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

