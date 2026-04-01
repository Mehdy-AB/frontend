// app/workspaces/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Globe, Plus, Search, RefreshCw, Filter, Shield, Users,
    Globe2, X, Eye, Send, Clock, CheckCircle, XCircle, AlertTriangle,
    MessageSquare, Sparkles, LayoutGrid, List, FolderOpen, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    workspaceService, WorkspaceDto, WorkspaceType, WorkspaceStatus, WorkspaceStatsDto,
    CreateWorkspaceRequest, WorkspaceRequestDto, SubmitWorkspaceRequestPayload,
} from '@/api/services/workspaceService';
import { WorkspaceCard, PolicyEditor } from '@/components/workspace';
import { PolicyFormState, defaultPolicyForm, AvailableModel } from '@/components/workspace/PolicyEditor';
import Pagination from '@/components/main/Pagination';
import UserAvatar from '@/components/main/UserAvatar';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { fileTypeService } from '@/api/services/fileTypeService';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { notificationApiClient } from '@/api/notificationClient';

type SortOption = 'name-asc' | 'name-desc' | 'createdAt-desc' | 'createdAt-asc' | 'updatedAt-desc';
type FilterStatus = 'all' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
type ViewMode = 'all' | 'my' | 'managed' | 'requests';
type CreateStep = 'basics' | 'security' | 'ingestion' | 'access' | 'review';

interface CreateFormState extends PolicyFormState {
    name: string;
    code: string;
    description: string;
    type: WorkspaceType;
    justification: string; // for request fallback
}

const defaultForm: CreateFormState = {
    name: '', code: '', description: '', type: 'STANDARD', justification: '',
    ...defaultPolicyForm,
};

