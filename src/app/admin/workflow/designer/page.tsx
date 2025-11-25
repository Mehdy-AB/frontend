'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  Handle,
  Position,
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Workflow,
  Plus,
  Save,
  ArrowLeft,
  CheckCircle,
  SquarePen,
  Clock,
  Users,
  Play,
  Edit,
  Trash2,
  Shield,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { workflowService } from '@/api/services/workflowService';
import { notificationApiClient } from '@/api/notificationClient';
import { useNotifications } from '@/hooks/useNotifications';
import { RoleDto, CreateStepAssignmentRequest, AddWorkflowAdminRequest, WorkflowTriggerResponse, AddWorkflowTriggerRequest, FilingCategoryResponseDto } from '@/types/api';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import WorkflowStepConfigModal from '@/components/modals/WorkflowStepConfigModal';
import WorkflowAdminModal from '@/components/modals/WorkflowAdminModal';
import UserAvatar from '@/components/main/UserAvatar';
import { Folder, Home, ChevronRight, Check, Loader2, Share2, X, Search } from 'lucide-react';
import { FolderRepoResDto, SortFields } from '@/types/api';
import Pagination from '@/components/main/Pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import ApplyWorkflowChangesDialog from '@/components/modals/ApplyWorkflowChangesDialog';

// Custom Node Component for Workflow Steps
const WorkflowStepNode = ({ data, selected, id }: { data: any; selected?: boolean; id: string }) => {
  const isFirstStep = data.isFirstStep || false;
  const hasLeftHandle = !isFirstStep;

  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 min-w-[240px] bg-white relative shadow-sm transition-all duration-200 hover:shadow-md ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
        }`}
    >
      {/* Priority Indicator */}
      {data.priority && (
        <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${data.priority === 'HIGH' ? 'bg-red-500' :
          data.priority === 'MEDIUM' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`} />
      )}
      {/* Action Icons - Top Right */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        <button
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (data.onEdit) {
              data.onEdit();
            }
          }}
          title="Edit Step"
        >
          <Edit className="w-4 h-4 text-gray-600 hover:text-blue-600" />
        </button>
        <button
          className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (data.onDelete) {
              data.onDelete();
            }
          }}
          title="Delete Step"
        >
          <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
        </button>
      </div>

      {/* Source Handle - for outgoing connections (right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-7 h-7 bg-blue-500 border-3 border-white hover:bg-blue-600"
        style={{
          borderRadius: '50%',
          top: '50%',
          transform: 'translateY(-50%)',
          border: '3px solid white',
          boxShadow: '0 0 0 2px #3b82f6',
          padding: '2px'
        }}
      />

      {/* Target Handle - for incoming connections (left) - only if not first step */}
      {hasLeftHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-7 h-7 bg-blue-500 border-3 border-white hover:bg-blue-600"
          style={{
            borderRadius: '50%',
            top: '50%',
            transform: 'translateY(-50%)',
            border: '3px solid white',
            boxShadow: '0 0 0 2px #3b82f6',
            padding: '2px'
          }}
        />
      )}

      {/* Step Name */}
      <div className="font-semibold text-sm mb-1 pr-16">{data.label || 'Step'}</div>

      {/* Description */}
      {data.description && (
        <div className="text-xs text-gray-600 line-clamp-2 mb-2">{data.description}</div>
      )}

      {/* Duration */}
      {data.expirationDays > 0 && (
        <div className="text-xs text-orange-600 mb-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {data.expirationDays} day{data.expirationDays > 1 ? 's' : ''}
        </div>
      )}

      {/* Parallel Approvals */}
      {data.allowParallelApproval && data.minApprovalsNeeded > 1 && (
        <div className="text-xs text-purple-600 mb-1 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-full w-fit">
          <Users className="w-3 h-3" />
          {data.minApprovalsNeeded} approvals
        </div>
      )}

      {/* Priority Badge */}
      {data.priority && (
        <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 px-2 py-0.5 rounded-full w-fit ${data.priority === 'HIGH' ? 'text-red-700 bg-red-50' :
          data.priority === 'MEDIUM' ? 'text-yellow-700 bg-yellow-50' :
            'text-blue-700 bg-blue-50'
          }`}>
          {data.priority} Priority
        </div>
      )}

      {/* Assignments Count */}
      {(data.assignments?.length || 0) > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          {data.assignments.length} assignee{data.assignments.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

// First Step Node Component (special node that can't be deleted)
const FirstStepNode = ({ data, selected, id }: { data: any; selected?: boolean; id: string }) => {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[220px] bg-gradient-to-r from-green-50 to-blue-50 relative ${selected ? 'border-green-500 shadow-lg' : 'border-green-300'
        }`}
    >
      {/* Edit Icon - Top Right */}
      <button
        className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-gray-100 transition-colors z-10"
        onClick={(e) => {
          e.stopPropagation();
          if (data.onEdit) {
            data.onEdit();
          }
        }}
        title="Edit Step"
      >
        <SquarePen className="w-4 h-4 text-gray-600 hover:text-blue-600" />
      </button>

      {/* Source Handle - only on right for first step */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-7 h-7 bg-green-500 border-3 border-white hover:bg-green-600"
        style={{
          borderRadius: '50%',
          top: '50%',
          transform: 'translateY(-50%)',
          border: '3px solid white',
          boxShadow: '0 0 0 2px #10b981',
          padding: '2px'
        }}
      />

      {/* First Step Badge */}
      <div className="flex items-center gap-1 mb-1">
        <Play className="w-3 h-3 text-green-600" />
        <span className="text-xs font-semibold text-green-700">START</span>
      </div>

      {/* Step Name */}
      <div className="font-semibold text-sm mb-1 pr-6">{data.label || 'First Step'}</div>

      {/* Description */}
      {data.description && (
        <div className="text-xs text-gray-600 line-clamp-2 mb-2">{data.description}</div>
      )}

      {/* Duration */}
      {data.expirationDays > 0 && (
        <div className="text-xs text-orange-600 mb-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {data.expirationDays} day{data.expirationDays > 1 ? 's' : ''}
        </div>
      )}

      {/* Parallel Approvals */}
      {data.allowParallelApproval && data.minApprovalsNeeded > 1 && (
        <div className="text-xs text-purple-600 mb-1 flex items-center gap-1">
          <Users className="w-3 h-3" />
          {data.minApprovalsNeeded} parallel approvals needed
        </div>
      )}

      {/* Assignments Count */}
      {(data.assignments?.length || 0) > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          {data.assignments.length} assignee{data.assignments.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

// Start Node Component (circular, simple design)
const StartNode = ({ data, selected, id }: { data: any; selected?: boolean; id: string }) => {
  return (
    <div className="relative">
      <Handle
        type="source"
        position={Position.Right}
        className="w-5 h-5 bg-green-500 border-2 border-white hover:bg-green-600"
        style={{
          borderRadius: '50%',
          top: '50%',
          transform: 'translateY(-50%)',
          border: '2px solid white',
        }}
      />
      <div
        className={`w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 border-2 border-white flex items-center justify-center ${selected ? 'ring-2 ring-green-300' : ''
          }`}
        style={{ boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' }}
      >
        <Play className="w-6 h-6 text-white" fill="white" />
      </div>
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600 whitespace-nowrap">
        Start
      </div>
    </div>
  );
};

// Finish Node Component (circular, simple design)
const FinishNode = ({ data, selected, id }: { data: any; selected?: boolean; id: string }) => {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="w-5 h-5 bg-blue-500 border-2 border-white hover:bg-blue-600"
        style={{
          borderRadius: '50%',
          top: '50%',
          transform: 'translateY(-50%)',
          border: '2px solid white',
        }}
      />
      <div
        className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white flex items-center justify-center ${selected ? 'ring-2 ring-blue-300' : ''
          }`}
        style={{ boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)' }}
      >
        <CheckCircle className="w-6 h-6 text-white" fill="white" />
      </div>
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600 whitespace-nowrap">
        Finish
      </div>
    </div>
  );
};

// Custom Edge Component with delete and add buttons on hover
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, selected, source, target }: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
  const [isHovered, setIsHovered] = useState(false);

  // Check if this is the start-finish edge
  const isStartFinishEdge = source === 'start-node' && target === 'finish-node';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: '#3b82f6', strokeWidth: 2.5 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {isHovered && (
        <g>
          <foreignObject
            x={labelX - (isStartFinishEdge ? 60 : 30)}
            y={labelY - 12}
            width={isStartFinishEdge ? 120 : 60}
            height={24}
            className="overflow-visible pointer-events-auto"
          >
            <div className="flex items-center gap-1.5">
              {isStartFinishEdge && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const event = new CustomEvent('addStepToEdge', { detail: { edgeId: id } });
                    window.dispatchEvent(event);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-md hover:shadow-lg transition-all z-50"
                  title="Add step"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const event = new CustomEvent('deleteEdge', { detail: { edgeId: id } });
                  window.dispatchEvent(event);
                }}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-md hover:shadow-lg transition-all z-50"
                title="Delete connection"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </foreignObject>
        </g>
      )}
    </>
  );
};

const nodeTypes: NodeTypes = {
  workflowStep: WorkflowStepNode,
  firstStep: FirstStepNode,
  startNode: StartNode,
  finishNode: FinishNode,
};

const edgeTypes = {
  default: CustomEdge,
};

export default function WorkflowDesignerPage() {
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotifications();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Get workflowId from query parameter (e.g., ?id=1) or route parameter
  const workflowId = (searchParams?.get('id') || params?.workflowId) as string | undefined;

  // Workflow properties
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [workflowAdmins, setWorkflowAdmins] = useState<Array<{
    userId: string;
    user?: { id: string; displayName?: string; username?: string; email?: string; imgUrl?: string };
  }>>([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingAdminIndex, setEditingAdminIndex] = useState<number | null>(null);

  // Apply changes dialog
  const [showApplyChangesDialog, setShowApplyChangesDialog] = useState(false);
  const [workflowToApplyChanges, setWorkflowToApplyChanges] = useState<number | null>(null);
  const [applyChangesReason, setApplyChangesReason] = useState('');
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);

  // Workflow Triggers
  const [workflowTriggers, setWorkflowTriggers] = useState<WorkflowTriggerResponse[]>([]);

  // Trigger type selection (radio button)
  const [triggerType, setTriggerType] = useState<'FOLDER' | 'MODEL' | null>(null);

  // Folder trigger state
  const [folderTriggerId, setFolderTriggerId] = useState<number | null>(null);
  const [folderTriggerFolderId, setFolderTriggerFolderId] = useState<number | null>(null);
  const [folderTriggerFolderName, setFolderTriggerFolderName] = useState<string>('');
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [folderActiveTab, setFolderActiveTab] = useState<'folders' | 'shared'>('folders');

  // Folder picker state for "My Folders"
  const [myFoldersCurrentFolderId, setMyFoldersCurrentFolderId] = useState<number | null>(null);
  const [myFoldersBreadcrumbs, setMyFoldersBreadcrumbs] = useState<Array<{ id: number; name: string }>>([]);
  const [myFoldersSearchQuery, setMyFoldersSearchQuery] = useState('');
  const [myFoldersDebouncedQuery, setMyFoldersDebouncedQuery] = useState('');
  const [myFoldersCurrentPage, setMyFoldersCurrentPage] = useState(0);
  const [myFoldersPageSize] = useState(20);
  const [myFoldersData, setMyFoldersData] = useState<FolderRepoResDto | null>(null);
  const [myFoldersLoading, setMyFoldersLoading] = useState(false);

  // Folder picker state for "Shared Folders"
  const [sharedCurrentFolderId, setSharedCurrentFolderId] = useState<number | null>(null);
  const [sharedBreadcrumbs, setSharedBreadcrumbs] = useState<Array<{ id: number; name: string }>>([]);
  const [sharedSearchQuery, setSharedSearchQuery] = useState('');
  const [sharedDebouncedQuery, setSharedDebouncedQuery] = useState('');
  const [sharedCurrentPage, setSharedCurrentPage] = useState(0);
  const [sharedPageSize] = useState(20);
  const [sharedData, setSharedData] = useState<FolderRepoResDto | null>(null);
  const [sharedLoading, setSharedLoading] = useState(false);

  // Model trigger state
  const [modelTriggerId, setModelTriggerId] = useState<number | null>(null);
  const [modelTriggerCategoryId, setModelTriggerCategoryId] = useState<number | null>(null);
  const [modelTriggerCategoryName, setModelTriggerCategoryName] = useState<string>('');
  const [showModelSearch, setShowModelSearch] = useState(false);

  // Model search using useServerSideSearch
  const {
    displayData: displayCategories,
    searchQuery: modelSearchQuery,
    setSearchQuery: setModelSearchQuery,
    tableLoading: modelSearchLoading,
    fetchData: fetchCategories,
  } = useServerSideSearch<FilingCategoryResponseDto>({
    fetchFunction: async (page, searchTerm) => {
      if (searchTerm) {
        return await filingCategoryService.searchFilingCategories(searchTerm, page, 20);
      } else {
        return await filingCategoryService.getAllFilingCategories({ page, size: 20 });
      }
    },
    searchFields: (category) => [category.name, category.description || ''],
    debounceMs: 500,
    fetchOnMount: false,
  });

  // Fetch categories when model search is opened
  useEffect(() => {
    if (showModelSearch && modelSearchQuery === '') {
      fetchCategories();
    }
  }, [showModelSearch, modelSearchQuery, fetchCategories]);

  // Close model search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showModelSearch && !target.closest('.model-search-container')) {
        setShowModelSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelSearch]);

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStepData, setEditingStepData] = useState<any>(null);

  // Create edit handler function that can be used in node data
  const createEditHandler = useCallback((nodeId: string) => {
    return () => {
      setNodes((nds) => {
        const node = nds.find(n => n.id === nodeId);
        if (node) {
          setEditingStepData(node);
          setShowStepModal(true);
        }
        return nds;
      });
    };
  }, [setNodes]);

  // Load workflow if editing
  useEffect(() => {
    if (!workflowId) return;

    let isMounted = true;

    const loadWorkflow = async () => {
      try {
        const [workflow, triggers] = await Promise.all([
          workflowService.getWorkflow(Number(workflowId)),
          workflowService.getWorkflowTriggers(Number(workflowId)),
        ]);

        if (!isMounted) return;

        setWorkflowName(workflow.name || '');
        setWorkflowDescription(workflow.description || '');
        setIsActive(workflow.isActive || false);

        // Load admins
        if (workflow.admins && workflow.admins.length > 0) {
          setWorkflowAdmins(workflow.admins.map(admin => ({
            userId: admin.user.id,
            user: admin.user,
          })));
        }

        // Load triggers
        if (triggers && triggers.length > 0) {
          const activeTrigger = triggers.find(t => t.isActive) || triggers[0];
          if (activeTrigger) {
            if (activeTrigger.triggerType === 'FOLDER') {
              setTriggerType('FOLDER');
              setFolderTriggerId(activeTrigger.id);
              setFolderTriggerFolderId(activeTrigger.folderId || null);
              setFolderTriggerFolderName(activeTrigger.folderName || '');
            } else if (activeTrigger.triggerType === 'MODEL') {
              setTriggerType('MODEL');
              setModelTriggerId(activeTrigger.id);
              setModelTriggerCategoryId(activeTrigger.categoryId || null);
              setModelTriggerCategoryName(activeTrigger.categoryName || '');
            }
          }
        }

        // Add Start and Finish nodes
        const startNode: Node = {
          id: 'start-node',
          type: 'startNode',
          position: { x: 100, y: 200 },
          data: {},
        };

        const finishNode: Node = {
          id: 'finish-node',
          type: 'finishNode',
          position: { x: 800, y: 200 },
          data: {},
        };

        // Convert workflow steps to nodes
        if (workflow.steps && workflow.steps.length > 0) {
          // Sort steps by stepOrder
          const sortedSteps = [...workflow.steps].sort((a, b) => a.stepOrder - b.stepOrder);

          const workflowNodes: Node[] = workflow.steps.map((step, index) => {
            const nodeId = `step-${step.id}`;

            // Store full entity objects from backend response
            const assignmentsWithEntities = (step.assignments || []).map((a) => {
              let entity = null;
              let assigneeType: 'USER' | 'ROLE' | 'GROUP' = 'USER';

              if (a.user) {
                assigneeType = 'USER';
                entity = a.user; // UserDto is already in the response
              } else if (a.role) {
                assigneeType = 'ROLE';
                entity = a.role; // RoleDto is already in the response
              } else if (a.group) {
                assigneeType = 'GROUP';
                entity = a.group; // GroupDto is already in the response
              }

              return {
                assigneeType,
                assigneeId: entity?.id || '',
                entity: entity, // Store full entity object
                canEdit: a.canEdit ?? true, // Preserve canEdit permission
              };
            });

            return {
              id: nodeId,
              type: 'workflowStep',
              position: { x: 300 + index * 200, y: 200 },
              data: {
                label: step.name,
                description: step.description || '',
                stepId: step.id,
                assignments: assignmentsWithEntities,
                expirationDays: step.expirationDays || 0,
                onCompleteAction: step.onCompleteAction || 'NONE',
                targetFolderId: step.targetFolderId,
                targetFolderName: step.targetFolderName,
                isRequired: step.isRequired ?? true,
                allowParallelApproval: step.allowParallelApproval ?? false,
                minApprovalsNeeded: step.minApprovalsNeeded,
                priority: step.priority || 'MEDIUM',
                isFirstStep: false,
                onEdit: createEditHandler(nodeId),
                onDelete: () => handleDeleteNode(nodeId),
              },
            };
          });

          // Set nodes with start, finish, and workflow steps
          setNodes([startNode, ...workflowNodes, finishNode]);

          // Create edges: start -> first step, steps in order, last step -> finish
          const workflowEdges: Edge[] = [];

          if (workflowNodes.length > 0) {
            // Connect start to first step
            workflowEdges.push({
              id: 'edge-start-first',
              source: 'start-node',
              target: workflowNodes[0].id,
              type: 'default',
            });

            // Connect steps in sequence
            for (let i = 0; i < workflowNodes.length - 1; i++) {
              workflowEdges.push({
                id: `edge-${workflowNodes[i].id}-${workflowNodes[i + 1].id}`,
                source: workflowNodes[i].id,
                target: workflowNodes[i + 1].id,
                type: 'default',
              });
            }

            // Connect last step to finish
            workflowEdges.push({
              id: 'edge-last-finish',
              source: workflowNodes[workflowNodes.length - 1].id,
              target: 'finish-node',
              type: 'default',
            });
          } else {
            // No steps, just connect start to finish
            workflowEdges.push({
              id: 'edge-start-finish',
              source: 'start-node',
              target: 'finish-node',
              type: 'default',
            });
          }

          setEdges(workflowEdges);
        } else {
          // No steps, just start and finish with connecting edge
          setNodes([startNode, finishNode]);
          setEdges([{
            id: 'edge-start-finish',
            source: 'start-node',
            target: 'finish-node',
            type: 'default',
          }]);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to load workflow:', error);
        showError('Failed to load workflow', 'Please try again later');
      }
    };

    loadWorkflow();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]); // Only depend on workflowId

  const onConnect = useCallback(
    (params: Connection) => {
      // Prevent self-connections
      if (params.source === params.target) {
        showError('Invalid Connection', 'A step cannot be connected to itself');
        return;
      }

      // Prevent connecting finish node as source
      if (params.source === 'finish-node') {
        showError('Invalid Connection', 'Cannot connect from Finish node');
        return;
      }

      // Prevent connecting start node as target
      if (params.target === 'start-node') {
        showError('Invalid Connection', 'Cannot connect to Start node');
        return;
      }

      // Check for loops - ensure forward connections only
      const visited = new Set<string>();
      const queue: string[] = [params.target];
      visited.add(params.target);

      while (queue.length > 0) {
        const currentNodeId = queue.shift()!;
        edges.forEach(edge => {
          if (edge.source === currentNodeId && !visited.has(edge.target)) {
            if (edge.target === params.source) {
              showError('Invalid Connection', 'This connection would create a loop. Workflows must flow forward only.');
              return;
            }
            visited.add(edge.target);
            queue.push(edge.target);
          }
        });
      }

      setEdges((eds) => {
        // Remove the start-finish edge if connecting from start or to finish
        const filteredEdges = eds.filter(e => !(e.id === 'edge-start-finish' &&
          (params.source === 'start-node' || params.target === 'finish-node')));
        return addEdge(params, filteredEdges);
      });
    },
    [setEdges, showError, edges]
  );

  // Initialize Start and Finish nodes on mount if creating new workflow
  useEffect(() => {
    if (!workflowId && nodes.length === 0) {
      const startNode: Node = {
        id: 'start-node',
        type: 'startNode',
        position: { x: 100, y: 200 },
        data: {},
      };

      const finishNode: Node = {
        id: 'finish-node',
        type: 'finishNode',
        position: { x: 500, y: 200 },
        data: {},
      };

      const startFinishEdge: Edge = {
        id: 'edge-start-finish',
        source: 'start-node',
        target: 'finish-node',
        type: 'default',
      };

      setNodes([startNode, finishNode]);
      setEdges([startFinishEdge]);
    }
  }, [workflowId, nodes.length, setNodes, setEdges]);

  // Debounce folder search queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setMyFoldersDebouncedQuery(myFoldersSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [myFoldersSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSharedDebouncedQuery(sharedSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [sharedSearchQuery]);

  // Load my folders
  const loadMyFolders = useCallback(async () => {
    setMyFoldersLoading(true);
    try {
      let response: FolderRepoResDto;

      if (myFoldersCurrentFolderId !== null) {
        response = await notificationApiClient.getFolder(myFoldersCurrentFolderId, {
          page: myFoldersCurrentPage,
          size: myFoldersPageSize,
          showFolder: true,
          name: myFoldersDebouncedQuery || undefined,
          sort: SortFields.NAME,
          desc: false
        });
      } else {
        const repoResponse = await notificationApiClient.getRepository({
          page: myFoldersCurrentPage,
          size: myFoldersPageSize,
          name: myFoldersDebouncedQuery || undefined
        });
        response = {
          folder: undefined,
          folders: repoResponse.content || [],
          documents: [],
          pageable: {
            pageNumber: repoResponse.number ?? myFoldersCurrentPage,
            pageSize: repoResponse.size ?? myFoldersPageSize
          },
          totalElements: repoResponse.totalElements || 0,
          totalPages: repoResponse.totalPages || 0
        };
      }

      setMyFoldersData(response);
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setMyFoldersLoading(false);
    }
  }, [myFoldersCurrentFolderId, myFoldersCurrentPage, myFoldersDebouncedQuery, myFoldersPageSize]);

  // Load shared folders
  const loadSharedFolders = useCallback(async () => {
    setSharedLoading(true);
    try {
      let response: FolderRepoResDto;

      if (sharedCurrentFolderId !== null) {
        response = await notificationApiClient.getFolder(sharedCurrentFolderId, {
          page: sharedCurrentPage,
          size: sharedPageSize,
          showFolder: true,
          name: sharedDebouncedQuery || undefined,
          sort: SortFields.NAME,
          desc: false
        });
      } else {
        response = await notificationApiClient.getSharedFolders({
          page: sharedCurrentPage,
          size: sharedPageSize,
          name: sharedDebouncedQuery || undefined,
          showFolder: true,
          sort: SortFields.NAME,
          desc: false
        });
      }

      setSharedData(response);
    } catch (error) {
      console.error('Failed to load shared folders:', error);
    } finally {
      setSharedLoading(false);
    }
  }, [sharedCurrentFolderId, sharedCurrentPage, sharedDebouncedQuery, sharedPageSize]);

  useEffect(() => {
    if (showFolderPicker && folderActiveTab === 'folders') {
      loadMyFolders();
    }
  }, [showFolderPicker, folderActiveTab, myFoldersCurrentFolderId, myFoldersCurrentPage, myFoldersDebouncedQuery, loadMyFolders]);

  useEffect(() => {
    if (showFolderPicker && folderActiveTab === 'shared') {
      loadSharedFolders();
    }
  }, [showFolderPicker, folderActiveTab, sharedCurrentFolderId, sharedCurrentPage, sharedDebouncedQuery, loadSharedFolders]);

  const navigateToMyFolder = (folderId: number, folderName: string) => {
    setMyFoldersCurrentFolderId(folderId);
    setMyFoldersBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
    setMyFoldersCurrentPage(0);
  };

  const navigateMyFoldersBreadcrumb = (folderId: number | null, index?: number) => {
    if (folderId === null) {
      setMyFoldersCurrentFolderId(null);
      setMyFoldersBreadcrumbs([]);
    } else {
      setMyFoldersCurrentFolderId(folderId);
      if (index !== undefined) {
        setMyFoldersBreadcrumbs(prev => prev.slice(0, index + 1));
      }
    }
    setMyFoldersCurrentPage(0);
  };

  const navigateToSharedFolder = (folderId: number, folderName: string) => {
    setSharedCurrentFolderId(folderId);
    setSharedBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
    setSharedCurrentPage(0);
  };

  const navigateSharedBreadcrumb = (folderId: number | null, index?: number) => {
    if (folderId === null) {
      setSharedCurrentFolderId(null);
      setSharedBreadcrumbs([]);
    } else {
      setSharedCurrentFolderId(folderId);
      if (index !== undefined) {
        setSharedBreadcrumbs(prev => prev.slice(0, index + 1));
      }
    }
    setSharedCurrentPage(0);
  };

  const handleFolderSelect = (folderId: number, folderName: string) => {
    setFolderTriggerFolderId(folderId);
    setFolderTriggerFolderName(folderName);
    setShowFolderPicker(false);
    // Reset folder picker state
    setMyFoldersCurrentFolderId(null);
    setMyFoldersBreadcrumbs([]);
    setMyFoldersSearchQuery('');
    setMyFoldersCurrentPage(0);
    setSharedCurrentFolderId(null);
    setSharedBreadcrumbs([]);
    setSharedSearchQuery('');
    setSharedCurrentPage(0);
  };

  const handleDeleteNode = useCallback((nodeId: string) => {
    // Prevent deleting start or finish nodes
    if (nodeId === 'start-node' || nodeId === 'finish-node') {
      showError('Cannot Delete', 'Start and Finish nodes cannot be deleted');
      return;
    }

    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => {
      const filtered = eds.filter(
        (edge) =>
          edge.source !== nodeId && edge.target !== nodeId
      );

      // If no edges remain between start and finish, add the default edge
      const hasStartFinishConnection = filtered.some(e =>
        (e.source === 'start-node' && e.target === 'finish-node') ||
        (nodes.find(n => n.id === e.source)?.type === 'startNode' &&
          nodes.find(n => n.id === e.target)?.type === 'finishNode')
      );

      if (!hasStartFinishConnection && filtered.length === 0) {
        return [{ id: 'edge-start-finish', source: 'start-node', target: 'finish-node', type: 'default' }];
      }

      return filtered;
    });
  }, [setNodes, setEdges, nodes, showError]);

  const handleAddStep = useCallback(() => {
    const nodeId = `step-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      type: 'workflowStep',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        label: `Step ${nodes.length}`,
        description: '',
        assignments: [],
        expirationDays: 0,
        onCompleteAction: 'NONE',
        isRequired: true,
        allowParallelApproval: false,
        isFirstStep: false,
        onEdit: createEditHandler(nodeId),
        onDelete: () => handleDeleteNode(nodeId),
      },
    };
    setNodes((nds) => [...nds, newNode]);
    // Open modal to configure the new step
    setEditingStepData(newNode);
    setShowStepModal(true);
  }, [nodes.length, setNodes, createEditHandler, handleDeleteNode]);

  const handleNodeClick = useCallback((_: any, node: Node) => {
    // Don't open modal on node click, only on button click
  }, []);

  const handleEditStep = useCallback((node: Node) => {
    setEditingStepData(node);
    setShowStepModal(true);
  }, []);

  // Handle edge deletion and add step from custom edge component
  useEffect(() => {
    const handleDeleteEdge = (event: CustomEvent<{ edgeId: string }>) => {
      const edgeId = event.detail.edgeId;
      // Prevent deleting the start-finish edge if it's the only connection
      if (edgeId === 'edge-start-finish') {
        const otherEdges = edges.filter(e => e.id !== edgeId);
        const workflowStepEdges = otherEdges.filter(e => {
          const sourceNode = nodes.find(n => n.id === e.source);
          const targetNode = nodes.find(n => n.id === e.target);
          return sourceNode?.type !== 'startNode' && targetNode?.type !== 'finishNode';
        });
        if (workflowStepEdges.length === 0) {
          showError('Cannot Delete', 'Cannot delete the only connection between Start and Finish');
          return;
        }
      }
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    };

    const handleAddStepToEdge = (event: CustomEvent<{ edgeId: string }>) => {
      const edgeId = event.detail.edgeId;
      const edge = edges.find(e => e.id === edgeId);
      if (edge) {
        // Create a new step between the edge's source and target
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        const nodeId = `step-${Date.now()}`;
        const newNode: Node = {
          id: nodeId,
          type: 'workflowStep',
          position: {
            x: sourceNode && targetNode
              ? (sourceNode.position.x + targetNode.position.x) / 2
              : (sourceNode?.position.x || 0) + 200,
            y: sourceNode && targetNode
              ? (sourceNode.position.y + targetNode.position.y) / 2
              : (sourceNode?.position.y || 0),
          },
          data: {
            label: `Step ${nodes.filter(n => n.type === 'workflowStep' || n.type === 'firstStep').length + 1}`,
            description: '',
            assignments: [],
            expirationDays: 0,
            onCompleteAction: 'NONE',
            isRequired: true,
            allowParallelApproval: false,
            isFirstStep: false,
            onEdit: createEditHandler(nodeId),
            onDelete: () => handleDeleteNode(nodeId),
          },
        };

        setNodes((nds) => [...nds, newNode]);

        // Replace the edge with two edges: source -> newNode and newNode -> target
        setEdges((eds) => {
          const filtered = eds.filter(e => e.id !== edgeId);
          return [
            ...filtered,
            { id: `edge-${edge.source}-${nodeId}`, source: edge.source, target: nodeId, type: 'default' },
            { id: `edge-${nodeId}-${edge.target}`, source: nodeId, target: edge.target, type: 'default' },
          ];
        });

        // Open modal to configure the new step
        setEditingStepData(newNode);
        setShowStepModal(true);
      }
    };

    window.addEventListener('deleteEdge', handleDeleteEdge as EventListener);
    window.addEventListener('addStepToEdge', handleAddStepToEdge as EventListener);
    return () => {
      window.removeEventListener('deleteEdge', handleDeleteEdge as EventListener);
      window.removeEventListener('addStepToEdge', handleAddStepToEdge as EventListener);
    };
  }, [setEdges, edges, nodes, setNodes, createEditHandler, showError, handleDeleteNode]);

  const handleStepSave = useCallback((stepData: any) => {
    if (!editingStepData) return;

    // Store assignments with full entity objects for persistence
    // Use assignmentEntities if provided (from modal), otherwise try to preserve existing entities
    const assignmentsWithEntities = stepData.assignmentEntities ||
      (editingStepData.data.assignments?.map((existingAssignment: any) => {
        // Try to find matching assignment in new data to preserve entity
        const newAssignment = stepData.assignments?.find((a: any) =>
          a.assigneeId === existingAssignment.assigneeId ||
          a.assigneeId === existingAssignment.entity?.id
        );
        return {
          assigneeType: newAssignment?.assigneeType || existingAssignment.assigneeType,
          assigneeId: newAssignment?.assigneeId || existingAssignment.assigneeId || existingAssignment.entity?.id,
          entity: existingAssignment.entity, // Preserve existing entity object
        };
      })) ||
      stepData.assignments?.map((a: any) => ({
        assigneeType: a.assigneeType,
        assigneeId: a.assigneeId,
        // No entity available, will be fetched when modal opens
      })) || [];

    const updatedNode: Node = {
      ...editingStepData,
      data: {
        ...editingStepData.data,
        label: stepData.label,
        description: stepData.description,
        assignments: assignmentsWithEntities, // Store with full entity objects
        expirationDays: stepData.expirationDays,
        onCompleteAction: stepData.onCompleteAction,
        targetFolderId: stepData.targetFolderId,
        isRequired: stepData.isRequired,
        allowParallelApproval: stepData.allowParallelApproval,
        minApprovalsNeeded: stepData.minApprovalsNeeded,
        isFirstStep: editingStepData.data.isFirstStep, // Preserve first step flag
        onEdit: editingStepData.data.onEdit, // Preserve the edit handler
      },
    };

    setNodes((nds) =>
      nds.map((node) =>
        node.id === editingStepData.id ? updatedNode : node
      )
    );
    setShowStepModal(false);
    setEditingStepData(null);
  }, [editingStepData, setNodes]);

  const handleApplyChangesConfirm = useCallback(async (applyToExisting: boolean, reason?: string) => {
    if (!workflowToApplyChanges) return;

    setIsApplyingChanges(true);
    try {
      if (applyToExisting) {
        const result = await workflowService.applyWorkflowChanges(
          workflowToApplyChanges,
          true,
          undefined, // Apply to all instances
          reason
        );

        if (result.failureCount > 0) {
          showError(
            'Partial Success',
            `Updated ${result.successCount} instances, but ${result.failureCount} failed`
          );
        } else {
          showSuccess(
            'Changes Applied',
            `Successfully updated ${result.successCount} workflow instance(s)`
          );
        }
      }

      // Navigate back to workflow list
      router.push('/admin/workflow');
    } catch (error: any) {
      console.error('Failed to apply workflow changes:', error);
      showError(
        'Apply Failed',
        error?.response?.data?.message || 'Failed to apply changes to instances'
      );
    } finally {
      setIsApplyingChanges(false);
      setShowApplyChangesDialog(false);
      setWorkflowToApplyChanges(null);
      setApplyChangesReason('');
    }
  }, [workflowToApplyChanges, router, showSuccess, showError]);

  const handleSave = useCallback(async () => {
    // Filter out start and finish nodes
    const workflowSteps = nodes.filter(n => n.type !== 'startNode' && n.type !== 'finishNode');

    // Validate workflow name
    if (!workflowName || workflowName.trim() === '') {
      showError('Validation Error', 'Please provide a workflow name');
      return;
    }

    // Validate at least one step exists
    if (workflowSteps.length === 0) {
      showError('Validation Error', 'A workflow must have at least one step. Please add a step before saving.');
      return;
    }

    // Validate all steps have at least one assignment
    const stepsWithoutAssignments = workflowSteps.filter(step => {
      const assignments = Array.isArray(step.data.assignments) ? step.data.assignments : [];
      return assignments.length === 0;
    });

    if (stepsWithoutAssignments.length > 0) {
      const stepNames = stepsWithoutAssignments.map(step => step.data.label || 'Unnamed step').join(', ');
      showError('Validation Error', `All steps must have at least one assigned user. Please assign users to: ${stepNames}`);
      return;
    }

    // Validate trigger is selected
    if (!triggerType) {
      showError('Validation Error', 'Please select a workflow trigger (Folder or Model)');
      return;
    }

    if (triggerType === 'FOLDER' && !folderTriggerFolderId) {
      showError('Validation Error', 'Please select a folder for the workflow trigger');
      return;
    }

    if (triggerType === 'MODEL' && !modelTriggerCategoryId) {
      showError('Validation Error', 'Please select a model for the workflow trigger');
      return;
    }

    // Check if all workflow steps are connected between start and finish
    const startNode = nodes.find(n => n.id === 'start-node');
    const finishNode = nodes.find(n => n.id === 'finish-node');

    if (!startNode || !finishNode) {
      showError('Validation Error', 'Start and Finish nodes are required');
      return;
    }

    // Check if all workflow steps are reachable from start
    const visited = new Set<string>();
    const queue: string[] = ['start-node'];
    visited.add('start-node');

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      edges.forEach(edge => {
        if (edge.source === currentNodeId && !visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push(edge.target);
        }
      });
    }

    // Check if finish is reachable from start
    if (!visited.has('finish-node')) {
      showError('Validation Error', 'Finish node must be reachable from Start node');
      return;
    }

    // Check if all workflow steps are reachable from start
    const allStepsReachable = workflowSteps.every(step => visited.has(step.id));
    if (!allStepsReachable) {
      showError('Validation Error', 'All steps must be connected between Start and Finish nodes');
      return;
    }

    setIsSaving(true);
    try {
      // Convert workflow step nodes to workflow steps (exclude start/finish)
      // Determine step order based on edges (topological sort from start)
      const stepOrderMap = new Map<string, number>();
      const inDegree = new Map<string, number>();

      // Initialize in-degree for workflow steps only
      workflowSteps.forEach(node => {
        inDegree.set(node.id, 0);
      });

      // Calculate in-degree (only count edges between workflow steps, not from/to start/finish)
      edges.forEach(edge => {
        const sourceIsStep = workflowSteps.some(n => n.id === edge.source);
        const targetIsStep = workflowSteps.some(n => n.id === edge.target);
        if (sourceIsStep && targetIsStep) {
          const current = inDegree.get(edge.target) || 0;
          inDegree.set(edge.target, current + 1);
        }
      });

      // Find steps with no incoming edges from other steps (connected from start)
      const queue: string[] = [];
      workflowSteps.forEach(node => {
        const incomingFromSteps = edges.filter(e =>
          e.target === node.id && workflowSteps.some(n => n.id === e.source)
        ).length;
        if (incomingFromSteps === 0) {
          queue.push(node.id);
        }
      });

      let order = 1;
      while (queue.length > 0) {
        const nodeId = queue.shift()!;
        stepOrderMap.set(nodeId, order++);

        // Find outgoing edges to other workflow steps
        edges.forEach(edge => {
          if (edge.source === nodeId) {
            const targetIsStep = workflowSteps.some(n => n.id === edge.target);
            if (targetIsStep) {
              const targetInDegree = (inDegree.get(edge.target) || 0) - 1;
              inDegree.set(edge.target, targetInDegree);
              if (targetInDegree === 0) {
                queue.push(edge.target);
              }
            }
          }
        });
      }

      // If there are cycles or disconnected nodes, use index as fallback
      workflowSteps.forEach((node, index) => {
        if (!stepOrderMap.has(node.id)) {
          stepOrderMap.set(node.id, index + 1);
        }
      });

      const steps = workflowSteps.map((node) => {
        const stepOrder = stepOrderMap.get(node.id) || 1;
        const assignments: CreateStepAssignmentRequest[] = (Array.isArray(node.data.assignments) ? node.data.assignments : []).map((a: any) => ({
          assigneeType: a.assigneeType as 'USER' | 'ROLE' | 'GROUP',
          assigneeId: a.assigneeId as string,
          canEdit: (a.canEdit as boolean) ?? true,
        }));

        return {
          name: (node.data.label as string) || `Step ${stepOrder}`,
          description: (node.data.description as string) || '',
          stepOrder: stepOrder,
          expirationDays: (node.data.expirationDays as number) || undefined,
          onCompleteAction: (node.data.onCompleteAction as 'NONE' | 'MOVE_TO_FOLDER' | 'NOTIFY_USERS' | 'COMPLETE_WORKFLOW') || 'NONE',
          targetFolderId: (node.data.targetFolderId as number) || undefined,
          isRequired: (node.data.isRequired as boolean) ?? true,
          allowParallelApproval: (node.data.allowParallelApproval as boolean) ?? false,
          minApprovalsNeeded: (node.data.minApprovalsNeeded as number) || undefined,
          assignments: assignments,
        };
      });

      // Convert admins to request format
      const admins = workflowAdmins.map(admin => ({
        userId: admin.userId,
      }));

      // Build trigger request (workflowId is set by backend)
      const trigger: AddWorkflowTriggerRequest = triggerType === 'FOLDER'
        ? {
          triggerType: 'FOLDER',
          folderId: folderTriggerFolderId!,
        }
        : {
          triggerType: 'MODEL',
          categoryId: modelTriggerCategoryId!,
        };

      if (workflowId) {
        // Update existing workflow
        const updatedWorkflow = await workflowService.updateWorkflow(Number(workflowId), {
          name: workflowName,
          description: workflowDescription,
          isActive,
          steps,
          admins: admins.length > 0 ? admins : undefined,
          trigger,
        });

        // Store workflow ID for the apply changes dialog
        setWorkflowToApplyChanges(Number(workflowId));
        setShowApplyChangesDialog(true);
        showSuccess('Workflow Updated', 'Workflow updated successfully');
        return; // Will navigate after user makes decision
      } else {
        // Create new workflow
        const newWorkflow = await workflowService.createWorkflow({
          name: workflowName,
          description: workflowDescription,
          isActive,
          steps,
          admins: admins.length > 0 ? admins : undefined,
          trigger,
        });
        showSuccess('Workflow Created', 'Workflow created successfully');
      }

      router.push('/admin/workflow');
    } catch (error: any) {
      console.error('Failed to save workflow:', error);
      showError('Save Failed', error?.response?.data?.message || 'Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  }, [
    workflowName,
    workflowDescription,
    isActive,
    nodes,
    edges,
    workflowId,
    triggerType,
    folderTriggerFolderId,
    modelTriggerCategoryId,
    workflowAdmins,
    router,
    showSuccess,
    showError,
  ]);

  const proOptions = { hideAttribution: true };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/workflow')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              {workflowId ? 'Edit Workflow' : 'Create New Workflow'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Design your workflow visually
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-blue-500">
            {nodes.filter(n => n.type !== 'startNode' && n.type !== 'finishNode').length} Steps
          </Badge>
          <Badge variant="outline">
            {edges.length} Connections
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddStep}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isSaving ||
              !workflowName ||
              workflowName.trim() === '' ||
              nodes.filter(n => n.type !== 'startNode' && n.type !== 'finishNode').length === 0
            }
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Workflow'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Workflow Properties */}
        <Card className="w-80 border-r rounded-none">
          <div className="p-4 space-y-4 h-full overflow-y-auto">
            <div>
              <h3 className="font-semibold mb-4">Workflow Properties</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="workflow-name">Name *</Label>
                  <Input
                    id="workflow-name"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Workflow name..."
                  />
                </div>

                <div>
                  <Label htmlFor="workflow-description">Description</Label>
                  <Textarea
                    id="workflow-description"
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    placeholder="Workflow description..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="is-active" className="cursor-pointer">
                    Active workflow
                  </Label>
                </div>
              </div>
            </div>

            {/* Workflow Admins */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Workflow Admins</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingAdminIndex(null);
                    setShowAdminModal(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {workflowAdmins.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No admins assigned
                  </p>
                ) : (
                  workflowAdmins.map((admin, index) => (
                    <div
                      key={admin.userId}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {admin.user && (
                          <UserAvatar user={admin.user as any} size="sm" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {admin.user?.displayName || admin.user?.username || 'Unknown User'}
                          </p>
                          {admin.user?.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {admin.user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingAdminIndex(index);
                              setShowAdminModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setWorkflowAdmins(workflowAdmins.filter((_, i) => i !== index));
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Workflow Triggers */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Workflow Triggers *</h3>

              {/* Radio Button Selection */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="trigger-folder"
                    name="trigger-type"
                    checked={triggerType === 'FOLDER'}
                    onChange={() => {
                      setTriggerType('FOLDER');
                      // Clear model trigger when switching to folder
                      setModelTriggerCategoryId(null);
                      setModelTriggerCategoryName('');
                      setModelSearchQuery('');
                      setShowModelSearch(false);
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Label htmlFor="trigger-folder" className="cursor-pointer font-medium">
                    Start on Folder
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="trigger-model"
                    name="trigger-type"
                    checked={triggerType === 'MODEL'}
                    onChange={() => {
                      setTriggerType('MODEL');
                      // Clear folder trigger when switching to model
                      setFolderTriggerFolderId(null);
                      setFolderTriggerFolderName('');
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Label htmlFor="trigger-model" className="cursor-pointer font-medium">
                    Start on Model
                  </Label>
                </div>
              </div>

              {/* Folder Trigger */}
              {triggerType === 'FOLDER' && (
                <div className="space-y-2 mb-4">
                  <Label className="text-sm font-medium">Select Folder *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={folderTriggerFolderName || 'No folder selected'}
                      readOnly
                      placeholder="Select folder..."
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFolderPicker(true)}
                    >
                      <Folder className="h-4 w-4 mr-1" />
                      {folderTriggerFolderId ? 'Change' : 'Select'}
                    </Button>
                    {folderTriggerFolderId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFolderTriggerFolderId(null);
                          setFolderTriggerFolderName('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Start workflow when document is uploaded or moved to this folder
                  </p>
                </div>
              )}

              {/* Model Trigger */}
              {triggerType === 'MODEL' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Model *</Label>
                  <div className="relative model-search-container">
                    <ServerSearchInput
                      value={modelSearchQuery}
                      onChange={(value) => {
                        setModelSearchQuery(value);
                        setShowModelSearch(true);
                      }}
                      onFocus={() => {
                        setShowModelSearch(true);
                        if (modelSearchQuery === '' && displayCategories.length === 0) {
                          fetchCategories();
                        }
                      }}
                      placeholder={modelTriggerCategoryName || "Search models..."}
                      className="w-full"
                    />
                    {showModelSearch && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {modelSearchLoading ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          </div>
                        ) : displayCategories.length > 0 ? (
                          displayCategories.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                setModelTriggerCategoryId(category.id);
                                setModelTriggerCategoryName(category.name);
                                setModelSearchQuery('');
                                setShowModelSearch(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-200 last:border-b-0"
                            >
                              <div className="font-medium">{category.name}</div>
                              {category.description && (
                                <div className="text-xs text-gray-500">{category.description}</div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500 text-sm">No models found</div>
                        )}
                      </div>
                    )}
                    {modelTriggerCategoryId && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-sm font-medium flex-1">{modelTriggerCategoryName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setModelTriggerCategoryId(null);
                            setModelTriggerCategoryName('');
                            setModelSearchQuery('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Start workflow when document uses this filing category
                  </p>
                </div>
              )}

              {/* Display Current Trigger Info */}
              {workflowId && triggerType && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">Current Trigger</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    {triggerType === 'FOLDER' && folderTriggerFolderName && (
                      <div>
                        <span className="font-medium">Type:</span> Folder
                        <br />
                        <span className="font-medium">Folder:</span> {folderTriggerFolderName}
                      </div>
                    )}
                    {triggerType === 'MODEL' && modelTriggerCategoryName && (
                      <div>
                        <span className="font-medium">Type:</span> Model
                        <br />
                        <span className="font-medium">Model:</span> {modelTriggerCategoryName}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Workflow Stats */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Steps:</span>
                  <span className="font-medium">{nodes.filter(n => n.type !== 'startNode' && n.type !== 'finishNode').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connections:</span>
                  <span className="font-medium">{edges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admins:</span>
                  <span className="font-medium">{workflowAdmins.length}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Canvas */}
        <div className="flex-1 bg-gray-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            proOptions={proOptions}
            connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 3 }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: false,
              style: { stroke: '#3b82f6', strokeWidth: 3 },
            }}
            edgeTypes={edgeTypes}
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>

      {/* Step Configuration Modal */}
      {editingStepData && (
        <WorkflowStepConfigModal
          isOpen={showStepModal}
          onClose={() => {
            setShowStepModal(false);
            setEditingStepData(null);
          }}
          stepData={{
            id: editingStepData.id,
            label: editingStepData.data.label || '',
            description: editingStepData.data.description || '',
            assignments: editingStepData.data.assignments?.map((a: any) => ({
              assigneeType: a.assigneeType || (a.entity && ('username' in a.entity) ? 'USER' : ('userCount' in a.entity) ? 'GROUP' : 'ROLE'),
              assigneeId: a.assigneeId || a.entity?.id,
              entity: a.entity, // Pass full entity object if available
            })) || [],
            expirationDays: editingStepData.data.expirationDays,
            onCompleteAction: editingStepData.data.onCompleteAction,
            targetFolderId: editingStepData.data.targetFolderId,
            targetFolderName: editingStepData.data.targetFolderName,
            isRequired: editingStepData.data.isRequired,
            allowParallelApproval: editingStepData.data.allowParallelApproval,
            minApprovalsNeeded: editingStepData.data.minApprovalsNeeded,
          }}
          onSave={handleStepSave}
        />
      )}

      {/* Folder Picker Modal */}
      {showFolderPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Select Folder for Workflow Trigger</h3>
              <button
                onClick={() => {
                  setShowFolderPicker(false);
                  setMyFoldersCurrentFolderId(null);
                  setMyFoldersBreadcrumbs([]);
                  setMyFoldersSearchQuery('');
                  setSharedCurrentFolderId(null);
                  setSharedBreadcrumbs([]);
                  setSharedSearchQuery('');
                }}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Tab Selection */}
              <div className="flex gap-2 border-b mb-4">
                <button
                  onClick={() => setFolderActiveTab('folders')}
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${folderActiveTab === 'folders'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    My Folders
                  </div>
                </button>
                <button
                  onClick={() => setFolderActiveTab('shared')}
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${folderActiveTab === 'shared'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Shared with Me
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              {folderActiveTab === 'folders' ? (
                <div className="flex flex-col border rounded-lg overflow-hidden">
                  {/* Search Bar */}
                  <div className="p-3 border-b bg-gray-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={myFoldersSearchQuery}
                        onChange={(e) => setMyFoldersSearchQuery(e.target.value)}
                        placeholder="Search folders..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Breadcrumb Navigation */}
                  <div className="p-3 border-b bg-white flex items-center gap-2 text-sm overflow-x-auto">
                    <button
                      onClick={() => navigateMyFoldersBreadcrumb(null)}
                      className={`flex items-center gap-1 px-2 py-1 rounded transition-colors flex-shrink-0 ${myFoldersCurrentFolderId === null
                        ? 'font-medium text-blue-600'
                        : 'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                      <Home className="h-4 w-4" />
                      <span>Root</span>
                    </button>

                    {myFoldersBreadcrumbs.map((crumb, index) => (
                      <div key={`${crumb.id}-${index}`} className="flex items-center gap-2 flex-shrink-0">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        <button
                          onClick={() => navigateMyFoldersBreadcrumb(crumb.id, index)}
                          className={`px-2 py-1 rounded transition-colors truncate max-w-[150px] ${index === myFoldersBreadcrumbs.length - 1 && myFoldersCurrentFolderId === crumb.id
                            ? 'font-medium text-blue-600'
                            : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          title={crumb.name}
                        >
                          {crumb.name}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Folders List */}
                  <div className="flex-1 overflow-y-auto bg-white min-h-[300px] max-h-[400px]">
                    {myFoldersLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      </div>
                    ) : myFoldersData && myFoldersData.folders && myFoldersData.folders.length > 0 ? (
                      <div className="p-2">
                        {myFoldersData.folders.map((folder) => {
                          const isSelected = folderTriggerFolderId === folder.id;
                          return (
                            <div
                              key={folder.id}
                              className={`flex items-center py-2 px-3 rounded-md transition-colors ${isSelected
                                ? 'bg-blue-100 border border-blue-300'
                                : 'hover:bg-gray-100'
                                }`}
                            >
                              <Folder className="h-4 w-4 mr-2 text-blue-500" />

                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => handleFolderSelect(folder.id, folder.name)}
                              >
                                <div className="text-sm truncate">{folder.name}</div>
                                {folder.description && (
                                  <div className="text-xs text-gray-500 mt-1 truncate">{folder.description}</div>
                                )}
                              </div>

                              {isSelected && (
                                <Check className="h-4 w-4 text-blue-600 flex-shrink-0 mr-2" />
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToMyFolder(folder.id, folder.name);
                                }}
                                className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Navigate into folder"
                              >
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">No folders found</div>
                    )}
                  </div>

                  {/* Pagination */}
                  {myFoldersData && myFoldersData.totalPages > 1 && (
                    <div className="p-3 border-t bg-gray-50">
                      <Pagination
                        currentPage={myFoldersCurrentPage}
                        totalPages={myFoldersData.totalPages}
                        totalElements={myFoldersData.totalElements || 0}
                        pageSize={myFoldersPageSize}
                        onPageChange={setMyFoldersCurrentPage}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col border rounded-lg overflow-hidden">
                  {/* Search Bar */}
                  <div className="p-3 border-b bg-gray-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={sharedSearchQuery}
                        onChange={(e) => setSharedSearchQuery(e.target.value)}
                        placeholder="Search shared folders..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Breadcrumb Navigation */}
                  <div className="p-3 border-b bg-white flex items-center gap-2 text-sm overflow-x-auto">
                    <button
                      onClick={() => navigateSharedBreadcrumb(null)}
                      className={`flex items-center gap-1 px-2 py-1 rounded transition-colors flex-shrink-0 ${sharedCurrentFolderId === null
                        ? 'font-medium text-blue-600'
                        : 'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                      <Home className="h-4 w-4" />
                      <span>Root</span>
                    </button>

                    {sharedBreadcrumbs.map((crumb, index) => (
                      <div key={`${crumb.id}-${index}`} className="flex items-center gap-2 flex-shrink-0">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        <button
                          onClick={() => navigateSharedBreadcrumb(crumb.id, index)}
                          className={`px-2 py-1 rounded transition-colors truncate max-w-[150px] ${index === sharedBreadcrumbs.length - 1 && sharedCurrentFolderId === crumb.id
                            ? 'font-medium text-blue-600'
                            : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          title={crumb.name}
                        >
                          {crumb.name}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Folders List */}
                  <div className="flex-1 overflow-y-auto bg-white min-h-[300px] max-h-[400px]">
                    {sharedLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      </div>
                    ) : sharedData && sharedData.folders && sharedData.folders.length > 0 ? (
                      <div className="p-2">
                        {sharedData.folders.map((folder) => {
                          const isSelected = folderTriggerFolderId === folder.id;
                          return (
                            <div
                              key={folder.id}
                              className={`flex items-center py-2 px-3 rounded-md transition-colors ${isSelected
                                ? 'bg-blue-100 border border-blue-300'
                                : 'hover:bg-gray-100'
                                }`}
                            >
                              <Folder className="h-4 w-4 mr-2 text-blue-500" />

                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => handleFolderSelect(folder.id, folder.name)}
                              >
                                <div className="text-sm truncate">{folder.name}</div>
                                {folder.description && (
                                  <div className="text-xs text-gray-500 mt-1 truncate">{folder.description}</div>
                                )}
                              </div>

                              {isSelected && (
                                <Check className="h-4 w-4 text-blue-600 flex-shrink-0 mr-2" />
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToSharedFolder(folder.id, folder.name);
                                }}
                                className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Navigate into folder"
                              >
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">No folders found</div>
                    )}
                  </div>

                  {/* Pagination */}
                  {sharedData && sharedData.totalPages > 1 && (
                    <div className="p-3 border-t bg-gray-50">
                      <Pagination
                        currentPage={sharedCurrentPage}
                        totalPages={sharedData.totalPages}
                        totalElements={sharedData.totalElements || 0}
                        pageSize={sharedPageSize}
                        onPageChange={setSharedCurrentPage}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Management Modal */}
      <WorkflowAdminModal
        isOpen={showAdminModal}
        onClose={() => {
          setShowAdminModal(false);
          setEditingAdminIndex(null);
        }}
        onSave={async (data) => {
          if (editingAdminIndex !== null) {
            // Update existing admin
            const updatedAdmin = { ...workflowAdmins[editingAdminIndex], ...data };
            // Try to preserve user object if available
            if (workflowAdmins[editingAdminIndex].user) {
              updatedAdmin.user = workflowAdmins[editingAdminIndex].user;
            }
            setWorkflowAdmins(workflowAdmins.map((admin, index) =>
              index === editingAdminIndex ? updatedAdmin : admin
            ));
          } else {
            // Add new admin - need to fetch user details
            try {
              const user = await notificationApiClient.getUserById(data.userId, { silent: true });
              setWorkflowAdmins([...workflowAdmins, { ...data, user }]);
            } catch (error) {
              console.error('Failed to load user:', error);
              // Add without user details, will be loaded later
              setWorkflowAdmins([...workflowAdmins, data]);
            }
          }
          setShowAdminModal(false);
          setEditingAdminIndex(null);
        }}
        editingAdmin={editingAdminIndex !== null ? {
          id: 0,
          user: workflowAdmins[editingAdminIndex]?.user || { id: workflowAdmins[editingAdminIndex].userId } as any,
        } : null}
        existingAdminUserIds={workflowAdmins.map(a => a.userId)}
      />

      {/* Apply Workflow Changes Dialog */}
      <ApplyWorkflowChangesDialog
        isOpen={showApplyChangesDialog}
        onClose={() => {
          setShowApplyChangesDialog(false);
          setWorkflowToApplyChanges(null);
          setApplyChangesReason('');
          // Navigate even if user cancels
          router.push('/admin/workflow');
        }}
        onConfirm={handleApplyChangesConfirm}
        isLoading={isApplyingChanges}
      />
    </div>
  );
}
