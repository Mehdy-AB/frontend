'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Settings, Plus, Edit, Trash2, RefreshCw, ArrowLeft,
    Network, Shield, Check, X, ChevronRight, AlertTriangle,
    Lock, Unlock, Users, GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAdminPagePermissions } from '@/hooks/useAdminPagePermissions';
import { useNotification } from '@/contexts/NotificationContext';
import {
    orgUnitService, OrgUnitTypeResponse, OrgUnitGroupTypeResponse,
    TypeRelation, COLOR_THEMES, getTypeColorClass
} from '@/api/services/orgUnitService';

export default function OrganizationConfigPage() {
    const router = useRouter();
    const { canUpdate } = useAdminPagePermissions();
    const { addNotification } = useNotification();
    const canManageConfig = canUpdate;

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [orgUnitTypes, setOrgUnitTypes] = useState<OrgUnitTypeResponse[]>([]);
    const [groupTypes, setGroupTypes] = useState<OrgUnitGroupTypeResponse[]>([]);
    const [relations, setRelations] = useState<TypeRelation[]>([]);

    // Modals
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [isGroupTypeModalOpen, setIsGroupTypeModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<OrgUnitTypeResponse | null>(null);
    const [editingGroupType, setEditingGroupType] = useState<OrgUnitGroupTypeResponse | null>(null);

    // Type form
    const [typeForm, setTypeForm] = useState({
        name: '', code: '', description: '', color: 'slate',
        canHaveChildren: true, canHaveMembers: true, isSystem: false
    });
    // Group type form
    const [groupTypeForm, setGroupTypeForm] = useState({
        name: '', code: '', description: '', color: 'slate', isSystem: false
    });

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; isGroup: boolean } | null>(null);

    // Relation inline add state (per parent row)
    const [inlineAddParent, setInlineAddParent] = useState<string | null>(null);
    const [inlineAddChild, setInlineAddChild] = useState('');

    // Create new rule form state
    const [newRuleParent, setNewRuleParent] = useState('');
    const [newRuleChildren, setNewRuleChildren] = useState<string[]>([]);

    // Permission redirect
    useEffect(() => {
        if (!canManageConfig) {
            router.push('/admin/organization');
        }
    }, [canManageConfig, router]);

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [ouTypes, gTypes, rels] = await Promise.all([
                orgUnitService.getOrgUnitTypes(false),
                orgUnitService.getOrgUnitGroupTypes(false),
                orgUnitService.getTypeRelations()
            ]);
            setOrgUnitTypes(ouTypes);
            setGroupTypes(gTypes);
            setRelations(rels);
        } catch (error) {
            console.error('Failed to load configuration:', error);
            addNotification({ type: 'error', title: 'Error', message: 'Failed to load configuration data' });
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        if (canManageConfig) fetchData();
    }, [canManageConfig, fetchData]);

    // ==================== Handlers ====================

    const handleSaveType = async () => {
        if (!typeForm.name.trim() || !typeForm.code.trim()) {
            addNotification({ type: 'error', title: 'Validation', message: 'Name and Code are required' });
            return;
        }
        try {
            setActionLoading(true);
            if (editingType) {
                await orgUnitService.updateOrgUnitType(editingType.id, typeForm);
                addNotification({ type: 'success', title: 'Updated', message: `"${typeForm.name}" updated` });
            } else {
                await orgUnitService.createOrgUnitType(typeForm);
                addNotification({ type: 'success', title: 'Created', message: `"${typeForm.name}" created` });
            }
            setIsTypeModalOpen(false);
            fetchData();
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || error.message || 'Failed to save' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveGroupType = async () => {
        if (!groupTypeForm.name.trim() || !groupTypeForm.code.trim()) {
            addNotification({ type: 'error', title: 'Validation', message: 'Name and Code are required' });
            return;
        }
        try {
            setActionLoading(true);
            if (editingGroupType) {
                await orgUnitService.updateOrgUnitGroupType(editingGroupType.id, groupTypeForm);
                addNotification({ type: 'success', title: 'Updated', message: `"${groupTypeForm.name}" updated` });
            } else {
                await orgUnitService.createOrgUnitGroupType(groupTypeForm);
                addNotification({ type: 'success', title: 'Created', message: `"${groupTypeForm.name}" created` });
            }
            setIsGroupTypeModalOpen(false);
            fetchData();
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || error.message || 'Failed to save' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            setActionLoading(true);
            if (deleteConfirm.isGroup) {
                await orgUnitService.deleteOrgUnitGroupType(deleteConfirm.id);
            } else {
                await orgUnitService.deleteOrgUnitType(deleteConfirm.id);
            }
            addNotification({ type: 'success', title: 'Deleted', message: `"${deleteConfirm.name}" deleted` });
            setDeleteConfirm(null);
            fetchData();
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || error.message || 'Failed to delete' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddRelation = async (parentId: string, childId: string) => {
        if (!parentId || !childId) return;
        try {
            setActionLoading(true);
            await orgUnitService.addTypeRelation(parentId, childId);
            const parent = orgUnitTypes.find(t => t.id === parentId);
            const child = orgUnitTypes.find(t => t.id === childId);
            // Optimistic update — add to local state
            setRelations(prev => [...prev, {
                parentTypeId: parentId, childTypeId: childId,
                parentTypeName: parent?.name || '', childTypeName: child?.name || '',
                parentTypeCode: parent?.code || '', childTypeCode: child?.code || ''
            }]);
            setInlineAddChild('');
            setInlineAddParent(null);
            addNotification({ type: 'success', title: 'Rule Added', message: `${parent?.name} → ${child?.name}` });
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || error.message || 'Failed to add relation' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateRule = async () => {
        if (!newRuleParent || newRuleChildren.length === 0) {
            addNotification({ type: 'error', title: 'Validation', message: 'Select a parent and at least one child type' });
            return;
        }
        try {
            setActionLoading(true);
            const parent = orgUnitTypes.find(t => t.id === newRuleParent);
            const newEntries: TypeRelation[] = [];
            for (const childId of newRuleChildren) {
                await orgUnitService.addTypeRelation(newRuleParent, childId);
                const child = orgUnitTypes.find(t => t.id === childId);
                newEntries.push({
                    parentTypeId: newRuleParent, childTypeId: childId,
                    parentTypeName: parent?.name || '', childTypeName: child?.name || '',
                    parentTypeCode: parent?.code || '', childTypeCode: child?.code || ''
                });
            }
            // Optimistic update — add all new entries
            setRelations(prev => [...prev, ...newEntries]);
            addNotification({ type: 'success', title: 'Rules Created', message: `Added ${newRuleChildren.length} child type(s) to "${parent?.name}"` });
            setNewRuleParent('');
            setNewRuleChildren([]);
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || error.message || 'Failed to create rules' });
            fetchData(); // re-sync on partial failure
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveRelation = async (parentId: string, childId: string) => {
        try {
            setActionLoading(true);
            await orgUnitService.removeTypeRelation(parentId, childId);
            // Optimistic update — remove from local state
            setRelations(prev => prev.filter(r => !(r.parentTypeId === parentId && r.childTypeId === childId)));
            addNotification({ type: 'success', title: 'Removed', message: 'Child type removed' });
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || error.message || 'Failed to remove relation' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteWholeRule = async (parentId: string, childIds: string[]) => {
        try {
            setActionLoading(true);
            for (const childId of childIds) {
                await orgUnitService.removeTypeRelation(parentId, childId);
            }
            // Optimistic update — remove all children for this parent
            setRelations(prev => prev.filter(r => r.parentTypeId !== parentId));
            const parentName = orgUnitTypes.find(t => t.id === parentId)?.name;
            addNotification({ type: 'success', title: 'Rule Deleted', message: `All children removed from "${parentName}"` });
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || error.message || 'Failed to delete rule' });
            fetchData(); // re-sync on partial failure
        } finally {
            setActionLoading(false);
        }
    };

    // Modal openers
    const openTypeModal = (type?: OrgUnitTypeResponse) => {
        if (type) {
            setEditingType(type);
            setTypeForm({
                name: type.name, code: type.code, description: type.description || '',
                color: type.color || 'slate',
                canHaveChildren: type.canHaveChildren, canHaveMembers: type.canHaveMembers,
                isSystem: type.isSystem
            });
        } else {
            setEditingType(null);
            setTypeForm({
                name: '', code: '', description: '', color: 'emerald',
                canHaveChildren: true, canHaveMembers: true, isSystem: false
            });
        }
        setIsTypeModalOpen(true);
    };

    const openGroupTypeModal = (type?: OrgUnitGroupTypeResponse) => {
        if (type) {
            setEditingGroupType(type);
            setGroupTypeForm({
                name: type.name, code: type.code, description: type.description || '',
                color: type.color || 'slate', isSystem: type.isSystem
            });
        } else {
            setEditingGroupType(null);
            setGroupTypeForm({ name: '', code: '', description: '', color: 'indigo', isSystem: false });
        }
        setIsGroupTypeModalOpen(true);
    };

    // Group relations by parent for visual display
    const groupedRelations = orgUnitTypes
        .filter(t => t.canHaveChildren && t.isActive)
        .map(parent => {
            const childIds = relations
                .filter(r => r.parentTypeId === parent.id)
                .map(r => r.childTypeId);
            return {
                parent,
                children: childIds
                    .map(id => orgUnitTypes.find(t => t.id === id))
                    .filter(Boolean) as OrgUnitTypeResponse[],
                availableChildren: orgUnitTypes.filter(t => t.isActive && t.id !== parent.id && !childIds.includes(t.id))
            };
        });

    if (!canManageConfig) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 pb-4 border-b">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <button onClick={() => router.push('/admin/organization')} className="hover:text-foreground transition-colors flex items-center gap-1">
                            <ArrowLeft className="h-3 w-3" />
                            Back to Organization
                        </button>
                    </div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Settings className="h-8 w-8 text-primary" />
                        Organization Configuration
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage unit types, hierarchy rules, and group types</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <Tabs defaultValue="unit-types" className="max-w-6xl mx-auto">
                    <TabsList className="grid w-full grid-cols-3 max-w-[550px]">
                        <TabsTrigger value="unit-types" className="gap-1.5">
                            <Network className="h-3.5 w-3.5" />
                            Unit Types
                        </TabsTrigger>
                        <TabsTrigger value="hierarchy" className="gap-1.5">
                            <GitBranch className="h-3.5 w-3.5" />
                            Hierarchy Rules
                        </TabsTrigger>
                        <TabsTrigger value="group-types" className="gap-1.5">
                            <Shield className="h-3.5 w-3.5" />
                            Group Types
                        </TabsTrigger>
                    </TabsList>

                    {/* ==================== UNIT TYPES TAB ==================== */}
                    <TabsContent value="unit-types" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Organization Unit Types</CardTitle>
                                    <CardDescription>
                                        Define the building blocks of your hierarchy (e.g. Directorate, Department, Team).
                                    </CardDescription>
                                </div>
                                <Button size="sm" className="gap-2" onClick={() => openTypeModal()}>
                                    <Plus className="h-4 w-4" />
                                    Create Type
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="py-12 flex justify-center"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                                ) : (
                                    <div className="rounded-md border overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium text-left text-muted-foreground">Name</th>
                                                    <th className="px-4 py-3 font-medium text-left text-muted-foreground">Code</th>
                                                    <th className="px-4 py-3 font-medium text-center text-muted-foreground">Capabilities</th>
                                                    <th className="px-4 py-3 font-medium text-center text-muted-foreground">Protection</th>
                                                    <th className="px-4 py-3 font-medium text-center text-muted-foreground">Status</th>
                                                    <th className="px-4 py-3 font-medium text-center text-muted-foreground">Usage</th>
                                                    <th className="px-4 py-3 font-medium text-right text-muted-foreground">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {orgUnitTypes.map(type => (
                                                    <tr key={type.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${getTypeColorClass(type.color)}`}>
                                                                    <Network className="h-3.5 w-3.5" />
                                                                </div>
                                                                <span className="font-medium">{type.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{type.code}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                {type.canHaveChildren && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <Badge variant="outline" className="text-[10px] gap-1">
                                                                                Children
                                                                            </Badge>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Can have child organizational units</TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {type.canHaveMembers && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <Badge variant="outline" className="text-[10px] gap-1">
                                                                                Members
                                                                            </Badge>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Can directly assign members/employees</TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {!type.canHaveChildren && !type.canHaveMembers && (
                                                                    <span className="text-xs text-muted-foreground">—</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {type.isSystem ? (
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <Badge variant="secondary" className="text-[10px] gap-1">
                                                                            <Lock className="h-2.5 w-2.5" />
                                                                            System
                                                                        </Badge>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>System type — protected from deletion</TooltipContent>
                                                                </Tooltip>
                                                            ) : (
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                                                                            <Unlock className="h-2.5 w-2.5" />
                                                                            Custom
                                                                        </Badge>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Custom type — can be deleted</TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {type.isActive ? (
                                                                <Badge variant="secondary" className="text-[10px]">Active</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-xs text-muted-foreground font-mono">{type.usageCount}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-0.5">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openTypeModal(type)}>
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Edit</TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon" disabled={type.isSystem} className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => !type.isSystem && setDeleteConfirm({ id: type.id, name: type.name, isGroup: false })}>
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{type.isSystem ? 'System types cannot be deleted' : 'Delete'}</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {orgUnitTypes.length === 0 && (
                                                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No unit types defined.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ==================== HIERARCHY RULES TAB ==================== */}
                    <TabsContent value="hierarchy" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GitBranch className="h-5 w-5 text-primary" />
                                    Hierarchy Rules
                                </CardTitle>
                                <CardDescription>
                                    Define which unit types can contain which child types. For example: "Organization can have Divisions and Directorates."
                                    When creating a child OU, only the allowed child types will appear in the dropdown.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Create new rule form */}
                                <div className="rounded-lg border p-4 space-y-3">
                                    <Label className="text-sm font-medium">Create New Rule</Label>
                                    <div className="flex items-start gap-3">
                                        <div className="w-[200px] space-y-1">
                                            <Label className="text-xs text-muted-foreground">Parent Type</Label>
                                            <Select value={newRuleParent} onValueChange={(v) => { setNewRuleParent(v); setNewRuleChildren([]); }}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Select parent..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {orgUnitTypes.filter(t => t.canHaveChildren && t.isActive).map(t => (
                                                        <SelectItem key={t.id} value={t.id}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-3 h-3 rounded ${getTypeColorClass(t.color)}`} />
                                                                {t.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs text-muted-foreground">Child Types</Label>
                                            {newRuleParent ? (
                                                <div className="flex flex-wrap gap-2 min-h-[36px] p-2 rounded-md border bg-background">
                                                    {orgUnitTypes
                                                        .filter(t => t.isActive && t.id !== newRuleParent && !relations.some(r => r.parentTypeId === newRuleParent && r.childTypeId === t.id))
                                                        .map(t => {
                                                            const isSelected = newRuleChildren.includes(t.id);
                                                            return (
                                                                <button
                                                                    key={t.id}
                                                                    onClick={() => setNewRuleChildren(isSelected
                                                                        ? newRuleChildren.filter(id => id !== t.id)
                                                                        : [...newRuleChildren, t.id]
                                                                    )}
                                                                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                                                                        isSelected
                                                                            ? 'border-primary bg-primary/10 text-primary font-medium'
                                                                            : 'border-border hover:bg-muted/50 text-muted-foreground'
                                                                    }`}
                                                                >
                                                                    <div className={`w-3 h-3 rounded ${getTypeColorClass(t.color)}`} />
                                                                    {t.name}
                                                                    {isSelected && <Check className="h-3 w-3" />}
                                                                </button>
                                                            );
                                                        })}
                                                    {orgUnitTypes.filter(t => t.isActive && t.id !== newRuleParent && !relations.some(r => r.parentTypeId === newRuleParent && r.childTypeId === t.id)).length === 0 && (
                                                        <span className="text-xs text-muted-foreground italic">All types already added</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="h-9 flex items-center px-3 rounded-md border text-xs text-muted-foreground">
                                                    Select a parent type first
                                                </div>
                                            )}
                                        </div>
                                        <div className="pt-5">
                                            <Button onClick={handleCreateRule} disabled={actionLoading || !newRuleParent || newRuleChildren.length === 0} size="sm" className="gap-1.5">
                                                <Plus className="h-3.5 w-3.5" />
                                                Create Rule
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Relations grouped by parent */}
                                {loading ? (
                                    <div className="py-12 flex justify-center"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                                ) : groupedRelations.filter(g => g.children.length > 0).length === 0 ? (
                                    <div className="py-8 text-center">
                                        <p className="text-sm text-muted-foreground">No rules defined yet. Use the form above to create hierarchy rules.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {groupedRelations.filter(g => g.children.length > 0).map(({ parent, children, availableChildren }) => (
                                            <div key={parent.id} className="rounded-lg border overflow-hidden">
                                                <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${getTypeColorClass(parent.color)}`}>
                                                            <Network className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-sm">{parent.name}</span>
                                                            <span className="text-xs text-muted-foreground ml-2">can contain:</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {/* Inline add child */}
                                                        {availableChildren.length > 0 && (
                                                            inlineAddParent === parent.id ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Select value={inlineAddChild} onValueChange={setInlineAddChild}>
                                                                        <SelectTrigger className="h-8 w-[180px] text-xs">
                                                                            <SelectValue placeholder="Select child..." />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {availableChildren.map(t => (
                                                                                <SelectItem key={t.id} value={t.id}>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className={`w-3 h-3 rounded ${getTypeColorClass(t.color)}`} />
                                                                                        {t.name}
                                                                                    </div>
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Button size="sm" variant="default" className="h-8 text-xs" disabled={!inlineAddChild || actionLoading}
                                                                        onClick={() => { handleAddRelation(parent.id, inlineAddChild); }}
                                                                    >
                                                                        Add
                                                                    </Button>
                                                                    <Button size="sm" variant="ghost" className="h-8 text-xs px-2"
                                                                        onClick={() => { setInlineAddParent(null); setInlineAddChild(''); }}
                                                                    >
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                                                                    onClick={() => { setInlineAddParent(parent.id); setInlineAddChild(''); }}
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                    Add Child
                                                                </Button>
                                                            )
                                                        )}
                                                        {/* Delete whole rule */}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => handleDeleteWholeRule(parent.id, children.map(c => c.id))}
                                                                    disabled={children.length === 0 || actionLoading}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete entire rule (remove all children)</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-2 flex flex-wrap gap-2">
                                                    {children.map(child => (
                                                        <div key={child.id} className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 bg-background hover:bg-muted/30 transition-colors group">
                                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${getTypeColorClass(child.color)}`}>
                                                                <ChevronRight className="h-2.5 w-2.5" />
                                                            </div>
                                                            <span className="text-sm font-medium">{child.name}</span>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => handleRemoveRelation(parent.id, child.id)}
                                                                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                                    >
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Remove this rule</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    ))}
                                                    {children.length === 0 && (
                                                        <span className="text-sm text-muted-foreground italic py-1">No children — click &quot;Add Child&quot; to configure</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Info box — simple readable style */}
                                <p className="text-xs text-muted-foreground mt-4">
                                    When creating a child unit, only the child types listed here for that parent&apos;s type appear in the dropdown.
                                    New types with no rules won&apos;t appear as an option.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ==================== GROUP TYPES TAB ==================== */}
                    <TabsContent value="group-types" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Operational Group Types</CardTitle>
                                    <CardDescription>
                                        Define categories for ad-hoc operational groups (e.g. Committee, Task Force, Project Team).
                                    </CardDescription>
                                </div>
                                <Button size="sm" className="gap-2" onClick={() => openGroupTypeModal()}>
                                    <Plus className="h-4 w-4" />
                                    Create Type
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="py-12 flex justify-center"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                                ) : (
                                    <div className="rounded-md border overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium text-left text-muted-foreground">Name</th>
                                                    <th className="px-4 py-3 font-medium text-left text-muted-foreground">Code</th>
                                                    <th className="px-4 py-3 font-medium text-center text-muted-foreground">Protection</th>
                                                    <th className="px-4 py-3 font-medium text-center text-muted-foreground">Status</th>
                                                    <th className="px-4 py-3 font-medium text-right text-muted-foreground">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {groupTypes.map(type => (
                                                    <tr key={type.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${getTypeColorClass(type.color)}`}>
                                                                    <Shield className="h-3.5 w-3.5" />
                                                                </div>
                                                                <span className="font-medium">{type.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{type.code}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            {type.isSystem ? (
                                                                <Badge variant="secondary" className="text-[10px] gap-1">
                                                                    <Lock className="h-2.5 w-2.5" />
                                                                    System
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                                                                    <Unlock className="h-2.5 w-2.5" />
                                                                    Custom
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {type.isActive ? (
                                                                <Badge variant="secondary" className="text-[10px]">Active</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-0.5">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openGroupTypeModal(type)}>
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Edit</TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon" disabled={type.isSystem} className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => !type.isSystem && setDeleteConfirm({ id: type.id, name: type.name, isGroup: true })}>
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{type.isSystem ? 'System types cannot be deleted' : 'Delete'}</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {groupTypes.length === 0 && (
                                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No group types defined.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* ==================== Delete Confirmation ==================== */}
            <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the type &quot;{deleteConfirm?.name}&quot;?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={actionLoading}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />}
                            Delete Type
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==================== Create/Edit Unit Type Modal ==================== */}
            <Dialog open={isTypeModalOpen} onOpenChange={setIsTypeModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingType ? 'Edit Unit Type' : 'Create Unit Type'}</DialogTitle>
                        <DialogDescription>Define an organizational unit classification.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name <span className="text-red-500">*</span></Label>
                                <Input
                                    value={typeForm.name}
                                    onChange={e => setTypeForm({ ...typeForm, name: e.target.value })}
                                    placeholder="e.g. Department"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Code <span className="text-red-500">*</span></Label>
                                <Input
                                    value={typeForm.code}
                                    onChange={e => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g. DEPT"
                                    disabled={!!editingType}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={typeForm.description}
                                onChange={e => setTypeForm({ ...typeForm, description: e.target.value })}
                                placeholder="Optional description..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Color Theme</Label>
                            <Select value={typeForm.color} onValueChange={val => setTypeForm({ ...typeForm, color: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a color theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(COLOR_THEMES).map(color => (
                                        <SelectItem key={color} value={color}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full ${COLOR_THEMES[color]}`}></div>
                                                <span className="capitalize">{color} Theme</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3 pt-2 border-t">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Capabilities & Protection</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="canHaveChildren"
                                    checked={typeForm.canHaveChildren}
                                    onCheckedChange={(c) => setTypeForm({ ...typeForm, canHaveChildren: !!c })}
                                />
                                <Label htmlFor="canHaveChildren" className="font-normal cursor-pointer">
                                    Can have child units (e.g. a Directorate can have Departments under it)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="canHaveMembers"
                                    checked={typeForm.canHaveMembers}
                                    onCheckedChange={(c) => setTypeForm({ ...typeForm, canHaveMembers: !!c })}
                                />
                                <Label htmlFor="canHaveMembers" className="font-normal cursor-pointer">
                                    Can have direct members assigned (employees can be added to this type)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isSystem"
                                    checked={typeForm.isSystem}
                                    onCheckedChange={(c) => setTypeForm({ ...typeForm, isSystem: !!c })}
                                />
                                <Label htmlFor="isSystem" className="font-normal cursor-pointer flex items-center gap-1.5">
                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                    Mark as system type (protected from deletion)
                                </Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTypeModalOpen(false)} disabled={actionLoading}>Cancel</Button>
                        <Button onClick={handleSaveType} disabled={actionLoading || !typeForm.name || !typeForm.code}>
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />}
                            {editingType ? 'Save Changes' : 'Create Type'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==================== Create/Edit Group Type Modal ==================== */}
            <Dialog open={isGroupTypeModalOpen} onOpenChange={setIsGroupTypeModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingGroupType ? 'Edit Group Type' : 'Create Group Type'}</DialogTitle>
                        <DialogDescription>Define an operational group category.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name <span className="text-red-500">*</span></Label>
                                <Input
                                    value={groupTypeForm.name}
                                    onChange={e => setGroupTypeForm({ ...groupTypeForm, name: e.target.value })}
                                    placeholder="e.g. Committee"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Code <span className="text-red-500">*</span></Label>
                                <Input
                                    value={groupTypeForm.code}
                                    onChange={e => setGroupTypeForm({ ...groupTypeForm, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g. COMM"
                                    disabled={!!editingGroupType}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={groupTypeForm.description}
                                onChange={e => setGroupTypeForm({ ...groupTypeForm, description: e.target.value })}
                                placeholder="Optional description..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Color Theme</Label>
                            <Select value={groupTypeForm.color} onValueChange={val => setGroupTypeForm({ ...groupTypeForm, color: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a color theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(COLOR_THEMES).map(color => (
                                        <SelectItem key={color} value={color}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full ${COLOR_THEMES[color]}`}></div>
                                                <span className="capitalize">{color} Theme</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="groupIsSystem"
                                    checked={groupTypeForm.isSystem}
                                    onCheckedChange={(c) => setGroupTypeForm({ ...groupTypeForm, isSystem: !!c })}
                                />
                                <Label htmlFor="groupIsSystem" className="font-normal cursor-pointer flex items-center gap-1.5">
                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                    Mark as system type (protected from deletion)
                                </Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGroupTypeModalOpen(false)} disabled={actionLoading}>Cancel</Button>
                        <Button onClick={handleSaveGroupType} disabled={actionLoading || !groupTypeForm.name || !groupTypeForm.code}>
                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />}
                            {editingGroupType ? 'Save Changes' : 'Create Type'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
