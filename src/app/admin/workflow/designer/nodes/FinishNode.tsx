import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, XCircle, Flag } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface FinishNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const FinishNode = ({ data, selected }: FinishNodeProps) => {
    return (
        <div className="relative group">
            {/* Main Container */}
            <div
                className={`min-w-[200px] bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-4 shadow-lg transition-all duration-200 ${selected ? 'ring-4 ring-slate-300 scale-105 shadow-xl' : 'hover:scale-102 hover:shadow-xl'
                    }`}
                style={{ boxShadow: '0 8px 24px rgba(71, 85, 105, 0.35)' }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Flag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm">End Workflow</div>
                        <div className="text-slate-300 text-xs">Termination Point</div>
                    </div>
                </div>

                {/* Input Labels */}
                <div className="flex flex-col gap-2 absolute left-0 top-1/2 -translate-y-1/2" style={{ left: -8 }}>
                    {/* Done Input */}
                    <div className="flex items-center gap-1">
                        <Handle
                            type="target"
                            position={Position.Left}
                            id="done"
                            className="!relative !transform-none w-5 h-5 bg-green-500 border-2 border-white shadow-md"
                            style={{ left: 0, top: 0 }}
                        />
                        <span className="text-[9px] font-bold text-green-400 bg-green-900/50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            Done
                        </span>
                    </div>

                    {/* Failed Input */}
                    <div className="flex items-center gap-1">
                        <Handle
                            type="target"
                            position={Position.Left}
                            id="failed"
                            className="!relative !transform-none w-5 h-5 bg-red-500 border-2 border-white shadow-md"
                            style={{ left: 0, top: 0 }}
                        />
                        <span className="text-[9px] font-bold text-red-400 bg-red-900/50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            Failed
                        </span>
                    </div>
                </div>

                {/* Status indicators */}
                <div className="flex gap-2 mt-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span className="text-[10px] text-green-300 font-medium">Success</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 rounded-lg">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <span className="text-[10px] text-red-300 font-medium">Failure</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(FinishNode);
