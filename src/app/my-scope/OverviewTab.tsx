'use client';

import React from 'react';
import { Shield, Users, Building2, UsersRound, Briefcase, Eye, Settings, Network } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MyScopeUnitDto } from '@/api/services/myScopeService';

// ==================== Permission Labels ====================

const PERMISSION_LABELS: Record<string, { label: string; icon: React.ReactNode; group: string }> = {
    'scope:view-members': { label: 'View Members', icon: <Eye className="h-3 w-3" />, group: 'Members' },
    'scope:manage-members': { label: 'Manage Members', icon: <Settings className="h-3 w-3" />, group: 'Members' },
    'scope:view-groups': { label: 'View Groups', icon: <Eye className="h-3 w-3" />, group: 'Groups' },
    'scope:create-groups': { label: 'Create Groups', icon: <UsersRound className="h-3 w-3" />, group: 'Groups' },
    'scope:manage-groups': { label: 'Manage Groups', icon: <Settings className="h-3 w-3" />, group: 'Groups' },
    'scope:view-positions': { label: 'View Positions', icon: <Eye className="h-3 w-3" />, group: 'Positions' },
    'scope:manage-positions': { label: 'Manage Positions', icon: <Settings className="h-3 w-3" />, group: 'Positions' },
    'scope:view-children': { label: 'View Children', icon: <Eye className="h-3 w-3" />, group: 'Children' },
    'scope:view-child-members': { label: 'View Child Members', icon: <Network className="h-3 w-3" />, group: 'Children' },
};

// ==================== Props ====================

interface OverviewTabProps {
    unit: MyScopeUnitDto;
    typeColorClass: string;
}

// ==================== Component ====================

export default function OverviewTab({ unit, typeColorClass }: OverviewTabProps) {
    const roleLabel = unit.leadershipRole === 'HEAD' ? 'Head' :
        unit.leadershipRole === 'ACTING_HEAD' ? 'Acting Head' :
            unit.leadershipRole === 'DEPUTY_HEAD' ? 'Deputy Head' : unit.leadershipRole;

    // Group permissions
    const permissionGroups: Record<string, { label: string; icon: React.ReactNode }[]> = {};
    for (const perm of unit.resolvedPermissions) {
        const info = PERMISSION_LABELS[perm];
        if (info) {
            if (!permissionGroups[info.group]) permissionGroups[info.group] = [];
            permissionGroups[info.group].push({ label: info.label, icon: info.icon });
        }
    }

    return (
        <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{unit.memberCount}</p>
                            <p className="text-xs text-muted-foreground">Members</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{unit.childCount}</p>
                            <p className="text-xs text-muted-foreground">Child Units</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{unit.resolvedPermissions.length}</p>
                            <p className="text-xs text-muted-foreground">Permissions</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{roleLabel}</p>
                            <p className="text-xs text-muted-foreground">Your Role</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Unit Info */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Unit Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs mb-1">Name</p>
                            <p className="font-medium">{unit.orgUnitName}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs mb-1">Code</p>
                            <p className="font-mono text-xs">{unit.orgUnitCode}</p>
                        </div>
                        {unit.orgUnitTypeName && (
                            <div>
                                <p className="text-muted-foreground text-xs mb-1">Type</p>
                                <Badge variant="outline" className={`text-xs ${typeColorClass}`}>
                                    {unit.orgUnitTypeName}
                                </Badge>
                            </div>
                        )}
                        {unit.orgUnitDescription && (
                            <div className="md:col-span-2">
                                <p className="text-muted-foreground text-xs mb-1">Description</p>
                                <p className="text-sm">{unit.orgUnitDescription}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Capabilities */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Your Capabilities
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {Object.keys(permissionGroups).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No scoped permissions assigned.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(permissionGroups).map(([group, perms]) => (
                                <div key={group} className="space-y-1.5">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {perms.map(p => (
                                            <Badge key={p.label} variant="secondary" className="text-xs gap-1 font-normal">
                                                {p.icon}
                                                {p.label}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
