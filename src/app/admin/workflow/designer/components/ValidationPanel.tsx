'use client';

import { AlertCircle, AlertTriangle, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { ValidationError } from '../hooks/useWorkflowValidation';

interface ValidationPanelProps {
    errors: ValidationError[];
    isValid: boolean;
    onNodeClick?: (nodeId: string) => void;
}

export default function ValidationPanel({ errors, isValid, onNodeClick }: ValidationPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (errors.length === 0) {
        return null;
    }

    const errorCount = errors.filter((e) => e.type === 'ERROR').length;
    const warningCount = errors.filter((e) => e.type === 'WARNING').length;

    const getIcon = (type: ValidationError['type']) => {
        switch (type) {
            case 'ERROR':
                return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
            case 'WARNING':
                return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
            case 'INFO':
                return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />;
        }
    };

    const getBgColor = (type: ValidationError['type']) => {
        switch (type) {
            case 'ERROR':
                return 'bg-red-50 hover:bg-red-100';
            case 'WARNING':
                return 'bg-amber-50 hover:bg-amber-100';
            case 'INFO':
                return 'bg-blue-50 hover:bg-blue-100';
        }
    };

    return (
        <div className="absolute bottom-4 left-4 z-10 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div
                className={`flex items-center justify-between px-3 py-2 cursor-pointer ${isValid ? 'bg-green-50' : 'bg-red-50'
                    }`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    {isValid ? (
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                        Workflow Validation
                    </span>
                    {errorCount > 0 && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                            {errorCount} {errorCount === 1 ? 'error' : 'errors'}
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                            {warningCount}
                        </span>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                )}
            </div>

            {/* Errors list */}
            {isExpanded && (
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                    {errors.map((error, index) => (
                        <div
                            key={index}
                            className={`flex items-start gap-2 px-3 py-2 ${getBgColor(error.type)} ${error.nodeId ? 'cursor-pointer' : ''
                                } transition-colors`}
                            onClick={() => {
                                if (error.nodeId && onNodeClick) {
                                    onNodeClick(error.nodeId);
                                }
                            }}
                        >
                            {getIcon(error.type)}
                            <span className="text-sm text-gray-700 flex-1">{error.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            {isExpanded && isValid && (
                <div className="px-3 py-2 bg-green-50 text-sm text-green-700 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    Workflow is valid
                </div>
            )}
        </div>
    );
}
