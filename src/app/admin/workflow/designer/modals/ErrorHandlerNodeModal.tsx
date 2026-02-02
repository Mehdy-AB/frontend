'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowNodeData } from '../nodes/types';

interface ErrorHandlerNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

const ERROR_ACTIONS = [
    { value: 'RETRY', label: 'Retry', description: 'Retry the failed node' },
    { value: 'SKIP', label: 'Skip', description: 'Skip and continue' },
    { value: 'CANCEL', label: 'Cancel', description: 'Cancel the workflow' },
    { value: 'NOTIFY', label: 'Notify', description: 'Send notification and wait' },
];

/**
 * ErrorHandlerNodeModal - Configuration for ERROR_HANDLER node
 * Handles error/exception routing in workflows
 */
export default function ErrorHandlerNodeModal({ isOpen, onClose, nodeData, onSave }: ErrorHandlerNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Error Handler');
    const [errorAction, setErrorAction] = useState(nodeData.errorAction || 'NOTIFY');
    const [retryCount, setRetryCount] = useState(nodeData.retryCount || 3);
    const [errorMessage, setErrorMessage] = useState(nodeData.errorMessage || '');

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Error Handler');
            setErrorAction(nodeData.errorAction || 'NOTIFY');
            setRetryCount(nodeData.retryCount || 3);
            setErrorMessage(nodeData.errorMessage || '');
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            label,
            errorAction,
            retryCount: errorAction === 'RETRY' ? retryCount : undefined,
            errorMessage,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-orange-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Error Handler</h3>
                            <p className="text-sm text-gray-500">Exception routing</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <Label htmlFor="label">Node Label</Label>
                        <Input
                            id="label"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Error Handler"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label>Error Action</Label>
                        <Select value={errorAction} onValueChange={setErrorAction}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                                {ERROR_ACTIONS.map((action) => (
                                    <SelectItem key={action.value} value={action.value}>
                                        {action.label} - {action.description}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {errorAction === 'RETRY' && (
                        <div>
                            <Label htmlFor="retryCount">Max Retry Count</Label>
                            <Input
                                id="retryCount"
                                type="number"
                                min={1}
                                max={10}
                                value={retryCount}
                                onChange={(e) => setRetryCount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="mt-1"
                            />
                        </div>
                    )}

                    <div>
                        <Label htmlFor="message">Error Message (Optional)</Label>
                        <Textarea
                            id="message"
                            value={errorMessage}
                            onChange={(e) => setErrorMessage(e.target.value)}
                            placeholder="Custom error message to log..."
                            rows={2}
                            className="mt-1"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
