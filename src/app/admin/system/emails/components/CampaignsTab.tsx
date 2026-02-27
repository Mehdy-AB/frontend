'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  RefreshCw,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Play,
  Pause,
  Trash2,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Users,
  Mail,
  ChevronLeft,
  ChevronRight,
  Inbox,
  RotateCcw,
  Ban,
} from 'lucide-react';
import { useEmailCampaigns } from '../lib/hooks';
import type { EmailCampaignStatus, EmailCampaignType, CampaignFormData } from '../lib/types';
import type { EmailTemplate } from '@/api/services/emailManagementService';
import CampaignFormModal from './CampaignFormModal';
import CampaignViewModal from './CampaignViewModal';

// ============================================================================
// Status Badge Component
// ============================================================================

function StatusBadge({ status }: { status: EmailCampaignStatus }) {
  const config: Record<
    EmailCampaignStatus,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    DRAFT: {
      label: 'Draft',
      className:
        'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
      icon: <FileText className="h-3 w-3" />,
    },
    SCHEDULED: {
      label: 'Scheduled',
      className:
        'bg-blue-100 text-blue-700 dark:bg-zinc-800 dark:text-blue-400 border-blue-200 dark:border-zinc-700',
      icon: <Clock className="h-3 w-3" />,
    },
    SENDING: {
      label: 'Sending',
      className:
        'bg-amber-100 text-amber-700 dark:bg-zinc-800 dark:text-amber-400 border-amber-200 dark:border-zinc-700 animate-pulse',
      icon: <Send className="h-3 w-3" />,
    },
    // RUNNING is an alias for SENDING - display the same way
    RUNNING: {
      label: 'Sending',
      className:
        'bg-amber-100 text-amber-700 dark:bg-zinc-800 dark:text-amber-400 border-amber-200 dark:border-zinc-700 animate-pulse',
      icon: <Send className="h-3 w-3" />,
    },
    PAUSED: {
      label: 'Paused',
      className:
        'bg-orange-100 text-orange-700 dark:bg-zinc-800 dark:text-orange-400 border-orange-200 dark:border-zinc-700',
      icon: <Pause className="h-3 w-3" />,
    },
    COMPLETED: {
      label: 'Completed',
      className:
        'bg-green-100 text-green-700 dark:bg-zinc-800 dark:text-green-400 border-green-200 dark:border-zinc-700',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    FAILED: {
      label: 'Failed',
      className:
        'bg-red-100 text-red-700 dark:bg-zinc-800 dark:text-red-400 border-red-200 dark:border-zinc-700',
      icon: <XCircle className="h-3 w-3" />,
    },
    CANCELLED: {
      label: 'Cancelled',
      className:
        'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 border-gray-200 dark:border-zinc-700',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  };

  const { label, className, icon } = config[status];

  return (
    <Badge variant="outline" className={`gap-1 font-medium ${className}`}>
      {icon}
      {label}
    </Badge>
  );
}

// ============================================================================
// Type Badge Component
// ============================================================================

function TypeBadge({ type }: { type: EmailCampaignType }) {
  const config: Record<EmailCampaignType, { label: string; className: string }> = {
    NEWSLETTER: {
      label: 'Newsletter',
      className: 'bg-purple-100 text-purple-700 dark:bg-zinc-800 dark:text-purple-400',
    },
    ANNOUNCEMENT: {
      label: 'Announcement',
      className: 'bg-indigo-100 text-indigo-700 dark:bg-zinc-800 dark:text-indigo-400',
    },
    TRANSACTIONAL: {
      label: 'Transactional',
      className: 'bg-cyan-100 text-cyan-700 dark:bg-zinc-800 dark:text-cyan-400',
    },
    AUTOMATED: {
      label: 'Automated',
      className: 'bg-teal-100 text-teal-700 dark:bg-zinc-800 dark:text-teal-400',
    },
    SYSTEM: {
      label: 'System',
      className: 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-400',
    },
  };

  const { label, className } = config[type];

  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  );
}

// ============================================================================
// Stats Card Component
// ============================================================================

function StatsCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${color}`}>
      <div className="p-2 rounded-md bg-slate-100 dark:bg-zinc-800">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Format Date Utility
// ============================================================================

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// Main CampaignsTab Component
// ============================================================================

interface CampaignsTabProps {
  templates: EmailTemplate[];
}

export default function CampaignsTab({ templates }: CampaignsTabProps) {
  const {
    campaigns,
    loading,
    error,
    page,
    totalPages,
    totalItems,
    filters,
    setSearch,
    setStatusFilter,
    setTypeFilter,
    setDateRangeFilter,
    setPage,
    stats,
    loadCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    duplicateCampaign,
    startCampaign,
    pauseCampaign,
    resumeCampaign,
    cancelCampaign,
    getCampaign,
    getCampaignActivities,
  } = useEmailCampaigns();

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handlers
  const handleView = (id: string) => {
    setSelectedCampaignId(id);
    setViewModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedCampaignId(id);
    setIsEditing(true);
    setFormModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCampaignId(null);
    setIsEditing(false);
    setFormModalOpen(true);
  };

  const handleDuplicate = async (id: string) => {
    await duplicateCampaign(id);
  };

  const handleStart = async (id: string) => {
    await startCampaign(id);
  };

  const handlePause = async (id: string) => {
    await pauseCampaign(id);
  };

  const handleResume = async (id: string) => {
    await resumeCampaign(id);
  };

  const handleCancel = async (id: string) => {
    await cancelCampaign(id);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteCampaign(deletingId);
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleEditFromView = () => {
    setViewModalOpen(false);
    if (selectedCampaignId) {
      setIsEditing(true);
      setFormModalOpen(true);
    }
  };

  const handleDuplicateFromView = async () => {
    if (selectedCampaignId) {
      await duplicateCampaign(selectedCampaignId);
      setViewModalOpen(false);
    }
  };

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold">Failed to Load Campaigns</h3>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button onClick={loadCampaigns} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-xl bg-muted/50 p-4">
      {/* Toolbar */}
      <Card className="border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={filters.search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2">
              {/* Status Filter */}
              <Select value={filters.status} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="SENDING">Sending</SelectItem>

                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={filters.type} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-[150px] bg-background">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="NEWSLETTER">Newsletter</SelectItem>
                  <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                  <SelectItem value="TRANSACTIONAL">Transactional</SelectItem>
                  <SelectItem value="AUTOMATED">Automated</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={filters.dateRange} onValueChange={(v) => setDateRangeFilter(v as any)}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>

              {/* Refresh */}
              <Button
                variant="outline"
                size="icon"
                onClick={loadCampaigns}
                disabled={loading}
                className="bg-background hover:bg-muted"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              {/* Create Campaign Button */}
              <Button
                onClick={handleCreate}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
              >
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatsCard
          label="Total"
          value={stats.total}
          icon={<Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          color="bg-card border hover:bg-muted/50"
        />
        <StatsCard
          label="Scheduled"
          value={stats.scheduled}
          icon={<Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
          color="bg-card border hover:bg-muted/50"
        />
        <StatsCard
          label="Running"
          value={stats.running}
          icon={<Send className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          color="bg-card border hover:bg-muted/50"
        />
        <StatsCard
          label="Completed"
          value={stats.completed}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          color="bg-card border hover:bg-muted/50"
        />
        <StatsCard
          label="Failed"
          value={stats.failed}
          icon={<XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
          color="bg-card border hover:bg-muted/50"
        />
      </div>

      {/* Campaigns Table */}
      <Card className="overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Target</TableHead>
                <TableHead className="font-semibold">Scheduled</TableHead>
                <TableHead className="font-semibold">Sent / Total</TableHead>
                <TableHead className="font-semibold">Updated</TableHead>
                <TableHead className="font-semibold w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div className="p-4 rounded-full bg-muted">
                        <Inbox className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">No Campaigns Found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {filters.search || filters.status !== 'all' || filters.type !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Get started by creating your first campaign'}
                        </p>
                      </div>
                      <Button onClick={handleCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Campaign
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow
                    key={campaign.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleView(campaign.id)}
                  >
                    <TableCell>
                      <div className="min-w-[200px]">
                        <p className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                          {campaign.name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {campaign.subject}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={campaign.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <TypeBadge type={campaign.type} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="capitalize">
                          {campaign.targetType.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(campaign.scheduledAt)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {campaign.sentCount} / {campaign.totalRecipients}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(campaign.updatedAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(campaign.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(campaign.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(campaign.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {['DRAFT', 'SCHEDULED', 'PAUSED'].includes(campaign.status) && (
                            <DropdownMenuItem onClick={() => handleStart(campaign.id)}>
                              <Play className="mr-2 h-4 w-4" />
                              Start
                            </DropdownMenuItem>
                          )}
                          {['RUNNING', 'SENDING'].includes(campaign.status) && (
                            <DropdownMenuItem onClick={() => handlePause(campaign.id)}>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'PAUSED' && (
                            <DropdownMenuItem onClick={() => handleResume(campaign.id)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Resume
                            </DropdownMenuItem>
                          )}
                          {!['COMPLETED', 'CANCELLED', 'FAILED'].includes(campaign.status) && (
                            <DropdownMenuItem
                              onClick={() => handleCancel(campaign.id)}
                              className="text-orange-600 focus:text-orange-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(campaign.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && campaigns.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, totalItems)} of {totalItems}{' '}
              campaigns
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                Page {page} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <CampaignFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        campaign={isEditing && selectedCampaignId ? getCampaign(selectedCampaignId) : undefined}
        isEditing={isEditing}
        onSubmit={async (data: CampaignFormData) => {
          if (isEditing && selectedCampaignId) {
            await updateCampaign(selectedCampaignId, data);
          } else {
            await createCampaign(data);
          }
          setFormModalOpen(false);
        }}
        templates={templates}
      />

      <CampaignViewModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        campaign={selectedCampaignId ? getCampaign(selectedCampaignId) : undefined}
        activities={selectedCampaignId ? getCampaignActivities(selectedCampaignId) : []}
        onEdit={handleEditFromView}
        onDuplicate={handleDuplicateFromView}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
