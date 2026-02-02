import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Folder, FileType, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface TriggerNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const TriggerNode = ({ data, selected }: TriggerNodeProps) => {
    const triggerConfig = data.triggerConfig;
    const isFolder = triggerConfig?.triggerType === 'FOLDER';
    const isModel = triggerConfig?.triggerType === 'MODEL';

    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[220px] bg-gradient-to-br from-green-50 to-emerald-50 relative shadow-sm transition-all duration-200 group ${selected ? 'border-green-500 ring-2 ring-green-200' : 'border-green-300 hover:border-green-400'
                }`}
        >
            {/* Only source handle - triggers don't need entry points */}
            <Handle type="source" position={Position.Right} className="w-5 h-5 bg-green-500" />

            {/* Action buttons - Edit and Delete on hover */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                {data.onEdit && (
                    <button
                        onClick={(e) => { e.stopPropagation(); data.onEdit?.(); }}
                        className="p-1.5 rounded-md hover:bg-green-100 text-green-400 hover:text-green-600 transition-colors"
                        title="Edit Trigger"
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </button>
                )}
                {data.onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}
                        className="p-1.5 rounded-md hover:bg-red-50 text-green-400 hover:text-red-600 transition-colors"
                        title="Delete Trigger"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 mb-2 pr-12">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                    <div className="font-semibold text-sm text-green-900">Trigger</div>
                    <div className="text-xs text-green-600">Workflow Start</div>
                </div>
            </div>

            {triggerConfig ? (
                <div className="text-xs bg-white/70 p-2 rounded border border-green-100">
                    <div className="flex items-center gap-1.5 text-green-800">
                        {isFolder && (
                            <>
                                <Folder className="w-5 h-5" />
                                <span className="font-medium">Folder:</span>
                                <span className="truncate max-w-[120px]">{triggerConfig.folderName || 'Not set'}</span>
                            </>
                        )}
                        {isModel && (
                            <>
                                <FileType className="w-5 h-5" />
                                <span className="font-medium">Model:</span>
                                <span className="truncate max-w-[120px]">{triggerConfig.categoryName || 'Not set'}</span>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-xs text-green-600 bg-white/50 p-2 rounded border border-dashed border-green-200 text-center">
                    Click to configure trigger
                </div>
            )}
        </div>
    );
};

export default memo(TriggerNode);
