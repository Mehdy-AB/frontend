'use client';

import React, { useState, useEffect } from 'react';
import {
    MoreHorizontal,
    RotateCcw,
    Calendar,
    Users,
    AlertTriangle,
    Plus,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { workflowService } from '@/api/services/workflowService';
import { useNotifications } from '@/hooks/useNotifications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WorkflowInstanceActionsProps {
    instanceId: number;
    stepInstanceId: number;
    workflowStepId: number;
    stepName: string;
    status: string;
    onActionComplete: () => void;
    isCompletedStep?: boolean;
    currentDueDate?: string;
}

export function WorkflowInstanceActions({
    instanceId,
    stepInstanceId,
    workflowStepId,
    stepName,
    status,
    onActionComplete,
    isCompletedStep = false,
    currentDueDate
}: WorkflowInstanceActionsProps) {
    const { showSuccess, showError } = useNotifications();

    // Dialog states
    const [showRollbackDialog, setShowRollbackDialog] = useState(false);
    const [showDueDateDialog, setShowDueDateDialog] = useState(false);
    const [rollbackReason, setRollbackReason] = useState('');

    // Due date states
    const [dueDateMode, setDueDateMode] = useState<'date' | 'days'>('days');
    const [newDueDate, setNewDueDate] = useState('');
    const [addDaysCount, setAddDaysCount] = useState<number>(1);
    const [dueDateReason, setDueDateReason] = useState('');
    const [calculatedDate, setCalculatedDate] = useState<Date | null>(null);

    // Calculate date when adding days
    useEffect(() => {
        if (dueDateMode === 'days') {
            const now = new Date();
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + addDaysCount);

            setCalculatedDate(targetDate);

            // Format for input type="datetime-local": YYYY-MM-DDThh:mm
            const pad = (n: number) => n < 10 ? '0' + n : n;
            const formatted = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}T${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}`;

            setNewDueDate(formatted);
        }
    }, [dueDateMode, addDaysCount, currentDueDate]);

    const handleRollback = async () => {
        if (!rollbackReason.trim()) return;

        try {
            await workflowService.rollbackToStep(instanceId, {
                targetStepId: workflowStepId,
                reason: rollbackReason
            });
            showSuccess(`Rolled back to step: ${stepName}`);
            setShowRollbackDialog(false);
            setRollbackReason('');
            onActionComplete();
        } catch (error: any) {
            console.error('Rollback failed:', error);
            showError('Failed to rollback', error?.message || 'Unknown error');
        }
    };

    const handleUpdateDueDate = async () => {
        if (!newDueDate) return;

        try {
            await workflowService.updateStepDueDate(
                instanceId,
                stepInstanceId,
                new Date(newDueDate).toISOString(),
                dueDateReason
            );
            showSuccess('Due date updated successfully');
            setShowDueDateDialog(false);
            setNewDueDate('');
            setDueDateReason('');
            onActionComplete();
        } catch (error: any) {
            console.error('Update due date failed:', error);
            showError('Failed to update due date', error?.message || 'Unknown error');
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {status === 'ACTIVE' && (
                        <>
                            <DropdownMenuItem onClick={() => setShowDueDateDialog(true)}>
                                <Calendar className="mr-2 h-4 w-4" />
                                Update Due Date
                            </DropdownMenuItem>
                        </>
                    )}

                    {isCompletedStep && (
                        <DropdownMenuItem onClick={() => setShowRollbackDialog(true)} className="text-red-600">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Rollback to this Step
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Rollback Dialog */}
            <Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rollback to {stepName}</DialogTitle>
                        <DialogDescription>
                            This will reset all subsequent steps and make this step active again.
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Reason for Rollback <span className="text-red-500">*</span></Label>
                            <Textarea
                                value={rollbackReason}
                                onChange={(e) => setRollbackReason(e.target.value)}
                                placeholder="Explain why you are rolling back..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRollbackDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRollback} disabled={!rollbackReason.trim()}>
                            Rollback
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Due Date Dialog */}
            <Dialog open={showDueDateDialog} onOpenChange={setShowDueDateDialog}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Update Due Date</DialogTitle>
                        <DialogDescription>
                            Set a new due date for {stepName}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Tabs defaultValue="days" onValueChange={(v) => setDueDateMode(v as 'date' | 'days')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="days">Add Days</TabsTrigger>
                                <TabsTrigger value="date">Pick Date</TabsTrigger>
                            </TabsList>

                            <TabsContent value="days" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Add Days from Now</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={addDaysCount}
                                            onChange={(e) => setAddDaysCount(parseInt(e.target.value) || 1)}
                                            className="w-24"
                                        />
                                        <span className="text-sm text-muted-foreground">days</span>
                                    </div>
                                    {calculatedDate && (
                                        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded-md flex items-center gap-2 mt-2">
                                            <Calendar className="w-4 h-4" />
                                            New Due Date: <span className="font-semibold">{calculatedDate.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="date" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Select Specific Date <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="datetime-local"
                                        value={newDueDate}
                                        onChange={(e) => setNewDueDate(e.target.value)}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="space-y-2">
                            <Label>Reason (Optional)</Label>
                            <Textarea
                                value={dueDateReason}
                                onChange={(e) => setDueDateReason(e.target.value)}
                                placeholder="Why is the due date being changed?"
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDueDateDialog(false)}>Cancel</Button>
                        <Button onClick={handleUpdateDueDate} disabled={!newDueDate}>
                            Update Date
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
