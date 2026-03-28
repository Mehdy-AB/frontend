// app/workspaces/[workspaceId]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Globe, ArrowLeft, Shield, Users, FolderOpen, FileText,
    Settings, Calendar, ChevronRight, Plus, Search, RefreshCw,
    Crown, UserCog, Pencil, Eye, ClipboardList, Trash2,
    X, AlertTriangle, Archive, Pause, Play, Edit3,
    Upload, Folder, File, Lock, Globe as GlobeIcon,
    ChevronDown, Home, BarChart3, Activity, HardDrive,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    workspaceService, WorkspaceDto, WorkspaceMemberDto, WorkspacePolicyDto,
    WorkspaceRole, PrincipalType, WorkspaceStatsDto, UpdatePolicyRequest,
} from '@/api/services/workspaceService';
import { folderService } from '@/api/services/folderService';
import { fileTypeService } from '@/api/services/fileTypeService';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { FolderResDto, FolderRepoResDto, DocumentResponseDto } from '@/types/api';
import { WorkspaceStatsBanner, WorkspacePolicyBadges, AddMemberModal } from '@/components/workspace';
import PolicyEditor, { PolicyFormState, defaultPolicyForm, AvailableModel } from '@/components/workspace/PolicyEditor';
import UserAvatar from '@/components/main/UserAvatar';
import FileUploadModal from '@/components/modals/FileUploadModal';

type TabView = 'content' | 'overview' | 'members' | 'policy' | 'analytics';

const roleColors: Record<WorkspaceRole, string> = {
    OWNER: 'bg-amber-100 text-amber-700 border-amber-200',
    MANAGER: 'bg-blue-100 text-blue-700 border-blue-200',
    CONTRIBUTOR: 'bg-sky-100 text-sky-700 border-sky-200',
    READER: 'bg-gray-100 text-gray-600 border-gray-200',
    AUDITOR: 'bg-purple-100 text-purple-700 border-purple-200',
};

const roleIcons: Record<WorkspaceRole, React.ReactNode> = {
    OWNER: <Crown className="h-3.5 w-3.5" />,
    MANAGER: <UserCog className="h-3.5 w-3.5" />,
    CONTRIBUTOR: <Pencil className="h-3.5 w-3.5" />,
    READER: <Eye className="h-3.5 w-3.5" />,
    AUDITOR: <ClipboardList className="h-3.5 w-3.5" />,
};

interface BreadcrumbItem { id: number; name: string; }

