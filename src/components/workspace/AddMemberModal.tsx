'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, UserPlus, Search, Users, Shield, User, Building, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    workspaceService, WorkspaceRole, PrincipalType, WorkspaceMemberDto,
} from '@/api/services/workspaceService';
import { UserManagementService } from '@/api/services/userManagementService';
import { groupManagementService } from '@/api/services/groupManagementService';
import { roleManagementService } from '@/api/services/roleManagementService';
import { orgUnitService, OrgUnitResponse } from '@/api/services/orgUnitService';
import { UserDto, GroupDto, RoleDto } from '@/types/api';
import UserAvatar from '@/components/main/UserAvatar';

const userService = new UserManagementService();

interface AddMemberModalProps {
    workspaceId: string;
    open: boolean;
    onClose: () => void;
    onAdded: (member: WorkspaceMemberDto) => void;
}

interface SearchResult {
    id: string;
    name: string;
    email?: string;
    imageUrl?: string;
    type: PrincipalType;
    description?: string;
    firstName?: string;
    lastName?: string;
}

type OrgUnitScope = 'HEAD_ONLY' | 'MEMBERS' | 'FIRST_LAYER' | 'ALL_SUBS';

const principalTabs: { value: PrincipalType; label: string; icon: React.ElementType }[] = [
    { value: 'USER', label: 'Users', icon: User },
    { value: 'GROUP', label: 'Groups', icon: Users },
    { value: 'ROLE', label: 'Roles', icon: Shield },
    { value: 'ORG_UNIT', label: 'Org Units', icon: Building },
];

