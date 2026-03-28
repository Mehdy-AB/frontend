// app/workspaces/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Globe, Plus, Search, RefreshCw, Filter, Shield, Users,
    Globe2, X, Eye, Send, Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    workspaceService, WorkspaceDto, WorkspaceType, WorkspaceStatus,
    CreateWorkspaceRequest, WorkspaceRequestDto,
} from '@/api/services/workspaceService';
import { WorkspaceCard, PolicyEditor, SubmitRequestModal } from '@/components/workspace';
import { PolicyFormState, defaultPolicyForm } from '@/components/workspace/PolicyEditor';
import Pagination from '@/components/main/Pagination';
import UserAvatar from '@/components/main/UserAvatar';

type SortOption = 'name-asc' | 'name-desc' | 'createdAt-desc' | 'createdAt-asc' | 'updatedAt-desc';
type FilterType = 'all' | 'STANDARD' | 'SECURED';
type ViewMode = 'all' | 'my' | 'managed' | 'requests';
type CreateStep = 'basics' | 'security' | 'ingestion' | 'access' | 'review';

interface CreateFormState extends PolicyFormState {
    name: string;
    code: string;
    description: string;
    type: WorkspaceType;
}

const defaultForm: CreateFormState = {
    name: '', code: '', description: '', type: 'STANDARD',
    ...defaultPolicyForm,
};

