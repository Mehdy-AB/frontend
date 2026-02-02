'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertCircle,
  Users,
  MessageSquare,
  Clock
} from 'lucide-react';
import { WorkflowHistoryResponse } from '@/types/api';
import { formatDate } from '@/lib/dateFormatter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { Skeleton } from '@/components/ui/skeleton';

interface WorkflowHistoryProps {
  workflowInstanceId: number;
  documentId?: number;
}

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
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4 text-center">{error}</div>;
  }

  const getActionIcon = (action: string) => {
    const icons: Record<string, React.ReactNode> = {
      WORKFLOW_STARTED: <PlayCircle className="w-3.5 h-3.5 text-blue-600" />,
      WORKFLOW_COMPLETED: <CheckCircle className="w-3.5 h-3.5 text-green-600" />,
      WORKFLOW_CANCELLED: <XCircle className="w-3.5 h-3.5 text-red-600" />,
      WORKFLOW_FAILED: <AlertCircle className="w-3.5 h-3.5 text-red-600" />,
      STEP_STARTED: <Clock className="w-3.5 h-3.5 text-blue-500" />,
      STEP_COMPLETED: <CheckCircle className="w-3.5 h-3.5 text-green-600" />,
      STEP_REJECTED: <XCircle className="w-3.5 h-3.5 text-red-600" />,
      STEP_EXPIRED: <AlertCircle className="w-3.5 h-3.5 text-orange-600" />,
      STEP_REASSIGNED: <Users className="w-3.5 h-3.5 text-purple-600" />,
      STEP_COMMENTED: <MessageSquare className="w-3.5 h-3.5 text-gray-600" />,
      DOCUMENT_MOVED: <CheckCircle className="w-3.5 h-3.5 text-green-600" />,
      ADMIN_ACTION: <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />,
    };
    return icons[action] || <Clock className="w-3.5 h-3.5 text-gray-600" />;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      WORKFLOW_STARTED: 'Workflow Started',
      WORKFLOW_COMPLETED: 'Workflow Completed',
      WORKFLOW_CANCELLED: 'Workflow Cancelled',
      WORKFLOW_FAILED: 'Workflow Failed',
      STEP_STARTED: 'Step Started',
      STEP_COMPLETED: 'Step Completed',
      STEP_REJECTED: 'Step Rejected',
      STEP_EXPIRED: 'Step Expired',
      STEP_REASSIGNED: 'Step Reassigned',
      STEP_COMMENTED: 'Comment Added',
      DOCUMENT_MOVED: 'Document Moved',
      ADMIN_ACTION: 'Admin Action',
    };
    return labels[action] || action.replace(/_/g, ' ');
  };

  const getActionColor = (action: string) => {
    if (action.includes('COMPLETED') || action.includes('STARTED')) {
      return 'border-l-green-500 bg-green-50';
    }
    if (action.includes('REJECTED') || action.includes('FAILED') || action.includes('CANCELLED')) {
      return 'border-l-red-500 bg-red-50';
    }
    if (action.includes('REASSIGNED')) {
      return 'border-l-purple-500 bg-purple-50';
    }
    if (action.includes('EXPIRED')) {
      return 'border-l-orange-500 bg-orange-50';
    }
    return 'border-l-gray-400 bg-gray-50';
  };

  return (
    <div className="space-y-2">
      {history.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-500">
          No history yet
        </div>
      ) : (
        history.map((entry, index) => (
          <div
            key={entry.id}
            className={`relative p-2.5 rounded-lg border-l-2 ${getActionColor(entry.action)} transition-all hover:shadow-sm`}
          >
            <div className="flex items-start gap-2">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getActionIcon(entry.action)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-xs text-gray-900">
                      {getActionLabel(entry.action)}
                    </h4>
                    {entry.nodeId && (
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        Node: {entry.nodeId}
                      </p>
                    )}
                    {entry.comment && (
                      <p className="text-xs text-gray-700 mt-1.5 p-1.5 bg-white rounded border">
                        {entry.comment}
                      </p>
                    )}
                    {entry.fromStatus && entry.toStatus && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Status: {entry.fromStatus} → {entry.toStatus}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">
                    {formatDate(entry.performedAt)}
                  </span>
                </div>

                {/* Performed by */}
                {entry.performedBy && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={entry.performedBy.imgUrl} />
                      <AvatarFallback className="text-[8px]">
                        {entry.performedBy.firstName?.[0]}{entry.performedBy.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] text-gray-600">
                      {entry.performedBy.firstName} {entry.performedBy.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

