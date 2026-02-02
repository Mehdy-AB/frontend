'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowNodeData } from '../nodes/types';

interface ChangeStatusNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

// Common lifecycle statuses
const LIFECYCLE_STATUSES = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING_REVIEW', label: 'Pending Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'ARCHIVED', label: 'Archived' },
    { value: 'OBSOLETE', label: 'Obsolete' },
];

/**
 * ChangeStatusNodeModal - Configuration for CHANGE_STATUS node
 * Backend: ChangeLifecycleNodeHandler
 * - status: string - Target status
 * - comment: string - Status change comment
 */
export default function ChangeStatusNodeModal({ isOpen, onClose, nodeData, onSave }: ChangeStatusNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Change Status');
    const [targetStatus, setTargetStatus] = useState(nodeData.targetStatus || 'APPROVED');
    const [comment, setComment] = useState(nodeData.statusComment || '');

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Change Status');
            setTargetStatus(nodeData.targetStatus || 'APPROVED');
            setComment(nodeData.statusComment || '');
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            label,
            targetStatus,
            statusComment: comment,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-cyan-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Change Status</h3>
                            <p className="text-sm text-gray-500">Update lifecycle state</p>
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
                            placeholder="Change Status"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label>Target Status</Label>
                        <Select value={targetStatus} onValueChange={setTargetStatus}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {LIFECYCLE_STATUSES.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>
                                        {status.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="comment">Comment (Optional)</Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Reason for status change..."
                            rows={3}
                            className="mt-1"
                        />
                    </div>

                    {/* Preview */}
                    <div className="bg-cyan-50 rounded-lg p-4 flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-cyan-600" />
                        <div>
                            <p className="text-sm text-gray-500">Document will be set to:</p>
                            <p className="font-medium text-cyan-700">{LIFECYCLE_STATUSES.find(s => s.value === targetStatus)?.label || targetStatus}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
