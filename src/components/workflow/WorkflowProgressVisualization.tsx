'use client';

import React from 'react';
import { CheckCircle2, Clock, XCircle, Circle, ArrowRight, User, Shield, Users } from 'lucide-react';
import { WorkflowInstanceResponse, WorkflowStepInstanceResponse } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface WorkflowProgressVisualizationProps {
  workflowInstance: WorkflowInstanceResponse;
  stepInstances?: WorkflowStepInstanceResponse[];
}

export default function WorkflowProgressVisualization({
  workflowInstance,
  stepInstances
}: WorkflowProgressVisualizationProps) {
  // Use nodeInstances if available, or fall back to empty array
  // Use explicit cast or type assertion if necessary, but here we just rely on the prop
  const instances = (stepInstances || workflowInstance.nodeInstances || []) as WorkflowStepInstanceResponse[];

  // Sort instances by id as a proxy for order since stepOrder isn't available
  // Or rely on the order provided by the backend
  const sortedInstances = [...instances].sort((a, b) => a.id - b.id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'ACTIVE':
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'EXPIRED':
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'ACTIVE':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'EXPIRED':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getAssigneeIcon = (assignment: any) => {
    if (assignment.user) return <User className="h-3 w-3" />;
    if (assignment.role) return <Shield className="h-3 w-3" />;
    if (assignment.group) return <Users className="h-3 w-3" />;
    return null;
  };

  const getAssigneeName = (instance: WorkflowStepInstanceResponse) => {
    if (instance.assignments && instance.assignments.length > 0) {
      const assignment = instance.assignments[0];
      if (assignment.user) return assignment.user.displayName || assignment.user.username;
      if (assignment.role) return assignment.role.name;
      if (assignment.group) return assignment.group.name;
    }
    return 'Not assigned';
  };

  return (
    <div className="w-full space-y-4">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">
            {workflowInstance.completedNodesCount} / {workflowInstance.totalNodesCount} nodes completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{
              width: `${workflowInstance.totalNodesCount > 0 ? (workflowInstance.completedNodesCount / workflowInstance.totalNodesCount) * 100 : 0}%`
            }}
          />
        </div>
      </div>

      {/* Steps Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-6">
          {sortedInstances.map((instance, index) => {
            const status = instance.status;
            const isLast = index === sortedInstances.length - 1;

            return (
              <div key={instance.id} className="relative flex items-start gap-4">
                {/* Status Icon */}
                <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <Card className={`${status === 'ACTIVE' ? 'ring-2 ring-blue-500' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {instance.nodeName}
                            </h4>
                            <Badge variant="outline" className={getStatusColor(status)}>
                              {status}
                            </Badge>
                          </div>

                          {/* Assignee Info */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            {instance.assignments && instance.assignments.length > 0 && (
                              <>
                                {getAssigneeIcon(instance.assignments[0])}
                                <span>Assigned to: {getAssigneeName(instance)}</span>
                              </>
                            )}
                          </div>

                          {/* Step Instance Details */}
                          <div className="space-y-1 text-xs text-gray-500">
                            {instance.completedAt && (
                              <div>
                                Completed: {new Date(instance.completedAt).toLocaleString()}
                              </div>
                            )}
                            {instance.completedBy && (
                              <div>
                                By: {instance.completedBy.displayName || instance.completedBy.username}
                              </div>
                            )}
                            {instance.comment && (
                              <div className="mt-2 p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                                <strong>Comment:</strong> {instance.comment}
                              </div>
                            )}
                            {/* Rejection reason is not directly on node instance usually, might be comment */}

                            {instance.dueDate && (
                              <div className={instance.isOverdue ? 'text-red-600 font-medium' : ''}>
                                Due: {new Date(instance.dueDate).toLocaleString()}
                                {instance.isOverdue && ' (Overdue)'}
                              </div>
                            )}
                          </div>

                          {/* Parallel Approval Info - if available in future */}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Arrow Connector */}
                {!isLast && (
                  <div className="absolute left-5 top-12 flex items-center justify-center w-10">
                    <ArrowRight className="h-4 w-4 text-gray-400 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Workflow Status Summary */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Workflow Status</p>
              <p className="text-xs text-gray-600 mt-1">
                Started: {new Date(workflowInstance.startedAt).toLocaleString()}
              </p>
              {workflowInstance.completedAt && (
                <p className="text-xs text-gray-600">
                  Completed: {new Date(workflowInstance.completedAt).toLocaleString()}
                </p>
              )}
              {workflowInstance.cancelledAt && (
                <p className="text-xs text-red-600">
                  Cancelled: {new Date(workflowInstance.cancelledAt).toLocaleString()}
                  {workflowInstance.cancellationReason && (
                    <span> - {workflowInstance.cancellationReason}</span>
                  )}
                </p>
              )}
            </div>
            <Badge
              variant={
                workflowInstance.status === 'COMPLETED' ? 'default' :
                  workflowInstance.status === 'CANCELLED' ? 'destructive' :
                    'secondary'
              }
              className={
                workflowInstance.status === 'COMPLETED' ? 'bg-green-500' :
                  workflowInstance.status === 'CANCELLED' ? 'bg-red-500' :
                    'bg-blue-500'
              }
            >
              {workflowInstance.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





