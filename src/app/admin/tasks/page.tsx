'use client';

import React from 'react';
import { TasksTable } from '@/components/tasks/TasksTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListTodo } from 'lucide-react';

export default function TasksPage() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <ListTodo className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
                    <p className="text-muted-foreground">
                        Manage your assigned workflow steps and approvals
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Assigned Tasks</CardTitle>
                    <CardDescription>
                        View and manage tasks assigned to you or your groups/roles
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TasksTable />
                </CardContent>
            </Card>
        </div>
    );
}
