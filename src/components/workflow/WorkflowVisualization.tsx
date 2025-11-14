"use client";

import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  WorkflowInstance,
  WorkflowStep,
  WorkflowStatus,
  getStatusColor,
  getStatusIcon,
  getStatusDisplayName
} from "@/types/workflow";
import WorkflowNode from "./WorkflowNode";

interface WorkflowVisualizationProps {
  workflowInstance: WorkflowInstance;
}

const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  workflowInstance
}) => {
  // Custom node types
  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), []);

  // Generate nodes from workflow steps
  const generateNodes = useCallback((): Node[] => {
    if (!workflowInstance?.workflow?.steps) {
      return [];
    }

    return workflowInstance.workflow.steps.map((step, index) => {
      const isCurrent = workflowInstance.currentStep?.id === step.id;
      const isCompleted = step.order < (workflowInstance.currentStep?.order || 0);
      
      let nodeStatus: WorkflowStatus;
      if (isCompleted) {
        nodeStatus = WorkflowStatus.APPROVED;
      } else if (isCurrent) {
        nodeStatus = workflowInstance.status;
      } else {
        nodeStatus = WorkflowStatus.PENDING_APPROVAL;
      }

      return {
        id: `step-${step.id}`,
        type: "workflowNode",
        position: { x: 50, y: index * 150 },
        data: {
          step,
          status: nodeStatus,
          isCurrent,
          isCompleted
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top
      };
    });
  }, [workflowInstance]);

  // Generate edges between nodes
  const generateEdges = useCallback((): Edge[] => {
    if (!workflowInstance?.workflow?.steps || workflowInstance.workflow.steps.length < 2) {
      return [];
    }

    const sortedSteps = [...workflowInstance.workflow.steps].sort((a, b) => a.order - b.order);
    const edges: Edge[] = [];

    for (let i = 0; i < sortedSteps.length - 1; i++) {
      const currentStep = sortedSteps[i];
      const nextStep = sortedSteps[i + 1];
      
      const isCompleted = currentStep.order < (workflowInstance.currentStep?.order || 0);
      const statusColor = getStatusColor(
        isCompleted ? WorkflowStatus.APPROVED : WorkflowStatus.PENDING_APPROVAL
      );

      edges.push({
        id: `edge-${currentStep.id}-${nextStep.id}`,
        source: `step-${currentStep.id}`,
        target: `step-${nextStep.id}`,
        type: "smoothstep",
        animated: !isCompleted,
        style: {
          stroke: getEdgeColor(statusColor),
          strokeWidth: 2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: getEdgeColor(statusColor)
        }
      });
    }

    return edges;
  }, [workflowInstance]);

  const [nodes, setNodes, onNodesChange] = useNodesState(generateNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(generateEdges());

  // Update nodes and edges when workflowInstance changes
  React.useEffect(() => {
    setNodes(generateNodes());
    setEdges(generateEdges());
  }, [workflowInstance, generateNodes, generateEdges, setNodes, setEdges]);

  const getEdgeColor = (colorName: string): string => {
    switch (colorName) {
      case "GREEN":
        return "#10b981";
      case "YELLOW":
        return "#f59e0b";
      case "GRAY":
        return "#6b7280";
      case "RED":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="w-full h-full" style={{ minHeight: "600px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const status = node.data.status as WorkflowStatus;
            return getEdgeColor(getStatusColor(status));
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
};

export default WorkflowVisualization;


