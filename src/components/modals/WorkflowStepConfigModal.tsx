'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Users, Shield, User as UserIcon, Plus, Trash2, Folder, Clock, Settings, Search, Home, ChevronRight, Check, Loader2, Share2 } from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { UserDto, RoleDto, GroupDto, FolderResDto, FolderRepoResDto, SortFields, CreateStepAssignmentRequest } from '@/types/api';
import UserAvatar from '@/components/main/UserAvatar';
import Pagination from '@/components/main/Pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WorkflowStepConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  stepData: {
    id?: string;
    label: string;
    description?: string;
    assignments?: Array<{
      assigneeType: 'USER' | 'ROLE' | 'GROUP';
      assigneeId: string;
      assigneeName?: string;
      // Full entity objects (optional, for persistence)
      entity?: UserDto | RoleDto | GroupDto;
    }>;
    expirationDays?: number;
    onCompleteAction?: 'NONE' | 'MOVE_TO_FOLDER' | 'NOTIFY_USERS' | 'COMPLETE_WORKFLOW';
    targetFolderId?: number;
    targetFolderName?: string;
    isRequired?: boolean;
    allowParallelApproval?: boolean;
    minApprovalsNeeded?: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    expirationAction?: 'DENY' | 'CONTINUE';
  };
  onSave: (stepData: {
    label: string;
    description?: string;
    assignments: CreateStepAssignmentRequest[];
    // Also return full entity objects for persistence
    assignmentEntities?: Array<{
      assigneeType: 'USER' | 'ROLE' | 'GROUP';
      assigneeId: string;
      entity: UserDto | RoleDto | GroupDto;
    }>;
    expirationDays?: number;
    onCompleteAction?: 'NONE' | 'MOVE_TO_FOLDER' | 'NOTIFY_USERS' | 'COMPLETE_WORKFLOW';
    targetFolderId?: number;
    isRequired?: boolean;
    allowParallelApproval?: boolean;
    minApprovalsNeeded?: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    expirationAction?: 'DENY' | 'CONTINUE';
  }) => void;
}

type GranteeType = 'user' | 'group' | 'role';

// Type guards
function isUser(grantee: UserDto | GroupDto | RoleDto | null | undefined): grantee is UserDto {
  return grantee != null && 'username' in grantee;
}

function isGroup(grantee: UserDto | GroupDto | RoleDto | null | undefined): grantee is GroupDto {
  return grantee != null && 'userCount' in grantee && !('username' in grantee);
}

function isRole(grantee: UserDto | GroupDto | RoleDto | null | undefined): grantee is RoleDto {
  return grantee != null && !('username' in grantee) && !('userCount' in grantee);
}

interface StepAssignment {
  id: string;
  type: GranteeType;
  entity: UserDto | GroupDto | RoleDto;
  canEdit: boolean;
}

