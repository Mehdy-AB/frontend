'use client';

import { useState, useEffect } from 'react';
import { X, ScanText, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowNodeData } from '../nodes/types';

interface OcrNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

const OCR_ENGINES = [
    { value: 'TESSERACT', label: 'Tesseract OCR' },
    { value: 'GOOGLE_VISION', label: 'Google Vision AI' },
    { value: 'AZURE_OCR', label: 'Azure Computer Vision' },
    { value: 'AWS_TEXTRACT', label: 'AWS Textract' },
];

const OCR_LANGUAGES = [
    { value: 'eng', label: 'English' },
    { value: 'ara', label: 'Arabic' },
    { value: 'fra', label: 'French' },
    { value: 'deu', label: 'German' },
    { value: 'spa', label: 'Spanish' },
    { value: 'chi_sim', label: 'Chinese (Simplified)' },
];

export default function OcrNodeModal({ isOpen, onClose, nodeData, onSave }: OcrNodeModalProps) {
    const [ocrEngine, setOcrEngine] = useState<string>(nodeData.ocrEngine || 'TESSERACT');
    const [ocrLanguages, setOcrLanguages] = useState<string[]>(nodeData.ocrLanguages || ['eng']);
    const [outputVariable, setOutputVariable] = useState<string>(nodeData.ocrOutputVariable || 'ocr_text');
    const [saveToMetadata, setSaveToMetadata] = useState<boolean>(nodeData.ocrSaveToMetadata ?? true);
    const [enhanceImage, setEnhanceImage] = useState<boolean>(nodeData.ocrEnhanceImage ?? true);

    useEffect(() => {
        if (isOpen) {
            setOcrEngine(nodeData.ocrEngine || 'TESSERACT');
            setOcrLanguages(nodeData.ocrLanguages || ['eng']);
            setOutputVariable(nodeData.ocrOutputVariable || 'ocr_text');
            setSaveToMetadata(nodeData.ocrSaveToMetadata ?? true);
            setEnhanceImage(nodeData.ocrEnhanceImage ?? true);
        }
    }, [isOpen, nodeData]);

    const handleSave = () => {
        onSave({
            ocrEngine,
            ocrLanguages,
            ocrOutputVariable: outputVariable,
            ocrSaveToMetadata: saveToMetadata,
            ocrEnhanceImage: enhanceImage,
        });
        onClose();
    };

    const toggleLanguage = (lang: string) => {
        if (ocrLanguages.includes(lang)) {
            if (ocrLanguages.length > 1) {
                setOcrLanguages(ocrLanguages.filter(l => l !== lang));
            }
        } else {
            setOcrLanguages([...ocrLanguages, lang]);
        }
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
                <div className="flex items-center justify-between p-6 border-b bg-fuchsia-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-fuchsia-500 rounded-lg flex items-center justify-center">
                            <ScanText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">OCR Process</h3>
                            <p className="text-sm text-gray-500">Extract text from document</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-fuchsia-100 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* OCR Engine */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">OCR Engine</Label>
                        <Select value={ocrEngine} onValueChange={setOcrEngine}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {OCR_ENGINES.map((engine) => (
                                    <SelectItem key={engine.value} value={engine.value}>{engine.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Languages */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Languages className="w-4 h-4" />
                            Recognition Languages
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {OCR_LANGUAGES.map((lang) => (
                                <button
                                    key={lang.value}
                                    onClick={() => toggleLanguage(lang.value)}
                                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${ocrLanguages.includes(lang.value)
                                        ? 'bg-fuchsia-500 text-white border-fuchsia-500'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-fuchsia-300'
                                        }`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Output Variable */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Output Variable</Label>
                        <Input
                            value={outputVariable}
                            onChange={(e) => setOutputVariable(e.target.value.replace(/\s/g, '_'))}
                            placeholder="ocr_text"
                            className="font-mono"
                        />
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Save to Metadata</Label>
                                <p className="text-xs text-gray-500">Store extracted text in document</p>
                            </div>
                            <Switch
                                checked={saveToMetadata}
                                onCheckedChange={setSaveToMetadata}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Enhance Image</Label>
                                <p className="text-xs text-gray-500">Auto-deskew and improve quality</p>
                            </div>
                            <Switch
                                checked={enhanceImage}
                                onCheckedChange={setEnhanceImage}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-fuchsia-500 hover:bg-fuchsia-600">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
