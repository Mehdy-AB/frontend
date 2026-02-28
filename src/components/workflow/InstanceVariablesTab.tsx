'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Variable,
    Pencil,
    Check,
    X,
    RefreshCw,
    Clock,
    AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/dateFormatter';

interface InstanceVariable {
    id: number;
    instanceId: number;
    variableKey: string;
    label: string;
    type: string;
    value: any; // JsonNode
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}

interface InstanceVariablesTabProps {
    instanceId: number;
}

export default function InstanceVariablesTab({ instanceId }: InstanceVariablesTabProps) {
    const [variables, setVariables] = useState<InstanceVariable[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);

    const loadVariables = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiClient.get<InstanceVariable[]>(
                `/api/v1/workflows/instances/${instanceId}/variables`
            );
            setVariables(data);
        } catch (err: any) {
            console.error('Failed to load instance variables:', err);
            setError(err?.response?.data?.message || 'Failed to load variables');
        } finally {
            setLoading(false);
        }
    }, [instanceId]);

    useEffect(() => {
        loadVariables();
    }, [loadVariables]);

    const extractDisplayValue = (v: InstanceVariable): string => {
        if (v.value === null || v.value === undefined) return '';
        if (typeof v.value === 'object') {
            if ('value' in v.value) return String(v.value.value ?? '');
            return JSON.stringify(v.value);
        }
        return String(v.value);
    };

    const handleStartEdit = (v: InstanceVariable) => {
        setEditingKey(v.variableKey);
        setEditValue(extractDisplayValue(v));
    };

    const handleCancelEdit = () => {
        setEditingKey(null);
        setEditValue('');
    };

    const handleSave = async (v: InstanceVariable) => {
        try {
            setSaving(true);
            // Build value as JSON node based on type
            // The backend validates the value directly (e.g. value.isTextual() for STRING)
            // So we send the raw value, not wrapped in {value: ...}
            let jsonValue: any;
            switch (v.type) {
                case 'NUMBER':
                case 'DECIMAL':
                    jsonValue = Number(editValue);
                    break;
                case 'BOOLEAN':
                    jsonValue = editValue === 'true';
                    break;
                default:
                    jsonValue = editValue;
            }

            await apiClient.put(
                `/api/v1/workflows/instances/${instanceId}/variables/${v.variableKey}`,
                { value: jsonValue }
            );

            setEditingKey(null);
            setEditValue('');
            await loadVariables(); // Reload to get updated data
        } catch (err: any) {
            console.error('Failed to update variable:', err);
            setError(err?.response?.data?.message || 'Failed to update variable');
        } finally {
            setSaving(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'STRING':
            case 'TEXT':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'NUMBER':
            case 'DECIMAL':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'BOOLEAN':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'EMAIL':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'DATE':
            case 'TIME':
            case 'DATETIME':
                return 'bg-teal-50 text-teal-700 border-teal-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getInputType = (type: string) => {
        switch (type) {
            case 'NUMBER': return 'number';
            case 'DECIMAL': return 'number';
            case 'EMAIL': return 'email';
            case 'DATE': return 'date';
            case 'TIME': return 'time';
            case 'DATETIME': return 'datetime-local';
            default: return 'text';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
                <Button variant="outline" size="sm" onClick={loadVariables}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        );
    }

    if (variables.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                <Variable className="h-10 w-10 opacity-40" />
                <p className="text-sm">No variables defined for this workflow instance</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {variables.length} variable{variables.length !== 1 ? 's' : ''} • Click edit to change values (logged in history)
                </p>
                <Button variant="outline" size="sm" onClick={loadVariables}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-3">
                {variables.map((v) => {
                    const isEditing = editingKey === v.variableKey;
                    const displayValue = extractDisplayValue(v);

                    return (
                        <div
                            key={v.variableKey}
                            className="group flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                        >
                            {/* Variable info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{v.label}</span>
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getTypeColor(v.type)}`}>
                                        {v.type}
                                    </Badge>
                                    <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                        {v.variableKey}
                                    </code>
                                </div>

                                {isEditing ? (
                                    <div className="flex items-center gap-2 mt-2">
                                        {v.type === 'BOOLEAN' ? (
                                            <select
                                                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                            >
                                                <option value="true">true</option>
                                                <option value="false">false</option>
                                            </select>
                                        ) : v.type === 'TEXT' ? (
                                            <textarea
                                                className="flex-1 min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                autoFocus
                                            />
                                        ) : (
                                            <Input
                                                type={getInputType(v.type)}
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="flex-1 h-9"
                                                autoFocus
                                                step={v.type === 'DECIMAL' ? '0.01' : undefined}
                                            />
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSave(v)}
                                            disabled={saving}
                                            className="h-9 w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleCancelEdit}
                                            className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                                            {displayValue || <span className="italic text-muted-foreground">empty</span>}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Updated info and edit button */}
                            {!isEditing && (
                                <div className="flex items-center gap-3 shrink-0">
                                    {v.updatedAt && (
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(v.updatedAt)}
                                            </div>
                                        </div>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleStartEdit(v)}
                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