export default function WorkflowStepConfigModal({
  isOpen,
  onClose,
  stepData,
  onSave
}: WorkflowStepConfigModalProps) {
  const [stepName, setStepName] = useState(stepData.label || '');
  const [stepDescription, setStepDescription] = useState(stepData.description || '');
  const [expirationDays, setExpirationDays] = useState<number>(stepData.expirationDays || 0);
  const [onCompleteAction, setOnCompleteAction] = useState<'NONE' | 'MOVE_TO_FOLDER' | 'NOTIFY_USERS' | 'COMPLETE_WORKFLOW'>(
    stepData.onCompleteAction || 'NONE'
  );
  const [targetFolderId, setTargetFolderId] = useState<number | undefined>(stepData.targetFolderId);
  const [targetFolderName, setTargetFolderName] = useState<string | undefined>(stepData.targetFolderName);
  const [isRequired, setIsRequired] = useState(stepData.isRequired ?? true);
  const [allowParallelApproval, setAllowParallelApproval] = useState(stepData.allowParallelApproval ?? false);
  const [minApprovalsNeeded, setMinApprovalsNeeded] = useState<number>(stepData.minApprovalsNeeded || 1);
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(stepData.priority || 'MEDIUM');
  const [expirationAction, setExpirationAction] = useState<'DENY' | 'CONTINUE'>(stepData.expirationAction || 'DENY');

  const [assignments, setAssignments] = useState<StepAssignment[]>([]);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [folderActiveTab, setFolderActiveTab] = useState<'folders' | 'shared'>('folders');

  // Available entities for adding new assignments
  const [users, setUsers] = useState<UserDto[]>([]);
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);

  // Search dropdown states for adding entities
  const [availableEntities, setAvailableEntities] = useState<(UserDto | GroupDto | RoleDto)[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<'user' | 'group' | 'role' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // My Folders tab state
  const [myFoldersData, setMyFoldersData] = useState<FolderRepoResDto | null>(null);
  const [myFoldersLoading, setMyFoldersLoading] = useState(false);
  const [myFoldersSearchQuery, setMyFoldersSearchQuery] = useState('');
  const [myFoldersDebouncedQuery, setMyFoldersDebouncedQuery] = useState('');
  const [myFoldersCurrentPage, setMyFoldersCurrentPage] = useState(0);
  const [myFoldersPageSize] = useState(20);
  const [myFoldersCurrentFolderId, setMyFoldersCurrentFolderId] = useState<number | null>(null);
  const [myFoldersBreadcrumbs, setMyFoldersBreadcrumbs] = useState<Array<{ id: number; name: string }>>([]);

  // Shared Folders tab state
  const [sharedData, setSharedData] = useState<FolderRepoResDto | null>(null);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedSearchQuery, setSharedSearchQuery] = useState('');
  const [sharedDebouncedQuery, setSharedDebouncedQuery] = useState('');
  const [sharedCurrentPage, setSharedCurrentPage] = useState(0);
  const [sharedPageSize] = useState(20);
  const [sharedCurrentFolderId, setSharedCurrentFolderId] = useState<number | null>(null);
  const [sharedBreadcrumbs, setSharedBreadcrumbs] = useState<Array<{ id: number; name: string }>>([]);

  // Load available users
  const loadAvailableUsers = async (search?: string) => {
    try {
      const response = await notificationApiClient.getAllUsers(
        { page: 0, size: 100, search: search || undefined, desc: false },
        { silent: true }
      );
      setUsers(response?.content || []);
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  // Load available groups
  const loadAvailableGroups = async (search?: string) => {
    try {
      const response = await notificationApiClient.getAllGroups(
        { page: 0, size: 100, name: search || undefined, desc: false },
        { silent: true }
      );
      setGroups(response?.content || []);
    } catch (error) {
      console.error('Error loading available groups:', error);
    }
  };

  // Load available roles
  const loadAvailableRoles = async (search?: string) => {
    try {
      const response = await notificationApiClient.getAllRoles(
        { page: 0, size: 100, name: search || undefined, desc: false },
        { silent: true }
      );
      setRoles(response?.content || []);
    } catch (error) {
      console.error('Error loading available roles:', error);
    }
  };

  // Set available entities based on selected type and filter out those in assignments
  useEffect(() => {
    if (!selectedEntityType) return;

    let entities: (UserDto | GroupDto | RoleDto)[] = [];

    switch (selectedEntityType) {
      case 'user':
        entities = users || [];
        break;
      case 'group':
        entities = groups || [];
        break;
      case 'role':
        entities = roles || [];
        break;
    }

    if (!Array.isArray(entities)) {
      entities = [];
    }

    // Filter out entities that are already in assignments
    const assignedIds = new Set(
      assignments
        .filter(a => a.entity != null)
        .map(a => a.entity.id)
    );
    const filtered = entities.filter(entity => !assignedIds.has(entity.id));

    setAvailableEntities(filtered);
  }, [users, groups, roles, selectedEntityType, assignments]);

  // Debounced API search for available entities
  useEffect(() => {
    if (!selectedEntityType) return;

    const performSearch = async () => {
      try {
        setSearching(true);
        const searchTerm = searchQuery.trim() || undefined;

        switch (selectedEntityType) {
          case 'user':
            await loadAvailableUsers(searchTerm);
            break;
          case 'group':
            await loadAvailableGroups(searchTerm);
            break;
          case 'role':
            await loadAvailableRoles(searchTerm);
            break;
        }
      } catch (error) {
        console.error('Error searching entities:', error);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedEntityType]);

  // Maintain focus after API calls
  useEffect(() => {
    if (searchInputRef.current && selectedEntityType) {
      const timeoutId = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [availableEntities, searching, selectedEntityType]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || typeof document === 'undefined') return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.searchable-select-container')) {
        handleCloseDropdown();
      }
    };

    try {
      document.addEventListener('mousedown', handleClickOutside);
    } catch (error) {
      console.warn('Failed to add event listener:', error);
      return;
    }

    return () => {
      try {
        if (typeof document !== 'undefined') {
          document.removeEventListener('mousedown', handleClickOutside);
        }
      } catch (error) {
        console.warn('Failed to remove event listener:', error);
      }
    };
  }, [isOpen]);

  // Load initial assignments from stepData
  useEffect(() => {
    if (isOpen && stepData.assignments) {
      const loadAssignments = async () => {
        const loadedAssignments: StepAssignment[] = [];

        for (const assignment of stepData.assignments || []) {
          try {
            let entity: UserDto | RoleDto | GroupDto | null = null;

            // If entity object is already provided, use it (no need to fetch)
            if (assignment.entity) {
              entity = assignment.entity;
            } else {
              // Otherwise, fetch the entity
              if (assignment.assigneeType === 'USER') {
                const response = await notificationApiClient.getUserById(assignment.assigneeId, { silent: true });
                entity = response;
              } else if (assignment.assigneeType === 'ROLE') {
                const response = await notificationApiClient.getRoleById(assignment.assigneeId, { silent: true });
                entity = response;
              } else if (assignment.assigneeType === 'GROUP') {
                const response = await notificationApiClient.getGroupById(assignment.assigneeId, { silent: true });
                entity = response;
              }
            }

            if (entity) {
              loadedAssignments.push({
                id: `${assignment.assigneeType}-${assignment.assigneeId}`,
                type: assignment.assigneeType.toLowerCase() as GranteeType,
                entity: entity,
                canEdit: true,
              });
            }
          } catch (error) {
            console.error(`Failed to load ${assignment.assigneeType}:`, error);
          }
        }

        setAssignments(loadedAssignments);
      };

      loadAssignments();
    } else if (isOpen) {
      setAssignments([]);
    }
  }, [isOpen, stepData.assignments]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStepName(stepData.label || '');
      setStepDescription(stepData.description || '');
      setExpirationDays(stepData.expirationDays || 0);
      setOnCompleteAction(stepData.onCompleteAction || 'NONE');
      setTargetFolderId(stepData.targetFolderId);
      setTargetFolderName(stepData.targetFolderName);
      setIsRequired(stepData.isRequired ?? true);
      setAllowParallelApproval(stepData.allowParallelApproval ?? false);
      setMinApprovalsNeeded(stepData.minApprovalsNeeded || 1);
      setPriority(stepData.priority || 'MEDIUM');
    }
  }, [isOpen, stepData]);

  // Entity type selection functions
  const handleAddUser = async () => {
    setSelectedEntityType('user');
    setSearchQuery('');
    setShowSearchDropdown(true);
    await loadAvailableUsers();
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  const handleAddGroup = async () => {
    setSelectedEntityType('group');
    setSearchQuery('');
    setShowSearchDropdown(true);
    await loadAvailableGroups();
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  const handleAddRole = async () => {
    setSelectedEntityType('role');
    setSearchQuery('');
    setShowSearchDropdown(true);
    await loadAvailableRoles();
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  const handleCloseDropdown = () => {
    setShowSearchDropdown(false);
    setSelectedEntityType(null);
    setSearchQuery('');
  };

  const addAssignment = (entity: UserDto | GroupDto | RoleDto) => {
    // Determine entity type
    let type: GranteeType;
    if ('username' in entity) {
      type = 'user';
    } else if ('userCount' in entity) {
      type = 'group';
    } else {
      type = 'role';
    }

    const assignmentId = `${type}-${entity.id}`;

    // Check if already assigned
    if (assignments.some(a => a.id === assignmentId)) {
      return;
    }

    const newAssignment: StepAssignment = {
      id: assignmentId,
      type: type,
      entity: entity,
      canEdit: true,
    };

    setAssignments([...assignments, newAssignment]);
    handleCloseDropdown();
  };

  const removeAssignment = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const handleSave = () => {
    if (!stepName.trim()) {
      return;
    }

    const assignmentRequests: CreateStepAssignmentRequest[] = assignments.map(assignment => ({
      assigneeType: assignment.type.toUpperCase() as 'USER' | 'ROLE' | 'GROUP',
      assigneeId: assignment.entity.id,
      canEdit: assignment.canEdit,
    }));

    // Also return full entity objects for persistence in node data
    const assignmentEntities = assignments.map(assignment => ({
      assigneeType: assignment.type.toUpperCase() as 'USER' | 'ROLE' | 'GROUP',
      assigneeId: assignment.entity.id,
      entity: assignment.entity,
    }));

    onSave({
      label: stepName,
      description: stepDescription,
      assignments: assignmentRequests,
      assignmentEntities,
      expirationDays: expirationDays > 0 ? expirationDays : undefined,
      expirationAction: expirationDays > 0 ? expirationAction : undefined,
      allowParallelApproval,
      minApprovalsNeeded: allowParallelApproval ? minApprovalsNeeded : undefined,
      priority,
    });
  };

  // Debounce search queries
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
    setTargetFolderId(folderId);
    setTargetFolderName(folderName);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[90vw] w-full h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Configure Workflow Step</h2>
              <p className="text-sm text-gray-600">Set up step details, assignments, and actions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Step Information</h3>

            <div>
              <Label htmlFor="step-name">Step Name *</Label>
              <Input
                id="step-name"
                value={stepName}
                onChange={(e) => setStepName(e.target.value)}
                placeholder="Enter step name..."
              />
            </div>

            <div>
              <Label htmlFor="step-description">Description</Label>
              <Textarea
                id="step-description"
                value={stepDescription}
                onChange={(e) => setStepDescription(e.target.value)}
                placeholder="Enter step description..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiration-days">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Expiration Days
                  </div>
                </Label>
                <Input
                  id="expiration-days"
                  type="number"
                  min="0"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(parseInt(e.target.value) || 0)}
                  placeholder="0 = no expiration"
                />
                <p className="text-xs text-gray-500 mt-1">Days until step expires (0 = no expiration)</p>
              </div>

              {expirationDays > 0 && (
                <div>
                  <Label htmlFor="expiration-action">On Expiration</Label>
                  <Select value={expirationAction} onValueChange={(value: 'DENY' | 'CONTINUE') => setExpirationAction(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DENY">Mark as Denied</SelectItem>
                      <SelectItem value="CONTINUE">Continue to next step</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">What happens when the step expires</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allow-parallel"
                checked={allowParallelApproval}
                onChange={(e) => setAllowParallelApproval(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="allow-parallel" className="cursor-pointer">
                Allow Parallel Approval
              </Label>
            </div>

            {allowParallelApproval && (
              <div>
                <Label htmlFor="min-approvals">Minimum Approvals Needed</Label>
                <Input
                  id="min-approvals"
                  type="number"
                  min="1"
                  value={minApprovalsNeeded}
                  onChange={(e) => setMinApprovalsNeeded(parseInt(e.target.value) || 1)}
                />
              </div>
            )}
          </div>

          {/* Assignments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Step Assignments</h3>
              <Badge variant="secondary">{assignments.length} assigned</Badge>
            </div>

            {/* Add Assignment Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={handleAddUser}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <UserIcon className="h-4 w-4" />
                  Add User
                </button>
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Add Group
                </button>
                <button
                  type="button"
                  onClick={handleAddRole}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Add Role
                </button>
              </div>

              {/* SearchableSelect component */}
              <div className="relative searchable-select-container">
                {selectedEntityType && (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={`Search ${selectedEntityType}s to add...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {searching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                      )}
                      <button
                        onClick={handleCloseDropdown}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>

                    {showSearchDropdown && availableEntities.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {availableEntities.map((entity: any) => (
                          <button
                            key={entity.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addAssignment(entity);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-200 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              {/* User - Show Avatar */}
                              {'username' in entity && (
                                <>
                                  <UserAvatar user={entity as UserDto} size="sm" />
                                  <div>
                                    <div className="font-medium">
                                      {`${entity.firstName || ''} ${entity.lastName || ''}`.trim() || entity.username}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      @{entity.username}{entity.email ? ` • ${entity.email}` : ''}
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* Group - Show Icon */}
                              {'userCount' in entity && (
                                <>
                                  <div className="p-2 bg-green-100 rounded-lg shrink-0">
                                    <Users className="h-4 w-4 text-green-700" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{entity.name}</div>
                                    <div className="text-xs text-gray-500">{entity.description || 'Group'}</div>
                                  </div>
                                </>
                              )}

                              {/* Role - Show Icon */}
                              {!('username' in entity) && !('userCount' in entity) && (
                                <>
                                  <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                                    <Shield className="h-4 w-4 text-purple-700" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{entity.name}</div>
                                    <div className="text-xs text-gray-500">{entity.description || 'Role'}</div>
                                  </div>
                                </>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Current Assignments */}
              {assignments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Selected Assignees:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg bg-white"
                      >
                        {assignment.type === 'user' && <UserAvatar user={assignment.entity as UserDto} size="sm" />}
                        {assignment.type === 'group' && (
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                        {assignment.type === 'role' && (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-orange-600" />
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">
                            {assignment.type === 'user'
                              ? (assignment.entity as UserDto).displayName
                              : (assignment.entity as RoleDto | GroupDto).name}
                          </p>
                          {assignment.type === 'user' && (
                            <p className="text-xs text-gray-500">{(assignment.entity as UserDto).email}</p>
                          )}
                          <Badge variant="outline" className="text-xs capitalize mt-1">{assignment.type}</Badge>
                        </div>

                        <button
                          onClick={() => removeAssignment(assignment.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!stepName.trim()}>
            Save Step
          </Button>
        </div>
      </div>

      {/* Folder Picker Modal */}
      {showFolderPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Select Target Folder</h3>
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
                          const isSelected = targetFolderId === folder.id;
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
                          const isSelected = targetFolderId === folder.id;
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
    </div>
  );
}

