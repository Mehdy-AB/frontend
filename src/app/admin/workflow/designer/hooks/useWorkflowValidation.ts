'use client';

import { useCallback, useMemo } from 'react';
import { Node, Edge, Connection } from '@xyflow/react';
import { WorkflowNodeData } from '../nodes/types';

// Node types that cannot have incoming edges (source-only)
const SOURCE_ONLY_NODES = ['startNode', 'triggerNode'];

// Node types that cannot have outgoing edges (sink-only / terminal nodes)
const SINK_ONLY_NODES = ['finishNode', 'endSuccessNode', 'endFailureNode', 'cancelNode', 'deleteNode'];

// Edge labels for conditional nodes
export const EDGE_LABELS = {
    DEFAULT: 'DEFAULT',
    TRUE: 'TRUE',
    FALSE: 'FALSE',
    TIMEOUT: 'TIMEOUT',
    ERROR: 'ERROR',
} as const;

export interface ValidationError {
    type: 'ERROR' | 'WARNING' | 'INFO';
    nodeId?: string;
    message: string;
}

export interface UseWorkflowValidationResult {
    errors: ValidationError[];
    isValid: boolean;
    canConnect: (connection: Connection) => boolean;
    validateConnection: (connection: Connection) => { valid: boolean; reason?: string };
    getNodeErrors: (nodeId: string) => ValidationError[];
}

/**
 * Hook for validating workflow connections and structure.
 * Allows loops (backward edges) but prevents infinite loops.
 * An infinite loop is when every node in a cycle has ALL its exits
 * leading back into the cycle with no path out.
 */
