'use client';

import { useState, useEffect } from 'react';
import {
    History, Clock, User, ArrowRight, FileText,
    Activity, CheckCircle, XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { WorkflowHistoryResponse } from '@/types/api';
import UserAvatar from '@/components/main/UserAvatar';
import Pagination from '@/components/main/Pagination';
import { useNotifications } from '@/hooks/useNotifications';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface HistoryTabProps {
    workflowId: number;
}

export default function HistoryTab({ workflowId }: HistoryTabProps) {
    const { showError } = useNotifications();
    const [history, setHistory] = useState<WorkflowHistoryResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        loadHistory();
    }, [workflowId, page, pageSize]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const response = await workflowAdminService.getWorkflowHistory(
                workflowId,
                page,
                pageSize
            );
            setHistory(response.content);
            setTotalElements(response.totalElements);
            setTotalPages(response.totalPages);
        } catch (error) {
            showError('Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('COMPLETED') || action.includes('APPROVED')) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
        if (action.includes('REJECTED') || action.includes('FAILED')) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
        if (action.includes('CANCELLED')) return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ');
    };

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Node / Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Loading history...
                                </TableCell>
                            </TableRow>
                        ) : history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                    No history records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell className="whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {format(new Date(entry.performedAt), 'MMM d, HH:mm')}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatDistanceToNow(new Date(entry.performedAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {entry.performedBy ? (
                                            <div className="flex items-center gap-2">
                                                <UserAvatar
                                                    user={entry.performedBy}
                                                    size="sm"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{entry.performedBy.displayName}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {entry.performedBy.jobTitle || 'User'}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <Activity className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <span className="text-sm text-gray-500">System</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("font-medium border-0", getActionColor(entry.action))}>
                                            {formatAction(entry.action)}
                                        </Badge>
                                        {entry.comment && (
                                            <p className="text-sm text-gray-600 mt-1 italic">
                                                "{entry.comment}"
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {entry.nodeId ? (
                                            <Badge variant="secondary" className="font-normal">
                                                Node: {entry.nodeId}
                                            </Badge>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                        {/* Add status transition if available in future */}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <div className="p-4 border-t">
                    <Pagination
                        currentPage={page + 1}
                        totalPages={totalPages}
                        totalElements={totalElements}
                        pageSize={pageSize}
                        onPageChange={(p) => setPage(p - 1)}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            </div>
        </div>
    );
}
