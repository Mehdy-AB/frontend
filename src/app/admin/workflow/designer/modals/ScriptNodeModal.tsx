'use client';

import { useState, useEffect } from 'react';
import { X, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowNodeData } from '../nodes/types';
import dynamic from 'next/dynamic';

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface ScriptNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

const SCRIPT_LANGUAGES = [
    { value: 'JAVASCRIPT', label: 'JavaScript', monacoLang: 'javascript' },
    { value: 'GROOVY', label: 'Groovy', monacoLang: 'java' }, // Monaco uses java highlighting for groovy
    { value: 'PYTHON', label: 'Python', monacoLang: 'python' },
];

// Templates that always return a document object
const SCRIPT_TEMPLATES = {
    JAVASCRIPT: `/**
 * Script Node: Process and return document
 * 
 * Available context:
 * - context.document: The current document object
 * - context.variables: Workflow variables
 * - context.metadata: Document metadata
 * 
 * IMPORTANT: You must return the document at the end
 */

const document = context.document;

// Your processing logic here
console.log('Processing document:', document.title);

// Example: Update document metadata
document.metadata.processed = true;
document.metadata.processedAt = new Date().toISOString();

// Always return the document
return document;`,
    GROOVY: `/**
 * Script Node: Process and return document
 * 
 * Available context:
 * - context.document: The current document object
 * - context.variables: Workflow variables
 * - context.metadata: Document metadata
 * 
 * IMPORTANT: You must return the document at the end
 */

def document = context.document

// Your processing logic here
println "Processing document: " + document.title

// Example: Update document metadata
document.metadata.processed = true
document.metadata.processedAt = new Date().format("yyyy-MM-dd'T'HH:mm:ss")

// Always return the document
return document`,
    PYTHON: `"""
Script Node: Process and return document

Available context:
- context.document: The current document object
- context.variables: Workflow variables
- context.metadata: Document metadata

IMPORTANT: You must return the document at the end
"""

document = context.document

# Your processing logic here
print(f"Processing document: {document.title}")

# Example: Update document metadata
document.metadata["processed"] = True
document.metadata["processedAt"] = datetime.now().isoformat()

# Always return the document
return document`,
};

export default function ScriptNodeModal({ isOpen, onClose, nodeData, onSave }: ScriptNodeModalProps) {
    const [scriptLanguage, setScriptLanguage] = useState<string>(nodeData.scriptLanguage || 'JAVASCRIPT');
    const [scriptCode, setScriptCode] = useState<string>(nodeData.scriptCode || SCRIPT_TEMPLATES.JAVASCRIPT);
    const [timeout, setTimeout] = useState<number>(nodeData.scriptTimeout || 30);
    const [scriptName, setScriptName] = useState<string>(nodeData.scriptName || '');

    useEffect(() => {
        if (isOpen) {
            setScriptLanguage(nodeData.scriptLanguage || 'JAVASCRIPT');
            setScriptCode(nodeData.scriptCode || SCRIPT_TEMPLATES.JAVASCRIPT);
            setTimeout(nodeData.scriptTimeout || 30);
            setScriptName(nodeData.scriptName || '');
        }
    }, [isOpen, nodeData]);

    const handleLanguageChange = (lang: string) => {
        setScriptLanguage(lang);
        // Only replace code if it's using a template
        const templates = Object.values(SCRIPT_TEMPLATES);
        if (templates.includes(scriptCode) || !scriptCode.trim()) {
            setScriptCode(SCRIPT_TEMPLATES[lang as keyof typeof SCRIPT_TEMPLATES]);
        }
    };

    const handleSave = () => {
        onSave({
            scriptLanguage,
            scriptCode,
            scriptTimeout: timeout,
            scriptName,
        });
        onClose();
    };

    const getMonacoLanguage = () => {
        const langConfig = SCRIPT_LANGUAGES.find(l => l.value === scriptLanguage);
        return langConfig?.monacoLang || 'javascript';
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
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden max-h-[90vh] flex flex-col"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-rose-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center">
                            <FileCode className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Script</h3>
                            <p className="text-sm text-gray-500">Write custom processing logic</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-rose-100 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Script Name and Language */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Script Name</Label>
                            <Input
                                value={scriptName}
                                onChange={(e) => setScriptName(e.target.value)}
                                placeholder="My Processing Script"
                            />
                        </div>
                        <div className="w-40">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Language</Label>
                            <Select value={scriptLanguage} onValueChange={handleLanguageChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SCRIPT_LANGUAGES.map((lang) => (
                                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-32">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Timeout (s)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={300}
                                value={timeout}
                                onChange={(e) => setTimeout(Math.max(1, parseInt(e.target.value) || 30))}
                            />
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <div className="text-amber-600 text-sm">⚠️</div>
                        <div className="text-sm text-amber-800">
                            <strong>Important:</strong> Your script must always return the document object.
                            The returned document will be passed to the next step in the workflow.
                        </div>
                    </div>

                    {/* Monaco Code Editor */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-800 text-gray-300 text-xs px-3 py-2 flex justify-between items-center">
                            <span>{getMonacoLanguage().toUpperCase()}</span>
                            <span className="text-gray-500">Return type: Document</span>
                        </div>
                        <Editor
                            height="400px"
                            language={getMonacoLanguage()}
                            value={scriptCode}
                            onChange={(value) => setScriptCode(value || '')}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                roundedSelection: true,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: 'on',
                            }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-rose-500 hover:bg-rose-600">
                        Save Script
                    </Button>
                </div>
            </div>
        </div>
    );
}
