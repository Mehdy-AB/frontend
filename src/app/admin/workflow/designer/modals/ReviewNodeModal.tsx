'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Eye, Users, User as UserIcon, Shield, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { WorkflowNodeData } from '../nodes/types';
import { notificationApiClient } from '@/api/notificationClient';
import { UserDto, RoleDto, GroupDto, CreateStepAssignmentRequest } from '@/types/api';
import UserAvatar from '@/components/main/UserAvatar';

interface ReviewNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

type GranteeType = 'user' | 'group' | 'role';

interface StepAssignment {
    id: string;
    type: GranteeType;
    entity: UserDto | GroupDto | RoleDto;
    canEdit: boolean;
}

export default function ReviewNodeModal({ isOpen, onClose, nodeData, onSave }: ReviewNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Review');
    const [description, setDescription] = useState(nodeData.description || '');
    const [allowComments, setAllowComments] = useState(nodeData.allowComments ?? true);
    const [notificationSubject, setNotificationSubject] = useState(nodeData.notificationSubject || 'Review Required: ${doc.name}');

    const [assignments, setAssignments] = useState<StepAssignment[]>([]);

    // Assignment Logic State
    const [users, setUsers] = useState<UserDto[]>([]);
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const [roles, setRoles] = useState<RoleDto[]>([]);
    const [availableEntities, setAvailableEntities] = useState<(UserDto | GroupDto | RoleDto)[]>([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [searching, setSearching] = useState(false);
    const [selectedEntityType, setSelectedEntityType] = useState<'user' | 'group' | 'role' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Review');
            setDescription(nodeData.description || '');
            setAllowComments(nodeData.allowComments ?? true);
            setNotificationSubject(nodeData.notificationSubject || 'Review Required: ${doc.name}');
            loadAssignmentsFromData();
        }
    }, [isOpen, nodeData]);

    const loadAssignmentsFromData = async () => {
        if (!nodeData.assignments && !nodeData.assignmentEntities) {
            setAssignments([]);
            return;
        }

        const loadedAssignments: StepAssignment[] = [];

        // Prefer using full entities object if available
        if (nodeData.assignmentEntities) {
            nodeData.assignmentEntities.forEach((a: any) => {
                loadedAssignments.push({
                    id: `${a.assigneeType.toLowerCase()}-${a.assigneeId}`,
                    type: a.assigneeType.toLowerCase() as GranteeType,
                    entity: a.entity,
                    canEdit: true
                });
            });
        }
        // Fallback to fetching if only IDs are present (legacy support)
        else if (nodeData.assignments) {
            for (const assignment of nodeData.assignments) {
                try {
                    let entity: UserDto | RoleDto | GroupDto | null = null;
                    if (assignment.assigneeType === 'USER') {
                        entity = await notificationApiClient.getUserById(assignment.assigneeId, { silent: true });
                    } else if (assignment.assigneeType === 'ROLE') {
                        entity = await notificationApiClient.getRoleById(assignment.assigneeId, { silent: true });
                    } else if (assignment.assigneeType === 'GROUP') {
                        entity = await notificationApiClient.getGroupById(assignment.assigneeId, { silent: true });
                    }

                    if (entity) {
                        loadedAssignments.push({
                            id: `${assignment.assigneeType.toLowerCase()}-${assignment.assigneeId}`,
                            type: assignment.assigneeType.toLowerCase() as GranteeType,
                            entity: entity,
                            canEdit: true,
                        });
                    }
                } catch (e) {
                    console.error("Failed to load entity", e);
                }
            }
        }
        setAssignments(loadedAssignments);
    };

    // Loaders
    const loadAvailableUsers = async (search?: string) => {
        try {
            const res = await notificationApiClient.getAllUsers({ page: 0, size: 50, search: search, desc: false }, { silent: true });
            setUsers(res?.content || []);
        } catch (e) { console.error(e); }
    };
    const loadAvailableGroups = async (search?: string) => {
        try {
            const res = await notificationApiClient.getAllGroups({ page: 0, size: 50, name: search, desc: false }, { silent: true });
            setGroups(res?.content || []);
        } catch (e) { console.error(e); }
    };
    const loadAvailableRoles = async (search?: string) => {
        try {
            const res = await notificationApiClient.getAllRoles({ page: 0, size: 50, name: search, desc: false }, { silent: true });
            setRoles(res?.content || []);
        } catch (e) { console.error(e); }
    };

    // Search Effect
    useEffect(() => {
        if (!selectedEntityType) return;
        const performSearch = async () => {
            setSearching(true);
            const term = searchQuery.trim() || undefined;
            if (selectedEntityType === 'user') await loadAvailableUsers(term);
            if (selectedEntityType === 'group') await loadAvailableGroups(term);
            if (selectedEntityType === 'role') await loadAvailableRoles(term);
            setSearching(false);
        };
        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedEntityType]);

    // Update Available Entities List
    useEffect(() => {
        let entities: (UserDto | GroupDto | RoleDto)[] = [];
        if (selectedEntityType === 'user') entities = users;
        else if (selectedEntityType === 'group') entities = groups;
        else if (selectedEntityType === 'role') entities = roles;

        // Filter out already assigned
        const assignedIds = new Set(assignments.map(a => a.entity.id));
        setAvailableEntities(entities.filter(e => !assignedIds.has(e.id)));
    }, [users, groups, roles, selectedEntityType, assignments]);

    const handleAddClick = (type: 'user' | 'group' | 'role') => {
        setSelectedEntityType(type);
        setSearchQuery('');
        setShowSearchDropdown(true);
        setTimeout(() => searchInputRef.current?.focus(), 10);
    };

    const addAssignment = (entity: UserDto | GroupDto | RoleDto) => {
        let type: GranteeType = 'role';
        if ('username' in entity) type = 'user';
        else if ('userCount' in entity) type = 'group';

        const id = `${type}-${entity.id}`;
        if (assignments.some(a => a.id === id)) return;

        setAssignments([...assignments, { id, type, entity, canEdit: true }]);
        setShowSearchDropdown(false);
        setSelectedEntityType(null);
    };

    const removeAssignment = (id: string) => {
        setAssignments(assignments.filter(a => a.id !== id));
    };

    const handleSave = () => {
        const assignmentRequests: CreateStepAssignmentRequest[] = assignments.map(a => ({
            assigneeType: a.type.toUpperCase() as 'USER' | 'ROLE' | 'GROUP',
            assigneeId: a.entity.id,
            canEdit: a.canEdit
        }));

        const assignmentEntities = assignments.map(a => ({
            assigneeType: a.type.toUpperCase() as 'USER' | 'ROLE' | 'GROUP',
            assigneeId: a.entity.id,
            entity: a.entity
        }));

        onSave({
            label,
            description,
            allowComments,
            notificationSubject,
            assignments: assignmentRequests,
            assignmentEntities // Save full entities to persist state without refetching
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Review</h3>
                            <p className="text-sm text-gray-500">Review task settings</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-gray-200 flex items-center justify-center">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid gap-4">
                        <div>
                            <Label>Step Name</Label>
                            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Review Step" />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instructions..." rows={2} />
                        </div>
                        <div>
                            <Label>Notification Subject</Label>
                            <Input value={notificationSubject} onChange={(e) => setNotificationSubject(e.target.value)} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <Label>Allow Comments</Label>
                            <Switch checked={allowComments} onCheckedChange={setAllowComments} />
                        </div>
                    </div>

                    {/* Assignments Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Assignees</Label>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleAddClick('user')}><UserIcon className="w-4 h-4 mr-1" /> User</Button>
                                <Button size="sm" variant="outline" onClick={() => handleAddClick('group')}><Users className="w-4 h-4 mr-1" /> Group</Button>
                                <Button size="sm" variant="outline" onClick={() => handleAddClick('role')}><Shield className="w-4 h-4 mr-1" /> Role</Button>
                            </div>
                        </div>

                        {/* Search Dropdown */}
                        {showSearchDropdown && (
                            <div className="relative border rounded-lg p-2 bg-gray-50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        ref={searchInputRef}
                                        className="w-full pl-9 pr-8 py-2 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder={`Search ${selectedEntityType}s...`}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    <button onClick={() => setShowSearchDropdown(false)} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>
                                </div>
                                <div className="mt-2 max-h-48 overflow-y-auto bg-white rounded border shadow-sm">
                                    {searching ? (
                                        <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
                                    ) : availableEntities.length === 0 ? (
                                        <div className="p-4 text-center text-gray-400 text-sm">No results found</div>
                                    ) : (
                                        availableEntities.map(entity => (
                                            <div key={entity.id} onClick={() => addAssignment(entity)} className="p-2 hover:bg-indigo-50 cursor-pointer flex items-center gap-2">
                                                {'username' in entity && <UserAvatar user={entity as UserDto} size="sm" />}
                                                <span className="text-sm">{'name' in entity ? (entity as any).name : (entity as any).username}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* List */}
                        <div className="space-y-2">
                            {assignments.length === 0 && !showSearchDropdown && (
                                <p className="text-sm text-gray-400 italic">No users assigned yet.</p>
                            )}
                            {assignments.map(a => (
                                <div key={a.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <Badge variant={a.type === 'user' ? 'default' : a.type === 'group' ? 'secondary' : 'outline'}>
                                            {a.type.toUpperCase()}
                                        </Badge>
                                        <div className="flex items-center gap-2">
                                            {a.type === 'user' && <UserAvatar user={a.entity as UserDto} size="sm" />}
                                            <span className="font-medium text-sm">
                                                {'name' in a.entity ? (a.entity as any).name : (a.entity as any).username}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => removeAssignment(a.id)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-indigo-500 hover:bg-indigo-600">Save Configuration</Button>
                </div>
            </div>
        </div>
    );
}
