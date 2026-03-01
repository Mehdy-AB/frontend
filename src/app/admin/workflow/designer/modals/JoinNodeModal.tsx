'use client';

import { useState, useEffect } from 'react';
import { X, Merge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WorkflowNodeData } from '../nodes/types';

interface JoinNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

const JOIN_MODES = [
    { value: 'ALL', label: 'All Branches', description: 'Wait for all incoming branches' },
    { value: 'ANY', label: 'Any Branch', description: 'Continue when first branch arrives' },
    { value: 'N_OF_M', label: 'N of M', description: 'Wait for N branches to complete' },
];

/**
 * JoinNodeModal - Configuration for JOIN node type
 * Backend: JoinNodeHandler
 * - joinMode: 'ALL' | 'ANY' | 'N_OF_M'
 * - requiredCount: number (for N_OF_M mode)
 */
export default function JoinNodeModal({ isOpen, onClose, nodeData, onSave }: JoinNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Join');
    const [joinMode, setJoinMode] = useState<'ALL' | 'ANY' | 'N_OF_M'>(nodeData.joinMode || 'ALL');
    const [requiredCount, setRequiredCount] = useState(nodeData.requiredCount || 2);
    const [branches, setBranches] = useState(nodeData.branches || 2);

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Join');
            setJoinMode(nodeData.joinMode || 'ALL');
            setRequiredCount(nodeData.requiredCount || 2);
            setBranches(nodeData.branches || 2);
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            label,
            joinMode,
            branches: Math.max(2, Math.min(10, branches)),
            requiredCount: joinMode === 'N_OF_M' ? requiredCount : undefined,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-pink-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                            <Merge className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Join</h3>
                            <p className="text-sm text-gray-500">Synchronization gateway</p>
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
                            placeholder="Join"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label>Number of Incoming Branches</Label>
                        <div className="flex items-center gap-4 mt-2">
                            <button
                                onClick={() => setBranches(Math.max(2, branches - 1))}
                                className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-100 font-bold text-lg"
                            >
                                -
                            </button>
                            <div className="flex-1 text-center">
                                <span className="text-4xl font-bold text-pink-600">{branches}</span>
                                <p className="text-sm text-gray-500">inputs</p>
                            </div>
                            <button
                                onClick={() => setBranches(Math.min(10, branches + 1))}
                                className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-100 font-bold text-lg"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-2">Min: 2, Max: 10 inputs</p>
                    </div>

                    <div>
                        <Label className="mb-2 block">Join Mode</Label>
                        <div className="space-y-2">
                            {JOIN_MODES.map((mode) => (
                                <button
                                    key={mode.value}
                                    onClick={() => setJoinMode(mode.value as any)}
                                    className={`w-full p-3 rounded-lg border text-left transition-colors ${joinMode === mode.value
                                        ? 'bg-pink-50 border-pink-300'
                                        : 'bg-white border-gray-200 hover:border-pink-200'
                                        }`}
                                >
                                    <div className="font-medium text-sm">{mode.label}</div>
                                    <div className="text-xs text-gray-500">{mode.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {joinMode === 'N_OF_M' && (
                        <div>
                            <Label htmlFor="required">Required Branches</Label>
                            <Input
                                id="required"
                                type="number"
                                min={1}
                                value={requiredCount}
                                onChange={(e) => setRequiredCount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-400 mt-1">Number of branches that must complete</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-pink-500 hover:bg-pink-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
