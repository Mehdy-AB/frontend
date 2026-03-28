'use client';

import { useRouter } from 'next/navigation';
import { Globe, ShieldCheck, Calendar, FolderOpen, ChevronRight, Users, FileText, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkspaceDto, WorkspaceStatsDto } from '@/api/services/workspaceService';

interface WorkspaceCardProps {
    workspace: WorkspaceDto;
    stats?: WorkspaceStatsDto;
}

const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    ARCHIVED: 'bg-gray-100 text-gray-600',
};

export default function WorkspaceCard({ workspace: ws, stats }: WorkspaceCardProps) {
    const router = useRouter();

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    // Navigate to workspace detail page (content tab is default)
    const handleClick = () => {
        router.push(`/workspaces/${ws.id}`);
    };

    const handleSettings = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/workspaces/${ws.id}`);
    };

    return (
        <Card
            className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200"
            style={ws.type === 'SECURED' ? { borderLeft: '4px solid #60a5fa' } : undefined}
            onClick={handleClick}
        >
            <CardContent className="p-6">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            {ws.type === 'SECURED'
                                ? <ShieldCheck className="h-5 w-5 text-white" />
                                : <Globe className="h-5 w-5 text-white" />}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {ws.name}
                            </h3>
                            <p className="text-xs text-gray-400 font-mono">{ws.code}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                        <button
                            onClick={handleSettings}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Workspace Settings"
                        >
                            <Settings className="h-4 w-4" />
                        </button>
                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
                    </div>
                </div>

                {/* Description */}
                {ws.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{ws.description}</p>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {ws.type}
                    </Badge>
                    <Badge variant="secondary" className={`text-xs ${statusColors[ws.status] || 'bg-gray-100 text-gray-600'}`}>
                        {ws.status}
                    </Badge>
                </div>

                {/* Stats Row (if available) */}
                {stats && (
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Users className="h-3.5 w-3.5 text-blue-400" />
                            <span className="font-medium">{stats.memberCount}</span>
                            <span className="text-gray-400">members</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <FolderOpen className="h-3.5 w-3.5 text-blue-400" />
                            <span className="font-medium">{stats.folderCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <FileText className="h-3.5 w-3.5 text-blue-400" />
                            <span className="font-medium">{stats.documentCount}</span>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar className="h-3.5 w-3.5" />{formatDate(ws.createdAt)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <FolderOpen className="h-3.5 w-3.5" />Root
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
