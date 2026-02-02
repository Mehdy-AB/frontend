'use client';

import { useState, useEffect } from 'react';
import { X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WorkflowNodeData } from '../nodes/types';

interface LockDocumentNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

/**
 * LockDocumentNodeModal - Configuration for LOCK_DOCUMENT node
 * Backend: LockDocumentNodeHandler
 * - lockReason: string - Reason for locking
 */
export default function LockDocumentNodeModal({ isOpen, onClose, nodeData, onSave }: LockDocumentNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Lock Document');
    const [lockReason, setLockReason] = useState(nodeData.lockReason || '');

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Lock Document');
            setLockReason(nodeData.lockReason || '');
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            label,
            lockReason,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-amber-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Lock Document</h3>
                            <p className="text-sm text-gray-500">Prevent edits</p>
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
                            placeholder="Lock Document"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="reason">Lock Reason (Optional)</Label>
                        <Textarea
                            id="reason"
                            value={lockReason}
                            onChange={(e) => setLockReason(e.target.value)}
                            placeholder="Why is this document being locked?"
                            rows={3}
                            className="mt-1"
                        />
                    </div>

                    {/* Info */}
                    <div className="bg-amber-50 rounded-lg p-4 flex items-start gap-3">
                        <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="text-sm text-gray-600">
                            <p className="font-medium text-amber-700">Document will be locked</p>
                            <p className="text-gray-500 mt-1">Users will not be able to edit the document until it is unlocked.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
