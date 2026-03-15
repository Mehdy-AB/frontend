'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Building2,
    Network,
    Crown,
    Users as UsersIcon,
    Briefcase,
    UsersRound,
    Activity,
    Edit,
    Trash2,
    Plus,
    ChevronRight,
    ChevronDown,
    Search,
    X,
    Check,
    AlertCircle,
    ExternalLink,
    Move,
    RefreshCw,
    Calendar,
    Hash,
    Layers,
    Shield,
    UserPlus,
    UserMinus,
    AlertTriangle,
    Settings,
    Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import UserAvatar from '@/components/main/UserAvatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { useNotification } from '@/contexts/NotificationContext';
import {
    orgUnitService,
    OrgUnitResponse,
    OrgUnitMemberResponse,
    OrgUnitTreeResponse,
    UpdateOrgUnitRequest,
    OrgPositionResponse,
    CreateOrgPositionRequest,
    UpdateOrgPositionRequest,
    PositionAssignmentResponse,
} from '@/api/services/orgUnitService';
import { apiClient } from '@/api/client';
import { Permissions } from '@/constants/permissions';
import Pagination from '@/components/main/Pagination';
import GroupsTab from './GroupsTab';
import AuditTab from './AuditTab';

// ==================== Types ====================

interface SimpleUser {
    id: string;
    username: string;
    displayName: string;
    email: string;
    imageUrl?: string;
    imgUrl?: string;
}

// ==================== Main Page ====================

