'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, Users } from 'lucide-react';
import { TimelineStep, WorkflowTimelineResponse } from '@/types/workflow';
import { formatDate } from '@/lib/dateFormatter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { workflowService } from '@/api/services/workflowService';
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
        const data = await workflowService.getInstanceTimeline(workflowInstanceId);
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

  if (!timeline || !timeline.steps || timeline.steps.length === 0) {
    return <div className="text-gray-500 p-4 text-center">No timeline steps available</div>;
  }

  const steps = timeline.steps;
  const currentStepId = timeline.steps.find(s => s.status === 'ACTIVE')?.stepInstanceId;

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
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isCurrent = step.stepInstanceId === currentStepId;

        return (
          <div key={step.stepInstanceId} className="relative">
            {/* Connection line */}
            {!isLast && (
              <div className="absolute left-[11px] top-9 bottom-0 w-0.5 bg-gray-200" />
            )}

            {/* Step card */}
            <div
              className={`relative flex gap-2 p-2.5 rounded-lg border transition-all ${getStepColor(step.status, step.isOverdue)
                } ${isCurrent ? 'ring-1 ring-blue-400 shadow-sm' : ''}`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {getStepIcon(step.status, step.isOverdue)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-medium text-gray-500">
                        Step {step.stepOrder}
                      </span>
                      {getStepBadge(step.status)}
                      {step.isOverdue && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">
                          Overdue
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900">{step.stepName}</h3>
                    {step.stepDescription && (
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{step.stepDescription}</p>
                    )}
                  </div>
                </div>

                {/* Assigned users */}
                {step.assignedUsers && step.assignedUsers.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 p-1.5 bg-white/50 rounded">
                    <Users className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <div className="flex items-center gap-1 flex-wrap">
                      {step.assignedUsers.slice(0, 2).map((user, idx) => (
                        <div key={user.id} className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={user.imgUrl} />
                            <AvatarFallback className="text-[8px]">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-gray-700">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      ))}
                      {step.assignedUsers.length > 2 && (
                        <span className="text-[10px] text-gray-500">
                          +{step.assignedUsers.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline info */}
                <div className="flex flex-col gap-0.5 mt-2 text-[10px] text-gray-500">
                  {step.startedAt && (
                    <div>
                      Started: {formatDate(step.startedAt)}
                    </div>
                  )}
                  {step.dueDate && (
                    <div className={step.isOverdue ? 'text-red-600 font-medium' : ''}>
                      Due: {formatDate(step.dueDate)}
                    </div>
                  )}
                  {step.completedAt && (
                    <div className="text-green-600">
                      Completed: {formatDate(step.completedAt)}
                    </div>
                  )}
                </div>

                {/* Completed by */}
                {step.completedBy && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-gray-600">
                    <span>Completed by:</span>
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={step.completedBy.imgUrl} />
                      <AvatarFallback className="text-[8px]">
                        {step.completedBy.firstName?.[0]}{step.completedBy.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {step.completedBy.firstName} {step.completedBy.lastName}
                    </span>
                  </div>
                )}

                {/* Comment */}
                {step.comment && (
                  <div className="mt-1.5 p-1.5 bg-white rounded text-xs text-gray-700 border-l-2 border-gray-300">
                    {step.comment}
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

