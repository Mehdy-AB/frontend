'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Workflow,
  ArrowLeft,
  Edit,
  Trash2,
  Play,
  Pause,
  GitBranch,
  Users,
  Clock,
  CheckCircle,
  FileText,
  Settings,
  BarChart3,
  Shield,
  Plus,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { workflowService } from '@/api/services/workflowService';
import {
  WorkflowDetailResponse,
  WorkflowInstanceResponse,
  WorkflowAdminResponse,
  UpdateWorkflowRequest,
} from '@/types/api';
import { formatDate } from '@/lib/dateFormatter';
import WorkflowProgressVisualization from '@/components/workflow/WorkflowProgressVisualization';
import WorkflowInstancesTab from '@/components/workflow/WorkflowInstancesTab';
import WorkflowTriggersTab from '@/components/workflow/WorkflowTriggersTab';
import WorkflowStepsTab from '@/components/workflow/WorkflowStepsTab';
import WorkflowAdminModal from '@/components/modals/WorkflowAdminModal';
import { useNotifications } from '@/hooks/useNotifications';
import UserAvatar from '@/components/main/UserAvatar';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { ReassignStepDialog } from '@/components/workflow/ReassignStepDialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params?.workflowId as string;

  const { showSuccess, showError } = useNotifications();
  const [workflow, setWorkflow] = useState<WorkflowDetailResponse | null>(null);
  const [workflowInstances, setWorkflowInstances] = useState<WorkflowInstanceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<WorkflowAdminResponse | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Instance management states
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstanceResponse | null>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [completionComment, setCompletionComment] = useState('');
  const [selectedStepInstanceId, setSelectedStepInstanceId] = useState<number | null>(null);

  // Filter and search states
  const [instanceSearchTerm, setInstanceSearchTerm] = useState('');
  const [instanceStatusFilter, setInstanceStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (workflowId) {
      loadWorkflow();
    }
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getWorkflow(Number(workflowId));
      setWorkflow(data);

      // Load workflow instances
      try {
        const instancesResponse = await workflowService.getUserInstances(0, 1000);
        const relevantInstances = instancesResponse.content.filter(
          inst => inst.workflow.id === Number(workflowId)
        );
        setWorkflowInstances(relevantInstances);
      } catch (err) {
        console.error('Error loading instances:', err);
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter instances based on search and status
  const filteredInstances = workflowInstances.filter((instance) => {
    const matchesSearch = instanceSearchTerm === '' ||
      instance.document.name.toLowerCase().includes(instanceSearchTerm.toLowerCase()) ||
      (instance.document.title && instance.document.title.toLowerCase().includes(instanceSearchTerm.toLowerCase()));

    const matchesStatus = instanceStatusFilter === 'all' ||
      instance.status === instanceStatusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  // Calculate analytics
  const analytics = {
    totalInstances: workflowInstances.length,
    activeInstances: workflowInstances.filter(i => i.status === 'ACTIVE').length,
    completedInstances: workflowInstances.filter(i => i.status === 'COMPLETED').length,
    cancelledInstances: workflowInstances.filter(i => i.status === 'CANCELLED').length,
    averageCompletionTime: calculateAverageCompletionTime(workflowInstances),
    completionRate: workflowInstances.length > 0
      ? ((workflowInstances.filter(i => i.status === 'COMPLETED').length / workflowInstances.length) * 100).toFixed(1)
      : '0',
  };

  function calculateAverageCompletionTime(instances: WorkflowInstanceResponse[]): string {
    const completedInstances = instances.filter(i => i.status === 'COMPLETED' && i.completedAt);
    if (completedInstances.length === 0) return 'N/A';

    const totalMs = completedInstances.reduce((sum, instance) => {
      const start = new Date(instance.startedAt).getTime();
      const end = new Date(instance.completedAt!).getTime();
      return sum + (end - start);
    }, 0);

    const avgMs = totalMs / completedInstances.length;
    const avgDays = Math.floor(avgMs / (1000 * 60 * 60 * 24));
    const avgHours = Math.floor((avgMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (avgDays > 0) {
      return `${avgDays}d ${avgHours}h`;
    } else {
      return `${avgHours}h`;
    }
  }

  const handleEdit = () => {
    router.push(`/admin/workflow/designer?id=${workflowId}`);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        await workflowService.deleteWorkflow(Number(workflowId));
        showSuccess('Workflow Deleted', 'Workflow deleted successfully');
        router.push('/admin/workflow');
      } catch (error: any) {
        showError('Delete Failed', error?.response?.data?.message || 'Failed to delete workflow');
      }
    }
  };

  const handleAddAdmin = () => {
    setShowAdminModal(true);
  };

  const handleSaveAdmin = async (data: {
    userId: string;
  }) => {
    await workflowService.addWorkflowAdmin(Number(workflowId), data);
    showSuccess('Admin Added', 'Workflow admin added successfully');
    await loadWorkflow();
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    try {
      await workflowService.removeWorkflowAdmin(Number(workflowId), adminToDelete.user.id);
      showSuccess('Admin Removed', 'Workflow admin removed successfully');
      setShowDeleteModal(false);
      setAdminToDelete(null);
      await loadWorkflow();
    } catch (error: any) {
      showError('Delete Failed', error?.response?.data?.message || 'Failed to remove admin');
    }
  };

  // Instance management handlers
  const handleReassignInstance = (instance: WorkflowInstanceResponse, stepInstanceId: number) => {
    setSelectedInstance(instance);
    setSelectedStepInstanceId(stepInstanceId);
    setShowReassignDialog(true);
  };

  const handleReassign = async (userIds: string[]) => {
    if (!selectedInstance || !selectedStepInstanceId) return;

    try {
      await workflowService.reassignStep(
        selectedInstance.id,
        selectedStepInstanceId,
        {
          assignments: userIds.map(userId => ({
            assigneeType: 'USER' as const,
            userId,
          })),
          reason: 'Reassigned by workflow admin',
        }
      );
      showSuccess('Reassigned', 'Step reassigned successfully');
      setShowReassignDialog(false);
      setSelectedInstance(null);
      setSelectedStepInstanceId(null);
      await loadWorkflow();
    } catch (error: any) {
      showError('Reassignment Failed', error?.response?.data?.message || 'Failed to reassign step');
    }
  };

  const handleCancelInstance = (instance: WorkflowInstanceResponse) => {
    setSelectedInstance(instance);
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedInstance) return;

    try {
      // Call cancel workflow endpoint (needs to be added to workflowService)
      await workflowService.cancelWorkflowInstance(selectedInstance.id, cancellationReason);
      showSuccess('Cancelled', 'Workflow instance cancelled successfully');
      setShowCancelDialog(false);
      setSelectedInstance(null);
      setCancellationReason('');
      await loadWorkflow();
    } catch (error: any) {
      showError('Cancel Failed', error?.response?.data?.message || 'Failed to cancel workflow');
    }
  };

  const handleCompleteInstance = (instance: WorkflowInstanceResponse) => {
    setSelectedInstance(instance);
    setShowCompleteDialog(true);
  };

  const handleConfirmComplete = async () => {
    if (!selectedInstance) return;

    try {
      // Force complete the workflow (needs to be added to workflowService)
      await workflowService.forceCompleteWorkflowInstance(selectedInstance.id, completionComment);
      showSuccess('Completed', 'Workflow instance completed successfully');
      setShowCompleteDialog(false);
      setSelectedInstance(null);
      setCompletionComment('');
      await loadWorkflow();
    } catch (error: any) {
      showError('Complete Failed', error?.response?.data?.message || 'Failed to complete workflow');
    }
  };

  const handleToggleActive = async () => {
    if (!workflow) return;

    try {
      const updateData: UpdateWorkflowRequest = {
        name: workflow.name,
        description: workflow.description,
        isActive: !workflow.isActive,
        steps: workflow.steps.map(step => ({
          name: step.name,
          description: step.description,
          stepOrder: step.stepOrder,
          expirationDays: step.expirationDays,
          isRequired: step.isRequired,
          onCompleteAction: step.onCompleteAction as any,
          targetFolderId: step.targetFolderId,
          allowParallelApproval: step.allowParallelApproval,
          minApprovalsNeeded: step.minApprovalsNeeded,
          assignments: step.assignments?.map(a => ({
            assigneeType: a.assigneeType,
            assigneeId: a.user?.id || a.role?.id || a.group?.id || '',
            canEdit: a.canEdit,
          })) || [],
        })),
        trigger: {
          triggerType: 'FOLDER',
          folderId: undefined,
        },
      };

      await workflowService.updateWorkflow(Number(workflowId), updateData);
      showSuccess('Updated', `Workflow ${workflow.isActive ? 'deactivated' : 'activated'} successfully`);
      await loadWorkflow();
    } catch (error: any) {
      showError('Update Failed', error?.response?.data?.message || 'Failed to update workflow');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Workflow Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The workflow you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push('/admin/workflow')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workflows
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/workflow')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Workflow className="h-6 w-6" />
              {workflow.name}
            </h1>
            <p className="text-muted-foreground">
              View and manage workflow details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <GitBranch className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600/80">Total Steps</p>
                <p className="text-3xl font-bold text-gray-900">{workflow.steps?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600/80">Active Instances</p>
                <p className="text-3xl font-bold text-gray-900">
                  {workflowInstances.filter(i => i.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-600/80">Avg Completion</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.averageCompletionTime}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600/80">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.completionRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Workflow Steps</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="instances">Workflow Instances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Workflow Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                Workflow Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground text-xs">Name</Label>
                  <p className="text-lg font-semibold mt-1">{workflow.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div className="mt-1">
                    <Badge variant={workflow.isActive ? "default" : "secondary"} className="text-sm">
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
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Description</Label>
                <p className="text-sm mt-1">
                  {workflow.description || 'No description provided'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-muted-foreground text-xs">Total Steps</Label>
                  <p className="text-2xl font-bold mt-1">{workflow.steps?.length || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Admins</Label>
                  <p className="text-2xl font-bold mt-1">{workflow.admins?.length || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Created</Label>
                  <p className="text-sm font-medium mt-1">{formatDate(workflow.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Total Instances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.totalInstances}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All workflow instances
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.completionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.completedInstances} of {analytics.totalInstances} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Avg. Completion Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.averageCompletionTime}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  For completed workflows
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Triggers Section */}
          <WorkflowTriggersTab workflowId={Number(workflowId)} />
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <WorkflowStepsTab workflow={workflow} />
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Workflow Admins
                </CardTitle>
                <Button onClick={handleAddAdmin} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {workflow.admins && workflow.admins.length > 0 ? (
                <div className="space-y-3">
                  {workflow.admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <UserAvatar user={admin.user} size="md" />
                        <div>
                          <h4 className="font-semibold">
                            {admin.user.displayName || admin.user.username}
                          </h4>
                          <p className="text-sm text-muted-foreground">{admin.user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAdminToDelete(admin);
                          setShowDeleteModal(true);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No admins assigned to this workflow</p>
                  <Button onClick={handleAddAdmin} className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Admin
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instances" className="mt-6">
          <WorkflowInstancesTab workflowId={Number(workflowId)} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4" style={{ display: 'none' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Instances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.totalInstances}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All workflow instances
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.completionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.completedInstances} of {analytics.totalInstances} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Completion Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.averageCompletionTime}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  For completed workflows
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Instance Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm font-medium">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{analytics.activeInstances}</span>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{
                          width: `${analytics.totalInstances > 0 ? (analytics.activeInstances / analytics.totalInstances * 100) : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {analytics.totalInstances > 0 ? ((analytics.activeInstances / analytics.totalInstances * 100).toFixed(0)) : 0}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{analytics.completedInstances}</span>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${analytics.totalInstances > 0 ? (analytics.completedInstances / analytics.totalInstances * 100) : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {analytics.totalInstances > 0 ? ((analytics.completedInstances / analytics.totalInstances * 100).toFixed(0)) : 0}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium">Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{analytics.cancelledInstances}</span>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{
                          width: `${analytics.totalInstances > 0 ? (analytics.cancelledInstances / analytics.totalInstances * 100) : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {analytics.totalInstances > 0 ? ((analytics.cancelledInstances / analytics.totalInstances * 100).toFixed(0)) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Step Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workflow?.steps && workflow.steps.length > 0 ? (
                <div className="space-y-3">
                  {workflow.steps.map((step) => {
                    const stepInstances = workflowInstances.flatMap(inst =>
                      inst.stepInstances?.filter(si => si.workflowStep?.id === step.id) || []
                    );
                    const completedCount = stepInstances.filter(si => si.status === 'COMPLETED').length;
                    const activeCount = stepInstances.filter(si => si.status === 'ACTIVE').length;

                    return (
                      <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                            {step.stepOrder}
                          </div>
                          <div>
                            <p className="font-medium">{step.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {completedCount} completed, {activeCount} active
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {stepInstances.length} total
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No steps configured for this workflow</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs >

      {/* Admin Management Modal */}
      < WorkflowAdminModal
        isOpen={showAdminModal}
        onClose={() => {
          setShowAdminModal(false);
        }}
        onSave={handleSaveAdmin}
        editingAdmin={null}
        existingAdminUserIds={workflow.admins?.map(a => a.user.id) || []}
      />

      {/* Delete Confirmation Modal */}
      < ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAdminToDelete(null);
        }}
        onConfirm={handleDeleteAdmin}
        title="Remove Workflow Admin"
        message={`Are you sure you want to remove ${adminToDelete?.user.displayName || adminToDelete?.user.username} as an admin of this workflow?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Reassign Step Dialog */}
      {
        selectedInstance && selectedStepInstanceId && (
          <ReassignStepDialog
            isOpen={showReassignDialog}
            onClose={() => {
              setShowReassignDialog(false);
              setSelectedInstance(null);
              setSelectedStepInstanceId(null);
            }}
            onReassign={handleReassign}
          />
        )
      }

      {/* Cancel Instance Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Workflow Instance</DialogTitle>
            <DialogDescription>
              This will cancel the workflow for document "{selectedInstance?.document.name}".
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Provide a reason for cancelling this workflow..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancellationReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={!cancellationReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Instance Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Complete Workflow Instance</DialogTitle>
            <DialogDescription>
              This will forcefully complete the workflow for document "{selectedInstance?.document.name}",
              skipping any remaining steps. Use with caution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Completion Comment
              </label>
              <Textarea
                value={completionComment}
                onChange={(e) => setCompletionComment(e.target.value)}
                placeholder="Add a comment about why this workflow is being force completed..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCompleteDialog(false);
                setCompletionComment('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmComplete}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Force Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
