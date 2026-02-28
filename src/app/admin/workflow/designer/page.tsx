'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  getBezierPath,

  ConnectionMode,
  ConnectionLineType,
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
  Zap,
  Timer,
  Globe,
  Variable,
  FileCode,
  ScanText,
  Archive,
  Trash,
  RefreshCw,
  Copy,
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
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { apiClient } from '@/api/client';
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
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import WorkflowStepNode from './nodes/WorkflowStepNode';
import StartNode from './nodes/StartNode';
import FinishNode from './nodes/FinishNode';
import ConditionalNode from './nodes/ConditionalNode';
import StampNode from './nodes/StampNode';
import NotificationNode from './nodes/NotificationNode';
import DelayNode from './nodes/DelayNode';
import MoveDocumentNode from './nodes/MoveDocumentNode';
import EmailNode from './nodes/EmailNode';
import TriggerNode from './nodes/TriggerNode';
import EndSuccessNode from './nodes/EndSuccessNode';
import EndFailureNode from './nodes/EndFailureNode';

import ApiCallNode from './nodes/ApiCallNode';
import SubWorkflowNode from './nodes/SubWorkflowNode';
import SetVariableNode from './nodes/SetVariableNode';
import ScriptNode from './nodes/ScriptNode';
import OcrNode from './nodes/OcrNode';
import ArchiveNode from './nodes/ArchiveNode';
import DeleteNode from './nodes/DeleteNode';
// New node imports for full backend alignment
import ReviewNode from './nodes/ReviewNode';
import ManualTaskNode from './nodes/ManualTaskNode';
import SplitNode from './nodes/SplitNode';
import JoinNode from './nodes/JoinNode';
import UpdateMetadataNode from './nodes/UpdateMetadataNode';
import ChangeStatusNode from './nodes/ChangeStatusNode';
import NewVersionNode from './nodes/NewVersionNode';
import LockDocumentNode from './nodes/LockDocumentNode';
import UnlockDocumentNode from './nodes/UnlockDocumentNode';
import EndNode from './nodes/EndNode';
import CancelNode from './nodes/CancelNode';
import ErrorHandlerNode from './nodes/ErrorHandlerNode';
import GetContextNode from './nodes/GetContextNode';
import ApprovalNode from './nodes/ApprovalNode';
import MultiChoiceNode from './nodes/MultiChoiceNode';
import { WorkflowNodeData } from './nodes/types';
import { useRef } from 'react';
// Import node configuration modals
import DelayNodeModal from './modals/DelayNodeModal';
import StampNodeModal from './modals/StampNodeModal';
import MoveDocumentNodeModal from './modals/MoveDocumentNodeModal';
import NotificationNodeModal from './modals/NotificationNodeModal';
import EmailNodeModal from './modals/EmailNodeModal';
import ConditionNodeModal from './modals/ConditionNodeModal';
import TriggerNodeModal from './modals/TriggerNodeModal';

import ApiCallNodeModal from './modals/ApiCallNodeModal';
import SubWorkflowNodeModal from './modals/SubWorkflowNodeModal';
import SetVariableNodeModal from './modals/SetVariableNodeModal';
import ArchiveNodeModal from './modals/ArchiveNodeModal';
import DeleteNodeModal from './modals/DeleteNodeModal';
import ReviewNodeModal from './modals/ReviewNodeModal';
import ManualTaskNodeModal from './modals/ManualTaskNodeModal';
import ApprovalNodeModal from './modals/ApprovalNodeModal';
import SplitNodeModal from './modals/SplitNodeModal';
import JoinNodeModal from './modals/JoinNodeModal';
import UpdateMetadataNodeModal from './modals/UpdateMetadataNodeModal';
import ChangeStatusNodeModal from './modals/ChangeStatusNodeModal';
import NewVersionNodeModal from './modals/NewVersionNodeModal';
import LockDocumentNodeModal from './modals/LockDocumentNodeModal';
import UnlockDocumentNodeModal from './modals/UnlockDocumentNodeModal';
// Additional missing modal imports
import ScriptNodeModal from './modals/ScriptNodeModal';
import OcrNodeModal from './modals/OcrNodeModal';
import CancelNodeModal from './modals/CancelNodeModal';
import ErrorHandlerNodeModal from './modals/ErrorHandlerNodeModal';
import MultiChoiceNodeModal from './modals/MultiChoiceNodeModal';
import GetContextNodeModal from './modals/GetContextNodeModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InstancesTab from './tabs/InstancesTab';
import StatisticsTab from './tabs/StatisticsTab';
import HistoryTab from './tabs/HistoryTab';
import useWorkflowValidation from './hooks/useWorkflowValidation';
import ValidationPanel from './components/ValidationPanel';
import CustomEdge from './components/CustomEdge';
import NodesPalette from './components/NodesPalette';
import VariablesPanel from './components/VariablesPanel';
// Custom Node Components are imported from ./nodes/ directory

// Mapping from frontend node type to backend WorkflowNodeType
const nodeTypeToBackendType: Record<string, string> = {
  startNode: 'START',
  triggerNode: 'START',
  approvalNode: 'APPROVAL',
  workflowStep: 'APPROVAL',
  firstStep: 'APPROVAL',
  reviewNode: 'REVIEW',
  manualTaskNode: 'MANUAL_TASK',
  multiChoiceNode: 'MULTI_CHOICE',
  conditionalNode: 'CONDITION',
  splitNode: 'SPLIT',
  joinNode: 'JOIN',
  delayNode: 'DELAY',

  moveDocumentNode: 'MOVE_DOCUMENT',
  updateMetadataNode: 'UPDATE_METADATA',
  changeStatusNode: 'CHANGE_STATUS',
  newVersionNode: 'NEW_VERSION',
  lockDocumentNode: 'LOCK_DOCUMENT',
  unlockDocumentNode: 'UNLOCK_DOCUMENT',
  archiveNode: 'ARCHIVE_DOCUMENT',
  deleteNode: 'DELETE_DOCUMENT',
  stampNode: 'STAMP',
  notificationNode: 'NOTIFICATION',
  emailNode: 'NOTIFICATION',
  apiCallNode: 'API_CALL',
  scriptNode: 'SCRIPT',
  ocrNode: 'OCR_PROCESS',
  subWorkflowNode: 'SUB_WORKFLOW',
  setVariableNode: 'SET_VARIABLE',
  getContextNode: 'GET_CONTEXT',
  endNode: 'END',
  cancelNode: 'CANCEL',
  errorHandlerNode: 'ERROR_HANDLER',
  finishNode: 'END',
  endSuccessNode: 'END',
  endFailureNode: 'END',
};

const nodeTypes: NodeTypes = {
  // Entry
  startNode: StartNode,
  triggerNode: TriggerNode,

  // Human Tasks
  approvalNode: ApprovalNode,
  workflowStep: WorkflowStepNode, // Alias for APPROVAL
  firstStep: WorkflowStepNode,
  reviewNode: ReviewNode,
  manualTaskNode: ManualTaskNode,
  multiChoiceNode: MultiChoiceNode,

  // Logic / Flow
  conditionalNode: ConditionalNode,
  splitNode: SplitNode,
  joinNode: JoinNode,

  // Time / Scheduling
  delayNode: DelayNode,


  // Document Actions
  moveDocumentNode: MoveDocumentNode,
  updateMetadataNode: UpdateMetadataNode,
  changeStatusNode: ChangeStatusNode,
  newVersionNode: NewVersionNode,
  lockDocumentNode: LockDocumentNode,
  unlockDocumentNode: UnlockDocumentNode,
  archiveNode: ArchiveNode,
  deleteNode: DeleteNode,
  stampNode: StampNode,

  // Communication
  notificationNode: NotificationNode,
  emailNode: EmailNode,

  // Integration
  apiCallNode: ApiCallNode,
  scriptNode: ScriptNode,
  ocrNode: OcrNode,
  subWorkflowNode: SubWorkflowNode,

  // Variables
  setVariableNode: SetVariableNode,
  getContextNode: GetContextNode,

  // Flow Control / Termination
  endNode: EndNode,
  cancelNode: CancelNode,
  errorHandlerNode: ErrorHandlerNode,
  finishNode: FinishNode,
  endSuccessNode: EndSuccessNode,
  endFailureNode: EndFailureNode,
};

