'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import {
    Activity, CheckCircle, XCircle, Clock, AlertTriangle,
    FileText, Users, PauseCircle, TrendingUp, TrendingDown,
    RefreshCw, BarChart3, Timer, Target, Zap
} from 'lucide-react';
import { workflowAdminService, WorkflowStatisticsResponse } from '@/api/services/workflowAdminService';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StatisticsTabProps {
    workflowId: number;
}

const COLORS = {
    active: '#3b82f6',
    completed: '#10b981',
    failed: '#ef4444',
    cancelled: '#6b7280',
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="font-medium text-gray-900">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

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

    const formatDuration = (minutes: number | undefined) => {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="animate-pulse bg-white border-gray-200">
                            <CardHeader className="pb-2">
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                                <div className="h-3 bg-gray-100 rounded w-32"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const statusData = [
        { name: 'Active', value: stats.activeInstances, color: COLORS.active },
        { name: 'Completed', value: stats.completedInstances, color: COLORS.completed },
        { name: 'Failed', value: stats.failedInstances, color: COLORS.failed },
        { name: 'Cancelled', value: stats.cancelledInstances, color: COLORS.cancelled },
    ].filter(d => d.value > 0);

    const completionRate = stats.completionRate || 0;
    const failureRate = stats.totalInstances > 0
        ? (stats.failedInstances / stats.totalInstances) * 100
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Workflow Statistics</h3>
                        <p className="text-sm text-gray-500">Real-time performance metrics</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => loadStatistics()} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Instances */}
                <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Instances</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{stats.totalInstances}</div>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.activeInstances} currently active
                        </p>
                    </CardContent>
                </Card>

                {/* Completion Rate */}
                <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Target className="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900">
                                {completionRate.toFixed(1)}%
                            </span>
                            {completionRate >= 80 ? (
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            ) : completionRate < 50 ? (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : null}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.completedInstances} / {stats.totalInstances} completed
                        </p>
                    </CardContent>
                </Card>

                {/* Avg Time */}
                <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Avg. Completion Time</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Timer className="h-4 w-4 text-amber-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">
                            {formatDuration(stats.avgCompletionTimeMinutes)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            From start to finish
                        </p>
                    </CardContent>
                </Card>

                {/* Failure Rate */}
                <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Failure Rate</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className={cn(
                                "text-3xl font-bold",
                                failureRate > 10 ? "text-red-600" : "text-gray-900"
                            )}>
                                {failureRate.toFixed(1)}%
                            </span>
                            {failureRate > 10 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.failedInstances} failed instances
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">Status Distribution</CardTitle>
                        <CardDescription className="text-gray-500">Current breakdown of all instances</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value) => (
                                            <span className="text-sm text-gray-600">{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <PauseCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No data available yet</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Breakdown Bars */}
                <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">Performance Breakdown</CardTitle>
                        <CardDescription className="text-gray-500">Detailed status metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Active */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                                    <span className="text-gray-700">Active</span>
                                </div>
                                <span className="font-semibold text-gray-900">{stats.activeInstances}</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (stats.activeInstances / Math.max(1, stats.totalInstances)) * 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Completed */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                    <span className="text-gray-700">Completed</span>
                                </div>
                                <span className="font-semibold text-gray-900">{stats.completedInstances}</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (stats.completedInstances / Math.max(1, stats.totalInstances)) * 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Failed */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500" />
                                    <span className="text-gray-700">Failed</span>
                                </div>
                                <span className="font-semibold text-gray-900">{stats.failedInstances}</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (stats.failedInstances / Math.max(1, stats.totalInstances)) * 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Cancelled */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-gray-500" />
                                    <span className="text-gray-700">Cancelled</span>
                                </div>
                                <span className="font-semibold text-gray-900">{stats.cancelledInstances}</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gray-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (stats.cancelledInstances / Math.max(1, stats.totalInstances)) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Active Rate</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {stats.totalInstances > 0
                                        ? ((stats.activeInstances / stats.totalInstances) * 100).toFixed(1)
                                        : 0}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-emerald-600 font-medium">Success Rate</p>
                                <p className="text-2xl font-bold text-emerald-900">
                                    {completionRate.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center">
                                <Timer className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-amber-600 font-medium">Avg. Duration</p>
                                <p className="text-2xl font-bold text-amber-900">
                                    {formatDuration(stats.avgCompletionTimeMinutes)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
