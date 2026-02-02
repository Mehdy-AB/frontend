'use client';

import { useState, useEffect } from 'react';
import { X, Globe, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowNodeData } from '../nodes/types';

interface ApiCallNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

interface Header {
    key: string;
    value: string;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export default function ApiCallNodeModal({ isOpen, onClose, nodeData, onSave }: ApiCallNodeModalProps) {
    const [url, setUrl] = useState<string>(nodeData.apiUrl || '');
    const [method, setMethod] = useState<string>(nodeData.apiMethod || 'GET');
    const [headers, setHeaders] = useState<Header[]>(nodeData.apiHeaders || [{ key: '', value: '' }]);
    const [body, setBody] = useState<string>(nodeData.apiBody || '');
    const [timeout, setTimeout] = useState<number>(nodeData.apiTimeout || 30);
    const [retryCount, setRetryCount] = useState<number>(nodeData.apiRetryCount || 0);

    useEffect(() => {
        if (isOpen) {
            setUrl(nodeData.apiUrl || '');
            setMethod(nodeData.apiMethod || 'GET');
            setHeaders(nodeData.apiHeaders || [{ key: '', value: '' }]);
            setBody(nodeData.apiBody || '');
            setTimeout(nodeData.apiTimeout || 30);
            setRetryCount(nodeData.apiRetryCount || 0);
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            apiUrl: url,
            apiMethod: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
            apiHeaders: headers.filter(h => h.key.trim()),
            apiBody: body,
            apiTimeout: timeout,
            apiRetryCount: retryCount,
        });
        onClose();
    };

    const addHeader = () => {
        setHeaders([...headers, { key: '', value: '' }]);
    };

    const removeHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index));
    };

    const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
        const updated = [...headers];
        updated[index][field] = value;
        setHeaders(updated);
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
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-cyan-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure API Call</h3>
                            <p className="text-sm text-gray-500">Set up external HTTP request</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-cyan-100 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* URL and Method */}
                    <div className="flex gap-3">
                        <div className="w-28">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Method</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {HTTP_METHODS.map((m) => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">URL</Label>
                            <Input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://api.example.com/endpoint"
                            />
                        </div>
                    </div>

                    {/* Headers */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium text-gray-700">Headers</Label>
                            <button
                                onClick={addHeader}
                                className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add Header
                            </button>
                        </div>
                        <div className="space-y-2">
                            {headers.map((header, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={header.key}
                                        onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                        placeholder="Header name"
                                        className="flex-1"
                                    />
                                    <Input
                                        value={header.value}
                                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                                        placeholder="Value"
                                        className="flex-1"
                                    />
                                    <button
                                        onClick={() => removeHeader(index)}
                                        className="p-2 text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Body (for POST/PUT/PATCH) */}
                    {['POST', 'PUT', 'PATCH'].includes(method) && (
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Request Body (JSON)</Label>
                            <Textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder='{"key": "value"}'
                                rows={4}
                                className="font-mono text-sm"
                            />
                        </div>
                    )}

                    {/* Timeout and Retry */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Timeout (seconds)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={300}
                                value={timeout}
                                onChange={(e) => setTimeout(Math.max(1, parseInt(e.target.value) || 30))}
                            />
                        </div>
                        <div className="flex-1">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Retry Count</Label>
                            <Input
                                type="number"
                                min={0}
                                max={5}
                                value={retryCount}
                                onChange={(e) => setRetryCount(Math.max(0, parseInt(e.target.value) || 0))}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-600" disabled={!url}>
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
