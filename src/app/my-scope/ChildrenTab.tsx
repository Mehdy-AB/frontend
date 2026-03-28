'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Building2, ChevronRight, ChevronDown, Users, RefreshCw, Search,
    UserPlus, UserMinus, Check, Crown, Settings, X, Network
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import UserAvatar from '@/components/main/UserAvatar';
import Pagination from '@/components/main/Pagination';
import { myScopeService } from '@/api/services/myScopeService';
import { getTypeColorClass } from '@/api/services/orgUnitService';
import { apiClient } from '@/api/client';
import type { OrgUnitResponse, OrgUnitMemberResponse } from '@/api/services/orgUnitService';

interface ChildrenTabProps {
    ouId: string;
    canViewChildMembers: boolean;
    canViewDescendants: boolean;
    canManageChildMembers: boolean;
    addNotification: (n: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
    refreshTrigger?: number;
}

interface SimpleUser {
    id: string;
    username: string;
    displayName: string;
    email: string;
    imageUrl?: string;
    imgUrl?: string;
}

interface OuTreeNode extends OrgUnitResponse {
    childNodes: OuTreeNode[];
}

function TreeNode({
    node,
    expandedIds,
    toggleExpand,
    onManage,
    searchQuery,
    baseLevel,
}: {
    node: OuTreeNode;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
    onManage: (node: OuTreeNode) => void;
    searchQuery: string;
    baseLevel: number;
}) {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.childNodes.length > 0;
    const typeColorClass = getTypeColorClass(node.typeColor);
    const indent = Math.max(0, (node.level || 0) - baseLevel);
    const matchesSearch = searchQuery && 
        (node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         node.code.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div>
            <div className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group
                ${matchesSearch ? 'bg-amber-50/50 ring-1 ring-amber-200' : 'hover:bg-muted/50 border border-transparent'}`}
                style={{ paddingLeft: `${indent * 24 + 12}px` }}
                onClick={() => toggleExpand(node.id)}>
                
                <button className={`p-0.5 rounded transition-colors ${hasChildren ? 'hover:bg-muted' : 'invisible'}`}>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>
                
                <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${typeColorClass}`}>
                    <Building2 className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{node.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">{node.code}</Badge>
                    {node.typeName && (
                        <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 ${typeColorClass}`}>{node.typeName}</Badge>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                         <span className="flex items-center gap-1">
                             <Users className="h-3 w-3" /> {node.memberCount ?? '?'}
                         </span>
                    </div>

                    {node.headUserDisplayName && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full" title="Head of Unit">
                            <Crown className="h-3 w-3" />
                            <span className="max-w-[100px] truncate">{node.headUserDisplayName}</span>
                        </div>
                    )}
                    
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); onManage(node); }}>
                        <Settings className="h-3 w-3" /> Manage
                    </Button>
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className="mt-0.5 space-y-0.5 border-l border-muted-foreground/20 ml-[28px]">
                    {node.childNodes.map(child => (
                        <TreeNode key={child.id} node={child} expandedIds={expandedIds} toggleExpand={toggleExpand} onManage={onManage} searchQuery={searchQuery} baseLevel={baseLevel} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ChildrenTab({
    ouId, canViewChildMembers, canViewDescendants, canManageChildMembers, addNotification, refreshTrigger = 0
}: ChildrenTabProps) {
    // Tree data
    const [ouList, setOuList] = useState<OrgUnitResponse[]>([]);
    const [ouLoading, setOuLoading] = useState(false);
    const [ouSearch, setOuSearch] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    
    // Management dialog state
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

    // Members state
    const [members, setMembers] = useState<OrgUnitMemberResponse[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberSearchDebounced, setMemberSearchDebounced] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [actionLoading, setActionLoading] = useState(false);

    // Add member dialog
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addSearch, setAddSearch] = useState('');
    const [addResults, setAddResults] = useState<SimpleUser[]>([]);
    const [addSelected, setAddSelected] = useState<Set<string>>(new Set());
    const [addLoading, setAddLoading] = useState(false);

    // Set Head dialog
    const [isSetHeadOpen, setIsSetHeadOpen] = useState(false);
    const [headSearch, setHeadSearch] = useState('');
    const [headResults, setHeadResults] = useState<SimpleUser[]>([]);
    const [headLoading, setHeadLoading] = useState(false);

    // Confirmation dialogs
    const [removeConfirm, setRemoveConfirm] = useState<{ userId: string; name: string } | null>(null);
    const [batchRemoveConfirm, setBatchRemoveConfirm] = useState(false);

    // ==================== Tree Logic ====================

    const fetchOuList = useCallback(async () => {
        try {
            setOuLoading(true);
            const data = canViewDescendants
                ? await myScopeService.getMyDescendants(ouId)
                : await myScopeService.getMyChildren(ouId);
            setOuList(data);
            if (data.length > 0) {
                const rootLevel = Math.min(...data.map(d => d.level ?? 999));
                const topLevelIds = data.filter(d => (d.level ?? 0) === rootLevel).map(d => d.id);
                setExpandedIds(new Set(topLevelIds));
            }
        } catch { /* ignore */ }
        finally { setOuLoading(false); }
    }, [ouId, canViewDescendants]);

    useEffect(() => { fetchOuList(); }, [fetchOuList, refreshTrigger]);

    const ouTree = useMemo(() => {
        if (!ouList.length) return [];
        const map = new Map<string, OuTreeNode>();
        ouList.forEach(ou => map.set(ou.id, { ...ou, childNodes: [] }));
        
        const roots: OuTreeNode[] = [];
        ouList.forEach(ou => {
            const node = map.get(ou.id)!;
            if (ou.parentId && map.has(ou.parentId) && ou.parentId !== ouId) {
                map.get(ou.parentId)!.childNodes.push(node);
            } else {
                roots.push(node);
            }
        });
        return roots;
    }, [ouList, ouId]);

    const filteredTree = useMemo(() => {
        if (!ouSearch) return ouTree;
        const filter = (nodes: OuTreeNode[]): OuTreeNode[] => {
            return nodes.map(node => {
                const filteredChildren = filter(node.childNodes);
                const matches = node.name.toLowerCase().includes(ouSearch.toLowerCase()) ||
                    node.code.toLowerCase().includes(ouSearch.toLowerCase());
                if (matches || filteredChildren.length > 0) {
                    return { ...node, childNodes: filteredChildren };
                }
                return null;
            }).filter(Boolean) as OuTreeNode[];
        };
        return filter(ouTree);
    }, [ouTree, ouSearch]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => setExpandedIds(new Set(ouList.map(ou => ou.id)));
    const collapseAll = () => setExpandedIds(new Set());

    // ==================== Members Fetcher ====================

    const fetchMembers = useCallback(async (childId: string, q?: string, p?: number) => {
        if (!canViewChildMembers) return;
        try {
            setMembersLoading(true);
            const data = await myScopeService.getChildMembersPaged(ouId, childId, {
                query: q || undefined,
                page: p ?? page,
                size: pageSize,
            });
            setMembers(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch {
            setMembers([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally { setMembersLoading(false); }
    }, [ouId, canViewChildMembers, page, pageSize]);

    // Debounce member search
    useEffect(() => {
        const timer = setTimeout(() => {
            setMemberSearchDebounced(memberSearch);
            setPage(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [memberSearch]);

    useEffect(() => {
        if (selectedChildId) {
            fetchMembers(selectedChildId, memberSearchDebounced || undefined);
        }
    }, [selectedChildId, memberSearchDebounced, fetchMembers, page]);

    // ==================== Selection & Search Handlers ====================

    const openManage = (node: OuTreeNode) => {
        setSelectedChildId(node.id);
        setSelected(new Set());
        setMemberSearch('');
        setPage(0);
    };

    const closeManage = () => {
        setSelectedChildId(null);
        setMembers([]);
        setSelected(new Set());
    };

    const selectedOu = ouList.find(ou => ou.id === selectedChildId);

    const searchUsers = useCallback(async (query: string) => {
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
        } catch { return []; }
    }, []);

    // Effect for Add Member search
    useEffect(() => {
        if (!isAddDialogOpen) return;
        const timer = setTimeout(async () => {
            setAddLoading(true);
            setAddResults(await searchUsers(addSearch));
            setAddLoading(false);
        }, 400);
        return () => clearTimeout(timer);
    }, [addSearch, searchUsers, isAddDialogOpen]);

    // Effect for Set Head search
    useEffect(() => {
        if (!isSetHeadOpen) return;
        const timer = setTimeout(async () => {
            setHeadLoading(true);
            setHeadResults(await searchUsers(headSearch));
            setHeadLoading(false);
        }, 400);
        return () => clearTimeout(timer);
    }, [headSearch, searchUsers, isSetHeadOpen]);

    // ==================== Actions ====================

    const toggleSelect = (userId: string) => {
        setSelected(prev => {
             const next = new Set(prev);
             if (next.has(userId)) next.delete(userId);
             else next.add(userId);
             return next;
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === members.length && members.length > 0) setSelected(new Set());
        else setSelected(new Set(members.map(m => m.userId)));
    };

    const handleAddMembers = async () => {
        if (!selectedChildId || addSelected.size === 0) return;
        try {
            setActionLoading(true);
            const assignments = Array.from(addSelected).map(uid => ({ userId: uid }));
            if (assignments.length === 1) {
                await myScopeService.addChildMember(ouId, selectedChildId, assignments[0].userId);
            } else {
                await myScopeService.addChildMembersBatch(ouId, selectedChildId, assignments);
            }
            addNotification({ type: 'success', title: 'Members Added', message: `Added ${assignments.length} member(s)` });
            setIsAddDialogOpen(false);
            setAddSelected(new Set());
            setAddSearch('');
            fetchMembers(selectedChildId, memberSearchDebounced);
            fetchOuList();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to Add', message: err?.response?.data?.message || err?.message || 'An error occurred' });
        } finally { setActionLoading(false); }
    };

    const handleRemoveMember = async () => {
        if (!selectedChildId || !removeConfirm) return;
        try {
            setActionLoading(true);
            await myScopeService.removeChildMember(ouId, selectedChildId, removeConfirm.userId);
            addNotification({ type: 'success', title: 'Member Removed', message: `${removeConfirm.name} was removed` });
            setRemoveConfirm(null);
            setSelected(prev => { const n = new Set(prev); n.delete(removeConfirm.userId); return n; });
            fetchMembers(selectedChildId, memberSearchDebounced);
            fetchOuList(); // Update counts
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to Remove', message: err?.response?.data?.message || err?.message || 'An error occurred' });
        } finally { setActionLoading(false); }
    };

    const handleBatchRemove = async () => {
        if (!selectedChildId || selected.size === 0) return;
        try {
            setActionLoading(true);
            await myScopeService.removeChildMembersBatch(ouId, selectedChildId, Array.from(selected));
            addNotification({ type: 'success', title: 'Members Removed', message: `Removed ${selected.size} member(s)` });
            setBatchRemoveConfirm(false);
            setSelected(new Set());
            fetchMembers(selectedChildId, memberSearchDebounced);
            fetchOuList();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to Remove', message: err?.response?.data?.message || err?.message || 'An error occurred' });
        } finally { setActionLoading(false); }
    };

    const handleSetHead = async (user: SimpleUser) => {
        if (!selectedChildId) return;
        try {
            setActionLoading(true);
            await myScopeService.setChildHead(ouId, selectedChildId, user.id);
            addNotification({ type: 'success', title: 'Head Set', message: `${user.displayName} was set as head` });
            setIsSetHeadOpen(false);
            setHeadSearch('');
            fetchOuList(); // Update head name in tree
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to Set Head', message: err?.response?.data?.message || err?.message || 'An error occurred' });
        } finally { setActionLoading(false); }
    };

    // ==================== Render ====================

    return (
        <div className="space-y-4 h-[calc(100vh-280px)] flex flex-col">
            <Card className="flex flex-col min-h-0 flex-1">
                <CardHeader className="pb-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Network className="h-4 w-4 text-primary" />
                            {canViewDescendants ? 'Descendant Units Hierarchy' : 'Child Units'}
                            {ouList.length > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{ouList.length}</Badge>
                            )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={expandAll} className="h-7 text-xs">
                                Expand All
                            </Button>
                            <Button variant="ghost" size="sm" onClick={collapseAll} className="h-7 text-xs">
                                Collapse
                            </Button>
                        </div>
                    </div>
                    {ouList.length > 5 && (
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                value={ouSearch}
                                onChange={(e) => setOuSearch(e.target.value)}
                                placeholder="Filter hierarchy by name or code..."
                                className="pl-9 h-8 text-sm w-80 max-w-full"
                            />
                        </div>
                    )}
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto pt-0 scrollbar-thin">
                    {ouLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">Loading units...</p>
                        </div>
                    ) : filteredTree.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                            <p className="text-muted-foreground">
                                {ouSearch ? 'No units match your filter' : 'No child units found'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-0.5 mt-2">
                            {filteredTree.map(child => (
                                <TreeNode 
                                    key={child.id} 
                                    node={child} 
                                    expandedIds={expandedIds} 
                                    toggleExpand={toggleExpand} 
                                    onManage={openManage} 
                                    searchQuery={ouSearch} 
                                    baseLevel={ouList[0]?.level ?? 0}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ==================== Management Modal ==================== */}
            <Dialog open={!!selectedChildId} onOpenChange={(open) => { if (!open) closeManage(); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b bg-muted/20 pb-4">
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${getTypeColorClass(selectedOu?.typeColor || "slate")}`}>
                                <Building2 className="h-4 w-4" />
                            </div>
                            Manage {selectedOu?.name}
                            {selectedOu?.code && <Badge variant="outline" className="font-mono text-xs">{selectedOu.code}</Badge>}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Head of Unit Panel */}
                        {canManageChildMembers && (
                            <div className="border border-border/60 bg-card rounded-xl shadow-sm p-4 flex items-center justify-between relative overflow-hidden group">
                                <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
                                <div className="flex items-center gap-4 relative">
                                    <div className="h-11 w-11 rounded-lg border border-primary/20 bg-primary/10 flex items-center justify-center shadow-sm">
                                        <Crown className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-0.5">
                                            Head of Unit
                                        </h4>
                                        <p className="font-semibold text-base">
                                            {selectedOu?.headUserDisplayName ? (
                                                <span className="text-foreground tracking-tight">{selectedOu.headUserDisplayName}</span>
                                            ) : (
                                                <span className="text-muted-foreground/60 italic font-normal text-sm">No head assigned</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="relative hover:bg-primary hover:text-primary-foreground border-primary/20 transition-all shadow-sm gap-2"
                                    onClick={() => setIsSetHeadOpen(true)}
                                >
                                    <Crown className="h-3.5 w-3.5" />
                                    {selectedOu?.headUserDisplayName ? 'Change Head' : 'Set Head'}
                                </Button>
                            </div>
                        )}

                        {/* Members Card */}
                        <Card className="flex flex-col min-h-[400px]">
                            <CardHeader className="py-4 border-b">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Users className="h-4 w-4 text-primary" />
                                        Members
                                        {totalElements > 0 && <Badge variant="secondary" className="text-[10px]">{totalElements}</Badge>}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        {canManageChildMembers && selected.size > 0 && (
                                            <Button variant="outline" size="sm" onClick={() => setBatchRemoveConfirm(true)} className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
                                                <UserMinus className="h-3.5 w-3.5" /> Remove {selected.size}
                                            </Button>
                                        )}
                                        {canManageChildMembers && (
                                            <Button size="sm" onClick={() => { setIsAddDialogOpen(true); setAddSearch(''); setAddSelected(new Set()); }} className="gap-1.5 text-xs">
                                                <UserPlus className="h-3.5 w-3.5" /> Add Member
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="relative mt-3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                                        placeholder="Search members..." className="pl-9 h-8 text-sm max-w-sm" />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                                {membersLoading ? (
                                    <div className="flex items-center justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                                    </div>
                                ) : members.length === 0 ? (
                                    <div className="text-center p-12 flex-1 flex flex-col justify-center">
                                        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                                        <p className="text-muted-foreground">{memberSearch ? 'No members match search' : 'No members in this unit'}</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-muted-foreground bg-muted/30 sticky top-0 z-10 border-b">
                                                <tr>
                                                    {canManageChildMembers && (
                                                        <th className="px-4 py-2 w-10 text-center">
                                                            <button onClick={toggleSelectAll}>
                                                                <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${selected.size === members.length && members.length > 0 ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 hover:border-primary'}`}>
                                                                    {selected.size === members.length && members.length > 0 && <Check className="h-3 w-3" />}
                                                                </div>
                                                            </button>
                                                        </th>
                                                    )}
                                                    <th className="px-4 py-2 font-medium">Member</th>
                                                    <th className="px-4 py-2 font-medium w-32">Status</th>
                                                    {canManageChildMembers && <th className="px-4 py-2 w-20 text-center">Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {members.map(member => {
                                                    const isSelected = selected.has(member.userId);
                                                    return (
                                                        <tr key={member.userId} className={`hover:bg-muted/10 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                                                            {canManageChildMembers && (
                                                                <td className="px-4 py-2 text-center">
                                                                    <button onClick={() => toggleSelect(member.userId)}>
                                                                        <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 hover:border-primary'}`}>
                                                                            {isSelected && <Check className="h-3 w-3" />}
                                                                        </div>
                                                                    </button>
                                                                </td>
                                                            )}
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <UserAvatar user={{ displayName: member.displayName, imgUrl: member.imageUrl || undefined }} size="sm" />
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium truncate">{member.displayName}</p>
                                                                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {member.isPrimary && (
                                                                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                                                                        Primary
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            {canManageChildMembers && (
                                                                <td className="px-4 py-3 text-center">
                                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                                                        onClick={() => setRemoveConfirm({ userId: member.userId, name: member.displayName })}>
                                                                        <UserMinus className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {totalPages > 1 && (
                                    <div className="p-3 border-t bg-muted/10">
                                        <Pagination currentPage={page} totalPages={totalPages} totalElements={totalElements} pageSize={pageSize} onPageChange={setPage} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Sub-Dialogs: Add Member, Set Head, Confirmations */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-lg shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> Add Members</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input value={addSearch} onChange={(e) => setAddSearch(e.target.value)} placeholder="Search users by name or email..." className="pl-9" autoFocus />
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1 border rounded-md p-1">
                            {addLoading ? (
                                <div className="flex items-center justify-center py-6"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                            ) : addResults.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">{addSearch.length >= 2 ? 'No users found' : 'Type 2+ characters to search'}</p>
                            ) : (
                                addResults.filter(u => !members.some(m => m.userId === u.id)).map(user => {
                                    const isSelected = addSelected.has(user.id);
                                    return (
                                        <button key={user.id} onClick={() => {
                                            const n = new Set(addSelected);
                                            if (n.has(user.id)) n.delete(user.id); else n.add(user.id);
                                            setAddSelected(n);
                                        }} className={`w-full flex items-center gap-3 p-2.5 rounded-md text-left transition-all ${isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50 border border-transparent'}`}>
                                            <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                                                {isSelected && <Check className="h-3 w-3" />}
                                            </div>
                                            <UserAvatar user={{ displayName: user.displayName, imgUrl: user.imageUrl || user.imgUrl || undefined }} size="sm" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{user.displayName}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddMembers} disabled={addSelected.size === 0 || actionLoading} className="gap-1.5">
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                            Add {addSelected.size > 0 ? `${addSelected.size} Member(s)` : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isSetHeadOpen} onOpenChange={setIsSetHeadOpen}>
                <DialogContent className="max-w-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /> Set Head of Unit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input value={headSearch} onChange={(e) => setHeadSearch(e.target.value)} placeholder="Search for user..." className="pl-9" autoFocus />
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-1">
                            {headLoading ? (
                                <div className="flex items-center justify-center py-6"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                            ) : headResults.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">{headSearch.length >= 2 ? 'No users found' : 'Type 2+ characters to search'}</p>
                            ) : (
                                headResults.map(user => (
                                    <button key={user.id} onClick={() => handleSetHead(user)} disabled={actionLoading}
                                        className="w-full flex items-center gap-3 p-2.5 rounded-md text-left transition-all hover:bg-muted/50 border border-transparent">
                                        <UserAvatar user={{ displayName: user.displayName, imgUrl: user.imageUrl || user.imgUrl || undefined }} size="sm" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">{user.displayName}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!removeConfirm} onOpenChange={(open) => { if (!open) setRemoveConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{removeConfirm?.name}</strong> from {selectedOu?.name}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveMember} disabled={actionLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5">
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />} Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={batchRemoveConfirm} onOpenChange={setBatchRemoveConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove {selected.size} Member(s)</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove {selected.size} selected member(s) from {selectedOu?.name}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBatchRemove} disabled={actionLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5">
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />} Remove All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
