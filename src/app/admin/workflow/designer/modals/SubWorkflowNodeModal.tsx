'use client';

import { useState, useEffect } from 'react';
import { X, Workflow, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { WorkflowNodeData } from '../nodes/types';

interface SubWorkflowNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

// Mock workflows for now - should be fetched from API
const MOCK_WORKFLOWS = [
    { id: 1, name: 'Document Approval', description: 'Standard approval process' },
    { id: 2, name: 'Invoice Processing', description: 'Invoice review and approval' },
    { id: 3, name: 'Contract Review', description: 'Legal review workflow' },
    { id: 4, name: 'Leave Request', description: 'Employee leave approval' },
];

export default function SubWorkflowNodeModal({ isOpen, onClose, nodeData, onSave }: SubWorkflowNodeModalProps) {
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(nodeData.subWorkflowId || null);
    const [waitForCompletion, setWaitForCompletion] = useState<boolean>(nodeData.waitForCompletion ?? true);
    const [passDocument, setPassDocument] = useState<boolean>(nodeData.passDocument ?? true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedWorkflowId(nodeData.subWorkflowId || null);
            setWaitForCompletion(nodeData.waitForCompletion ?? true);
            setPassDocument(nodeData.passDocument ?? true);
            setSearchTerm('');
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        const selectedWorkflow = MOCK_WORKFLOWS.find(w => w.id === selectedWorkflowId);
        onSave({
            subWorkflowId: selectedWorkflowId,
            subWorkflowName: selectedWorkflow?.name,
            waitForCompletion,
            passDocument,
        });
        onClose();
    };

    const filteredWorkflows = MOCK_WORKFLOWS.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <div className="flex items-center justify-between p-6 border-b bg-violet-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-500 rounded-lg flex items-center justify-center">
                            <Workflow className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Sub-Workflow</h3>
                            <p className="text-sm text-gray-500">Call another workflow</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-violet-100 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search workflows..."
                            className="pl-10"
                        />
                    </div>

                    {/* Workflow List */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Select Workflow</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {filteredWorkflows.map((workflow) => (
                                <button
                                    key={workflow.id}
                                    onClick={() => setSelectedWorkflowId(workflow.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedWorkflowId === workflow.id
                                        ? 'bg-violet-50 border-violet-300 ring-2 ring-violet-200'
                                        : 'bg-white border-gray-200 hover:border-violet-200 hover:bg-violet-50/50'
                                        }`}
                                >
                                    <div className="font-medium text-sm text-gray-900">{workflow.name}</div>
                                    <div className="text-xs text-gray-500">{workflow.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Wait for Completion</Label>
                                <p className="text-xs text-gray-500">Pause until sub-workflow completes</p>
                            </div>
                            <Switch
                                checked={waitForCompletion}
                                onCheckedChange={setWaitForCompletion}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Pass Document</Label>
                                <p className="text-xs text-gray-500">Include current document in sub-workflow</p>
                            </div>
                            <Switch
                                checked={passDocument}
                                onCheckedChange={setPassDocument}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-violet-500 hover:bg-violet-600"
                        disabled={!selectedWorkflowId}
                    >
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
