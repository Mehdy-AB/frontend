'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowNodeData } from '../nodes/types';

interface DeleteNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

const DELETE_TYPES = [
    { value: 'SOFT', label: 'Soft Delete (Move to Trash)' },
    { value: 'HARD', label: 'Permanent Delete' },
];

export default function DeleteNodeModal({ isOpen, onClose, nodeData, onSave }: DeleteNodeModalProps) {
    const [deleteType, setDeleteType] = useState<string>(nodeData.deleteType || 'SOFT');
    const [notifyOwner, setNotifyOwner] = useState<boolean>(nodeData.deleteNotifyOwner ?? true);
    const [requireConfirmation, setRequireConfirmation] = useState<boolean>(nodeData.deleteRequireConfirmation ?? false);

    useEffect(() => {
        if (isOpen) {
            setDeleteType(nodeData.deleteType || 'SOFT');
            setNotifyOwner(nodeData.deleteNotifyOwner ?? true);
            setRequireConfirmation(nodeData.deleteRequireConfirmation ?? false);
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            deleteType,
            deleteNotifyOwner: notifyOwner,
            deleteRequireConfirmation: requireConfirmation,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-red-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Delete Document</h3>
                            <p className="text-sm text-gray-500">Configure deletion behavior</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-red-100 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Delete Type */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Delete Type</Label>
                        <Select value={deleteType} onValueChange={setDeleteType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DELETE_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Warning for Hard Delete */}
                    {deleteType === 'HARD' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-800">Permanent Deletion</p>
                                <p className="text-xs text-red-600 mt-1">
                                    This action cannot be undone. The document and all its versions will be permanently removed.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Notify Owner</Label>
                                <p className="text-xs text-gray-500">Send notification when deleted</p>
                            </div>
                            <Switch
                                checked={notifyOwner}
                                onCheckedChange={setNotifyOwner}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Require Confirmation</Label>
                                <p className="text-xs text-gray-500">Manual approval before deletion</p>
                            </div>
                            <Switch
                                checked={requireConfirmation}
                                onCheckedChange={setRequireConfirmation}
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    <div className={`rounded-lg p-4 ${deleteType === 'HARD' ? 'bg-red-100' : 'bg-gray-100'}`}>
                        <p className={`text-sm font-medium ${deleteType === 'HARD' ? 'text-red-800' : 'text-gray-800'}`}>
                            {DELETE_TYPES.find(t => t.value === deleteType)?.label}
                        </p>
                        <p className={`text-xs mt-1 ${deleteType === 'HARD' ? 'text-red-600' : 'text-gray-600'}`}>
                            {notifyOwner && 'Notify owner • '}
                            {requireConfirmation ? 'Requires confirmation' : 'Auto-execute'}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-red-500 hover:bg-red-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
