import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bell, User, Users, Shield, Edit, Trash2 } from 'lucide-react';
import { WorkflowNodeData } from './types';

interface NotificationNodeProps {
    data: WorkflowNodeData;
    selected?: boolean;
    id: string;
}

const NotificationNode = ({ data, selected }: NotificationNodeProps) => {
    const recipientCount = data.recipients?.length || 0;
    const userCount = data.recipients?.filter((r: any) => r.type === 'USER').length || 0;
    const groupCount = data.recipients?.filter((r: any) => r.type === 'GROUP').length || 0;
    const roleCount = data.recipients?.filter((r: any) => r.type === 'ROLE').length || 0;

    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 min-w-[220px] bg-white relative shadow-sm transition-all duration-200 group ${selected ? 'border-amber-500 ring-4 ring-amber-100 shadow-lg' : 'border-gray-200 hover:border-amber-400 hover:shadow-md'
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-4 h-4 bg-amber-500 border-2 border-white"
                style={{ left: -10 }}
            />

            {/* Action Icons */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
                <button
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors"
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
                <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                    <Bell className="w-4 h-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-sm text-gray-900 truncate">{data.label || 'Notification'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Send Alert</div>
                </div>
            </div>

            {/* Title preview */}
            {data.notificationTitle && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md mb-2 line-clamp-1 truncate">
                    {data.notificationTitle}
                </div>
            )}

            {/* Recipients Summary */}
            {recipientCount > 0 && (
                <div className="flex flex-wrap gap-1">
                    {userCount > 0 && (
                        <div className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <User className="w-2.5 h-2.5" />
                            {userCount}
                        </div>
                    )}
                    {groupCount > 0 && (
                        <div className="text-[10px] font-medium text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            {groupCount}
                        </div>
                    )}
                    {roleCount > 0 && (
                        <div className="text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" />
                            {roleCount}
                        </div>
                    )}
                </div>
            )}

            {recipientCount === 0 && (
                <div className="text-[10px] text-gray-400 italic">No recipients configured</div>
            )}

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-4 h-4 bg-amber-500 border-2 border-white"
                style={{ right: -10 }}
            />
        </div>
    );
};

export default memo(NotificationNode);
