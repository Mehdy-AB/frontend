import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Paperclip, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface AttachDocumentNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const AttachDocumentNode = ({ data, selected }: AttachDocumentNodeProps) => {
    const nd = data as any;
    const fileVariableKey = nd.fileVariableKey || '';
    const attachmentName = nd.attachmentName || '';

    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[220px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-indigo-500 ring-4 ring-indigo-100 shadow-lg' : 'border-gray-200 hover:border-indigo-400 hover:shadow-md'
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-6 h-6 bg-indigo-500 border-[3px] border-indigo-300 ring-3 ring-indigo-300 transition-transform hover:scale-125"
                style={{ left: -12 }}
            />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
                    onClick={(e) => { e.stopPropagation(); data.onEdit?.(); }}
                    title="Edit"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}
                    title="Delete"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 mb-2 pr-10">
                <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-sm text-gray-900 truncate">{data.label || 'Attach Document'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Attachment</div>
                </div>
            </div>

            {/* Info tags */}
            <div className="flex flex-wrap gap-1 items-center">
                {fileVariableKey ? (
                    <div className="text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full font-mono">
                        ${'{'}var.{fileVariableKey}{'}'}
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-400 italic">No file variable set</div>
                )}
                {attachmentName && (
                    <div className="text-[10px] font-medium text-gray-600 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full truncate max-w-[120px]">
                        {attachmentName}
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="default"
                className="w-6 h-6 bg-indigo-500 border-[3px] border-indigo-300 ring-3 ring-indigo-300 transition-transform hover:scale-125"
                style={{ right: -12, top: '50%' }}
            />
        </div>
    );
};

export default memo(AttachDocumentNode);
