'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  GitBranch,
  AlertCircle,
  Folder,
  MoreHorizontal,
  Download,
  Eye,
  Activity,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { workflowService } from '@/api/services/workflowService';
import { WorkflowInstanceResponse } from '@/types/api';
import { formatDate } from '@/lib/dateFormatter';
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline';
import { WorkflowHistory } from '@/components/workflow/WorkflowHistory';
import { ReassignStepDialog } from '@/components/workflow/ReassignStepDialog';
import { useNotifications } from '@/hooks/useNotifications';
import UserAvatar from '@/components/main/UserAvatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import WorkflowInstanceStepsTab from '@/components/workflow/WorkflowInstanceStepsTab';

export default function WorkflowInstanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const instanceId = params?.instanceId as string;

  const { showSuccess, showError } = useNotifications();
  const [instance, setInstance] = useState<WorkflowInstanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('progress');

  // Management states
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedStepInstanceId, setSelectedStepInstanceId] = useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [completionComment, setCompletionComment] = useState('');

  useEffect(() => {
    if (instanceId) {
      loadInstance();
    }
  }, [instanceId]);

  const loadInstance = async () => {
    try {
      setLoading(true);
      const response = await workflowService.getUserInstances(0, 1000);
      const foundInstance = response.content.find(inst => inst.id === Number(instanceId));

      if (!foundInstance) {
        showError('Workflow instance not found');
        router.back();
        return;
      }

      setInstance(foundInstance);
    } catch (error: any) {
      console.error('Error loading workflow instance:', error);
      showError('Failed to load workflow instance', error?.message || 'Unknown error');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleReassignStep = (stepInstanceId: number) => {
    setSelectedStepInstanceId(stepInstanceId);
    setShowReassignDialog(true);
  };

  const handleReassign = async (assignments: any[], reason: string) => {
    if (!instance || !selectedStepInstanceId) return;

    try {
      await workflowService.reassignStep(
        instance.id,
        selectedStepInstanceId,
        { assignments, reason }
      );

      showSuccess('Step reassigned successfully');
      setShowReassignDialog(false);
      setSelectedStepInstanceId(null);
      await loadInstance();
    } catch (error: any) {
      console.error('Error reassigning step:', error);
      showError('Failed to reassign step', error?.message || 'Unknown error');
    }
  };

  const handleCancelInstance = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!instance || !cancellationReason.trim()) return;

    try {
      await workflowService.cancelWorkflowInstance(instance.id, cancellationReason);
      showSuccess('Workflow instance cancelled');
      setShowCancelDialog(false);
      setCancellationReason('');
      await loadInstance();
    } catch (error: any) {
      console.error('Error cancelling instance:', error);
      showError('Failed to cancel workflow instance', error?.message || 'Unknown error');
    }
  };

  const handleCompleteInstance = () => {
    setShowCompleteDialog(true);
  };

  const handleConfirmComplete = async () => {
    if (!instance) return;

    try {
      await workflowService.forceCompleteWorkflowInstance(instance.id, completionComment);
      showSuccess('Workflow instance completed');
      setShowCompleteDialog(false);
      setCompletionComment('');
      await loadInstance();
    } catch (error: any) {
      console.error('Error completing instance:', error);
      showError('Failed to complete workflow instance', error?.message || 'Unknown error');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <p className="text-lg font-semibold">Workflow Instance Not Found</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'ACTIVE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {instance.workflow.name}
              </h1>
              <Badge variant="outline" className={`${getStatusColor(instance.status)} border`}>
                {instance.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Document: </span>
              <span className="font-medium text-foreground">{instance.document.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/documents/${instance.document.documentId}`)}
            className="h-9"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Document
          </Button>

          {instance.status === 'ACTIVE' && (
            <>
              <Button variant="outline" onClick={handleCompleteInstance} className="h-9 text-green-600 hover:text-green-700 hover:bg-green-50">
                <CheckCircle className="h-4 w-4 mr-2" />
                Force Complete
              </Button>
              <Button variant="outline" onClick={handleCancelInstance} className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50">
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Current Step</p>
              <p className="font-semibold truncate max-w-[150px]">
                {instance.currentStep?.name || 'None'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Started By</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <UserAvatar user={instance.startedBy} size="sm" />
                <span className="font-medium text-sm">
                  {instance.startedBy?.displayName || instance.startedBy?.username || 'System'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Started At</p>
              <p className="font-semibold text-sm">{formatDate(instance.startedAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Progress</p>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{instance.completedStepsCount}/{instance.totalStepsCount}</span>
                <span className="text-xs text-muted-foreground">steps</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] bg-muted/50 p-1">
          <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Progress
          </TabsTrigger>
          <TabsTrigger value="document" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Document
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            History
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Visual Progress Bar */}
          <Card className="border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Overall Completion</span>
                <span className="text-sm font-bold text-blue-900">
                  {Math.round((instance.completedStepsCount / Math.max(instance.totalStepsCount, 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-blue-200/50 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{
                    width: `${(instance.completedStepsCount / Math.max(instance.totalStepsCount, 1)) * 100}%`
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <WorkflowInstanceStepsTab
            instance={instance}
            onReassign={handleReassignStep}
            onActionComplete={loadInstance}
          />
        </TabsContent>

        <TabsContent value="document" className="animate-in fade-in-50 duration-300">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Document Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">File Information</Label>
                    <div className="mt-3 space-y-4">
                      <div className="bg-muted/30 p-3 rounded-lg border border-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Name</p>
                        <p className="font-medium break-all">{instance.document.name}</p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border border-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Title</p>
                        <p className="font-medium">{instance.document.title || 'No title'}</p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border border-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Path</p>
                        <div className="flex items-center gap-2">
                          <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                          <code className="text-sm font-mono break-all">{instance.document.path}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Metadata & Properties</Label>
                    <div className="mt-3 space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1 bg-muted/30 p-3 rounded-lg border border-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Type</p>
                          <Badge variant="secondary" className="mt-0.5">{instance.document.mimeType}</Badge>
                        </div>
                        <div className="flex-1 bg-muted/30 p-3 rounded-lg border border-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Size</p>
                          <p className="font-medium">{(instance.document.sizeBytes / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>

                      <div className="bg-muted/30 p-3 rounded-lg border border-muted/50">
                        <p className="text-xs text-muted-foreground mb-2">Metadata Tags</p>
                        {instance.document.metadata && instance.document.metadata.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {instance.document.metadata.map((meta, idx) => (
                              <Badge key={idx} variant="outline" className="bg-background">
                                {meta}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No metadata available</p>
                        )}
                      </div>

                      <div className="bg-muted/30 p-3 rounded-lg border border-muted/50">
                        <p className="text-xs text-muted-foreground mb-2">Owner</p>
                        <div className="flex items-center gap-2">
                          <UserAvatar user={instance.document.createdBy} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{instance.document.createdBy?.displayName || instance.document.createdBy?.username}</p>
                            <p className="text-xs text-muted-foreground">{instance.document.createdBy?.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in-50 duration-300">
          <Card>
            <CardHeader>
              <CardTitle>Audit History</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowHistory
                workflowInstanceId={instance.id}
                documentId={instance.document.documentId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="animate-in fade-in-50 duration-300">
          <Card>
            <CardHeader>
              <CardTitle>Visual Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowTimeline
                workflowInstanceId={instance.id}
                documentId={instance.document.documentId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reassign Dialog */}
      {selectedStepInstanceId && (
        <ReassignStepDialog
          isOpen={showReassignDialog}
          onClose={() => {
            setShowReassignDialog(false);
            setSelectedStepInstanceId(null);
          }}
          onReassign={handleReassign}
        />
      )}

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Workflow Instance</DialogTitle>
            <DialogDescription>
              This will cancel the workflow for document "{instance.document.name}".
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                Cancellation Reason <span className="text-red-500">*</span>
              </Label>
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

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Complete Workflow Instance</DialogTitle>
            <DialogDescription>
              This will forcefully complete the workflow for document "{instance.document.name}",
              skipping any remaining steps. Use with caution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Completion Comment</Label>
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
            <Button onClick={handleConfirmComplete}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Force Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
