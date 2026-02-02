'use client';

import { useState, useEffect } from 'react';
import { X, FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { WorkflowNodeData } from '../nodes/types';

interface NewVersionNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

/**
 * NewVersionNodeModal - Configuration for NEW_VERSION node
 * Backend: VersionDocumentNodeHandler
 * - versionLabel: string - Version label
 * - comment: string - Version comment
 * - major: boolean - Major version increment
 */
export default function NewVersionNodeModal({ isOpen, onClose, nodeData, onSave }: NewVersionNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'New Version');
    const [versionLabel, setVersionLabel] = useState(nodeData.versionLabel || '');
    const [comment, setComment] = useState(nodeData.versionComment || '');
    const [major, setMajor] = useState(nodeData.major ?? false);

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'New Version');
            setVersionLabel(nodeData.versionLabel || '');
            setComment(nodeData.versionComment || '');
            setMajor(nodeData.major ?? false);
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            label,
            versionLabel,
            versionComment: comment,
            major,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-sky-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                            <FilePlus2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">New Version</h3>
                            <p className="text-sm text-gray-500">Create document version</p>
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
                            placeholder="New Version"
                            className="mt-1"
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                        <div>
                            <Label className="font-medium">Major Version</Label>
                            <p className="text-xs text-gray-500">Increment major version number</p>
                        </div>
                        <Switch checked={major} onCheckedChange={setMajor} />
                    </div>

                    <div>
                        <Label htmlFor="versionLabel">Version Label (Optional)</Label>
                        <Input
                            id="versionLabel"
                            value={versionLabel}
                            onChange={(e) => setVersionLabel(e.target.value)}
                            placeholder="e.g., 2.0 or Release Candidate"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="comment">Version Comment</Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What changed in this version..."
                            rows={3}
                            className="mt-1"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
