'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Users, Shield, User as UserIcon, Search, ChevronDown, Building2, Crown, UserCog } from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { UserDto, RoleDto, GroupDto, CreateStepAssignmentRequest } from '@/types/api';
import { orgUnitService, OrgUnitResponse } from '@/api/services/orgUnitService';
import UserAvatar from '@/components/main/UserAvatar';

export type GranteeType = 'user' | 'group' | 'role' | 'org_unit' | 'org_unit_head' | 'creator_responsible';

export interface StepAssignment {
    id: string;
    type: GranteeType;
    entity: UserDto | GroupDto | RoleDto | OrgUnitResponse | { id: string; name: string };
    canEdit: boolean;
}

export interface AssignmentEntity {
    assigneeType: 'USER' | 'ROLE' | 'GROUP' | 'ORG_UNIT' | 'ORG_UNIT_HEAD' | 'CREATOR_RESPONSIBLE';
    assigneeId: string;
    entity: UserDto | GroupDto | RoleDto | OrgUnitResponse | { id: string; name: string };
}

interface AssigneeSelectorProps {
    assignments: StepAssignment[];
    onChange: (assignments: StepAssignment[]) => void;
    label?: string;
    className?: string;
    accentColor?: string;
}

type TabType = 'user' | 'group' | 'role' | 'org_unit' | 'special';

/**
 * AssigneeSelector component
 * Supports USER, ROLE, GROUP, ORG_UNIT, ORG_UNIT_HEAD, and CREATOR_RESPONSIBLE
 */
