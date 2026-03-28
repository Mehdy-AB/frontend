'use client';

import { Users, FolderOpen, FileText } from 'lucide-react';
import { WorkspaceStatsDto, WorkspaceStatus } from '@/api/services/workspaceService';
import { Badge } from '@/components/ui/badge';

interface WorkspaceStatsBannerProps {
    stats: WorkspaceStatsDto;
}

const statusConfig: Record<WorkspaceStatus, { bg: string; text: string; dot: string }> = {
    ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    SUSPENDED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

export default function WorkspaceStatsBanner({ stats }: WorkspaceStatsBannerProps) {
    const cards = [
        { label: 'Members', value: stats.memberCount, icon: Users, color: 'blue' },
        { label: 'Folders', value: stats.folderCount, icon: FolderOpen, color: 'blue' },
        { label: 'Documents', value: stats.documentCount, icon: FileText, color: 'blue' },
    ];

    const sc = statusConfig[stats.status] || statusConfig.ARCHIVED;

    return (
        <div className="flex items-center gap-4 flex-wrap">
            {/* Status chip */}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${sc.bg}`}>
                <div className={`h-2 w-2 rounded-full ${sc.dot} animate-pulse`} />
                <span className={`text-sm font-semibold ${sc.text}`}>{stats.status}</span>
            </div>

            {/* Stat cards */}
            {cards.map(card => (
                <div key={card.label} className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <card.icon className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                        <p className="text-lg font-bold text-gray-900">{card.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
