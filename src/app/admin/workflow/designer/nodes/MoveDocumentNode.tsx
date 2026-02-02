import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FolderInput } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface MoveDocumentNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const MoveDocumentNode = ({ data, selected }: MoveDocumentNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[200px] bg-emerald-50 relative shadow-sm transition-all duration-200 group ${selected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-emerald-200 hover:border-emerald-300'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-5 h-5 bg-emerald-500" />
            <Handle type="source" position={Position.Right} className="w-5 h-5 bg-emerald-500" />

            <div className="flex items-center gap-2 mb-1">
                <FolderInput className="w-4 h-4 text-emerald-600" />
                <div className="font-semibold text-sm text-emerald-900">Move Document</div>
            </div>

            <div className="text-xs text-emerald-700 bg-white/50 p-1.5 rounded">
                {data.destinationFolderName ? (
                    <span className="flex items-center gap-1">
                        <FolderInput className="w-5 h-5" />
                        {data.destinationFolderName}
                    </span>
                ) : (
                    'Select destination...'
                )}
            </div>

            {/* Action buttons on hover */}
            <div className="absolute -top-2 -right-2 hidden group-hover:flex bg-white rounded-md shadow-sm border border-gray-100 p-0.5">
                {data.onEdit && (
                    <button
                        onClick={(e) => { e.stopPropagation(); data.onEdit?.(); }}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                        title="Edit"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                )}
                {data.onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}
                        className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600"
                        title="Delete"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default memo(MoveDocumentNode);