export default function AssigneeSelector({
    assignments,
    onChange,
    label = 'Assignees',
    className = '',
    accentColor = 'blue',
}: AssigneeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('user');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search when query or tab changes
    const performSearch = useCallback(async () => {
        if (activeTab === 'special') {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const query = searchQuery.trim() || undefined;
            let data: any[] = [];

            switch (activeTab) {
                case 'user':
                    const usersRes = await notificationApiClient.getAllUsers(
                        { page: 0, size: 50, search: query, desc: false },
                        { silent: true }
                    );
                    data = usersRes?.content || [];
                    break;
                case 'group':
                    const groupsRes = await notificationApiClient.getAllGroups(
                        { page: 0, size: 50, name: query, desc: false },
                        { silent: true }
                    );
                    data = groupsRes?.content || [];
                    break;
                case 'role':
                    const rolesRes = await notificationApiClient.getAllRoles(
                        { page: 0, size: 50, name: query, desc: false },
                        { silent: true }
                    );
                    data = rolesRes?.content || [];
                    break;
                case 'org_unit':
                    if (query) {
                        data = await orgUnitService.search(query);
                    } else {
                        data = await orgUnitService.getAllOrgUnits();
                    }
                    break;
            }

            // Filter out already assigned
            const assignedIds = new Set(assignments.map(a => `${a.type}-${a.entity?.id}`));
            setResults(data.filter(item => {
                // For org_unit tab, check both org_unit and org_unit_head types
                if (activeTab === 'org_unit') {
                    return !assignedIds.has(`org_unit-${item.id}`) && !assignedIds.has(`org_unit_head-${item.id}`);
                }
                return !assignedIds.has(`${activeTab}-${item.id}`);
            }));
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, activeTab, assignments]);

    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(performSearch, 250);
        return () => clearTimeout(timer);
    }, [performSearch, isOpen]);

    // Open dropdown
    const handleOpen = () => {
        setIsOpen(true);
        setSearchQuery('');
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    // Add assignment
    const addAssignment = (entity: any, type: GranteeType) => {
        const id = `${type}-${entity.id}`;
        if (assignments.some(a => a.id === id)) return;
        onChange([...assignments, { id, type, entity, canEdit: true }]);
    };

    // Add org unit as all members
    const addOrgUnitMembers = (orgUnit: OrgUnitResponse) => {
        addAssignment(orgUnit, 'org_unit');
    };

    // Add org unit head
    const addOrgUnitHead = (orgUnit: OrgUnitResponse) => {
        addAssignment(orgUnit, 'org_unit_head');
    };

    // Add creator responsible (dynamic)
    const addCreatorResponsible = () => {
        const id = 'creator_responsible-dynamic';
        if (assignments.some(a => a.id === id)) return;
        onChange([...assignments, {
            id,
            type: 'creator_responsible',
            entity: { id: 'dynamic', name: "Creator's Responsible" } as any,
            canEdit: false,
        }]);
    };

    // Remove assignment
    const removeAssignment = (id: string) => {
        onChange(assignments.filter(a => a.id !== id));
    };

    // Get accent colors
    const getAccentBg = () => {
        const colors: Record<string, string> = {
            blue: 'bg-blue-500', indigo: 'bg-indigo-500', violet: 'bg-violet-500',
            purple: 'bg-purple-500', amber: 'bg-amber-500', orange: 'bg-orange-500',
        };
        return colors[accentColor] || colors.blue;
    };

    const getAccentBorder = () => {
        const colors: Record<string, string> = {
            blue: 'border-blue-500', indigo: 'border-indigo-500', violet: 'border-violet-500',
            purple: 'border-purple-500', amber: 'border-amber-500', orange: 'border-orange-500',
        };
        return colors[accentColor] || colors.blue;
    };

    const getAccentText = () => {
        const colors: Record<string, string> = {
            blue: 'text-blue-600', indigo: 'text-indigo-600', violet: 'text-violet-600',
            purple: 'text-purple-600', amber: 'text-amber-600', orange: 'text-orange-600',
        };
        return colors[accentColor] || colors.blue;
    };

    const tabConfig: { key: TabType; icon: React.ReactNode; label: string }[] = [
        { key: 'user', icon: <UserIcon className="w-3.5 h-3.5" />, label: 'Users' },
        { key: 'group', icon: <Users className="w-3.5 h-3.5" />, label: 'Groups' },
        { key: 'role', icon: <Shield className="w-3.5 h-3.5" />, label: 'Roles' },
        { key: 'org_unit', icon: <Building2 className="w-3.5 h-3.5" />, label: 'Org Unit' },
        { key: 'special', icon: <Crown className="w-3.5 h-3.5" />, label: 'Special' },
    ];

    const getChipIcon = (type: GranteeType) => {
        switch (type) {
            case 'user': return <UserIcon className="w-3.5 h-3.5 text-blue-500" />;
            case 'group': return <Users className="w-3.5 h-3.5 text-green-500" />;
            case 'role': return <Shield className="w-3.5 h-3.5 text-purple-500" />;
            case 'org_unit': return <Building2 className="w-3.5 h-3.5 text-orange-500" />;
            case 'org_unit_head': return <Crown className="w-3.5 h-3.5 text-amber-500" />;
            case 'creator_responsible': return <UserCog className="w-3.5 h-3.5 text-teal-500" />;
        }
    };

    const getChipLabel = (a: StepAssignment) => {
        switch (a.type) {
            case 'user':
                return (a.entity as UserDto).displayName || (a.entity as UserDto).username;
            case 'group':
            case 'role':
                return (a.entity as GroupDto | RoleDto).name;
            case 'org_unit':
                return `${(a.entity as OrgUnitResponse).name} (members)`;
            case 'org_unit_head':
                return `${(a.entity as OrgUnitResponse).name} (head)`;
            case 'creator_responsible':
                return "Creator's Responsible";
        }
    };

    const getChipBg = (type: GranteeType) => {
        switch (type) {
            case 'org_unit': return 'bg-orange-50 text-orange-800';
            case 'org_unit_head': return 'bg-amber-50 text-amber-800';
            case 'creator_responsible': return 'bg-teal-50 text-teal-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const hasCreatorResponsible = assignments.some(a => a.type === 'creator_responsible');

    return (
        <div className={`space-y-2 ${className}`} ref={containerRef}>
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700">{label}</label>
            )}

            {/* Selected Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {assignments.map((a) => (
                    <span
                        key={a.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm ${getChipBg(a.type)}`}
                    >
                        {getChipIcon(a.type)}
                        <span className="truncate max-w-[140px]">
                            {getChipLabel(a)}
                        </span>
                        <button
                            type="button"
                            onClick={() => removeAssignment(a.id)}
                            className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3 text-gray-500" />
                        </button>
                    </span>
                ))}

                {/* Add Button */}
                <button
                    type="button"
                    onClick={handleOpen}
                    className="inline-flex items-center gap-1 px-2.5 py-1 border border-dashed border-gray-300 text-gray-500 rounded-full text-sm hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                    <span>+ Add</span>
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="relative z-50">
                    <div className="absolute top-0 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 overflow-x-auto">
                            {tabConfig.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${activeTab === tab.key
                                        ? `${getAccentText()} border-b-2 ${getAccentBorder()} -mb-px`
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Search Input (not for special tab) */}
                        {activeTab !== 'special' && (
                            <div className="p-2 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder={`Search ${activeTab === 'org_unit' ? 'org units' : activeTab + 's'}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        <div className="max-h-56 overflow-y-auto">
                            {activeTab === 'special' ? (
                                /* Special options: Org Unit Head (from search) + Creator Responsible */
                                <div className="p-2 space-y-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!hasCreatorResponsible) addCreatorResponsible();
                                        }}
                                        disabled={hasCreatorResponsible}
                                        className={`w-full px-3 py-3 flex items-center gap-3 rounded-lg transition-colors text-left ${hasCreatorResponsible ? 'bg-gray-50 opacity-50 cursor-not-allowed' : 'hover:bg-teal-50'}`}
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                                            <UserCog className="w-4.5 h-4.5 text-teal-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900">Creator&apos;s Responsible</div>
                                            <div className="text-xs text-gray-500">Head of the document creator&apos;s org unit</div>
                                        </div>
                                        {hasCreatorResponsible && (
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Added</span>
                                        )}
                                    </button>
                                    <div className="px-3 py-2 mt-2">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Tips</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Use the <strong>Org Unit</strong> tab to add all members or the head of a specific org unit.
                                        </p>
                                    </div>
                                </div>
                            ) : activeTab === 'org_unit' ? (
                                /* Org Unit results with Add Members / Add Head options */
                                loading ? (
                                    <div className="py-6 text-center text-gray-400 text-sm">
                                        <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                                    </div>
                                ) : results.length === 0 ? (
                                    <div className="py-6 text-center text-gray-400 text-sm">
                                        No org units found
                                    </div>
                                ) : (
                                    results.map((orgUnit: OrgUnitResponse) => (
                                        <div key={orgUnit.id} className="px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                            <div className="flex items-center gap-2.5 mb-1.5">
                                                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                                    <Building2 className="w-4 h-4 text-orange-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 truncate">{orgUnit.name}</div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span className="px-1.5 py-0 bg-gray-100 rounded text-[10px] font-medium">{orgUnit.typeName || orgUnit.typeId}</span>
                                                        <span>{orgUnit.memberCount} members</span>
                                                        {orgUnit.headUserDisplayName && (
                                                            <span className="text-amber-600">Head: {orgUnit.headUserDisplayName}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-10">
                                                <button
                                                    type="button"
                                                    onClick={() => addOrgUnitMembers(orgUnit)}
                                                    className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors font-medium"
                                                >
                                                    + All Members
                                                </button>
                                                {orgUnit.headUserId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => addOrgUnitHead(orgUnit)}
                                                        className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors font-medium"
                                                    >
                                                        + Head Only
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                /* Standard User/Group/Role results */
                                loading ? (
                                    <div className="py-6 text-center text-gray-400 text-sm">
                                        <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                                    </div>
                                ) : results.length === 0 ? (
                                    <div className="py-6 text-center text-gray-400 text-sm">
                                        No {activeTab}s found
                                    </div>
                                ) : (
                                    results.map((entity: any) => (
                                        <button
                                            key={entity.id}
                                            type="button"
                                            onClick={() => {
                                                const type: GranteeType = 'username' in entity ? 'user' : 'userCount' in entity ? 'group' : 'role';
                                                addAssignment(entity, type);
                                            }}
                                            className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            {'username' in entity ? (
                                                <UserAvatar user={entity} size="sm" />
                                            ) : 'userCount' in entity ? (
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                    <Users className="w-4 h-4 text-green-600" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <Shield className="w-4 h-4 text-purple-600" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {'username' in entity
                                                        ? entity.displayName || entity.username
                                                        : entity.name}
                                                </div>
                                                {'username' in entity && entity.email && (
                                                    <div className="text-xs text-gray-500 truncate">{entity.email}</div>
                                                )}
                                                {'description' in entity && entity.description && (
                                                    <div className="text-xs text-gray-500 truncate">{entity.description}</div>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )
                            )}
                        </div>

                        {/* Close */}
                        <div className="p-2 border-t border-gray-100 bg-gray-50">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="w-full py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper function to convert StepAssignment[] to CreateStepAssignmentRequest[]
export function toAssignmentRequests(assignments: StepAssignment[]): CreateStepAssignmentRequest[] {
    return assignments.map(assignment => ({
        assigneeType: assignment.type.toUpperCase() as any,
        assigneeId: assignment.type === 'creator_responsible' ? undefined : assignment.entity.id,
        canEdit: assignment.canEdit,
    }));
}

// Helper function to convert StepAssignment[] to AssignmentEntity[]
export function toAssignmentEntities(assignments: StepAssignment[]): AssignmentEntity[] {
    return assignments.map(assignment => ({
        assigneeType: assignment.type.toUpperCase() as AssignmentEntity['assigneeType'],
        assigneeId: String(assignment.entity.id),
        entity: assignment.entity,
    }));
}

// Helper function to load StepAssignment[] from assignmentEntities
export function fromAssignmentEntities(entities: AssignmentEntity[] | undefined): StepAssignment[] {
    if (!entities) return [];

    return entities.map(e => ({
        id: `${e.assigneeType.toLowerCase()}-${e.assigneeId}`,
        type: e.assigneeType.toLowerCase() as GranteeType,
        entity: e.entity,
        canEdit: true,
    }));
}
