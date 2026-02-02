'use client';

import { useCallback, useMemo } from 'react';
import { Node, Edge, Connection } from '@xyflow/react';
import { WorkflowNodeData } from '../nodes/types';

// Node types that cannot have incoming edges (source-only)
const SOURCE_ONLY_NODES = ['startNode', 'triggerNode'];

// Node types that cannot have outgoing edges (sink-only)
const SINK_ONLY_NODES = ['finishNode', 'endSuccessNode', 'endFailureNode'];

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
 * Implements cycle detection, self-loop prevention, and edge rules.
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

    // Detect if adding an edge would create a cycle using DFS
    const wouldCreateCycle = useCallback((sourceId: string, targetId: string): boolean => {
        // If target can reach source, adding source->target creates a cycle
        const visited = new Set<string>();
        const stack = [targetId];

        while (stack.length > 0) {
            const current = stack.pop()!;
            if (current === sourceId) {
                return true; // Cycle detected
            }
            if (visited.has(current)) continue;
            visited.add(current);

            const neighbors = adjacencyList.get(current) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    stack.push(neighbor);
                }
            }
        }
        return false;
    }, [adjacencyList]);

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

        // 6. Check for duplicate edges (redundant with above but good for safety)
        const existingEdge = edges.find(e => e.source === source && e.target === target);
        if (existingEdge) {
            return { valid: false, reason: 'Connection already exists' };
        }

        // 6. Check for cycles (most expensive check, do last)
        if (wouldCreateCycle(source, target)) {
            return { valid: false, reason: 'This connection would create a cycle. Loops are not allowed.' };
        }

        return { valid: true };
    }, [nodes, edges, wouldCreateCycle]);

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

        // 2. Check for at least one END node
        const endNodes = nodes.filter(n =>
            n.type === 'finishNode' ||
            n.type === 'endSuccessNode' ||
            n.type === 'endFailureNode'
        );
        if (endNodes.length === 0) {
            validationErrors.push({
                type: 'ERROR',
                message: 'Workflow must have at least one END node',
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
