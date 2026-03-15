'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Briefcase,
    Plus,
    Search,
    X,
    Edit,
    Trash2,
    RefreshCw,
    AlertCircle,
    Filter,
    Check,
    Shield,
    Hash,
    Layers,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Calendar,
    FileText,
    ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePermissions } from '@/hooks/usePermissions';
import { useNotification } from '@/contexts/NotificationContext';
import {
    organizationService,
    PositionDefinitionResponse,
    CreatePositionDefinitionRequest,
    UpdatePositionDefinitionRequest,
    PagedResponse,
    PositionFilterParams,
    ReferenceDataItem,
    CreateReferenceDataRequest,
    UpdateReferenceDataRequest,
} from '@/api/services/organizationService';
import { Permissions } from '@/constants/permissions';

// ==================== Main Page ====================

export default function PositionCatalogPage() {
    const router = useRouter();
    const { hasPermission } = usePermissions();
    const { addNotification } = useNotification();

    // Permissions
    const canView = hasPermission(Permissions.POSITION_READ);
    const canCreate = hasPermission(Permissions.POSITION_CREATE);
    const canUpdate = hasPermission(Permissions.POSITION_UPDATE);
    const canDelete = hasPermission(Permissions.POSITION_DELETE);
    const canManageRefData = hasPermission(Permissions.ORG_MANAGE_REFERENCE_DATA);

    // Data state
    const [positions, setPositions] = useState<PositionDefinitionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 20;

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [filterJobFamilyId, setFilterJobFamilyId] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // Job Family filter options (loaded once)
    const [jobFamilyOptions, setJobFamilyOptions] = useState<ReferenceDataItem[]>([]);

    // Job Family filter dropdown (searchable)
    const [filterJfDropdownOpen, setFilterJfDropdownOpen] = useState(false);
    const [filterJfSearch, setFilterJfSearch] = useState('');
    const [filterJfSearchDebounced, setFilterJfSearchDebounced] = useState('');
    const [filterJfResults, setFilterJfResults] = useState<ReferenceDataItem[]>([]);
    const [filterJfSelectedName, setFilterJfSelectedName] = useState('');
    const filterJfRef = useRef<HTMLDivElement>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState<PositionDefinitionResponse | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Form state
    const [formCode, setFormCode] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formLevelBand, setFormLevelBand] = useState('');
    const [formSortOrder, setFormSortOrder] = useState(0);
    const [formIsActive, setFormIsActive] = useState(true);
    const [formJobFamilyId, setFormJobFamilyId] = useState<string>('');
    const [formClearanceLevelId, setFormClearanceLevelId] = useState<string>('');

    // Job Family dropdown (server-side search)
    const [jfSearch, setJfSearch] = useState('');
    const [jfSearchDebounced, setJfSearchDebounced] = useState('');
    const [jfResults, setJfResults] = useState<ReferenceDataItem[]>([]);
    const [jfDropdownOpen, setJfDropdownOpen] = useState(false);
    const [jfSelectedName, setJfSelectedName] = useState('');
    const jfRef = useRef<HTMLDivElement>(null);

    // Job Family inline CRUD
    const [jfCreateMode, setJfCreateMode] = useState(false);
    const [jfEditingId, setJfEditingId] = useState<string | null>(null);
    const [jfFormCode, setJfFormCode] = useState('');
    const [jfFormName, setJfFormName] = useState('');
    const [jfFormDescription, setJfFormDescription] = useState('');

    // Clearance Level dropdown (server-side search)
    const [clSearch, setClSearch] = useState('');
    const [clSearchDebounced, setClSearchDebounced] = useState('');
    const [clResults, setClResults] = useState<ReferenceDataItem[]>([]);
    const [clDropdownOpen, setClDropdownOpen] = useState(false);
    const [clSelectedName, setClSelectedName] = useState('');
    const clRef = useRef<HTMLDivElement>(null);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<PositionDefinitionResponse | null>(null);

    // Preview modal
    const [previewPosition, setPreviewPosition] = useState<PositionDefinitionResponse | null>(null);

    // ==================== Data Fetching ====================

    const fetchPositions = useCallback(async (page?: number) => {
        try {
            setLoading(true);
            const params: PositionFilterParams = {
                page: page ?? currentPage,
                size: pageSize,
            };
            if (searchDebounced.trim()) params.search = searchDebounced.trim();
            if (filterJobFamilyId !== 'all') params.jobFamilyId = filterJobFamilyId;
            if (filterStatus === 'active') params.isActive = true;
            else if (filterStatus === 'inactive') params.isActive = false;

            const res = await organizationService.getPositionDefinitions(params);
            // Handle both Page<T> shape and raw array fallback
            if (Array.isArray(res)) {
                setPositions(res);
                setTotalElements(res.length);
                setTotalPages(1);
                setCurrentPage(0);
            } else {
                setPositions(res.content ?? []);
                setTotalElements(res.totalElements ?? 0);
                setTotalPages(res.totalPages ?? 1);
                setCurrentPage(res.number ?? 0);
            }
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to load positions', message: err?.message });
        } finally {
            setLoading(false);
        }
    }, [searchDebounced, filterJobFamilyId, filterStatus, currentPage, addNotification]);

    const fetchJobFamilyOptions = useCallback(async () => {
        try {
            const data = await organizationService.searchReferenceData('job-families', '');
            // Fallback: if search returns empty for blank query, get all
            if (data.length === 0) {
                const all = await organizationService.searchReferenceData('job-families', ' ');
                setJobFamilyOptions(all);
            } else {
                setJobFamilyOptions(data);
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (!canView) {
            router.push('/');
            return;
        }
        fetchPositions(0);
        fetchJobFamilyOptions();
    }, [canView, router, fetchJobFamilyOptions]);

    // Re-fetch when filters change (debounced search, job family, status)
    useEffect(() => {
        if (!canView) return;
        fetchPositions(0);
    }, [searchDebounced, filterJobFamilyId, filterStatus]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setSearchDebounced(searchQuery), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Debounce Job Family search in modal
    useEffect(() => {
        const timer = setTimeout(() => setJfSearchDebounced(jfSearch), 400);
        return () => clearTimeout(timer);
    }, [jfSearch]);

    useEffect(() => {
        if (!jfDropdownOpen) return;
        const fetchJf = async () => {
            try {
                const data = await organizationService.searchReferenceData('job-families', jfSearchDebounced || ' ');
                setJfResults(data);
            } catch { setJfResults([]); }
        };
        fetchJf();
    }, [jfSearchDebounced, jfDropdownOpen]);

    // Debounce Clearance Level search in modal
    useEffect(() => {
        const timer = setTimeout(() => setClSearchDebounced(clSearch), 400);
        return () => clearTimeout(timer);
    }, [clSearch]);

    useEffect(() => {
        if (!clDropdownOpen) return;
        const fetchCl = async () => {
            try {
                const data = await organizationService.searchReferenceData('clearance-levels', clSearchDebounced || ' ');
                setClResults(data);
            } catch { setClResults([]); }
        };
        fetchCl();
    }, [clSearchDebounced, clDropdownOpen]);

    // Click outside to close dropdowns
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (jfRef.current && !jfRef.current.contains(e.target as Node)) setJfDropdownOpen(false);
            if (clRef.current && !clRef.current.contains(e.target as Node)) setClDropdownOpen(false);
            if (filterJfRef.current && !filterJfRef.current.contains(e.target as Node)) setFilterJfDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Debounce filter Job Family search
    useEffect(() => {
        const timer = setTimeout(() => setFilterJfSearchDebounced(filterJfSearch), 400);
        return () => clearTimeout(timer);
    }, [filterJfSearch]);

    // Fetch filter Job Family results
    useEffect(() => {
        if (!filterJfDropdownOpen) return;
        const fetchFilterJf = async () => {
            try {
                const data = await organizationService.searchReferenceData('job-families', filterJfSearchDebounced || ' ');
                setFilterJfResults(data);
            } catch { setFilterJfResults([]); }
        };
        fetchFilterJf();
    }, [filterJfSearchDebounced, filterJfDropdownOpen]);

    // No client-side filtering needed — all filtering is server-side

    // ==================== Modal Handlers ====================

    const openCreateModal = () => {
        setEditingPosition(null);
        setFormCode('');
        setFormTitle('');
        setFormDescription('');
        setFormLevelBand('');
        setFormSortOrder(0);
        setFormIsActive(true);
        setFormJobFamilyId('');
        setFormClearanceLevelId('');
        setJfSelectedName('');
        setClSelectedName('');
        setJfSearch('');
        setClSearch('');
        setJfCreateMode(false);
        setJfEditingId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (pos: PositionDefinitionResponse) => {
        setEditingPosition(pos);
        setFormCode(pos.code);
        setFormTitle(pos.title);
        setFormDescription(pos.description || '');
        setFormLevelBand(pos.levelBand || '');
        setFormSortOrder(pos.sortOrder || 0);
        setFormIsActive(pos.isActive);
        setFormJobFamilyId(pos.jobFamilyId || '');
        setFormClearanceLevelId(pos.minClearanceLevelId || '');
        setJfSelectedName(pos.jobFamilyName || '');
        setClSelectedName(pos.minClearanceLevelName || '');
        setJfSearch('');
        setClSearch('');
        setJfCreateMode(false);
        setJfEditingId(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPosition(null);
        setJfDropdownOpen(false);
        setClDropdownOpen(false);
        setJfCreateMode(false);
        setJfEditingId(null);
    };

    const handleSubmit = async () => {
        if (!formCode.trim() || !formTitle.trim()) {
            addNotification({ type: 'error', title: 'Validation Error', message: 'Code and Title are required' });
            return;
        }
        try {
            setActionLoading(true);
            if (editingPosition) {
                // Update
                const req: UpdatePositionDefinitionRequest = {
                    code: formCode.trim(),
                    title: formTitle.trim(),
                    description: formDescription.trim() || undefined,
                    levelBand: formLevelBand.trim() || undefined,
                    sortOrder: formSortOrder,
                    isActive: formIsActive,
                };
                // Job Family
                if (formJobFamilyId && formJobFamilyId !== editingPosition.jobFamilyId) {
                    req.jobFamilyId = formJobFamilyId;
                } else if (!formJobFamilyId && editingPosition.jobFamilyId) {
                    req.clearJobFamily = true;
                }
                // Clearance Level
                if (formClearanceLevelId && formClearanceLevelId !== editingPosition.minClearanceLevelId) {
                    req.minClearanceLevelId = formClearanceLevelId;
                } else if (!formClearanceLevelId && editingPosition.minClearanceLevelId) {
                    req.clearMinClearanceLevel = true;
                }
                await organizationService.updatePositionDefinition(editingPosition.id, req);
                addNotification({ type: 'success', title: 'Position Updated', message: `"${formTitle}" updated successfully` });
            } else {
                // Create
                const req: CreatePositionDefinitionRequest = {
                    code: formCode.trim(),
                    title: formTitle.trim(),
                    description: formDescription.trim() || undefined,
                    jobFamilyId: formJobFamilyId || undefined,
                    levelBand: formLevelBand.trim() || undefined,
                    minClearanceLevelId: formClearanceLevelId || undefined,
                    sortOrder: formSortOrder,
                };
                await organizationService.createPositionDefinition(req);
                addNotification({ type: 'success', title: 'Position Created', message: `"${formTitle}" created successfully` });
            }
            closeModal();
            fetchPositions(currentPage);
            fetchJobFamilyOptions();
        } catch (err: any) {
            addNotification({ type: 'error', title: editingPosition ? 'Failed to update' : 'Failed to create', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    // ==================== Delete Handler ====================

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setActionLoading(true);
            await organizationService.deletePositionDefinition(deleteTarget.id);
            addNotification({ type: 'success', title: 'Position Deleted', message: `"${deleteTarget.title}" deleted successfully` });
            setDeleteTarget(null);
            fetchPositions(currentPage);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to delete', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    // ==================== Job Family Inline CRUD ====================

    const handleJfCreate = async () => {
        if (!jfFormCode.trim() || !jfFormName.trim()) return;
        try {
            setActionLoading(true);
            const created = await organizationService.createReferenceData('job-families', {
                code: jfFormCode.trim(),
                name: jfFormName.trim(),
                description: jfFormDescription.trim() || undefined,
            });
            addNotification({ type: 'success', title: 'Job Family Created', message: `"${created.name}" created` });
            setJfCreateMode(false);
            setJfFormCode('');
            setJfFormName('');
            setJfFormDescription('');
            // Auto-select the new one
            setFormJobFamilyId(created.id);
            setJfSelectedName(created.name);
            // Refresh dropdown
            setJfSearchDebounced('');
            fetchJobFamilyOptions();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to create job family', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleJfUpdate = async (id: string) => {
        if (!jfFormName.trim()) return;
        try {
            setActionLoading(true);
            const updated = await organizationService.updateReferenceData('job-families', id, {
                code: jfFormCode.trim() || undefined,
                name: jfFormName.trim(),
                description: jfFormDescription.trim() || undefined,
            });
            addNotification({ type: 'success', title: 'Job Family Updated', message: `"${updated.name}" updated` });
            setJfEditingId(null);
            if (formJobFamilyId === id) setJfSelectedName(updated.name);
            setJfSearchDebounced('');
            fetchJobFamilyOptions();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to update job family', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleJfDelete = async (id: string, name: string) => {
        try {
            setActionLoading(true);
            await organizationService.deleteReferenceData('job-families', id);
            addNotification({ type: 'success', title: 'Job Family Deleted', message: `"${name}" deleted` });
            if (formJobFamilyId === id) {
                setFormJobFamilyId('');
                setJfSelectedName('');
            }
            setJfSearchDebounced('');
            fetchJobFamilyOptions();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to delete job family', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    const startJfEdit = (item: ReferenceDataItem) => {
        setJfEditingId(item.id);
        setJfFormCode(item.code);
        setJfFormName(item.name);
        setJfFormDescription(item.description || '');
    };

    // ==================== Utility ====================

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    };

    // ==================== Render ====================

    if (!canView) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* ==================== Header ==================== */}
            <div className="flex-shrink-0 p-6 pb-4">
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                                    <Briefcase className="h-7 w-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">Position Catalog</h1>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        Enterprise-wide position definitions — global job titles used across all organizational units
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => router.push('/admin/organization')} className="gap-1.5 text-muted-foreground hover:text-foreground">
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Back to Organization
                                </Button>
                                <div className="w-px h-5 bg-border" />
                                <Button variant="outline" size="sm" onClick={() => fetchPositions(currentPage)} className="gap-1.5">
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Refresh
                                </Button>
                                {canCreate && (
                                    <Button size="sm" onClick={openCreateModal} className="gap-1.5">
                                        <Plus className="h-3.5 w-3.5" />
                                        Create Position
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ==================== Search & Filters ==================== */}
            <div className="flex-shrink-0 px-6 pb-4">
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search positions by title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-8"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Job Family filter (searchable dropdown) */}
                    <div className="relative" ref={filterJfRef}>
                        <div
                            className="flex items-center border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors h-9 w-[220px]"
                            onClick={() => setFilterJfDropdownOpen(!filterJfDropdownOpen)}
                        >
                            <Filter className="h-3.5 w-3.5 text-muted-foreground mr-2 flex-shrink-0" />
                            {filterJfDropdownOpen ? (
                                <input
                                    autoFocus
                                    value={filterJfSearch}
                                    onChange={(e) => setFilterJfSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Search job families..."
                                    className="flex-1 bg-transparent outline-none text-sm"
                                />
                            ) : (
                                <span className={`text-sm flex-1 truncate ${filterJfSelectedName ? '' : 'text-muted-foreground'}`}>
                                    {filterJfSelectedName || 'All Job Families'}
                                </span>
                            )}
                            {filterJobFamilyId !== 'all' && !filterJfDropdownOpen ? (
                                <button onClick={(e) => { e.stopPropagation(); setFilterJobFamilyId('all'); setFilterJfSelectedName(''); }} className="text-muted-foreground hover:text-foreground ml-1">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            ) : (
                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ml-1 ${filterJfDropdownOpen ? 'rotate-180' : ''}`} />
                            )}
                        </div>
                        {filterJfDropdownOpen && (
                            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                <button
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${filterJobFamilyId === 'all' ? 'bg-muted/30 font-medium' : ''}`}
                                    onClick={() => { setFilterJobFamilyId('all'); setFilterJfSelectedName(''); setFilterJfDropdownOpen(false); setFilterJfSearch(''); }}
                                >
                                    All Job Families
                                </button>
                                {filterJfResults.length === 0 ? (
                                    <div className="px-3 py-3 text-sm text-muted-foreground text-center">No job families found</div>
                                ) : (
                                    filterJfResults.map(jf => (
                                        <button
                                            key={jf.id}
                                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors ${filterJobFamilyId === jf.id ? 'bg-muted/30 font-medium' : ''}`}
                                            onClick={() => { setFilterJobFamilyId(jf.id); setFilterJfSelectedName(jf.name); setFilterJfDropdownOpen(false); setFilterJfSearch(''); }}
                                        >
                                            {filterJobFamilyId === jf.id && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                                            <span>{jf.name}</span>
                                            <span className="text-xs text-muted-foreground font-mono">({jf.code})</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status filter */}
                    <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Count badge */}
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        {totalElements} position{totalElements !== 1 ? 's' : ''}
                    </Badge>
                </div>
            </div>

            {/* ==================== Table ==================== */}
            <div className="flex-1 px-6 pb-6 min-h-0">
                <Card className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">Loading positions...</p>
                                </div>
                            </div>
                        ) : positions.length === 0 ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="text-center">
                                    <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-muted-foreground font-medium">
                                        {searchQuery || filterJobFamilyId !== 'all' || filterStatus !== 'all'
                                            ? 'No positions match your filters'
                                            : 'No position definitions yet'
                                        }
                                    </p>
                                    <p className="text-sm text-muted-foreground/60 mt-1">
                                        {!searchQuery && filterJobFamilyId === 'all' && filterStatus === 'all' && canCreate
                                            ? 'Create your first position definition to get started'
                                            : 'Try adjusting your search or filters'
                                        }
                                    </p>
                                    {!searchQuery && filterJobFamilyId === 'all' && filterStatus === 'all' && canCreate && (
                                        <Button size="sm" onClick={openCreateModal} className="gap-1.5 mt-4">
                                            <Plus className="h-3.5 w-3.5" />
                                            Create Position
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
                                    <tr className="border-b">
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Code</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Title</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Job Family</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Level Band</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Min Clearance</th>
                                        <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Updated</th>
                                        {(canUpdate || canDelete) && (
                                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {positions.map((pos) => (
                                        <tr
                                            key={pos.id}
                                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            onClick={() => setPreviewPosition(pos)}
                                        >
                                            <td className="px-4 py-3">
                                                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{pos.code}</code>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-sm">{pos.title}</span>
                                                {pos.description && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-xs">{pos.description}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {pos.jobFamilyName ? (
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        {pos.jobFamilyName}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {pos.levelBand ? (
                                                    <span className="text-sm">{pos.levelBand}</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {pos.minClearanceLevelName ? (
                                                    <Badge variant="outline" className="text-xs font-normal gap-1">
                                                        <Shield className="h-3 w-3" />
                                                        {pos.minClearanceLevelName}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge
                                                    className={`text-xs border-0 ${pos.isActive
                                                        ? 'bg-green-600 text-white hover:bg-green-600'
                                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                                        }`}
                                                >
                                                    {pos.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-muted-foreground">{formatDate(pos.updatedAt)}</span>
                                            </td>
                                            {(canUpdate || canDelete) && (
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {canUpdate && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7"
                                                                        onClick={(e) => { e.stopPropagation(); openEditModal(pos); }}
                                                                    >
                                                                        <Edit className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Edit</TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {canDelete && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                                                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(pos); }}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Delete</TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex-shrink-0 border-t px-4 py-3 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Page {currentPage + 1} of {totalPages} · {totalElements} total
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchPositions(currentPage - 1)}
                                    disabled={currentPage === 0 || loading}
                                    className="gap-1 h-8"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchPositions(currentPage + 1)}
                                    disabled={currentPage >= totalPages - 1 || loading}
                                    className="gap-1 h-8"
                                >
                                    Next
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* ==================== Create/Edit Modal ==================== */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-background rounded-xl shadow-2xl border w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-background z-20 px-6 py-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                                    <Briefcase className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">{editingPosition ? 'Edit Position' : 'Create Position'}</h2>
                                    <p className="text-xs text-muted-foreground">
                                        {editingPosition ? `Editing "${editingPosition.title}"` : 'Define a new enterprise position'}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            {/* Code & Title */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Code <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={formCode}
                                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                        placeholder="e.g. SR_ENG"
                                        className="font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Title <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={formTitle}
                                        onChange={(e) => setFormTitle(e.target.value)}
                                        placeholder="e.g. Senior Engineer"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Description</Label>
                                <Textarea
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder="Brief description of this position..."
                                    rows={2}
                                />
                            </div>

                            {/* Job Family — Server-side search dropdown with inline CRUD */}
                            <div className="space-y-2" ref={jfRef}>
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Job Family</Label>
                                    {formJobFamilyId && (
                                        <button
                                            onClick={() => { setFormJobFamilyId(''); setJfSelectedName(''); }}
                                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                        >
                                            <X className="h-3 w-3" /> Clear
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <div
                                        className="flex items-center border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
                                        onClick={() => { setJfDropdownOpen(!jfDropdownOpen); setJfCreateMode(false); setJfEditingId(null); }}
                                    >
                                        <Search className="h-3.5 w-3.5 text-muted-foreground mr-2 flex-shrink-0" />
                                        {jfDropdownOpen ? (
                                            <input
                                                autoFocus
                                                value={jfSearch}
                                                onChange={(e) => setJfSearch(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                placeholder="Search job families..."
                                                className="flex-1 bg-transparent outline-none text-sm"
                                            />
                                        ) : (
                                            <span className={`text-sm flex-1 ${jfSelectedName ? '' : 'text-muted-foreground'}`}>
                                                {jfSelectedName || 'Select job family...'}
                                            </span>
                                        )}
                                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${jfDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    {jfDropdownOpen && (
                                        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                            {/* Results list */}
                                            {jfResults.length === 0 ? (
                                                <div className="px-3 py-4 text-sm text-muted-foreground text-center">No job families found</div>
                                            ) : (
                                                jfResults.map(jf => (
                                                    <button
                                                        key={jf.id}
                                                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors ${formJobFamilyId === jf.id ? 'bg-muted/30 font-medium' : ''}`}
                                                        onClick={() => {
                                                            setFormJobFamilyId(jf.id);
                                                            setJfSelectedName(jf.name);
                                                            setJfDropdownOpen(false);
                                                            setJfSearch('');
                                                        }}
                                                    >
                                                        {formJobFamilyId === jf.id && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                                                        <span>{jf.name}</span>
                                                        <span className="text-xs text-muted-foreground font-mono">({jf.code})</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Level Band & Min Clearance */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Level Band</Label>
                                    <Input
                                        value={formLevelBand}
                                        onChange={(e) => setFormLevelBand(e.target.value)}
                                        placeholder="e.g. L5, Junior, Senior"
                                    />
                                </div>

                                {/* Clearance Level search dropdown */}
                                <div className="space-y-2" ref={clRef}>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Min Clearance Level</Label>
                                        {formClearanceLevelId && (
                                            <button
                                                onClick={() => { setFormClearanceLevelId(''); setClSelectedName(''); }}
                                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                            >
                                                <X className="h-3 w-3" /> Clear
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <div
                                            className="flex items-center border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
                                            onClick={() => setClDropdownOpen(!clDropdownOpen)}
                                        >
                                            <Shield className="h-3.5 w-3.5 text-muted-foreground mr-2 flex-shrink-0" />
                                            {clDropdownOpen ? (
                                                <input
                                                    autoFocus
                                                    value={clSearch}
                                                    onChange={(e) => setClSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    placeholder="Search clearance levels..."
                                                    className="flex-1 bg-transparent outline-none text-sm"
                                                />
                                            ) : (
                                                <span className={`text-sm flex-1 ${clSelectedName ? '' : 'text-muted-foreground'}`}>
                                                    {clSelectedName || 'Select clearance level...'}
                                                </span>
                                            )}
                                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${clDropdownOpen ? 'rotate-180' : ''}`} />
                                        </div>

                                        {clDropdownOpen && (
                                            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {clResults.length === 0 ? (
                                                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">No clearance levels found</div>
                                                ) : (
                                                    clResults.map(cl => (
                                                        <button
                                                            key={cl.id}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
                                                            onClick={() => {
                                                                setFormClearanceLevelId(cl.id);
                                                                setClSelectedName(cl.name);
                                                                setClDropdownOpen(false);
                                                                setClSearch('');
                                                            }}
                                                        >
                                                            {formClearanceLevelId === cl.id && <Check className="h-3.5 w-3.5 text-primary" />}
                                                            <span>{cl.name}</span>
                                                            {cl.color && (
                                                                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: cl.color }} />
                                                            )}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sort Order & Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Sort Order</Label>
                                    <Input
                                        type="number"
                                        value={formSortOrder}
                                        onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                {editingPosition && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Status</Label>
                                        <Select value={formIsActive ? 'active' : 'inactive'} onValueChange={(v) => setFormIsActive(v === 'active')}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-background z-20 px-6 py-4 border-t flex justify-end gap-2">
                            <Button variant="outline" onClick={closeModal} disabled={actionLoading}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={actionLoading} className="gap-1.5">
                                {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                {editingPosition ? 'Save Changes' : 'Create Position'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== Preview Modal ==================== */}
            {previewPosition && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPreviewPosition(null)} />
                    <div className="relative bg-background rounded-xl shadow-2xl border w-full max-w-lg mx-4 overflow-hidden">
                        {/* Preview Header */}
                        <div className="px-6 py-5 border-b">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                                        <Briefcase className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold leading-tight">{previewPosition.title}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{previewPosition.code}</code>
                                            <Badge
                                                className={`text-xs border-0 ${previewPosition.isActive
                                                    ? 'bg-green-600 text-white hover:bg-green-600'
                                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {previewPosition.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setPreviewPosition(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Preview Body */}
                        <div className="px-6 py-5 space-y-5">
                            {/* Description */}
                            {previewPosition.description && (
                                <div>
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                                        <FileText className="h-3.5 w-3.5" />
                                        Description
                                    </div>
                                    <p className="text-sm text-foreground leading-relaxed">{previewPosition.description}</p>
                                </div>
                            )}

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <Layers className="h-3.5 w-3.5" />
                                        Job Family
                                    </div>
                                    <p className="text-sm font-medium">
                                        {previewPosition.jobFamilyName || <span className="text-muted-foreground/50 font-normal">Not assigned</span>}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <Hash className="h-3.5 w-3.5" />
                                        Level Band
                                    </div>
                                    <p className="text-sm font-medium">
                                        {previewPosition.levelBand || <span className="text-muted-foreground/50 font-normal">Not set</span>}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <Shield className="h-3.5 w-3.5" />
                                        Min Clearance
                                    </div>
                                    <p className="text-sm font-medium">
                                        {previewPosition.minClearanceLevelName || <span className="text-muted-foreground/50 font-normal">None required</span>}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Sort Order
                                    </div>
                                    <p className="text-sm font-medium">{previewPosition.sortOrder}</p>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="flex items-center gap-6 pt-2 border-t">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Created {formatDate(previewPosition.createdAt)}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Updated {formatDate(previewPosition.updatedAt)}
                                </div>
                            </div>
                        </div>

                        {/* Preview Footer */}
                        {(canUpdate || canDelete) && (
                            <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-2">
                                {canDelete && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => { setDeleteTarget(previewPosition); setPreviewPosition(null); }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                    </Button>
                                )}
                                {canUpdate && (
                                    <Button
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={() => { openEditModal(previewPosition); setPreviewPosition(null); }}
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                        Edit Position
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ==================== Delete Confirmation Dialog ==================== */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-background rounded-xl shadow-2xl border w-full max-w-md mx-4 p-6">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-destructive/10 text-destructive flex-shrink-0">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold">Delete Position</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Are you sure you want to delete <strong>&quot;{deleteTarget.title}&quot;</strong> ({deleteTarget.code})?
                                    This will soft-delete the position definition.
                                </p>
                                <div className="flex justify-end gap-2 mt-5">
                                    <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={actionLoading}>
                                        Cancel
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={actionLoading} className="gap-1.5">
                                        {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