export function useWorkflowValidation(
    nodes: Node<WorkflowNodeData>[],
    edges: Edge[]
): UseWorkflowValidationResult {

    // Build adjacency list for graph traversal
    const adjacencyList = useMemo(() => {
        const list = new Map<string, string[]>();
        nodes.forEach(node => list.set(node.id, []));
        edges.forEach(edge => {
            const neighbors = list.get(edge.source) || [];
            neighbors.push(edge.target);
            list.set(edge.source, neighbors);
        });
        return list;
    }, [nodes, edges]);

    /**
     * Find all nodes that would be part of a cycle if we add source->target.
     * Returns the set of nodes in the cycle, or null if no cycle.
     */
    const findCycleNodes = useCallback((sourceId: string, targetId: string): Set<string> | null => {
        // A cycle exists if target can reach source through existing edges. 
        // Find the path from target back to source.
        const visited = new Set<string>();
        const parent = new Map<string, string>();
        const stack = [targetId];
        let cycleFound = false;

        while (stack.length > 0) {
            const current = stack.pop()!;
            if (current === sourceId) {
                cycleFound = true;
                break;
            }
            if (visited.has(current)) continue;
            visited.add(current);

            const neighbors = adjacencyList.get(current) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    parent.set(neighbor, current);
                    stack.push(neighbor);
                }
            }
        }

        if (!cycleFound) return null;

        // Collect all nodes involved in the cycle:
        // The cycle consists of the proposed edge (source->target) plus
        // the path from target back to source through existing edges.
        // We need to find ALL nodes reachable from target that can also reach source.
        const cycleNodes = new Set<string>();

        // Find all nodes reachable from target
        const reachableFromTarget = new Set<string>();
        const fwdStack = [targetId];
        while (fwdStack.length > 0) {
            const current = fwdStack.pop()!;
            if (reachableFromTarget.has(current)) continue;
            reachableFromTarget.add(current);
            const neighbors = adjacencyList.get(current) || [];
            for (const neighbor of neighbors) {
                fwdStack.push(neighbor);
            }
        }

        // Add source too (the new edge goes source->target)
        reachableFromTarget.add(sourceId);

        // Find all nodes that can reach source (reverse graph traversal)
        const reverseAdj = new Map<string, string[]>();
        nodes.forEach(node => reverseAdj.set(node.id, []));
        edges.forEach(edge => {
            const neighbors = reverseAdj.get(edge.target) || [];
            neighbors.push(edge.source);
            reverseAdj.set(edge.target, neighbors);
        });
        // Add the proposed edge in reverse: target -> source becomes source can reach target
        const revNeighbors = reverseAdj.get(sourceId) || [];
        revNeighbors.push(targetId);
        reverseAdj.set(sourceId, revNeighbors);

        const canReachSource = new Set<string>();
        const revStack = [sourceId];
        while (revStack.length > 0) {
            const current = revStack.pop()!;
            if (canReachSource.has(current)) continue;
            canReachSource.add(current);
            const neighbors = reverseAdj.get(current) || [];
            for (const neighbor of neighbors) {
                revStack.push(neighbor);
            }
        }

        // Cycle nodes = nodes that are both reachable from target AND can reach source
        for (const nodeId of reachableFromTarget) {
            if (canReachSource.has(nodeId)) {
                cycleNodes.add(nodeId);
            }
        }

        return cycleNodes.size > 0 ? cycleNodes : null;
    }, [adjacencyList, nodes, edges]);

    /**
     * Check if a cycle would be an infinite loop.
     * A cycle is infinite if there is no node in the cycle that has
     * at least one outgoing edge (including the proposed new edge)
     * leading to a node OUTSIDE the cycle.
     */
    const wouldBeInfiniteLoop = useCallback((sourceId: string, targetId: string): boolean => {
        const cycleNodes = findCycleNodes(sourceId, targetId);
        if (!cycleNodes) return false; // No cycle at all

        // Build a temporary adjacency that includes the proposed edge
        const tempAdj = new Map<string, string[]>();
        nodes.forEach(node => tempAdj.set(node.id, []));
        edges.forEach(edge => {
            const neighbors = tempAdj.get(edge.source) || [];
            neighbors.push(edge.target);
            tempAdj.set(edge.source, neighbors);
        });
        // Add proposed edge
        const srcNeighbors = tempAdj.get(sourceId) || [];
        srcNeighbors.push(targetId);
        tempAdj.set(sourceId, srcNeighbors);

        // Check: does any node in the cycle have an outgoing edge to a node NOT in the cycle?
        for (const nodeId of cycleNodes) {
            const neighbors = tempAdj.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!cycleNodes.has(neighbor)) {
                    // This node has an exit outside the cycle — loop can break
                    return false;
                }
            }
        }

        // No node in the cycle exits it → infinite loop
        return true;
    }, [findCycleNodes, nodes, edges]);

    // Validate a potential connection
    const validateConnection = useCallback((connection: Connection): { valid: boolean; reason?: string } => {
        const { source, target } = connection;

        if (!source || !target) {
            return { valid: false, reason: 'Invalid connection: missing source or target' };
        }

        // 1. Prevent self-loops
        if (source === target) {
            return { valid: false, reason: 'Self-loops are not allowed' };
        }

        // 2. Find source and target nodes
        const sourceNode = nodes.find(n => n.id === source);
        const targetNode = nodes.find(n => n.id === target);

        if (!sourceNode || !targetNode) {
            return { valid: false, reason: 'Source or target node not found' };
        }

        // 3. Check if source node can have outgoing edges
        if (SINK_ONLY_NODES.includes(sourceNode.type || '')) {
            return { valid: false, reason: `${sourceNode.type} nodes cannot have outgoing connections` };
        }

        // 4. Check if target node can have incoming edges
        if (SOURCE_ONLY_NODES.includes(targetNode.type || '')) {
            return { valid: false, reason: `${targetNode.type} nodes cannot have incoming connections` };
        }

        // 5. Check if source handle already has an outgoing connection
        // We strictly allow only one edge per output handle
        const existingEdgeFromHandle = edges.find(e =>
            e.source === source &&
            (e.sourceHandle === connection.sourceHandle || (!e.sourceHandle && !connection.sourceHandle))
        );

        if (existingEdgeFromHandle) {
            return { valid: false, reason: 'Output already connected. Delete existing line to change it.' };
        }

        // 6. Check for duplicate edges (same source+handle to same target)
        const existingEdge = edges.find(e =>
            e.source === source &&
            e.target === target &&
            (e.sourceHandle === connection.sourceHandle || (!e.sourceHandle && !connection.sourceHandle))
        );
        if (existingEdge) {
            return { valid: false, reason: 'Connection already exists' };
        }

        // 7. Allow loops BUT block infinite loops
        if (wouldBeInfiniteLoop(source, target)) {
            return { valid: false, reason: 'This connection would create an infinite loop. At least one node in the loop must have an exit path outside the cycle.' };
        }

        return { valid: true };
    }, [nodes, edges, wouldBeInfiniteLoop]);

    // Simple boolean check for canConnect
    const canConnect = useCallback((connection: Connection): boolean => {
        return validateConnection(connection).valid;
    }, [validateConnection]);

    // Validate entire workflow structure
    const errors = useMemo((): ValidationError[] => {
        const validationErrors: ValidationError[] = [];

        // 1. Check for exactly one START node
        const startNodes = nodes.filter(n => n.type === 'startNode' || n.type === 'triggerNode');
        if (startNodes.length === 0) {
            validationErrors.push({
                type: 'ERROR',
                message: 'Workflow must have a START or TRIGGER node',
            });
        } else if (startNodes.length > 1) {
            validationErrors.push({
                type: 'ERROR',
                message: 'Workflow can only have one START or TRIGGER node',
            });
        }

        // 2. Check for at least one END node (finish, success, failure, cancel, or delete are all valid terminals)
        const endNodes = nodes.filter(n =>
            n.type === 'finishNode' ||
            n.type === 'endSuccessNode' ||
            n.type === 'endFailureNode' ||
            n.type === 'cancelNode' ||
            n.type === 'deleteNode'
        );
        if (endNodes.length === 0) {
            validationErrors.push({
                type: 'ERROR',
                message: 'Workflow must have at least one terminal node (End, Cancel, or Delete)',
            });
        }

        // 3. Check for orphan nodes (not connected to anything)
        const connectedNodes = new Set<string>();
        edges.forEach(edge => {
            connectedNodes.add(edge.source);
            connectedNodes.add(edge.target);
        });

        nodes.forEach(node => {
            if (!connectedNodes.has(node.id) && nodes.length > 1) {
                validationErrors.push({
                    type: 'WARNING',
                    nodeId: node.id,
                    message: `Node "${node.data.label || node.id}" is not connected to the workflow`,
                });
            }
        });

        // 4. Check for dead ends (nodes that should have outgoing but don't)
        const nodesWithOutgoing = new Set<string>(edges.map(e => e.source));
        nodes.forEach(node => {
            if (!SINK_ONLY_NODES.includes(node.type || '') && !nodesWithOutgoing.has(node.id)) {
                if (nodes.length > 1 && connectedNodes.has(node.id)) {
                    validationErrors.push({
                        type: 'WARNING',
                        nodeId: node.id,
                        message: `Node "${node.data.label || node.id}" has no outgoing connection (dead end)`,
                    });
                }
            }
        });

        // 5. Check for nodes without incoming (except START)
        const nodesWithIncoming = new Set<string>(edges.map(e => e.target));
        nodes.forEach(node => {
            if (!SOURCE_ONLY_NODES.includes(node.type || '') && !nodesWithIncoming.has(node.id)) {
                if (nodes.length > 1 && connectedNodes.has(node.id)) {
                    validationErrors.push({
                        type: 'WARNING',
                        nodeId: node.id,
                        message: `Node "${node.data.label || node.id}" has no incoming connection (unreachable)`,
                    });
                }
            }
        });

        // 6. Check for conditional nodes with missing branches
        nodes.forEach(node => {
            if (node.type === 'conditionalNode') {
                const outgoingEdges = edges.filter(e => e.source === node.id);
                const labels = outgoingEdges.map(e => e.label || 'DEFAULT');

                if (!labels.includes('TRUE') && !labels.includes('FALSE') && !labels.includes('DEFAULT')) {
                    validationErrors.push({
                        type: 'WARNING',
                        nodeId: node.id,
                        message: `Condition node "${node.data.label || node.id}" should have TRUE/FALSE branches`,
                    });
                }
            }
        });

        // 7. Check JOIN nodes have multiple incoming
        nodes.forEach(node => {
            if (node.type === 'joinNode') {
                const incomingCount = edges.filter(e => e.target === node.id).length;
                if (incomingCount < 2) {
                    validationErrors.push({
                        type: 'WARNING',
                        nodeId: node.id,
                        message: `JOIN node "${node.data.label || node.id}" should have at least 2 incoming connections`,
                    });
                }
            }
        });

        // 8. Check approval/review/manual task nodes have assignments
        const nodesRequiringAssignments = ['approvalNode', 'reviewNode', 'manualTaskNode', 'workflowStep', 'firstStep'];
        nodes.forEach(node => {
            if (nodesRequiringAssignments.includes(node.type || '')) {
                const assignments = node.data.assignments || node.data.assignmentEntities || [];
                if (!Array.isArray(assignments) || assignments.length === 0) {
                    validationErrors.push({
                        type: 'WARNING',
                        nodeId: node.id,
                        message: `"${node.data.label || node.id}" requires at least one assignee`,
                    });
                }
            }
        });

        // 9. Check approval nodes have all exits connected (approved, rejected, and timeout if enabled)
        nodes.forEach(node => {
            if (node.type === 'approvalNode') {
                const outgoingEdges = edges.filter(e => e.source === node.id);
                const connectedHandles = outgoingEdges.map(e => e.sourceHandle || 'default');

                // Required exits for approval nodes
                const hasApproved = connectedHandles.includes('approved');
                const hasRejected = connectedHandles.includes('rejected');

                if (!hasApproved) {
                    validationErrors.push({
                        type: 'WARNING',
                        nodeId: node.id,
                        message: `"${node.data.label || node.id}" needs Approved exit connected`,
                    });
                }
                if (!hasRejected) {
                    validationErrors.push({
                        type: 'WARNING',
                        nodeId: node.id,
                        message: `"${node.data.label || node.id}" needs Rejected exit connected`,
                    });
                }

                // Check timeout exit if enabled
                if (node.data.timeoutEnabled && node.data.useTimeoutExit) {
                    const hasTimeout = connectedHandles.includes('timeout');
                    if (!hasTimeout) {
                        validationErrors.push({
                            type: 'WARNING',
                            nodeId: node.id,
                            message: `"${node.data.label || node.id}" has Timeout path enabled but not connected`,
                        });
                    }
                }
            }
        });

        return validationErrors;
    }, [nodes, edges]);

    // Get errors for a specific node
    const getNodeErrors = useCallback((nodeId: string): ValidationError[] => {
        return errors.filter(e => e.nodeId === nodeId);
    }, [errors]);

    // Check if workflow is valid (no ERROR type validations)
    const isValid = useMemo(() => {
        return errors.filter(e => e.type === 'ERROR').length === 0;
    }, [errors]);

    return {
        errors,
        isValid,
        canConnect,
        validateConnection,
        getNodeErrors,
    };
}

export default useWorkflowValidation;
