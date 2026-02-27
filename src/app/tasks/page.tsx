'use client';

import React from 'react';
import { TasksTable } from '@/components/tasks/TasksTable';
import { ListTodo } from 'lucide-react';

export default function TasksPage() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                    <ListTodo className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your assigned workflow steps, approvals, and reviews
                    </p>
                </div>
            </div>

            <TasksTable />
        </div>
    );
}