export default function WorkspacesPage() {
    const router = useRouter();
    const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('name-asc');
    const [filterType, setFilterType] = useState<FilterType>('all');
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

    // Request modal
    const [showRequestModal, setShowRequestModal] = useState(false);

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
                    type: filterType !== 'all' ? filterType as WorkspaceType : undefined,
                });
            }
            setWorkspaces(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (error) {
            console.error('Failed to fetch workspaces:', error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, sortOption, filterType, viewMode, searchQuery]);

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

    useEffect(() => { setPage(0); }, [sortOption, filterType, viewMode, searchQuery]);

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
            const payload: CreateWorkspaceRequest = {
                name: createForm.name,
                code: createForm.code,
                description: createForm.description || undefined,
                type: createForm.type,
                // Policy fields
                downloadAllowed: createForm.downloadAllowed,
                printAllowed: createForm.printAllowed,
                exportAllowed: createForm.exportAllowed,
                externalSharingAllowed: createForm.externalSharingAllowed,
                externalLinkAllowed: createForm.externalLinkAllowed,
                watermarkRequired: createForm.watermarkRequired,
                viewAuditRequired: createForm.viewAuditRequired,
                breakGlassRequired: createForm.breakGlassRequired,
                maxFileSizeBytes: createForm.maxFileSizeMb ? parseInt(createForm.maxFileSizeMb) * 1048576 : undefined,
                virusScanRequired: createForm.virusScanRequired,
                ocrMode: createForm.ocrMode,
                archiveHandling: createForm.archiveHandling,
                crossWorkspaceAclAllowed: createForm.crossWorkspaceAclAllowed,
                directUserAclAllowed: createForm.directUserAclAllowed,
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
            setCreateError(error instanceof Error ? error.message : 'Failed to create workspace');
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
        setShowCreateModal(true);
    };

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
            {/* Header */}
            <div className="space-y-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-100">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                <Globe className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Workspaces</h1>
                                <p className="text-gray-500 text-sm font-medium">Governed content containers for your organization</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm min-w-[120px]">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                <span className="text-xl font-bold text-gray-900">{totalElements || 0}</span>
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
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || loading}
                            className="h-10 px-4 border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors rounded-xl">
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />Refresh
                        </Button>
                        <Button variant="outline" onClick={() => setShowRequestModal(true)}
                            className="h-10 px-4 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl">
                            <Send className="h-4 w-4 mr-2" />Request
                        </Button>
                        <Button onClick={openCreateModal}
                            className="h-10 px-6 bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl border-0">
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
                        </h2>
                        {loadingRequests ? (
                            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
                        ) : pendingRequests.length === 0 ? (
                            <Card><CardContent className="py-8 text-center text-gray-400 text-sm">No pending requests</CardContent></Card>
                        ) : (
                            <div className="space-y-3">
                                {pendingRequests.map(req => (
                                    <Card key={req.id} className="border border-amber-100 hover:shadow-md transition-all">
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    {/* Requester info */}
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
                            <Card><CardContent className="py-8 text-center text-gray-400 text-sm">No requests submitted yet</CardContent></Card>
                        ) : (
                            <div className="space-y-3">
                                {myRequests.map(req => (
                                    <Card key={req.id}>
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
                    {/* Search and Filter (non-requests view) */}
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
                                <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                                    <SelectTrigger className="w-[140px] h-9 border-0 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium focus:ring-0 transition-colors rounded-xl">
                                        <div className="flex items-center gap-2"><Filter className="h-3.5 w-3.5" /><SelectValue /></div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="STANDARD">Standard</SelectItem>
                                        <SelectItem value="SECURED">Secured</SelectItem>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <Card key={i} className="animate-pulse"><CardContent className="p-6">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-6"></div>
                                    <div className="flex gap-2 mb-4"><div className="h-6 w-20 bg-gray-100 rounded-full"></div><div className="h-6 w-16 bg-gray-100 rounded-full"></div></div>
                                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                                </CardContent></Card>
                            ))}
                        </div>
                    ) : workspaces.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-16">
                            <CardContent className="text-center">
                                <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Globe className="h-8 w-8 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No workspaces found</h3>
                                <p className="text-gray-500 mb-6 max-w-sm">
                                    {searchQuery ? `No workspaces match "${searchQuery}"` : 'Create your first workspace to start organizing governed content'}
                                </p>
                                <Button onClick={openCreateModal} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                                    <Plus className="h-4 w-4 mr-2" />Create Workspace
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {workspaces.map(ws => <WorkspaceCard key={ws.id} workspace={ws} />)}
                        </div>
                    )}

                    <Pagination totalPages={totalPages} currentPage={page} totalElements={totalElements} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
                </>
            )}

            {/* ========== CREATE WORKSPACE MODAL ========== */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                    <Plus className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Create New Workspace</h2>
                                    <p className="text-sm text-gray-500">Configure all settings for the new governed container</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
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
                                <div className="max-w-2xl">
                                    <PolicyEditor value={createForm} onChange={updateForm} section="security" isSecured={createForm.type === 'SECURED'} />
                                </div>
                            )}

                            {/* STEP 3: Ingestion */}
                            {createStep === 'ingestion' && (
                                <div className="max-w-2xl">
                                    <PolicyEditor value={createForm} onChange={updateForm} section="ingestion" />
                                </div>
                            )}

                            {/* STEP 4: Access */}
                            {createStep === 'access' && (
                                <div className="max-w-2xl">
                                    <PolicyEditor value={createForm} onChange={updateForm} section="access" isSecured={createForm.type === 'SECURED'} />
                                </div>
                            )}

                            {/* STEP 5: Review */}
                            {createStep === 'review' && (
                                <div className="space-y-6 max-w-2xl">
                                    <div className="mb-4">
                                        <h3 className="text-base font-semibold text-gray-900">Review Configuration</h3>
                                        <p className="text-sm text-gray-500">Verify all settings before creating the workspace</p>
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
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Security & Distribution</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {[
                                                { label: 'Download', v: createForm.downloadAllowed }, { label: 'Print', v: createForm.printAllowed },
                                                { label: 'Export', v: createForm.exportAllowed }, { label: 'Ext. Sharing', v: createForm.externalSharingAllowed },
                                                { label: 'Ext. Links', v: createForm.externalLinkAllowed }, { label: 'Watermark', v: createForm.watermarkRequired },
                                                { label: 'View Audit', v: createForm.viewAuditRequired }, { label: 'Break Glass', v: createForm.breakGlassRequired },
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
                                            <div><span className="text-gray-400">Versioning:</span> <span className="font-medium">{createForm.versioningRequired ? 'Required' : 'Optional'}</span></div>
                                            {createForm.classificationDefault && <div><span className="text-gray-400">Classification:</span> <span className="font-medium">{createForm.classificationDefault}</span></div>}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Access Control</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { label: 'Cross-Workspace ACL', v: createForm.crossWorkspaceAclAllowed },
                                                { label: 'Direct User ACL', v: createForm.directUserAclAllowed },
                                                { label: 'Enforce Inheritance', v: createForm.inheritanceEnforced },
                                            ].map(item => (
                                                <div key={item.label} className="flex items-center gap-1.5 text-sm">
                                                    {item.v ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                                                    <span className="text-gray-600">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {createError && (
                                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />{createError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between px-8 py-4 border-t border-gray-100 bg-gray-50">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="rounded-xl">Cancel</Button>
                            <div className="flex items-center gap-3">
                                {stepIndex > 0 && (
                                    <Button variant="outline" onClick={() => setCreateStep(steps[stepIndex - 1].key)} className="rounded-xl">Back</Button>
                                )}
                                {stepIndex < steps.length - 1 ? (
                                    <Button onClick={() => setCreateStep(steps[stepIndex + 1].key)}
                                        disabled={createStep === 'basics' && (!createForm.name || !createForm.code)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6">Next</Button>
                                ) : (
                                    <Button onClick={handleCreateWorkspace}
                                        disabled={isCreating || !createForm.name || !createForm.code}
                                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-8">
                                        {isCreating ? 'Creating...' : 'Create Workspace'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Request Modal */}
            <SubmitRequestModal
                open={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                onSubmitted={() => { setViewMode('requests'); fetchRequests(); }}
            />
        </div>
    );
}