const edgeTypes = {
  default: CustomEdge,
};

export default function WorkflowDesignerPage() {
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
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
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(!!workflowId); // Start loading if editing existing workflow

  // Local variables for new workflows (before they have an ID)
  const [localVariables, setLocalVariables] = useState<import('./components/VariablesPanel').VariableDefinition[]>([]);
  const [workflowAdmins, setWorkflowAdmins] = useState<Array<{
    userId: string;
    user?: { id: string; displayName?: string; username?: string; email?: string; imgUrl?: string };
  }>>([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingAdminIndex, setEditingAdminIndex] = useState<number | null>(null);

  // Sidebar tab state
  const [sidebarTab, setSidebarTab] = useState<'properties' | 'nodes'>('properties');
  // Get initial tab from URL or default to designer
  const initialTab = searchParams?.get('tab') || 'designer';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab to URL when it changes
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  }, []);

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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStepData, setEditingStepData] = useState<any>(null);

  // New modal states for each node type
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [showStampModal, setShowStampModal] = useState(false);
  const [showMoveDocumentModal, setShowMoveDocumentModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  // New node modals

  const [showApiCallModal, setShowApiCallModal] = useState(false);
  const [showSubWorkflowModal, setShowSubWorkflowModal] = useState(false);
  const [showSetVariableModal, setShowSetVariableModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // New backend-aligned node modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showManualTaskModal, setShowManualTaskModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showUpdateMetadataModal, setShowUpdateMetadataModal] = useState(false);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [showLockDocumentModal, setShowLockDocumentModal] = useState(false);
  const [showUnlockDocumentModal, setShowUnlockDocumentModal] = useState(false);
  // Additional missing modals
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showErrorHandlerModal, setShowErrorHandlerModal] = useState(false);
  const [showGetContextModal, setShowGetContextModal] = useState(false);
  const [showMultiChoiceModal, setShowMultiChoiceModal] = useState(false);
  const [editingNodeData, setEditingNodeData] = useState<Node<WorkflowNodeData> | null>(null);
  const [nodeSearchQuery, setNodeSearchQuery] = useState('');

  // Computed flag to disable ReactFlow interactions when any modal is open
  const isAnyModalOpen = showStepModal || showDelayModal || showStampModal || showMoveDocumentModal ||
    showNotificationModal || showEmailModal || showConditionModal || showTriggerModal ||
    showApiCallModal || showSubWorkflowModal || showSetVariableModal ||
    showArchiveModal || showDeleteModal ||
    showReviewModal || showManualTaskModal || showApprovalModal || showSplitModal || showJoinModal ||
    showUpdateMetadataModal || showChangeStatusModal || showNewVersionModal ||
    showLockDocumentModal || showUnlockDocumentModal ||
    showScriptModal || showOcrModal || showCancelModal || showErrorHandlerModal || showGetContextModal || showMultiChoiceModal;

  // Workflow validation hook for connection validation and error detection
  const { errors: validationErrors, isValid: isWorkflowValid, canConnect, validateConnection, getNodeErrors } = useWorkflowValidation(nodes, edges);

  // Create edit handler function that can be used in node data
  const createEditHandler = useCallback((nodeId: string) => {
    return () => {
      setNodes((nds) => {
        const node = nds.find(n => n.id === nodeId);
        if (node) {
          // Route to correct modal based on node type
          switch (node.type) {
            case 'workflowStep':
            case 'firstStep':
              setEditingStepData(node);
              setShowStepModal(true);
              break;
            case 'approvalNode':
              setEditingNodeData(node);
              setShowApprovalModal(true);
              break;
            case 'delayNode':
              setEditingNodeData(node);
              setShowDelayModal(true);
              break;
            case 'stampNode':
              setEditingNodeData(node);
              setShowStampModal(true);
              break;
            case 'moveDocumentNode':
              setEditingNodeData(node);
              setShowMoveDocumentModal(true);
              break;
            case 'notificationNode':
              setEditingNodeData(node);
              setShowNotificationModal(true);
              break;
            case 'emailNode':
              setEditingNodeData(node);
              setShowEmailModal(true);
              break;
            case 'conditionalNode':
              setEditingNodeData(node);
              setShowConditionModal(true);
              break;
            case 'startNode':
            case 'triggerNode':
              setEditingNodeData(node);
              setShowTriggerModal(true);
              break;

            case 'apiCallNode':
              setEditingNodeData(node);
              setShowApiCallModal(true);
              break;
            case 'subWorkflowNode':
              setEditingNodeData(node);
              setShowSubWorkflowModal(true);
              break;
            case 'setVariableNode':
              setEditingNodeData(node);
              setShowSetVariableModal(true);
              break;
            case 'archiveNode':
              setEditingNodeData(node);
              setShowArchiveModal(true);
              break;
            // deleteNode has no config — terminal node
            // New backend-aligned node types
            case 'reviewNode':
              setEditingNodeData(node);
              setShowReviewModal(true);
              break;
            case 'manualTaskNode':
              setEditingNodeData(node);
              setShowManualTaskModal(true);
              break;
            case 'splitNode':
              setEditingNodeData(node);
              setShowSplitModal(true);
              break;
            case 'joinNode':
              setEditingNodeData(node);
              setShowJoinModal(true);
              break;
            case 'updateMetadataNode':
              setEditingNodeData(node);
              setShowUpdateMetadataModal(true);
              break;
            case 'changeStatusNode':
              setEditingNodeData(node);
              setShowChangeStatusModal(true);
              break;
            case 'newVersionNode':
              setEditingNodeData(node);
              setShowNewVersionModal(true);
              break;
            case 'lockDocumentNode':
              setEditingNodeData(node);
              setShowLockDocumentModal(true);
              break;
            case 'unlockDocumentNode':
              setEditingNodeData(node);
              setShowUnlockDocumentModal(true);
              break;
            case 'cancelNode':
              setEditingNodeData(node);
              setShowCancelModal(true);
              break;
            case 'errorHandlerNode':
              setEditingNodeData(node);
              setShowErrorHandlerModal(true);
              break;
            case 'getContextNode':
              setEditingNodeData(node);
              setShowGetContextModal(true);
              break;
            case 'scriptNode':
              setEditingNodeData(node);
              setShowScriptModal(true);
              break;
            case 'ocrNode':
              setEditingNodeData(node);
              setShowOcrModal(true);
              break;
            case 'multiChoiceNode':
              setEditingNodeData(node);
              setShowMultiChoiceModal(true);
              break;
            default:
              console.log('No modal for node type:', node.type);
          }
        }
        return nds;
      });
    };
  }, [setNodes]);

  // Validate nodes - check for disconnected nodes and unconnected outputs
  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];

    // Get all node IDs that have incoming connections (targets)
    const nodesWithIncoming = new Set(edges.map(e => e.target));
    // Get all node IDs that have outgoing connections (sources)
    const nodesWithOutgoing = new Set(edges.map(e => e.source));

    // Nodes that don't need incoming connections (they are start points)
    const noIncomingNeeded = ['startNode', 'triggerNode'];
    // Nodes that don't need outgoing connections (they are end points)
    const noOutgoingNeeded = ['finishNode', 'endSuccessNode', 'endFailureNode', 'triggerNode'];

    nodes.forEach(node => {
      // Skip start node - only needs outgoing
      if (node.type === 'startNode') {
        if (!nodesWithOutgoing.has(node.id)) {
          warnings.push('Start node has no outgoing connection');
        }
        return;
      }

      // Skip finish node - only needs incoming
      if (node.type === 'finishNode') {
        if (!nodesWithIncoming.has(node.id)) {
          warnings.push('Finish node has no incoming connection');
        }
        return;
      }

      // Skip trigger nodes entirely - they don't need any connections to be valid
      if (node.type === 'triggerNode') {
        return;
      }

      // Skip end nodes - only need incoming
      if (node.type === 'endSuccessNode' || node.type === 'endFailureNode') {
        if (!nodesWithIncoming.has(node.id)) {
          const nodeName = node.data.label || node.type;
          warnings.push(`"${nodeName}" has no incoming connection`);
        }
        return;
      }

      // Other nodes need both incoming and outgoing connections
      const nodeName = node.data.label || node.type;

      if (!nodesWithIncoming.has(node.id)) {
        warnings.push(`"${nodeName}" has no incoming connection`);
      }

      if (!nodesWithOutgoing.has(node.id)) {
        warnings.push(`"${nodeName}" has no outgoing connection`);
      }
    });

    return warnings;
  }, [nodes, edges]);

  // Load workflow if editing
  useEffect(() => {
    if (!workflowId) return;

    let isMounted = true;

    // Helper to load steps the old way (linear layout)
    const loadLegacySteps = (workflow: any) => {
      // Sort steps by order
      const sortedSteps = [...(workflow.steps || [])].sort((a: any, b: any) => a.stepOrder - b.stepOrder);

      const workflowNodes: Node[] = sortedSteps.map((step: any, index: number) => {
        const nodeId = `step-${step.id}`;

        // Use saved position if available
        const position = (step.positionX !== null && step.positionX !== undefined && step.positionY !== null && step.positionY !== undefined)
          ? { x: step.positionX, y: step.positionY }
          : { x: 250 + (index * 250), y: 200 };

        // Process assignments
        const assignmentsWithEntities = (step.assignments || []).map((a: any) => {
          let entity = null;
          let assigneeType: 'USER' | 'ROLE' | 'GROUP' = 'USER';
          if (a.user) { assigneeType = 'USER'; entity = a.user; }
          else if (a.role) { assigneeType = 'ROLE'; entity = a.role; }
          else if (a.group) { assigneeType = 'GROUP'; entity = a.group; }

          return {
            assigneeType,
            assigneeId: entity?.id || '',
            entity: entity,
            canEdit: a.canEdit ?? true,
          };
        });

        // Determine the correct React Flow node type based on step data
        let nodeType = 'workflowStep'; // Default
        let nodeData: any = {};

        // Parse nodeConfigJson if available
        let nodeConfig: any = {};
        if (step.nodeConfigJson) {
          try {
            nodeConfig = JSON.parse(step.nodeConfigJson);
          } catch (e) {
            console.error('Failed to parse nodeConfigJson:', e);
          }
        }

        // Detect node type from step name, nodeType field, or nodeConfigJson content
        const stepNameLower = (step.name || '').toLowerCase();

        if (nodeConfig.triggerType || stepNameLower === 'trigger' || stepNameLower.includes('trigger')) {
          nodeType = 'triggerNode';
          nodeData = {
            triggerConfig: {
              triggerType: nodeConfig.triggerType,
              folderId: nodeConfig.triggerFolderId,
              folderName: nodeConfig.triggerFolderName,
              categoryId: nodeConfig.triggerCategoryId,
              categoryName: nodeConfig.triggerCategoryName,
            }
          };
        } else if (nodeConfig.conditionGroups || stepNameLower === 'condition' || stepNameLower.includes('condition')) {
          nodeType = 'conditionalNode';
          nodeData = {
            conditionGroups: nodeConfig.conditionGroups || [],
            conditionExpression: nodeConfig.conditionExpression || step.conditionExpression || '',
          };
        } else if (nodeConfig.delayDuration !== undefined || stepNameLower === 'delay' || stepNameLower.includes('delay')) {
          nodeType = 'delayNode';
          nodeData = {
            delayDuration: nodeConfig.delayDuration,
            delayUnit: nodeConfig.delayUnit || 'hours',
          };
        } else if (nodeConfig.targetFolderId || stepNameLower === 'move document' || stepNameLower.includes('move')) {
          nodeType = 'moveDocumentNode';
          nodeData = {
            destinationFolderId: nodeConfig.targetFolderId,
            destinationFolderName: nodeConfig.targetFolderName,
          };
        } else if (stepNameLower === 'notification' || stepNameLower.includes('notification')) {
          nodeType = 'notificationNode';
          nodeData = {
            recipients: nodeConfig.recipients || [],
            notificationTitle: nodeConfig.notificationTitle || '',
            notificationMessage: nodeConfig.notificationMessage || '',
          };
        } else if (stepNameLower === 'email' || stepNameLower.includes('email')) {
          nodeType = 'emailNode';
          nodeData = {
            emailRecipients: nodeConfig.emailRecipients || [],
            emailSubject: nodeConfig.emailSubject || '',
            emailBody: nodeConfig.emailBody || '',
            attachDocument: nodeConfig.attachDocument || false,
            ccRecipients: nodeConfig.ccRecipients || [],
          };
        } else if (stepNameLower === 'stamp' || stepNameLower.includes('stamp')) {
          nodeType = 'stampNode';
          nodeData = {
            stampId: nodeConfig.stampId || step.stampId,
            stampName: nodeConfig.stampName,
          };
        }

        return {
          id: nodeId,
          type: nodeType,
          position: position,
          data: {
            id: step.id,
            label: step.name,
            description: step.description,
            expirationDays: step.expirationDays,
            targetFolderId: step.targetFolderId,
            targetFolderName: step.targetFolderName,
            isRequired: step.isRequired ?? true,
            allowParallelApproval: step.allowParallelApproval ?? false,
            minApprovalsNeeded: step.minApprovalsNeeded,
            priority: step.priority || 'MEDIUM',
            assignments: assignmentsWithEntities,
            nodeType: step.nodeType,
            nodeConfig: step.nodeConfigJson,
            stepId: step.id, // Ensure stepId is available
            // Extract form fields and shared config from nodeConfigJson
            formFields: nodeConfig.formFields || [],
            rejectFormFields: nodeConfig.rejectFormFields || [],
            instructions: nodeConfig.instructions || '',
            notificationSubject: nodeConfig.notificationSubject || '',
            ...nodeData, // Spread node-specific data
            onEdit: createEditHandler(nodeId),
            onDelete: () => handleDeleteNode(nodeId),
          },
        };
      });

      // Add Start and Finish nodes
      const startNode: Node = {
        id: 'start-node',
        type: 'startNode',
        position: { x: 50, y: 200 },
        data: {},
      };

      // Check if nodes have custom positions (indicating visual design was used)
      const hasCustomPositions = workflowNodes.some(n =>
        n.position.y !== 200 || // Not on default Y line
        (workflowNodes.indexOf(n) > 0 && Math.abs(n.position.x - workflowNodes[workflowNodes.indexOf(n) - 1].position.x) > 300) // Gaps in X
      );

      const finishNode: Node = {
        id: 'finish-node',
        type: 'finishNode',
        position: hasCustomPositions
          ? { x: Math.max(...workflowNodes.map(n => n.position.x)) + 300, y: Math.min(...workflowNodes.map(n => n.position.y)) }
          : { x: 250 + (workflowNodes.length * 250) + 200, y: 200 },
        data: {},
      };

      setNodes([startNode, ...workflowNodes, finishNode]);

      // Re-create edges
      const workflowEdges: Edge[] = [];

      if (hasCustomPositions) {
        // For visually designed workflows without stored edges:
        // Only create start->first edge, let user reconnect the rest
        // This prevents destroying their custom layout
        if (workflowNodes.length > 0) {
          // Find the node closest to start based on y=200 or highest y position
          const firstNode = workflowNodes.reduce((prev, curr) =>
            Math.abs(curr.position.y - 200) < Math.abs(prev.position.y - 200) ? curr : prev
          );
          workflowEdges.push({ id: 'edge-start-first', source: 'start-node', target: firstNode.id, type: 'default' });
        }
        console.log('Legacy workflow has custom positions. Edges must be reconnected manually and saved.');
      } else {
        // Linear layout - create sequential edges
        if (workflowNodes.length > 0) {
          workflowEdges.push({ id: 'edge-start-first', source: 'start-node', target: workflowNodes[0].id, type: 'default' });
          for (let i = 0; i < workflowNodes.length - 1; i++) {
            workflowEdges.push({ id: `edge-${workflowNodes[i].id}-${workflowNodes[i + 1].id}`, source: workflowNodes[i].id, target: workflowNodes[i + 1].id, type: 'default' });
          }
          workflowEdges.push({ id: 'edge-last-finish', source: workflowNodes[workflowNodes.length - 1].id, target: 'finish-node', type: 'default' });
        } else {
          workflowEdges.push({ id: 'edge-start-finish', source: 'start-node', target: 'finish-node', type: 'default' });
        }
      }
      setEdges(workflowEdges);
    };

    const loadWorkflow = async () => {
      try {
        const [workflow, triggers] = await Promise.all([
          workflowAdminService.getWorkflow(Number(workflowId)),
          workflowAdminService.getWorkflowTriggers(Number(workflowId)),
        ]);

        if (!isMounted) return;

        setWorkflowName(workflow.name || '');
        setWorkflowDescription(workflow.description || '');
        setIsActive(workflow.isActive || false);

        // Load admins
        if (workflow.admins && workflow.admins.length > 0) {
          setWorkflowAdmins(workflow.admins.map((admin: any) => ({
            userId: admin.user.id,
            user: admin.user,
          })));
        }

        // Load triggers
        if (triggers && triggers.length > 0) {
          const activeTrigger = triggers.find((t: any) => t.isActive) || triggers[0];
          if (activeTrigger) {
            if (activeTrigger.triggerType === 'FOLDER') {
              setTriggerType('FOLDER');
              setFolderTriggerId(activeTrigger.id!);
              setFolderTriggerFolderId(activeTrigger.folderId || null);
              setFolderTriggerFolderName(activeTrigger.folderName || '');
            } else if (activeTrigger.triggerType === 'MODEL') {
              setTriggerType('MODEL');
              setModelTriggerId(activeTrigger.id!);
              setModelTriggerCategoryId(activeTrigger.categoryId || null);
              setModelTriggerCategoryName(activeTrigger.categoryName || '');
            }
          }
        }

        // Convert workflow steps to nodes
        if (workflow.workflowDefinitionJson) {
          // Restore from JSON if available (New Way)
          try {
            const definition = JSON.parse(workflow.workflowDefinitionJson);
            if (definition.nodes && definition.edges) {
              setNodes(definition.nodes.map((n: Node) => ({
                ...n,
                data: {
                  ...n.data,
                  onEdit: createEditHandler(n.id),
                  onDelete: () => handleDeleteNode(n.id)
                }
              })));
              setEdges(definition.edges);
            } else {
              loadLegacySteps(workflow);
            }
          } catch (e) {
            console.error("Failed to parse workflow definition JSON", e);
            loadLegacySteps(workflow);
          }
        } else {
          loadLegacySteps(workflow);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to load workflow:', error);
        showError('Failed to load workflow', 'Please try again later');
      } finally {
        if (isMounted) {
          setIsLoadingWorkflow(false);
        }
      }
    };

    loadWorkflow();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]); // Only depend on workflowId

  // ReactFlow refs for Drag and Drop
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const label = event.dataTransfer.getData('application/reactflow/label');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeId = `node_${Date.now()}`;
      // Get backend node type from mapping
      const backendNodeType = nodeTypeToBackendType[type] || 'APPROVAL';

      const newNode: Node = {
        id: nodeId,
        type,
        position,
        data: {
          label: label,
          nodeType: backendNodeType, // Backend node type for API
          onEdit: createEditHandler(nodeId),
          onDelete: () => {
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
          },
        },
      };

      setNodes((nds) => nds.concat(newNode));

      // Open appropriate modal based on node type
      switch (type) {
        case 'workflowStep':
        case 'firstStep':
          setEditingStepData(newNode);
          setShowStepModal(true);
          break;
        case 'approvalNode':
          setEditingNodeData(newNode);
          setShowApprovalModal(true);
          break;
        case 'delayNode':
          setEditingNodeData(newNode);
          setShowDelayModal(true);
          break;
        case 'stampNode':
          setEditingNodeData(newNode);
          setShowStampModal(true);
          break;
        case 'moveDocumentNode':
          setEditingNodeData(newNode);
          setShowMoveDocumentModal(true);
          break;
        case 'notificationNode':
          setEditingNodeData(newNode);
          setShowNotificationModal(true);
          break;
        case 'emailNode':
          setEditingNodeData(newNode);
          setShowEmailModal(true);
          break;
        case 'conditionalNode':
          setEditingNodeData(newNode);
          setShowConditionModal(true);
          break;
        case 'triggerNode':
          setEditingNodeData(newNode);
          setShowTriggerModal(true);
          break;

        case 'apiCallNode':
          setEditingNodeData(newNode);
          setShowApiCallModal(true);
          break;
        case 'subWorkflowNode':
          setEditingNodeData(newNode);
          setShowSubWorkflowModal(true);
          break;
        case 'setVariableNode':
          setEditingNodeData(newNode);
          setShowSetVariableModal(true);
          break;
        case 'archiveNode':
          setEditingNodeData(newNode);
          setShowArchiveModal(true);
          break;
        // deleteNode has no config modal — it's a terminal node
        // New backend-aligned node types
        case 'reviewNode':
          setEditingNodeData(newNode);
          setShowReviewModal(true);
          break;
        case 'manualTaskNode':
          setEditingNodeData(newNode);
          setShowManualTaskModal(true);
          break;
        case 'splitNode':
          setEditingNodeData(newNode);
          setShowSplitModal(true);
          break;
        case 'joinNode':
          setEditingNodeData(newNode);
          setShowJoinModal(true);
          break;
        case 'updateMetadataNode':
          setEditingNodeData(newNode);
          setShowUpdateMetadataModal(true);
          break;
        case 'changeStatusNode':
          setEditingNodeData(newNode);
          setShowChangeStatusModal(true);
          break;
        case 'newVersionNode':
          setEditingNodeData(newNode);
          setShowNewVersionModal(true);
          break;
        case 'lockDocumentNode':
          setEditingNodeData(newNode);
          setShowLockDocumentModal(true);
          break;
        case 'unlockDocumentNode':
          setEditingNodeData(newNode);
          setShowUnlockDocumentModal(true);
          break;
        case 'cancelNode':
          setEditingNodeData(newNode);
          setShowCancelModal(true);
          break;
        case 'errorHandlerNode':
          setEditingNodeData(newNode);
          setShowErrorHandlerModal(true);
          break;
        case 'getContextNode':
          setEditingNodeData(newNode);
          setShowGetContextModal(true);
          break;
        case 'scriptNode':
          setEditingNodeData(newNode);
          setShowScriptModal(true);
          break;
        case 'ocrNode':
          setEditingNodeData(newNode);
          setShowOcrModal(true);
          break;
      }
    },
    [setNodes, setEdges, reactFlowInstance, createEditHandler]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      // Skip validation for "output already connected" - we'll replace the edge
      // But still check for cycles and other structural issues
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      // Basic validation
      if (!params.source || !params.target) return;
      if (params.source === params.target) {
        showError('Invalid Connection', 'Self-loops are not allowed');
        return;
      }

      // Check if target can receive connections
      if (sourceNode?.type === 'finishNode' || sourceNode?.type === 'endSuccessNode' || sourceNode?.type === 'endFailureNode') {
        showError('Invalid Connection', 'End nodes cannot have outgoing connections');
        return;
      }
      if (targetNode?.type === 'startNode' || targetNode?.type === 'triggerNode') {
        showError('Invalid Connection', 'Start nodes cannot have incoming connections');
        return;
      }

      setEdges((eds) => {
        // Remove existing edge from the same source+sourceHandle (auto-replace behavior)
        const filteredEdges = eds.filter(e => {
          // Remove start-finish if connecting from/to those nodes
          if (e.id === 'edge-start-finish' && (params.source === 'start-node' || params.target === 'finish-node')) {
            return false;
          }
          // Remove existing edge from same source handle to allow replacement
          if (e.source === params.source &&
            (e.sourceHandle === params.sourceHandle || (!e.sourceHandle && !params.sourceHandle))) {
            return false;
          }
          return true;
        });
        return addEdge({ ...params, type: 'default' }, filteredEdges);
      });
    },
    [setEdges, showError, nodes]
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

  // Handle saving workflow

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


  const handleNodeClick = useCallback((_: any, node: Node) => {
    // Don't open modal on single click
  }, []);

  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    createEditHandler(node.id)();
  }, [createEditHandler]);

  const handleEditStep = useCallback((node: Node) => {
    setEditingStepData(node);
    setShowStepModal(true);
  }, []);

  // Handle edge deletion and add step from custom edge component
  useEffect(() => {
    const handleDeleteEdge = (event: CustomEvent<{ edgeId: string }>) => {
      const edgeId = event.detail.edgeId;
      // Allow deleting any edge - validation will catch issues at save time
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    };

    const handleAddStepToEdge = (event: CustomEvent<{ edgeId: string }>) => {
      const edgeId = event.detail.edgeId;
      const edge = edges.find(e => e.id === edgeId);
      if (edge) {
        // Create a new approval node between the edge's source and target
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        const nodeId = `node_${Date.now()}`;
        const newNode: Node = {
          id: nodeId,
          type: 'approvalNode',
          position: {
            x: sourceNode && targetNode
              ? (sourceNode.position.x + targetNode.position.x) / 2
              : (sourceNode?.position.x || 0) + 200,
            y: sourceNode && targetNode
              ? (sourceNode.position.y + targetNode.position.y) / 2
              : (sourceNode?.position.y || 0),
          },
          data: {
            label: `Approval ${nodes.filter(n => n.type === 'approvalNode').length + 1}`,
            description: '',
            assignments: [],
            assignmentEntities: [],
            approvalPolicy: 'ANY',
            rejectPolicy: 'ANY_REJECTS',
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
            { id: `edge-${nodeId}-${edge.target}`, source: nodeId, sourceHandle: 'approved', target: edge.target, type: 'default' },
          ];
        });

        // Open approval modal to configure the new node
        setEditingNodeData(newNode);
        setShowApprovalModal(true);
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

    // Only approval type steps need assignments
    // Include Review and Manual Task as they also require human assignment
    const approvalStepTypes = ['workflowStep', 'firstStep', 'approvalNode', 'reviewNode', 'manualTaskNode'];
    const approvalSteps = workflowSteps.filter(step => approvalStepTypes.includes(step.type || ''));

    // Validate all APPROVAL/REVIEW/MANUAL steps have at least one assignment
    const stepsWithoutAssignments = approvalSteps.filter(step => {
      const assignments = Array.isArray(step.data.assignments) ? step.data.assignments : [];
      return assignments.length === 0;
    });

    if (stepsWithoutAssignments.length > 0) {
      const stepNames = stepsWithoutAssignments.map(step => step.data.label || 'Unnamed step').join(', ');
      showError('Validation Error', `The following steps require at least one assigned user/group: ${stepNames}`);
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

    // NEW: Validate that all nodes have their source (output) points connected
    // Every node except finish nodes and trigger nodes must have at least one outgoing edge
    const endNodeTypes = ['finishNode', 'endSuccessNode', 'endFailureNode', 'triggerNode', 'cancelNode', 'endNode', 'deleteNode'];
    const nodesRequiringOutput = nodes.filter(n =>
      !endNodeTypes.includes(n.type || '') && n.id !== 'finish-node'
    );

    const nodesWithoutOutput = nodesRequiringOutput.filter(node => {
      const hasOutgoingEdge = edges.some(edge => edge.source === node.id);
      return !hasOutgoingEdge;
    });

    if (nodesWithoutOutput.length > 0) {
      const nodeNames = nodesWithoutOutput.map(n => n.data.label || n.type || 'Unnamed node').join(', ');
      showError('Validation Error', `All nodes must have their output connected. Please connect: ${nodeNames}`);
      return;
    }

    // Additional check: All non-terminal nodes must eventually lead to a terminal node
    // Terminal nodes include: finish-node, cancelNode, endSuccessNode, endFailureNode
    const terminalNodeTypes = ['finishNode', 'endSuccessNode', 'endFailureNode', 'cancelNode', 'endNode', 'deleteNode'];
    const terminalNodeIds = nodes
      .filter(n => terminalNodeTypes.includes(n.type || '') || n.id === 'finish-node')
      .map(n => n.id);

    const canReachTerminal = new Set<string>(terminalNodeIds);
    const reverseQueue: string[] = [...terminalNodeIds];

    while (reverseQueue.length > 0) {
      const currentNodeId = reverseQueue.shift()!;
      edges.forEach(edge => {
        if (edge.target === currentNodeId && !canReachTerminal.has(edge.source)) {
          canReachTerminal.add(edge.source);
          reverseQueue.push(edge.source);
        }
      });
    }

    // Find nodes that are reachable from start but cannot reach any terminal node (dead ends)
    const deadEndNodes = nodes.filter(n =>
      visited.has(n.id) && !canReachTerminal.has(n.id) && !endNodeTypes.includes(n.type || '')
    );

    if (deadEndNodes.length > 0) {
      const nodeNames = deadEndNodes.map(n => n.data.label || n.type || 'Unnamed node').join(', ');
      showError('Validation Error', `Some nodes do not lead to a terminal node (End or Cancel). Please connect: ${nodeNames}`);
      return;
    }

    // Validate that all human task form fields have variable mappings
    const humanTaskNodeTypes = ['approvalNode', 'reviewNode', 'manualTaskNode', 'workflowStep', 'firstStep'];
    const humanTaskNodes = nodes.filter(n => humanTaskNodeTypes.includes(n.type || ''));
    const unmappedNodes: string[] = [];
    for (const node of humanTaskNodes) {
      const formFields: any[] = node.data.formFields || [];
      const unmappedFields = formFields.filter((f: any) => !f.mappedVariableKey);
      if (unmappedFields.length > 0) {
        unmappedNodes.push(node.data.label || 'Unnamed step');
      }
    }
    if (unmappedNodes.length > 0) {
      showError('Validation Error', `The following steps have form fields without variable mapping: ${unmappedNodes.join(', ')}. Every form field must be mapped to a variable.`);
      return;
    }

    setIsSaving(true);
    try {
      // Build steps array with proper ordering based on edges
      const stepOrderMap = new Map<string, number>();
      const inDegree = new Map<string, number>();

      workflowSteps.forEach(node => inDegree.set(node.id, 0));

      edges.forEach(edge => {
        if (workflowSteps.some(n => n.id === edge.target)) {
          inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
        }
      });

      // Find steps with no incoming edges from other steps (connected from start)
      const sortQueue: string[] = [];
      workflowSteps.forEach(node => {
        const incomingFromSteps = edges.filter(e =>
          e.target === node.id && workflowSteps.some(n => n.id === e.source)
        ).length;
        if (incomingFromSteps === 0) {
          sortQueue.push(node.id);
        }
      });

      let order = 1;
      while (sortQueue.length > 0) {
        const nodeId = sortQueue.shift()!;
        stepOrderMap.set(nodeId, order++);

        // Find outgoing edges to other workflow steps
        edges.forEach(edge => {
          if (edge.source === nodeId) {
            const targetIsStep = workflowSteps.some(n => n.id === edge.target);
            if (targetIsStep) {
              const targetInDegree = (inDegree.get(edge.target) || 0) - 1;
              inDegree.set(edge.target, targetInDegree);
              if (targetInDegree === 0) {
                sortQueue.push(edge.target);
              }
            }
          }
        });
      }

      // Handle cycles or disconnected components - assign remaining steps arbitrary order
      workflowSteps.forEach((node, index) => {
        if (!stepOrderMap.has(node.id)) {
          stepOrderMap.set(node.id, order++);
        }
      });

      const steps = workflowSteps.map((node) => {
        const stepOrder = stepOrderMap.get(node.id) || 1;
        const assignments: CreateStepAssignmentRequest[] = (Array.isArray(node.data.assignments) ? node.data.assignments : []).map((a: any) => ({
          assigneeType: a.assigneeType as 'USER' | 'ROLE' | 'GROUP',
          assigneeId: a.assigneeId as string,
          canEdit: (a.canEdit as boolean) ?? true,
        }));

        // Build node config json from various node-specific data
        let nodeConfigJson: string | undefined = undefined;
        const configData: Record<string, any> = {};

        // For CONDITION nodes - include conditionGroups
        if (node.data.conditionGroups) {
          configData.conditionGroups = node.data.conditionGroups;
          configData.conditionExpression = node.data.conditionExpression;
        }

        // For DELAY nodes - include delay config
        if (node.data.delayDuration !== undefined) {
          configData.delayDuration = node.data.delayDuration;
          configData.delayUnit = node.data.delayUnit || 'hours';
        }

        // For MOVE_DOCUMENT nodes - include target folder
        if (node.data.targetFolderId) {
          configData.targetFolderId = node.data.targetFolderId;
          configData.targetFolderName = node.data.targetFolderName;
        }

        // For TRIGGER nodes - include trigger config
        if (node.data.triggerType) {
          configData.triggerType = node.data.triggerType;
          configData.triggerFolderId = node.data.triggerFolderId;
          configData.triggerFolderName = node.data.triggerFolderName;
          configData.triggerCategoryId = node.data.triggerCategoryId;
          configData.triggerCategoryName = node.data.triggerCategoryName;
        }

        // For triggerConfig structure (from loaded nodes)
        if (node.data.triggerConfig) {
          configData.triggerType = node.data.triggerConfig.triggerType;
          configData.triggerFolderId = node.data.triggerConfig.folderId;
          configData.triggerFolderName = node.data.triggerConfig.folderName;
          configData.triggerCategoryId = node.data.triggerConfig.categoryId;
          configData.triggerCategoryName = node.data.triggerConfig.categoryName;
        }

        // For NOTIFICATION nodes - include recipients
        if (node.data.recipients && node.data.recipients.length > 0) {
          configData.recipients = node.data.recipients;
          configData.notificationTitle = node.data.notificationTitle;
          configData.notificationMessage = node.data.notificationMessage;
          configData.subject = node.data.notificationSubject; // Review/Manual tasks also use this
        }

        // For Review and Manual Task special fields
        if (node.data.allowComments !== undefined) configData.allowComments = node.data.allowComments;
        if (node.data.instructions) configData.instructions = node.data.instructions;
        if (node.data.notificationSubject) configData.notificationSubject = node.data.notificationSubject;

        // For human task nodes - include form fields
        if (node.data.formFields && Array.isArray(node.data.formFields) && node.data.formFields.length > 0) {
          configData.formFields = node.data.formFields;
        }
        if (node.data.rejectFormFields && Array.isArray(node.data.rejectFormFields) && node.data.rejectFormFields.length > 0) {
          configData.rejectFormFields = node.data.rejectFormFields;
        }

        // For EMAIL nodes - include email recipients
        if (node.data.emailRecipients && node.data.emailRecipients.length > 0) {
          configData.emailRecipients = node.data.emailRecipients;
          configData.ccRecipients = node.data.ccRecipients;
          configData.emailSubject = node.data.emailSubject;
          configData.emailBody = node.data.emailBody;
          configData.attachDocument = node.data.attachDocument;
        }

        // For STAMP nodes - include stamp config
        if (node.data.stampId) {
          configData.stampId = node.data.stampId;
          configData.stampName = node.data.stampName;
          configData.stampPreviewUrl = node.data.stampPreviewUrl;
        }

        // For MOVE_DOCUMENT nodes - include destination folder (from modal)
        if (node.data.destinationFolderId) {
          configData.targetFolderId = node.data.destinationFolderId;
          configData.targetFolderName = node.data.destinationFolderName;
          configData.targetFolderPath = node.data.destinationFolderPath;
        }

        // Include any existing nodeConfig as fallback
        if (node.data.nodeConfig) {
          Object.assign(configData, typeof node.data.nodeConfig === 'string'
            ? JSON.parse(node.data.nodeConfig)
            : node.data.nodeConfig);
        }

        // Only serialize if there's config data
        if (Object.keys(configData).length > 0) {
          nodeConfigJson = JSON.stringify(configData);
        }

        return {
          id: node.data.id, // Should be present if editing
          nodeId: node.id, // Frontend node ID for graph-based routing
          name: (node.data.label as string) || `Step ${stepOrder}`,
          description: (node.data.description as string) || '',
          stepOrder: stepOrder,
          expirationDays: (node.data.expirationDays as number) || undefined,
          onCompleteAction: 'NONE', // Default for now
          targetFolderId: (node.data.targetFolderId as number) || undefined,
          targetFolderName: (node.data.targetFolderName as string) || undefined,
          isRequired: (node.data.isRequired as boolean) ?? true,
          allowParallelApproval: (node.data.allowParallelApproval as boolean) ?? false,
          minApprovalsNeeded: (node.data.minApprovalsNeeded as number) || undefined,
          assignments: assignments,
          nodeType: (node.data.nodeType as string) || nodeTypeToBackendType[node.type || ''] || 'APPROVAL',
          nodeConfigJson: nodeConfigJson,
          // Save position
          positionX: Math.round(node.position.x),
          positionY: Math.round(node.position.y),
        };
      });

      // Convert admins to request format
      const admins = workflowAdmins.map(admin => admin.userId);

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

      // Prepare Workflow Definition JSON (Visual Graph)
      // Keep entity objects for edit mode - remove only non-serializable functions
      const cleanedNodes = nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          // Remove functions (can't be serialized)
          onEdit: undefined,
          onDelete: undefined,
          // Keep assignmentEntities and escalationTargetEntities for edit mode
        }
      }));

      const workflowDefinition = {
        nodes: cleanedNodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      const commonPayload: CreateWorkflowRequest | UpdateWorkflowRequest = {
        name: workflowName,
        description: workflowDescription,
        isActive,
        steps,
        admins: admins.length > 0 ? admins : undefined,
        trigger,
        workflowDefinitionJson: JSON.stringify(workflowDefinition)
      };

      if (workflowId) {
        // Update existing workflow
        const updatedWorkflow = await workflowAdminService.updateWorkflow(Number(workflowId), commonPayload as UpdateWorkflowRequest);

        showSuccess('Workflow Updated', 'Workflow updated successfully');
        // Navigate directly to workflow list (no apply changes dialog)
        router.push('/admin/workflow');
      } else {
        // Create new workflow
        const newWorkflow = await workflowAdminService.createWorkflow(commonPayload as CreateWorkflowRequest);

        // Save local variables to the newly created workflow
        if (localVariables && localVariables.length > 0 && newWorkflow.id) {
          for (const v of localVariables) {
            try {
              await apiClient.post(`/api/v1/workflows/${newWorkflow.id}/variables`, {
                workflowId: newWorkflow.id,
                variableKey: v.variableKey,
                label: v.label,
                type: v.type,
                defaultValue: v.defaultValue,
              });
            } catch (varErr: any) {
              console.warn(`Failed to save variable '${v.label}':`, varErr);
            }
          }
        }

        showSuccess('Workflow Created', 'Workflow created successfully');
        // Route to edit mode of the new workflow
        router.push(`/admin/workflow/designer?id=${newWorkflow.id}`);
      }

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
    localVariables,
    router,
    showSuccess,
    showError,
  ]);

  const proOptions = { hideAttribution: true };

  // Show loading indicator while workflow is being fetched
  if (isLoadingWorkflow) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
      <div className="flex-none border-b px-4 py-2 bg-white flex items-center justify-between z-10">
        <TabsList>
          <TabsTrigger value="designer">Designer</TabsTrigger>
          {/* Only show monitoring tabs when editing an existing workflow */}
          {workflowId && (
            <>
              <TabsTrigger value="instances">Instances</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </>
          )}
        </TabsList>
      </div>

      <TabsContent value="designer" className="flex-1 overflow-hidden data-[state=inactive]:hidden mt-0 border-0 p-0" forceMount>
        <div className="h-full flex flex-col">
          <div className="flex-1 flex overflow-hidden">
            {/* Combined Sidebar with Tabs */}
            <Card className="w-80 border-r rounded-none flex flex-col">
              {/* Tab Buttons */}
              <div className="flex border-b">
                <button
                  onClick={() => setSidebarTab('properties')}
                  className={`flex-1 flex items-center justify-center p-3 border-b-2 transition-colors ${sidebarTab === 'properties'
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium text-sm">Properties</span>
                  </div>
                </button>
                <button
                  onClick={() => setSidebarTab('nodes')}
                  className={`flex-1 flex items-center justify-center p-3 border-b-2 transition-colors ${sidebarTab === 'nodes'
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium text-sm">Nodes</span>
                  </div>
                </button>
                <button
                  onClick={() => setSidebarTab('variables')}
                  className={`flex-1 flex items-center justify-center p-3 border-b-2 transition-colors ${sidebarTab === 'variables'
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium text-sm">Variables</span>
                  </div>
                </button>
                <div className="p-2 border-l flex items-center">
                  {workflowId ? (
                    // Editing existing workflow - show dropdown with Save as New / Update
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" disabled={isSaving}>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                          <ChevronRight className="h-3 w-3 ml-1 rotate-90" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={async () => {
                            // Check for active instances before allowing update
                            try {
                              const { activeCount } = await workflowAdminService.getActiveInstanceCount(Number(workflowId));
                              if (activeCount > 0) {
                                showError(
                                  'Cannot Update',
                                  `This workflow has ${activeCount} active instance(s) in progress. Please wait for all instances to complete before updating.`
                                );
                                return;
                              }
                              // No active instances, proceed with update
                              handleSave();
                            } catch (error) {
                              console.error('Failed to check active instances:', error);
                              // Allow update if check fails (graceful degradation)
                              handleSave();
                            }
                          }}
                          disabled={isSaving}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Update Workflow
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    // Creating new workflow - single save button
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  )}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {sidebarTab === 'properties' ? (
                  <div className="p-4 space-y-4">
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                onClick={() => {
                                  setWorkflowAdmins(workflowAdmins.filter((_, i) => i !== index));
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                ) : sidebarTab === 'nodes' ? (
                  /* Add Nodes Tab Content */
                  <NodesPalette
                    searchQuery={nodeSearchQuery}
                    onSearchChange={setNodeSearchQuery}
                  />
                ) : (
                  /* Variables Tab Content */
                  <VariablesPanel
                    workflowId={workflowId ? Number(workflowId) : null}
                    localVariables={localVariables}
                    onLocalVariablesChange={setLocalVariables}
                  />
                )}
              </div>
            </Card>

            <ReactFlowProvider>
              <div className="flex-1 flex h-full overflow-hidden">
                {/* Main Canvas */}
                <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={handleNodeClick}
                    onNodeDoubleClick={handleNodeDoubleClick}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    connectionMode={ConnectionMode.Strict}
                    connectionLineType={ConnectionLineType.Bezier}
                    connectionRadius={30}
                    isValidConnection={canConnect}
                    fitView
                    attributionPosition="bottom-right"
                    className="bg-gray-50"
                    proOptions={proOptions}
                    connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 4, strokeDasharray: '5,5' }}
                    defaultEdgeOptions={{
                      type: 'default',
                      animated: false,
                      style: { stroke: '#3b82f6', strokeWidth: 4 },
                    }}
                    // Disable interactions when any modal is open to prevent events leaking through
                    nodesDraggable={!isAnyModalOpen}
                    nodesConnectable={!isAnyModalOpen}
                    elementsSelectable={!isAnyModalOpen}
                    panOnDrag={!isAnyModalOpen}
                    zoomOnScroll={!isAnyModalOpen}
                  >
                    <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                    <Controls />
                    <MiniMap />
                  </ReactFlow>
                  {/* Validation Panel */}
                  <ValidationPanel
                    errors={validationErrors}
                    isValid={isWorkflowValid}
                    onNodeClick={(nodeId) => {
                      const node = nodes.find(n => n.id === nodeId);
                      if (node && reactFlowInstance) {
                        reactFlowInstance.setCenter(node.position.x + 100, node.position.y + 50, { zoom: 1.5, duration: 500 });
                      }
                    }}
                  />
                </div>
              </div>
            </ReactFlowProvider>
          </div >

          {/* Step Configuration Modal */}
          {
            editingStepData && (
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
            )
          }

          {/* Folder Picker Modal */}
          {
            showFolderPicker && (
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
            )
          }

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

          {/* Node Configuration Modals */}
          {
            editingNodeData && (
              <>
                <DelayNodeModal
                  isOpen={showDelayModal}
                  onClose={() => {
                    setShowDelayModal(false);
                    setEditingNodeData(null);
                  }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === editingNodeData.id
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      )
                    );
                    setShowDelayModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <StampNodeModal
                  isOpen={showStampModal}
                  onClose={() => {
                    setShowStampModal(false);
                    setEditingNodeData(null);
                  }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === editingNodeData.id
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      )
                    );
                    setShowStampModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <MoveDocumentNodeModal
                  isOpen={showMoveDocumentModal}
                  onClose={() => {
                    setShowMoveDocumentModal(false);
                    setEditingNodeData(null);
                  }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === editingNodeData.id
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      )
                    );
                    setShowMoveDocumentModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <NotificationNodeModal
                  isOpen={showNotificationModal}
                  onClose={() => {
                    setShowNotificationModal(false);
                    setEditingNodeData(null);
                  }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === editingNodeData.id
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      )
                    );
                    setShowNotificationModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <EmailNodeModal
                  isOpen={showEmailModal}
                  onClose={() => {
                    setShowEmailModal(false);
                    setEditingNodeData(null);
                  }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === editingNodeData.id
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      )
                    );
                    setShowEmailModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <ConditionNodeModal
                  isOpen={showConditionModal}
                  onClose={() => {
                    setShowConditionModal(false);
                    setEditingNodeData(null);
                  }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === editingNodeData.id
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      )
                    );
                    setShowConditionModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <TriggerNodeModal
                  isOpen={showTriggerModal}
                  onClose={() => {
                    setShowTriggerModal(false);
                    setEditingNodeData(null);
                  }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === editingNodeData.id
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      )
                    );
                    setShowTriggerModal(false);
                    setEditingNodeData(null);
                  }}
                />



                <ApiCallNodeModal
                  isOpen={showApiCallModal}
                  onClose={() => {
                    setShowApiCallModal(false);
                    setEditingNodeData(null);
                  }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === editingNodeData.id
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      )
                    );
                    setShowApiCallModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <SubWorkflowNodeModal
                  isOpen={showSubWorkflowModal}
                  onClose={() => {
                    setShowSubWorkflowModal(false);
                    setEditingNodeData(null);
                  }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === editingNodeData.id
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      )
                    );
                    setShowSubWorkflowModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <SetVariableNodeModal
                  isOpen={showSetVariableModal}
                  onClose={() => {
                    setShowSetVariableModal(false);
                    setEditingNodeData(null);
                  }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === editingNodeData.id
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      )
                    );
                    setShowSetVariableModal(false);
                    setEditingNodeData(null);
                  }}
                />



                <ArchiveNodeModal
                  isOpen={showArchiveModal}
                  onClose={() => {
                    setShowArchiveModal(false);
                    setEditingNodeData(null);
                  }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === editingNodeData.id
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      )
                    );
                    setShowArchiveModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <DeleteNodeModal
                  isOpen={showDeleteModal}
                  onClose={() => {
                    setShowDeleteModal(false);
                    setEditingNodeData(null);
                  }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === editingNodeData.id
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      )
                    );
                    setShowDeleteModal(false);
                    setEditingNodeData(null);
                  }}
                />

                {/* New backend-aligned node modals */}
                <ReviewNodeModal
                  isOpen={showReviewModal}
                  onClose={() => { setShowReviewModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  workflowId={workflowId ? Number(workflowId) : undefined}
                  nodeId={editingNodeData.id}
                  localVariables={localVariables}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowReviewModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <ManualTaskNodeModal
                  isOpen={showManualTaskModal}
                  onClose={() => { setShowManualTaskModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  workflowId={workflowId ? Number(workflowId) : undefined}
                  nodeId={editingNodeData.id}
                  localVariables={localVariables}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowManualTaskModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <ApprovalNodeModal
                  isOpen={showApprovalModal}
                  onClose={() => { setShowApprovalModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  workflowId={workflowId ? Number(workflowId) : undefined}
                  nodeId={editingNodeData.id}
                  localVariables={localVariables}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowApprovalModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <MultiChoiceNodeModal
                  isOpen={showMultiChoiceModal}
                  onClose={() => { setShowMultiChoiceModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  workflowId={workflowId ? Number(workflowId) : undefined}
                  nodeId={editingNodeData.id}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowMultiChoiceModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <SplitNodeModal
                  isOpen={showSplitModal}
                  onClose={() => { setShowSplitModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowSplitModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <JoinNodeModal
                  isOpen={showJoinModal}
                  onClose={() => { setShowJoinModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowJoinModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <UpdateMetadataNodeModal
                  isOpen={showUpdateMetadataModal}
                  onClose={() => { setShowUpdateMetadataModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowUpdateMetadataModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <ChangeStatusNodeModal
                  isOpen={showChangeStatusModal}
                  onClose={() => { setShowChangeStatusModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowChangeStatusModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <NewVersionNodeModal
                  isOpen={showNewVersionModal}
                  onClose={() => { setShowNewVersionModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowNewVersionModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <LockDocumentNodeModal
                  isOpen={showLockDocumentModal}
                  onClose={() => { setShowLockDocumentModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowLockDocumentModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <UnlockDocumentNodeModal
                  isOpen={showUnlockDocumentModal}
                  onClose={() => { setShowUnlockDocumentModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowUnlockDocumentModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <ScriptNodeModal
                  isOpen={showScriptModal}
                  onClose={() => { setShowScriptModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowScriptModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <OcrNodeModal
                  isOpen={showOcrModal}
                  onClose={() => { setShowOcrModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowOcrModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <CancelNodeModal
                  isOpen={showCancelModal}
                  onClose={() => { setShowCancelModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowCancelModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <ErrorHandlerNodeModal
                  isOpen={showErrorHandlerModal}
                  onClose={() => { setShowErrorHandlerModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowErrorHandlerModal(false);
                    setEditingNodeData(null);
                  }}
                />

                <GetContextNodeModal
                  isOpen={showGetContextModal}
                  onClose={() => { setShowGetContextModal(false); setEditingNodeData(null); }}
                  nodeData={editingNodeData.data}
                  onSave={(updatedData) => {
                    setNodes((nds) => nds.map((n) => n.id === editingNodeData.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                    setShowGetContextModal(false);
                    setEditingNodeData(null);
                  }}
                />
              </>
            )
          }
        </div >
      </TabsContent>

      <TabsContent value="instances" className="flex-1 overflow-hidden p-6 bg-gray-50/50 mt-0 border-0">
        {workflowId ? <InstancesTab workflowId={Number(workflowId)} /> : <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>}
      </TabsContent>

      <TabsContent value="history" className="flex-1 overflow-hidden p-6 bg-gray-50/50 mt-0 border-0">
        {workflowId ? <HistoryTab workflowId={Number(workflowId)} /> : <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>}
      </TabsContent>

      <TabsContent value="statistics" className="flex-1 overflow-hidden p-6 bg-gray-50/50 mt-0 border-0">
        {workflowId ? <StatisticsTab workflowId={Number(workflowId)} /> : <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>}
      </TabsContent>
    </Tabs>
  );
}
