'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertCircle,
  Users,
  MessageSquare,
  Clock,
  FileText,
  ArrowRight,
  Zap,
  UserCheck
} from 'lucide-react';
import { WorkflowHistoryResponse } from '@/types/api';
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

interface WorkflowHistoryProps {
  workflowInstanceId: number;
  documentId?: number;
}

// Time ago helper
const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffMins > 0) {
    return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
  }
  return 'Just now';
};

export function WorkflowHistory({ workflowInstanceId, documentId }: WorkflowHistoryProps) {
  const [history, setHistory] = useState<WorkflowHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await workflowAdminService.getInstanceHistory(workflowInstanceId);
        setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history:', err);
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    if (workflowInstanceId) {
      fetchHistory();
    }
  }, [workflowInstanceId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4 text-center">{error}</div>;
  }

  const getActionInfo = (action: string) => {
    const actions: Record<string, { icon: React.ReactNode; label: string; bgClass: string; borderClass: string; iconClass: string }> = {
      WORKFLOW_STARTED: {
        icon: <Zap className="w-4 h-4" />,
        label: 'Workflow Started',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-300',
        iconClass: 'text-emerald-600 bg-emerald-100'
      },
      WORKFLOW_COMPLETED: {
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Workflow Completed',
        bgClass: 'bg-green-50',
        borderClass: 'border-green-300',
        iconClass: 'text-green-600 bg-green-100'
      },
      WORKFLOW_CANCELLED: {
        icon: <XCircle className="w-4 h-4" />,
        label: 'Workflow Cancelled',
        bgClass: 'bg-gray-50',
        borderClass: 'border-gray-300',
        iconClass: 'text-gray-600 bg-gray-100'
      },
      WORKFLOW_FAILED: {
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Workflow Failed',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-300',
        iconClass: 'text-red-600 bg-red-100'
      },
      STEP_STARTED: {
        icon: <Clock className="w-4 h-4" />,
        label: 'Step Started',
        bgClass: 'bg-blue-50',
        borderClass: 'border-blue-200',
        iconClass: 'text-blue-600 bg-blue-100'
      },
      STEP_COMPLETED: {
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Step Completed',
        bgClass: 'bg-green-50',
        borderClass: 'border-green-200',
        iconClass: 'text-green-600 bg-green-100'
      },
      STEP_APPROVED: {
        icon: <UserCheck className="w-4 h-4" />,
        label: 'Step Approved',
        bgClass: 'bg-green-50',
        borderClass: 'border-green-200',
        iconClass: 'text-green-600 bg-green-100'
      },
      STEP_REJECTED: {
        icon: <XCircle className="w-4 h-4" />,
        label: 'Step Rejected',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-200',
        iconClass: 'text-red-600 bg-red-100'
      },
      STEP_EXPIRED: {
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Step Expired',
        bgClass: 'bg-orange-50',
        borderClass: 'border-orange-200',
        iconClass: 'text-orange-600 bg-orange-100'
      },
      STEP_REASSIGNED: {
        icon: <Users className="w-4 h-4" />,
        label: 'Step Reassigned',
        bgClass: 'bg-purple-50',
        borderClass: 'border-purple-200',
        iconClass: 'text-purple-600 bg-purple-100'
      },
      STEP_COMMENTED: {
        icon: <MessageSquare className="w-4 h-4" />,
        label: 'Comment Added',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        iconClass: 'text-amber-600 bg-amber-100'
      },
      DOCUMENT_MOVED: {
        icon: <FileText className="w-4 h-4" />,
        label: 'Document Moved',
        bgClass: 'bg-indigo-50',
        borderClass: 'border-indigo-200',
        iconClass: 'text-indigo-600 bg-indigo-100'
      },
      ADMIN_ACTION: {
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Admin Action',
        bgClass: 'bg-yellow-50',
        borderClass: 'border-yellow-200',
        iconClass: 'text-yellow-600 bg-yellow-100'
      },
    };
    return actions[action] || {
      icon: <Clock className="w-4 h-4" />,
      label: action.replace(/_/g, ' '),
      bgClass: 'bg-gray-50',
      borderClass: 'border-gray-200',
      iconClass: 'text-gray-600 bg-gray-100'
    };
  };

  return (
    <TooltipProvider>
      <div className="space-y-0">
        {history.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No history yet
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent" />

            {history.map((entry, index) => {
              const actionInfo = getActionInfo(entry.action);
              const isFirst = index === 0;

              return (
                <div
                  key={entry.id}
                  className={`relative flex items-start gap-3 py-3 ${isFirst ? '' : ''}`}
                >
                  {/* Icon Circle */}
                  <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 ${actionInfo.iconClass} ${actionInfo.borderClass}`}>
                    {actionInfo.icon}
                  </div>

                  {/* Content Card */}
                  <div className={`flex-1 min-w-0 p-3 rounded-xl border ${actionInfo.bgClass} ${actionInfo.borderClass} transition-all hover:shadow-sm`}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-900">{actionInfo.label}</h4>
                        {entry.nodeId && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            Node: {entry.nodeId}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-[10px] text-gray-500 cursor-help">
                              {timeAgo(entry.performedAt)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs">
                            {formatDate(entry.performedAt)}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Status change */}
                    {entry.fromStatus && entry.toStatus && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
                        <Badge variant="outline" className="bg-white/50 text-gray-600 h-5">
                          {entry.fromStatus}
                        </Badge>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <Badge variant="outline" className="bg-white/50 text-gray-600 h-5">
                          {entry.toStatus}
                        </Badge>
                      </div>
                    )}

                    {/* Comment */}
                    {entry.comment && (
                      <div className="mt-2 p-2 bg-white/70 rounded-lg border border-gray-100">
                        <div className="flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-700 italic">"{entry.comment}"</p>
                        </div>
                      </div>
                    )}

                    {/* Performed by */}
                    {entry.performedBy && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100/50">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-pointer">
                              <UserAvatar
                                user={{
                                  id: entry.performedBy.id,
                                  firstName: entry.performedBy.firstName,
                                  lastName: entry.performedBy.lastName,
                                  imgUrl: entry.performedBy.imgUrl,
                                  email: entry.performedBy.email,
                                  username: entry.performedBy.username,
                                }}
                                size="xs"
                              />
                              <span className="text-xs text-gray-600">
                                {entry.performedBy.firstName} {entry.performedBy.lastName}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs p-2">
                            <div className="space-y-0.5">
                              <div className="font-semibold">
                                {entry.performedBy.firstName} {entry.performedBy.lastName}
                              </div>
                              {entry.performedBy.username && (
                                <div className="text-gray-400">@{entry.performedBy.username}</div>
                              )}
                              {entry.performedBy.email && (
                                <div className="text-gray-400">{entry.performedBy.email}</div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
