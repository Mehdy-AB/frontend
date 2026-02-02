'use client';

import { useState, useEffect } from 'react';
import { X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WorkflowNodeData } from '../nodes/types';

interface CancelNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

/**
 * CancelNodeModal - Configuration for CANCEL node
 * Backend: CancelNodeHandler
 * - reason: string - Cancellation reason
 */
export default function CancelNodeModal({ isOpen, onClose, nodeData, onSave }: CancelNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Cancel');
    const [reason, setReason] = useState(nodeData.reason || '');

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Cancel');
            setReason(nodeData.reason || '');
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            label,
            reason,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-red-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Cancel Workflow</h3>
                            <p className="text-sm text-gray-500">Force termination</p>
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
                            placeholder="Cancel"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="reason">Cancellation Reason</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Why is the workflow being cancelled?"
                            rows={3}
                            className="mt-1"
                        />
                    </div>

                    {/* Warning */}
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-red-700">Workflow will be cancelled</p>
                                <p className="text-red-600 mt-1">This is a terminal node. The workflow will end when this node is reached.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-red-500 hover:bg-red-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
