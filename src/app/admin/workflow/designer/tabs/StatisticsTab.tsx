'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
    Activity, CheckCircle, XCircle, Clock, AlertTriangle,
    FileText, Users, PauseCircle
} from 'lucide-react';
import { workflowAdminService, WorkflowStatisticsResponse } from '@/api/services/workflowAdminService';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatisticsTabProps {
    workflowId: number;
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#6b7280'];

export default function StatisticsTab({ workflowId }: StatisticsTabProps) {
    const { showError } = useNotifications();
    const [stats, setStats] = useState<WorkflowStatisticsResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadStatistics();
    }, [workflowId]);

    const loadStatistics = async () => {
        setLoading(true);
        try {
            const data = await workflowAdminService.getWorkflowStatistics(workflowId);
            setStats(data);
        } catch (error) {
            showError('Failed to load workflow statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>;
    }

    if (!stats) return null;

    const statusData = [
        { name: 'Active', value: stats.activeInstances, color: '#3b82f6' },
        { name: 'Completed', value: stats.completedInstances, color: '#10b981' },
        { name: 'Failed', value: stats.failedInstances, color: '#ef4444' },
        { name: 'Cancelled', value: stats.cancelledInstances, color: '#6b7280' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Instances</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalInstances}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all versions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.completionRate ? `${stats.completionRate.toFixed(1)}%` : '0%'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Successful completions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.avgCompletionTimeMinutes
                                ? `${Math.round(stats.avgCompletionTimeMinutes / 60)}h ${Math.round(stats.avgCompletionTimeMinutes % 60)}m`
                                : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Start to finish
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalInstances > 0
                                ? `${((stats.failedInstances / stats.totalInstances) * 100).toFixed(1)}%`
                                : '0%'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.failedInstances} failed instances
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Instance Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                No data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Performance Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col justify-center gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Active Now</span>
                                <span className="font-bold">{stats.activeInstances}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (stats.activeInstances / Math.max(1, stats.totalInstances)) * 100)}%` }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Cancelled</span>
                                <span className="font-bold">{stats.cancelledInstances}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-500" style={{ width: `${Math.min(100, (stats.cancelledInstances / Math.max(1, stats.totalInstances)) * 100)}%` }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Completed</span>
                                <span className="font-bold">{stats.completedInstances}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: `${Math.min(100, (stats.completedInstances / Math.max(1, stats.totalInstances)) * 100)}%` }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
