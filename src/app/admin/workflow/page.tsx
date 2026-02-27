'use client';

import React, { useState, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { WorkflowResponse } from '@/types/api';
import Pagination from '@/components/main/Pagination';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import UserAvatar from '@/components/main/UserAvatar';
import { formatDate } from '@/lib/dateFormatter';
import { cn } from '@/lib/utils';

export default function WorkflowManagementPage() {
  const router = useRouter();
  const pageSize = 20;

  const {
    displayData: displayWorkflows,
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
    clearError,
    removeItem,
  } = useServerSideSearch<WorkflowResponse>({
    fetchFunction: async (page, searchTerm) => {
      const response = await workflowAdminService.getAllWorkflows(page, pageSize, searchTerm || undefined, true);
      return response;
    },
    searchFields: (workflow) => [workflow.name],
    debounceMs: 500,
  });

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowResponse | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === page) return;
    setPage(newPage);
  }, [page, setPage]);

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
      // Navigate to designer with the new workflow
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
      removeItem(workflowToDelete);
      setIsDeleteModalOpen(false);
      setWorkflowToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const handleEditWorkflow = (workflowId: number) => {
    router.push(`/admin/workflow/designer?id=${workflowId}`);
  };

  // Stats
  const activeCount = displayWorkflows.filter(w => w.isActive).length;
  const totalSteps = displayWorkflows.reduce((acc, w) => acc + (w.stepCount || 0), 0);
  const totalInstances = displayWorkflows.reduce((acc, w) => acc + (w.activeInstancesCount || 0), 0);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold mt-1">{totalElements}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Workflow className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{activeCount}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Play className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Running Instances</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{totalInstances}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Steps</p>
                  <p className="text-2xl font-bold mt-1 text-violet-600">{totalSteps}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <GitBranch className="h-5 w-5 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <ServerSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search workflows by name..."
              className="max-w-md"
            />
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{totalElements} workflow{totalElements !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-destructive/10 border-destructive">
            <div className="flex justify-between items-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
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
                  <TableHead>Workflow</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[90px] text-center">Steps</TableHead>
                  <TableHead className="w-[90px] text-center hidden md:table-cell">Instances</TableHead>
                  <TableHead className="hidden lg:table-cell">Created By</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Updated</TableHead>
                  <TableHead className="text-right w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && displayWorkflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading workflows...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displayWorkflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center">
                          <Workflow className="h-7 w-7 text-primary/40" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">No workflows found</p>
                          <p className="text-xs mt-0.5">
                            {searchQuery ? 'Try adjusting your search' : 'Create your first workflow to get started'}
                          </p>
                        </div>
                        {!searchQuery && (
                          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5 mt-1">
                            <Plus className="h-3.5 w-3.5" />
                            Create Workflow
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayWorkflows.map((workflow) => (
                    <TableRow
                      key={workflow.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors group"
                      onClick={() => handleEditWorkflow(workflow.id)}
                    >
                      {/* Name + Description */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                            workflow.isActive ? "bg-green-500/10" : "bg-gray-100"
                          )}>
                            <Workflow className={cn(
                              "h-4 w-4",
                              workflow.isActive ? "text-green-600" : "text-gray-400"
                            )} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{workflow.name}</p>
                            {workflow.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {workflow.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant={workflow.isActive ? 'default' : 'secondary'}
                          className={cn(
                            "text-[10px] px-2 py-0.5",
                            workflow.isActive ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" : ""
                          )}
                        >
                          {workflow.isActive ? (
                            <>
                              <Play className="h-2.5 w-2.5 mr-0.5" />
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

                      {/* Steps */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <GitBranch className="h-3.5 w-3.5" />
                          <span>{workflow.stepCount || 0}</span>
                        </div>
                      </TableCell>

                      {/* Active Instances */}
                      <TableCell className="text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          {workflow.activeInstancesCount > 0 ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                              {workflow.activeInstancesCount} running
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Created By */}
                      <TableCell className="hidden lg:table-cell">
                        {workflow.createdBy ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={workflow.createdBy} size="sm" />
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {workflow.createdBy.displayName || workflow.createdBy.username}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Last Updated */}
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
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

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditWorkflow(workflow.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit in Designer
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
