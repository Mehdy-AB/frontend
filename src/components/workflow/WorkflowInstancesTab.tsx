import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Calendar, User, Search, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { WorkflowInstanceResponse } from '@/types/api';
import { formatDate } from '@/lib/dateFormatter';
import { useNotifications } from '@/hooks/useNotifications';
import UserAvatar from '@/components/main/UserAvatar';

interface WorkflowInstancesTabProps {
    workflowId: number;
}

export default function WorkflowInstancesTab({ workflowId }: WorkflowInstancesTabProps) {
    const router = useRouter();
    const { showError } = useNotifications();
    const [instances, setInstances] = useState<WorkflowInstanceResponse[]>([]);
    const [filteredInstances, setFilteredInstances] = useState<WorkflowInstanceResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const pageSize = 10;

    const loadInstances = async () => {
        try {
            setLoading(true);
            const response = await workflowAdminService.getWorkflowInstances(
                workflowId,
                page,
                pageSize,
                searchTerm,
                statusFilter
            );
            setInstances(response.content);
            setFilteredInstances(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (error) {
            console.error('Error loading instances:', error);
            showError('Error', 'Failed to load workflow instances');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInstances();
    }, [workflowId, page, statusFilter]);

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (page !== 0) {
                setPage(0);
            } else {
                loadInstances();
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'default';
            case 'COMPLETED':
                return 'success';
            case 'CANCELLED':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const handleRowClick = (instanceId: number) => {
        router.push(`/admin/workflow/instance/${instanceId}`);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg font-medium">Workflow Instances</CardTitle>
                            <Badge variant="outline">{filteredInstances.length} of {totalElements}</Badge>
                        </div>

                        {/* Search and Filter Controls */}
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by document name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredInstances.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            {instances.length === 0 ? (
                                <>
                                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No instances found for this workflow.</p>
                                </>
                            ) : (
                                <>
                                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No instances match your filters.</p>
                                    <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {filteredInstances.map((instance) => (
                                    <div
                                        key={instance.id}
                                        onClick={() => handleRowClick(instance.id)}
                                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left Section - Document Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-base truncate">
                                                            {instance.document.name}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Instance #{instance.id}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Document Details */}
                                                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-muted-foreground">Started:</span>
                                                        <span className="font-medium">{formatDate(instance.startedAt)}</span>
                                                    </div>
                                                    {instance.completedAt && (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-muted-foreground">Completed:</span>
                                                            <span className="font-medium">{formatDate(instance.completedAt)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Section - Status & User */}
                                            <div className="flex flex-col items-end gap-3">
                                                <Badge variant={getStatusColor(instance.status) as any} className="text-xs">
                                                    {instance.status}
                                                </Badge>

                                                {/* Current Step */}
                                                {instance.currentNodeLabel && (
                                                    <div className="text-sm text-right">
                                                        <p className="text-muted-foreground text-xs">Current Step</p>
                                                        <p className="font-medium">{instance.currentNodeLabel}</p>
                                                    </div>
                                                )}

                                                {/* Started By User */}
                                                {instance.startedBy && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-right text-xs">
                                                            <p className="text-muted-foreground">Started by</p>
                                                            <p className="font-medium">
                                                                {instance.startedBy.displayName || instance.startedBy.username}
                                                            </p>
                                                        </div>
                                                        <UserAvatar user={instance.startedBy} size="sm" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-3 pt-3 border-t">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                                <span>Progress</span>
                                                <span>{instance.completedNodesCount} / {instance.totalNodesCount} nodes</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${instance.totalNodesCount > 0
                                                            ? (instance.completedNodesCount / instance.totalNodesCount * 100)
                                                            : 0}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-4 flex justify-center">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                                    className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                />
                                            </PaginationItem>

                                            <span className="flex items-center px-4 text-sm text-muted-foreground">
                                                Page {page + 1} of {totalPages}
                                            </span>

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                                    className={page === totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
