'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, RotateCcw, SlidersHorizontal, Save, Trash2,
    ChevronDown, ChevronUp, ChevronRight, X, Users, Shield,
    Building2, Globe, Clock, Filter
} from 'lucide-react';
import type { AuditLogFilterRequest, FilterUserOption } from '../../api/services/auditLogService';
import { auditLogService } from '../../api/services/auditLogService';
import { roleManagementService } from '../../api/services/roleManagementService';
import { groupManagementService } from '../../api/services/groupManagementService';
import { orgUnitService, OrgUnitTreeResponse } from '../../api/services/orgUnitService';
import type { RoleDto, GroupDto, UserDto } from '../../types/api';
import { apiClient } from '../../api/client';
import UserAvatar from '../main/UserAvatar';

// ============================================================================
// TYPES
// ============================================================================

interface FilterPreset {
    id: string;
    name: string;
    version: 1;
    filters: Partial<AuditLogFilterRequest>;
    createdAt: string;
}

/** Lightweight token for display in chips */
interface Token { id: string; name: string; }

interface AuditFilterPanelProps {
    actionOptions: string[];
    entityTypeOptions: string[];
    onApply: (filter: AuditLogFilterRequest) => void;
    loading?: boolean;
}

const PRESETS_KEY = 'audit_filter_presets_v1';
const DEBOUNCE_MS = 300;

