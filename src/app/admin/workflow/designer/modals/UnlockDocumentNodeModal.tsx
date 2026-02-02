'use client';

import { useState, useEffect } from 'react';
import { X, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WorkflowNodeData } from '../nodes/types';

interface UnlockDocumentNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

/**
 * UnlockDocumentNodeModal - Configuration for UNLOCK_DOCUMENT node
 * Backend: UnlockDocumentNodeHandler
 * Simple node with just a label - unlocks a previously locked document
 */
export default function UnlockDocumentNodeModal({ isOpen, onClose, nodeData, onSave }: UnlockDocumentNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Unlock Document');

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Unlock Document');
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({ label });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-lime-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-lime-500 rounded-lg flex items-center justify-center">
                            <Unlock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Unlock Document</h3>
                            <p className="text-sm text-gray-500">Allow edits again</p>
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
                            placeholder="Unlock Document"
                            className="mt-1"
                        />
                    </div>

                    {/* Info */}
                    <div className="bg-lime-50 rounded-lg p-4 flex items-start gap-3">
                        <Unlock className="w-5 h-5 text-lime-600 mt-0.5" />
                        <div className="text-sm text-gray-600">
                            <p className="font-medium text-lime-700">Document will be unlocked</p>
                            <p className="text-gray-500 mt-1">Users will be able to edit the document again after this step.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-lime-500 hover:bg-lime-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
