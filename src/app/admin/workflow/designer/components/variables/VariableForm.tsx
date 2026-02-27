'use client';

import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VariableDefinition, VARIABLE_TYPES, generateKeyFromLabel } from './types';

interface VariableFormProps {
    editingVariable?: VariableDefinition | null;
    existingKeys: string[];
    onSave: (data: Partial<VariableDefinition>) => void;
    onCancel: () => void;
}

export default function VariableForm({ editingVariable, existingKeys, onSave, onCancel }: VariableFormProps) {
    const [label, setLabel] = useState('');
    const [variableKey, setVariableKey] = useState('');
    const [type, setType] = useState('STRING');
    const [defaultValue, setDefaultValue] = useState<any>('');
    const [keyError, setKeyError] = useState('');

    const isEditing = !!editingVariable;

    useEffect(() => {
        if (editingVariable) {
            setLabel(editingVariable.label);
            setVariableKey(editingVariable.variableKey);
            setType(editingVariable.type);
            setDefaultValue(editingVariable.defaultValue ?? '');
        } else {
            setLabel('');
            setVariableKey('');
            setType('STRING');
            setDefaultValue('');
        }
        setKeyError('');
    }, [editingVariable]);

    // Auto-generate key from label (only for new variables)
    const handleLabelChange = (value: string) => {
        setLabel(value);
        if (!isEditing) {
            const generated = generateKeyFromLabel(value);
            setVariableKey(generated);

            // Check uniqueness
            if (generated && existingKeys.includes(generated)) {
                setKeyError('Key already exists');
            } else {
                setKeyError('');
            }
        }
    };

    const handleSave = () => {
        if (!label.trim() || !variableKey.trim() || !type) return;
        if (keyError) return;

        onSave({
            variableKey,
            label: label.trim(),
            type,
            defaultValue: defaultValue === '' ? null : defaultValue,
        });
    };

    // Render default value input based on type
    const renderDefaultValueInput = () => {
        switch (type) {
            case 'BOOLEAN':
                return (
                    <div className="flex items-center gap-2 py-1">
                        <Switch
                            checked={!!defaultValue}
                            onCheckedChange={(val) => setDefaultValue(val)}
                        />
                        <span className="text-xs text-gray-500">{defaultValue ? 'True' : 'False'}</span>
                    </div>
                );
            case 'NUMBER':
                return (
                    <Input
                        type="number"
                        value={defaultValue ?? ''}
                        onChange={(e) => setDefaultValue(e.target.value ? parseInt(e.target.value) : '')}
                        placeholder="0"
                        className="h-8 text-sm"
                    />
                );
            case 'DECIMAL':
                return (
                    <Input
                        type="number"
                        step="0.01"
                        value={defaultValue ?? ''}
                        onChange={(e) => setDefaultValue(e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="0.00"
                        className="h-8 text-sm"
                    />
                );
            case 'DATE':
                return (
                    <Input
                        type="date"
                        value={defaultValue || ''}
                        onChange={(e) => setDefaultValue(e.target.value)}
                        className="h-8 text-sm"
                    />
                );
            case 'TIME':
                return (
                    <Input
                        type="time"
                        value={defaultValue || ''}
                        onChange={(e) => setDefaultValue(e.target.value)}
                        className="h-8 text-sm"
                    />
                );
            case 'DATETIME':
                return (
                    <Input
                        type="datetime-local"
                        value={defaultValue || ''}
                        onChange={(e) => setDefaultValue(e.target.value)}
                        className="h-8 text-sm"
                    />
                );
            case 'EMAIL':
                return (
                    <Input
                        type="email"
                        value={defaultValue || ''}
                        onChange={(e) => setDefaultValue(e.target.value)}
                        placeholder="email@example.com"
                        className="h-8 text-sm"
                    />
                );
            case 'TEXT':
                return (
                    <Textarea
                        value={defaultValue || ''}
                        onChange={(e) => setDefaultValue(e.target.value)}
                        placeholder="Default text..."
                        rows={2}
                        className="text-sm"
                    />
                );
            default: // STRING
                return (
                    <Input
                        type="text"
                        value={defaultValue || ''}
                        onChange={(e) => setDefaultValue(e.target.value)}
                        placeholder="Default value..."
                        className="h-8 text-sm"
                    />
                );
        }
    };

    return (
        <div className="border border-blue-200 bg-blue-50/30 rounded-lg p-3 space-y-3">
            <div className="font-medium text-sm text-blue-700">
                {isEditing ? 'Edit Variable' : 'New Variable'}
            </div>

            {/* Label */}
            <div>
                <Label className="text-xs">Label *</Label>
                <Input
                    value={label}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    placeholder="e.g. Invoice Amount"
                    className="h-8 text-sm"
                    autoFocus
                />
            </div>

            {/* Auto-generated Key (read-only display) */}
            {variableKey && (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded border border-gray-200">
                    <span className="text-xs text-gray-500">Key:</span>
                    <code className="text-xs font-mono text-blue-600">{variableKey}</code>
                </div>
            )}
            {keyError && (
                <p className="text-xs text-red-500">{keyError}</p>
            )}

            {/* Type */}
            <div>
                <Label className="text-xs">Type *</Label>
                <Select value={type} onValueChange={(val) => { setType(val); setDefaultValue(''); }}>
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {VARIABLE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Default Value */}
            <div>
                <Label className="text-xs">Default Value</Label>
                {renderDefaultValueInput()}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={!label.trim() || !variableKey.trim() || !!keyError}>
                    <Save className="h-3 w-3 mr-1" /> {isEditing ? 'Update' : 'Add'}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>
                    <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
            </div>
        </div>
    );
}
