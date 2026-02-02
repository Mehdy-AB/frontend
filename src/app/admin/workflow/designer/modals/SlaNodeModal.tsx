'use client';

import { useState, useEffect } from 'react';
import { X, Timer, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowNodeData } from '../nodes/types';

interface SlaNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

const ESCALATION_ACTIONS = [
    { value: 'NOTIFY', label: 'Send Notification' },
    { value: 'ESCALATE', label: 'Escalate to Manager' },
    { value: 'AUTO_APPROVE', label: 'Auto-Approve' },
    { value: 'AUTO_REJECT', label: 'Auto-Reject' },
    { value: 'CANCEL', label: 'Cancel Workflow' },
];

const PRESETS = [
    { label: '4 Hours', hours: 4 },
    { label: '8 Hours', hours: 8 },
    { label: '24 Hours', hours: 24 },
    { label: '48 Hours', hours: 48 },
    { label: '3 Days', hours: 72 },
    { label: '7 Days', hours: 168 },
];

export default function SlaNodeModal({ isOpen, onClose, nodeData, onSave }: SlaNodeModalProps) {
    const [slaDueHours, setSlaDueHours] = useState<number>(nodeData.slaDueHours || 24);
    const [escalationAction, setEscalationAction] = useState<string>(nodeData.escalationAction || 'NOTIFY');
    const [warningThreshold, setWarningThreshold] = useState<number>(nodeData.warningThreshold || 80);

    useEffect(() => {
        if (isOpen) {
            setSlaDueHours(nodeData.slaDueHours || 24);
            setEscalationAction(nodeData.escalationAction || 'NOTIFY');
            setWarningThreshold(nodeData.warningThreshold || 80);
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            slaDueHours,
            escalationAction,
            warningThreshold,
        });
        onClose();
    };

    const formatDuration = (hours: number): string => {
        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
        }
        return `${hours}h`;
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
                <div className="flex items-center justify-between p-6 border-b bg-orange-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <Timer className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure SLA</h3>
                            <p className="text-sm text-gray-500">Set deadline and escalation</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-orange-100 flex items-center justify-center transition-colors"
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
                                    key={preset.hours}
                                    onClick={() => setSlaDueHours(preset.hours)}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${slaDueHours === preset.hours
                                        ? 'bg-orange-500 text-white border-orange-500'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Duration */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">SLA Duration (hours)</Label>
                        <Input
                            type="number"
                            min={1}
                            value={slaDueHours}
                            onChange={(e) => setSlaDueHours(Math.max(1, parseInt(e.target.value) || 1))}
                            className="text-center text-lg font-medium"
                        />
                    </div>

                    {/* Warning Threshold */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Warning Threshold ({warningThreshold}%)
                        </Label>
                        <input
                            type="range"
                            min={50}
                            max={95}
                            value={warningThreshold}
                            onChange={(e) => setWarningThreshold(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Send warning when {warningThreshold}% of time has elapsed
                        </p>
                    </div>

                    {/* Escalation Action */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">On SLA Breach</Label>
                        <Select value={escalationAction} onValueChange={setEscalationAction}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                                {ESCALATION_ACTIONS.map((action) => (
                                    <SelectItem key={action.value} value={action.value}>
                                        {action.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Preview */}
                    <div className="bg-orange-50 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        <div>
                            <p className="text-sm font-medium text-orange-900">
                                {formatDuration(slaDueHours)} deadline
                            </p>
                            <p className="text-xs text-orange-700">
                                {ESCALATION_ACTIONS.find(a => a.value === escalationAction)?.label} on breach
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
