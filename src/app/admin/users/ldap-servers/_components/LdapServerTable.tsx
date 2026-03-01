'use client';

import React from 'react';
import {
    Server,
    ChevronDown,
    ChevronRight,
    Lock,
    Unlock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Wrench,
    TestTube,
    Edit,
    Trash2,
    RefreshCw,
    Plus,
    Tag,
    BarChart3,
    Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { getStatusColor, getSecurityLabel, type LdapServer } from './ldap-types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface LdapServerTableProps {
    servers: LdapServer[];
    loading: boolean;
    selectedItems: string[];
    expandedServers: string[];
    syncingServers: string[];
    testingServers: string[];
    onToggleSelect: (serverId: string) => void;
    onToggleSelectAll: () => void;
    onToggleExpand: (serverId: string) => void;
    onEdit: (server: LdapServer) => void;
    onDelete: (server: LdapServer) => void;
    onSync: (serverId: string) => void;
    onTest: (serverId: string) => void;
    onAddServer: () => void;
    searchQuery: string;
    hasActiveFilters: boolean;
}

// ─── Status icon mapping ─────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'Connected':
            return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
        case 'Disconnected':
            return <XCircle className="h-3.5 w-3.5 text-gray-400" />;
        case 'Error':
            return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
        case 'Testing':
            return <TestTube className="h-3.5 w-3.5 text-amber-500" />;
        case 'Maintenance':
            return <Wrench className="h-3.5 w-3.5 text-orange-500" />;
        default:
            return <AlertCircle className="h-3.5 w-3.5 text-gray-400" />;
    }
}

// ─── Skeleton rows ───────────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                    <td className="p-4 w-12"><Skeleton className="h-4 w-4" /></td>
                    <td className="p-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1.5">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                    </td>
                    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-10" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                </tr>
            ))}
        </>
    );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({
    hasFilters,
    onAddServer,
}: {
    hasFilters: boolean;
    onAddServer: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="h-20 w-20 rounded-2xl bg-muted/80 flex items-center justify-center mb-6">
                <Server className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No LDAP servers found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                {hasFilters
                    ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                    : 'Get started by adding your first LDAP server to connect users from your directory.'}
            </p>
            {!hasFilters && (
                <Button onClick={onAddServer} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Server
                </Button>
            )}
        </div>
    );
}

// ─── Expanded detail row ─────────────────────────────────────────────────────

