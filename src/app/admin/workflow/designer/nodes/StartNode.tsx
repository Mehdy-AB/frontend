import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, Zap, Folder, FileType, Edit } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface StartNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const StartNode = ({ data, selected }: StartNodeProps) => {
    const triggerType = data.triggerType;
    const hasFolderTrigger = data.triggerFolderId || data.triggerFolderName;
    const hasModelTrigger = data.triggerCategoryId || data.triggerCategoryName;

    return (
        <div className="relative group">
            {/* Main Container */}
            <div
                className={`min-w-[200px] bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 shadow-lg transition-all duration-200 ${selected ? 'ring-4 ring-green-200 scale-105 shadow-xl' : 'hover:scale-102 hover:shadow-xl'
                    }`}
                style={{ boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)' }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm">Start Workflow</div>
                        <div className="text-green-100 text-xs">Entry Point</div>
                    </div>
                </div>

                {/* Trigger Configuration */}
                <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    {hasFolderTrigger || hasModelTrigger ? (
                        <div className="space-y-2">
                            {hasFolderTrigger && (
                                <div className="flex items-center gap-2 text-white">
                                    <Folder className="w-4 h-4 text-green-100" />
                                    <span className="text-xs font-medium">Folder:</span>
                                    <span className="text-xs truncate max-w-[100px] text-green-100">
                                        {data.triggerFolderName || 'Selected'}
                                    </span>
                                </div>
                            )}
                            {hasModelTrigger && (
                                <div className="flex items-center gap-2 text-white">
                                    <FileType className="w-4 h-4 text-green-100" />
                                    <span className="text-xs font-medium">Model:</span>
                                    <span className="text-xs truncate max-w-[100px] text-green-100">
                                        {data.triggerCategoryName || 'Selected'}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-green-100">
                            <Zap className="w-4 h-4" />
                            <span className="text-xs">Configure triggers in workflow settings</span>
                        </div>
                    )}
                </div>

                {/* Edit Button */}
                {data.onEdit && (
                    <button
                        onClick={(e) => { e.stopPropagation(); data.onEdit?.(); }}
                        className="absolute top-2 right-2 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit"
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-5 h-5 bg-white border-3 border-green-500 shadow-md transition-transform hover:scale-125"
                style={{
                    borderRadius: '50%',
                    top: '50%',
                    right: -12,
                    transform: 'translateY(-50%)',
                }}
            />
        </div>
    );
};

export default memo(StartNode);
