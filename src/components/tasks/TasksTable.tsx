import React, { useState, useEffect } from 'react';
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
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { WorkflowStepInstanceResponse } from '@/types/api';
import { formatDate } from '@/lib/dateFormatter';
import { Loader2, Search, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TasksTable() {
    const router = useRouter();
    const [tasks, setTasks] = useState<WorkflowStepInstanceResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const [priority, setPriority] = useState<string>('all');
    const pageSize = 10;

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await workflowAdminService.getActiveSteps(
                page,
                pageSize,
                search,
                priority
            );
            setTasks(response.content);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [page, search, priority]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(0); // Reset to first page on search
    };

    const handlePriorityChange = (value: string) => {
        setPriority(value);
        setPage(0);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH':
                return 'bg-red-100 text-red-800 hover:bg-red-200';
            case 'MEDIUM':
                return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
            case 'LOW':
                return 'bg-green-100 text-green-800 hover:bg-green-200';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const isOverdue = (dueDate?: string) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks or documents..."
                        value={search}
                        onChange={handleSearch}
                        className="pl-8"
                    />
                </div>
                <Select value={priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Priority</TableHead>
                            <TableHead>Task Name</TableHead>
                            <TableHead>Document</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Assigned Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span>Loading tasks...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : tasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No active tasks found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                getPriorityColor('MEDIUM')
                                            )}
                                        >
                                            {'MEDIUM'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {task.nodeName}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {task.documentTitle || `Document #${task.documentId}`}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {task.dueDate ? (
                                            <div className={cn("flex items-center gap-2", isOverdue(task.dueDate) ? "text-red-600 font-medium" : "")}>
                                                <Clock className="h-4 w-4" />
                                                {formatDate(task.dueDate)}
                                                {isOverdue(task.dueDate) && (
                                                    <AlertCircle className="h-4 w-4" />
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {task.startedAt ? formatDate(task.startedAt) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            onClick={() => router.push(`/admin/workflow/instance/${task.workflowInstanceId}`)}
                                        >
                                            Open
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <PaginationItem key={i}>
                                <PaginationLink
                                    isActive={page === i}
                                    onClick={() => setPage(i)}
                                    className="cursor-pointer"
                                >
                                    {i + 1}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                className={page === totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}
