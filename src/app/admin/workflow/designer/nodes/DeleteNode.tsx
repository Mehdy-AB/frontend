import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Trash, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface DeleteNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

/**
 * DeleteNode - Terminal node that deletes the document and ends the workflow.
 * No configuration modal needed. No outgoing edges.
 */
const DeleteNode = ({ data, selected }: DeleteNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[160px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-red-500 ring-4 ring-red-100 shadow-lg' : 'border-gray-200 hover:border-red-400 hover:shadow-md'
                }`}
        >
            {/* Input handle only — no source handle (terminal node) */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-4 h-4 bg-red-500 border-2 border-white"
                style={{ left: -10 }}
            />

            {/* Delete node button */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}
                    title="Delete Node"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                    <Trash className="w-4 h-4 text-red-600" />
                </div>
                <div>
                    <div className="font-bold text-sm text-gray-900">{data.label || 'Delete Document'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Terminate</div>
                </div>
            </div>

            <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mt-2">
                Deletes document &amp; ends workflow
            </div>
        </div>
    );
};

export default memo(DeleteNode);
