import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bell, Users, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface NotificationNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const NotificationNode = ({ data, selected }: NotificationNodeProps) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 min-w-[200px] bg-amber-50 relative shadow-sm transition-all duration-200 group ${selected ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-200 hover:border-amber-300'
                }`}
        >
            <Handle type="target" position={Position.Left} className="w-5 h-5 bg-amber-500" />
            <Handle type="source" position={Position.Right} className="w-5 h-5 bg-amber-500" />

            {/* Action Icons - Top Right (Visible on Hover/Selected) */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-amber-100 text-amber-400 hover:text-amber-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onEdit) data.onEdit();
                    }}
                    title="Edit Notification"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-red-50 text-amber-400 hover:text-red-600 transition-colors"
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
                <Bell className="w-4 h-4 text-amber-600" />
                <div className="font-semibold text-sm text-amber-900">Send Notification</div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-amber-700 mt-2">
                <Users className="w-5 h-5" />
                <span>{data.recipients?.length || 0} recipients</span>
            </div>
        </div>
    );
};

export default memo(NotificationNode);
