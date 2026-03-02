'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Workflow,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Play,
  Pause,
  MoreVertical,
  GitBranch,
  CheckCircle,
  Clock,
  Search,
  Loader2,
  Activity,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Users,
  Layers,
  ExternalLink,
  ChevronDown,
  ListFilter,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { WorkflowResponse } from '@/types/api';
import Pagination from '@/components/main/Pagination';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import UserAvatar from '@/components/main/UserAvatar';
import { formatDate } from '@/lib/dateFormatter';
import { cn } from '@/lib/utils';
import { PageResponse } from '@/types/api';

type StatusFilter = 'all' | 'active' | 'inactive';
type SortField = 'name' | 'updatedAt' | 'createdAt';
type SortDir = 'asc' | 'desc';

export default function WorkflowManagementPage() {
  const router = useRouter();
  const pageSize = 20;

  // Data states
  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter & sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowResponse | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0); // reset page on search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setTableLoading(true);
      const isActive = statusFilter === 'all' ? undefined : statusFilter === 'active';
      const response = await workflowAdminService.getAllWorkflows(
        page,
        pageSize,
        debouncedSearch || undefined,
        isActive,
        sortField,
        sortDir
      );
      setWorkflows(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching workflows:', err);
      setError(err?.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, sortField, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 0 when filter/sort changes
  useEffect(() => {
    setPage(0);
  }, [statusFilter, sortField, sortDir]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === page) return;
    setPage(newPage);
  }, [page]);

  const handleCreateWorkflow = async () => {
    if (!createName.trim()) return;
    try {
      setCreating(true);
      const created = await workflowAdminService.createWorkflow({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        steps: [],
        trigger: { triggerType: 'MANUAL' } as any,
      });
      setIsCreateOpen(false);
      setCreateName('');
      setCreateDescription('');
      router.push(`/admin/workflow/designer?id=${created.id}`);
    } catch (error) {
      console.error('Error creating workflow:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = (workflow: WorkflowResponse) => {
    setWorkflowToDelete(workflow);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!workflowToDelete) return;
    try {
      await workflowAdminService.deleteWorkflow(workflowToDelete.id);
      setIsDeleteModalOpen(false);
      setWorkflowToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const handleToggleActive = async (workflow: WorkflowResponse) => {
    try {
      await workflowAdminService.updateWorkflow(workflow.id, {
        name: workflow.name,
        isActive: !workflow.isActive,
      } as any);
      await fetchData();
    } catch (error) {
      console.error('Error toggling workflow:', error);
    }
  };

  const handleEditWorkflow = (workflowId: number) => {
    router.push(`/admin/workflow/designer?id=${workflowId}`);
  };

  const handleViewInstances = (workflowId: number) => {
    router.push(`/admin/workflow/${workflowId}`);
  };

  const handleColumnSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 text-primary" />
      : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  // Stats from current page (quick visible numbers)
  const activeCount = workflows.filter(w => w.isActive).length;
  const totalInstances = workflows.reduce((acc, w) => acc + (w.activeInstancesCount || 0), 0);

  const sortLabel = {
    name: 'Name',
    updatedAt: 'Last Updated',
    createdAt: 'Created Date',
  }[sortField];

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Workflow className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Workflow Management</h1>
              <p className="text-sm text-muted-foreground">
                Create, manage, and design document workflows
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Workflows</p>
                  <p className="text-2xl font-bold mt-1">{totalElements}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Workflow className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-200/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{activeCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">on this page</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Play className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-200/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Running Instances</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{totalInstances}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">across visible workflows</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar: Search + Filters + Sort */}
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            {/* Row 1: Search + Create count */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workflows by name..."
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {tableLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{totalElements} workflow{totalElements !== 1 ? 's' : ''} found</span>
              </div>
            </div>

            {/* Row 2: Filters + Sort */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Status:</span>
              </div>
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                {(['all', 'active', 'inactive'] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-medium transition-all",
                      statusFilter === status
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                ))}
              </div>

              <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Sort:</span>
              </div>
              <Select
                value={sortField}
                onValueChange={(v) => setSortField(v as SortField)}
              >
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Last Updated</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {sortDir === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-destructive/10 border-destructive">
            <div className="flex justify-between items-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Workflows Table */}
        <Card>
          <div className="rounded-lg border-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>
                    <button
                      className="flex items-center text-xs font-medium hover:text-foreground transition-colors"
                      onClick={() => handleColumnSort('name')}
                    >
                      Workflow
                      <SortIcon field="name" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[110px] text-center hidden sm:table-cell">Nodes</TableHead>
                  <TableHead className="w-[130px] text-center hidden md:table-cell">Instances</TableHead>
                  <TableHead className="hidden lg:table-cell">Created By</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    <button
                      className="flex items-center text-xs font-medium hover:text-foreground transition-colors"
                      onClick={() => handleColumnSort('createdAt')}
                    >
                      Created
                      <SortIcon field="createdAt" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <button
                      className="flex items-center text-xs font-medium hover:text-foreground transition-colors"
                      onClick={() => handleColumnSort('updatedAt')}
                    >
                      Updated
                      <SortIcon field="updatedAt" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && workflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading workflows...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : workflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center">
                          <Workflow className="h-7 w-7 text-primary/40" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">No workflows found</p>
                          <p className="text-xs mt-0.5">
                            {searchQuery || statusFilter !== 'all'
                              ? 'Try adjusting your filters or search'
                              : 'Create your first workflow to get started'}
                          </p>
                        </div>
                        {!searchQuery && statusFilter === 'all' && (
                          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5 mt-1">
                            <Plus className="h-3.5 w-3.5" />
                            Create Workflow
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  workflows.map((workflow) => (
                    <TableRow
                      key={workflow.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50 transition-colors group",
                        tableLoading && "opacity-60"
                      )}
                      onClick={() => handleEditWorkflow(workflow.id)}
                    >
                      {/* Name + Description */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                            workflow.isActive
                              ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30"
                              : "bg-gray-100 dark:bg-gray-800"
                          )}>
                            <Workflow className={cn(
                              "h-4.5 w-4.5",
                              workflow.isActive ? "text-green-600" : "text-gray-400"
                            )} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{workflow.name}</p>
                            {workflow.description ? (
                              <p className="text-xs text-muted-foreground truncate max-w-[300px] mt-0.5">
                                {workflow.description}
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground/60 italic mt-0.5">No description</p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant={workflow.isActive ? 'default' : 'secondary'}
                          className={cn(
                            "text-[10px] px-2 py-0.5 font-medium",
                            workflow.isActive
                              ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                              : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100"
                          )}
                        >
                          {workflow.isActive ? (
                            <>
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />
                              Active
                            </>
                          ) : (
                            <>
                              <Pause className="h-2.5 w-2.5 mr-0.5" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>

                      {/* Nodes / Steps */}
                      <TableCell className="text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                            <GitBranch className="h-3 w-3" />
                            <span className="font-medium">{workflow.stepCount || 0}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Active Instances */}
                      <TableCell className="text-center hidden md:table-cell">
                        {workflow.activeInstancesCount > 0 ? (
                          <div
                            className="inline-flex items-center gap-1.5 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); handleViewInstances(workflow.id); }}
                          >
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors">
                              <Activity className="h-2.5 w-2.5 mr-1" />
                              {workflow.activeInstancesCount} running
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Created By */}
                      <TableCell className="hidden lg:table-cell">
                        {workflow.createdBy ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={workflow.createdBy} size="sm" />
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {(workflow.createdBy as any)?.displayName || (workflow.createdBy as any)?.username || '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Created At */}
                      <TableCell className="hidden xl:table-cell">
                        <div className="text-xs text-muted-foreground">
                          {workflow.createdAt ? formatDate(workflow.createdAt) : '—'}
                        </div>
                      </TableCell>

                      {/* Last Updated */}
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {workflow.updatedAt ? formatDate(workflow.updatedAt) : '—'}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditWorkflow(workflow.id)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit in Designer</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewInstances(workflow.id)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Instances</TooltipContent>
                          </Tooltip>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleEditWorkflow(workflow.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit in Designer
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewInstances(workflow.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Instances
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleActive(workflow)}>
                                {workflow.isActive ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(workflow)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </Card>

        {/* Create Workflow Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                Create New Workflow
              </DialogTitle>
              <DialogDescription>
                Give your workflow a name and optional description. You'll be taken to the designer to build it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Name <span className="text-destructive">*</span></Label>
                <Input
                  id="workflow-name"
                  placeholder="e.g. Document Approval Process"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && createName.trim()) handleCreateWorkflow();
                  }}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  placeholder="Describe what this workflow does..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkflow} disabled={!createName.trim() || creating} className="gap-2">
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create & Design
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setWorkflowToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Workflow"
          message={`Are you sure you want to delete the workflow "${workflowToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </TooltipProvider>
  );
}
