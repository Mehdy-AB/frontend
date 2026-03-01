import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ClipboardList, Clock, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface FormRequestNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const FormRequestNode = ({ data, selected }: FormRequestNodeProps) => {
    const nd = data as any;
    const formFields = nd.formFields || [];
    const timeoutEnabled = nd.timeoutEnabled || false;
    const timeoutValue = nd.timeout?.value || 48;
    const timeoutUnit = nd.timeout?.unit || 'HOURS';

    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[220px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-teal-500 ring-4 ring-teal-100 shadow-lg' : 'border-gray-200 hover:border-teal-400 hover:shadow-md'
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-6 h-6 bg-teal-500 border-[3px] border-teal-300 ring-3 ring-teal-300 transition-transform hover:scale-125"
                style={{ left: -12 }}
            />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition-colors"
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
                <div className="p-2 bg-teal-100 rounded-lg shrink-0">
                    <ClipboardList className="w-4 h-4 text-teal-600" />
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-sm text-gray-900 truncate">{data.label || 'Form Request'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">External Form</div>
                </div>
            </div>

            {/* Fields count */}
            <div className="flex flex-wrap gap-1 items-center">
                {formFields.length > 0 ? (
                    <div className="text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-full">
                        {formFields.length} field{formFields.length !== 1 ? 's' : ''}
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-400 italic">No fields configured</div>
                )}
                {timeoutEnabled && (
                    <div className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {timeoutValue}{timeoutUnit === 'HOURS' ? 'h' : timeoutUnit === 'MINUTES' ? 'm' : 'd'}
                    </div>
                )}
            </div>

            {/* Default Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="default"
                className="w-6 h-6 bg-teal-500 border-[3px] border-teal-300 ring-3 ring-teal-300 transition-transform hover:scale-125"
                style={{ right: -12, top: '40%' }}
            />

            {/* Timeout Handle */}
            {timeoutEnabled && (
                <Handle
                    type="source"
                    position={Position.Right}
                    id="timeout"
                    className="w-5 h-5 bg-amber-500 border-[3px] border-amber-300 ring-3 ring-amber-300 transition-transform hover:scale-125"
                    style={{ right: -10, top: '75%' }}
                />
            )}

            {/* Timeout label */}
            {timeoutEnabled && (
                <div className="absolute text-[9px] text-amber-600 font-medium" style={{ right: 4, top: '72%' }}>
                    TIMEOUT
                </div>
            )}
        </div>
    );
};

export default memo(FormRequestNode);