function ExpandedDetails({ server }: { server: LdapServer }) {
    const formatDate = (dateString: string): string => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <tr className="bg-muted/10 border-b">
            <td colSpan={8} className="p-0">
                <div className="p-5 pl-20 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-1 duration-200">
                    {/* Server Config */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <Server className="h-4 w-4 text-primary" />
                            Server Configuration
                        </h4>
                        <div className="space-y-2 text-sm">
                            {[
                                ['Base DN', server.baseDN, true],
                                ['Bind DN', server.bindDN, true],
                                ['SSL Port', server.sslPort],
                                ['Timeout', `${server.connectionTimeout}s`],
                                ['Created by', server.createdBy],
                            ].map(([label, value, mono]) => (
                                <div key={String(label)} className="flex justify-between items-start gap-2">
                                    <span className="text-muted-foreground shrink-0">{String(label)}</span>
                                    <span className={`text-right ${mono ? 'font-mono text-xs' : ''} break-all`}>
                                        {String(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Attribute Mapping */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <Tag className="h-4 w-4 text-primary" />
                            Attribute Mapping
                        </h4>
                        <div className="space-y-2 text-sm">
                            {Object.entries(server.attributes).length > 0 ? (
                                Object.entries(server.attributes).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center gap-2">
                                        <span className="text-muted-foreground capitalize">{key}</span>
                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{value}</code>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground italic">No mappings configured</p>
                            )}
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Statistics
                        </h4>
                        <div className="space-y-2 text-sm">
                            {[
                                ['Sync Count', server.syncCount],
                                ['Error Count', server.errorCount, server.errorCount > 0 ? 'text-red-500' : ''],
                                ['Users', server.userCount],
                                ['Groups', server.groupCount],
                                ['Last Test', formatDate(server.lastTest)],
                                ['Last Modified', formatDate(server.lastModified)],
                            ].map(([label, value, colorClass]) => (
                                <div key={String(label)} className="flex justify-between items-center gap-2">
                                    <span className="text-muted-foreground">{String(label)}</span>
                                    <span className={String(colorClass || '')}>{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    );
}

// ─── Main table ──────────────────────────────────────────────────────────────

export default function LdapServerTable({
    servers,
    loading,
    selectedItems,
    expandedServers,
    syncingServers,
    testingServers,
    onToggleSelect,
    onToggleSelectAll,
    onToggleExpand,
    onEdit,
    onDelete,
    onSync,
    onTest,
    onAddServer,
    searchQuery,
    hasActiveFilters,
}: LdapServerTableProps) {
    const allSelected = servers.length > 0 && selectedItems.length === servers.length;
    const someSelected = selectedItems.length > 0 && selectedItems.length < servers.length;

    const formatDate = (dateString: string): string => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full" role="grid" aria-label="LDAP servers list">
                    <thead className="bg-muted/40 border-b">
                        <tr>
                            <th className="text-left p-4 w-12">
                                <Checkbox
                                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                    onCheckedChange={onToggleSelectAll}
                                    aria-label="Select all servers"
                                />
                            </th>
                            <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Server
                            </th>
                            <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Hostname
                            </th>
                            <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Security
                            </th>
                            <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Status
                            </th>
                            <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Users
                            </th>
                            <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Last Sync
                            </th>
                            <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <TableSkeleton />
                        ) : servers.length === 0 ? (
                            <tr>
                                <td colSpan={8}>
                                    <EmptyState
                                        hasFilters={!!searchQuery || hasActiveFilters}
                                        onAddServer={onAddServer}
                                    />
                                </td>
                            </tr>
                        ) : (
                            servers.map((server) => {
                                const isExpanded = expandedServers.includes(server.id);
                                const isSelected = selectedItems.includes(server.id);
                                const isSyncing = syncingServers.includes(server.id);
                                const isTesting = testingServers.includes(server.id);

                                return (
                                    <React.Fragment key={server.id}>
                                        <tr
                                            className={`border-b transition-colors duration-150 ${isSelected
                                                ? 'bg-primary/5'
                                                : 'hover:bg-muted/30'
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="p-4">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => onToggleSelect(server.id)}
                                                    aria-label={`Select ${server.name}`}
                                                />
                                            </td>

                                            {/* Server name */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => onToggleExpand(server.id)}
                                                        className="p-1 rounded-md hover:bg-muted transition-colors shrink-0"
                                                        aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                                                        aria-expanded={isExpanded}
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </button>
                                                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                                        <Server className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium flex items-center gap-1.5 truncate">
                                                            {server.name}
                                                            {server.isSecure && (
                                                                <Lock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground truncate max-w-[200px] flex items-center gap-1.5">
                                                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-medium shrink-0">
                                                                {server.serverType || 'AD'}
                                                            </span>
                                                            {server.description && (
                                                                <span className="truncate">{server.description}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Hostname */}
                                            <td className="p-4">
                                                <div className="font-mono text-sm">{server.hostname}</div>
                                                <div className="text-xs text-muted-foreground">Port: {server.port}</div>
                                            </td>

                                            {/* Security */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5">
                                                    {server.isSecure ? (
                                                        <Lock className="h-3.5 w-3.5 text-emerald-500" />
                                                    ) : (
                                                        <Unlock className="h-3.5 w-3.5 text-red-400" />
                                                    )}
                                                    <span className="text-sm">{getSecurityLabel(server)}</span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="p-4">
                                                <Badge
                                                    variant="outline"
                                                    className={`gap-1.5 font-medium ${getStatusColor(server.status)}`}
                                                >
                                                    <StatusIcon status={server.status} />
                                                    {server.status}
                                                </Badge>
                                            </td>

                                            {/* Users */}
                                            <td className="p-4">
                                                <span className="text-sm font-medium">{server.userCount.toLocaleString()}</span>
                                            </td>

                                            {/* Last Sync */}
                                            <td className="p-4">
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(server.lastSync)}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-0.5">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => onEdit(server)}
                                                                aria-label={`Edit ${server.name}`}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Edit</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => onSync(server.id)}
                                                                disabled={isSyncing}
                                                                aria-label={`Sync ${server.name}`}
                                                            >
                                                                {isSyncing ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <RefreshCw className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{isSyncing ? 'Syncing...' : 'Sync Now'}</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => onTest(server.id)}
                                                                disabled={isTesting}
                                                                aria-label={`Test connection for ${server.name}`}
                                                            >
                                                                {isTesting ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <TestTube className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{isTesting ? 'Testing...' : 'Test Connection'}</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                onClick={() => onDelete(server)}
                                                                aria-label={`Delete ${server.name}`}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Delete</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded details */}
                                        {isExpanded && <ExpandedDetails server={server} />}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
