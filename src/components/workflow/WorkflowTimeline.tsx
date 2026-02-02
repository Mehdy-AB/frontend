'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, Users } from 'lucide-react';
import { WorkflowTimelineResponse } from '@/types/workflow';
import { WorkflowNodeInstanceResponse } from '@/types/api';
import { formatDate } from '@/lib/dateFormatter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { Skeleton } from '@/components/ui/skeleton';

interface WorkflowTimelineProps {
  workflowInstanceId: number;
  documentId?: number;
}

export function WorkflowTimeline({ workflowInstanceId, documentId }: WorkflowTimelineProps) {
  const [timeline, setTimeline] = useState<WorkflowTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const data = await workflowAdminService.getInstanceTimeline(workflowInstanceId);
        setTimeline(data);
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

  if (!timeline || !timeline.nodes || timeline.nodes.length === 0) {
    return <div className="text-gray-500 p-4 text-center">No timeline steps available</div>;
  }

  const nodes = timeline.nodes;
  const currentNodeId = timeline.nodes.find(s => s.status === 'ACTIVE')?.id;

  const getStepIcon = (status: string, isOverdue: boolean) => {
    if (status === 'COMPLETED') {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    if (status === 'ACTIVE') {
      if (isOverdue) {
        return <AlertCircle className="w-5 h-5 text-red-600 animate-pulse" />;
      }
      return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
    }
    if (status === 'REJECTED') {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  const getStepColor = (status: string, isOverdue: boolean) => {
    if (status === 'COMPLETED') return 'border-green-600 bg-green-50';
    if (status === 'ACTIVE') {
      if (isOverdue) return 'border-red-600 bg-red-50';
      return 'border-blue-600 bg-blue-50';
    }
    if (status === 'REJECTED') return 'border-red-600 bg-red-50';
    return 'border-gray-300 bg-gray-50';
  };

  const getStepBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pending', className: 'bg-gray-100 text-gray-700' },
      ACTIVE: { label: 'Active', className: 'bg-blue-100 text-blue-700' },
      COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
      REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
      EXPIRED: { label: 'Expired', className: 'bg-orange-100 text-orange-700' },
      CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700' },
    };
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {nodes.map((node, index) => {
        const isLast = index === nodes.length - 1;
        const isCurrent = node.id === currentNodeId;

        return (
          <div key={node.id} className="relative">
            {/* Connection line */}
            {!isLast && (
              <div className="absolute left-[11px] top-9 bottom-0 w-0.5 bg-gray-200" />
            )}

            {/* Step card */}
            <div
              className={`relative flex gap-2 p-2.5 rounded-lg border transition-all ${getStepColor(node.status, node.isOverdue)
                } ${isCurrent ? 'ring-1 ring-blue-400 shadow-sm' : ''}`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {getStepIcon(node.status, node.isOverdue)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-medium text-gray-500">
                        {node.nodeType === 'START' ? 'Start' : node.nodeType === 'END' ? 'End' : `Node ${index + 1}`}
                      </span>
                      {getStepBadge(node.status)}
                      {node.isOverdue && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">
                          Overdue
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900">{node.nodeName}</h3>
                  </div>
                </div>

                {/* Assigned users */}
                {node.assignments && node.assignments.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 p-1.5 bg-white/50 rounded">
                    <Users className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <div className="flex items-center gap-1 flex-wrap">
                      {node.assignments.filter(a => a.user).slice(0, 2).map((assignment, idx) => (
                        <div key={assignment.id} className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={assignment.user?.imgUrl} />
                            <AvatarFallback className="text-[8px]">
                              {assignment.user?.firstName?.[0]}{assignment.user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-gray-700">
                            {assignment.user?.firstName} {assignment.user?.lastName}
                          </span>
                        </div>
                      ))}
                      {node.assignments.filter(a => a.user).length > 2 && (
                        <span className="text-[10px] text-gray-500">
                          +{node.assignments.filter(a => a.user).length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline info */}
                <div className="flex flex-col gap-0.5 mt-2 text-[10px] text-gray-500">
                  {node.startedAt && (
                    <div>
                      Started: {formatDate(node.startedAt)}
                    </div>
                  )}
                  {node.dueDate && (
                    <div className={node.isOverdue ? 'text-red-600 font-medium' : ''}>
                      Due: {formatDate(node.dueDate)}
                    </div>
                  )}
                  {node.completedAt && (
                    <div className="text-green-600">
                      Completed: {formatDate(node.completedAt)}
                    </div>
                  )}
                </div>

                {/* Completed by */}
                {node.completedBy && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-gray-600">
                    <span>Completed by:</span>
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={node.completedBy.imgUrl} />
                      <AvatarFallback className="text-[8px]">
                        {node.completedBy.firstName?.[0]}{node.completedBy.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {node.completedBy.firstName} {node.completedBy.lastName}
                    </span>
                  </div>
                )}

                {/* Comment */}
                {node.comment && (
                  <div className="mt-1.5 p-1.5 bg-white rounded text-xs text-gray-700 border-l-2 border-gray-300">
                    {node.comment}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