export default function OrgUnitDetailPage() {
    const router = useRouter();
    const params = useParams();
    const ouId = params.ouId as string;
    const { hasPermission } = usePermissions();
    const { addNotification } = useNotification();

    // Permissions
    const canView = hasPermission(Permissions.ORG_READ);
    const canUpdate = hasPermission(Permissions.ORG_UPDATE);
    const canDelete = hasPermission(Permissions.ORG_DELETE);
    const canCreate = hasPermission(Permissions.ORG_CREATE);
    const canAssignUser = hasPermission(Permissions.ORG_ASSIGN_USER);
    const canAssignHead = hasPermission(Permissions.ORG_ASSIGN_HEAD);
    const canViewMembers = hasPermission(Permissions.ORG_VIEW_MEMBERS);
    const canManageGroups = hasPermission(Permissions.ORG_MANAGE_GROUPS);
    const canReadPositions = hasPermission(Permissions.POSITION_READ);
    const canCreatePositions = hasPermission(Permissions.POSITION_CREATE);
    const canDeletePositions = hasPermission(Permissions.POSITION_DELETE);
    const canReadAudit = hasPermission(Permissions.AUDIT_READ);

    // Data state
    const [detail, setDetail] = useState<OrgUnitResponse | null>(null);
    const [ancestors, setAncestors] = useState<OrgUnitResponse[]>([]);
    const [children, setChildren] = useState<OrgUnitResponse[]>([]);
    const [members, setMembers] = useState<OrgUnitMemberResponse[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<UpdateOrgUnitRequest>({});
    const [actionLoading, setActionLoading] = useState(false);

    // Delete confirm
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Head assignment
    const [isSetHeadOpen, setIsSetHeadOpen] = useState(false);
    const [headSearchQuery, setHeadSearchQuery] = useState('');
    const [headSearchResults, setHeadSearchResults] = useState<SimpleUser[]>([]);

    // Move modal
    const [isMoveOpen, setIsMoveOpen] = useState(false);
    const [moveTree, setMoveTree] = useState<OrgUnitTreeResponse[]>([]);
    const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
    const [moveSearchQuery, setMoveSearchQuery] = useState('');

    // Member add dialog
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [memberSearchResults, setMemberSearchResults] = useState<SimpleUser[]>([]);
    const [memberFilter, setMemberFilter] = useState('');
    const [memberFilterDebounced, setMemberFilterDebounced] = useState('');
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
    const [selectedMemberAddIds, setSelectedMemberAddIds] = useState<string[]>([]);

    // Member pagination
    const [memberPage, setMemberPage] = useState(0);
    const [memberPageSize, setMemberPageSize] = useState(10);
    const [memberTotalPages, setMemberTotalPages] = useState(0);
    const [memberTotalElements, setMemberTotalElements] = useState(0);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

    // Seat checkbox selection (bulk delete)
    const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

    // Assign-to-seat dialog
    const [assignToSeatId, setAssignToSeatId] = useState<string | null>(null);
    const [assignSeatSearch, setAssignSeatSearch] = useState('');
    const [assignSeatSearchResults, setAssignSeatSearchResults] = useState<OrgUnitMemberResponse[]>([]);
    const [assignSeatSelectedIds, setAssignSeatSelectedIds] = useState<string[]>([]);
    const [assignSeatPage, setAssignSeatPage] = useState(0);

    // Assignment pagination per position
    const [assignmentPage, setAssignmentPage] = useState(0);
    const [assignmentPageSize, setAssignmentPageSize] = useState(5);
    const [assignmentTotalPages, setAssignmentTotalPages] = useState(0);
    const [assignmentTotalElements, setAssignmentTotalElements] = useState(0);
    const [assignmentSearch, setAssignmentSearch] = useState('');
    const [assignmentSearchDebounced, setAssignmentSearchDebounced] = useState('');
    const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
    const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<string>('');
    const [isPrimaryFilter, setIsPrimaryFilter] = useState<string>('');

    // Edit assignment dialog state
    const [editingAssignment, setEditingAssignment] = useState<PositionAssignmentResponse | null>(null);
    const [editAssignmentForm, setEditAssignmentForm] = useState<{
        isPrimary: boolean;
        effectiveFrom: string;
        effectiveTo: string;
        assignmentType: string;
        ftePercentage: number;
    }>({ isPrimary: false, effectiveFrom: '', effectiveTo: '', assignmentType: 'PERMANENT', ftePercentage: 100 });

    // Assign config form (used in assign-to-seat dialog for all assigns)
    const [assignConfigForm, setAssignConfigForm] = useState<{
        isPrimary: boolean;
        effectiveFrom: string;
        effectiveTo: string;
        assignmentType: string;
        ftePercentage: number;
    }>({ isPrimary: false, effectiveFrom: new Date().toISOString().split('T')[0], effectiveTo: '', assignmentType: 'PERMANENT', ftePercentage: 100 });

    // Position state
    const [positions, setPositions] = useState<OrgPositionResponse[]>([]);
    const [positionsLoading, setPositionsLoading] = useState(false);
    const [isCreatePositionOpen, setIsCreatePositionOpen] = useState(false);
    const [positionForm, setPositionForm] = useState<CreateOrgPositionRequest>({ positionDefinitionId: '', seatCode: '' });

    // Duplicate seat confirmation state
    const [duplicateInfo, setDuplicateInfo] = useState<any>(null);

    // Seat filter + pagination state
    const [seatSearch, setSeatSearch] = useState('');
    const [seatSearchDebounced, setSeatSearchDebounced] = useState('');
    const [seatIsActive, setSeatIsActive] = useState<boolean | null>(null);
    const [seatBudget, setSeatBudget] = useState<boolean | null>(null);
    const [seatPage, setSeatPage] = useState(0);
    const [seatPageSize, setSeatPageSize] = useState(10);
    const [seatTotalPages, setSeatTotalPages] = useState(0);
    const [seatTotalElements, setSeatTotalElements] = useState(0);

    // Position Definition searchable picker state
    const [posDefSearch, setPosDefSearch] = useState('');
    const [posDefSearchDebounced, setPosDefSearchDebounced] = useState('');
    const [posDefResults, setPosDefResults] = useState<any[]>([]);
    const [posDefSelectedName, setPosDefSelectedName] = useState('');
    const [posDefDropdownOpen, setPosDefDropdownOpen] = useState(false);
    const posDefDropdownRef = useRef<HTMLDivElement>(null);
    // For edit form
    const [posDefEditSearch, setPosDefEditSearch] = useState('');
    const [posDefEditSearchDebounced, setPosDefEditSearchDebounced] = useState('');
    const [posDefEditResults, setPosDefEditResults] = useState<any[]>([]);
    const [posDefEditSelectedName, setPosDefEditSelectedName] = useState('');
    const [posDefEditDropdownOpen, setPosDefEditDropdownOpen] = useState(false);
    const posDefEditDropdownRef = useRef<HTMLDivElement>(null);

    // Position edit state
    const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
    const [editPositionForm, setEditPositionForm] = useState<UpdateOrgPositionRequest>({});
    const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);
    const [positionAssignments, setPositionAssignments] = useState<Record<string, PositionAssignmentResponse[]>>({});

    // ReportingTo search state (for create/edit position)
    const [reportingToSearch, setReportingToSearch] = useState('');
    const [reportingToResults, setReportingToResults] = useState<OrgPositionResponse[]>([]);
    const [reportingToFocused, setReportingToFocused] = useState(false);
    const [reportingToSelectedLabel, setReportingToSelectedLabel] = useState('');
    const reportingToRef = useRef<HTMLDivElement>(null);

    // ==================== Data Fetching ====================

    const fetchDetail = useCallback(async () => {
        try {
            setLoading(true);
            const data = await orgUnitService.getOrgUnit(ouId);
            setDetail(data);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to load OU details', message: err?.message });
        } finally {
            setLoading(false);
        }
    }, [ouId, addNotification]);

    const fetchAncestors = useCallback(async () => {
        try {
            const data = await orgUnitService.getAncestors(ouId);
            setAncestors(data);
        } catch { /* ignore */ }
    }, [ouId]);

    const fetchChildren = useCallback(async () => {
        try {
            const data = await orgUnitService.getChildren(ouId);
            setChildren(data);
        } catch { /* ignore */ }
    }, [ouId]);

    const fetchMembers = useCallback(async (query?: string, page?: number) => {
        try {
            const data = await orgUnitService.getMembers(ouId, {
                query: query || undefined,
                page: page ?? memberPage,
                size: memberPageSize,
            });
            if (data.content) {
                setMembers(data.content);
                setMemberTotalPages(data.totalPages || 0);
                setMemberTotalElements(data.totalElements || 0);
            } else {
                setMembers(Array.isArray(data) ? data : []);
            }
        } catch { /* ignore */ }
    }, [ouId, memberPage, memberPageSize]);

    // Debounce member filter for server-side search
    useEffect(() => {
        const timer = setTimeout(() => {
            setMemberFilterDebounced(memberFilter);
            setMemberPage(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [memberFilter]);

    useEffect(() => {
        if (activeTab === 'members') {
            fetchMembers(memberFilterDebounced || undefined);
        }
    }, [memberFilterDebounced, activeTab, fetchMembers, memberPage, memberPageSize]);

    // Debounce assignment search
    useEffect(() => {
        const timer = setTimeout(() => setAssignmentSearchDebounced(assignmentSearch), 300);
        return () => clearTimeout(timer);
    }, [assignmentSearch]);

    useEffect(() => {
        if (!canView) {
            router.push('/');
            return;
        }
        fetchDetail();
        fetchAncestors();
        fetchChildren();
        fetchMembers();
    }, [canView, router, fetchDetail, fetchAncestors, fetchChildren, fetchMembers]);

    // ==================== Edit Handlers ====================

    const startEditing = () => {
        if (!detail) return;
        setEditForm({
            name: detail.name,
            code: detail.code,
            description: detail.description || '',
            typeId: detail.typeId as any,
        });
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditForm({});
    };

    const saveEdit = async () => {
        if (!detail) return;
        try {
            setActionLoading(true);
            const updated = await orgUnitService.updateOrgUnit(detail.id, editForm);
            setDetail(updated);
            setIsEditing(false);
            addNotification({ type: 'success', title: 'Unit Updated', message: `"${updated.name}" updated successfully` });
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to update', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    // ==================== Delete Handler ====================

    const handleDelete = async () => {
        if (!detail) return;
        try {
            setActionLoading(true);
            await orgUnitService.deleteOrgUnit(detail.id);
            addNotification({ type: 'success', title: 'Unit Deleted', message: `"${detail.name}" deleted successfully` });
            router.push('/admin/organization');
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to delete', message: err?.message });
        } finally {
            setActionLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    // ==================== Head Assignment ====================

    const searchHeadUsers = useCallback(async (query: string) => {
        try {
            if (!query || query.length < 2) {
                const params = new URLSearchParams({ page: '0', size: '10' });
                const response = await apiClient.get<any>(`/api/v1/admin/users?${params}`);
                const users = response.content || response || [];
                setHeadSearchResults(Array.isArray(users) ? users : []);
                return;
            }
            const params = new URLSearchParams({ query, page: '0', size: '10' });
            const response = await apiClient.get<any>(`/api/v1/admin/users/search?${params}`);
            const users = response.content || response || [];
            setHeadSearchResults(Array.isArray(users) ? users : []);
        } catch {
            setHeadSearchResults([]);
        }
    }, []);

    useEffect(() => {
        if (!isSetHeadOpen) return;
        const timer = setTimeout(() => searchHeadUsers(headSearchQuery), 400);
        return () => clearTimeout(timer);
    }, [headSearchQuery, searchHeadUsers, isSetHeadOpen]);

    const handleSetHead = async (user: SimpleUser) => {
        if (!detail) return;
        try {
            setActionLoading(true);
            const updated = await orgUnitService.setHead(detail.id, user.id);
            setDetail(updated);
            setIsSetHeadOpen(false);
            setHeadSearchQuery('');
            addNotification({ type: 'success', title: 'Head Set', message: `${user.displayName || user.username} is now the head` });
            fetchMembers();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to set head', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    // ==================== Move OU ====================

    const openMoveModal = async () => {
        try {
            const tree = await orgUnitService.getTree();
            setMoveTree(tree);
            setIsMoveOpen(true);
            setMoveTargetId(null);
            setMoveSearchQuery('');
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to load tree', message: err?.message });
        }
    };

    const handleMove = async () => {
        if (!detail || !moveTargetId) return;
        try {
            setActionLoading(true);
            const updated = await orgUnitService.moveOrgUnit(detail.id, moveTargetId);
            setDetail(updated);
            setIsMoveOpen(false);
            addNotification({ type: 'success', title: 'Unit Moved', message: `"${detail.name}" moved successfully` });
            fetchAncestors();
            fetchChildren();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to move', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    // ==================== Member Management ====================

    const searchMemberUsers = useCallback(async (query: string) => {
        try {
            if (!query || query.length < 2) {
                const params = new URLSearchParams({ page: '0', size: '10' });
                const response = await apiClient.get<any>(`/api/v1/admin/users?${params}`);
                const users = response.content || response || [];
                setMemberSearchResults(Array.isArray(users) ? users : []);
                return;
            }
            const params = new URLSearchParams({ query, page: '0', size: '10' });
            const response = await apiClient.get<any>(`/api/v1/admin/users/search?${params}`);
            const users = response.content || response || [];
            setMemberSearchResults(Array.isArray(users) ? users : []);
        } catch {
            setMemberSearchResults([]);
        }
    }, []);

    useEffect(() => {
        if (!isAddMemberOpen) return;
        const timer = setTimeout(() => searchMemberUsers(memberSearchQuery), 400);
        return () => clearTimeout(timer);
    }, [memberSearchQuery, searchMemberUsers, isAddMemberOpen]);

    const handleAddMember = async (user: SimpleUser) => {
        if (!detail) return;
        try {
            setActionLoading(true);
            await orgUnitService.assignUser(detail.id, { userId: user.id });
            addNotification({ type: 'success', title: 'Member Added', message: `${user.displayName || user.username} added to this unit` });
            fetchMembers();
            fetchDetail();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to add member', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleBatchAddMembers = async () => {
        if (!detail || selectedMemberAddIds.length === 0) return;
        try {
            setActionLoading(true);
            await orgUnitService.assignUsersBatch(detail.id, {
                assignments: selectedMemberAddIds.map(id => ({ userId: id }))
            });
            addNotification({ type: 'success', title: 'Members Added', message: `${selectedMemberAddIds.length} member(s) added` });
            setSelectedMemberAddIds([]);
            setIsAddMemberOpen(false);
            setMemberSearchQuery('');
            fetchMembers();
            fetchDetail();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to add members', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveMember = async (userId: string, displayName: string) => {
        if (!detail) return;
        try {
            setRemovingMemberId(userId);
            await orgUnitService.removeUser(detail.id, userId);
            addNotification({ type: 'success', title: 'Member Removed', message: `${displayName} removed from this unit` });
            fetchMembers();
            fetchDetail();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to remove member', message: err?.message });
        } finally {
            setRemovingMemberId(null);
        }
    };

    const handleBatchRemoveMembers = async () => {
        if (!detail || selectedMemberIds.length === 0) return;
        try {
            setActionLoading(true);
            await orgUnitService.removeUsersBatch(detail.id, selectedMemberIds);
            addNotification({ type: 'success', title: 'Members Removed', message: `${selectedMemberIds.length} member(s) removed` });
            setSelectedMemberIds([]);
            fetchMembers();
            fetchDetail();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to remove members', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    // Batch delete seats
    const handleBatchDeletePositions = async () => {
        if (!detail || selectedSeatIds.length === 0) return;
        try {
            setActionLoading(true);
            await orgUnitService.deletePositionsBatch(detail.id, selectedSeatIds);
            addNotification({ type: 'success', title: 'Positions Deleted', message: `${selectedSeatIds.length} seat(s) deleted` });
            setSelectedSeatIds([]);
            fetchPositions();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to delete positions', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    // Assign users to seat — always with config
    const handleBatchAssignToSeat = async () => {
        if (!detail || !assignToSeatId || assignSeatSelectedIds.length === 0) return;
        try {
            setActionLoading(true);
            const posId = assignToSeatId;
            await orgUnitService.assignUsersToPosition(detail.id, assignToSeatId, assignSeatSelectedIds, {
                isPrimary: assignConfigForm.isPrimary,
                effectiveFrom: assignConfigForm.effectiveFrom || undefined,
                effectiveTo: assignConfigForm.effectiveTo || null,
                assignmentType: assignConfigForm.assignmentType,
                ftePercentage: assignConfigForm.ftePercentage,
            });
            addNotification({ type: 'success', title: 'Users Assigned', message: `${assignSeatSelectedIds.length} user(s) assigned to seat` });
            setAssignSeatSelectedIds([]);
            setAssignToSeatId(null);
            setAssignSeatSearch('');
            setAssignConfigForm({ isPrimary: false, effectiveFrom: new Date().toISOString().split('T')[0], effectiveTo: '', assignmentType: 'PERMANENT', ftePercentage: 100 });
            fetchAssignments(posId);
            fetchPositions();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to assign users', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    // Open edit assignment dialog
    const handleEditAssignment = (assignment: PositionAssignmentResponse) => {
        setEditingAssignment(assignment);
        setEditAssignmentForm({
            isPrimary: assignment.isPrimary,
            effectiveFrom: assignment.effectiveFrom || '',
            effectiveTo: assignment.effectiveTo || '',
            assignmentType: assignment.assignmentType || 'PERMANENT',
            ftePercentage: assignment.ftePercentage ?? 100,
        });
    };

    // Save edited assignment
    const handleSaveAssignment = async () => {
        if (!detail || !editingAssignment) return;
        try {
            setActionLoading(true);
            await orgUnitService.updatePositionAssignment(detail.id, editingAssignment.orgPositionId, editingAssignment.id, {
                isPrimary: editAssignmentForm.isPrimary,
                effectiveFrom: editAssignmentForm.effectiveFrom || undefined,
                effectiveTo: editAssignmentForm.effectiveTo || null,
                assignmentType: editAssignmentForm.assignmentType,
                ftePercentage: editAssignmentForm.ftePercentage,
            });
            addNotification({ type: 'success', title: 'Assignment Updated', message: 'Position assignment updated successfully' });
            setEditingAssignment(null);
            fetchAssignments(editingAssignment.orgPositionId);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Update Failed', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    // Batch unassign from seat
    const handleBatchUnassign = async (positionId: string) => {
        if (!detail || selectedAssignmentIds.length === 0) return;
        try {
            setActionLoading(true);
            await orgUnitService.unassignFromPositionBatch(detail.id, positionId, selectedAssignmentIds);
            addNotification({ type: 'success', title: 'Users Unassigned', message: `${selectedAssignmentIds.length} assignment(s) removed` });
            setSelectedAssignmentIds([]);
            fetchAssignments(positionId);
            fetchPositions();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to unassign', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    // ==================== Position Management ====================

    const fetchPositions = useCallback(async () => {
        try {
            setPositionsLoading(true);
            const resp = await orgUnitService.getPositions(ouId, {
                search: seatSearchDebounced || undefined,
                isActive: seatIsActive ?? undefined,
                isBudgetApproved: seatBudget ?? undefined,
                page: seatPage,
                size: seatPageSize,
            });
            const content = resp.content || [];
            setPositions(content);
            setSeatTotalPages(resp.totalPages || 0);
            setSeatTotalElements(resp.totalElements || 0);
        } catch { /* ignore */ }
        finally { setPositionsLoading(false); }
    }, [ouId, seatSearchDebounced, seatIsActive, seatBudget, seatPage, seatPageSize]);

    // Debounce seat search
    useEffect(() => {
        const t = setTimeout(() => { setSeatSearchDebounced(seatSearch); setSeatPage(0); }, 300);
        return () => clearTimeout(t);
    }, [seatSearch]);

    // Server-side search for position definitions (create form)
    useEffect(() => {
        const t = setTimeout(() => setPosDefSearchDebounced(posDefSearch), 300);
        return () => clearTimeout(t);
    }, [posDefSearch]);

    useEffect(() => {
        if (!posDefDropdownOpen) return;
        const fetchDefs = async () => {
            try {
                const qp = new URLSearchParams({ isActive: 'true', size: '15', sort: 'sortOrder', direction: 'asc' });
                if (posDefSearchDebounced.trim()) qp.set('search', posDefSearchDebounced.trim());
                const res = await apiClient.get<any>(`/api/v1/admin/positions/definitions?${qp.toString()}`);
                setPosDefResults(Array.isArray(res) ? res : (res.content || []));
            } catch { setPosDefResults([]); }
        };
        fetchDefs();
    }, [posDefSearchDebounced, posDefDropdownOpen]);

    // Server-side search for position definitions (edit form)
    useEffect(() => {
        const t = setTimeout(() => setPosDefEditSearchDebounced(posDefEditSearch), 300);
        return () => clearTimeout(t);
    }, [posDefEditSearch]);

    useEffect(() => {
        if (!posDefEditDropdownOpen) return;
        const fetchDefs = async () => {
            try {
                const qp = new URLSearchParams({ isActive: 'true', size: '15', sort: 'sortOrder', direction: 'asc' });
                if (posDefEditSearchDebounced.trim()) qp.set('search', posDefEditSearchDebounced.trim());
                const res = await apiClient.get<any>(`/api/v1/admin/positions/definitions?${qp.toString()}`);
                setPosDefEditResults(Array.isArray(res) ? res : (res.content || []));
            } catch { setPosDefEditResults([]); }
        };
        fetchDefs();
    }, [posDefEditSearchDebounced, posDefEditDropdownOpen]);

    // Close dropdowns on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (posDefDropdownRef.current && !posDefDropdownRef.current.contains(e.target as Node)) setPosDefDropdownOpen(false);
            if (posDefEditDropdownRef.current && !posDefEditDropdownRef.current.contains(e.target as Node)) setPosDefEditDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (activeTab === 'positions') {
            fetchPositions();
        }
    }, [activeTab, fetchPositions]);

    const handleCreatePosition = async (force = false) => {
        if (!detail || !positionForm.positionDefinitionId || !positionForm.seatCode) return;
        try {
            setActionLoading(true);
            await orgUnitService.createPosition(detail.id, positionForm, force);
            addNotification({ type: 'success', title: 'Position Created', message: `Seat "${positionForm.seatCode}" created` });
            setIsCreatePositionOpen(false);
            setPositionForm({ positionDefinitionId: '', seatCode: '' });
            setPosDefSelectedName('');
            setDuplicateInfo(null);
            fetchPositions();
        } catch (err: any) {
            // Check for 409 duplicate definition
            if (err?.status === 409 && err?.data?.code === 'DUPLICATE_POSITION_DEFINITION') {
                setDuplicateInfo(err.data);
                return;
            }
            addNotification({ type: 'error', title: 'Failed to create position', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeletePosition = async (positionId: string, seatCode: string) => {
        if (!detail) return;
        try {
            setActionLoading(true);
            await orgUnitService.deletePosition(detail.id, positionId);
            addNotification({ type: 'success', title: 'Position Deleted', message: `Seat "${seatCode}" deleted` });
            fetchPositions();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to delete position', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    const startEditingPosition = (pos: OrgPositionResponse) => {
        setEditingPositionId(pos.id);
        setEditPositionForm({
            seatCode: pos.seatCode,
            positionDefinitionId: pos.positionDefinitionId,
            maxHeadcount: pos.maxHeadcount,
            isBudgetApproved: pos.isBudgetApproved,
            isActive: pos.isActive,
            reportingToPositionId: pos.reportingToPositionId || undefined,
        });
        setPosDefEditSelectedName(pos.positionTitle || pos.positionCode || '');
        setReportingToSearch('');
        setReportingToSelectedLabel(pos.reportingToSeatCode ? pos.reportingToSeatCode : '');
    };

    const cancelEditingPosition = () => {
        setEditingPositionId(null);
        setEditPositionForm({});
    };

    const handleUpdatePosition = async () => {
        if (!detail || !editingPositionId) return;
        try {
            setActionLoading(true);
            await orgUnitService.updatePosition(detail.id, editingPositionId, editPositionForm);
            addNotification({ type: 'success', title: 'Position Updated', message: 'Seat updated successfully' });
            setEditingPositionId(null);
            setEditPositionForm({});
            fetchPositions();
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Failed to update position', message: err?.message });
        } finally {
            setActionLoading(false);
        }
    };

    const fetchAssignments = async (positionId: string) => {
        if (!detail) return;
        try {
            const data = await orgUnitService.getPositionAssignments(detail.id, positionId, {
                search: assignmentSearchDebounced || undefined,
                page: assignmentPage,
                size: assignmentPageSize,
                assignmentType: assignmentTypeFilter || undefined,
                isPrimary: isPrimaryFilter === 'true' ? true : isPrimaryFilter === 'false' ? false : undefined,
            });
            if (data.content) {
                setPositionAssignments(prev => ({ ...prev, [positionId]: data.content }));
                setAssignmentTotalPages(data.totalPages || 0);
                setAssignmentTotalElements(data.totalElements || 0);
            } else {
                setPositionAssignments(prev => ({ ...prev, [positionId]: Array.isArray(data) ? data : [] }));
            }
        } catch { /* ignore */ }
    };

    const toggleExpandPosition = (positionId: string) => {
        if (expandedPositionId === positionId) {
            setExpandedPositionId(null);
            setSelectedAssignmentIds([]);
            setAssignmentSearch('');
            setAssignmentPage(0);
            setAssignmentTypeFilter('');
            setIsPrimaryFilter('');
        } else {
            setExpandedPositionId(positionId);
            setSelectedAssignmentIds([]);
            setAssignmentSearch('');
            setAssignmentPage(0);
            setAssignmentTypeFilter('');
            setIsPrimaryFilter('');
            fetchAssignments(positionId);
        }
    };

    // Refetch assignments when pagination/search/filters change
    useEffect(() => {
        if (expandedPositionId) {
            fetchAssignments(expandedPositionId);
        }
    }, [assignmentPage, assignmentPageSize, assignmentSearchDebounced, assignmentTypeFilter, isPrimaryFilter]);

    // Search OU members for assign-to-seat dialog
    useEffect(() => {
        if (!assignToSeatId) return;
        const timer = setTimeout(async () => {
            try {
                const data = await orgUnitService.getMembers(ouId, {
                    query: assignSeatSearch || undefined,
                    page: assignSeatPage,
                    size: 10,
                    excludePositionId: assignToSeatId,
                });
                setAssignSeatSearchResults(data.content || (Array.isArray(data) ? data : []));
            } catch {
                setAssignSeatSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [assignSeatSearch, assignToSeatId, assignSeatPage, ouId]);

    // ReportingTo position search (server-side — searches all OU seats)
    useEffect(() => {
        if (!reportingToFocused) return;
        const timer = setTimeout(async () => {
            try {
                const resp = await orgUnitService.getPositions(ouId, {
                    search: reportingToSearch || undefined,
                    isActive: true,
                    page: 0,
                    size: 15,
                });
                setReportingToResults(resp.content || []);
            } catch { setReportingToResults([]); }
        }, 300);
        return () => clearTimeout(timer);
    }, [reportingToSearch, ouId, reportingToFocused]);

    // Close reportingTo dropdown on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (reportingToRef.current && !reportingToRef.current.contains(e.target as Node)) setReportingToFocused(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ==================== Render Helpers ====================

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    // ==================== Tab Configuration ====================

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Building2 className="h-4 w-4" />, show: true },
        { id: 'hierarchy', label: 'Hierarchy', icon: <Network className="h-4 w-4" />, show: true },
        { id: 'head', label: 'Head', icon: <Crown className="h-4 w-4" />, show: true },
        { id: 'positions', label: 'Positions', icon: <Briefcase className="h-4 w-4" />, show: canReadPositions },
        { id: 'members', label: 'Members', icon: <UsersIcon className="h-4 w-4" />, show: canViewMembers },
        { id: 'groups', label: 'Groups', icon: <UsersRound className="h-4 w-4" />, show: true },
        { id: 'audit', label: 'Audit', icon: <Activity className="h-4 w-4" />, show: canReadAudit },
    ];

    const visibleTabs = tabs.filter(t => t.show);

    // ==================== Loading / Error States ====================

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading organization unit...</p>
                </div>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <p className="text-destructive text-lg">Organization unit not found</p>
                    <Button variant="outline" onClick={() => router.push('/admin/organization')} className="mt-4">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Organization
                    </Button>
                </div>
            </div>
        );
    }

    const typeColorClass = detail.typeColor || 'bg-slate-100 text-slate-800 border-slate-200';
    const typeName = detail.typeName || 'Unknown Type';

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* ==================== Header ==================== */}
            <div className="flex-shrink-0 p-6 pb-4">
                {/* Back + Breadcrumb */}
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/admin/organization')} className="gap-1.5 h-7 px-2">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Organization
                    </Button>
                    {ancestors.length > 0 && ancestors.map((a, i) => (
                        <React.Fragment key={a.id}>
                            <ChevronRight className="h-3 w-3" />
                            <Link href={`/admin/organization/${a.id}`} className="hover:text-foreground transition-colors">
                                {a.name}
                            </Link>
                        </React.Fragment>
                    ))}
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-medium">{detail.name}</span>
                </div>

                {/* Main Header Card */}
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                {/* Type Icon */}
                                <div className={`h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColorClass}`}>
                                    <Building2 className="h-7 w-7" />
                                </div>
                                {/* Info */}
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-2xl font-bold">{detail.name}</h1>
                                        <Badge variant="outline" className={`${typeColorClass}`}>
                                            {typeName}
                                        </Badge>
                                        <Badge variant={detail.isActive ? 'default' : 'secondary'} className="text-xs">
                                            {detail.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Hash className="h-3.5 w-3.5" />
                                            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{detail.code}</code>
                                        </span>
                                        {detail.headUserDisplayName && (
                                            <span className="flex items-center gap-1.5">
                                                <Crown className="h-3.5 w-3.5 text-amber-500" />
                                                {detail.headUserDisplayName}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5">
                                            <UsersIcon className="h-3.5 w-3.5" />
                                            {detail.memberCount} members
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Layers className="h-3.5 w-3.5" />
                                            {detail.childCount} children
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    fetchDetail();
                                    fetchAncestors();
                                    fetchChildren();
                                    fetchMembers();
                                }} className="gap-1.5">
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Refresh
                                </Button>
                                {canUpdate && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="gap-1.5">
                                                Actions
                                                <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={startEditing}>
                                                <Edit className="h-4 w-4 mr-2" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={openMoveModal}>
                                                <Move className="h-4 w-4 mr-2" /> Move Unit
                                            </DropdownMenuItem>
                                            {canDelete && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive">
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete Unit
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ==================== Tabs ==================== */}
            <div className="flex-1 px-6 pb-6 min-h-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                    <TabsList className="flex-shrink-0 w-full justify-start gap-1 bg-transparent border-b rounded-none h-auto pb-0 px-0">
                        {visibleTabs.map(tab => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="gap-1.5 px-4 py-2.5 rounded-none border-b-2 border-transparent 
                                    data-[state=active]:border-primary data-[state=active]:bg-transparent 
                                    data-[state=active]:shadow-none data-[state=active]:text-primary"
                            >
                                {tab.icon}
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="flex-1 overflow-y-auto mt-4">
                        {/* ==================== Overview Tab ==================== */}
                        <TabsContent value="overview" className="mt-0 space-y-4">
                            {isEditing ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Edit Organization Unit</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Name</Label>
                                                <Input
                                                    value={editForm.name || ''}
                                                    onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Code</Label>
                                                <Input
                                                    value={editForm.code || ''}
                                                    onChange={(e) => setEditForm(p => ({ ...p, code: e.target.value }))}
                                                    className="font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                value={editForm.description || ''}
                                                onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                                                rows={3}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Status</Label>
                                                <Select
                                                    value={editForm.isActive === false ? 'inactive' : 'active'}
                                                    onValueChange={(v) => setEditForm(p => ({ ...p, isActive: v === 'active' }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Sort Order</Label>
                                                <Input
                                                    type="number"
                                                    value={editForm.sortOrder ?? detail.sortOrder ?? 0}
                                                    onChange={(e) => setEditForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button variant="outline" onClick={cancelEditing} disabled={actionLoading}>Cancel</Button>
                                            <Button onClick={saveEdit} disabled={actionLoading} className="gap-1.5">
                                                {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                                Save Changes
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Details Card */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-primary" />
                                                Unit Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-2 gap-y-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Name</p>
                                                    <p className="font-medium">{detail.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Code</p>
                                                    <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">{detail.code}</code>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Type</p>
                                                    <Badge variant="outline" className={`${typeColorClass} mt-0.5`}>
                                                        {typeName}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Status</p>
                                                    <Badge variant={detail.isActive ? 'default' : 'secondary'} className="mt-0.5">
                                                        {detail.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Level</p>
                                                    <p className="font-medium">{detail.level}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Sort Order</p>
                                                    <p className="font-medium">{detail.sortOrder}</p>
                                                </div>
                                            </div>
                                            {detail.description && (
                                                <div className="pt-2 border-t">
                                                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                                                    <p className="text-sm">{detail.description}</p>
                                                </div>
                                            )}
                                            <div className="pt-2 border-t">
                                                <p className="text-xs text-muted-foreground mb-1">Ltree Path</p>
                                                <code className="text-xs font-mono bg-muted px-2 py-1 rounded block">{detail.pathLtree}</code>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Stats & Audit Card */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-primary" />
                                                Statistics & Audit
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Stats Row */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="text-center p-3 rounded-lg bg-muted/50 border">
                                                    <UsersIcon className="h-5 w-5 mx-auto text-primary mb-1" />
                                                    <p className="text-2xl font-bold">{detail.memberCount}</p>
                                                    <p className="text-xs text-muted-foreground">Members</p>
                                                </div>
                                                <div className="text-center p-3 rounded-lg bg-muted/50 border">
                                                    <Layers className="h-5 w-5 mx-auto text-primary mb-1" />
                                                    <p className="text-2xl font-bold">{detail.childCount}</p>
                                                    <p className="text-xs text-muted-foreground">Children</p>
                                                </div>
                                                <div className="text-center p-3 rounded-lg bg-muted/50 border">
                                                    <Crown className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                                                    <p className="text-2xl font-bold">{detail.headUserId ? '1' : '0'}</p>
                                                    <p className="text-xs text-muted-foreground">Head</p>
                                                </div>
                                            </div>

                                            {/* Audit Info */}
                                            <div className="space-y-2 pt-2 border-t">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" /> Created
                                                    </span>
                                                    <span className="font-medium">{formatDate(detail.createdAt)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" /> Last Updated
                                                    </span>
                                                    <span className="font-medium">{formatDate(detail.updatedAt)}</span>
                                                </div>
                                                {detail.parentName && (
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                                            <Network className="h-3.5 w-3.5" /> Parent
                                                        </span>
                                                        <Link href={`/admin/organization/${detail.parentId}`} className="font-medium text-primary hover:underline">
                                                            {detail.parentName}
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </TabsContent>

                        {/* ==================== Hierarchy Tab ==================== */}
                        <TabsContent value="hierarchy" className="mt-0 space-y-4">
                            {/* Breadcrumb / Ancestor Chain */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Network className="h-4 w-4 text-primary" />
                                        Ancestor Path
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {ancestors.length > 0 ? ancestors.map((a, i) => (
                                            <React.Fragment key={a.id}>
                                                {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                <Link
                                                    href={`/admin/organization/${a.id}`}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border hover:bg-muted/60 transition-colors"
                                                >
                                                    <div className={`h-5 w-5 rounded flex items-center justify-center ${a.typeColor || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                                                        <Building2 className="h-3 w-3" />
                                                    </div>
                                                    <span className="text-sm font-medium">{a.name}</span>
                                                </Link>
                                            </React.Fragment>
                                        )) : (
                                            <p className="text-sm text-muted-foreground">This is a root organizational unit</p>
                                        )}
                                        {ancestors.length > 0 && (
                                            <>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
                                                    <div className={`h-5 w-5 rounded flex items-center justify-center ${typeColorClass}`}>
                                                        <Building2 className="h-3 w-3" />
                                                    </div>
                                                    <span className="text-sm font-medium text-primary">{detail.name}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Children */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-primary" />
                                            Direct Children ({children.length})
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            {canUpdate && (
                                                <Button variant="outline" size="sm" onClick={openMoveModal} className="gap-1.5">
                                                    <Move className="h-3.5 w-3.5" />
                                                    Move Unit
                                                </Button>
                                            )}
                                            {canCreate && (
                                                <Button variant="outline" size="sm" onClick={() => router.push(`/admin/organization?createUnder=${detail.id}`)} className="gap-1.5">
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Create Child
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {children.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                            <p className="text-muted-foreground text-sm">No child organizational units</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {children.map(child => {
                                                const childTypeColorClass = child.typeColor || 'bg-slate-100 text-slate-800 border-slate-200';
                                                const childTypeName = child.typeName || 'Unknown Type';
                                                return (
                                                    <Link
                                                        key={child.id}
                                                        href={`/admin/organization/${child.id}`}
                                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/60 transition-all group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${childTypeColorClass}`}>
                                                                <Building2 className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-sm">{child.name}</span>
                                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${childTypeColorClass}`}>
                                                                        {childTypeName}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                                    <code className="font-mono">{child.code}</code>
                                                                    <span className="flex items-center gap-1">
                                                                        <UsersIcon className="h-3 w-3" />{child.memberCount}
                                                                    </span>
                                                                    {child.headUserDisplayName && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Crown className="h-3 w-3 text-amber-500" />{child.headUserDisplayName}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ==================== Head Tab ==================== */}
                        <TabsContent value="head" className="mt-0 space-y-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Crown className="h-4 w-4 text-amber-500" />
                                            Unit Head
                                        </CardTitle>
                                        {canAssignHead && (
                                            <Button variant="outline" size="sm" onClick={() => setIsSetHeadOpen(true)} className="gap-1.5">
                                                <UserPlus className="h-3.5 w-3.5" />
                                                {detail.headUserId ? 'Change Head' : 'Assign Head'}
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {detail.headUserId && detail.headUserDisplayName ? (
                                        <div className="flex items-center gap-4 p-4 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                                            <UserAvatar
                                                user={{ displayName: detail.headUserDisplayName }}
                                                size="xl"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-lg">{detail.headUserDisplayName}</h3>
                                                    <Crown className="h-4 w-4 text-amber-500" />
                                                </div>
                                                <p className="text-sm text-muted-foreground">Head of {detail.name}</p>
                                            </div>
                                            <Link href={`/admin/users/${detail.headUserId}`}>
                                                <Button variant="outline" size="sm" className="gap-1.5">
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    View Profile
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10">
                                            <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                                            <p className="text-muted-foreground">No head assigned to this unit</p>
                                            {canAssignHead && (
                                                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setIsSetHeadOpen(true)}>
                                                    <UserPlus className="h-3.5 w-3.5" />
                                                    Assign Head
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Head Search Modal */}
                            {isSetHeadOpen && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">Search Users</CardTitle>
                                            <Button variant="ghost" size="sm" onClick={() => { setIsSetHeadOpen(false); setHeadSearchQuery(''); }}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name or email..."
                                                value={headSearchQuery}
                                                onChange={(e) => setHeadSearchQuery(e.target.value)}
                                                className="pl-9"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-64 overflow-y-auto space-y-1">
                                            {headSearchResults.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    {headSearchQuery ? 'No users found' : 'Type to search users'}
                                                </p>
                                            ) : (
                                                headSearchResults.map(user => (
                                                    <button
                                                        key={user.id}
                                                        onClick={() => handleSetHead(user)}
                                                        disabled={actionLoading}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/60 transition-colors text-left"
                                                    >
                                                        <UserAvatar user={user} size="sm" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                        </div>
                                                        <Check className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* ==================== Positions Tab ==================== */}
                        <TabsContent value="positions" className="mt-0 space-y-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-primary" />
                                            Formal Positions ({seatTotalElements})
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            {selectedSeatIds.length > 0 && canDeletePositions && (
                                                <Button variant="destructive" size="sm" onClick={handleBatchDeletePositions} disabled={actionLoading} className="gap-1.5">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Delete Selected ({selectedSeatIds.length})
                                                </Button>
                                            )}
                                            {canCreatePositions && (
                                                <Button variant="outline" size="sm" onClick={() => setIsCreatePositionOpen(true)} className="gap-1.5">
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Create Seat
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    {/* Filter Bar */}
                                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                                        <div className="relative flex-1 min-w-[180px] max-w-xs">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                value={seatSearch}
                                                onChange={(e) => setSeatSearch(e.target.value)}
                                                placeholder="Search seats..."
                                                className="h-8 pl-9 text-sm"
                                            />
                                        </div>
                                        <Select value={seatIsActive === null ? 'all' : String(seatIsActive)} onValueChange={(v) => { setSeatIsActive(v === 'all' ? null : v === 'true'); setSeatPage(0); }}>
                                            <SelectTrigger className="h-8 w-[120px] text-sm">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="true">Active</SelectItem>
                                                <SelectItem value="false">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={seatBudget === null ? 'all' : String(seatBudget)} onValueChange={(v) => { setSeatBudget(v === 'all' ? null : v === 'true'); setSeatPage(0); }}>
                                            <SelectTrigger className="h-8 w-[140px] text-sm">
                                                <SelectValue placeholder="Budget" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Budget</SelectItem>
                                                <SelectItem value="true">Approved</SelectItem>
                                                <SelectItem value="false">Not Approved</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {positionsLoading ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
                                            <p className="text-muted-foreground text-sm">Loading positions...</p>
                                        </div>
                                    ) : positions.length === 0 ? (
                                        <div className="text-center py-10">
                                            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                                            <p className="text-muted-foreground">No positions defined for this unit</p>
                                            {canCreatePositions && (
                                                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setIsCreatePositionOpen(true)}>
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Create First Seat
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {/* Select all checkbox */}
                                            {canDeletePositions && positions.length > 0 && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
                                                    <input
                                                        type="checkbox"
                                                        className="h-3.5 w-3.5 rounded border-gray-300"
                                                        checked={selectedSeatIds.length === positions.length && positions.length > 0}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedSeatIds(positions.map(p => p.id));
                                                            } else {
                                                                setSelectedSeatIds([]);
                                                            }
                                                        }}
                                                    />
                                                    <span>Select all</span>
                                                </div>
                                            )}
                                            {positions.map(pos => (
                                                <div key={pos.id} className="rounded-lg border overflow-hidden">
                                                    <div
                                                        className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                                                        onClick={() => toggleExpandPosition(pos.id)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {canDeletePositions && (
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4 rounded border-gray-300"
                                                                    checked={selectedSeatIds.includes(pos.id)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedSeatIds(prev => [...prev, pos.id]);
                                                                        } else {
                                                                            setSelectedSeatIds(prev => prev.filter(id => id !== pos.id));
                                                                        }
                                                                    }}
                                                                />
                                                            )}
                                                            <div className="h-9 w-9 rounded-lg bg-muted/60 border flex items-center justify-center">
                                                                <Briefcase className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-medium text-sm">{pos.positionTitle}</span>
                                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">{pos.seatCode}</Badge>
                                                                    {pos.positionCode && <span className="text-[10px] text-muted-foreground font-mono">{pos.positionCode}</span>}
                                                                </div>
                                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                                                    <span className="flex items-center gap-1">
                                                                        <UsersIcon className="h-3 w-3" />
                                                                        {pos.currentHeadcount}/{pos.maxHeadcount} filled
                                                                    </span>
                                                                    {pos.isBudgetApproved && (
                                                                        <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"><Check className="h-3 w-3" /> Budget</span>
                                                                    )}
                                                                    {!pos.isActive && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Inactive</Badge>}
                                                                    {pos.reportingToSeatCode && (
                                                                        <span className="flex items-center gap-1">Reports to: <span className="font-mono">{pos.reportingToSeatCode}</span></span>
                                                                    )}
                                                                    <span className="text-muted-foreground/60">·</span>
                                                                    <span className="flex items-center gap-1" title={`Created: ${new Date(pos.createdAt).toLocaleString()}`}>
                                                                        <Calendar className="h-3 w-3" />
                                                                        {new Date(pos.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    </span>
                                                                    {pos.updatedAt && pos.updatedAt !== pos.createdAt && (
                                                                        <span className="flex items-center gap-1 italic" title={`Updated: ${new Date(pos.updatedAt).toLocaleString()}`}>
                                                                            edited {new Date(pos.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {canCreatePositions && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                                                            onClick={(e) => { e.stopPropagation(); startEditingPosition(pos); }} disabled={actionLoading}>
                                                                            <Edit className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Edit seat</TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {canDeletePositions && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                                            onClick={(e) => { e.stopPropagation(); handleDeletePosition(pos.id, pos.seatCode); }} disabled={actionLoading}>
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Delete seat</TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {expandedPositionId === pos.id
                                                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                        </div>
                                                    </div>
                                                    {/* Assignments Dialog — rendered for expanded position */}
                                                    {expandedPositionId === pos.id && (
                                                        <Dialog open={true} onOpenChange={(open) => { if (!open) toggleExpandPosition(pos.id); }}>
                                                            <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
                                                                <DialogHeader>
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <DialogTitle className="flex items-center gap-2">
                                                                                <Briefcase className="h-4 w-4" />
                                                                                {pos.positionTitle} — {pos.seatCode}
                                                                            </DialogTitle>
                                                                            <DialogDescription className="flex items-center gap-2 mt-1">
                                                                                Assigned Users
                                                                                <Badge variant={pos.currentHeadcount >= pos.maxHeadcount ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0 h-4">
                                                                                    {pos.currentHeadcount}/{pos.maxHeadcount}
                                                                                </Badge>
                                                                            </DialogDescription>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {selectedAssignmentIds.length > 0 && canCreatePositions && (
                                                                                <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={() => handleBatchUnassign(pos.id)} disabled={actionLoading}>
                                                                                    <UserMinus className="h-3 w-3" />
                                                                                    Unassign ({selectedAssignmentIds.length})
                                                                                </Button>
                                                                            )}
                                                                            {canCreatePositions && pos.currentHeadcount < pos.maxHeadcount && (
                                                                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setAssignToSeatId(pos.id); setAssignSeatSearch(''); setAssignSeatSelectedIds([]); setAssignSeatPage(0); }}>
                                                                                    <UserPlus className="h-3 w-3" />
                                                                                    Assign
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </DialogHeader>

                                                                {/* Filter bar */}
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <div className="relative flex-1 min-w-[160px]">
                                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                                        <Input
                                                                            value={assignmentSearch}
                                                                            onChange={(e) => { setAssignmentSearch(e.target.value); setAssignmentPage(0); }}
                                                                            placeholder="Search users..."
                                                                            className="h-8 pl-8 text-xs"
                                                                        />
                                                                    </div>
                                                                    <Select value={assignmentTypeFilter} onValueChange={(v) => { setAssignmentTypeFilter(v === 'ALL' ? '' : v); setAssignmentPage(0); }}>
                                                                        <SelectTrigger className="h-8 w-[140px] text-xs">
                                                                            <SelectValue placeholder="All Types" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="ALL">All Types</SelectItem>
                                                                            <SelectItem value="PERMANENT">Permanent</SelectItem>
                                                                            <SelectItem value="ACTING">Acting</SelectItem>
                                                                            <SelectItem value="INTERIM">Interim</SelectItem>
                                                                            <SelectItem value="SECONDMENT">Secondment</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Select value={isPrimaryFilter} onValueChange={(v) => { setIsPrimaryFilter(v === 'ALL' ? '' : v); setAssignmentPage(0); }}>
                                                                        <SelectTrigger className="h-8 w-[120px] text-xs">
                                                                            <SelectValue placeholder="All" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="ALL">All</SelectItem>
                                                                            <SelectItem value="true">Primary</SelectItem>
                                                                            <SelectItem value="false">Non-Primary</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                {/* Assignment list */}
                                                                <div className="flex-1 overflow-y-auto min-h-0">
                                                                    {!positionAssignments[pos.id] ? (
                                                                        <div className="flex items-center justify-center py-8">
                                                                            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                                                                        </div>
                                                                    ) : positionAssignments[pos.id].length === 0 ? (
                                                                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                                                            <UsersIcon className="h-8 w-8 mb-2 opacity-40" />
                                                                            <p className="text-sm">No users assigned to this seat</p>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            {/* Select all */}
                                                                            {canCreatePositions && (
                                                                                <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground border-b">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="h-3.5 w-3.5 rounded border-gray-300"
                                                                                        checked={selectedAssignmentIds.length === positionAssignments[pos.id].length && positionAssignments[pos.id].length > 0}
                                                                                        onChange={(e) => {
                                                                                            if (e.target.checked) {
                                                                                                setSelectedAssignmentIds(positionAssignments[pos.id].map(a => a.id));
                                                                                            } else {
                                                                                                setSelectedAssignmentIds([]);
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                    <span>Select all ({positionAssignments[pos.id].length})</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="space-y-1.5 mt-1.5">
                                                                                {positionAssignments[pos.id].map(asgn => (
                                                                                    <div key={asgn.id} className={`flex items-center justify-between p-2.5 rounded-md bg-background border text-sm transition-colors group ${canCreatePositions ? 'hover:bg-muted/40 cursor-pointer' : ''}`} onClick={() => canCreatePositions && handleEditAssignment(asgn)}>
                                                                                        <div className="flex items-center gap-2.5">
                                                                                            {canCreatePositions && (
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    className="h-3.5 w-3.5 rounded border-gray-300"
                                                                                                    checked={selectedAssignmentIds.includes(asgn.id)}
                                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                                    onChange={(e) => {
                                                                                                        if (e.target.checked) {
                                                                                                            setSelectedAssignmentIds(prev => [...prev, asgn.id]);
                                                                                                        } else {
                                                                                                            setSelectedAssignmentIds(prev => prev.filter(id => id !== asgn.id));
                                                                                                        }
                                                                                                    }}
                                                                                                />
                                                                                            )}
                                                                                            <UserAvatar user={{ displayName: asgn.userDisplayName, imgUrl: asgn.userImageUrl || undefined }} size="sm" />
                                                                                            <div>
                                                                                                <span className="font-medium">{asgn.userDisplayName}</span>
                                                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                                                    {asgn.isPrimary && (
                                                                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">Primary</Badge>
                                                                                                    )}
                                                                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{asgn.assignmentType}</Badge>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                                            {asgn.ftePercentage != null && <span>{String(asgn.ftePercentage)}% FTE</span>}
                                                                                            <span>From {new Date(asgn.effectiveFrom).toLocaleDateString()}</span>
                                                                                            {asgn.effectiveTo && <span>To {new Date(asgn.effectiveTo).toLocaleDateString()}</span>}
                                                                                            {canCreatePositions && <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {/* Pagination */}
                                                                {assignmentTotalPages > 1 && (
                                                                    <div className="pt-2 border-t">
                                                                        <Pagination
                                                                            currentPage={assignmentPage}
                                                                            totalPages={assignmentTotalPages}
                                                                            totalElements={assignmentTotalElements}
                                                                            pageSize={assignmentPageSize}
                                                                            onPageChange={setAssignmentPage}
                                                                            onPageSizeChange={(s) => { setAssignmentPageSize(s); setAssignmentPage(0); }}
                                                                            pageSizeOptions={[5, 10, 20]}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Pagination */}
                                    <Pagination
                                        currentPage={seatPage}
                                        totalPages={seatTotalPages}
                                        totalElements={seatTotalElements}
                                        pageSize={seatPageSize}
                                        onPageChange={setSeatPage}
                                        onPageSizeChange={(s) => { setSeatPageSize(s); setSeatPage(0); }}
                                        pageSizeOptions={[5, 10, 20, 50]}
                                    />
                                </CardContent>
                            </Card>

                            {/* Edit Position Dialog */}
                            <Dialog open={!!editingPositionId} onOpenChange={(open) => { if (!open) cancelEditingPosition(); }}>
                                <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2"><Edit className="h-4 w-4 text-primary" /> Edit Seat</DialogTitle>
                                        <DialogDescription>Modify the seat configuration, reporting structure, and status.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Position Definition</Label>
                                                <div className="relative" ref={posDefEditDropdownRef}>
                                                    <div
                                                        className="flex items-center h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                                                        onClick={() => { setPosDefEditDropdownOpen(!posDefEditDropdownOpen); setPosDefEditSearch(''); }}
                                                    >
                                                        <span className={`flex-1 truncate ${posDefEditSelectedName || editPositionForm.positionDefinitionId ? '' : 'text-muted-foreground'}`}>
                                                            {posDefEditSelectedName || 'Select position...'}
                                                        </span>
                                                        {editPositionForm.positionDefinitionId && (
                                                            <button className="ml-1 p-0.5 hover:bg-muted rounded" onClick={(e) => { e.stopPropagation(); setEditPositionForm(p => ({ ...p, positionDefinitionId: undefined })); setPosDefEditSelectedName(''); }}>
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
                                                    </div>
                                                    {posDefEditDropdownOpen && (
                                                        <div className="absolute top-full left-0 w-full mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
                                                            <div className="p-2 border-b">
                                                                <div className="relative">
                                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                                    <Input
                                                                        value={posDefEditSearch}
                                                                        onChange={(e) => setPosDefEditSearch(e.target.value)}
                                                                        placeholder="Search by title or code..."
                                                                        className="h-8 pl-8 text-sm"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="max-h-48 overflow-y-auto">
                                                                {posDefEditResults.length === 0 ? (
                                                                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">No definitions found</div>
                                                                ) : posDefEditResults.map((def: any) => (
                                                                    <button
                                                                        key={def.id}
                                                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2 ${def.id === editPositionForm.positionDefinitionId ? 'bg-primary/5' : ''}`}
                                                                        onClick={() => {
                                                                            setEditPositionForm(p => ({ ...p, positionDefinitionId: def.id }));
                                                                            setPosDefEditSelectedName(def.title || def.code);
                                                                            setPosDefEditDropdownOpen(false);
                                                                        }}
                                                                    >
                                                                        <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">{def.code}</code>
                                                                        <span className="truncate">{def.title}</span>
                                                                        {def.id === editPositionForm.positionDefinitionId && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Seat Code</Label>
                                                <Input value={editPositionForm.seatCode || ''} onChange={(e) => setEditPositionForm(p => ({ ...p, seatCode: e.target.value }))} placeholder="e.g. SEAT-001" className="font-mono" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Max Headcount</Label>
                                                <Input type="number" value={editPositionForm.maxHeadcount ?? 1} onChange={(e) => setEditPositionForm(p => ({ ...p, maxHeadcount: parseInt(e.target.value) || 1 }))} min={1} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Budget Approved</Label>
                                                <Select value={editPositionForm.isBudgetApproved ? 'true' : 'false'} onValueChange={(v) => setEditPositionForm(p => ({ ...p, isBudgetApproved: v === 'true' }))}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">Yes</SelectItem>
                                                        <SelectItem value="false">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Status</Label>
                                                <Select value={editPositionForm.isActive ? 'true' : 'false'} onValueChange={(v) => setEditPositionForm(p => ({ ...p, isActive: v === 'true' }))}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">Active</SelectItem>
                                                        <SelectItem value="false">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2" ref={reportingToRef}>
                                            <Label>Reports To (Position)</Label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input value={reportingToSearch} onChange={(e) => setReportingToSearch(e.target.value)} onFocus={() => setReportingToFocused(true)} placeholder="Search positions by seat code or title..." className="pl-9 font-mono text-sm" />
                                            </div>
                                            {editPositionForm.reportingToPositionId && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>Currently: <span className="font-mono font-medium">{reportingToSelectedLabel || editPositionForm.reportingToPositionId}</span></span>
                                                    <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => { setEditPositionForm(p => ({ ...p, reportingToPositionId: undefined, clearReportingTo: true })); setReportingToSelectedLabel(''); }}>Clear</Button>
                                                </div>
                                            )}
                                            {reportingToFocused && reportingToResults.length > 0 && (
                                                <div className="border rounded-lg max-h-32 overflow-y-auto">
                                                    {reportingToResults.filter(p => p.id !== editingPositionId).map(p => (
                                                        <button key={p.id} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2 ${p.id === editPositionForm.reportingToPositionId ? 'bg-primary/5' : ''}`}
                                                            onClick={() => { setEditPositionForm(prev => ({ ...prev, reportingToPositionId: p.id, clearReportingTo: undefined })); setReportingToSelectedLabel(p.seatCode + ' — ' + p.positionTitle); setReportingToSearch(''); setReportingToFocused(false); }}>
                                                            <span className="font-mono text-xs">{p.seatCode}</span>
                                                            <span className="text-muted-foreground">—</span>
                                                            <span>{p.positionTitle}</span>
                                                            {p.id === editPositionForm.reportingToPositionId && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={cancelEditingPosition}>Cancel</Button>
                                        <Button onClick={handleUpdatePosition} disabled={actionLoading} className="gap-1.5">
                                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Create Position Dialog */}
                            <Dialog open={isCreatePositionOpen} onOpenChange={setIsCreatePositionOpen}>
                                <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Create New Seat</DialogTitle>
                                        <DialogDescription>Define a new position seat within this organizational unit.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Position Definition</Label>
                                                <div className="relative" ref={posDefDropdownRef}>
                                                    <div
                                                        className="flex items-center h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                                                        onClick={() => { setPosDefDropdownOpen(!posDefDropdownOpen); setPosDefSearch(''); }}
                                                    >
                                                        <span className={`flex-1 truncate ${posDefSelectedName || positionForm.positionDefinitionId ? '' : 'text-muted-foreground'}`}>
                                                            {posDefSelectedName || 'Select position...'}
                                                        </span>
                                                        {positionForm.positionDefinitionId && (
                                                            <button className="ml-1 p-0.5 hover:bg-muted rounded" onClick={(e) => { e.stopPropagation(); setPositionForm(p => ({ ...p, positionDefinitionId: '' })); setPosDefSelectedName(''); }}>
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
                                                    </div>
                                                    {posDefDropdownOpen && (
                                                        <div className="absolute top-full left-0 w-full mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
                                                            <div className="p-2 border-b">
                                                                <div className="relative">
                                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                                    <Input
                                                                        value={posDefSearch}
                                                                        onChange={(e) => setPosDefSearch(e.target.value)}
                                                                        placeholder="Search by title or code..."
                                                                        className="h-8 pl-8 text-sm"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="max-h-48 overflow-y-auto">
                                                                {posDefResults.length === 0 ? (
                                                                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">No definitions found</div>
                                                                ) : posDefResults.map((def: any) => (
                                                                    <button
                                                                        key={def.id}
                                                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2 ${def.id === positionForm.positionDefinitionId ? 'bg-primary/5' : ''}`}
                                                                        onClick={() => {
                                                                            setPositionForm(p => ({ ...p, positionDefinitionId: def.id }));
                                                                            setPosDefSelectedName(def.title || def.code);
                                                                            setPosDefDropdownOpen(false);
                                                                        }}
                                                                    >
                                                                        <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">{def.code}</code>
                                                                        <span className="truncate">{def.title}</span>
                                                                        {def.id === positionForm.positionDefinitionId && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Seat Code</Label>
                                                <Input value={positionForm.seatCode} onChange={(e) => setPositionForm(p => ({ ...p, seatCode: e.target.value }))} placeholder="e.g. SEAT-001" className="font-mono" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Max Headcount</Label>
                                                <Input type="number" value={positionForm.maxHeadcount ?? 1} onChange={(e) => setPositionForm(p => ({ ...p, maxHeadcount: parseInt(e.target.value) || 1 }))} min={1} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Budget Approved</Label>
                                                <Select value={positionForm.isBudgetApproved ? 'true' : 'false'} onValueChange={(v) => setPositionForm(p => ({ ...p, isBudgetApproved: v === 'true' }))}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">Yes</SelectItem>
                                                        <SelectItem value="false">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2" ref={reportingToRef}>
                                            <Label>Reports To (Position) <span className="text-muted-foreground text-xs">(optional)</span></Label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input value={reportingToSearch} onChange={(e) => setReportingToSearch(e.target.value)} onFocus={() => setReportingToFocused(true)} placeholder="Search positions by seat code or title..." className="pl-9 font-mono text-sm" />
                                            </div>
                                            {positionForm.reportingToPositionId && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>Selected: <span className="font-mono font-medium">{reportingToSelectedLabel || positionForm.reportingToPositionId}</span></span>
                                                    <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => { setPositionForm(p => ({ ...p, reportingToPositionId: undefined })); setReportingToSelectedLabel(''); }}>Clear</Button>
                                                </div>
                                            )}
                                            {reportingToFocused && reportingToResults.length > 0 && (
                                                <div className="border rounded-lg max-h-32 overflow-y-auto">
                                                    {reportingToResults.map(p => (
                                                        <button key={p.id} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2 ${p.id === positionForm.reportingToPositionId ? 'bg-primary/5' : ''}`}
                                                            onClick={() => { setPositionForm(prev => ({ ...prev, reportingToPositionId: p.id })); setReportingToSelectedLabel(p.seatCode + ' — ' + p.positionTitle); setReportingToSearch(''); setReportingToFocused(false); }}>
                                                            <span className="font-mono text-xs">{p.seatCode}</span>
                                                            <span className="text-muted-foreground">—</span>
                                                            <span>{p.positionTitle}</span>
                                                            {p.id === positionForm.reportingToPositionId && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsCreatePositionOpen(false)}>Cancel</Button>
                                        <Button onClick={() => handleCreatePosition()} disabled={actionLoading || !positionForm.positionDefinitionId || !positionForm.seatCode} className="gap-1.5">
                                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                            Create Seat
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Duplicate Position Confirmation Dialog */}
                            <Dialog open={!!duplicateInfo} onOpenChange={(open) => { if (!open) setDuplicateInfo(null); }}>
                                <DialogContent className="sm:max-w-[440px]">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                                            <AlertTriangle className="h-5 w-5" />
                                            Duplicate Position Definition
                                        </DialogTitle>
                                        <DialogDescription>
                                            {duplicateInfo?.message}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <p className="text-sm text-muted-foreground">
                                        You can create a separate seat anyway, or cancel and increase the headcount on an existing seat instead.
                                    </p>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setDuplicateInfo(null)}>Cancel</Button>
                                        <Button onClick={() => handleCreatePosition(true)} disabled={actionLoading} className="gap-1.5">
                                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                            Create Anyway
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Assign Users to Seat Dialog */}
                            <Dialog open={!!assignToSeatId} onOpenChange={(open) => { if (!open) { setAssignToSeatId(null); setAssignSeatSelectedIds([]); setAssignSeatSearch(''); } }}>
                                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> Assign Users to Seat</DialogTitle>
                                        <DialogDescription>Search for members of this organizational unit to assign to the selected seat. You can select multiple users.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-3 py-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search OU members by name or email..."
                                                value={assignSeatSearch}
                                                onChange={(e) => { setAssignSeatSearch(e.target.value); setAssignSeatPage(0); }}
                                                className="pl-9"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            {assignSeatSelectedIds.length > 0 && (
                                                <>
                                                    <Badge variant="secondary">{assignSeatSelectedIds.length} selected</Badge>
                                                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setAssignSeatSelectedIds([])}>Clear</Button>
                                                </>
                                            )}
                                            {(() => {
                                                const p = positions.find(p => p.id === assignToSeatId);
                                                const rem = p ? p.maxHeadcount - p.currentHeadcount : 0;
                                                const left = rem - assignSeatSelectedIds.length;
                                                return <Badge variant={left <= 0 ? "destructive" : "outline"} className="ml-auto">{left} of {rem} slot{rem !== 1 ? 's' : ''} remaining</Badge>;
                                            })()}
                                        </div>
                                        <div className="max-h-64 overflow-y-auto space-y-1">
                                            {assignSeatSearchResults.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">No members found</p>
                                            ) : (
                                                assignSeatSearchResults.map(member => {
                                                    const isSelected = assignSeatSelectedIds.includes(member.userId);
                                                    const pos = positions.find(p => p.id === assignToSeatId);
                                                    const slotsLeft = pos ? pos.maxHeadcount - pos.currentHeadcount - assignSeatSelectedIds.length : 0;
                                                    const isDisabled = !isSelected && slotsLeft <= 0;
                                                    return (
                                                    <button
                                                        key={member.userId}
                                                        disabled={isDisabled}
                                                        onClick={() => {
                                                            if (isDisabled) return;
                                                            setAssignSeatSelectedIds(prev =>
                                                                prev.includes(member.userId)
                                                                    ? prev.filter(id => id !== member.userId)
                                                                    : [...prev, member.userId]
                                                            );
                                                        }}
                                                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-colors text-left ${
                                                            isSelected ? 'bg-primary/10 border-primary/30' : isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/60'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300"
                                                            checked={isSelected}
                                                            disabled={isDisabled}
                                                            readOnly
                                                        />
                                                        <UserAvatar user={{ displayName: member.displayName, imgUrl: member.imageUrl || undefined }} size="sm" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{member.displayName}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                                        </div>
                                                    </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    {/* Assignment Configuration — always visible */}
                                    <div className="border-t pt-3 mt-2 space-y-3">
                                        <p className="text-sm font-medium text-primary flex items-center gap-1.5">
                                            <Settings className="h-3.5 w-3.5" /> Assignment Configuration
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Assignment Type</Label>
                                                <Select value={assignConfigForm.assignmentType} onValueChange={(v) => setAssignConfigForm(f => ({ ...f, assignmentType: v }))}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PERMANENT">Permanent</SelectItem>
                                                        <SelectItem value="ACTING">Acting</SelectItem>
                                                        <SelectItem value="INTERIM">Interim</SelectItem>
                                                        <SelectItem value="SECONDMENT">Secondment</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">FTE %</Label>
                                                <Input type="number" min={0} max={100} value={assignConfigForm.ftePercentage} onChange={(e) => setAssignConfigForm(f => ({ ...f, ftePercentage: Number(e.target.value) }))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Effective From</Label>
                                                <Input type="date" value={assignConfigForm.effectiveFrom} onChange={(e) => setAssignConfigForm(f => ({ ...f, effectiveFrom: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Effective To</Label>
                                                <Input type="date" value={assignConfigForm.effectiveTo} onChange={(e) => setAssignConfigForm(f => ({ ...f, effectiveTo: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="assign-config-primary" checked={assignConfigForm.isPrimary} onChange={(e) => setAssignConfigForm(f => ({ ...f, isPrimary: e.target.checked }))} className="h-4 w-4 rounded" />
                                            <Label htmlFor="assign-config-primary" className="text-sm cursor-pointer">Primary Position</Label>
                                        </div>
                                    </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => { setAssignToSeatId(null); setAssignSeatSelectedIds([]); }}>Cancel</Button>
                                        <Button onClick={handleBatchAssignToSeat} disabled={actionLoading || assignSeatSelectedIds.length === 0} className="gap-1.5">
                                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                            Assign {assignSeatSelectedIds.length > 0 ? `(${assignSeatSelectedIds.length})` : ''}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* ==================== Edit Assignment Dialog ==================== */}
                            <Dialog open={!!editingAssignment} onOpenChange={(open) => { if (!open) setEditingAssignment(null); }}>
                                <DialogContent className="sm:max-w-[450px]">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Edit Assignment</DialogTitle>
                                        <DialogDescription>
                                            Edit the assignment configuration for <strong>{editingAssignment?.userDisplayName}</strong>.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-medium">Assignment Type</Label>
                                                <Select value={editAssignmentForm.assignmentType} onValueChange={(v) => setEditAssignmentForm(f => ({ ...f, assignmentType: v }))}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PERMANENT">Permanent</SelectItem>
                                                        <SelectItem value="ACTING">Acting</SelectItem>
                                                        <SelectItem value="INTERIM">Interim</SelectItem>
                                                        <SelectItem value="SECONDMENT">Secondment</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-medium">FTE %</Label>
                                                <Input type="number" min={0} max={100} value={editAssignmentForm.ftePercentage} onChange={(e) => setEditAssignmentForm(f => ({ ...f, ftePercentage: Number(e.target.value) }))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-medium">Effective From</Label>
                                                <Input type="date" value={editAssignmentForm.effectiveFrom} onChange={(e) => setEditAssignmentForm(f => ({ ...f, effectiveFrom: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-medium">Effective To</Label>
                                                <Input type="date" value={editAssignmentForm.effectiveTo} onChange={(e) => setEditAssignmentForm(f => ({ ...f, effectiveTo: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="edit-assign-primary" checked={editAssignmentForm.isPrimary} onChange={(e) => setEditAssignmentForm(f => ({ ...f, isPrimary: e.target.checked }))} className="h-4 w-4 rounded" />
                                            <Label htmlFor="edit-assign-primary" className="text-sm cursor-pointer">Primary Position</Label>
                                        </div>
                                        {editingAssignment && (
                                            <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t">
                                                <p>Assigned by: {editingAssignment.assignedByDisplayName || '—'}</p>
                                                <p>Created: {new Date(editingAssignment.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setEditingAssignment(null)}>Cancel</Button>
                                        <Button onClick={handleSaveAssignment} disabled={actionLoading} className="gap-1.5">
                                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </TabsContent>

                        {/* ==================== Members Tab ==================== */}
                        <TabsContent value="members" className="mt-0 space-y-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <UsersIcon className="h-4 w-4 text-primary" />
                                            Members ({memberTotalElements || members.length})
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search members..."
                                                    value={memberFilter}
                                                    onChange={(e) => setMemberFilter(e.target.value)}
                                                    className="pl-9 h-8 w-52"
                                                />
                                            </div>
                                            {selectedMemberIds.length > 0 && canAssignUser && (
                                                <Button variant="destructive" size="sm" onClick={handleBatchRemoveMembers} disabled={actionLoading} className="gap-1.5">
                                                    <UserMinus className="h-3.5 w-3.5" />
                                                    Remove ({selectedMemberIds.length})
                                                </Button>
                                            )}
                                            {canAssignUser && (
                                                <Button variant="outline" size="sm" onClick={() => { setIsAddMemberOpen(true); setMemberSearchQuery(''); setSelectedMemberAddIds([]); }} className="gap-1.5">
                                                    <UserPlus className="h-3.5 w-3.5" />
                                                    Add Member
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {members.length === 0 ? (
                                        <div className="text-center py-10">
                                            <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                                            <p className="text-muted-foreground">
                                                {memberFilter ? 'No members match your search' : 'No members in this unit'}
                                            </p>
                                            {!memberFilter && canAssignUser && (
                                                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => { setIsAddMemberOpen(true); setMemberSearchQuery(''); setSelectedMemberAddIds([]); }}>
                                                    <UserPlus className="h-3.5 w-3.5" />
                                                    Add First Member
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {/* Select all checkbox */}
                                            {canAssignUser && members.length > 0 && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
                                                    <input
                                                        type="checkbox"
                                                        className="h-3.5 w-3.5 rounded border-gray-300"
                                                        checked={selectedMemberIds.length === members.length && members.length > 0}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedMemberIds(members.map(m => m.userId));
                                                            } else {
                                                                setSelectedMemberIds([]);
                                                            }
                                                        }}
                                                    />
                                                    <span>Select all on this page</span>
                                                </div>
                                            )}
                                            {members.map(member => (
                                                <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        {canAssignUser && (
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-gray-300"
                                                                checked={selectedMemberIds.includes(member.userId)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedMemberIds(prev => [...prev, member.userId]);
                                                                    } else {
                                                                        setSelectedMemberIds(prev => prev.filter(id => id !== member.userId));
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                        <UserAvatar user={{ displayName: member.displayName, imgUrl: member.imageUrl || undefined }} size="md" />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <Link href={`/admin/users/${member.userId}`} className="font-medium text-sm hover:text-primary hover:underline transition-colors">
                                                                    {member.displayName}
                                                                </Link>
                                                                {member.isPrimary && (
                                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                                                                        Primary
                                                                    </Badge>
                                                                )}
                                                                {detail.headUserId === member.userId && (
                                                                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                                <span>{member.email}</span>
                                                                {member.positionTitle && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Briefcase className="h-3 w-3" />{member.positionTitle}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {canAssignUser && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => handleRemoveMember(member.userId, member.displayName)}
                                                                    disabled={removingMemberId === member.userId}
                                                                >
                                                                    {removingMemberId === member.userId ? (
                                                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                                    ) : (
                                                                        <UserMinus className="h-3.5 w-3.5" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Remove member</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Pagination */}
                                    <Pagination
                                        currentPage={memberPage}
                                        totalPages={memberTotalPages}
                                        totalElements={memberTotalElements}
                                        pageSize={memberPageSize}
                                        onPageChange={(p) => { setMemberPage(p); setSelectedMemberIds([]); }}
                                        onPageSizeChange={(s) => { setMemberPageSize(s); setMemberPage(0); setSelectedMemberIds([]); }}
                                        pageSizeOptions={[5, 10, 20, 50]}
                                    />
                                </CardContent>
                            </Card>

                            {/* Add Member Dialog (server-side search, multi-select) */}
                            <Dialog open={isAddMemberOpen} onOpenChange={(open) => { if (!open) { setIsAddMemberOpen(false); setMemberSearchQuery(''); setSelectedMemberAddIds([]); } }}>
                                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> Add Members</DialogTitle>
                                        <DialogDescription>Search for any user in the system to add to this organizational unit. You can select multiple users.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-3 py-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name or email..."
                                                value={memberSearchQuery}
                                                onChange={(e) => setMemberSearchQuery(e.target.value)}
                                                className="pl-9"
                                                autoFocus
                                            />
                                        </div>
                                        {selectedMemberAddIds.length > 0 && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Badge variant="secondary">{selectedMemberAddIds.length} selected</Badge>
                                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedMemberAddIds([])}>Clear</Button>
                                            </div>
                                        )}
                                        <div className="max-h-64 overflow-y-auto space-y-1">
                                            {memberSearchResults.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    {memberSearchQuery ? 'No users found' : 'Type to search users'}
                                                </p>
                                            ) : (
                                                memberSearchResults
                                                    .filter(u => !members.some(m => m.userId === u.id))
                                                    .map(user => (
                                                        <button
                                                            key={user.id}
                                                            onClick={() => {
                                                                setSelectedMemberAddIds(prev =>
                                                                    prev.includes(user.id)
                                                                        ? prev.filter(id => id !== user.id)
                                                                        : [...prev, user.id]
                                                                );
                                                            }}
                                                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-colors text-left ${
                                                                selectedMemberAddIds.includes(user.id) ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/60'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-gray-300"
                                                                checked={selectedMemberAddIds.includes(user.id)}
                                                                readOnly
                                                            />
                                                            <UserAvatar user={user} size="sm" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                            </div>
                                                        </button>
                                                    ))
                                            )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => { setIsAddMemberOpen(false); setSelectedMemberAddIds([]); }}>Cancel</Button>
                                        <Button onClick={handleBatchAddMembers} disabled={actionLoading || selectedMemberAddIds.length === 0} className="gap-1.5">
                                            {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                            Add {selectedMemberAddIds.length > 0 ? `(${selectedMemberAddIds.length})` : ''}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </TabsContent>

                        <TabsContent value="groups" className="mt-0">
                            <GroupsTab ouId={ouId} canManageGroups={canManageGroups} addNotification={addNotification} />
                        </TabsContent>

                        <TabsContent value="audit" className="mt-0">
                            <AuditTab ouId={ouId} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* ==================== Delete Confirmation Modal ==================== */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                Confirm Delete
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to delete <strong>{detail.name}</strong>?
                                {detail.childCount > 0 && (
                                    <span className="block mt-1 text-destructive">
                                        This unit has {detail.childCount} child unit(s). They must be removed or moved first.
                                    </span>
                                )}
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={actionLoading}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={actionLoading || detail.childCount > 0} className="gap-1.5">
                                    {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ==================== Move Modal ==================== */}
            {isMoveOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <Card className="w-full max-w-lg mx-4 max-h-[70vh] flex flex-col">
                        <CardHeader className="flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Move className="h-4 w-4 text-primary" />
                                    Move "{detail.name}" to...
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => setIsMoveOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search org units..."
                                    value={moveSearchQuery}
                                    onChange={(e) => setMoveSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto pb-0">
                            <MoveTreeView
                                nodes={moveTree}
                                currentOuId={detail.id}
                                selectedId={moveTargetId}
                                onSelect={setMoveTargetId}
                                searchQuery={moveSearchQuery}
                            />
                        </CardContent>
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <Button variant="outline" onClick={() => setIsMoveOpen(false)}>Cancel</Button>
                            <Button onClick={handleMove} disabled={!moveTargetId || actionLoading} className="gap-1.5">
                                {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                Move Here
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

// ==================== Move Tree View Component ====================

function MoveTreeView({
    nodes,
    currentOuId,
    selectedId,
    onSelect,
    searchQuery,
    level = 0,
}: {
    nodes: OrgUnitTreeResponse[];
    currentOuId: string;
    selectedId: string | null;
    onSelect: (id: string) => void;
    searchQuery: string;
    level?: number;
}) {
    return (
        <div className="space-y-0.5">
            {nodes
                .filter(n => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    const matches = n.name.toLowerCase().includes(q) || n.code.toLowerCase().includes(q);
                    const childMatches = n.children?.some(c =>
                        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
                    );
                    return matches || childMatches;
                })
                .map(node => {
                    const isDisabled = node.id === currentOuId;
                    const isSelected = selectedId === node.id;
                    const typeColorClass = node.typeColor || 'bg-slate-100 text-slate-800 border-slate-200';
                    const typeName = node.typeName || 'Unknown Type';

                    return (
                        <div key={node.id}>
                            <button
                                onClick={() => !isDisabled && onSelect(node.id)}
                                disabled={isDisabled}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all
                                    ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/60'}
                                    ${isSelected ? 'bg-primary/10 border border-primary/30 shadow-sm' : 'border border-transparent'}
                                `}
                                style={{ paddingLeft: `${level * 20 + 12}px` }}
                            >
                                <div className={`h-6 w-6 rounded flex items-center justify-center flex-shrink-0 ${typeColorClass}`}>
                                    <Building2 className="h-3 w-3" />
                                </div>
                                <span className="text-sm font-medium truncate">{node.name}</span>
                                <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 ml-auto ${typeColorClass}`}>
                                    {typeName}
                                </Badge>
                                {isDisabled && (
                                    <span className="text-xs text-muted-foreground">(current)</span>
                                )}
                            </button>
                            {node.children && node.children.length > 0 && (
                                <MoveTreeView
                                    nodes={node.children}
                                    currentOuId={currentOuId}
                                    selectedId={selectedId}
                                    onSelect={onSelect}
                                    searchQuery={searchQuery}
                                    level={level + 1}
                                />
                            )}
                        </div>
                    );
                })}
        </div>
    );
}
