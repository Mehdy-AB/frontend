'use client';

import { useState, useEffect } from 'react';
import { X, FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WorkflowNodeData } from '../nodes/types';

const VERSION_TYPES = [
    { value: 'MAJOR', label: 'Major', description: 'Breaking changes, complete rewrites', color: 'bg-red-100 text-red-700 border-red-300 ring-red-200' },
    { value: 'MINOR', label: 'Minor', description: 'New features, significant updates', color: 'bg-yellow-100 text-yellow-700 border-yellow-300 ring-yellow-200' },
    { value: 'PATCH', label: 'Patch', description: 'Bug fixes, minor corrections', color: 'bg-gray-100 text-gray-700 border-gray-300 ring-gray-200' },
] as const;

interface NewVersionNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

/**
 * NewVersionNodeModal - Configuration for NEW_VERSION node
 * Backend: VersionDocumentNodeHandler
 * Creates a new version of the document with the same file (MinIO key).
 * User selects the version type (MAJOR, MINOR, PATCH) and optionally adds a comment.
 */
export default function NewVersionNodeModal({ isOpen, onClose, nodeData, onSave }: NewVersionNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'New Version');
    const [versionType, setVersionType] = useState<string>(nodeData.versionType || 'MINOR');
    const [comment, setComment] = useState(nodeData.versionComment || '');

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'New Version');
            // Support legacy 'major' boolean config
            if (nodeData.versionType) {
                setVersionType(nodeData.versionType);
            } else if (nodeData.major) {
                setVersionType('MAJOR');
            } else {
                setVersionType('MINOR');
            }
            setComment(nodeData.versionComment || '');
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            label,
            versionType,
            versionComment: comment,
            // Legacy compat
            major: versionType === 'MAJOR',
        });
        onClose();
    };

    if (!isOpen) return null;

    const selectedType = VERSION_TYPES.find(t => t.value === versionType) || VERSION_TYPES[1];

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
                <div className="flex items-center justify-between p-6 border-b bg-sky-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                            <FilePlus2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">New Version</h3>
                            <p className="text-sm text-gray-500">Create document version (same file)</p>
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
                <div className="p-6 space-y-5">
                    {/* Node Label */}
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

                    {/* Version Type Selector */}
                    <div>
                        <Label className="mb-2 block">Version Type</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {VERSION_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setVersionType(type.value)}
                                    className={`p-3 rounded-lg border-2 text-center transition-all ${versionType === type.value
                                            ? `${type.color} border-current font-semibold ring-2`
                                            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'
                                        }`}
                                >
                                    <div className="font-medium text-sm">{type.label}</div>
                                    <div className="text-[10px] opacity-75 mt-1 leading-tight">{type.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Version Comment */}
                    <div>
                        <Label htmlFor="comment">
                            Version Comment <span className="text-gray-400 font-normal">(optional)</span>
                        </Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What changed in this version..."
                            rows={3}
                            className="mt-1"
                        />
                    </div>

                    {/* Preview */}
                    <div className="bg-sky-50 rounded-lg p-4 text-sm space-y-1">
                        <div className="font-medium text-sky-800">Preview</div>
                        <div className="text-sky-600 flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${selectedType.color}`}>
                                {selectedType.label}
                            </span>
                            <span className="text-gray-500">version bump · same document file</span>
                        </div>
                        {comment && (
                            <div className="text-gray-500 text-xs mt-1 italic">"{comment}"</div>
                        )}
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
