'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Edit,
    Trash2,
    Users as UsersIcon,
    ChevronDown,
    ChevronRight,
    Search,
    Building2,
    UserPlus,
    UserMinus,
    Crown,
    MoreVertical,
    Network,
    RefreshCw,
    X,
    Check,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import UserAvatar from '@/components/main/UserAvatar';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminPagePermissions } from '@/hooks/useAdminPagePermissions';
import { useNotification } from '@/contexts/NotificationContext';
import {
    orgUnitService,
    OrgUnitTreeResponse,
    OrgUnitResponse,
    OrgUnitMemberResponse,
    OrgUnitType,
    CreateOrgUnitRequest,
    UpdateOrgUnitRequest,
    BatchAssignUsersRequest,
} from '@/api/services/orgUnitService';
import { apiClient } from '@/api/client';

// ==================== Types ====================

const ORG_UNIT_TYPES: { value: OrgUnitType; label: string; color: string }[] = [
    { value: 'ORGANIZATION', label: 'Organization', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'DIRECTORATE', label: 'Directorate', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'DEPARTMENT', label: 'Department', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'SERVICE', label: 'Service', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { value: 'TEAM', label: 'Team', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    { value: 'BRANCH', label: 'Branch', color: 'bg-rose-100 text-rose-800 border-rose-200' },
];

function getTypeConfig(type: OrgUnitType) {
    return ORG_UNIT_TYPES.find(t => t.value === type) || ORG_UNIT_TYPES[0];
}

interface SimpleUser {
    id: string;
    username: string;
    displayName: string;
    email: string;
    imageUrl?: string;
    imgUrl?: string;
}

// ==================== Subcomponents ====================

// Tree Node
function TreeNode({
    node,
    expandedIds,
    toggleExpand,
    selectedId,
    onSelect,
    searchQuery,
}: {
    node: OrgUnitTreeResponse;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
    selectedId: string | null;
    onSelect: (node: OrgUnitTreeResponse) => void;
    searchQuery: string;
}) {
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const typeConfig = getTypeConfig(node.type);

    // Filter highlight
    const matchesSearch = searchQuery &&
        (node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            node.code.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div>
            <div
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150
          ${isSelected
                        ? 'bg-primary/10 border border-primary/30 shadow-sm'
                        : 'hover:bg-muted/60 border border-transparent'}
          ${matchesSearch ? 'ring-2 ring-amber-300 bg-amber-50/50' : ''}
        `}
                style={{ paddingLeft: `${node.level * 24 + 12}px` }}
                onClick={() => onSelect(node)}
            >
                {/* Expand/Collapse */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(node.id);
                    }}
                    className={`p-0.5 rounded transition-colors ${hasChildren ? 'hover:bg-muted' : 'invisible'}`}
                >
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>

                {/* Icon */}
                <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
                    <Building2 className="h-4 w-4" />
                </div>

                {/* Name & Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${!node.isActive ? 'line-through opacity-50' : ''}`}>
                            {node.name}
                        </span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${typeConfig.color}`}>
                            {typeConfig.label}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{node.code}</span>
                        <span className="flex items-center gap-1">
                            <UsersIcon className="h-3 w-3" />
                            {node.memberCount}
                        </span>
                    </div>
                </div>

                {/* Head indicator */}
                {node.headUserDisplayName && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Crown className="h-3 w-3 text-amber-500" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>Head: {node.headUserDisplayName}</TooltipContent>
                    </Tooltip>
                )}
            </div>

            {/* Children */}
            {isExpanded && hasChildren && (
                <div className="mt-0.5">
                    {node.children.map(child => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            expandedIds={expandedIds}
                            toggleExpand={toggleExpand}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            searchQuery={searchQuery}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ==================== Main Page ====================

export default function OrganizationPage() {
    const router = useRouter();
    const { canView, canCreate, canUpdate, canDelete, canAssign } = useAdminPagePermissions();
    const { addNotification } = useNotification();

    // Data state
    const [tree, setTree] = useState<OrgUnitTreeResponse[]>([]);
    const [selectedNode, setSelectedNode] = useState<OrgUnitTreeResponse | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<OrgUnitResponse | null>(null);
    const [members, setMembers] = useState<OrgUnitMemberResponse[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [membersLoading, setMembersLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    // Modal state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isMemberAddOpen, setIsMemberAddOpen] = useState(false);
    const [isSetHeadOpen, setIsSetHeadOpen] = useState(false);
    const [headSearchQuery, setHeadSearchQuery] = useState('');
    const [headSearchResults, setHeadSearchResults] = useState<SimpleUser[]>([]);
    const [actionLoading, setActionLoading] = useState(false);

    // Create/Edit form
    const [formData, setFormData] = useState<CreateOrgUnitRequest>({
        name: '',
        code: '',
        description: '',
        type: 'DEPARTMENT',
    });

    // Member add form — multi-select
    const [availableUsers, setAvailableUsers] = useState<SimpleUser[]>([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [selectedUserMap, setSelectedUserMap] = useState<Map<string, SimpleUser>>(new Map());
    const [primaryUserIds, setPrimaryUserIds] = useState<Set<string>>(new Set());

    // Permission check
    useEffect(() => {
        if (!canView) router.push('/');
    }, [canView, router]);

    // ==================== Data Fetching ====================

    const fetchTree = useCallback(async () => {
        try {
            setLoading(true);
            const data = await orgUnitService.getTree();
            setTree(data);
            // Auto-expand first level
            const rootIds = new Set(data.map(n => n.id));
            setExpandedIds(prev => new Set([...prev, ...rootIds]));
        } catch (err: any) {
            addNotification({
                type: 'error',
                title: 'Failed to load organization tree',
                message: err?.message || 'An unexpected error occurred',
            });
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchTree();
    }, [fetchTree]);

    const fetchDetail = useCallback(async (id: string) => {
        try {
            setDetailLoading(true);
            const detail = await orgUnitService.getOrgUnit(id);
            setSelectedDetail(detail);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to load details', message: err?.message });
        } finally {
            setDetailLoading(false);
        }
    }, [addNotification]);

    const fetchMembers = useCallback(async (orgUnitId: string) => {
        try {
            setMembersLoading(true);
            const data = await orgUnitService.getMembers(orgUnitId);
            setMembers(data);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to load members', message: err?.message });
        } finally {
            setMembersLoading(false);
        }
    }, [addNotification]);

    // When a node is selected, fetch details and members
    const handleNodeSelect = useCallback((node: OrgUnitTreeResponse) => {
        setSelectedNode(node);
        fetchDetail(node.id);
        fetchMembers(node.id);
    }, [fetchDetail, fetchMembers]);

    // ==================== Tree Operations ====================

    const toggleExpand = useCallback((id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        const allIds = new Set<string>();
        const traverse = (nodes: OrgUnitTreeResponse[]) => {
            nodes.forEach(n => {
                allIds.add(n.id);
                if (n.children) traverse(n.children);
            });
        };
        traverse(tree);
        setExpandedIds(allIds);
    }, [tree]);

    const collapseAll = useCallback(() => {
        setExpandedIds(new Set());
    }, []);

    // Helper to update a tree node's memberCount client-side (avoids backend refetch)
    const updateTreeNodeMemberCount = useCallback((nodeId: string, delta: number) => {
        setTree(prev => {
            const update = (nodes: OrgUnitTreeResponse[]): OrgUnitTreeResponse[] =>
                nodes.map(n => ({
                    ...n,
                    memberCount: n.id === nodeId ? Math.max(0, n.memberCount + delta) : n.memberCount,
                    children: n.children ? update(n.children) : [],
                }));
            return update(prev);
        });
    }, []);

    // Helper to update a tree node's head info client-side
    const updateTreeNodeHead = useCallback((nodeId: string, headUserId: string | null, headUserDisplayName: string | null) => {
        setTree(prev => {
            const update = (nodes: OrgUnitTreeResponse[]): OrgUnitTreeResponse[] =>
                nodes.map(n => ({
                    ...n,
                    headUserId: n.id === nodeId ? headUserId : n.headUserId,
                    headUserDisplayName: n.id === nodeId ? headUserDisplayName : n.headUserDisplayName,
                    children: n.children ? update(n.children) : [],
                }));
            return update(prev);
        });
    }, []);

    // ==================== CRUD Handlers ====================

    const handleCreate = async () => {
        try {
            setActionLoading(true);
            const created = await orgUnitService.createOrgUnit({
                ...formData,
                parentId: selectedNode?.id,
            });
            addNotification({ type: 'success', title: 'Org Unit Created', message: `"${created.name}" created successfully` });
            setIsCreateOpen(false);
            resetForm();
            await fetchTree();
            // Update parent's child count locally
            if (selectedNode && selectedDetail) {
                setSelectedDetail({ ...selectedDetail, childCount: selectedDetail.childCount + 1 });
            }
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to create org unit', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedDetail) return;
        try {
            setActionLoading(true);
            const updateData: UpdateOrgUnitRequest = {
                name: formData.name,
                code: formData.code,
                description: formData.description,
                type: formData.type,
            };
            const updated = await orgUnitService.updateOrgUnit(selectedDetail.id, updateData);
            addNotification({ type: 'success', title: 'Org Unit Updated', message: `"${updated.name}" updated successfully` });
            setIsEditOpen(false);
            resetForm();
            await fetchTree();
            fetchDetail(selectedDetail.id);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to update org unit', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedDetail) return;
        try {
            setActionLoading(true);
            const parentId = selectedDetail.parentId;
            await orgUnitService.deleteOrgUnit(selectedDetail.id);
            addNotification({ type: 'success', title: 'Org Unit Deleted', message: `"${selectedDetail.name}" deleted successfully` });
            setIsDeleteOpen(false);
            setSelectedNode(null);
            setSelectedDetail(null);
            setMembers([]);
            await fetchTree();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to delete org unit', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    // ==================== Member Management ====================

    const searchUsers = useCallback(async (query: string) => {
        try {
            if (!query || query.length < 2) {
                const params = new URLSearchParams({ page: '0', size: '10' });
                const response = await apiClient.get<any>(`/api/v1/admin/users?${params}`);
                const users = response.content || response || [];
                setAvailableUsers(Array.isArray(users) ? users : []);
                return;
            }
            const params = new URLSearchParams({ query, page: '0', size: '10' });
            const response = await apiClient.get<any>(`/api/v1/admin/users/search?${params}`);
            const users = response.content || response || [];
            setAvailableUsers(Array.isArray(users) ? users : []);
        } catch {
            setAvailableUsers([]);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => searchUsers(userSearchQuery), 400);
        return () => clearTimeout(timer);
    }, [userSearchQuery, searchUsers]);

    const toggleUserSelection = (user: SimpleUser) => {
        setSelectedUserIds(prev => {
            const next = new Set(prev);
            if (next.has(user.id)) {
                next.delete(user.id);
                setSelectedUserMap(pm => { const nm = new Map(pm); nm.delete(user.id); return nm; });
                setPrimaryUserIds(pp => { const np = new Set(pp); np.delete(user.id); return np; });
            } else {
                next.add(user.id);
                setSelectedUserMap(pm => new Map(pm).set(user.id, user));
            }
            return next;
        });
    };

    const togglePrimary = (userId: string) => {
        setPrimaryUserIds(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const handleAssignUsers = async () => {
        if (!selectedNode || selectedUserIds.size === 0) return;
        try {
            setActionLoading(true);
            const batchRequest: BatchAssignUsersRequest = {
                assignments: Array.from(selectedUserIds).map(userId => ({
                    userId,
                    isPrimary: primaryUserIds.has(userId),
                }))
            };
            const results = await orgUnitService.assignUsersBatch(selectedNode.id, batchRequest);
            const addedCount = results.length;
            addNotification({ type: 'success', title: 'Users Assigned', message: `${addedCount} user(s) added successfully` });
            setIsMemberAddOpen(false);
            setSelectedUserIds(new Set());
            setSelectedUserMap(new Map());
            setPrimaryUserIds(new Set());
            setUserSearchQuery('');
            setAvailableUsers([]);
            // Append new members to local list & update counts client-side
            setMembers(prev => [...prev, ...results]);
            if (selectedDetail) {
                setSelectedDetail({ ...selectedDetail, memberCount: selectedDetail.memberCount + addedCount });
            }
            updateTreeNodeMemberCount(selectedNode.id, addedCount);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to assign users', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveUser = async (userId: string, displayName: string) => {
        if (!selectedNode) return;
        try {
            await orgUnitService.removeUser(selectedNode.id, userId);
            addNotification({ type: 'success', title: 'User Removed', message: `${displayName} removed from this org unit` });
            // Remove from local list & update counts client-side
            setMembers(prev => prev.filter(m => m.userId !== userId));
            if (selectedDetail) {
                const updatedDetail = { ...selectedDetail, memberCount: Math.max(0, selectedDetail.memberCount - 1) };
                // If removed user was the head, clear head locally + update tree
                if (selectedDetail.headUserId === userId) {
                    updatedDetail.headUserId = null;
                    updatedDetail.headUserDisplayName = null;
                    updateTreeNodeHead(selectedNode.id, null, null);
                }
                setSelectedDetail(updatedDetail);
            }
            updateTreeNodeMemberCount(selectedNode.id, -1);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to remove user', message: err?.message });
        }
    };

    const handleSetHead = async (user: SimpleUser) => {
        if (!selectedNode) return;
        try {
            setActionLoading(true);
            const updated = await orgUnitService.setHead(selectedNode.id, user.id);
            addNotification({ type: 'success', title: 'Head User Set', message: `${user.displayName || user.username} is now the head` });
            setIsSetHeadOpen(false);
            setHeadSearchQuery('');
            setHeadSearchResults([]);

            // Update detail locally from API response
            setSelectedDetail(updated);

            // Update tree node head info
            updateTreeNodeHead(selectedNode.id, updated.headUserId, updated.headUserDisplayName);

            // Sync members list: clear old head title, set new head title
            const oldHeadId = selectedDetail?.headUserId;
            const alreadyMember = members.some(m => m.userId === user.id);

            setMembers(prev => {
                let updatedMembers = prev.map(m => {
                    // Clear old head's "Head" positionTitle
                    if (oldHeadId && m.userId === oldHeadId && m.positionTitle === 'Head') {
                        return { ...m, positionTitle: null };
                    }
                    // Set new head's positionTitle to "Head"
                    if (m.userId === user.id) {
                        return { ...m, positionTitle: 'Head' };
                    }
                    return m;
                });
                // If user wasn't already a member, add them
                if (!alreadyMember) {
                    updatedMembers = [...updatedMembers, {
                        id: '',
                        userId: user.id,
                        username: user.username,
                        displayName: user.displayName,
                        email: user.email,
                        imageUrl: user.imageUrl || user.imgUrl || null,
                        isPrimary: false,
                        positionTitle: 'Head',
                        assignedAt: new Date().toISOString(),
                        assignedBy: null,
                        assignedByDisplayName: null,
                    }];
                }
                return updatedMembers;
            });

            // Update member count if user was auto-added
            if (!alreadyMember) {
                updateTreeNodeMemberCount(selectedNode.id, 1);
            }
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to set head user', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    const searchHeadUsers = useCallback(async (query: string) => {
        try {
            if (!query || query.length < 2) {
                const params = new URLSearchParams({ page: '0', size: '10' });
                const response = await apiClient.get<any>(`/api/v1/admin/users?${params}`);
                const users = response.content || response || [];
                setHeadSearchResults(Array.isArray(users) ? users : []);
                return;
            }
            const params = new URLSearchParams({ query, page: '0', size: '10' });
            const response = await apiClient.get<any>(`/api/v1/admin/users/search?${params}`);
            const users = response.content || response || [];
            setHeadSearchResults(Array.isArray(users) ? users : []);
        } catch {
            setHeadSearchResults([]);
        }
    }, []);

    useEffect(() => {
        if (!isSetHeadOpen) return;
        const timer = setTimeout(() => searchHeadUsers(headSearchQuery), 400);
        return () => clearTimeout(timer);
    }, [headSearchQuery, searchHeadUsers, isSetHeadOpen]);

    // ==================== Form Helpers ====================

    const resetForm = () => {
        setFormData({ name: '', code: '', description: '', type: 'DEPARTMENT' });
    };

    const openCreateModal = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const openEditModal = () => {
        if (!selectedDetail) return;
        setFormData({
            name: selectedDetail.name,
            code: selectedDetail.code,
            description: selectedDetail.description || '',
            type: selectedDetail.type,
        });
        setIsEditOpen(true);
    };

    // Auto-generate code from name
    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            code: prev.code === '' || prev.code === generateCode(prev.name)
                ? generateCode(name)
                : prev.code,
        }));
    };

    function generateCode(name: string): string {
        return name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').substring(0, 30);
    }

    // ==================== Filtered Tree ====================

    const filteredTree = useMemo(() => {
        if (!searchQuery) return tree;

        const filter = (nodes: OrgUnitTreeResponse[]): OrgUnitTreeResponse[] => {
            return nodes
                .map(node => {
                    const filteredChildren = filter(node.children || []);
                    const matches = node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        node.code.toLowerCase().includes(searchQuery.toLowerCase());
                    if (matches || filteredChildren.length > 0) {
                        return { ...node, children: filteredChildren };
                    }
                    return null;
                })
                .filter(Boolean) as OrgUnitTreeResponse[];
        };
        return filter(tree);
    }, [tree, searchQuery]);

    // ==================== Render ====================

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading organization structure...</p>
                </div>
            </div>
        );
    }

    if (!canView) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-destructive text-lg">You don't have permission to view this page</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 pb-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Network className="h-8 w-8 text-primary" />
                        Organization Management
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your organizational hierarchy, units, and members</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={async () => {
                        await fetchTree();
                        if (selectedNode) {
                            await fetchDetail(selectedNode.id);
                            await fetchMembers(selectedNode.id);
                        }
                    }} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={openCreateModal} disabled={!canCreate} className="gap-2">
                                <Plus className="h-4 w-4" />
                                New Unit
                            </Button>
                        </TooltipTrigger>
                        {!canCreate && <TooltipContent>You don't have permission to create org units</TooltipContent>}
                    </Tooltip>
                </div>
            </div>

            {/* Main Content: Tree + Detail Panel */}
            <div className="flex-1 flex gap-4 px-6 pb-6 min-h-0">
                {/* Left: Tree Panel */}
                <Card className="w-[400px] flex flex-col min-h-0">
                    <CardHeader className="pb-3 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Organization Tree</CardTitle>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={expandAll} className="h-7 text-xs">
                                    Expand All
                                </Button>
                                <Button variant="ghost" size="sm" onClick={collapseAll} className="h-7 text-xs">
                                    Collapse
                                </Button>
                            </div>
                        </div>
                        {/* Search */}
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                </button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto pt-0 scrollbar-thin">
                        {filteredTree.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground text-sm">
                                    {searchQuery ? 'No units match your search' : 'No organizational units yet'}
                                </p>
                                {!searchQuery && canCreate && (
                                    <Button onClick={openCreateModal} variant="outline" size="sm" className="mt-3 gap-2">
                                        <Plus className="h-4 w-4" />
                                        Create First Unit
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {filteredTree.map(node => (
                                    <TreeNode
                                        key={node.id}
                                        node={node}
                                        expandedIds={expandedIds}
                                        toggleExpand={toggleExpand}
                                        selectedId={selectedNode?.id || null}
                                        onSelect={handleNodeSelect}
                                        searchQuery={searchQuery}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Detail Panel */}
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {selectedNode && selectedDetail ? (
                        <>
                            {/* Detail Card */}
                            <Card className="flex-shrink-0">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getTypeConfig(selectedDetail.type).color}`}>
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">{selectedDetail.name}</CardTitle>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className={getTypeConfig(selectedDetail.type).color}>
                                                        {getTypeConfig(selectedDetail.type).label}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground font-mono">{selectedDetail.code}</span>
                                                    {!selectedDetail.isActive && (
                                                        <Badge variant="destructive" className="text-xs">Inactive</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={openEditModal} disabled={!canUpdate}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit Unit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        resetForm();
                                                        setIsCreateOpen(true);
                                                    }}
                                                    disabled={!canCreate}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Child Unit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => setIsDeleteOpen(true)}
                                                    disabled={!canDelete}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Unit
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                        {selectedDetail.description && (
                                            <div className="col-span-2 lg:col-span-4">
                                                <span className="text-muted-foreground">Description:</span>{' '}
                                                <span>{selectedDetail.description}</span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-muted-foreground">Parent:</span>{' '}
                                            <span>{selectedDetail.parentName || 'Root level'}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Level:</span>{' '}
                                            <span>{selectedDetail.level}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Members:</span>{' '}
                                            <span className="font-medium">{selectedDetail.memberCount}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Children:</span>{' '}
                                            <span className="font-medium">{selectedDetail.childCount}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Head:</span>{' '}
                                            <span className="flex items-center gap-2 inline-flex">
                                                {selectedDetail.headUserDisplayName ? (
                                                    <>
                                                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                                                        {selectedDetail.headUserDisplayName}
                                                    </>
                                                ) : (
                                                    <span className="italic text-muted-foreground">Not assigned</span>
                                                )}
                                                {canAssign && (
                                                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsSetHeadOpen(true)}>
                                                        Change
                                                    </Button>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Members Card */}
                            <Card className="flex-1 flex flex-col min-h-0">
                                <CardHeader className="pb-3 flex-shrink-0">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <UsersIcon className="h-5 w-5" />
                                            Members ({members.length})
                                        </CardTitle>
                                        {canAssign && (
                                            <Button size="sm" variant="outline" className="gap-2" onClick={() => setIsMemberAddOpen(true)}>
                                                <UserPlus className="h-4 w-4" />
                                                Add Member
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto pt-0 scrollbar-thin">
                                    {membersLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                        </div>
                                    ) : members.length === 0 ? (
                                        <div className="text-center py-8">
                                            <UsersIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                            <p className="text-sm text-muted-foreground">No members assigned</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {members.map(member => (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                                                >
                                                    {/* Avatar */}
                                                    <UserAvatar user={{ id: member.userId, username: member.username, displayName: member.displayName, email: member.email, imageUrl: member.imageUrl || undefined }} size="sm" />

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium truncate">
                                                                {member.displayName || member.username}
                                                            </span>
                                                            {member.isPrimary && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                                                                    Primary
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            {member.email && <span className="truncate">{member.email}</span>}
                                                            {member.positionTitle && (
                                                                <>
                                                                    <span>·</span>
                                                                    <span className="truncate">{member.positionTitle}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1">
                                                        {canAssign && selectedDetail?.headUserId !== member.userId && member.positionTitle !== 'Head' && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                        onClick={() => handleSetHead({ id: member.userId, username: member.username, displayName: member.displayName, email: member.email, imageUrl: member.imageUrl || undefined })}
                                                                    >
                                                                        <Crown className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Set as Head</TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {canAssign && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                        onClick={() => handleRemoveUser(member.userId, member.displayName || member.username)}
                                                                    >
                                                                        <UserMinus className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Remove from unit</TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card className="flex-1 flex items-center justify-center">
                            <div className="text-center py-16">
                                <Network className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-muted-foreground">Select an org unit</h3>
                                <p className="text-sm text-muted-foreground/70 mt-1">
                                    Click on a unit in the tree to view its details and members
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* ==================== MODALS ==================== */}

            {/* Create/Edit Modal */}
            {(isCreateOpen || isEditOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 border" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-semibold">
                                {isCreateOpen ? (selectedNode ? `Add child unit under "${selectedNode.name}"` : 'Create Org Unit') : 'Edit Org Unit'}
                            </h2>
                            <button onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <Label htmlFor="org-name">Name *</Label>
                                <Input
                                    id="org-name"
                                    value={formData.name}
                                    onChange={e => handleNameChange(e.target.value)}
                                    placeholder="e.g. Finance Department"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="org-code">Code *</Label>
                                <Input
                                    id="org-code"
                                    value={formData.code}
                                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                    placeholder="e.g. FINANCE_DEPT"
                                    className="mt-1 font-mono"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Must start with a letter, only letters/digits/underscores/hyphens</p>
                            </div>
                            <div>
                                <Label htmlFor="org-type">Type *</Label>
                                <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as OrgUnitType }))}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ORG_UNIT_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`${t.color} text-xs`}>{t.label}</Badge>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="org-desc">Description</Label>
                                <textarea
                                    id="org-desc"
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
                                    placeholder="Optional description..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t bg-muted/30">
                            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Cancel</Button>
                            <Button
                                onClick={isCreateOpen ? handleCreate : handleEdit}
                                disabled={actionLoading || !formData.name || !formData.code}
                            >
                                {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                                {isCreateOpen ? 'Create' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && selectedDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsDeleteOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 border" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <AlertCircle className="h-5 w-5 text-destructive" />
                                </div>
                                <h2 className="text-lg font-semibold">Delete Org Unit</h2>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to delete <strong>"{selectedDetail.name}"</strong>?
                                {selectedDetail.childCount > 0 && (
                                    <span className="block mt-2 text-destructive font-medium">
                                        This unit has {selectedDetail.childCount} child unit(s). You must remove or reparent them first.
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t bg-muted/30">
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={actionLoading || selectedDetail.childCount > 0}
                            >
                                {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal — Multi-Select */}
            {isMemberAddOpen && selectedNode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setIsMemberAddOpen(false); setSelectedUserIds(new Set()); setSelectedUserMap(new Map()); setPrimaryUserIds(new Set()); }}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 border" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b">
                            <div>
                                <h2 className="text-lg font-semibold">Add Members to "{selectedNode.name}"</h2>
                                <p className="text-sm text-muted-foreground mt-0.5">Select multiple users to add at once</p>
                            </div>
                            <button onClick={() => { setIsMemberAddOpen(false); setSelectedUserIds(new Set()); setSelectedUserMap(new Map()); setPrimaryUserIds(new Set()); }} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Search */}
                            <div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users by name or email..."
                                        value={userSearchQuery}
                                        onChange={e => setUserSearchQuery(e.target.value)}
                                        className="pl-9"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Selected users with primary toggle */}
                            {selectedUserIds.size > 0 && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Selected ({selectedUserIds.size})</Label>
                                    <div className="border rounded-lg divide-y max-h-32 overflow-y-auto">
                                        {Array.from(selectedUserMap.values()).map(user => (
                                            <div key={user.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                                                <UserAvatar user={user} size="xs" />
                                                <span className="flex-1 truncate font-medium">{user.displayName || user.username}</span>
                                                <button
                                                    onClick={() => togglePrimary(user.id)}
                                                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${primaryUserIds.has(user.id)
                                                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                                                        : 'bg-muted/50 text-muted-foreground border-transparent hover:border-muted-foreground/30'}`}
                                                >
                                                    {primaryUserIds.has(user.id) ? '★ Primary' : 'Set Primary'}
                                                </button>
                                                <button onClick={() => toggleUserSelection(user)} className="text-muted-foreground hover:text-destructive">
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* User list with checkboxes */}
                            <div className="border rounded-lg max-h-[280px] overflow-y-auto">
                                {availableUsers.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        <UsersIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                        Type to search for users
                                    </div>
                                ) : (
                                    availableUsers.map(user => {
                                        const isSelected = selectedUserIds.has(user.id);
                                        const isAlreadyMember = members.some(m => m.userId === user.id);
                                        return (
                                            <button
                                                key={user.id}
                                                onClick={() => !isAlreadyMember && toggleUserSelection(user)}
                                                disabled={isAlreadyMember}
                                                className={`w-full flex items-center gap-3 p-3 text-left text-sm border-b last:border-b-0 transition-colors
                                                    ${isAlreadyMember ? 'opacity-50 cursor-not-allowed bg-muted/20' : isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                                            >
                                                {/* Checkbox */}
                                                <div className={`h-4.5 w-4.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                                    ${isAlreadyMember ? 'border-muted-foreground/30 bg-muted' : isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`}>
                                                    {(isSelected || isAlreadyMember) && <Check className={`h-3 w-3 ${isAlreadyMember ? 'text-muted-foreground/50' : 'text-white'}`} />}
                                                </div>
                                                {/* Avatar */}
                                                <UserAvatar user={user} size="sm" />
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{user.displayName || user.username}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                                </div>
                                                {isAlreadyMember && (
                                                    <Badge variant="outline" className="text-[10px] shrink-0">Already member</Badge>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-6 border-t bg-muted/30">
                            <span className="text-sm text-muted-foreground">
                                {selectedUserIds.size > 0 ? `${selectedUserIds.size} user(s) selected` : 'No users selected'}
                            </span>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => { setIsMemberAddOpen(false); setSelectedUserIds(new Set()); setSelectedUserMap(new Map()); setPrimaryUserIds(new Set()); }}>Cancel</Button>
                                <Button onClick={handleAssignUsers} disabled={actionLoading || selectedUserIds.size === 0}>
                                    {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add {selectedUserIds.size > 0 ? `${selectedUserIds.size} Member${selectedUserIds.size > 1 ? 's' : ''}` : 'Members'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Set Head Modal — Search Any User */}
            {isSetHeadOpen && selectedNode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setIsSetHeadOpen(false); setHeadSearchQuery(''); setHeadSearchResults([]); }}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 border" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b">
                            <div>
                                <h2 className="text-lg font-semibold">Set Head of "{selectedNode.name}"</h2>
                                <p className="text-sm text-muted-foreground mt-0.5">Search and select any user as head</p>
                            </div>
                            <button onClick={() => { setIsSetHeadOpen(false); setHeadSearchQuery(''); setHeadSearchResults([]); }} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users by name or email..."
                                    value={headSearchQuery}
                                    onChange={e => setHeadSearchQuery(e.target.value)}
                                    className="pl-9"
                                    autoFocus
                                />
                            </div>
                            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                                {headSearchResults.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        <UsersIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                        Type to search for users
                                    </div>
                                ) : (
                                    headSearchResults.map(user => {
                                        const isCurrentHead = selectedDetail?.headUserId === user.id;
                                        return (
                                            <button
                                                key={user.id}
                                                onClick={() => !isCurrentHead && handleSetHead(user)}
                                                disabled={actionLoading || isCurrentHead}
                                                className={`w-full flex items-center gap-3 p-3 text-left text-sm border-b last:border-b-0 transition-colors
                                                    ${isCurrentHead ? 'opacity-50 cursor-not-allowed bg-amber-50' : 'hover:bg-muted/50'}`}
                                            >
                                                <UserAvatar user={user} size="sm" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{user.displayName || user.username}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                                </div>
                                                {isCurrentHead ? (
                                                    <Badge variant="outline" className="text-[10px] shrink-0 border-amber-300 text-amber-700">Current Head</Badge>
                                                ) : (
                                                    <Crown className="h-4 w-4 text-amber-400" />
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t bg-muted/30">
                            <Button variant="outline" onClick={() => { setIsSetHeadOpen(false); setHeadSearchQuery(''); setHeadSearchResults([]); }}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
