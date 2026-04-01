'use client';

import React, { useMemo } from 'react';
import {
    FileText, FolderOpen, Users, HardDrive, Shield, Clock, TrendingUp,
    Eye, Pencil, Crown, UserCog, ClipboardList, Download, Printer,
    Globe, Link2, Droplets, ScanLine, Activity, Calendar, CheckCircle2, XCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type {
    WorkspaceAnalyticsDto, WorkspaceMemberDto, WorkspacePolicyDto, WorkspaceRole,
} from '@/api/services/workspaceService';

// ─── Props ────────────────────────────────────────────────────────────────────
interface WorkspaceAnalyticsTabProps {
    analytics: WorkspaceAnalyticsDto | null;
    members: WorkspaceMemberDto[];
    policy: WorkspacePolicyDto | null;
    createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    OWNER: { label: 'Owner', color: '#d97706', bg: '#fef3c7', icon: Crown },
    MANAGER: { label: 'Manager', color: '#2563eb', bg: '#dbeafe', icon: UserCog },
    CONTRIBUTOR: { label: 'Contributor', color: '#0284c7', bg: '#e0f2fe', icon: Pencil },
    READER: { label: 'Reader', color: '#059669', bg: '#d1fae5', icon: Eye },
    AUDITOR: { label: 'Auditor', color: '#7c3aed', bg: '#ede9fe', icon: ClipboardList },
};

const ROLE_CHART_COLORS = ['#f59e0b', '#3b82f6', '#0ea5e9', '#10b981', '#8b5cf6'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
}

function daysSince(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string;
    iconBg: string; iconColor: string;
}) {
    return (
        <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-0">
                <div className="flex items-center gap-4 p-5">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
                        <Icon className="h-6 w-6" style={{ color: iconColor }} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">{label}</p>
                    </div>
                </div>
                {sub && (
                    <div className="px-5 py-2 bg-gray-50 border-t border-gray-100">
                        <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Donut Chart (pure CSS/SVG) ───────────────────────────────────────────────
function DonutChart({ segments, total, centerLabel }: {
    segments: { label: string; value: number; color: string }[];
    total: number; centerLabel: string;
}) {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return (
        <div className="relative w-36 h-36 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="12" />
                {segments.map((seg, i) => {
                    const pct = total > 0 ? seg.value / total : 0;
                    const dashLength = pct * circumference;
                    const offset = accumulatedOffset;
                    accumulatedOffset += dashLength;
                    return (
                        <circle key={i} cx="50" cy="50" r={radius} fill="none"
                            stroke={seg.color} strokeWidth="12" strokeLinecap="round"
                            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                            strokeDashoffset={-offset}
                            className="transition-all duration-700"
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{total}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">{centerLabel}</span>
            </div>
        </div>
    );
}

// ─── Bar Item ─────────────────────────────────────────────────────────────────
function HorizontalBar({ label, value, max, color, suffix = '' }: {
    label: string; value: number; max: number; color: string; suffix?: string;
}) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">{label}</span>
                <span className="text-gray-500 tabular-nums">{value}{suffix}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
        </div>
    );
}

// ─── Policy Badge ─────────────────────────────────────────────────────────────
function PolicyBadge({ label, enabled, icon: Icon }: {
    label: string; enabled: boolean; icon: React.ElementType;
}) {
    return (
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${enabled
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-500'
            }`}>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium truncate">{label}</span>
            {enabled
                ? <CheckCircle2 className="h-3.5 w-3.5 ml-auto shrink-0 text-emerald-500" />
                : <XCircle className="h-3.5 w-3.5 ml-auto shrink-0 text-red-400" />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function WorkspaceAnalyticsTab({
    analytics, members, policy, createdAt,
}: WorkspaceAnalyticsTabProps) {

    if (!analytics) return <div className="text-sm text-gray-500 py-8 text-center">Loading analytics...</div>;

    // ── Member role breakdown ──────────────────────────────────────────────────
    const roleSegments = (Object.entries(analytics.membersByRole || {})
        .sort((a, b) => b[1] - a[1]) || []).map(([role, count], i) => ({
            label: ROLE_META[role]?.label || role,
            value: count as number,
            color: ROLE_CHART_COLORS[i % ROLE_CHART_COLORS.length],
        }));

    // ── Principal type breakdown ───────────────────────────────────────────────
    const principalCounts = analytics.membersByPrincipalType || {};

    // ── Content breakdown ──────────────────────────────────────────────────────
    const docCount = analytics.documentCount ?? 0;
    const folderCount = analytics.folderCount ?? 0;
    const totalItems = docCount + folderCount;
    const totalSize = analytics.totalSizeBytes ?? 0;

    const contentSegments = [
        { label: 'Documents', value: docCount, color: '#3b82f6' },
        { label: 'Folders', value: folderCount, color: '#f59e0b' },
    ];

    const age = createdAt ? daysSince(createdAt) : 0;

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Workspace Analytics</h3>
                    <p className="text-sm text-gray-400 mt-0.5">Overview of workspace activity and configuration</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">
                        Created {createdAt ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                        {age > 0 && <span className="text-gray-400"> · {age}d ago</span>}
                    </span>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={FileText} label="Documents" value={docCount}
                    sub={`${(docCount / Math.max(folderCount, 1)).toFixed(1)} docs per folder`}
                    iconBg="#dbeafe" iconColor="#2563eb" />
                <StatCard icon={FolderOpen} label="Folders" value={folderCount}
                    sub={`${totalItems} total items`}
                    iconBg="#fef3c7" iconColor="#d97706" />
                <StatCard icon={Users} label="Members" value={analytics.memberCount}
                    sub={`${Object.keys(analytics.membersByRole || {}).length} role(s) configured`}
                    iconBg="#d1fae5" iconColor="#059669" />
                <StatCard icon={HardDrive} label="Storage" value={formatBytes(totalSize)}
                    sub={docCount > 0 ? `~${formatBytes(Math.round(totalSize / docCount))} per doc` : 'No documents yet'}
                    iconBg="#ede9fe" iconColor="#7c3aed" />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Content Breakdown (Donut) */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-5 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />Content Breakdown
                        </h4>
                        <div className="flex items-center gap-8">
                            <DonutChart segments={contentSegments} total={totalItems} centerLabel="Items" />
                            <div className="space-y-3 flex-1">
                                {contentSegments.map(seg => (
                                    <div key={seg.label} className="flex items-center gap-3">
                                        <div className="h-3 w-3 rounded-full shrink-0" style={{ background: seg.color }} />
                                        <span className="text-sm text-gray-600 flex-1">{seg.label}</span>
                                        <span className="text-sm font-semibold text-gray-900 tabular-nums">{seg.value}</span>
                                        <span className="text-xs text-gray-400 w-10 text-right tabular-nums">
                                            {totalItems > 0 ? Math.round((seg.value / totalItems) * 100) : 0}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Members by Role (Donut + Legend) */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-5 flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-500" />Members by Role
                        </h4>
                        {analytics.memberCount > 0 ? (
                            <div className="flex items-center gap-8">
                                <DonutChart segments={roleSegments} total={analytics.memberCount} centerLabel="Members" />
                                <div className="space-y-2 flex-1">
                                    {Object.entries(analytics.membersByRole).map(([key, count]) => {
                                        const meta = ROLE_META[key];
                                        const Icon = meta?.icon || Users;
                                        return (
                                            <div key={key} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                                                    style={{ background: meta?.bg || '#f3f4f6' }}>
                                                    <Icon className="h-3.5 w-3.5" style={{ color: meta?.color || '#6b7280' }} />
                                                </div>
                                                <span className="text-sm text-gray-600 flex-1">{meta?.label || key}</span>
                                                <span className="text-sm font-semibold text-gray-900 tabular-nums">{count as number}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">No members yet</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Members by Principal Type (horizontal bars) ── */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-5 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-500" />Members by Principal Type
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <HorizontalBar label="Users" value={principalCounts['USER'] || 0} max={analytics.memberCount} color="#3b82f6" />
                        <HorizontalBar label="Groups" value={principalCounts['GROUP'] || 0} max={analytics.memberCount} color="#10b981" />
                        <HorizontalBar label="Roles" value={principalCounts['ROLE'] || 0} max={analytics.memberCount} color="#f59e0b" />
                        <HorizontalBar label="Org Units" value={principalCounts['ORG_UNIT'] || 0} max={analytics.memberCount} color="#8b5cf6" />
                    </div>
                </CardContent>
            </Card>

            {/* ── Policy Overview ── */}
            {policy && (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-5 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-indigo-500" />Governance Policy
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            <PolicyBadge label="Download" enabled={policy.downloadAllowed} icon={Download} />
                            <PolicyBadge label="Print" enabled={policy.printAllowed} icon={Printer} />
                            <PolicyBadge label="Export" enabled={policy.exportAllowed} icon={TrendingUp} />
                            <PolicyBadge label="External Sharing" enabled={policy.externalSharingAllowed} icon={Globe} />
                            <PolicyBadge label="External Links" enabled={policy.externalLinkAllowed} icon={Link2} />
                            <PolicyBadge label="Watermark" enabled={policy.watermarkRequired} icon={Droplets} />
                            <PolicyBadge label="Virus Scan" enabled={policy.virusScanRequired} icon={ScanLine} />
                            <PolicyBadge label="View Audit" enabled={policy.viewAuditRequired} icon={Eye} />
                            <PolicyBadge label="Edit Documents" enabled={policy.canEditDocuments ?? true} icon={Pencil} />
                            <PolicyBadge label="Create Folders" enabled={policy.canCreateFolders ?? true} icon={FolderOpen} />
                            <PolicyBadge label="Upload Documents" enabled={policy.canUploadDocuments ?? true} icon={FileText} />
                            <PolicyBadge label="Versioning Required" enabled={policy.versioningRequired} icon={Activity} />
                        </div>
                        {policy.maxFileSizeBytes && (
                            <div className="mt-4 px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-3">
                                <HardDrive className="h-4 w-4 text-indigo-500" />
                                <span className="text-sm text-indigo-700 font-medium">
                                    Max file size: {(policy.maxFileSizeBytes / 1048576).toFixed(0)} MB
                                </span>
                            </div>
                        )}
                        {policy.allowedFileTypes && policy.allowedFileTypes.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Allowed File Types</p>
                                <div className="flex flex-wrap gap-2">
                                    {policy.allowedFileTypes.map(t => (
                                        <span key={t.id} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 shadow-sm">
                                            {t.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {policy.allowedFilingCategories && policy.allowedFilingCategories.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Allowed Document Models</p>
                                <div className="flex flex-wrap gap-2">
                                    {policy.allowedFilingCategories.map(c => (
                                        <span key={c.id} className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-xs font-medium text-blue-600 shadow-sm">
                                            {c.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── Activity Timeline ── */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-5 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-500" />Activity Timeline
                    </h4>
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gray-100" />

                        <div className="space-y-4">
                            <TimelineItem icon={Calendar} color="#3b82f6" bg="#dbeafe"
                                title="Workspace Created"
                                subtitle={createdAt ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                detail={`${age} days ago`} />

                            <TimelineItem icon={Users} color="#059669" bg="#d1fae5"
                                title={`${analytics.memberCount} member(s) assigned`}
                                subtitle={`Across ${Object.keys(analytics.membersByRole).length} role(s): ${Object.keys(analytics.membersByRole).map(r => ROLE_META[r]?.label || r).join(', ')}`} />

                            <TimelineItem icon={FileText} color="#7c3aed" bg="#ede9fe"
                                title={`${docCount} documents uploaded`}
                                subtitle={`Total storage: ${formatBytes(totalSize)}`} />

                            <TimelineItem icon={FolderOpen} color="#d97706" bg="#fef3c7"
                                title={`${folderCount} folders organized`}
                                subtitle={totalItems > 0 ? `Content ratio: ${Math.round((docCount / totalItems) * 100)}% documents, ${Math.round((folderCount / totalItems) * 100)}% folders` : 'No content yet'} />

                            {policy && (
                                <TimelineItem icon={Shield} color="#4f46e5" bg="#e0e7ff"
                                    title="Governance policy configured"
                                    subtitle={`${[
                                        policy.downloadAllowed && 'downloads',
                                        policy.printAllowed && 'print',
                                        policy.exportAllowed && 'export',
                                    ].filter(Boolean).join(', ') || 'restricted'} allowed`} />
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Timeline Item ────────────────────────────────────────────────────────────
function TimelineItem({ icon: Icon, color, bg, title, subtitle, detail }: {
    icon: React.ElementType; color: string; bg: string;
    title: string; subtitle: string; detail?: string;
}) {
    return (
        <div className="flex items-start gap-4 relative pl-1">
            <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm border border-white"
                style={{ background: bg }}>
                <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-medium text-gray-800">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            </div>
            {detail && (
                <span className="text-xs text-gray-400 pt-1 shrink-0">{detail}</span>
            )}
        </div>
    );
}
