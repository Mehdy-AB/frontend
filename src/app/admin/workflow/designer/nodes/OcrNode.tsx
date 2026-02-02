import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ScanText, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface OcrNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const OcrNode = ({ data, selected }: OcrNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[180px] bg-fuchsia-50 relative shadow-sm transition-all duration-200 group ${selected ? 'border-fuchsia-500 ring-2 ring-fuchsia-200' : 'border-fuchsia-200 hover:border-fuchsia-300'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-5 h-5 bg-fuchsia-500" />
            <Handle type="source" position={Position.Right} className="w-5 h-5 bg-fuchsia-500" />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-fuchsia-100 text-fuchsia-400 hover:text-fuchsia-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onEdit) data.onEdit();
                    }}
                    title="Edit OCR"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-fuchsia-400 hover:text-red-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onDelete) data.onDelete();
                    }}
                    title="Delete Node"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex items-center gap-2 mb-1 pr-10">
                <ScanText className="w-4 h-4 text-fuchsia-600" />
                <div className="font-semibold text-sm text-fuchsia-900">OCR Process</div>
            </div>

            <div className="text-xs text-fuchsia-700 bg-white border border-fuchsia-100 rounded px-2 py-1 mt-1">
                Extract text from document
            </div>
        </div>
    );
};

export default memo(OcrNode);