export default function WorkspacesPage() {
    const router = useRouter();
    const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('name-asc');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('all');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Create modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createStep, setCreateStep] = useState<CreateStep>('basics');
    const [createForm, setCreateForm] = useState<CreateFormState>({ ...defaultForm });
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [isRequestMode, setIsRequestMode] = useState(false); // true when user lacks create permission

    // Governance data
    const [availableFileTypes, setAvailableFileTypes] = useState<AvailableModel[]>([]);
    const [availableFilingCategories, setAvailableFilingCategories] = useState<AvailableModel[]>([]);
    const [availableWorkflows, setAvailableWorkflows] = useState<AvailableModel[]>([]);
    const governanceFetchedRef = useRef(false);
    const [workspaceStats, setWorkspaceStats] = useState<Record<string, WorkspaceStatsDto>>({});

    // Requests tab
    const [pendingRequests, setPendingRequests] = useState<WorkspaceRequestDto[]>([]);
    const [myRequests, setMyRequests] = useState<WorkspaceRequestDto[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [reviewComment, setReviewComment] = useState('');

    const fetchWorkspaces = useCallback(async () => {
        setLoading(true);
        try {
            const [sortField, sortDir] = sortOption.split('-');
            const sortParam = `${sortField},${sortDir}`;
            let response;
            if (viewMode === 'my') {
                response = await workspaceService.getMyWorkspaces(page, pageSize, sortParam);
            } else if (viewMode === 'managed') {
                response = await workspaceService.getMyManagedWorkspaces(page, pageSize, sortParam);
            } else {
                response = await workspaceService.searchWorkspaces({
                    page, size: pageSize, sort: sortParam,
                    search: searchQuery || undefined,
                    type: 'STANDARD',
                    status: filterStatus !== 'all' ? filterStatus as WorkspaceStatus : undefined,
                });
            }
            setWorkspaces(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
            // Fetch stats for each workspace
            response.content.forEach(ws => {
                workspaceService.getStats(ws.id)
                    .then(stats => setWorkspaceStats(prev => ({ ...prev, [ws.id]: stats })))
                    .catch(() => { });
            });
        } catch (error) {
            console.error('Failed to fetch workspaces:', error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, sortOption, filterStatus, viewMode, searchQuery]);

    const fetchRequests = useCallback(async () => {
        setLoadingRequests(true);
        try {
            const [pending, my] = await Promise.all([
                workspaceService.listPendingRequests().catch(() => []),
                workspaceService.listMyRequests().catch(() => []),
            ]);
            setPendingRequests(pending);
            setMyRequests(my);
        } catch {
            console.error('Failed to load requests');
        } finally {
            setLoadingRequests(false);
        }
    }, []);

    useEffect(() => {
        if (viewMode === 'requests') {
            fetchRequests();
        } else {
            fetchWorkspaces();
        }
    }, [viewMode, fetchWorkspaces, fetchRequests]);

    useEffect(() => { setPage(0); }, [sortOption, filterStatus, viewMode, searchQuery]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        if (viewMode === 'requests') await fetchRequests();
        else await fetchWorkspaces();
        setIsRefreshing(false);
    };

    const handleCreateWorkspace = async () => {
        setIsCreating(true);
        setCreateError('');
        try {
            // If user explicitly chose request mode, submit as request
            if (isRequestMode) {
                if (!createForm.justification.trim()) {
                    setCreateError('Justification is required for workspace requests');
                    setIsCreating(false);
                    return;
                }
                const requestPayload: SubmitWorkspaceRequestPayload = {
                    name: createForm.name,
                    code: createForm.code,
                    description: createForm.description || undefined,
                    justification: createForm.justification,
                    type: createForm.type,
                    watermarkRequired: createForm.watermarkRequired,
                    maxFileSizeBytes: createForm.maxFileSizeMb ? parseInt(createForm.maxFileSizeMb) * 1048576 : undefined,
                    virusScanRequired: createForm.virusScanRequired,
                    ocrMode: createForm.ocrMode,
                    archiveHandling: createForm.archiveHandling,
                    crossWorkspaceAclAllowed: createForm.crossWorkspaceAclAllowed,
                    inheritanceEnforced: createForm.inheritanceEnforced,
                    classificationDefault: createForm.classificationDefault || undefined,
                    versioningRequired: createForm.versioningRequired,
                };
                await workspaceService.submitRequest(requestPayload);
                setShowCreateModal(false);
                setCreateForm({ ...defaultForm });
                setCreateStep('basics');
                setIsRequestMode(false);
                setViewMode('requests');
                fetchRequests();
                return;
            }

            // Try direct create
            const payload: CreateWorkspaceRequest = {
                name: createForm.name,
                code: createForm.code,
                description: createForm.description || undefined,
                type: createForm.type,
                watermarkRequired: createForm.watermarkRequired,
                maxFileSizeBytes: createForm.maxFileSizeMb ? parseInt(createForm.maxFileSizeMb) * 1048576 : undefined,
                virusScanRequired: createForm.virusScanRequired,
                ocrMode: createForm.ocrMode,
                archiveHandling: createForm.archiveHandling,
                crossWorkspaceAclAllowed: createForm.crossWorkspaceAclAllowed,
                inheritanceEnforced: createForm.inheritanceEnforced,
                classificationDefault: createForm.classificationDefault || undefined,
                versioningRequired: createForm.versioningRequired,
            };
            await workspaceService.createWorkspace(payload);
            setShowCreateModal(false);
            setCreateForm({ ...defaultForm });
            setCreateStep('basics');
            fetchWorkspaces();
        } catch (error: unknown) {
            // Check if it's a 403 — switch to request mode
            const err = error as { status?: number; response?: { status: number } };
            if (err?.status === 403 || err?.response?.status === 403) {
                setIsRequestMode(true);
                setCreateError('You don\'t have permission to create workspaces directly. Fill in a justification and submit as a request for admin approval.');
            } else {
                setCreateError(error instanceof Error ? error.message : 'Failed to create workspace');
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleReviewRequest = async (requestId: number, approved: boolean) => {
        try {
            await workspaceService.reviewRequest(requestId, { approved, comment: reviewComment || undefined });
            setReviewComment('');
            fetchRequests();
        } catch (error) {
            console.error('Failed to review request:', error);
        }
    };

    const openCreateModal = () => {
        setCreateForm({ ...defaultForm });
        setCreateStep('basics');
        setCreateError('');
        setIsRequestMode(false);
        setShowCreateModal(true);
        // Fetch governance data
        if (!governanceFetchedRef.current) {
            governanceFetchedRef.current = true;
            fileTypeService.getAllowedFileTypes()
                .then(types => setAvailableFileTypes(types.map(t => ({ id: t.id, label: t.label || t.mimeType }))))
                .catch(err => console.error('Failed to load file types:', err));
            filingCategoryService.getAllFilingCategories({ size: 200 })
                .then(res => setAvailableFilingCategories(res.content.map((c: { id: number; name: string }) => ({ id: c.id, label: c.name }))))
                .catch(err => console.error('Failed to load filing categories:', err));
            workflowAdminService.getAllWorkflows(0, 200)
                .then(res => setAvailableWorkflows(res.content.map(w => ({ id: w.id, label: w.name, description: w.description }))))
                .catch(err => console.error('Failed to load workflows:', err));
        }
    };

    // Remote search functions for SearchSelect
    const fetchFilingCategoriesRemote = useCallback(async (query: string): Promise<AvailableModel[]> => {
        const response = await notificationApiClient.getAllFilingCategories({ size: 100, name: query }, { silent: true });
        return response.content.map((c: { id: number; name: string; description?: string }) => ({ id: c.id, label: c.name, description: c.description }));
    }, []);

    const fetchWorkflowsRemote = useCallback(async (query: string): Promise<AvailableModel[]> => {
        const res = await workflowAdminService.getAllWorkflows(0, 100, query);
        return res.content.map(w => ({ id: w.id, label: w.name, description: w.description }));
    }, []);

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const updateForm = (key: keyof CreateFormState, value: unknown) => setCreateForm(prev => ({ ...prev, [key]: value }));

    const steps: { key: CreateStep; label: string; icon: React.ElementType }[] = [
        { key: 'basics', label: 'Basic Info', icon: Globe },
        { key: 'security', label: 'Security', icon: Shield },
        { key: 'ingestion', label: 'Ingestion', icon: Filter },
        { key: 'access', label: 'Access', icon: Users },
        { key: 'review', label: 'Review', icon: Eye },
    ];
    const stepIndex = steps.findIndex(s => s.key === createStep);

    const getRequestStatusColor = (s: string) =>
        s === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : s === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';

    return (
        <div className="space-y-6">
            {/* ─── Header ─── */}
            <div className="space-y-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-100">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                <Globe className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Workspaces</h1>
                                <p className="text-gray-500 text-sm font-medium">Governed content containers for your organization</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex gap-3">
                            <div className="flex flex-col items-center px-5 py-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm min-w-[80px]">
                                <span className="text-2xl font-bold text-gray-900">{totalElements || 0}</span>
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* View Mode Tabs + Actions */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                        {([
                            { value: 'all' as const, label: 'All Workspaces', icon: Globe2 },
                            { value: 'my' as const, label: 'My Workspaces', icon: Users },
                            { value: 'managed' as const, label: 'I Manage', icon: Shield },
                            { value: 'requests' as const, label: 'Requests', icon: Send },
                        ]).map(tab => (
                            <button key={tab.value} onClick={() => setViewMode(tab.value)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <tab.icon className="h-4 w-4" />{tab.label}
                                {tab.value === 'requests' && (pendingRequests.length + myRequests.length) > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-semibold">
                                        {pendingRequests.length + myRequests.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || loading}
                            className="h-10 px-4 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors rounded-xl">
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />Refresh
                        </Button>
                        <Button onClick={openCreateModal}
                            className="h-10 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl border-0">
                            <Plus className="h-4 w-4 mr-2" />New Workspace
                        </Button>
                    </div>
                </div>
            </div>

            {/* REQUESTS TAB */}
            {viewMode === 'requests' ? (
                <div className="space-y-6">
                    {/* Pending Requests (admin) */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-amber-500" />Pending Requests
                            {pendingRequests.length > 0 && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">{pendingRequests.length}</Badge>
                            )}
                        </h2>
                        {loadingRequests ? (
                            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
                        ) : pendingRequests.length === 0 ? (
                            <Card className="border-dashed"><CardContent className="py-10 text-center">
                                <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">No pending requests to review</p>
                            </CardContent></Card>
                        ) : (
                            <div className="space-y-3">
                                {pendingRequests.map(req => (
                                    <Card key={req.id} className="border border-amber-100 hover:shadow-md transition-all">
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    {req.requestedBy && (
                                                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                                                            <UserAvatar
                                                                user={{
                                                                    firstName: req.requestedBy.firstName,
                                                                    lastName: req.requestedBy.lastName,
                                                                    imgUrl: req.requestedBy.avatarUrl || undefined,
                                                                }}
                                                                size="md"
                                                            />
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">
                                                                    {req.requestedBy.firstName} {req.requestedBy.lastName}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-xs text-gray-400">@{req.requestedBy.username}</p>
                                                                    <span className="text-xs text-gray-300">&bull;</span>
                                                                    <p className="text-xs text-gray-400">{req.requestedBy.email}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-gray-900">{req.name}</h3>
                                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">{req.type}</Badge>
                                                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">PENDING</Badge>
                                                    </div>
                                                    <p className="text-xs text-gray-400 font-mono mb-2">{req.code}</p>
                                                    {req.description && <p className="text-sm text-gray-500 mb-2">{req.description}</p>}
                                                    <div className="p-3 bg-gray-50 rounded-lg mb-3">
                                                        <p className="text-xs text-gray-400 mb-1 font-medium">Justification</p>
                                                        <p className="text-sm text-gray-700">{req.justification}</p>
                                                    </div>
                                                    <p className="text-xs text-gray-400">Submitted {formatDate(req.createdAt)}</p>
                                                </div>
                                                <div className="flex flex-col gap-2 flex-shrink-0">
                                                    <Input value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                                                        placeholder="Comment (optional)" className="rounded-xl text-xs h-9 w-48" />
                                                    <Button size="sm" onClick={() => handleReviewRequest(req.id, true)}
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs">
                                                        <CheckCircle className="h-3.5 w-3.5 mr-1" />Approve
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleReviewRequest(req.id, false)}
                                                        className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs">
                                                        <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* My Requests */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-blue-500" />My Requests
                        </h2>
                        {myRequests.length === 0 ? (
                            <Card className="border-dashed"><CardContent className="py-10 text-center">
                                <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">No requests submitted yet</p>
                            </CardContent></Card>
                        ) : (
                            <div className="space-y-3">
                                {myRequests.map(req => (
                                    <Card key={req.id} className="hover:shadow-sm transition-all">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-medium text-gray-900">{req.name}</h3>
                                                        <Badge variant="secondary" className={`text-xs ${getRequestStatusColor(req.status)}`}>{req.status}</Badge>
                                                    </div>
                                                    <p className="text-xs text-gray-400">{formatDate(req.createdAt)}</p>
                                                </div>
                                                {req.reviewComment && (
                                                    <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg max-w-xs">
                                                        {req.reviewComment}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Search and Filter */}
                    <div className="flex flex-col lg:flex-row gap-4 p-1">
                        <div className="flex-1 flex gap-4 p-1.5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search workspaces by name or code..."
                                    className="h-11 pl-10 border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-gray-400" />
                            </div>
                            <div className="w-px bg-gray-200 my-2"></div>
                            <div className="flex items-center gap-2 pr-2">
                                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                                    <SelectTrigger className="w-[140px] h-9 border-0 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium focus:ring-0 transition-colors rounded-xl">
                                        <div className="flex items-center gap-2"><Filter className="h-3.5 w-3.5" /><SelectValue /></div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                                    <SelectTrigger className="w-[160px] h-9 border-0 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium focus:ring-0 transition-colors rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name-asc">Name A-Z</SelectItem>
                                        <SelectItem value="name-desc">Name Z-A</SelectItem>
                                        <SelectItem value="createdAt-desc">Newest First</SelectItem>
                                        <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                                        <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Workspace Cards */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {[...Array(6)].map((_, i) => (
                                <Card key={i} className="animate-pulse border-0 shadow-sm"><CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
                                        <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div><div className="h-3 bg-gray-100 rounded w-1/2"></div></div>
                                    </div>
                                    <div className="flex gap-2 mb-4"><div className="h-6 w-20 bg-gray-100 rounded-full"></div><div className="h-6 w-16 bg-gray-100 rounded-full"></div></div>
                                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                                </CardContent></Card>
                            ))}
                        </div>
                    ) : workspaces.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-20 border-dashed border-2 border-gray-200">
                            <CardContent className="text-center">
                                <div className="h-20 w-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Sparkles className="h-10 w-10 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No workspaces found</h3>
                                <p className="text-gray-500 mb-8 max-w-md">
                                    {searchQuery ? `No workspaces match "${searchQuery}"` : 'Create your first workspace to start organizing governed content'}
                                </p>
                                <Button onClick={openCreateModal} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl px-6 h-11">
                                    <Plus className="h-4 w-4 mr-2" />Create Workspace
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {workspaces.map(ws => <WorkspaceCard key={ws.id} workspace={ws} stats={workspaceStats[ws.id]} />)}
                        </div>
                    )}

                    <Pagination totalPages={totalPages} currentPage={page} totalElements={totalElements} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
                </>
            )}

            {/* ========== CREATE WORKSPACE MODAL ========== */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 h-[85vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isRequestMode ? 'bg-amber-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                                    {isRequestMode ? <Send className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {isRequestMode ? 'Request Workspace' : 'Create New Workspace'}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {isRequestMode
                                            ? 'Submit a request — an admin will review and approve'
                                            : 'Configure all settings for the new governed container'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => { setShowCreateModal(false); setIsRequestMode(false); }}
                                className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Step Navigation */}
                        <div className="px-8 py-4 border-b border-gray-100 bg-gray-50">
                            <div className="flex items-center gap-2">
                                {steps.map((step, i) => (
                                    <button key={step.key} onClick={() => setCreateStep(step.key)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${createStep === step.key ? 'bg-blue-500 text-white shadow-sm' :
                                            i < stepIndex ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                                        <step.icon className="h-4 w-4" />
                                        <span className="hidden sm:inline">{step.label}</span>
                                        <span className="sm:hidden">{i + 1}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 overflow-y-auto px-8 py-6">
                            {/* STEP 1: Basic Info */}
                            {createStep === 'basics' && (
                                <div className="space-y-5 max-w-2xl">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Workspace Name <span className="text-red-500">*</span></label>
                                        <Input value={createForm.name} onChange={(e) => updateForm('name', e.target.value)}
                                            placeholder="e.g. HR Department Documents" className="rounded-xl h-11" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Code <span className="text-red-500">*</span></label>
                                        <Input value={createForm.code}
                                            onChange={(e) => updateForm('code', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            placeholder="e.g. hr-docs" className="rounded-xl h-11 font-mono" />
                                        <p className="text-xs text-gray-400 mt-1">Unique identifier — lowercase, alphanumeric with hyphens</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
                                        <textarea value={createForm.description} onChange={(e) => updateForm('description', e.target.value)}
                                            placeholder="Describe the purpose of this workspace..." rows={3}
                                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Workspace Type</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {([
                                                { value: 'STANDARD' as const, title: 'Standard', desc: 'General-purpose governed workspace', icon: Globe },
                                                { value: 'SECURED' as const, title: 'Secured', desc: 'High-sensitivity with stricter controls', icon: Shield },
                                            ]).map(opt => (
                                                <button key={opt.value} type="button" onClick={() => updateForm('type', opt.value)}
                                                    className={`p-4 rounded-xl border-2 text-left transition-all ${createForm.type === opt.value
                                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                                                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}`}>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${createForm.type === opt.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                            <opt.icon className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-semibold text-gray-900">{opt.title}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 ml-12">{opt.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Security */}
                            {createStep === 'security' && (
                                <div>
                                    <PolicyEditor value={createForm} onChange={updateForm} section="security" isSecured={createForm.type === 'SECURED'} />
                                </div>
                            )}

                            {/* STEP 3: Ingestion */}
                            {createStep === 'ingestion' && (
                                <div>
                                    <PolicyEditor value={createForm} onChange={updateForm} section="ingestion"
                                        availableFileTypes={availableFileTypes}
                                        availableFilingCategories={availableFilingCategories}
                                        availableWorkflows={availableWorkflows}
                                        fetchFilingCategories={fetchFilingCategoriesRemote}
                                        fetchWorkflows={fetchWorkflowsRemote} />
                                </div>
                            )}

                            {/* STEP 4: Access */}
                            {createStep === 'access' && (
                                <div>
                                    <PolicyEditor value={createForm} onChange={updateForm} section="access" isSecured={createForm.type === 'SECURED'} />
                                </div>
                            )}

                            {/* STEP 5: Review */}
                            {createStep === 'review' && (
                                <div className="space-y-5 max-w-2xl">
                                    <div className="mb-4">
                                        <h3 className="text-base font-semibold text-gray-900">Review Configuration</h3>
                                        <p className="text-sm text-gray-500">Verify all settings before {isRequestMode ? 'submitting your request' : 'creating the workspace'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Basic Information</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div><span className="text-gray-400">Name:</span> <span className="font-medium text-gray-900">{createForm.name || '—'}</span></div>
                                            <div><span className="text-gray-400">Code:</span> <span className="font-mono font-medium text-gray-900">{createForm.code || '—'}</span></div>
                                            <div><span className="text-gray-400">Type:</span> <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200 ml-1">{createForm.type}</Badge></div>
                                            {createForm.description && <div className="col-span-2"><span className="text-gray-400">Description:</span> <span className="text-gray-700">{createForm.description}</span></div>}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Security</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {[
                                                { label: 'Watermark', v: createForm.watermarkRequired },
                                                { label: 'Export Folder', v: createForm.exportFolderEnabled },
                                                { label: 'Edit Documents', v: createForm.canEditDocuments },
                                                { label: 'Edit Folders', v: createForm.canEditFolders },
                                            ].map(item => (
                                                <div key={item.label} className="flex items-center gap-1.5 text-sm">
                                                    {item.v ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                                                    <span className="text-gray-600">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Ingestion & Processing</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div><span className="text-gray-400">Max File Size:</span> <span className="font-medium">{createForm.maxFileSizeMb ? `${createForm.maxFileSizeMb} MB` : 'System default'}</span></div>
                                            <div><span className="text-gray-400">Virus Scan:</span> <span className="font-medium">{createForm.virusScanRequired ? 'Required' : 'Optional'}</span></div>
                                            <div><span className="text-gray-400">OCR Mode:</span> <span className="font-medium">{createForm.ocrMode}</span></div>
                                            <div><span className="text-gray-400">Archive Handling:</span> <span className="font-medium">{createForm.archiveHandling}</span></div>
                                            {createForm.classificationDefault && <div><span className="text-gray-400">Classification:</span> <span className="font-medium">{createForm.classificationDefault}</span></div>}
                                            {createForm.allowedFilingCategoryIds.length > 0 && (
                                                <div className="col-span-2"><span className="text-gray-400">Document Models:</span> <span className="font-medium">{createForm.allowedFilingCategoryIds.length} selected</span></div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Access Control</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {[
                                                { label: 'ACL Sharing', v: createForm.aclSharingAllowed },
                                                { label: 'Allow Users', v: createForm.allowUsers },
                                                { label: 'Allow Groups', v: createForm.allowGroups },
                                                { label: 'Allow Roles', v: createForm.allowRoles },
                                                { label: 'Allow Org Units', v: createForm.allowOrgUnits },
                                                { label: 'ABAC Access', v: createForm.abacAccessEnabled },
                                                { label: 'Cross-WS ACL', v: createForm.crossWorkspaceAclAllowed },
                                                { label: 'Enforce Inheritance', v: createForm.inheritanceEnforced },
                                            ].map(item => (
                                                <div key={item.label} className="flex items-center gap-1.5 text-sm">
                                                    {item.v ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                                                    <span className="text-gray-600">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Justification — always visible in request mode, or switch to request */}
                                    {isRequestMode && (
                                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Send className="h-4 w-4 text-amber-600" />
                                                <h4 className="text-sm font-semibold text-amber-800">Request Justification</h4>
                                            </div>
                                            <p className="text-xs text-amber-700 mb-3">You don't have permission to create workspaces directly. Provide a justification for admin review.</p>
                                            <textarea
                                                value={createForm.justification}
                                                onChange={(e) => updateForm('justification', e.target.value)}
                                                placeholder="Explain why this workspace is needed, who will use it, and what documents it will contain..."
                                                rows={4}
                                                className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 resize-none"
                                            />
                                        </div>
                                    )}

                                    {createError && (
                                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />{createError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between px-8 py-4 border-t border-gray-100 bg-gray-50">
                            <Button variant="outline" onClick={() => { setShowCreateModal(false); setIsRequestMode(false); }} className="rounded-xl">Cancel</Button>
                            <div className="flex items-center gap-3">
                                {stepIndex > 0 && (
                                    <Button variant="outline" onClick={() => setCreateStep(steps[stepIndex - 1].key)} className="rounded-xl">Back</Button>
                                )}
                                {stepIndex < steps.length - 1 ? (
                                    <Button onClick={() => setCreateStep(steps[stepIndex + 1].key)}
                                        disabled={createStep === 'basics' && (!createForm.name || !createForm.code)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6">Next</Button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {!isRequestMode && (
                                            <Button variant="outline" onClick={() => setIsRequestMode(true)}
                                                className="rounded-xl text-amber-600 border-amber-200 hover:bg-amber-50">
                                                <Send className="h-4 w-4 mr-2" />Submit as Request
                                            </Button>
                                        )}
                                        <Button onClick={handleCreateWorkspace}
                                            disabled={isCreating || !createForm.name || !createForm.code || (isRequestMode && !createForm.justification.trim())}
                                            className={`rounded-xl px-8 ${isRequestMode
                                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'}`}>
                                            {isCreating ? (isRequestMode ? 'Submitting...' : 'Creating...') : (isRequestMode ? 'Submit Request' : 'Create Workspace')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
