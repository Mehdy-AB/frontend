'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Shield, LayoutDashboard, Users, UsersRound, Briefcase, Building2,
    ChevronDown, RefreshCw, AlertCircle, Handshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getTypeColorClass } from '@/api/services/orgUnitService';
import { myScopeService, type MyScopeUnitDto } from '@/api/services/myScopeService';
import { useNotification } from '@/contexts/NotificationContext';

// Tab components
import OverviewTab from './OverviewTab';
import MembersTab from './MembersTab';
import ScopeGroupsTab from './ScopeGroupsTab';
import PositionsTab from './PositionsTab';
import ChildrenTab from './ChildrenTab';
import DelegationTab from './DelegationTab';

// ==================== Tab Config ====================

interface TabConfig {
    id: string;
    label: string;
    icon: React.ReactNode;
    requiredPermissions: string[];
}

const ALL_TABS: TabConfig[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" />, requiredPermissions: [] },
    { id: 'members', label: 'Members', icon: <Users className="h-4 w-4" />, requiredPermissions: ['scope:view-members'] },
    { id: 'groups', label: 'Groups', icon: <UsersRound className="h-4 w-4" />, requiredPermissions: ['scope:view-groups'] },
    { id: 'positions', label: 'Positions', icon: <Briefcase className="h-4 w-4" />, requiredPermissions: ['scope:view-positions'] },
    { id: 'children', label: 'Children', icon: <Building2 className="h-4 w-4" />, requiredPermissions: ['scope:view-children'] },
    { id: 'delegations', label: 'Delegations', icon: <Handshake className="h-4 w-4" />, requiredPermissions: ['scope:view-delegations'] },
];

// ==================== Notification System ====================

interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

// ==================== Main Component ====================

export default function MyScopePage() {
    // Core state
    const [units, setUnits] = useState<MyScopeUnitDto[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const { addNotification } = useNotification();

    // ==================== Fetchers ====================

    const fetchUnits = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await myScopeService.getMyUnits();
            setUnits(data);
            if (data.length > 0 && !selectedUnitId) {
                setSelectedUnitId(data[0].orgUnitId);
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to load scoped units');
        } finally { setLoading(false); }
    }, [selectedUnitId]);

    useEffect(() => { fetchUnits(); }, []);

    // ==================== Derived State ====================

    const selectedUnit = units.find(u => u.orgUnitId === selectedUnitId) || null;
    const perms = new Set(selectedUnit?.resolvedPermissions || []);
    const typeColorClass = getTypeColorClass(selectedUnit?.orgUnitTypeColor);

    const visibleTabs = ALL_TABS.filter(tab => {
        return tab.requiredPermissions.length === 0 || tab.requiredPermissions.some(p => perms.has(p));
    });

    // Ensure active tab is valid
    useEffect(() => {
        if (!visibleTabs.find(t => t.id === activeTab)) {
            setActiveTab(visibleTabs[0]?.id || 'overview');
        }
    }, [visibleTabs, activeTab]);

    // ==================== Render ====================

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading your scope...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h2 className="text-lg font-semibold mb-2">Error Loading Scope</h2>
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <Button onClick={() => fetchUnits()} className="gap-1.5">
                            <RefreshCw className="h-4 w-4" /> Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (units.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                        <h2 className="text-lg font-semibold mb-2">No Scope Assigned</h2>
                        <p className="text-sm text-muted-foreground">
                            You are not currently assigned as a head or unit administrator of any organizational unit.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 max-w-[1400px] mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">My Scope</h1>
                        <p className="text-xs text-muted-foreground">Manage your organizational units</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {units.length > 1 && (
                        <Select value={selectedUnitId || undefined} onValueChange={id => { setSelectedUnitId(id); setActiveTab('overview'); }}>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Select unit..." />
                            </SelectTrigger>
                            <SelectContent>
                                {units.map(u => (
                                    <SelectItem key={u.orgUnitId} value={u.orgUnitId}>
                                        <div className="flex items-center gap-2">
                                            <span>{u.orgUnitName}</span>
                                            {u.orgUnitTypeName && (
                                                <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 ${getTypeColorClass(u.orgUnitTypeColor)}`}>
                                                    {u.orgUnitTypeName}
                                                </Badge>
                                            )}
                                            <Badge variant="secondary" className={`text-[10px] px-1 py-0 h-4 ${
                                                u.leadershipRole === 'ROLE_ASSIGNED'
                                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                            }`}>
                                                {u.leadershipRole === 'ROLE_ASSIGNED' ? 'Unit Admin' : u.leadershipRole === 'HEAD' ? 'Head' : u.leadershipRole}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    {units.length === 1 && selectedUnit && (
                        <div className="flex items-center gap-2 mr-2">
                            <Badge variant="outline" className={`text-xs ${typeColorClass}`}>
                                {selectedUnit.orgUnitTypeName || 'Unit'}
                            </Badge>
                            <span className="font-medium text-sm">{selectedUnit.orgUnitName}</span>
                        </div>
                    )}
                    <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => { fetchUnits(); setRefreshTrigger(prev => prev + 1); }} title="Refresh">
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            {selectedUnit && (
                <>
                    <div className="border-b">
                        <nav className="flex gap-0.5 overflow-x-auto -mb-px">
                            {visibleTabs.map(tab => (
                                <button key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                                        }`}>
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="pt-1">
                        {activeTab === 'overview' && (
                            <OverviewTab unit={selectedUnit} typeColorClass={typeColorClass} />
                        )}
                        {activeTab === 'members' && (
                            <MembersTab
                                ouId={selectedUnit.orgUnitId}
                                ouName={selectedUnit.orgUnitName}
                                canManage={perms.has('scope:manage-members')}
                                canSetManager={perms.has('scope:manage-members')}
                                addNotification={addNotification}
                                refreshTrigger={refreshTrigger}
                                headUserId={selectedUnit.headUserId}
                            />
                        )}
                        {activeTab === 'groups' && (
                            <ScopeGroupsTab
                                ouId={selectedUnit.orgUnitId}
                                canCreate={perms.has('scope:create-groups')}
                                canManage={perms.has('scope:manage-groups')}
                                addNotification={addNotification}
                                refreshTrigger={refreshTrigger}
                            />
                        )}
                        {activeTab === 'positions' && (
                            <PositionsTab
                                ouId={selectedUnit.orgUnitId}
                                canManage={perms.has('scope:manage-positions')}
                                addNotification={addNotification}
                                refreshTrigger={refreshTrigger}
                            />
                        )}
                        {activeTab === 'children' && (
                            <ChildrenTab
                                ouId={selectedUnit.orgUnitId}
                                canViewChildMembers={perms.has('scope:view-child-members')}
                                canViewDescendants={perms.has('scope:view-descendants')}
                                canManageChildMembers={perms.has('scope:manage-child-members')}
                                addNotification={addNotification}
                                refreshTrigger={refreshTrigger}
                            />
                        )}
                        {activeTab === 'delegations' && (
                            <DelegationTab
                                ouId={selectedUnit.orgUnitId}
                                ouName={selectedUnit.orgUnitName}
                                canManage={perms.has('scope:manage-delegations')}
                                addNotification={addNotification}
                                refreshTrigger={refreshTrigger}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
