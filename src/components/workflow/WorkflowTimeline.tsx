'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Users,
  Info,
  Calendar,
  Zap,
  FileCheck,
  UserCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Timer,
  Trash2,
  ListChecks,
  Stamp,
  XCircle,
  Ban,
  Repeat2,
  GitFork,
  Merge,
  Bell,
  Mail,
  FileInput,
  Workflow
} from 'lucide-react';
import { WorkflowTimelineResponse } from '@/types/workflow';
import { formatDate } from '@/lib/dateFormatter';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/main/UserAvatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface WorkflowTimelineProps {
  workflowInstanceId: number;
  documentId?: number;
}

// Calculate duration between two dates
const getDuration = (start?: string, end?: string) => {
  if (!start) return null;
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diffMs = endDate.getTime() - startDate.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  } else if (diffMins > 0) {
    return `${diffMins}m`;
  }
  return 'Just now';
};

// Get node type icon and colors
const getNodeTypeInfo = (nodeType: string) => {
  const types: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    START: { icon: <Zap className="w-3.5 h-3.5" />, label: 'Start', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    END: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'End', className: 'bg-gray-100 text-gray-700 border-gray-200' },
    CANCEL: { icon: <XCircle className="w-3.5 h-3.5" />, label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
    APPROVAL: { icon: <UserCheck className="w-3.5 h-3.5" />, label: 'Approval', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    REVIEW: { icon: <FileCheck className="w-3.5 h-3.5" />, label: 'Review', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    MANUAL_TASK: { icon: <FileText className="w-3.5 h-3.5" />, label: 'Task', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    CONDITION: { icon: <GitBranch className="w-3.5 h-3.5" />, label: 'Condition', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    MULTI_CHOICE: { icon: <ListChecks className="w-3.5 h-3.5" />, label: 'Choice', className: 'bg-violet-100 text-violet-700 border-violet-200' },
    DELAY: { icon: <Timer className="w-3.5 h-3.5" />, label: 'Delay', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    SET_METADATA: { icon: <FileText className="w-3.5 h-3.5" />, label: 'Set Metadata', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    MOVE_DOCUMENT: { icon: <FileText className="w-3.5 h-3.5" />, label: 'Move Document', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    DELETE_DOCUMENT: { icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Delete', className: 'bg-red-100 text-red-700 border-red-200' },
    STAMP_DOCUMENT: { icon: <Stamp className="w-3.5 h-3.5" />, label: 'Stamp', className: 'bg-teal-100 text-teal-700 border-teal-200' },
    LOCK_DOCUMENT: { icon: <FileText className="w-3.5 h-3.5" />, label: 'Lock', className: 'bg-red-100 text-red-700 border-red-200' },
    UNLOCK_DOCUMENT: { icon: <FileText className="w-3.5 h-3.5" />, label: 'Unlock', className: 'bg-green-100 text-green-700 border-green-200' },
    SPLIT: { icon: <GitFork className="w-3.5 h-3.5" />, label: 'Split', className: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' },
    JOIN: { icon: <Merge className="w-3.5 h-3.5" />, label: 'Join', className: 'bg-pink-100 text-pink-700 border-pink-200' },
    NOTIFICATION: { icon: <Bell className="w-3.5 h-3.5" />, label: 'Notification', className: 'bg-sky-100 text-sky-700 border-sky-200' },
    EMAIL: { icon: <Mail className="w-3.5 h-3.5" />, label: 'Email', className: 'bg-rose-100 text-rose-700 border-rose-200' },
    FORM_REQUEST: { icon: <FileInput className="w-3.5 h-3.5" />, label: 'Form Request', className: 'bg-lime-100 text-lime-700 border-lime-200' },
    SUB_WORKFLOW: { icon: <Workflow className="w-3.5 h-3.5" />, label: 'Sub-Workflow', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  };
  return types[nodeType] || { icon: <Circle className="w-3.5 h-3.5" />, label: nodeType, className: 'bg-gray-100 text-gray-700 border-gray-200' };
};

export function WorkflowTimeline({ workflowInstanceId, documentId }: WorkflowTimelineProps) {
  const [timeline, setTimeline] = useState<WorkflowTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const data = await workflowAdminService.getInstanceTimeline(workflowInstanceId);
        setTimeline(data);
        // Auto-expand active nodes
        const activeNodeIds = data.nodes
          .filter(n => n.status === 'ACTIVE' || n.status === 'SCHEDULED')
          .map(n => n.id ? `inst-${n.id}` : `node-${n.nodeId}`);
        setExpandedNodes(new Set(activeNodeIds));
      } catch (err) {
        console.error('Failed to fetch timeline:', err);
        setError('Failed to load timeline');
      } finally {
        setLoading(false);
      }
    };

    if (workflowInstanceId) {
      fetchTimeline();
    }
  }, [workflowInstanceId]);

  const toggleExpand = (nodeKey: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeKey)) {
        next.delete(nodeKey);
      } else {
        next.add(nodeKey);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4 text-center">{error}</div>;
  }

  if (!timeline || !timeline.nodes || timeline.nodes.length === 0) {
    return <div className="text-gray-500 p-4 text-center">No timeline steps available</div>;
  }

  // Sort nodes: START first, then completed (by completion time), active, pending, END last
  const sortedNodes = [...timeline.nodes].sort((a, b) => {
    // START always first
    if (a.nodeType === 'START') return -1;
    if (b.nodeType === 'START') return 1;
    // END always last
    if (a.nodeType === 'END') return 1;
    if (b.nodeType === 'END') return -1;

    // Status priority: COMPLETED < REJECTED < ACTIVE < SCHEDULED < PENDING/other
    const statusOrder: Record<string, number> = {
      'COMPLETED': 0,
      'REJECTED': 1,
      'ACTIVE': 2,
      'SCHEDULED': 3,  // SCHEDULED is actionable, show before other PENDING
      'PENDING': 4,
    };
    const aOrder = statusOrder[a.status] ?? 5;
    const bOrder = statusOrder[b.status] ?? 5;

    if (aOrder !== bOrder) return aOrder - bOrder;

    // Within same status, sort by time
    if (a.status === 'COMPLETED' && b.status === 'COMPLETED') {
      // Sort by completion time (earliest first)
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return aTime - bTime;
    }

    // For other statuses, use started time or step order
    const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
    const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
    return aTime - bTime;
  });

  const nodes = sortedNodes;
  const currentNodeId = timeline.nodes.find(s => s.status === 'ACTIVE' || s.status === 'SCHEDULED')?.id;

  const getStatusIcon = (status: string, isOverdue: boolean) => {
    if (status === 'COMPLETED') {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    if (status === 'ACTIVE' || status === 'SCHEDULED') {
      if (isOverdue) {
        return <AlertCircle className="w-5 h-5 text-red-600 animate-pulse" />;
      }
      return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
    }
    if (status === 'REJECTED') {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    if (status === 'CANCELLED') {
      return <Ban className="w-5 h-5 text-gray-500" />;
    }
    if (status === 'FAILED') {
      return <AlertCircle className="w-5 h-5 text-orange-600" />;
    }
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    const badges: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pending', className: 'bg-gray-100 text-gray-600' },
      ACTIVE: isOverdue
        ? { label: 'Overdue', className: 'bg-red-100 text-red-700' }
        : { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
      SCHEDULED: isOverdue
        ? { label: 'Overdue', className: 'bg-red-100 text-red-700' }
        : { label: 'Awaiting Action', className: 'bg-amber-100 text-amber-700' },
      COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
      REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
      EXPIRED: { label: 'Expired', className: 'bg-orange-100 text-orange-700' },
      CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600' },
      SKIPPED: { label: 'Not Executed', className: 'bg-gray-50 text-gray-400 border-gray-200' },
    };
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
    return (
      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const getCardStyle = (status: string, isOverdue: boolean, isCurrent: boolean) => {
    let base = 'border rounded-xl transition-all duration-200 ';
    if (status === 'COMPLETED') {
      base += 'border-green-200 bg-gradient-to-r from-green-50 to-white';
    } else if (status === 'ACTIVE' || status === 'SCHEDULED') {
      if (isOverdue) {
        base += 'border-red-300 bg-gradient-to-r from-red-50 to-white';
      } else {
        base += 'border-blue-300 bg-gradient-to-r from-blue-50 to-white';
      }
    } else if (status === 'REJECTED') {
      base += 'border-red-200 bg-gradient-to-r from-red-50 to-white';
    } else if (status === 'SKIPPED') {
      base += 'border-gray-200 bg-gray-50/50 opacity-60';
    } else {
      base += 'border-gray-200 bg-gradient-to-r from-gray-50 to-white';
    }
    if (isCurrent) {
      base += ' ring-2 ring-blue-400 shadow-md';
    }
    return base;
  };

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          const nodeKey = node.id ? `inst-${node.id}` : `node-${node.nodeId}`;
          const isCurrent = node.id === currentNodeId;
          const isExpanded = expandedNodes.has(nodeKey);
          const nodeTypeInfo = getNodeTypeInfo(node.nodeType);
          const duration = getDuration(node.startedAt, node.completedAt);
          const isConditionNode = node.nodeType === 'CONDITION';
          const conditionResult = node.resultEdge;
          const conditionSummary = node.resultData?.conditionSummary as string | undefined;
          const isSplitNode = node.nodeType === 'SPLIT';
          const isJoinNode = node.nodeType === 'JOIN';
          const splitBranches = isSplitNode ? (node.resultData?.branches || node.resultData?.branchCount) as number | undefined : undefined;
          const joinArrived = isJoinNode && node.resultData ? (node.resultData as any)?.arrivedFrom?.length : undefined;
          const joinRequired = isJoinNode && node.resultData ? (node.resultData as any)?.required : undefined;
          const hasDetails = node.description || (node.assignments && node.assignments.length > 0) || node.comment || conditionSummary || isSplitNode || isJoinNode;

          // Loop iteration detection: count how many times this nodeId has appeared before this index
          const sameNodeOccurrences = nodes.filter((n, i) => i <= index && n.nodeId === node.nodeId);
          const iterationNumber = sameNodeOccurrences.length;
          const totalIterations = nodes.filter(n => n.nodeId === node.nodeId).length;
          const isLoopIteration = totalIterations > 1;

          return (
            <div key={nodeKey} className="relative">
              {/* Connection line */}
              {!isLast && (
                <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 to-gray-200" />
              )}

              {/* Node Card */}
              <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(nodeKey)}>
                <div className={getCardStyle(node.status, node.isOverdue ?? false, isCurrent)}>
                  {/* Header - Always visible */}
                  <CollapsibleTrigger asChild>
                    <div className="p-3 cursor-pointer hover:bg-white/50 transition-colors rounded-t-xl">
                      <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getStatusIcon(node.status, node.isOverdue ?? false)}
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          {/* Top row: Type badge + Status + Duration */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline" className={`${nodeTypeInfo.className} text-[10px] px-1.5 py-0 h-5`}>
                              {nodeTypeInfo.icon}
                              <span className="ml-1">{nodeTypeInfo.label}</span>
                            </Badge>
                            {getStatusBadge(node.status, node.isOverdue ?? false)}
                            {duration && (
                              <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {duration}
                              </span>
                            )}
                            {/* Condition result badge */}
                            {isConditionNode && conditionResult && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-5 ${conditionResult === 'TRUE'
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : conditionResult === 'FALSE'
                                    ? 'bg-red-100 text-red-700 border-red-200'
                                    : 'bg-gray-100 text-gray-600 border-gray-200'
                                  }`}
                              >
                                {conditionResult === 'TRUE' ? '✅ True' : conditionResult === 'FALSE' ? '❌ False' : conditionResult}
                              </Badge>
                            )}
                            {/* Loop iteration badge */}
                            {isLoopIteration && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-5 bg-violet-50 text-violet-700 border-violet-200"
                              >
                                <Repeat2 className="w-3 h-3 mr-0.5" />
                                Iteration {iterationNumber}/{totalIterations}
                              </Badge>
                            )}
                            {/* Split branch count badge */}
                            {isSplitNode && splitBranches && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-5 bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
                              >
                                <GitFork className="w-3 h-3 mr-0.5" />
                                {splitBranches} branches
                              </Badge>
                            )}
                            {/* Join progress badge */}
                            {isJoinNode && joinRequired && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-5 ${joinArrived >= joinRequired
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-pink-50 text-pink-700 border-pink-200'
                                  }`}
                              >
                                <Merge className="w-3 h-3 mr-0.5" />
                                {joinArrived || 0}/{joinRequired} arrived
                              </Badge>
                            )}
                          </div>

                          {/* Node Name */}
                          <h3 className="font-semibold text-sm text-gray-900">{node.nodeName}</h3>

                          {/* Quick info row */}
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 flex-wrap">
                            {node.startedAt && (
                              <span>Started: {formatDate(node.startedAt)}</span>
                            )}
                            {node.completedAt && (
                              <span className="text-green-600">Completed: {formatDate(node.completedAt)}</span>
                            )}
                            {node.dueDate && (
                              <span className={node.isOverdue ? 'text-red-600 font-medium' : ''}>
                                Due: {formatDate(node.dueDate)}
                              </span>
                            )}
                          </div>

                          {/* Summary: Completed by + Action in header */}
                          {node.completedBy && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] text-gray-500">Completed by:</span>
                              <div className="flex items-center gap-1">
                                <UserAvatar
                                  user={{
                                    id: node.completedBy.id,
                                    firstName: node.completedBy.firstName,
                                    lastName: node.completedBy.lastName,
                                    imgUrl: node.completedBy.imgUrl,
                                    email: node.completedBy.email,
                                    username: node.completedBy.username,
                                  }}
                                  size="xs"
                                />
                                <span className="text-[10px] font-medium text-gray-700">
                                  {node.completedBy.firstName} {node.completedBy.lastName}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Comment preview in header - show first comment with action color */}
                          {node.assignments && node.assignments.length > 0 && (() => {
                            const commentAssignment = node.assignments.find(a => a.comment);
                            if (!commentAssignment) return null;
                            const isRejected = commentAssignment.action === 'REJECTED';
                            return (
                              <div className={`mt-2 p-1.5 rounded text-[10px] ${isRejected
                                ? 'bg-red-50 border border-red-200'
                                : 'bg-amber-50 border border-amber-100'
                                }`}>
                                <span className={`font-medium ${isRejected ? 'text-red-600' : 'text-gray-600'}`}>
                                  {isRejected ? '❌ Rejected: ' : '💬 '}
                                </span>
                                <span className={`italic ${isRejected ? 'text-red-600' : 'text-gray-700'}`}>
                                  "{commentAssignment.comment}"
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Expand/Collapse indicator */}
                        {hasDetails && (
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Expanded Content */}
                  <CollapsibleContent>
                    <div className="px-3 pb-3 pt-0 border-t border-gray-100 space-y-3">
                      {/* Condition evaluation summary */}
                      {isConditionNode && conditionSummary && (
                        <div className={`mt-3 p-2.5 rounded-lg border ${conditionResult === 'TRUE'
                          ? 'bg-green-50/70 border-green-100'
                          : conditionResult === 'FALSE'
                            ? 'bg-red-50/70 border-red-100'
                            : 'bg-gray-50/70 border-gray-100'
                          }`}>
                          <div className="flex items-start gap-2">
                            <GitBranch className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${conditionResult === 'TRUE' ? 'text-green-500' : 'text-red-500'
                              }`} />
                            <div>
                              <p className="text-[10px] font-medium text-gray-500 mb-0.5">Evaluated condition:</p>
                              <p className={`text-xs leading-relaxed ${conditionResult === 'TRUE' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                {conditionSummary}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Description/Instructions */}
                      {node.description && (
                        <div className="mt-3 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-semibold text-blue-700 mb-0.5">Instructions</h4>
                              <p className="text-xs text-gray-700">{node.description}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Assignees with Action Details */}
                      {node.assignments && node.assignments.length > 0 && (
                        <div className="mt-3 p-2.5 bg-white/70 border border-gray-100 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Users className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs font-semibold text-gray-700">Assignees</span>
                          </div>
                          <div className="space-y-2">
                            {node.assignments.map((assignment) => (
                              <div key={assignment.id} className="p-2 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <UserAvatar
                                    user={assignment.user ? {
                                      id: assignment.user.id,
                                      username: assignment.user.username,
                                      email: assignment.user.email,
                                      firstName: assignment.user.firstName,
                                      lastName: assignment.user.lastName,
                                      displayName: assignment.user.displayName,
                                      imgUrl: assignment.user.imgUrl,
                                      imageUrl: assignment.user.imageUrl,
                                    } : null}
                                    size="xs"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-medium text-gray-700">
                                        {assignment.assigneeName || assignment.user?.displayName || 'Unknown'}
                                      </span>
                                      {assignment.action && (
                                        <Badge
                                          variant="outline"
                                          className={`text-[9px] px-1.5 py-0 h-4 ${assignment.action === 'APPROVED'
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : assignment.action === 'REJECTED'
                                              ? 'bg-red-50 text-red-700 border-red-200'
                                              : 'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}
                                        >
                                          {assignment.action}
                                        </Badge>
                                      )}
                                      {assignment.actedAt && (
                                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                          <Clock className="w-3 h-3" />
                                          {formatDate(assignment.actedAt)}
                                        </span>
                                      )}
                                    </div>
                                    {assignment.role && (
                                      <div className="text-[10px] text-purple-500">Role: {assignment.role.name}</div>
                                    )}
                                    {assignment.group && (
                                      <div className="text-[10px] text-green-500">Group: {assignment.group.name}</div>
                                    )}
                                  </div>
                                </div>
                                {/* Show comment prominently with action-based coloring */}
                                {assignment.comment && (
                                  <div className={`mt-2 p-2 rounded text-xs ${assignment.action === 'REJECTED'
                                    ? 'bg-red-50 border border-red-200'
                                    : 'bg-amber-50 border border-amber-100'
                                    }`}>
                                    <div className="flex items-start gap-1.5">
                                      <Info className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${assignment.action === 'REJECTED' ? 'text-red-600' : 'text-amber-600'
                                        }`} />
                                      <div>
                                        <span className={`font-medium ${assignment.action === 'REJECTED' ? 'text-red-700' : 'text-gray-600'
                                          }`}>
                                          {assignment.action === 'REJECTED' ? 'Rejection reason: ' : 'Comment: '}
                                        </span>
                                        <span className={`italic ${assignment.action === 'REJECTED' ? 'text-red-600' : 'text-gray-700'
                                          }`}>"{assignment.comment}"</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Completed By */}
                      {node.completedBy && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Completed by:</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                <UserAvatar
                                  user={{
                                    id: node.completedBy.id,
                                    firstName: node.completedBy.firstName,
                                    lastName: node.completedBy.lastName,
                                    imgUrl: node.completedBy.imgUrl,
                                    email: node.completedBy.email,
                                    username: node.completedBy.username,
                                  }}
                                  size="xs"
                                />
                                <span className="text-xs font-medium text-gray-700">
                                  {node.completedBy.firstName} {node.completedBy.lastName}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs p-2">
                              <div className="space-y-0.5">
                                <div className="font-semibold">
                                  {node.completedBy.firstName} {node.completedBy.lastName}
                                </div>
                                {node.completedBy.username && (
                                  <div className="text-gray-400">@{node.completedBy.username}</div>
                                )}
                                {node.completedBy.email && (
                                  <div className="text-gray-400">{node.completedBy.email}</div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      {/* Comment */}
                      {node.comment && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-700 italic">"{node.comment}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
