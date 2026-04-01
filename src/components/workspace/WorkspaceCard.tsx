'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Globe, Calendar, Users,
    FileText, Settings, HardDrive, MoreVertical,
    Eye, Archive, Pause, Play, Copy, Share2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { WorkspaceDto, WorkspaceStatsDto } from '@/api/services/workspaceService';
import UserAvatar from '@/components/main/UserAvatar';

interface WorkspaceCardProps {
    workspace: WorkspaceDto;
    stats?: WorkspaceStatsDto;
    onArchive?: (id: string) => void;
    onSuspend?: (id: string) => void;
    onReactivate?: (id: string) => void;
}

const statusConfig: Record<string, { dot: string; label: string }> = {
    ACTIVE: { dot: 'bg-emerald-500', label: 'Active' },
    SUSPENDED: { dot: 'bg-red-500', label: 'Suspended' },
    ARCHIVED: { dot: 'bg-gray-400', label: 'Archived' },
};

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function WorkspaceCard({ workspace: ws, stats, onArchive, onSuspend, onReactivate }: WorkspaceCardProps) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const status = statusConfig[ws.status] || statusConfig.ACTIVE;
    const isSuspended = ws.status === 'SUSPENDED';
    const isArchived = ws.status === 'ARCHIVED';

    // Close menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        if (menuOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    const menuItems = [
        { icon: Eye, label: 'View Details', action: () => router.push(`/workspaces/${ws.id}`) },
        { icon: Settings, label: 'Settings', action: () => router.push(`/workspaces/${ws.id}`) },
        { icon: Share2, label: 'Manage Members', action: () => router.push(`/workspaces/${ws.id}`) },
        { icon: Copy, label: 'Copy ID', action: () => { navigator.clipboard.writeText(ws.id); setMenuOpen(false); } },
        ...(ws.status === 'ACTIVE' && onSuspend ? [{ icon: Pause, label: 'Suspend', action: () => { onSuspend(ws.id); setMenuOpen(false); }, danger: true }] : []),
        ...(ws.status === 'SUSPENDED' && onReactivate ? [{ icon: Play, label: 'Reactivate', action: () => { onReactivate(ws.id); setMenuOpen(false); } }] : []),
        ...(ws.status !== 'ARCHIVED' && onArchive ? [{ icon: Archive, label: 'Archive', action: () => { onArchive(ws.id); setMenuOpen(false); }, danger: true }] : []),
    ];

    return (
        <Card
            className={`group hover:shadow-lg transition-all duration-300 cursor-pointer border overflow-hidden relative ${isSuspended ? 'border-red-200 bg-red-50/20' :
                isArchived ? 'border-gray-200 opacity-70' :
                    'border-gray-100 hover:border-blue-200'}`}
            onClick={() => router.push(`/workspaces/${ws.id}`)}
        >
            <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors text-[15px]">
                                    {ws.name}
                                </h3>
                                {/* Status dot */}
                                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${status.dot} ${ws.status === 'ACTIVE' ? 'animate-pulse' : ''}`}
                                    title={status.label} />
                            </div>
                            <p className="text-xs text-gray-400 font-mono truncate">{ws.code}</p>
                        </div>
                    </div>

                    {/* Action Menu */}
                    <div className="relative flex-shrink-0" ref={menuRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50">
                                {menuItems.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); item.action(); setMenuOpen(false); }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${(item as any).danger
                                            ? 'text-red-600 hover:bg-red-50'
                                            : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                {ws.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">{ws.description}</p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                        <Users className="h-3.5 w-3.5 text-blue-500 mb-1" />
                        <span className="text-sm font-bold text-gray-900">{stats?.memberCount ?? '—'}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">Members</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                        <FileText className="h-3.5 w-3.5 text-emerald-500 mb-1" />
                        <span className="text-sm font-bold text-gray-900">{stats?.documentCount ?? '—'}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">Documents</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                        <HardDrive className="h-3.5 w-3.5 text-purple-500 mb-1" />
                        <span className="text-sm font-bold text-gray-900">{stats ? formatBytes(stats.totalSizeBytes) : '—'}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">Size</span>
                    </div>
                </div>

                {/* Footer — Owner + Time */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    {ws.createdBy ? (
                        <div className="flex items-center gap-2 min-w-0">
                            <UserAvatar
                                user={{
                                    firstName: ws.createdBy.firstName,
                                    lastName: ws.createdBy.lastName,
                                    email: ws.createdBy.email,
                                    imgUrl: ws.createdBy.imageUrl,
                                }}
                                size="xs"
                                showTooltip
                            />
                            <div className="min-w-0">
                                <span className="text-xs font-medium text-gray-700 truncate block">
                                    {ws.createdBy.firstName} {ws.createdBy.lastName}
                                </span>
                                <span className="text-[10px] text-gray-400">Owner</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Users className="h-3.5 w-3.5" />
                            <span>Unknown owner</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(ws.createdAt)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
