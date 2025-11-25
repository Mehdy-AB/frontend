'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Workflow,
  Settings,
  Search,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  ListTodo,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { workflowService } from '@/api/services/workflowService';
import { WorkflowStepInstanceResponse, WorkflowResponse } from '@/types/api';
import { formatDate } from '@/lib/dateFormatter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [myTasks, setMyTasks] = useState<WorkflowStepInstanceResponse[]>([]);
  const [adminWorkflows, setAdminWorkflows] = useState<WorkflowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');

  useEffect(() => {
    if (session?.user) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load user's pending tasks
      const tasks = await workflowService.getPendingSteps();
      setMyTasks(tasks);

      // Load workflows user admins
      const workflows = await workflowService.getAdminedWorkflows(0, 100);
      setAdminWorkflows(workflows.content);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks
  const filteredTasks = myTasks.filter(task => {
    const matchesSearch = searchQuery === '' ||
      task.workflowStep?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.documentName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

    const matchesWorkflow = workflowFilter === 'all' ||
      task.workflowId === Number(workflowFilter);

    return matchesSearch && matchesStatus && matchesWorkflow;
  });

  // Calculate statistics
  const stats = {
    totalTasks: myTasks.length,
    overdueTasks: myTasks.filter(t => t.isOverdue).length,
    completedToday: myTasks.filter(t => {
      if (!t.completedAt) return false;
      const today = new Date().toDateString();
      return new Date(t.completedAt).toDateString() === today;
    }).length,
    adminedWorkflows: adminWorkflows.length,
  };

  const handleTaskClick = (task: WorkflowStepInstanceResponse) => {
    if (task.documentId) {
      router.push(`/documents/${task.documentId}?tab=workflows`);
    }
  };

  const handleWorkflowClick = (workflowId: number) => {
    router.push(`/admin/workflow/${workflowId}`);
  };

  const handleCreateWorkflow = () => {
    router.push('/admin/workflow/designer');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.firstName || session?.user?.name || 'User'}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">My Tasks</p>
                <p className="text-3xl font-bold">{stats.totalTasks}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ListTodo className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{stats.overdueTasks}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admin Workflows</p>
                <p className="text-3xl font-bold">{stats.adminedWorkflows}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tasks">
            <ListTodo className="h-4 w-4 mr-2" />
            My Tasks ({myTasks.length})
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <Workflow className="h-4 w-4 mr-2" />
            My Workflows ({adminWorkflows.length})
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workflows</SelectItem>
                    {Array.from(new Set(myTasks.map(t => t.workflowId)))
                      .filter(Boolean)
                      .map(id => {
                        const task = myTasks.find(t => t.workflowId === id);
                        return (
                          <SelectItem key={id} value={id!.toString()}>
                            {task?.workflowName || 'Unknown'}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center text-muted-foreground">
                  <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No tasks found</p>
                  <p className="text-sm">
                    {myTasks.length === 0
                      ? "You don't have any pending tasks"
                      : "Try adjusting your filters"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleTaskClick(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        {/* Task Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">
                              {task.workflowStep?.name || 'Unknown Step'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              <FileText className="h-3 w-3 inline mr-1" />
                              {task.documentName || 'Unknown Document'}
                            </p>
                          </div>
                          <Badge
                            variant={
                              task.status === 'COMPLETED' ? 'default' :
                                task.isOverdue ? 'destructive' :
                                  'secondary'
                            }
                          >
                            {task.isOverdue ? 'Overdue' : task.status}
                          </Badge>
                        </div>

                        {/* Task Details */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Workflow className="h-4 w-4" />
                            <span>{task.workflowName || 'Unknown Workflow'}</span>
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Due: {formatDate(task.dueDate)}</span>
                            </div>
                          )}
                          {task.workflowStep?.description && (
                            <p className="text-sm">{task.workflowStep.description}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Workflows you have administrative access to
            </p>
            <Button onClick={handleCreateWorkflow}>
              <Workflow className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </div>

          {/* Workflows Grid */}
          {adminWorkflows.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center text-muted-foreground">
                  <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No workflows found</p>
                  <p className="text-sm mb-4">
                    You don't have administrative access to any workflows yet
                  </p>
                  <Button onClick={handleCreateWorkflow} variant="outline">
                    <Workflow className="h-4 w-4 mr-2" />
                    Create Your First Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminWorkflows.map((workflow) => (
                <Card
                  key={workflow.id}
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleWorkflowClick(workflow.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {workflow.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Created:</span>
                        <span>{formatDate(workflow.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Updated:</span>
                        <span>{formatDate(workflow.updatedAt)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/workflow/designer?id=${workflow.id}`);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

