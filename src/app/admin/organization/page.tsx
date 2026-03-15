'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    Edit,
    Trash2,
    Users as UsersIcon,
    ChevronDown,
    ChevronRight,
    Search,
    Building2,
    Crown,
    MoreVertical,
    Network,
    RefreshCw,
    X,
    AlertCircle,
    ExternalLink,
    AlertTriangle,
    Settings,
    Briefcase,
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
    CreateOrgUnitRequest,
    UpdateOrgUnitRequest,
    OrgUnitTypeResponse,
    getTypeColorClass,
} from '@/api/services/orgUnitService';
import { apiClient } from '@/api/client';

// ==================== Types ====================

interface SimpleUser {
    id: string;
    username: string;
    displayName: string;
    email: string;
    imageUrl?: string;
    imgUrl?: string;
}

// ==================== Tree Node ====================

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
    const typeColorClass = getTypeColorClass(node.typeColor);
    const typeName = node.typeName || 'Unknown Type';
    
    const hasHead = !!node.headUserId;

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
                <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${typeColorClass}`}>
                    <Building2 className="h-4 w-4" />
                </div>

                {/* Name & Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${!node.isActive ? 'line-through opacity-50' : ''}`}>
                            {node.name}
                        </span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${typeColorClass}`}>
                            {typeName}
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
                {hasHead ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Crown className="h-3 w-3 text-amber-500" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>Head: {node.headUserDisplayName}</TooltipContent>
                    </Tooltip>
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center">
                                <AlertTriangle className="h-3 w-3 text-orange-400/70" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>No head assigned</TooltipContent>
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

    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [detailLoading, setDetailLoading] = useState(false);

    // Dynamic Types Data
    const [systemTypes, setSystemTypes] = useState<OrgUnitTypeResponse[]>([]);
    const [availableTypes, setAvailableTypes] = useState<OrgUnitTypeResponse[]>([]);

    // Modal state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isSetHeadOpen, setIsSetHeadOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Create/Edit form
    const [formData, setFormData] = useState<CreateOrgUnitRequest>({
        name: '',
        code: '',
        description: '',
        typeId: '',
    });
    const [creatingAsChildOf, setCreatingAsChildOf] = useState<OrgUnitTreeResponse | null>(null);

    // Head search (shared between Set Head modal & Create/Edit modal inline head picker)
    const [headSearchQuery, setHeadSearchQuery] = useState('');
    const [headSearchResults, setHeadSearchResults] = useState<SimpleUser[]>([]);

    // Inline head picker for Create/Edit modal
    const [formHeadUser, setFormHeadUser] = useState<SimpleUser | null>(null);
    const [isFormHeadPickerOpen, setIsFormHeadPickerOpen] = useState(false);
    const [formHeadSearchQuery, setFormHeadSearchQuery] = useState('');
    const [formHeadSearchResults, setFormHeadSearchResults] = useState<SimpleUser[]>([]);

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

    const fetchSystemTypes = useCallback(async () => {
        try {
            const types = await orgUnitService.getOrgUnitTypes(true);
            setSystemTypes(types);
        } catch (err) {
            console.error("Failed to load org unit types", err);
        }
    }, []);

    useEffect(() => {
        fetchSystemTypes();
    }, [fetchSystemTypes]);

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

    // When a node is selected, fetch details
    const handleNodeSelect = useCallback((node: OrgUnitTreeResponse) => {
        setSelectedNode(node);
        fetchDetail(node.id);
    }, [fetchDetail]);

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
            const payload: CreateOrgUnitRequest = {
                ...formData,
                parentId: creatingAsChildOf ? creatingAsChildOf.id : undefined,
            };
            if (formHeadUser) {
                payload.headUserId = formHeadUser.id;
            }
            const created = await orgUnitService.createOrgUnit(payload);
            addNotification({ type: 'success', title: 'Org Unit Created', message: `"${created.name}" created successfully` });
            setIsCreateOpen(false);
            resetForm();
            await fetchTree();
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
                typeId: formData.typeId,
            };
            // If head was changed via the inline picker
            if (formHeadUser) {
                updateData.headUserId = formHeadUser.id;
            }
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
            await orgUnitService.deleteOrgUnit(selectedDetail.id);
            addNotification({ type: 'success', title: 'Org Unit Deleted', message: `"${selectedDetail.name}" deleted successfully` });
            setIsDeleteOpen(false);
            setSelectedNode(null);
            setSelectedDetail(null);
            await fetchTree();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to delete org unit', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    // ==================== Head Management ====================

    const handleSetHead = async (user: SimpleUser) => {
        if (!selectedNode) return;
        try {
            setActionLoading(true);
            const updated = await orgUnitService.setHead(selectedNode.id, user.id);
            addNotification({ type: 'success', title: 'Head User Set', message: `${user.displayName || user.username} is now the head` });
            setIsSetHeadOpen(false);
            setHeadSearchQuery('');
            setHeadSearchResults([]);
            setSelectedDetail(updated);
            updateTreeNodeHead(selectedNode.id, updated.headUserId, updated.headUserDisplayName);
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
                return Array.isArray(users) ? users : [];
            }
            const params = new URLSearchParams({ query, page: '0', size: '10' });
            const response = await apiClient.get<any>(`/api/v1/admin/users/search?${params}`);
            const users = response.content || response || [];
            return Array.isArray(users) ? users : [];
        } catch {
            return [];
        }
    }, []);

    // Set Head modal search
    useEffect(() => {
        if (!isSetHeadOpen) return;
        const timer = setTimeout(async () => {
            const results = await searchHeadUsers(headSearchQuery);
            setHeadSearchResults(results);
        }, 400);
        return () => clearTimeout(timer);
    }, [headSearchQuery, searchHeadUsers, isSetHeadOpen]);

    // Form head picker search (for Create/Edit modal)
    useEffect(() => {
        if (!isFormHeadPickerOpen) return;
        const timer = setTimeout(async () => {
            const results = await searchHeadUsers(formHeadSearchQuery);
            setFormHeadSearchResults(results);
        }, 400);
        return () => clearTimeout(timer);
    }, [formHeadSearchQuery, searchHeadUsers, isFormHeadPickerOpen]);

    // ==================== Form Helpers ====================

    const resetForm = () => {
        setFormData({ name: '', code: '', description: '', typeId: '' });
        setCreatingAsChildOf(null);
        setFormHeadUser(null);
        setIsFormHeadPickerOpen(false);
        setFormHeadSearchQuery('');
        setFormHeadSearchResults([]);
    };

    const openCreateModal = async (asChildOf?: OrgUnitTreeResponse) => {
        resetForm();
        if (asChildOf) {
            setCreatingAsChildOf(asChildOf);
            try {
                const allowed = await orgUnitService.getAllowedChildren(asChildOf.typeId);
                setAvailableTypes(allowed);
            } catch (err) {
                addNotification({ type: 'error', title: 'Error', message: 'Failed to load allowed child types' });
                setAvailableTypes([]);
            }
        } else {
            setAvailableTypes(systemTypes);
        }
        setIsCreateOpen(true);
    };

    const openEditModal = async () => {
        if (!selectedDetail) return;
        setFormData({
            name: selectedDetail.name,
            code: selectedDetail.code,
            description: selectedDetail.description || '',
            typeId: selectedDetail.typeId,
        });
        // Filter types based on parent hierarchy rules (same as create)
        if (selectedDetail.parentId) {
            try {
                // Fetch the parent to get its typeId
                const parent = await orgUnitService.getOrgUnit(selectedDetail.parentId);
                const allowed = await orgUnitService.getAllowedChildren(parent.typeId);
                setAvailableTypes(allowed);
            } catch (err) {
                addNotification({ type: 'error', title: 'Error', message: 'Failed to load allowed types' });
                setAvailableTypes(systemTypes);
            }
        } else {
            // Root units can be any type
            setAvailableTypes(systemTypes);
        }
        // Pre-populate head if exists
        if (selectedDetail.headUserId && selectedDetail.headUserDisplayName) {
            setFormHeadUser({
                id: selectedDetail.headUserId,
                username: '',
                displayName: selectedDetail.headUserDisplayName,
                email: '',
            });
        } else {
            setFormHeadUser(null);
        }
        setIsFormHeadPickerOpen(false);
        setFormHeadSearchQuery('');
        setFormHeadSearchResults([]);
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
                    <p className="text-muted-foreground mt-1">Manage your organizational hierarchy and unit structure</p>
                </div>
                <div className="flex items-center gap-2">
                    {canUpdate && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => router.push('/admin/organization/config')} className="gap-2 shrink-0">
                                    <Settings className="h-4 w-4" />
                                    Configure
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Manage organization unit types, hierarchy rules, and group types</TooltipContent>
                        </Tooltip>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => router.push('/admin/organization/positions')} className="gap-2 shrink-0">
                                <Briefcase className="h-4 w-4" />
                                Position Catalog
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Browse and manage the position definitions catalog</TooltipContent>
                    </Tooltip>
                    <Button variant="outline" size="sm" onClick={async () => {
                        await fetchTree();
                        if (selectedNode) {
                            await fetchDetail(selectedNode.id);
                        }
                    }} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={() => openCreateModal()} disabled={!canCreate} className="gap-2">
                                <Plus className="h-4 w-4" />
                                New Unit
                            </Button>
                        </TooltipTrigger>
                        {!canCreate && <TooltipContent>You don't have permission to create org units</TooltipContent>}
                    </Tooltip>
                </div>
            </div>

            {/* Main Content: Tree + Overview Panel */}
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
                                    <Button onClick={() => openCreateModal()} variant="outline" size="sm" className="mt-3 gap-2">
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

                {/* Right: Unit Overview Panel */}
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {selectedNode && selectedDetail ? (
                        <Card className="flex-1 flex flex-col min-h-0">
                            <CardHeader className="pb-3 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getTypeColorClass(selectedDetail.typeColor)}`}>
                                            <Network className="h-5 w-5 opacity-75" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">
                                                {selectedDetail.name}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className={getTypeColorClass(selectedDetail.typeColor)}>
                                                    {selectedDetail.typeName}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground font-mono">{selectedDetail.code}</span>
                                                {!selectedDetail.isActive && (
                                                    <Badge variant="destructive" className="text-xs">Inactive</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/organization/${selectedDetail.id}`} className="gap-2">
                                                        <ExternalLink className="h-4 w-4" />
                                                        Open Detail
                                                    </Link>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Open the full detail page for this unit</TooltipContent>
                                        </Tooltip>
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
                                                    onClick={() => openCreateModal(selectedNode)}
                                                    disabled={!canCreate}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Child Unit
                                                </DropdownMenuItem>
                                                {canAssign && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => setIsSetHeadOpen(true)}>
                                                            <Crown className="h-4 w-4 mr-2" />
                                                            Change Head
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
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
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto">
                                {detailLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Description */}
                                        {selectedDetail.description && (
                                            <div>
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Description</Label>
                                                <p className="text-sm mt-1">{selectedDetail.description}</p>
                                            </div>
                                        )}

                                        {/* Key Info Grid */}
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="rounded-lg border p-3">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Parent</span>
                                                <span className="text-sm font-medium">{selectedDetail.parentName || 'Root level'}</span>
                                            </div>
                                            <div className="rounded-lg border p-3">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Level</span>
                                                <span className="text-sm font-medium">{selectedDetail.level}</span>
                                            </div>
                                            <div className="rounded-lg border p-3">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Status</span>
                                                <Badge variant={selectedDetail.isActive ? 'default' : 'destructive'} className="text-xs">
                                                    {selectedDetail.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="rounded-lg border p-4 flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                    <UsersIcon className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <span className="text-2xl font-bold">{selectedDetail.memberCount}</span>
                                                    <span className="text-xs text-muted-foreground block">Members</span>
                                                </div>
                                            </div>
                                            <div className="rounded-lg border p-4 flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <span className="text-2xl font-bold">{selectedDetail.childCount}</span>
                                                    <span className="text-xs text-muted-foreground block">Child Units</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Head User */}
                                        <div className="rounded-lg border p-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Head of Unit</Label>
                                                {canAssign && (
                                                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsSetHeadOpen(true)}>
                                                        Change
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-2">
                                                {selectedDetail.headUserDisplayName ? (
                                                    <>
                                                        <Crown className="h-4 w-4 text-amber-500" />
                                                        <span className="text-sm font-medium">{selectedDetail.headUserDisplayName}</span>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                                                        <span className="text-sm italic">No head assigned</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="flex-1 flex items-center justify-center">
                            <div className="text-center py-16">
                                <Network className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-muted-foreground">Select an org unit</h3>
                                <p className="text-sm text-muted-foreground/70 mt-1">
                                    Click on a unit in the tree to view its details
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* ==================== MODALS ==================== */}

            {/* Create/Edit Modal */}
            {(isCreateOpen || isEditOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 border max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
                            <h2 className="text-lg font-semibold">
                                {isCreateOpen ? (creatingAsChildOf ? `Add child unit under "${creatingAsChildOf.name}"` : 'Create Org Unit') : 'Edit Org Unit'}
                            </h2>
                            <button onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
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
                                <Select value={formData.typeId} onValueChange={(v) => setFormData(prev => ({ ...prev, typeId: v }))}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTypes.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground italic text-center">No allowed types found</div>
                                        ) : (
                                            availableTypes.map(t => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className={`${t.color || 'bg-slate-100 text-slate-800'} text-xs`}>{t.name}</Badge>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
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

                            {/* Head Assignment (optional) */}
                            {canAssign && (
                                <div>
                                    <Label className="flex items-center gap-2">
                                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                                        Head (optional)
                                    </Label>
                                    {formHeadUser && !isFormHeadPickerOpen ? (
                                        <div className="flex items-center gap-3 mt-2 p-3 rounded-lg border bg-amber-50/50">
                                            <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                            <span className="text-sm font-medium flex-1 truncate">{formHeadUser.displayName || formHeadUser.username}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => {
                                                    setIsFormHeadPickerOpen(true);
                                                    setFormHeadSearchQuery('');
                                                }}
                                            >
                                                Change
                                            </Button>
                                            <button
                                                onClick={() => setFormHeadUser(null)}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-2 space-y-2">
                                            {!isFormHeadPickerOpen ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 w-full justify-start text-muted-foreground"
                                                    onClick={() => setIsFormHeadPickerOpen(true)}
                                                >
                                                    <Search className="h-3.5 w-3.5" />
                                                    Search for a head user...
                                                </Button>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="Search by name or email..."
                                                            value={formHeadSearchQuery}
                                                            onChange={e => setFormHeadSearchQuery(e.target.value)}
                                                            className="pl-9 h-9"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => { setIsFormHeadPickerOpen(false); setFormHeadSearchQuery(''); setFormHeadSearchResults([]); }}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2"
                                                        >
                                                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                                        </button>
                                                    </div>
                                                    <div className="border rounded-lg max-h-[180px] overflow-y-auto">
                                                        {formHeadSearchResults.length === 0 ? (
                                                            <div className="text-center py-6 text-sm text-muted-foreground">
                                                                <UsersIcon className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                                                                Type to search for users
                                                            </div>
                                                        ) : (
                                                            formHeadSearchResults.map(user => (
                                                                <button
                                                                    key={user.id}
                                                                    onClick={() => {
                                                                        setFormHeadUser(user);
                                                                        setIsFormHeadPickerOpen(false);
                                                                        setFormHeadSearchQuery('');
                                                                        setFormHeadSearchResults([]);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 p-3 text-left text-sm border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                                                                >
                                                                    <UserAvatar user={user} size="sm" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium truncate">{user.displayName || user.username}</div>
                                                                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                                                    </div>
                                                                    <Crown className="h-4 w-4 text-amber-400 flex-shrink-0" />
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t bg-muted/30 flex-shrink-0">
                            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }}>Cancel</Button>
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
