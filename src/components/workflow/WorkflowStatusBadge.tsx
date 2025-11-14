"use client";

import React from "react";
import {
  WorkflowStatus,
  getStatusBadgeClass,
  getStatusIcon,
  getStatusDisplayName
} from "@/types/workflow";
import { Badge } from "@/components/ui/badge";

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  showIcon?: boolean;
  className?: string;
}

const WorkflowStatusBadge: React.FC<WorkflowStatusBadgeProps> = ({
  status,
  showIcon = true,
  className = ""
}) => {
  return (
    <span className={`${getStatusBadgeClass(status)} ${className}`}>
      {showIcon && getStatusIcon(status)} {getStatusDisplayName(status)}
    </span>
  );
};

export default WorkflowStatusBadge;