const roleOptions: { value: WorkspaceRole; label: string; desc: string; color: string }[] = [
    { value: 'OWNER', label: 'Owner', desc: 'Full control over workspace', color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { value: 'MANAGER', label: 'Manager', desc: 'Manage members and content', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { value: 'CONTRIBUTOR', label: 'Contributor', desc: 'Create and edit content', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { value: 'READER', label: 'Reader', desc: 'View-only access', color: 'text-gray-600 bg-gray-50 border-gray-200' },
    { value: 'AUDITOR', label: 'Auditor', desc: 'View + audit logs', color: 'text-amber-600 bg-amber-50 border-amber-200' },
];

const orgUnitScopeOptions: { value: OrgUnitScope; label: string; desc: string }[] = [
    { value: 'HEAD_ONLY', label: 'Head Only', desc: 'Only the head of the org unit' },
    { value: 'MEMBERS', label: 'Direct Members', desc: 'All direct members of this unit' },
    { value: 'FIRST_LAYER', label: 'First Layer', desc: 'Direct members + first-level sub-units' },
    { value: 'ALL_SUBS', label: 'All Sub-Units', desc: 'All members recursively' },
];

// Helper to map API responses to SearchResult
function mapUsers(data: any): SearchResult[] {
    const items: UserDto[] = Array.isArray(data) ? data : (data?.content || []);
    return items.map((u: UserDto) => ({
        id: u.id,
        name: u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
        email: u.email,
        imageUrl: u.imgUrl || u.imageUrl,
        type: 'USER' as PrincipalType,
        firstName: u.firstName,
        lastName: u.lastName,
    }));
}

function mapGroups(data: any): SearchResult[] {
    const items: GroupDto[] = Array.isArray(data) ? data : (data?.content || []);
    return items.map((g: GroupDto) => ({
        id: g.id,
        name: g.name,
        type: 'GROUP' as PrincipalType,
        description: g.description || `${g.userCount ?? 0} members`,
    }));
}

function mapRoles(data: any): SearchResult[] {
    const items: RoleDto[] = Array.isArray(data) ? data : (data?.content || []);
    return items.map((r: RoleDto) => ({
        id: r.id,
        name: r.name,
        type: 'ROLE' as PrincipalType,
        description: r.description || 'Role',
    }));
}

function mapOrgUnits(data: any): SearchResult[] {
    const items: OrgUnitResponse[] = Array.isArray(data) ? data : (data?.content || []);
    return items.map((ou: OrgUnitResponse) => ({
        id: ou.id,
        name: ou.name,
        type: 'ORG_UNIT' as PrincipalType,
        description: `${ou.typeName || 'Org Unit'}`,
    }));
}

export default function AddMemberModal({ workspaceId, open, onClose, onAdded }: AddMemberModalProps) {
    const [principalType, setPrincipalType] = useState<PrincipalType>('USER');
    const [searchQuery, setSearchQuery] = useState('');
    // allResults = full fetched list (preloaded or from last API call)
    const [allResults, setAllResults] = useState<SearchResult[]>([]);
    // filteredResults = what's shown (filtered locally by searchQuery)
    const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<SearchResult | null>(null);
    const [role, setRole] = useState<WorkspaceRole>('READER');
    const [orgUnitScope, setOrgUnitScope] = useState<OrgUnitScope>('MEMBERS');
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch data from API
    const fetchData = useCallback(async (type: PrincipalType, query?: string) => {
        setSearching(true);
        try {
            let results: SearchResult[] = [];
            if (type === 'USER') {
                if (query && query.length >= 2) {
                    const resp = await userService.searchUsers(query, undefined, 0, 20);
                    results = mapUsers(resp);
                } else {
                    const resp = await userService.getUsers(0, 20);
                    results = mapUsers(resp);
                }
            } else if (type === 'GROUP') {
                if (query && query.length >= 2) {
                    const resp = await groupManagementService.searchGroups(query, 0, 20);
                    results = mapGroups(resp);
                } else {
                    const resp = await groupManagementService.getGroups(0, 20);
                    results = mapGroups(resp);
                }
            } else if (type === 'ROLE') {
                const resp = await roleManagementService.getRoles(0, 20, 'name', 'asc', query || undefined);
                results = mapRoles(resp);
            } else if (type === 'ORG_UNIT') {
                if (query && query.length >= 2) {
                    const resp = await orgUnitService.search(query);
                    results = mapOrgUnits(resp);
                } else {
                    const resp = await orgUnitService.getTree();
                    results = mapOrgUnits(resp);
                }
            }
            return results;
        } catch (err) {
            console.error('Fetch failed:', err);
            return [];
        } finally {
            setSearching(false);
        }
    }, []);

    // Preload data when modal opens or tab changes
    useEffect(() => {
        if (!open) return;
        setSearchQuery('');
        setSelectedEntity(null);
        setError('');
        // Preload initial data for the active tab
        fetchData(principalType).then(results => {
            setAllResults(results);
            setFilteredResults(results);
        });
    }, [principalType, open, fetchData]);

    // Local filter + API refetch on search query change
    useEffect(() => {
        if (!open) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const q = searchQuery.trim().toLowerCase();

        // Immediately filter locally
        if (!q) {
            setFilteredResults(allResults);
        } else {
            setFilteredResults(allResults.filter(r =>
                r.name.toLowerCase().includes(q) ||
                (r.email && r.email.toLowerCase().includes(q)) ||
                (r.description && r.description.toLowerCase().includes(q))
            ));
        }

        // Also refetch from API with the query (debounced)
        if (q.length >= 2) {
            debounceRef.current = setTimeout(async () => {
                const results = await fetchData(principalType, searchQuery.trim());
                setAllResults(results);
                // Re-apply local filter to new data
                setFilteredResults(results.filter(r =>
                    r.name.toLowerCase().includes(q) ||
                    (r.email && r.email.toLowerCase().includes(q)) ||
                    (r.description && r.description.toLowerCase().includes(q))
                ));
            }, 400);
        }

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const handleSubmit = async () => {
        if (!selectedEntity) {
            setError('Please select a member');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const member = await workspaceService.addMember(workspaceId, {
                principalType: selectedEntity.type,
                principalId: selectedEntity.id,
                role,
            });
            onAdded(member);
            setSelectedEntity(null);
            setSearchQuery('');
            setRole('READER');
            onClose();
        } catch (err: unknown) {
            const apiErr = err as { status?: number; message?: string };
            if (apiErr.status === 409) {
                setError('⚠ ' + (apiErr.message || 'This member already exists in the workspace'));
            } else {
                setError(err instanceof Error ? err.message : 'Failed to add member');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                            <UserPlus className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Add Member</h2>
                            <p className="text-sm text-gray-500">Search and assign users, groups, roles, or org units</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Principal Type Tabs */}
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                        {principalTabs.map(tab => (
                            <button key={tab.value} onClick={() => setPrincipalType(tab.value)}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${principalType === tab.value
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'}`}>
                                <tab.icon className="h-4 w-4" />{tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={`Search ${principalType === 'USER' ? 'users by name or email' : principalType === 'GROUP' ? 'groups by name' : principalType === 'ROLE' ? 'roles by name' : 'org units by name'}...`}
                            className="pl-10 h-11 rounded-xl text-sm"
                        />
                        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />}
                    </div>

                    {/* Selected Member Preview */}
                    {selectedEntity && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                            {selectedEntity.type === 'USER' ? (
                                <UserAvatar
                                    user={{ firstName: selectedEntity.firstName || selectedEntity.name.split(' ')[0], lastName: selectedEntity.lastName || selectedEntity.name.split(' ').slice(1).join(' '), email: selectedEntity.email, imgUrl: selectedEntity.imageUrl }}
                                    size="md"
                                />
                            ) : (
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedEntity.type === 'GROUP' ? 'bg-violet-100 text-violet-600' :
                                    selectedEntity.type === 'ROLE' ? 'bg-amber-100 text-amber-600' :
                                        'bg-emerald-100 text-emerald-600'}`}>
                                    {selectedEntity.type === 'GROUP' ? <Users className="h-5 w-5" /> :
                                        selectedEntity.type === 'ROLE' ? <Shield className="h-5 w-5" /> :
                                            <Building className="h-5 w-5" />}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{selectedEntity.name}</p>
                                {selectedEntity.email && <p className="text-xs text-gray-500 truncate">{selectedEntity.email}</p>}
                                {selectedEntity.description && <p className="text-xs text-gray-500">{selectedEntity.description}</p>}
                            </div>
                            <button onClick={() => setSelectedEntity(null)} className="text-blue-500 hover:text-blue-700 p-1 rounded-lg hover:bg-blue-100 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Results List — always visible (dropdown-style) */}
                    {!selectedEntity && (
                        <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                            {searching && filteredResults.length === 0 ? (
                                <div className="flex items-center justify-center py-8 text-gray-400">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...
                                </div>
                            ) : filteredResults.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    {searchQuery ? `No results for "${searchQuery}"` : 'No items found'}
                                </div>
                            ) : (
                                filteredResults.map(result => (
                                    <button key={`${result.type}-${result.id}`} onClick={() => { setSelectedEntity(result); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b last:border-b-0 border-gray-100 text-left">
                                        {result.type === 'USER' ? (
                                            <UserAvatar
                                                user={{ firstName: result.firstName || result.name.split(' ')[0], lastName: result.lastName || result.name.split(' ').slice(1).join(' '), email: result.email, imgUrl: result.imageUrl }}
                                                size="sm"
                                            />
                                        ) : (
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${result.type === 'GROUP' ? 'bg-violet-100 text-violet-600' :
                                                result.type === 'ROLE' ? 'bg-amber-100 text-amber-600' :
                                                    'bg-emerald-100 text-emerald-600'}`}>
                                                {result.type === 'GROUP' ? <Users className="h-4 w-4" /> :
                                                    result.type === 'ROLE' ? <Shield className="h-4 w-4" /> :
                                                        <Building className="h-4 w-4" />}
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">{result.name}</p>
                                            {result.email && <p className="text-xs text-gray-500 truncate">{result.email}</p>}
                                            {result.description && <p className="text-xs text-gray-400">{result.description}</p>}
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* Org Unit Scope (only for ORG_UNIT) */}
                    {principalType === 'ORG_UNIT' && selectedEntity && (
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Membership Scope</label>
                            <div className="grid grid-cols-2 gap-2">
                                {orgUnitScopeOptions.map(opt => (
                                    <button key={opt.value} onClick={() => setOrgUnitScope(opt.value)}
                                        className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${orgUnitScope === opt.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}`}>
                                        <p className={`text-sm font-medium ${orgUnitScope === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>{opt.label}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Role Selection */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Workspace Role</label>
                        <div className="space-y-2">
                            {roleOptions.map(opt => (
                                <button key={opt.value} type="button" onClick={() => setRole(opt.value)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${role === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}>
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${opt.color}`}>
                                        <span className="text-xs font-bold">{opt.label[0]}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${role === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>{opt.label}</p>
                                        <p className="text-xs text-gray-400">{opt.desc}</p>
                                    </div>
                                    {role === opt.value && <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className={`p-3 text-sm rounded-xl border ${error.startsWith('⚠') ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-100'}`}>{error}</div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <div className="text-xs text-gray-400">
                        {selectedEntity ? `Adding ${selectedEntity.name} as ${role}` : 'Search and select a member above'}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
                        <Button onClick={handleSubmit} disabled={loading || !selectedEntity}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl px-6 border-0">
                            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</> : 'Add Member'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
