'use client';

import { useState, useEffect } from 'react';
import { X, FileEdit, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowNodeData } from '../nodes/types';

interface MetadataField {
    id: string;
    key: string;
    value: string;
    type: 'static' | 'expression';
}

interface UpdateMetadataNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

/**
 * UpdateMetadataNodeModal - Configuration for UPDATE_METADATA node
 * Backend: SetMetadataNodeHandler
 * - fields: Map<String, Object> - Key-value pairs
 */
export default function UpdateMetadataNodeModal({ isOpen, onClose, nodeData, onSave }: UpdateMetadataNodeModalProps) {
    const [label, setLabel] = useState(nodeData.label || 'Update Metadata');
    const [fields, setFields] = useState<MetadataField[]>(nodeData.metadataFields || []);

    useEffect(() => {
        if (isOpen) {
            setLabel(nodeData.label || 'Update Metadata');
            setFields(nodeData.metadataFields || [{ id: '1', key: '', value: '', type: 'static' }]);
        }
    }, [isOpen, nodeData]);

    const addField = () => {
        setFields([...fields, { id: Date.now().toString(), key: '', value: '', type: 'static' }]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateField = (id: string, updates: Partial<MetadataField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleSave = () => {
        onSave({
            label,
            metadataFields: fields.filter(f => f.key.trim()),
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-teal-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                            <FileEdit className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Update Metadata</h3>
                            <p className="text-sm text-gray-500">Set document metadata fields</p>
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
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div>
                        <Label htmlFor="label">Node Label</Label>
                        <Input
                            id="label"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Update Metadata"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>Metadata Fields</Label>
                            <Button variant="outline" size="sm" onClick={addField}>
                                <Plus className="w-4 h-4 mr-1" /> Add Field
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {fields.map((field) => (
                                <div key={field.id} className="p-3 border rounded-lg bg-gray-50">
                                    <div className="flex gap-2 mb-2">
                                        <Input
                                            placeholder="Field key"
                                            value={field.key}
                                            onChange={(e) => updateField(field.id, { key: e.target.value })}
                                            className="flex-1"
                                        />
                                        <Select
                                            value={field.type}
                                            onValueChange={(v) => updateField(field.id, { type: v as any })}
                                        >
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="static">Static</SelectItem>
                                                <SelectItem value="expression">Expression</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <button
                                            onClick={() => removeField(field.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <Input
                                        placeholder={field.type === 'expression' ? '${doc.name}' : 'Field value'}
                                        value={field.value}
                                        onChange={(e) => updateField(field.id, { value: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-teal-500 hover:bg-teal-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
