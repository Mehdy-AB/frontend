'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  XCircle,
  Clock,
  Users,
  Settings,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { workflowService } from '@/api/services/workflowService';
import { WorkflowResponse } from '@/types/api';
import Pagination from '@/components/main/Pagination';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

export default function WorkflowManagementPage() {
  const router = useRouter();
  const pageSize = 20;

  // Use the server-side search hook
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
    isLocalFiltering,
    error,
    fetchData,
    clearError,
    updateItem,
    addItem,
    removeItem
  } = useServerSideSearch<WorkflowResponse>({
    fetchFunction: async (page, searchTerm) => {
      const response = await workflowService.getAllWorkflows(page, pageSize, searchTerm || undefined, true);
      return response;
    },
    searchFields: (workflow) => [workflow.name],
    debounceMs: 500
  });

  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowResponse | null>(null);


  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === page) return;
    setPage(newPage);
  }, [page, setPage]);

  const toggleSelectWorkflow = (workflowId: number) => {
    setSelectedItems(prev =>
      prev.includes(workflowId)
        ? prev.filter(id => id !== workflowId)
        : [...prev, workflowId]
    );
  };

  const handleCreateWorkflow = () => {
    router.push('/admin/workflow/designer');
  };

  const handleDeleteClick = (workflow: WorkflowResponse) => {
    setWorkflowToDelete(workflow);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!workflowToDelete) return;

    try {
      await workflowService.deleteWorkflow(workflowToDelete.id);
      removeItem(workflowToDelete);
      setIsDeleteModalOpen(false);
      setWorkflowToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const handleViewWorkflow = (workflowId: number) => {
    router.push(`/admin/workflow/${workflowId}`);
  };

  const handleDesignWorkflow = (workflowId: number) => {
    router.push(`/admin/workflow/designer?id=${workflowId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Workflow Management</h1>
          <p className="text-muted-foreground">Create and manage document workflows</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/workflow/designer')}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Workflow Designer
          </Button>
          <Button onClick={handleCreateWorkflow}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <ServerSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search workflows..."
            className="max-w-md"
          />
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              <span>{totalElements} workflows</span>
            </div>
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>{selectedItems.length} selected</span>
              </div>
            )}
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

      {/* Workflows List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">
                  <input
                    type="checkbox"
                    checked={displayWorkflows.length > 0 && selectedItems.length === displayWorkflows.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(displayWorkflows.map(w => w.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Steps</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && displayWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      Loading workflows...
                    </div>
                  </td>
                </tr>
              ) : displayWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-muted-foreground">
                    No workflows found
                  </td>
                </tr>
              ) : (
                displayWorkflows.map((workflow) => (
                  <tr
                    key={workflow.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(workflow.id)}
                        onChange={() => toggleSelectWorkflow(workflow.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-primary" />
                        <span className="font-medium">{workflow.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <span>{workflow.stepCount || 0} steps</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={workflow.isActive ? "default" : "secondary"}>
                        {workflow.isActive ? (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewWorkflow(workflow.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDesignWorkflow(workflow.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDesignWorkflow(workflow.id)}>
                              <GitBranch className="h-4 w-4 mr-2" />
                              Design Workflow
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewWorkflow(workflow.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Workflow className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Workflows</p>
              <p className="text-2xl font-semibold">{totalElements}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Play className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-semibold">{displayWorkflows.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold">0</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <GitBranch className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Steps</p>
              <p className="text-2xl font-semibold">
                {displayWorkflows.reduce((acc, w) => acc + (w.stepCount || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
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
  );
}

