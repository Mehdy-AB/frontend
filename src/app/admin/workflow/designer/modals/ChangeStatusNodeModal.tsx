'use client';

import { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WorkflowNodeData } from '../nodes/types';

interface ChangeStatusNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

// Suggested statuses (user can also type their own)
const SUGGESTED_STATUSES = [
    'Under Review',
    'Awaiting Signature',
    'Pending Approval',
    'In Progress',
    'On Hold',
    'Ready for Filing',
    'Completed',
    'Rejected',
];

/**
 * ChangeStatusNodeModal - Configuration for CHANGE_STATUS node
 * Backend: ChangeStatusNodeHandler
 * Sets an informational label on the workflow instance (not lifecycle).
 */
export default function ChangeStatusNodeModal({ isOpen, onClose, nodeData, onSave }: ChangeStatusNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Change Status');
    const [targetStatus, setTargetStatus] = useState(nodeData.targetStatus || '');
    const [comment, setComment] = useState(nodeData.statusComment || '');

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Change Status');
            setTargetStatus(nodeData.targetStatus || '');
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
                            <Tag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Change Status</h3>
                            <p className="text-sm text-gray-500">Set workflow instance status label</p>
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
                        <Label htmlFor="targetStatus">Status Text</Label>
                        <Input
                            id="targetStatus"
                            value={targetStatus}
                            onChange={(e) => setTargetStatus(e.target.value)}
                            placeholder="e.g. Under Review, Awaiting Signature..."
                            className="mt-1"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Free text — this label will be shown on the workflow instance
                        </p>
                    </div>

                    {/* Quick-pick suggestions */}
                    <div>
                        <Label className="text-xs text-gray-500">Quick suggestions</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {SUGGESTED_STATUSES.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setTargetStatus(s)}
                                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${targetStatus === s
                                            ? 'bg-cyan-500 text-white border-cyan-500'
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-cyan-300 hover:bg-cyan-50'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="comment">Comment (Optional)</Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Reason for status change..."
                            rows={2}
                            className="mt-1"
                        />
                    </div>

                    {/* Preview */}
                    {targetStatus && (
                        <div className="bg-cyan-50 rounded-lg p-4 flex items-center gap-3">
                            <Tag className="w-5 h-5 text-cyan-600" />
                            <div>
                                <p className="text-sm text-gray-500">Instance status will be set to:</p>
                                <p className="font-medium text-cyan-700 text-lg">{targetStatus}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        className="bg-cyan-500 hover:bg-cyan-600"
                        disabled={!targetStatus.trim()}
                    >
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
