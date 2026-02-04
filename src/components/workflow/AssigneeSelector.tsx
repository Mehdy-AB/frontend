'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Users, Shield, User as UserIcon, Search, ChevronDown } from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { UserDto, RoleDto, GroupDto, CreateStepAssignmentRequest } from '@/types/api';
import UserAvatar from '@/components/main/UserAvatar';

export type GranteeType = 'user' | 'group' | 'role';

export interface StepAssignment {
    id: string;
    type: GranteeType;
    entity: UserDto | GroupDto | RoleDto;
    canEdit: boolean;
}

export interface AssignmentEntity {
    assigneeType: 'USER' | 'ROLE' | 'GROUP';
    assigneeId: string;
    entity: UserDto | GroupDto | RoleDto;
}

interface AssigneeSelectorProps {
    assignments: StepAssignment[];
    onChange: (assignments: StepAssignment[]) => void;
    label?: string;
    className?: string;
    accentColor?: string;
}

/**
 * Clean and simple AssigneeSelector component
 * Unified search with type filter tabs
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
    const [activeTab, setActiveTab] = useState<GranteeType>('user');
    const [results, setResults] = useState<(UserDto | GroupDto | RoleDto)[]>([]);
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
            }

            // Filter out already assigned
            const assignedIds = new Set(assignments.map(a => a.entity?.id));
            setResults(data.filter(item => !assignedIds.has(item.id)));
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
    const addAssignment = (entity: UserDto | GroupDto | RoleDto) => {
        const type: GranteeType = 'username' in entity ? 'user' : 'userCount' in entity ? 'group' : 'role';
        const id = `${type}-${entity.id}`;

        if (assignments.some(a => a.id === id)) return;

        onChange([...assignments, { id, type, entity, canEdit: true }]);
    };

    // Remove assignment
    const removeAssignment = (id: string) => {
        onChange(assignments.filter(a => a.id !== id));
    };

    // Get accent colors
    const getAccentBg = () => {
        const colors: Record<string, string> = {
            blue: 'bg-blue-500',
            indigo: 'bg-indigo-500',
            violet: 'bg-violet-500',
            purple: 'bg-purple-500',
            amber: 'bg-amber-500',
            orange: 'bg-orange-500',
        };
        return colors[accentColor] || colors.blue;
    };

    const getAccentBorder = () => {
        const colors: Record<string, string> = {
            blue: 'border-blue-500',
            indigo: 'border-indigo-500',
            violet: 'border-violet-500',
            purple: 'border-purple-500',
            amber: 'border-amber-500',
            orange: 'border-orange-500',
        };
        return colors[accentColor] || colors.blue;
    };

    const getAccentText = () => {
        const colors: Record<string, string> = {
            blue: 'text-blue-600',
            indigo: 'text-indigo-600',
            violet: 'text-violet-600',
            purple: 'text-purple-600',
            amber: 'text-amber-600',
            orange: 'text-orange-600',
        };
        return colors[accentColor] || colors.blue;
    };

    const tabIcons = {
        user: <UserIcon className="w-3.5 h-3.5" />,
        group: <Users className="w-3.5 h-3.5" />,
        role: <Shield className="w-3.5 h-3.5" />,
    };

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
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                    >
                        {a.type === 'user' && <UserIcon className="w-3.5 h-3.5 text-blue-500" />}
                        {a.type === 'group' && <Users className="w-3.5 h-3.5 text-green-500" />}
                        {a.type === 'role' && <Shield className="w-3.5 h-3.5 text-purple-500" />}
                        <span className="truncate max-w-[120px]">
                            {a.type === 'user'
                                ? (a.entity as UserDto).displayName || (a.entity as UserDto).username
                                : (a.entity as GroupDto | RoleDto).name}
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
                    className={`inline-flex items-center gap-1 px-2.5 py-1 border border-dashed border-gray-300 text-gray-500 rounded-full text-sm hover:border-gray-400 hover:text-gray-600 transition-colors`}
                >
                    <span>+ Add</span>
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="relative z-50">
                    <div className="absolute top-0 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200">
                            {(['user', 'group', 'role'] as GranteeType[]).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${activeTab === tab
                                            ? `${getAccentText()} border-b-2 ${getAccentBorder()} -mb-px`
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tabIcons[tab]}
                                    <span className="capitalize">{tab}s</span>
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder={`Search ${activeTab}s...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Results */}
                        <div className="max-h-48 overflow-y-auto">
                            {loading ? (
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
                                            addAssignment(entity);
                                        }}
                                        className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        {/* Icon/Avatar */}
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

                                        {/* Info */}
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
        assigneeType: assignment.type.toUpperCase() as 'USER' | 'ROLE' | 'GROUP',
        assigneeId: assignment.entity.id,
        canEdit: assignment.canEdit,
    }));
}

// Helper function to convert StepAssignment[] to AssignmentEntity[]
export function toAssignmentEntities(assignments: StepAssignment[]): AssignmentEntity[] {
    return assignments.map(assignment => ({
        assigneeType: assignment.type.toUpperCase() as 'USER' | 'ROLE' | 'GROUP',
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
