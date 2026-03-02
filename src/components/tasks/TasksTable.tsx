'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { WorkflowNodeInstanceResponse } from '@/types/workflow';
import { formatDate } from '@/lib/dateFormatter';
import UserAvatar from '@/components/main/UserAvatar';
import {
    Loader2,
    Search,
    ArrowRight,
    AlertCircle,
    Clock,
    Check,
    X,
    Eye,
    FileText,
    FolderOpen,
    Info,
    RefreshCw,
    UserCheck,
    FileSearch,
    ClipboardCheck,
    Zap,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Workflow,
    ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NODE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    APPROVAL: { label: 'Approval', icon: <UserCheck className="w-3 h-3" />, className: 'bg-blue-50 text-blue-700 border-blue-200' },
    REVIEW: { label: 'Review', icon: <FileSearch className="w-3 h-3" />, className: 'bg-purple-50 text-purple-700 border-purple-200' },
    MANUAL_TASK: { label: 'Task', icon: <ClipboardCheck className="w-3 h-3" />, className: 'bg-amber-50 text-amber-700 border-amber-200' },
    MULTI_CHOICE: { label: 'Decision', icon: <Zap className="w-3 h-3" />, className: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const getNodeTypeConfig = (type?: string) =>
    NODE_TYPE_CONFIG[type || ''] || { label: type || 'Task', icon: <FileText className="w-3 h-3" />, className: 'bg-gray-50 text-gray-700 border-gray-200' };

export function TasksTable() {
    const router = useRouter();
    const [allTasks, setAllTasks] = useState<WorkflowNodeInstanceResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [workflowFilter, setWorkflowFilter] = useState<string>('all');
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [page, setPage] = useState(0);
    const pageSize = 10;
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchTasks = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const response = await workflowAdminService.getPendingNodes();
            setAllTasks(response);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Auto-refresh every 10s
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            fetchTasks(true);
        }, 10000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchTasks]);

    // Filter tasks
    const filteredTasks = allTasks.filter(task => {
        const matchesSearch = search === '' ||
            task.nodeName?.toLowerCase().includes(search.toLowerCase()) ||
            task.documentTitle?.toLowerCase().includes(search.toLowerCase()) ||
            task.workflowName?.toLowerCase().includes(search.toLowerCase()) ||
            task.description?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'overdue' && task.isOverdue) ||
            (statusFilter !== 'overdue' && task.status === statusFilter);

        const matchesType = typeFilter === 'all' || task.nodeType === typeFilter;

        const matchesWorkflow = workflowFilter === 'all' ||
            task.workflowId === Number(workflowFilter);

        return matchesSearch && matchesStatus && matchesType && matchesWorkflow;
    });

    // Pagination
    const totalPages = Math.ceil(filteredTasks.length / pageSize);
    const paginatedTasks = filteredTasks.slice(page * pageSize, (page + 1) * pageSize);

    // Reset page when filters change
    useEffect(() => {
        setPage(0);
    }, [search, statusFilter, typeFilter, workflowFilter]);

    const handleQuickApprove = async (e: React.MouseEvent, task: WorkflowNodeInstanceResponse) => {
        e.stopPropagation();
        if (!task.id) return;
        try {
            setActionLoading(task.id);
            await workflowAdminService.completeNode(task.id, { comment: 'Approved from tasks page' });
            await fetchTasks(true);
        } catch (error) {
            console.error('Error approving task:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleQuickReject = async (e: React.MouseEvent, task: WorkflowNodeInstanceResponse) => {
        e.stopPropagation();
        if (!task.id) return;
        const reason = window.prompt('Please enter rejection reason:');
        if (!reason) return;
        try {
            setActionLoading(task.id);
            await workflowAdminService.rejectNode(task.id, { rejectionReason: reason });
            await fetchTasks(true);
        } catch (error) {
            console.error('Error rejecting task:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const navigateToDocument = (task: WorkflowNodeInstanceResponse) => {
        if (task.documentId) {
            router.push(`/documents/${task.documentId}?tab=workflows`);
        }
    };

    // Stats
    const stats = {
        total: allTasks.length,
        overdue: allTasks.filter(t => t.isOverdue).length,
        approvals: allTasks.filter(t => t.nodeType === 'APPROVAL').length,
        reviews: allTasks.filter(t => t.nodeType === 'REVIEW').length,
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Stats bar */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="gap-1 font-normal">
                            <ListTodo className="w-3 h-3" />
                            {stats.total} total
                        </Badge>
                        {stats.overdue > 0 && (
                            <Badge variant="destructive" className="gap-1 font-normal">
                                <AlertCircle className="w-3 h-3" />
                                {stats.overdue} overdue
                            </Badge>
                        )}
                        <Badge variant="outline" className="gap-1 font-normal bg-blue-50 text-blue-700 border-blue-200">
                            <UserCheck className="w-3 h-3" />
                            {stats.approvals} approvals
                        </Badge>
                        <Badge variant="outline" className="gap-1 font-normal bg-purple-50 text-purple-700 border-purple-200">
                            <FileSearch className="w-3 h-3" />
                            {stats.reviews} reviews
                        </Badge>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {refreshing && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                        <span className="text-xs text-muted-foreground">Auto-refreshing</span>
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => fetchTasks(true)} disabled={refreshing}>
                            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks, documents, instructions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="APPROVAL">Approval</SelectItem>
                            <SelectItem value="REVIEW">Review</SelectItem>
                            <SelectItem value="MANUAL_TASK">Task</SelectItem>
                            <SelectItem value="MULTI_CHOICE">Decision</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Workflow" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Workflows</SelectItem>
                            {Array.from(new Set(allTasks.map(t => t.workflowId)))
                                .filter(Boolean)
                                .map(id => {
                                    const task = allTasks.find(t => t.workflowId === id);
                                    return (
                                        <SelectItem key={id} value={id!.toString()}>
                                            {task?.workflowName || 'Unknown'}
                                        </SelectItem>
                                    );
                                })}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="w-[100px]">Type</TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Document</TableHead>
                                <TableHead className="hidden lg:table-cell">Workflow</TableHead>
                                <TableHead className="hidden xl:table-cell">Instructions</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="hidden md:table-cell">Assigned</TableHead>
                                <TableHead className="hidden lg:table-cell">Assignees</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            <span>Loading tasks...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedTasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                                <ListTodo className="h-6 w-6 text-blue-400" />
                                            </div>
                                            <p className="font-medium">
                                                {allTasks.length === 0 ? 'No pending tasks' : 'No matching tasks'}
                                            </p>
                                            <p className="text-xs">
                                                {allTasks.length === 0
                                                    ? "You're all caught up! New tasks will appear automatically."
                                                    : "Try adjusting your filters"}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTasks.map((task) => {
                                    const nodeConfig = getNodeTypeConfig(task.nodeType);
                                    return (
                                        <TableRow
                                            key={task.id}
                                            className={cn(
                                                "cursor-pointer hover:bg-muted/50 transition-colors",
                                                task.isOverdue && "bg-red-50/50 dark:bg-red-950/10"
                                            )}
                                            onClick={() => navigateToDocument(task)}
                                        >
                                            {/* Type */}
                                            <TableCell>
                                                <Badge variant="outline" className={`${nodeConfig.className} text-[10px] px-1.5 py-0.5 gap-0.5`}>
                                                    {nodeConfig.icon}
                                                    <span className="ml-0.5">{nodeConfig.label}</span>
                                                </Badge>
                                            </TableCell>

                                            {/* Task Name */}
                                            <TableCell>
                                                <div className="font-medium text-sm">{task.nodeName || 'Unknown Step'}</div>
                                                {task.isOverdue && (
                                                    <Badge variant="destructive" className="mt-0.5 text-[10px] px-1 py-0 gap-0.5">
                                                        <AlertCircle className="w-2.5 h-2.5" />
                                                        Overdue
                                                    </Badge>
                                                )}
                                            </TableCell>

                                            {/* Document */}
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                                    <span className="truncate max-w-[200px]">{task.documentTitle || `#${task.documentId}`}</span>
                                                </div>
                                                {task.document?.folderName && (
                                                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                                                        <FolderOpen className="h-3 w-3" />
                                                        <span className="truncate max-w-[180px]">{task.document.folderName}</span>
                                                    </div>
                                                )}
                                            </TableCell>

                                            {/* Workflow */}
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <Workflow className="h-3.5 w-3.5 flex-shrink-0" />
                                                    <span className="truncate max-w-[150px]">{task.workflowName || 'Unknown'}</span>
                                                </div>
                                            </TableCell>

                                            {/* Instructions */}
                                            <TableCell className="hidden xl:table-cell">
                                                {task.description ? (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-start gap-1 max-w-[200px]">
                                                                <Info className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                                                                <span className="text-xs text-muted-foreground line-clamp-2">{task.description}</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-sm">
                                                            <p className="text-xs">{task.description}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </TableCell>

                                            {/* Due Date */}
                                            <TableCell>
                                                {task.dueDate ? (
                                                    <div className={cn(
                                                        "flex items-center gap-1 text-xs",
                                                        task.isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
                                                    )}>
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {formatDate(task.dueDate)}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </TableCell>

                                            {/* Assigned Date */}
                                            <TableCell className="hidden md:table-cell">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {task.startedAt ? formatDate(task.startedAt) : '—'}
                                                </div>
                                            </TableCell>

                                            {/* Assignees */}
                                            <TableCell className="hidden lg:table-cell">
                                                {task.assignments && task.assignments.length > 0 ? (
                                                    <div className="flex -space-x-1.5">
                                                        {task.assignments.slice(0, 3).map((a) => (
                                                            <Tooltip key={a.id}>
                                                                <TooltipTrigger asChild>
                                                                    <div>
                                                                        <UserAvatar
                                                                            user={a.user ? {
                                                                                id: a.user.id,
                                                                                username: a.user.username,
                                                                                email: a.user.email,
                                                                                firstName: a.user.firstName,
                                                                                lastName: a.user.lastName,
                                                                                displayName: a.user.displayName,
                                                                                imgUrl: a.user.imgUrl,
                                                                                imageUrl: a.user.imageUrl,
                                                                            } : null}
                                                                            size="xs"
                                                                        />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {a.assigneeName || a.user?.displayName || 'Unknown'}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ))}
                                                        {task.assignments.length > 3 && (
                                                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border-2 border-background">
                                                                +{task.assignments.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {(task.nodeType === 'APPROVAL' || task.nodeType === 'REVIEW') && (
                                                        <>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                        onClick={(e) => handleQuickApprove(e, task)}
                                                                        disabled={actionLoading === task.id}
                                                                    >
                                                                        {actionLoading === task.id ? (
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        ) : (
                                                                            <Check className="h-3.5 w-3.5" />
                                                                        )}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Approve</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                        onClick={(e) => handleQuickReject(e, task)}
                                                                        disabled={actionLoading === task.id}
                                                                    >
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Reject</TooltipContent>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2 text-xs gap-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigateToDocument(task);
                                                        }}
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                        View
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredTasks.length)} of {filteredTasks.length} tasks
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 7) {
                                    pageNum = i;
                                } else if (page < 3) {
                                    pageNum = i;
                                } else if (page > totalPages - 4) {
                                    pageNum = totalPages - 7 + i;
                                } else {
                                    pageNum = page - 3 + i;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={page === pageNum ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 w-8 p-0 text-xs"
                                        onClick={() => setPage(pageNum)}
                                    >
                                        {pageNum + 1}
                                    </Button>
                                );
                            })}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page === totalPages - 1}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
