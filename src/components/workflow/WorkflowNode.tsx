"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import {
  WorkflowStep,
  WorkflowStatus,
  getStatusIcon,
  getStatusDisplayName,
  getStatusBadgeClass
} from "@/types/workflow";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

interface WorkflowNodeData {
  step: WorkflowStep;
  status: WorkflowStatus;
  isCurrent: boolean;
  isCompleted?: boolean;
}

interface WorkflowNodeProps {
  data: WorkflowNodeData;
}

const WorkflowNode: React.FC<WorkflowNodeProps> = ({ data }) => {
  const { step, status, isCurrent, isCompleted } = data;

  const getNodeBorderColor = (): string => {
    if (isCurrent) {
      return "border-blue-500 shadow-lg shadow-blue-500/50";
    }
    if (isCompleted) {
      return "border-green-500";
    }
    return "border-gray-300 dark:border-gray-600";
  };

  const getNodeBackgroundColor = (): string => {
    if (isCurrent) {
      return "bg-blue-50 dark:bg-blue-950";
    }
    if (isCompleted) {
      return "bg-green-50 dark:bg-green-950";
    }
    return "bg-white dark:bg-gray-800";
  };

  const getStatusIconComponent = () => {
    const iconClass = "w-5 h-5";
    switch (status) {
      case WorkflowStatus.APPROVED:
      case WorkflowStatus.APPROVED_BY_MANAGER:
      case WorkflowStatus.APPROVED_BY_ACCOUNTING:
      case WorkflowStatus.ARCHIVED:
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case WorkflowStatus.IN_REVIEW:
      case WorkflowStatus.IN_MANAGER_REVIEW:
      case WorkflowStatus.IN_ACCOUNTING_REVIEW:
      case WorkflowStatus.PENDING_APPROVAL:
        return <Clock className={`${iconClass} text-yellow-600`} />;
      case WorkflowStatus.REJECTED:
      case WorkflowStatus.CANCELLED:
      case WorkflowStatus.FAILED:
        return <XCircle className={`${iconClass} text-red-600`} />;
      default:
        return <AlertCircle className={`${iconClass} text-gray-600`} />;
    }
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[280px] max-w-[320px]
        transition-all duration-200
        ${getNodeBorderColor()}
        ${getNodeBackgroundColor()}
      `}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getStatusIconComponent()}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Step Name */}
          <h3 className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100 truncate">
            {step.name}
          </h3>
          
          {/* Role Badge */}
          {step.approverRole && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {step.approverRole}
              </span>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="mb-2">
            <span className={getStatusBadgeClass(status)}>
              {getStatusIcon(status)} {getStatusDisplayName(status)}
            </span>
          </div>
          
          {/* Description */}
          {step.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {step.description}
            </p>
          )}
          
          {/* Assigned To */}
          {step.assignedTo && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Assigned to:</span> {step.assignedTo}
            </div>
          )}
          
          {/* Current Indicator */}
          {isCurrent && (
            <div className="mt-2 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Current Step
              </span>
            </div>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default WorkflowNode;


