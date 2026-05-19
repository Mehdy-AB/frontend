// app/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  Folder,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
  Check,
  X,
  Eye,
  Calendar,
  RefreshCw,
  Loader2,
  FolderOpen,
  Workflow,
  UserCheck,
  FileSearch,
  ClipboardCheck,
  Zap,
  ListTodo,
  ArrowRight,
  Globe,
  TrendingUp,
  HardDrive,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '../contexts/LanguageContext';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { dashboardService, DashboardStats } from '@/api/services/dashboardService';
import { WorkflowNodeInstanceResponse } from '@/types/workflow';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/dateFormatter';
import { cn } from '@/lib/utils';

const NODE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  APPROVAL: { label: 'Approval', icon: <UserCheck className="w-3 h-3" />, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  REVIEW: { label: 'Review', icon: <FileSearch className="w-3 h-3" />, className: 'bg-purple-50 text-purple-700 border-purple-200' },
  MANUAL_TASK: { label: 'Task', icon: <ClipboardCheck className="w-3 h-3" />, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  MULTI_CHOICE: { label: 'Decision', icon: <Zap className="w-3 h-3" />, className: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const getNodeTypeConfig = (type?: string) =>
  NODE_TYPE_CONFIG[type || ''] || { label: type || 'Task', icon: <FileText className="w-3 h-3" />, className: 'bg-gray-50 text-gray-700 border-gray-200' };

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function Dashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const [pendingTasks, setPendingTasks] = useState<WorkflowNodeInstanceResponse[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadTasks = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingTasks(true);
      else setRefreshing(true);
      const tasks = await workflowAdminService.getPendingNodes();
      setPendingTasks(tasks);
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
    } finally {
      setLoadingTasks(false);
      setRefreshing(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadStats();
  }, [loadTasks, loadStats]);

  // Auto-refresh tasks every 10 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => loadTasks(true), 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadTasks]);

  const filteredTasks = pendingTasks.filter(task => {
    const matchesSearch = searchQuery === '' ||
      task.nodeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.documentTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.workflowName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || task.nodeType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleTaskClick = (task: WorkflowNodeInstanceResponse) => {
    if (task.documentId) {
      router.push(`/documents/${task.documentId}?tab=workflows`);
    }
  };

  const handleQuickApprove = async (e: React.MouseEvent, task: WorkflowNodeInstanceResponse) => {
    e.stopPropagation();
    if (!task.id) return;
    try {
      setActionLoading(task.id);
      await workflowAdminService.completeNode(task.id, { comment: 'Approved from dashboard' });
      await loadTasks(true);
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
      await loadTasks(true);
    } catch (error) {
      console.error('Error rejecting task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    {
      label: t('dashboard.totalDocuments'),
      value: stats?.totalDocuments ?? '—',
      icon: FileText,
      gradient: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: t('common.folders'),
      value: stats?.totalFolders ?? '—',
      icon: Folder,
      gradient: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Active Users',
      value: stats?.activeUsers ?? '—',
      icon: Users,
      gradient: 'from-violet-500 to-violet-600',
      bgLight: 'bg-violet-50',
      textColor: 'text-violet-600',
    },
    {
      label: 'Workspaces',
      value: stats?.totalWorkspaces ?? '—',
      icon: Globe,
      gradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{t('dashboard.welcome')}</h1>
            <p className="text-muted-foreground">{t('dashboard.whatsHappening')}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { loadStats(); loadTasks(true); }}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid — Live data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
                    ) : (
                      <p className="text-3xl font-bold tracking-tight">
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      </p>
                    )}
                  </div>
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Two-column layout: Tasks + Recent Documents */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Pending Workflow Tasks — Takes 3 columns */}
          <Card className="xl:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Pending Workflow Tasks ({pendingTasks.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  {refreshing && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                  <span className="text-xs text-muted-foreground hidden md:inline">Auto-refresh 10s</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => router.push('/tasks')}
                  >
                    View All
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks, documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
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
              </div>

              {/* Tasks Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[90px]">Type</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead className="hidden lg:table-cell">Workflow</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="hidden md:table-cell">Assigned</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTasks ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                              <ListTodo className="h-7 w-7 text-blue-400" />
                            </div>
                            <p className="font-medium text-foreground">
                              {pendingTasks.length === 0 ? 'No pending tasks' : 'No matching tasks'}
                            </p>
                            <p className="text-xs max-w-sm">
                              {pendingTasks.length === 0
                                ? "You're all caught up! New tasks will appear here automatically."
                                : "Try adjusting your filters to see more tasks"}
                            </p>
                            {pendingTasks.length === 0 && (
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <RefreshCw className="w-3 h-3" />
                                <span>Checking for new tasks every 10 seconds</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.slice(0, 10).map((task) => {
                        const nodeConfig = getNodeTypeConfig(task.nodeType);
                        return (
                          <TableRow
                            key={task.id}
                            className={cn(
                              "cursor-pointer hover:bg-muted/50 transition-colors",
                              task.isOverdue && "bg-red-50/50 dark:bg-red-950/10"
                            )}
                            onClick={() => handleTaskClick(task)}
                          >
                            <TableCell>
                              <Badge variant="outline" className={`${nodeConfig.className} text-[10px] px-1.5 py-0.5 gap-0.5`}>
                                {nodeConfig.icon}
                                <span className="ml-0.5">{nodeConfig.label}</span>
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="font-medium text-sm">{task.nodeName || 'Unknown Task'}</div>
                              {task.isOverdue && (
                                <Badge variant="destructive" className="mt-0.5 text-[10px] px-1 py-0 gap-0.5">
                                  <AlertCircle className="w-2.5 h-2.5" />
                                  Overdue
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="truncate max-w-[180px]">{task.documentTitle || `#${task.documentId}`}</span>
                              </div>
                              {task.document?.folderName && (
                                <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                                  <FolderOpen className="h-3 w-3" />
                                  <span className="truncate max-w-[160px]">{task.document.folderName}</span>
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="hidden lg:table-cell">
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Workflow className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate max-w-[130px]">{task.workflowName || 'Unknown'}</span>
                              </div>
                            </TableCell>

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

                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {task.startedAt ? formatDate(task.startedAt) : '—'}
                              </div>
                            </TableCell>

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
                                    handleTaskClick(task);
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

              {/* "View all" link if more than 10 */}
              {filteredTasks.length > 10 && (
                <div className="text-center pt-2">
                  <Button variant="link" size="sm" onClick={() => router.push('/tasks')} className="gap-1">
                    View all {filteredTasks.length} tasks
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Documents — Takes 2 columns */}
          <Card className="xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Recent Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 animate-pulse">
                      <div className="h-9 w-9 bg-gray-200 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !stats?.recentDocuments?.length ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <FileText className="h-8 w-8 text-gray-300" />
                  <p className="text-sm">No documents yet</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {stats.recentDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                      onClick={() => router.push(`/documents/${doc.id}`)}
                    >
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {doc.folderName && (
                            <>
                              <FolderOpen className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate max-w-[100px]">{doc.folderName}</span>
                              <span>·</span>
                            </>
                          )}
                          <span>{formatFileSize(doc.size)}</span>
                          {doc.createdByName && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[80px]">{doc.createdByName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}