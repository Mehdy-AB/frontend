'use client';

import { useState, useEffect } from 'react';
import { X, Archive, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowNodeData } from '../nodes/types';

interface ArchiveNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

const ARCHIVE_POLICIES = [
    { value: 'STANDARD', label: 'Standard Archive' },
    { value: 'LEGAL_HOLD', label: 'Legal Hold' },
    { value: 'COMPLIANCE', label: 'Compliance Archive' },
    { value: 'COLD_STORAGE', label: 'Cold Storage' },
];

const RETENTION_UNITS = [
    { value: 'DAYS', label: 'Days' },
    { value: 'MONTHS', label: 'Months' },
    { value: 'YEARS', label: 'Years' },
];

export default function ArchiveNodeModal({ isOpen, onClose, nodeData, onSave }: ArchiveNodeModalProps) {
    const [archivePolicy, setArchivePolicy] = useState<string>(nodeData.archivePolicy || 'STANDARD');
    const [retentionValue, setRetentionValue] = useState<number>(nodeData.retentionValue || 7);
    const [retentionUnit, setRetentionUnit] = useState<string>(nodeData.retentionUnit || 'YEARS');
    const [lockDocument, setLockDocument] = useState<boolean>(nodeData.archiveLockDocument ?? true);
    const [notifyOwner, setNotifyOwner] = useState<boolean>(nodeData.archiveNotifyOwner ?? false);

    useEffect(() => {
        if (isOpen) {
            setArchivePolicy(nodeData.archivePolicy || 'STANDARD');
            setRetentionValue(nodeData.retentionValue || 7);
            setRetentionUnit(nodeData.retentionUnit || 'YEARS');
            setLockDocument(nodeData.archiveLockDocument ?? true);
            setNotifyOwner(nodeData.archiveNotifyOwner ?? false);
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            archivePolicy,
            retentionValue,
            retentionUnit,
            archiveLockDocument: lockDocument,
            archiveNotifyOwner: notifyOwner,
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
                <div className="flex items-center justify-between p-6 border-b bg-stone-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-500 rounded-lg flex items-center justify-center">
                            <Archive className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Archive Document</h3>
                            <p className="text-sm text-gray-500">Configure archive settings</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-stone-200 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Archive Policy */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Archive Policy</Label>
                        <Select value={archivePolicy} onValueChange={setArchivePolicy}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ARCHIVE_POLICIES.map((policy) => (
                                    <SelectItem key={policy.value} value={policy.value}>{policy.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Retention Period */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Retention Period
                        </Label>
                        <div className="flex gap-3">
                            <Input
                                type="number"
                                min={1}
                                value={retentionValue}
                                onChange={(e) => setRetentionValue(Math.max(1, parseInt(e.target.value) || 1))}
                                className="flex-1"
                            />
                            <Select value={retentionUnit} onValueChange={setRetentionUnit}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {RETENTION_UNITS.map((unit) => (
                                        <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Lock Document</Label>
                                <p className="text-xs text-gray-500">Prevent modifications after archive</p>
                            </div>
                            <Switch
                                checked={lockDocument}
                                onCheckedChange={setLockDocument}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Notify Owner</Label>
                                <p className="text-xs text-gray-500">Send notification when archived</p>
                            </div>
                            <Switch
                                checked={notifyOwner}
                                onCheckedChange={setNotifyOwner}
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-stone-100 rounded-lg p-4">
                        <p className="text-sm font-medium text-stone-800">
                            {ARCHIVE_POLICIES.find(p => p.value === archivePolicy)?.label}
                        </p>
                        <p className="text-xs text-stone-600 mt-1">
                            Retain for {retentionValue} {retentionUnit.toLowerCase()}
                            {lockDocument && ' • Locked'}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-stone-500 hover:bg-stone-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
