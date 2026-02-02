'use client';

import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WorkflowNodeData } from '../nodes/types';

interface DelayNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

const PRESETS = [
    { label: '30 Minutes', type: 'MINUTES' as const, value: 30 },
    { label: '1 Hour', type: 'HOURS' as const, value: 1 },
    { label: '4 Hours', type: 'HOURS' as const, value: 4 },
    { label: '24 Hours', type: 'HOURS' as const, value: 24 },
    { label: '3 Days', type: 'DAYS' as const, value: 3 },
    { label: '7 Days', type: 'DAYS' as const, value: 7 },
];

export default function DelayNodeModal({ isOpen, onClose, nodeData, onSave }: DelayNodeModalProps) {
    const [delayType, setDelayType] = useState<'MINUTES' | 'HOURS' | 'DAYS'>(nodeData.delayType || 'HOURS');
    const [delayValue, setDelayValue] = useState<number>(nodeData.delayValue || 1);

    useEffect(() => {
        if (isOpen) {
            setDelayType(nodeData.delayType || 'HOURS');
            setDelayValue(nodeData.delayValue || 1);
        }
    }, [isOpen, nodeData]);

    const formatDuration = (type: 'MINUTES' | 'HOURS' | 'DAYS', value: number): string => {
        if (type === 'MINUTES') {
            if (value >= 60) {
                const hours = Math.floor(value / 60);
                const mins = value % 60;
                return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
            }
            return `${value}m`;
        } else if (type === 'HOURS') {
            if (value >= 24) {
                const days = Math.floor(value / 24);
                const hours = value % 24;
                return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
            }
            return `${value}h`;
        } else {
            return `${value}d`;
        }
    };

    const handleSave = () => {
        onSave({
            delayType,
            delayValue,
            delayDuration: formatDuration(delayType, delayValue),
        });
        onClose();
    };

    const applyPreset = (preset: typeof PRESETS[0]) => {
        setDelayType(preset.type);
        setDelayValue(preset.value);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Delay</h3>
                            <p className="text-sm text-gray-500">Set the wait duration</p>
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
                <div className="p-6 space-y-6">
                    {/* Presets */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">Quick Presets</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => applyPreset(preset)}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${delayType === preset.type && delayValue === preset.value
                                        ? 'bg-slate-500 text-white border-slate-500'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Duration */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">Custom Duration</Label>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <Input
                                    type="number"
                                    min={1}
                                    value={delayValue}
                                    onChange={(e) => setDelayValue(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="text-center text-lg font-medium"
                                />
                            </div>
                            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                {(['MINUTES', 'HOURS', 'DAYS'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setDelayType(type)}
                                        className={`px-4 py-2 text-sm font-medium transition-colors ${delayType === type
                                            ? 'bg-slate-500 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {type === 'MINUTES' ? 'Min' : type === 'HOURS' ? 'Hours' : 'Days'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-500 mb-1">Wait Duration</p>
                        <p className="text-2xl font-bold text-slate-700">{formatDuration(delayType, delayValue)}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-slate-500 hover:bg-slate-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
