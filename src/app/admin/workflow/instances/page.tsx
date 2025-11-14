'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Workflow,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  Download,
  RefreshCcw,
  Users,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { workflowService } from '@/api/services/workflowService';
import { WorkflowInstanceResponse, WorkflowStatus } from '@/types/workflow';
import Pagination from '@/components/main/Pagination';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import { formatDate } from '@/lib/dateFormatter';
import { useRouter } from 'next/navigation';
import WorkflowStatusBadge from '@/components/workflow/WorkflowStatusBadge';

export default function WorkflowInstancesPage() {
  const router = useRouter();
  const pageSize = 20;
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Use the server-side search hook
  const {
    displayData: displayInstances,
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
  } = useServerSideSearch<WorkflowInstanceResponse>({
    fetchFunction: async (page, searchTerm) => {
      try {
        // Fetch all instances (you might want to add pagination to the API)
        const response = await workflowService.getMyWorkflows(page, pageSize);
        
        // Filter by status if needed
        let filtered = response.content;
        if (statusFilter !== 'all') {
          filtered = filtered.filter(
            (instance) => instance.status === statusFilter
          );
        }

        // Search filter
        if (searchTerm) {
          filtered = filtered.filter(
            (instance) =>
              instance.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              instance.documentName.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        return {
          content: filtered,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          number: page,
          size: pageSize
        };
      } catch (error) {
        console.error('Error fetching instances:', error);
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: pageSize
        };
      }
    },
    searchFields: (instance) => [
      instance.workflowName,
      instance.documentName
    ],
    debounceMs: 500
  });

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === page) return;
    setPage(newPage);
  }, [page, setPage]);

  const handleViewInstance = (instanceId: number) => {
    // Navigate to instance detail or document detail page
    router.push(`/documents/${instanceId}`);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const getStatusStats = () => {
    const stats = {
      total: totalElements,
      active: 0,
      completed: 0,
      pending: 0,
      rejected: 0,
    };

    displayInstances.forEach((instance) => {
      if (instance.status === 'COMPLETED' || instance.status === 'ARCHIVED') {
        stats.completed++;
      } else if (instance.status === 'REJECTED' || instance.status === 'CANCELLED') {
        stats.rejected++;
      } else if (
        instance.status === 'PENDING_APPROVAL' ||
        instance.status === 'SUBMITTED'
      ) {
        stats.pending++;
      } else {
        stats.active++;
      }
    });

    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Workflow Instances</h1>
          <p className="text-muted-foreground">
            Monitor and manage workflow instances
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Workflow className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-semibold">{stats.completed}</p>
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
              <p className="text-2xl font-semibold">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-semibold">{stats.rejected}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <ServerSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by workflow or document name..."
            isLoading={tableLoading}
            isLocalFiltering={isLocalFiltering}
            className="max-w-md"
          />
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="IN_MANAGER_REVIEW">Manager Review</SelectItem>
                <SelectItem value="IN_ACCOUNTING_REVIEW">Accounting Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Instances Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Workflow</th>
                <th className="text-left p-4 font-medium">Document</th>
                <th className="text-left p-4 font-medium">Current Step</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Started</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && displayInstances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      Loading instances...
                    </div>
                  </td>
                </tr>
              ) : displayInstances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">
                    No workflow instances found
                  </td>
                </tr>
              ) : (
                displayInstances.map((instance) => (
                  <tr
                    key={instance.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-primary" />
                        <span className="font-medium">{instance.workflowName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{instance.documentName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {instance.currentStep ? (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{instance.currentStep.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <WorkflowStatusBadge status={instance.status} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(instance.startedAt)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInstance(instance.documentId)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
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
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

