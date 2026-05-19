'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart3, Clock, FolderTree, Lock, Trash2,
    FileText, Shield, AlertTriangle, Archive, TrendingUp,
    CheckCircle, XCircle, Eye, ArrowRight
} from 'lucide-react';
import { recordsManagementService, RecordsAnalytics } from '@/api/services/recordsManagementService';

export default function RecordsDashboardPage() {
    const router = useRouter();
    const [analytics, setAnalytics] = useState<RecordsAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const data = await recordsManagementService.getDashboardAnalytics();
            setAnalytics(data);
        } catch (err) {
            console.error('Failed to load analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-64 bg-gray-200 rounded" />
                    <div className="grid grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-lg" />)}
                    </div>
                </div>
            </div>
        );
    }

    const a = analytics;

    return (
        <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Archive className="h-7 w-7 text-indigo-600" />
                        Records Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Document lifecycle, retention, compliance & governance dashboard
                    </p>
                </div>
            </div>

            {/* Summary Cards Row 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard icon={FileText} label="Total Documents" value={a?.totalDocuments ?? 0} color="blue" />
                <StatCard icon={Shield} label="Declared Records" value={a?.declaredRecords ?? 0} color="green" />
                <StatCard icon={Archive} label="Archived" value={a?.archivedDocuments ?? 0} color="purple" />
                <StatCard icon={AlertTriangle} label="Pending Disposition" value={a?.pendingDisposition ?? 0} color="amber" />
            </div>

            {/* Summary Cards Row 2 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard icon={Clock} label="Active Policies" value={a?.activeRetentionPolicies ?? 0} subValue={`of ${a?.totalRetentionPolicies ?? 0} total`} color="teal" />
                <StatCard icon={FolderTree} label="Record Categories" value={a?.totalRecordCategories ?? 0} color="indigo" />
                <StatCard icon={Lock} label="Active Legal Holds" value={a?.activeLegalHolds ?? 0} subValue={`${a?.documentsUnderLegalHold ?? 0} docs held`} color="red" />
                <StatCard icon={TrendingUp} label="Expiring Soon" value={a?.documentsExpiringSoon ?? 0} subValue="next 30 days" color="orange" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lifecycle Distribution */}
                <div className="bg-white rounded-xl border shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Lifecycle Distribution
                    </h3>
                    <div className="space-y-3">
                        {a?.lifecycleDistribution && Object.entries(a.lifecycleDistribution).map(([state, count]) => {
                            const total = a?.totalDocuments || 1;
                            const pct = Math.round((count / total) * 100);
                            return (
                                <div key={state} className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-gray-500 w-40 truncate">{state}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                                        <div className={`h-2.5 rounded-full ${getStateColor(state)}`} style={{ width: `${Math.max(pct, 1)}%` }} />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 w-12 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Immutability Stats */}
                <div className="bg-white rounded-xl border shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Lock className="h-4 w-4" /> Immutability Overview
                    </h3>
                    <div className="space-y-4">
                        <ImmutabilityBar label="Content Locked" value={a?.contentLockedDocuments ?? 0} total={a?.totalDocuments ?? 1} color="bg-red-500" />
                        <ImmutabilityBar label="Metadata Locked" value={a?.metadataLockedDocuments ?? 0} total={a?.totalDocuments ?? 1} color="bg-amber-500" />
                        <ImmutabilityBar label="Versioning Disabled" value={a?.versioningDisabledDocuments ?? 0} total={a?.totalDocuments ?? 1} color="bg-purple-500" />
                    </div>

                    <div className="mt-6 pt-4 border-t">
                        <h4 className="text-xs font-semibold text-gray-500 mb-3">Disposition Summary</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-amber-50 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-amber-700">{a?.pendingDispositions ?? 0}</div>
                                <div className="text-xs text-amber-600">Pending</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-green-700">{a?.executedDispositionsLast30Days ?? 0}</div>
                                <div className="text-xs text-green-600">Executed (30d)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Disposition Breakdown */}
            {(a?.dispositionByType?.length ?? 0) > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Dispositions by Type</h3>
                        <div className="space-y-2">
                            {a?.dispositionByType?.map((item) => (
                                <div key={item.type} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">{item.type}</span>
                                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Dispositions by Status</h3>
                        <div className="space-y-2">
                            {a?.dispositionByStatus?.map((item) => (
                                <div key={item.status} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">{item.status}</span>
                                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Navigation */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <NavCard icon={Clock} label="Retention Policies" href="/admin/records/retention-policies" color="teal" onClick={() => router.push('/admin/records/retention-policies')} />
                <NavCard icon={FolderTree} label="Record Categories" href="/admin/records/categories" color="indigo" onClick={() => router.push('/admin/records/categories')} />
                <NavCard icon={Lock} label="Legal Holds" href="/admin/records/legal-holds" color="red" onClick={() => router.push('/admin/records/legal-holds')} />
                <NavCard icon={Trash2} label="Disposition Queue" href="/admin/records/dispositions" color="amber" onClick={() => router.push('/admin/records/dispositions')} />
            </div>
        </div>
    );
}

// ── Helper Components ──

function StatCard({ icon: Icon, label, value, subValue, color }: { icon: any; label: string; value: number; subValue?: string; color: string }) {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600', amber: 'bg-amber-50 text-amber-600',
        teal: 'bg-teal-50 text-teal-600', indigo: 'bg-indigo-50 text-indigo-600',
        red: 'bg-red-50 text-red-600', orange: 'bg-orange-50 text-orange-600',
    };
    return (
        <div className="bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3">
            <div className={`p-2 rounded-lg ${colorMap[color] || 'bg-gray-50 text-gray-600'}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{label}</div>
                {subValue && <div className="text-xs text-gray-400 mt-0.5">{subValue}</div>}
            </div>
        </div>
    );
}

function ImmutabilityBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const pct = Math.round((value / total) * 100);
    return (
        <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{label}</span>
                <span className="font-semibold">{value} ({pct}%)</span>
            </div>
            <div className="bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.max(pct, 1)}%` }} />
            </div>
        </div>
    );
}

function NavCard({ icon: Icon, label, href, color, onClick }: { icon: any; label: string; href: string; color: string; onClick: () => void }) {
    const colorMap: Record<string, string> = {
        teal: 'hover:border-teal-300 hover:bg-teal-50',
        indigo: 'hover:border-indigo-300 hover:bg-indigo-50',
        red: 'hover:border-red-300 hover:bg-red-50',
        amber: 'hover:border-amber-300 hover:bg-amber-50',
    };
    return (
        <button onClick={onClick} className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 transition-all ${colorMap[color]} cursor-pointer`}>
            <Icon className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-800">{label}</span>
            <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
        </button>
    );
}

function getStateColor(state: string): string {
    const map: Record<string, string> = {
        'DRAFT': 'bg-gray-400', 'ACTIVE': 'bg-blue-500', 'DECLARED_RECORD': 'bg-green-500',
        'UNDER_RETENTION': 'bg-teal-500', 'PENDING_DISPOSITION': 'bg-amber-500',
        'ARCHIVED': 'bg-purple-500', 'DESTROYED': 'bg-red-500', 'TRANSFERRED': 'bg-indigo-500',
    };
    return map[state] || 'bg-gray-300';
}
