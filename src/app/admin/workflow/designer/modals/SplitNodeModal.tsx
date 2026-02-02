'use client';

import { useState, useEffect } from 'react';
import { X, GitFork } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WorkflowNodeData } from '../nodes/types';

interface SplitNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

/**
 * SplitNodeModal - Configuration for SPLIT node type
 * Backend: SplitNodeHandler
 * - branches: number - Number of parallel branches
 */
export default function SplitNodeModal({ isOpen, onClose, nodeData, onSave }: SplitNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Split');
    const [branches, setBranches] = useState(nodeData.branches || 2);

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Split');
            setBranches(nodeData.branches || 2);
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            label,
            branches: Math.max(2, Math.min(5, branches)),
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-fuchsia-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-fuchsia-500 rounded-lg flex items-center justify-center">
                            <GitFork className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Split</h3>
                            <p className="text-sm text-gray-500">Parallel fork gateway</p>
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
                            placeholder="Split"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="branches">Number of Parallel Branches</Label>
                        <div className="flex items-center gap-4 mt-2">
                            <button
                                onClick={() => setBranches(Math.max(2, branches - 1))}
                                className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-100 font-bold text-lg"
                            >
                                -
                            </button>
                            <div className="flex-1 text-center">
                                <span className="text-4xl font-bold text-fuchsia-600">{branches}</span>
                                <p className="text-sm text-gray-500">branches</p>
                            </div>
                            <button
                                onClick={() => setBranches(Math.min(10, branches + 1))}
                                className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-100 font-bold text-lg"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-2">Min: 2, Max: 10 branches</p>
                    </div>

                    {/* Visual Preview */}
                    <div className="bg-fuchsia-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 text-center mb-2">Branch Preview</p>
                        <div className="flex justify-center gap-2">
                            {Array.from({ length: branches }).map((_, i) => (
                                <div
                                    key={i}
                                    className="px-3 py-1 bg-fuchsia-500 text-white text-xs rounded"
                                >
                                    Branch {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-fuchsia-500 hover:bg-fuchsia-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