function loadPresets(): FilterPreset[] {
    try {
        const raw = localStorage.getItem(PRESETS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((p: FilterPreset) => p.version === 1) : [];
    } catch { return []; }
}

function savePresetsToStorage(presets: FilterPreset[]) {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

function defaultFilter(): AuditLogFilterRequest {
    return {
        actions: [], entityTypes: [], userId: '', userIds: [], username: '',
        roleIds: [], groupIds: [], orgUnitIds: [],
        dateFrom: '', dateTo: '', success: null,
        httpMethod: '', httpMethods: [], ipAddress: '',
        minDurationMs: undefined, responseStatus: undefined, search: '',
        page: 0, size: 20, sortBy: 'timestamp', sortDir: 'desc',
    };
}

function formatActionLabel(a: string): string {
    return a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Debounce hook */
function useDebounce(value: string, delay: number): string {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const h = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(h);
    }, [value, delay]);
    return debounced;
}

// ============================================================================
// TYPEAHEAD TOKEN COMPONENT
// ============================================================================

interface TypeaheadTokenProps {
    icon: React.ReactNode;
    label: string;
    placeholder: string;
    selectedIds: string[];
    tokens: Token[];
    chipClass?: string;
    onSearch: (query: string) => Promise<Token[]>;
    onAdd: (token: Token) => void;
    onRemove: (id: string) => void;
}

function TypeaheadToken({ icon, label, placeholder, selectedIds, tokens, chipClass, onSearch, onAdd, onRemove }: TypeaheadTokenProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Token[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounced = useDebounce(query, DEBOUNCE_MS);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!debounced.trim()) { setResults([]); return; }
        let cancelled = false;
        setLoading(true);
        onSearch(debounced).then(r => {
            if (!cancelled) { setResults(r); setIsOpen(true); }
        }).catch(() => { if (!cancelled) setResults([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [debounced]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (token: Token) => {
        onAdd(token);
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    const filtered = results.filter(r => !selectedIds.includes(r.id));

    return (
        <div className="audit-typeahead" ref={wrapperRef}>
            <label className="audit-label">{icon} {label}</label>
            {/* Selected tokens */}
            {tokens.length > 0 && (
                <div className="audit-chip-group">
                    {tokens.map(t => (
                        <span key={t.id} className={`audit-chip ${chipClass || ''}`}>
                            {icon}
                            <span>{t.name}</span>
                            <button className="audit-chip__remove" onClick={() => onRemove(t.id)} type="button"><X size={10} /></button>
                        </span>
                    ))}
                </div>
            )}
            {/* Search input */}
            <div className="audit-typeahead__input-wrap">
                <Search size={12} className="audit-typeahead__search-icon" />
                <input
                    className="audit-input audit-input--sm"
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                />
                {loading && <span className="audit-typeahead__spinner" />}
            </div>
            {/* Dropdown results */}
            {isOpen && filtered.length > 0 && (
                <div className="audit-typeahead__dropdown">
                    {filtered.map(r => (
                        <button key={r.id} className="audit-typeahead__option" onClick={() => handleSelect(r)} type="button">
                            {icon}
                            <span>{r.name}</span>
                        </button>
                    ))}
                </div>
            )}
            {isOpen && debounced.trim() && filtered.length === 0 && !loading && (
                <div className="audit-typeahead__dropdown">
                    <span className="audit-typeahead__empty">No results</span>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// ORG UNIT TREE COMPONENT
// ============================================================================

interface OrgUnitTreeProps {
    selectedIds: string[];
    onToggle: (id: string) => void;
}

function OrgUnitTree({ selectedIds, onToggle }: OrgUnitTreeProps) {
    const [tree, setTree] = useState<OrgUnitTreeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<string[] | null>(null);
    const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_MS);

    // Load tree once
    useEffect(() => {
        orgUnitService.getTree()
            .then(setTree)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Search → get matching IDs to highlight
    useEffect(() => {
        if (!debouncedSearch.trim()) { setSearchResults(null); return; }
        let cancelled = false;
        orgUnitService.search(debouncedSearch).then(results => {
            if (!cancelled) setSearchResults(results.map(r => r.id));
        }).catch(() => { if (!cancelled) setSearchResults([]); });
        return () => { cancelled = true; };
    }, [debouncedSearch]);

    if (loading) return <p className="audit-text--muted" style={{ padding: '8px 4px', fontSize: '11px' }}>Loading tree…</p>;
    if (tree.length === 0) return <p className="audit-text--muted" style={{ padding: '8px 4px', fontSize: '11px' }}>No org units found</p>;

    return (
        <div className="audit-org-tree">
            <div className="audit-org-tree__search">
                <Search size={12} />
                <input
                    type="text"
                    placeholder="Search units…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="audit-input audit-input--sm"
                />
            </div>
            <div className="audit-org-tree__list">
                {tree.map(node => (
                    <OrgTreeNode
                        key={node.id}
                        node={node}
                        depth={0}
                        selectedIds={selectedIds}
                        matchedIds={searchResults}
                        onToggle={onToggle}
                    />
                ))}
            </div>
        </div>
    );
}

const OU_TYPE_COLORS: Record<string, string> = {
    ORGANIZATION: '#8b5cf6',
    DIRECTORATE: '#3b82f6',
    DEPARTMENT: '#06b6d4',
    SERVICE: '#10b981',
    TEAM: '#f59e0b',
    BRANCH: '#ef4444',
};

interface OrgTreeNodeProps {
    node: OrgUnitTreeResponse;
    depth: number;
    selectedIds: string[];
    matchedIds: string[] | null;
    onToggle: (id: string) => void;
}

function OrgTreeNode({ node, depth, selectedIds, matchedIds, onToggle }: OrgTreeNodeProps) {
    const [expanded, setExpanded] = useState(depth < 1); // auto-expand first level
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedIds.includes(node.id);
    const isMatched = matchedIds === null || matchedIds.includes(node.id);

    // If search is active and this node (and none of its descendants) match, hide it
    if (matchedIds !== null && !isMatched && !hasDescendantMatch(node, matchedIds)) return null;

    return (
        <div className="audit-org-tree__node-group">
            <div
                className={`audit-org-tree__node ${isSelected ? 'audit-org-tree__node--selected' : ''} ${isMatched && matchedIds !== null ? 'audit-org-tree__node--matched' : ''}`}
                style={{ paddingLeft: `${depth * 16 + 4}px` }}
            >
                {/* Expand/collapse button */}
                <button
                    className="audit-org-tree__toggle"
                    onClick={() => setExpanded(!expanded)}
                    type="button"
                    style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
                >
                    {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>

                {/* Checkbox */}
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(node.id)}
                    className="audit-org-tree__checkbox"
                />

                {/* Type indicator */}
                <span
                    className="audit-org-tree__type-dot"
                    style={{ background: OU_TYPE_COLORS[node.type] || '#888' }}
                    title={node.type}
                />

                {/* Name */}
                <span className="audit-org-tree__name">{node.name}</span>

                {/* Member count */}
                {node.memberCount > 0 && (
                    <span className="audit-org-tree__count">{node.memberCount}</span>
                )}
            </div>

            {/* Children */}
            {expanded && hasChildren && node.children.map(child => (
                <OrgTreeNode
                    key={child.id}
                    node={child}
                    depth={depth + 1}
                    selectedIds={selectedIds}
                    matchedIds={matchedIds}
                    onToggle={onToggle}
                />
            ))}
        </div>
    );
}

function hasDescendantMatch(node: OrgUnitTreeResponse, matchedIds: string[]): boolean {
    if (!node.children) return false;
    return node.children.some(c => matchedIds.includes(c.id) || hasDescendantMatch(c, matchedIds));
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AuditFilterPanel({ actionOptions, entityTypeOptions, onApply, loading }: AuditFilterPanelProps) {
    const [filter, setFilter] = useState<AuditLogFilterRequest>(defaultFilter);
    const [presets, setPresets] = useState<FilterPreset[]>([]);
    const [presetName, setPresetName] = useState('');
    const [showPresets, setShowPresets] = useState(false);
    const [actionsExpanded, setActionsExpanded] = useState(false);

    // Quick filter state
    const [usersExpanded, setUsersExpanded] = useState(false);
    const [userOptions, setUserOptions] = useState<FilterUserOption[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const debouncedUserSearch = useDebounce(userSearch, DEBOUNCE_MS);

    // Advanced section
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [entityTypesExpanded, setEntityTypesExpanded] = useState(false);
    const [httpMethodsExpanded, setHttpMethodsExpanded] = useState(false);
    const [orgUnitsExpanded, setOrgUnitsExpanded] = useState(false);
    const [httpMethodOptions, setHttpMethodOptions] = useState<string[]>([]);

    // Typeahead token state
    const [roleTokens, setRoleTokens] = useState<Token[]>([]);
    const [groupTokens, setGroupTokens] = useState<Token[]>([]);

    useEffect(() => { setPresets(loadPresets()); }, []);

    // Server-side user search — debounced
    useEffect(() => {
        if (!usersExpanded) return;
        let cancelled = false;
        setUserSearchLoading(true);
        const query = debouncedUserSearch.trim();

        if (query) {
            // Server-side search
            apiClient.get<UserDto[]>(`/api/v1/admin/users/search?query=${encodeURIComponent(query)}`)
                .then(users => {
                    if (!cancelled) {
                        setUserOptions(users.map(u => ({
                            id: u.id,
                            username: u.username,
                            displayName: u.displayName,
                            imgUrl: u.imgUrl || u.imageUrl,
                        })));
                    }
                })
                .catch(() => { })
                .finally(() => { if (!cancelled) setUserSearchLoading(false); });
        } else {
            // Load initial users from audit log
            auditLogService.getUserOptions()
                .then(opts => { if (!cancelled) setUserOptions(opts); })
                .catch(() => { })
                .finally(() => { if (!cancelled) setUserSearchLoading(false); });
        }
        return () => { cancelled = true; };
    }, [usersExpanded, debouncedUserSearch]);

    // Lazy-load HTTP methods
    useEffect(() => {
        if (httpMethodsExpanded && httpMethodOptions.length === 0) {
            auditLogService.getHttpMethodOptions().then(setHttpMethodOptions).catch(() => { });
        }
    }, [httpMethodsExpanded]);

    const handleApply = useCallback(() => {
        // Convert datetime-local ("2026-03-01T21:57") → ISO Instant ("2026-03-01T21:57:00.000Z")
        const prepared = { ...filter };
        if (prepared.dateFrom) {
            prepared.dateFrom = new Date(prepared.dateFrom).toISOString();
        }
        if (prepared.dateTo) {
            prepared.dateTo = new Date(prepared.dateTo).toISOString();
        }
        onApply(prepared);
    }, [filter, onApply]);
    const handleReset = () => {
        setFilter(defaultFilter());
        setRoleTokens([]);
        setGroupTokens([]);
        onApply(defaultFilter());
    };

    const handleSavePreset = () => {
        if (!presetName.trim()) return;
        const newPreset: FilterPreset = {
            id: crypto.randomUUID(),
            name: presetName.trim(),
            version: 1,
            filters: {
                actions: filter.actions, entityTypes: filter.entityTypes,
                userIds: filter.userIds, roleIds: filter.roleIds,
                groupIds: filter.groupIds, orgUnitIds: filter.orgUnitIds,
                httpMethods: filter.httpMethods, success: filter.success, search: filter.search,
            },
            createdAt: new Date().toISOString(),
        };
        const updated = [...presets, newPreset];
        setPresets(updated);
        savePresetsToStorage(updated);
        setPresetName('');
    };

    const applyPreset = (p: FilterPreset) => { setFilter({ ...defaultFilter(), ...p.filters }); };
    const deletePreset = (id: string) => {
        const updated = presets.filter(p => p.id !== id);
        setPresets(updated);
        savePresetsToStorage(updated);
    };

    const toggleMultiSelect = (field: 'actions' | 'entityTypes' | 'httpMethods', value: string) => {
        setFilter(prev => {
            const arr = prev[field] || [];
            return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
        });
    };

    const toggleIdSelect = (field: 'userIds' | 'orgUnitIds', id: string) => {
        setFilter(prev => {
            const arr = prev[field] || [];
            return { ...prev, [field]: arr.includes(id) ? arr.filter(v => v !== id) : [...arr, id] };
        });
    };


    // Typeahead search handlers (paginated, NOT fetch-all)
    const searchRoles = async (q: string): Promise<Token[]> => {
        const res = await roleManagementService.getRoles(0, 10, 'name', 'asc', q);
        return res.content.map((r: RoleDto) => ({ id: r.id, name: r.name }));
    };

    const searchGroups = async (q: string): Promise<Token[]> => {
        // Use getGroups(name?) which returns Page<GroupDto>, NOT searchGroups which returns a raw List
        const res = await groupManagementService.getGroups(0, 10, 'name', 'asc', q);
        return res.content.map((g: GroupDto) => ({ id: g.id, name: g.name }));
    };

    // Compute advanced filter count
    const advancedFilterCount = [
        (filter.roleIds?.length ?? 0) > 0,
        (filter.groupIds?.length ?? 0) > 0,
        (filter.orgUnitIds?.length ?? 0) > 0,
        (filter.entityTypes?.length ?? 0) > 0,
        (filter.httpMethods?.length ?? 0) > 0,
        !!filter.ipAddress,
        !!filter.minDurationMs,
    ].filter(Boolean).length;

    const quickFilterCount = [
        (filter.actions?.length ?? 0) > 0,
        (filter.userIds?.length ?? 0) > 0,
        filter.success !== null && filter.success !== undefined,
        !!filter.search,
        !!filter.dateFrom || !!filter.dateTo,
    ].filter(Boolean).length;

    const totalFilterCount = quickFilterCount + advancedFilterCount;

    return (
        <div className="audit-filter-panel">
            {/* ====== HEADER ====== */}
            <div className="audit-filter-panel__header">
                <div className="audit-filter-panel__title">
                    <SlidersHorizontal size={16} />
                    <span>Query Filters</span>
                    {totalFilterCount > 0 && <span className="audit-filter-panel__badge">{totalFilterCount}</span>}
                </div>
                <div className="audit-filter-panel__header-actions">
                    <button className="audit-btn audit-btn--ghost" onClick={() => setShowPresets(!showPresets)} type="button">
                        <Save size={14} /> Presets
                    </button>
                </div>
            </div>

            {/* Presets dropdown */}
            {showPresets && (
                <div className="audit-filter-panel__presets">
                    <div className="audit-filter-panel__presets-list">
                        {presets.length === 0 && <p className="audit-text--muted">No saved presets</p>}
                        {presets.map(p => (
                            <div key={p.id} className="audit-filter-panel__preset-item">
                                <button className="audit-btn audit-btn--link" onClick={() => applyPreset(p)} type="button">{p.name}</button>
                                <button className="audit-btn audit-btn--icon-sm" onClick={() => deletePreset(p.id)} type="button" title="Delete preset">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="audit-filter-panel__preset-save">
                        <input
                            type="text" className="audit-input audit-input--sm"
                            placeholder="Preset name…" value={presetName}
                            onChange={e => setPresetName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
                        />
                        <button className="audit-btn audit-btn--sm" onClick={handleSavePreset} disabled={!presetName.trim()} type="button">Save</button>
                    </div>
                </div>
            )}

            {/* ====== QUICK FILTERS (always visible) ====== */}
            <div className="audit-filter-panel__body">
                <div className="audit-filter-panel__section-label">
                    <Filter size={12} /> Quick Filters
                </div>

                {/* Date Range */}
                <div className="audit-filter-panel__row audit-filter-panel__row--emphasized">
                    <div className="audit-filter-panel__field">
                        <label className="audit-label">Date From</label>
                        <input type="datetime-local" className="audit-input" value={filter.dateFrom || ''}
                            onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value }))} />
                    </div>
                    <div className="audit-filter-panel__field">
                        <label className="audit-label">Date To</label>
                        <input type="datetime-local" className="audit-input" value={filter.dateTo || ''}
                            onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value }))} />
                    </div>
                </div>

                {/* Users multi-select with search and avatar chips */}
                <div className="audit-filter-panel__field">
                    <button className="audit-label audit-label--collapsible" onClick={() => setUsersExpanded(!usersExpanded)} type="button">
                        <Users size={14} /> Users {filter.userIds?.length ? `(${filter.userIds.length})` : ''}
                        {usersExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {(filter.userIds?.length ?? 0) > 0 && (
                        <div className="audit-chip-group">
                            {filter.userIds!.map(uid => {
                                const u = userOptions.find(o => o.id === uid);
                                return (
                                    <span key={uid} className="audit-chip">
                                        <UserAvatar user={{ username: u?.username || uid }} size="xs" />
                                        <span>{u?.displayName || u?.username || uid}</span>
                                        <button className="audit-chip__remove" onClick={() => toggleIdSelect('userIds', uid)} type="button"><X size={10} /></button>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                    {usersExpanded && (
                        <div className="audit-multiselect">
                            <div className="audit-multiselect__search">
                                <Search size={12} />
                                <input type="text" placeholder="Search users…" value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)} className="audit-input audit-input--sm" />
                                {userSearchLoading && <span className="audit-typeahead__spinner" />}
                            </div>
                            {!userSearchLoading && userOptions.length === 0 && <p className="audit-text--muted">No users found</p>}
                            {userOptions.map((u, idx) => (
                                <label key={`user-${idx}`} className="audit-multiselect__item audit-multiselect__item--user">
                                    <input type="checkbox" checked={filter.userIds?.includes(u.id) || false}
                                        onChange={() => toggleIdSelect('userIds', u.id)} />
                                    <UserAvatar user={{ username: u.username, imgUrl: u.imgUrl }} size="xs" />
                                    <div className="audit-multiselect__user-info">
                                        <span className="audit-multiselect__user-name">{u.displayName || u.username}</span>
                                        {u.displayName && u.displayName !== u.username && (
                                            <span className="audit-multiselect__user-sub">@{u.username}</span>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions multi-select */}
                <div className="audit-filter-panel__field">
                    <button className="audit-label audit-label--collapsible" onClick={() => setActionsExpanded(!actionsExpanded)} type="button">
                        Actions {filter.actions?.length ? `(${filter.actions.length})` : ''}
                        {actionsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {actionsExpanded && (
                        <div className="audit-multiselect">
                            {actionOptions.length === 0 && <p className="audit-text--muted">Loading…</p>}
                            {actionOptions.map(a => (
                                <label key={a} className="audit-multiselect__item">
                                    <input type="checkbox" checked={filter.actions?.includes(a) || false}
                                        onChange={() => toggleMultiSelect('actions', a)} />
                                    <span>{formatActionLabel(a)}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Outcome */}
                <div className="audit-filter-panel__field">
                    <label className="audit-label">Outcome</label>
                    <select className="audit-input"
                        value={filter.success === null || filter.success === undefined ? '' : String(filter.success)}
                        onChange={e => {
                            const v = e.target.value;
                            setFilter(f => ({ ...f, success: v === '' ? null : v === 'true' }));
                        }}>
                        <option value="">All</option>
                        <option value="true">Success</option>
                        <option value="false">Failure</option>
                    </select>
                </div>

                {/* Free-text search */}
                <div className="audit-filter-panel__field">
                    <label className="audit-label">Message / Metadata search</label>
                    <div className="audit-input-group">
                        <Search size={14} className="audit-input-group__icon" />
                        <input type="text" className="audit-input audit-input--with-icon"
                            placeholder="Search details, endpoint, entity…"
                            value={filter.search || ''}
                            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleApply()} />
                    </div>
                </div>
            </div>

            {/* ====== ADVANCED FILTERS (collapsed by default) ====== */}
            <div className="audit-filter-panel__advanced">
                <button
                    className="audit-filter-panel__advanced-toggle"
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                    type="button"
                >
                    <SlidersHorizontal size={13} />
                    <span>Advanced Filters</span>
                    {advancedFilterCount > 0 && <span className="audit-filter-panel__badge audit-filter-panel__badge--sm">{advancedFilterCount}</span>}
                    {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {advancedOpen && (
                    <div className="audit-filter-panel__advanced-body">
                        {/* Roles — typeahead tokens */}
                        <TypeaheadToken
                            icon={<Shield size={12} />}
                            label="Roles"
                            placeholder="Type to search roles…"
                            selectedIds={filter.roleIds || []}
                            tokens={roleTokens}
                            chipClass="audit-chip--role"
                            onSearch={searchRoles}
                            onAdd={token => {
                                setRoleTokens(prev => [...prev, token]);
                                setFilter(prev => ({
                                    ...prev,
                                    roleIds: [...(prev.roleIds || []), token.id],
                                }));
                            }}
                            onRemove={id => {
                                setRoleTokens(prev => prev.filter(t => t.id !== id));
                                setFilter(prev => ({
                                    ...prev,
                                    roleIds: (prev.roleIds || []).filter(v => v !== id),
                                }));
                            }}
                        />

                        {/* Groups — typeahead tokens */}
                        <TypeaheadToken
                            icon={<Users size={12} />}
                            label="Groups"
                            placeholder="Type to search groups…"
                            selectedIds={filter.groupIds || []}
                            tokens={groupTokens}
                            chipClass="audit-chip--group"
                            onSearch={searchGroups}
                            onAdd={token => {
                                setGroupTokens(prev => [...prev, token]);
                                setFilter(prev => ({
                                    ...prev,
                                    groupIds: [...(prev.groupIds || []), token.id],
                                }));
                            }}
                            onRemove={id => {
                                setGroupTokens(prev => prev.filter(t => t.id !== id));
                                setFilter(prev => ({
                                    ...prev,
                                    groupIds: (prev.groupIds || []).filter(v => v !== id),
                                }));
                            }}
                        />

                        {/* Org Units — lazy tree with search */}
                        <div className="audit-filter-panel__field">
                            <button className="audit-label audit-label--collapsible"
                                onClick={() => setOrgUnitsExpanded(!orgUnitsExpanded)} type="button">
                                <Building2 size={14} />
                                Org Units {filter.orgUnitIds?.length ? `(${filter.orgUnitIds.length})` : ''}
                                {orgUnitsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {(filter.orgUnitIds?.length ?? 0) > 0 && (
                                <div className="audit-chip-group">
                                    {filter.orgUnitIds!.map(ouid => (
                                        <span key={ouid} className="audit-chip audit-chip--org">
                                            <Building2 size={10} />
                                            <span>{ouid.substring(0, 8)}…</span>
                                            <button className="audit-chip__remove" onClick={() => toggleIdSelect('orgUnitIds', ouid)} type="button"><X size={10} /></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            {orgUnitsExpanded && (
                                <OrgUnitTree
                                    selectedIds={filter.orgUnitIds || []}
                                    onToggle={id => toggleIdSelect('orgUnitIds', id)}
                                />
                            )}
                        </div>

                        {/* Entity Types */}
                        <div className="audit-filter-panel__field">
                            <button className="audit-label audit-label--collapsible"
                                onClick={() => setEntityTypesExpanded(!entityTypesExpanded)} type="button">
                                Entity Types {filter.entityTypes?.length ? `(${filter.entityTypes.length})` : ''}
                                {entityTypesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {entityTypesExpanded && (
                                <div className="audit-multiselect">
                                    {entityTypeOptions.length === 0 && <p className="audit-text--muted">Loading…</p>}
                                    {entityTypeOptions.map(e => (
                                        <label key={e} className="audit-multiselect__item">
                                            <input type="checkbox" checked={filter.entityTypes?.includes(e) || false}
                                                onChange={() => toggleMultiSelect('entityTypes', e)} />
                                            <span>{e}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* HTTP Methods */}
                        <div className="audit-filter-panel__field">
                            <button className="audit-label audit-label--collapsible"
                                onClick={() => setHttpMethodsExpanded(!httpMethodsExpanded)} type="button">
                                <Globe size={14} /> HTTP Method {filter.httpMethods?.length ? `(${filter.httpMethods.length})` : ''}
                                {httpMethodsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {httpMethodsExpanded && (
                                <div className="audit-multiselect">
                                    {httpMethodOptions.length === 0 && <p className="audit-text--muted">Loading…</p>}
                                    {httpMethodOptions.map(m => (
                                        <label key={m} className="audit-multiselect__item">
                                            <input type="checkbox" checked={filter.httpMethods?.includes(m) || false}
                                                onChange={() => toggleMultiSelect('httpMethods', m)} />
                                            <span className={`audit-http-badge audit-http-badge--${m.toLowerCase()}`}>{m}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* IP Address */}
                        <div className="audit-filter-panel__field">
                            <label className="audit-label">IP Address</label>
                            <input type="text" className="audit-input" placeholder="e.g. 192.168…"
                                value={filter.ipAddress || ''}
                                onChange={e => setFilter(f => ({ ...f, ipAddress: e.target.value }))} />
                        </div>

                        {/* Duration Threshold */}
                        <div className="audit-filter-panel__field">
                            <label className="audit-label"><Clock size={12} /> Min Duration (ms)</label>
                            <input type="number" className="audit-input" placeholder="e.g. 1000" min={0}
                                value={filter.minDurationMs ?? ''}
                                onChange={e => setFilter(f => ({
                                    ...f, minDurationMs: e.target.value ? Number(e.target.value) : undefined,
                                }))} />
                        </div>
                    </div>
                )}
            </div>

            {/* ====== FOOTER ACTIONS ====== */}
            <div className="audit-filter-panel__footer">
                <button className="audit-btn audit-btn--ghost" onClick={handleReset} disabled={loading} type="button">
                    <RotateCcw size={14} /> Reset
                </button>
                <button className="audit-btn audit-btn--primary" onClick={handleApply} disabled={loading} type="button">
                    {loading ? 'Loading…' : 'Apply Filters'}
                </button>
            </div>
        </div>
    );
}