export default function WorkspaceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const workspaceId = params.workspaceId as string;

    const [workspace, setWorkspace] = useState<WorkspaceDto | null>(null);
    const [members, setMembers] = useState<WorkspaceMemberDto[]>([]);
    const [policy, setPolicy] = useState<WorkspacePolicyDto | null>(null);
    const [stats, setStats] = useState<WorkspaceStatsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabView>('content');

    // Members
    const [showAddMember, setShowAddMember] = useState(false);

    // Policy edit
    const [editingPolicy, setEditingPolicy] = useState(false);
    const [policyForm, setPolicyForm] = useState<PolicyFormState>({ ...defaultPolicyForm });
    const [savingPolicy, setSavingPolicy] = useState(false);

    // Available models for policy editor
    const [availableFileTypes, setAvailableFileTypes] = useState<AvailableModel[]>([]);
    const [availableFilingCategories, setAvailableFilingCategories] = useState<AvailableModel[]>([]);
    const [availableWorkflows, setAvailableWorkflows] = useState<AvailableModel[]>([]);

    // Content browsing (real folder navigation)
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [folderData, setFolderData] = useState<FolderRepoResDto | null>(null);
    const [contentSearch, setContentSearch] = useState('');
    const [contentLoading, setContentLoading] = useState(false);
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Edit workspace info
    const [editingInfo, setEditingInfo] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [ws, mbrs, pol, st] = await Promise.all([
                workspaceService.getWorkspace(workspaceId),
                workspaceService.listMembers(workspaceId).catch(() => []),
                workspaceService.getPolicy(workspaceId).catch(() => null),
                workspaceService.getStats(workspaceId).catch(() => null),
            ]);
            setWorkspace(ws);
            setMembers(mbrs);
            setPolicy(pol);
            setStats(st);
            setEditName(ws.name);
            setEditDesc(ws.description || '');
            // Set the root folder for content browsing
            if (ws.rootFolderId) {
                setCurrentFolderId(ws.rootFolderId);
            }
            // Load available models for policy editor
            try {
                const [ftRes, fcRes, wfRes] = await Promise.all([
                    fileTypeService.getAllowedFileTypes().catch(() => []),
                    filingCategoryService.getAllFilingCategories({ size: 200 }).catch(() => ({ content: [] })),
                    workflowAdminService.getAllWorkflows(0, 200).catch(() => ({ content: [] })),
                ]);
                setAvailableFileTypes(ftRes.map(ft => ({ id: ft.id, label: ft.label || ft.mimeType })));
                setAvailableFilingCategories((fcRes.content || []).map((c: any) => ({ id: c.id, label: c.name })));
                setAvailableWorkflows((wfRes.content || []).map((w: any) => ({ id: w.id, label: w.name })));
            } catch (_) { /* non-critical */ }
        } catch (err) {
            console.error('Failed to load workspace:', err);
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Fetch folder content when folder changes
    const fetchContent = useCallback(async () => {
        if (!currentFolderId) return;
        setContentLoading(true);
        try {
            const data = await folderService.getFolderContents(
                currentFolderId, 0, 50, contentSearch || undefined, true
            );
            setFolderData(data);
        } catch (err) {
            console.error('Failed to load content:', err);
        } finally {
            setContentLoading(false);
        }
    }, [currentFolderId, contentSearch]);

    useEffect(() => {
        if (activeTab === 'content' && currentFolderId) fetchContent();
    }, [activeTab, currentFolderId, fetchContent]);

    // Navigate into subfolder
    const navigateToFolder = (folderId: number, folderName: string) => {
        setBreadcrumbs(prev => [...prev, { id: currentFolderId!, name: folderData?.folder?.name || 'Root' }]);
        setCurrentFolderId(folderId);
        setContentSearch('');
    };

    // Navigate back via breadcrumb
    const navigateToBreadcrumb = (index: number) => {
        if (index === -1 && workspace?.rootFolderId) {
            // Home
            setCurrentFolderId(workspace.rootFolderId);
            setBreadcrumbs([]);
        } else {
            const item = breadcrumbs[index];
            setCurrentFolderId(item.id);
            setBreadcrumbs(prev => prev.slice(0, index));
        }
        setContentSearch('');
    };

    // Create folder inside workspace
    const handleCreateFolder = async () => {
        if (!newFolderName.trim() || !currentFolderId) return;
        try {
            await folderService.createFolder({ name: newFolderName.trim(), parentId: currentFolderId });
            setNewFolderName('');
            setShowCreateFolder(false);
            fetchContent();
        } catch (err) {
            console.error('Failed to create folder:', err);
        }
    };

    // Format helpers
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const formatFileSize = (bytes: number) => {
        if (!bytes) return '—';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    // Handlers
    const handleAddMember = async (member: WorkspaceMemberDto) => { setMembers(prev => [...prev, member]); };
    const handleRemoveMember = async (memberId: number) => { try { await workspaceService.removeMember(workspaceId, memberId); setMembers(prev => prev.filter(m => m.id !== memberId)); } catch (err) { console.error(err); } };
    const handleChangeRole = async (memberId: number, newRole: WorkspaceRole) => { try { const updated = await workspaceService.changeMemberRole(workspaceId, memberId, newRole); setMembers(prev => prev.map(m => m.id === memberId ? updated : m)); } catch (err) { console.error(err); } };
    const handleArchive = async () => { await workspaceService.archiveWorkspace(workspaceId); fetchAll(); };
    const handleSuspend = async () => { await workspaceService.suspendWorkspace(workspaceId); fetchAll(); };
    const handleReactivate = async () => { await workspaceService.reactivateWorkspace(workspaceId); fetchAll(); };
    const handleSaveInfo = async () => { try { const updated = await workspaceService.updateWorkspace(workspaceId, { name: editName, description: editDesc || undefined }); setWorkspace(updated); setEditingInfo(false); } catch (err) { console.error(err); } };

    const startEditPolicy = () => {
        if (!policy) return;
        setPolicyForm({
            downloadAllowed: policy.downloadAllowed, printAllowed: policy.printAllowed, exportAllowed: policy.exportAllowed,
            externalSharingAllowed: policy.externalSharingAllowed, externalLinkAllowed: policy.externalLinkAllowed,
            watermarkRequired: policy.watermarkRequired, viewAuditRequired: policy.viewAuditRequired, breakGlassRequired: policy.breakGlassRequired,
            maxFileSizeMb: policy.maxFileSizeBytes ? String(Math.round(policy.maxFileSizeBytes / 1048576)) : '',
            virusScanRequired: policy.virusScanRequired, ocrMode: policy.ocrMode, archiveHandling: policy.archiveHandling,
            crossWorkspaceAclAllowed: policy.crossWorkspaceAclAllowed, directUserAclAllowed: policy.directUserAclAllowed,
            inheritanceEnforced: policy.inheritanceEnforced, classificationDefault: policy.classificationDefault || '',
            versioningRequired: policy.versioningRequired,
            // Model selections
            allowedFileTypeIds: (policy.allowedFileTypes || []).map(ft => ft.id),
            allowedFilingCategoryIds: (policy.allowedFilingCategories || []).map(c => c.id),
            defaultFilingCategoryId: policy.defaultFilingCategory?.id ?? null,
            allowedWorkflowIds: (policy.allowedWorkflows || []).map(w => w.id),
        });
        setEditingPolicy(true);
    };

    const handleSavePolicy = async () => {
        setSavingPolicy(true);
        try {
            const payload: UpdatePolicyRequest = {
                ...policyForm,
                maxFileSizeBytes: policyForm.maxFileSizeMb ? parseInt(policyForm.maxFileSizeMb) * 1048576 : undefined,
                allowedFileTypeIds: policyForm.allowedFileTypeIds.length > 0 ? policyForm.allowedFileTypeIds : undefined,
                allowedFilingCategoryIds: policyForm.allowedFilingCategoryIds.length > 0 ? policyForm.allowedFilingCategoryIds : undefined,
                defaultFilingCategoryId: policyForm.defaultFilingCategoryId ?? undefined,
                allowedWorkflowIds: policyForm.allowedWorkflowIds.length > 0 ? policyForm.allowedWorkflowIds : undefined,
            };
            // Remove internal-only form field
            delete (payload as any).maxFileSizeMb;
            const updated = await workspaceService.updatePolicy(workspaceId, payload);
            setPolicy(updated); setEditingPolicy(false);
        } catch (err) { console.error(err); }
        finally { setSavingPolicy(false); }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-12 bg-gray-100 rounded-xl animate-pulse w-1/3" />
                <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Workspace not found</h2>
                <Button variant="outline" onClick={() => router.push('/workspaces')} className="rounded-xl mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />Back to Workspaces
                </Button>
            </div>
        );
    }

    const tabs: { key: TabView; label: string; icon: React.ElementType }[] = [
        { key: 'content', label: 'Content', icon: FolderOpen },
        { key: 'overview', label: 'Overview', icon: Globe },
        { key: 'members', label: `Members (${members.length})`, icon: Users },
        { key: 'policy', label: 'Policy', icon: Shield },
        { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    ];

    // Extract folders and documents from folderData
    const subFolders: FolderResDto[] = folderData?.folders || [];
    const documents: DocumentResponseDto[] = folderData?.documents || [];

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/workspaces')}
                        className="h-10 w-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        {workspace.type === 'SECURED' ? <Shield className="h-6 w-6 text-white" /> : <Globe className="h-6 w-6 text-white" />}
                    </div>
                    <div>
                        {editingInfo ? (
                            <div className="flex items-center gap-2">
                                <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl h-9 w-64" />
                                <Button size="sm" onClick={handleSaveInfo} className="bg-blue-500 text-white rounded-xl text-xs">Save</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingInfo(false)} className="rounded-xl text-xs">Cancel</Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
                                <button onClick={() => setEditingInfo(true)} className="text-gray-400 hover:text-blue-500 transition-colors">
                                    <Edit3 className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-gray-400 font-mono">{workspace.code}</span>
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">{workspace.type}</Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {workspace.status === 'ACTIVE' && (
                        <>
                            <Button size="sm" variant="outline" onClick={handleSuspend}
                                className="rounded-xl text-xs border-amber-200 text-amber-600 hover:bg-amber-50">
                                <Pause className="h-3.5 w-3.5 mr-1" />Suspend
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleArchive}
                                className="rounded-xl text-xs border-gray-200 text-gray-500 hover:bg-gray-50">
                                <Archive className="h-3.5 w-3.5 mr-1" />Archive
                            </Button>
                        </>
                    )}
                    {(workspace.status === 'SUSPENDED' || workspace.status === 'ARCHIVED') && (
                        <Button size="sm" onClick={handleReactivate}
                            className="rounded-xl text-xs bg-emerald-500 hover:bg-emerald-600 text-white">
                            <Play className="h-3.5 w-3.5 mr-1" />Reactivate
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Stats Banner ── */}
            {stats && <WorkspaceStatsBanner stats={stats} />}

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <tab.icon className="h-4 w-4" />{tab.label}
                    </button>
                ))}
            </div>

            {/* ════════════ CONTENT TAB (Full Repo) ════════════ */}
            {activeTab === 'content' && (
                <div className="space-y-4">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1 text-sm">
                        <button onClick={() => navigateToBreadcrumb(-1)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                            <Home className="h-3.5 w-3.5" /><span className="font-medium">{workspace.name}</span>
                        </button>
                        {breadcrumbs.map((bc, i) => (
                            <div key={bc.id} className="flex items-center gap-1">
                                <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                                <button onClick={() => navigateToBreadcrumb(i)}
                                    className="px-2 py-1 rounded-lg hover:bg-blue-50 text-blue-600 font-medium transition-colors">
                                    {bc.name}
                                </button>
                            </div>
                        ))}
                        {breadcrumbs.length > 0 && folderData?.folder && (
                            <div className="flex items-center gap-1">
                                <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                                <span className="px-2 py-1 font-medium text-gray-900">{folderData.folder.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Content Toolbar */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input value={contentSearch} onChange={e => setContentSearch(e.target.value)}
                                placeholder="Search files and folders..."
                                className="pl-10 h-10 rounded-xl border-gray-200" />
                        </div>
                        <Button size="sm" variant="outline" onClick={fetchContent}
                            className="rounded-xl h-10 px-4 border-blue-200 text-blue-600">
                            <RefreshCw className="h-4 w-4 mr-1" />Refresh
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowCreateFolder(true)}
                            className="rounded-xl h-10 px-4 border-blue-200 text-blue-600">
                            <Plus className="h-4 w-4 mr-1" />New Folder
                        </Button>
                        <Button size="sm" onClick={() => setShowUploadModal(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-10 px-4">
                            <Upload className="h-4 w-4 mr-1" />Upload
                        </Button>
                    </div>

                    {/* Create Folder Inline */}
                    {showCreateFolder && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <Folder className="h-5 w-5 text-blue-500" />
                            <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                                placeholder="Folder name..."
                                className="flex-1 h-9 rounded-lg border-blue-200"
                                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} />
                            <Button size="sm" onClick={handleCreateFolder}
                                className="bg-blue-500 text-white rounded-lg text-xs h-9">Create</Button>
                            <Button size="sm" variant="outline" onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }}
                                className="rounded-lg text-xs h-9">Cancel</Button>
                        </div>
                    )}

                    {/* Folder + Document Table */}
                    {contentLoading ? (
                        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Name</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Owner</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Size</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Modified</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subFolders.map((f) => (
                                            <tr key={`f-${f.id}`} className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                                                onClick={() => navigateToFolder(f.id, f.name)}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                                            <Folder className="h-5 w-5 text-blue-500" />
                                                            <div className="absolute -bottom-0.5 -right-0.5 rounded-full p-0.5">
                                                                {f.public ? <GlobeIcon className="h-2.5 w-2.5 text-emerald-500" /> : <Lock className="h-2.5 w-2.5 text-gray-400" />}
                                                            </div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-medium text-gray-900 truncate block">{f.name}</span>
                                                            {f.description && <span className="text-xs text-gray-400 truncate block">{f.description}</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {f.ownedBy && (
                                                        <div className="flex items-center gap-2">
                                                            <UserAvatar user={f.ownedBy} size="sm" />
                                                            <span className="text-sm text-gray-500">{f.ownedBy.firstName}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3"><span className="text-sm text-gray-500">{formatFileSize(f.size || 0)}</span></td>
                                                <td className="px-4 py-3"><span className="text-sm text-gray-400">{formatDate(f.updatedAt)}</span></td>
                                                <td className="px-4 py-3 text-right"><ChevronRight className="h-4 w-4 text-gray-300 inline" /></td>
                                            </tr>
                                        ))}
                                        {documents.map((d) => (
                                            <tr key={`d-${d.documentId}`} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                                                onClick={() => router.push(`/documents/${d.documentId}`)}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center">
                                                            <File className="h-5 w-5 text-gray-400" />
                                                            <div className="absolute -bottom-0.5 -right-0.5 rounded-full p-0.5">
                                                                {d.isPublic ? <GlobeIcon className="h-2.5 w-2.5 text-emerald-500" /> : <Lock className="h-2.5 w-2.5 text-gray-400" />}
                                                            </div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-medium text-gray-900 truncate block">{d.name}</span>
                                                            <span className="text-xs text-gray-400">{d.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'} &bull; v{d.versionNumber}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {d.ownedBy && (
                                                        <div className="flex items-center gap-2">
                                                            <UserAvatar user={d.ownedBy} size="sm" />
                                                            <span className="text-sm text-gray-500">{d.ownedBy.firstName}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3"><span className="text-sm text-gray-500">{formatFileSize(d.sizeBytes || 0)}</span></td>
                                                <td className="px-4 py-3"><span className="text-sm text-gray-400">{formatDate(d.updatedAt)}</span></td>
                                                <td className="px-4 py-3 text-right"><ChevronRight className="h-4 w-4 text-gray-300 inline" /></td>
                                            </tr>
                                        ))}
                                        {subFolders.length === 0 && documents.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-16 text-center">
                                                    <FolderOpen className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">No content yet</h3>
                                                    <p className="text-sm text-gray-400 mb-4">Upload documents or create folders to get started</p>
                                                    <div className="flex items-center justify-center gap-3">
                                                        <Button size="sm" variant="outline" onClick={() => setShowCreateFolder(true)}
                                                            className="rounded-xl text-xs">
                                                            <Plus className="h-3.5 w-3.5 mr-1" />New Folder
                                                        </Button>
                                                        <Button size="sm" onClick={() => setShowUploadModal(true)}
                                                            className="bg-blue-500 text-white rounded-xl text-xs">
                                                            <Upload className="h-3.5 w-3.5 mr-1" />Upload
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Upload Modal */}
                    {showUploadModal && currentFolderId && (
                        <FileUploadModal
                            isOpen={showUploadModal}
                            onClose={() => setShowUploadModal(false)}
                            folderId={currentFolderId}
                            onSuccess={() => { setShowUploadModal(false); fetchContent(); }}
                        />
                    )}
                </div>
            )}

            {/* ════════════ OVERVIEW TAB ════════════ */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Information</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="font-medium text-gray-900">{workspace.name}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Code</span><span className="font-mono text-gray-900">{workspace.code}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Type</span><Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">{workspace.type}</Badge></div>
                                <div className="flex justify-between"><span className="text-gray-400">Status</span><Badge variant="secondary" className="text-xs">{workspace.status}</Badge></div>
                                <div className="flex justify-between"><span className="text-gray-400">Created</span><span className="text-gray-700">{formatDate(workspace.createdAt)}</span></div>
                                {workspace.description && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <span className="text-gray-400 block mb-1">Description</span>
                                        <p className="text-gray-700">{workspace.description}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Policy Summary</h3>
                                <Button size="sm" variant="outline" onClick={() => setActiveTab('policy')} className="rounded-xl text-xs">
                                    <Settings className="h-3.5 w-3.5 mr-1" />Edit
                                </Button>
                            </div>
                            {policy ? <WorkspacePolicyBadges policy={policy} /> : <p className="text-sm text-gray-400">No policy configured</p>}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ════════════ MEMBERS TAB ════════════ */}
            {activeTab === 'members' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Workspace Members</h3>
                        <Button size="sm" onClick={() => setShowAddMember(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                            <Plus className="h-4 w-4 mr-1" />Add Member
                        </Button>
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Principal</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Type</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Role</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Added</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map(member => (
                                        <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900 font-mono">{member.principalId}</span></td>
                                            <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{member.principalType}</Badge></td>
                                            <td className="px-4 py-3">
                                                <Select value={member.workspaceRole} onValueChange={(v) => handleChangeRole(member.id, v as WorkspaceRole)}>
                                                    <SelectTrigger className="w-36 h-8 rounded-lg border-0 bg-transparent hover:bg-gray-100 text-sm">
                                                        <div className="flex items-center gap-1.5">
                                                            {roleIcons[member.workspaceRole]}
                                                            <Badge variant="outline" className={`text-xs ${roleColors[member.workspaceRole]}`}>{member.workspaceRole}</Badge>
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(['OWNER', 'MANAGER', 'CONTRIBUTOR', 'READER', 'AUDITOR'] as WorkspaceRole[]).map(r => (
                                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-400">{formatDate(member.createdAt)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button size="sm" variant="ghost" onClick={() => handleRemoveMember(member.id)}
                                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {members.length === 0 && (
                                        <tr><td colSpan={5} className="px-4 py-12 text-center"><Users className="h-10 w-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-400">No members yet</p></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                    <AddMemberModal workspaceId={workspaceId} open={showAddMember} onClose={() => setShowAddMember(false)} onAdded={handleAddMember} />
                </div>
            )}

            {/* ════════════ POLICY TAB ════════════ */}
            {activeTab === 'policy' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Workspace Policy</h3>
                        <div className="flex gap-2">
                            {editingPolicy ? (
                                <>
                                    <Button size="sm" variant="outline" onClick={() => setEditingPolicy(false)} className="rounded-xl">Cancel</Button>
                                    <Button size="sm" onClick={handleSavePolicy} disabled={savingPolicy}
                                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                                        {savingPolicy ? 'Saving...' : 'Save Policy'}
                                    </Button>
                                </>
                            ) : (
                                <Button size="sm" onClick={startEditPolicy}
                                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                                    <Edit3 className="h-4 w-4 mr-1" />Edit Policy
                                </Button>
                            )}
                        </div>
                    </div>
                    <Card>
                        <CardContent className="p-6">
                            {editingPolicy ? (
                                <PolicyEditor value={policyForm}
                                    onChange={(key, val) => setPolicyForm(prev => ({ ...prev, [key]: val }))}
                                    section="all" isSecured={workspace.type === 'SECURED'}
                                    availableFileTypes={availableFileTypes}
                                    availableFilingCategories={availableFilingCategories}
                                    availableWorkflows={availableWorkflows} />
                            ) : policy ? (
                                <WorkspacePolicyBadges policy={policy} />
                            ) : (
                                <p className="text-sm text-gray-400">No policy configured for this workspace</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ════════════ ANALYTICS TAB ════════════ */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Workspace Analytics</h3>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{stats?.documentCount ?? 0}</p>
                                        <p className="text-xs text-gray-500">Documents</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                        <FolderOpen className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{stats?.folderCount ?? 0}</p>
                                        <p className="text-xs text-gray-500">Folders</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                                        <p className="text-xs text-gray-500">Members</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                        <HardDrive className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats?.documentCount ?? 0}
                                        </p>
                                        <p className="text-xs text-gray-500">Total Items</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Policy Summary */}
                    {policy && (
                        <Card>
                            <CardContent className="p-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />Active Policy Rules
                                </h4>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {policy.maxFileSizeBytes && (
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-400">Max File Size</p>
                                            <p className="text-sm font-medium text-gray-700">
                                                {(policy.maxFileSizeBytes / 1048576).toFixed(0)} MB
                                            </p>
                                        </div>
                                    )}
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-400">Virus Scan</p>
                                        <p className="text-sm font-medium text-gray-700">{policy.virusScanRequired ? 'Required' : 'Optional'}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-400">Downloads</p>
                                        <p className="text-sm font-medium text-gray-700">{policy.downloadAllowed ? 'Allowed' : 'Restricted'}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-400">External Sharing</p>
                                        <p className="text-sm font-medium text-gray-700">{policy.externalSharingAllowed ? 'Allowed' : 'Restricted'}</p>
                                    </div>
                                    {policy.allowedFileTypes && policy.allowedFileTypes.length > 0 && (
                                        <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                                            <p className="text-xs text-gray-400">Allowed File Types</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {policy.allowedFileTypes.map((t) => (
                                                    <span key={t.id} className="px-2 py-0.5 bg-white border rounded text-xs">{t.label}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Activity Timeline */}
                    <Card>
                        <CardContent className="p-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <Activity className="h-4 w-4" />Recent Activity
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-700">Workspace created</p>
                                        <p className="text-xs text-gray-400">{workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-700">{members.length} member(s) assigned</p>
                                        <p className="text-xs text-gray-400">Across {Object.keys(members.reduce((acc, m) => { acc[m.workspaceRole] = true; return acc; }, {} as Record<string, boolean>)).length} role(s)</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-700">{stats?.documentCount ?? 0} documents uploaded</p>
                                        <p className="text-xs text-gray-400">Total workspace content</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
