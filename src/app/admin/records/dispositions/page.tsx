'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, CheckCircle, XCircle, Play, Search, ChevronLeft, ChevronRight, AlertTriangle, FileText } from 'lucide-react';
import { recordsManagementService, DispositionActionDto } from '@/api/services/recordsManagementService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function DispositionsPage() {
    const [dispositions, setDispositions] = useState<DispositionActionDto[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [rejectDialog, setRejectDialog] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [executeConfirm, setExecuteConfirm] = useState<DispositionActionDto | null>(null);

    const loadDispositions = useCallback(async () => {
        try {
            setLoading(true);
            const res = await recordsManagementService.getDispositions(page, 10, statusFilter || undefined, typeFilter || undefined);
            setDispositions(res.content);
            setTotalPages(res.totalPages);
        } catch { toast.error('Failed to load dispositions'); }
        finally { setLoading(false); }
    }, [page, statusFilter, typeFilter]);

    useEffect(() => { loadDispositions(); }, [loadDispositions]);

    const handleApprove = async (id: number) => {
        try {
            await recordsManagementService.approveDisposition(id);
            toast.success('Disposition approved');
            loadDispositions();
        } catch (err: any) { toast.error(err?.message || 'Failed to approve'); }
    };

    const handleReject = async () => {
        if (!rejectDialog || !rejectReason.trim()) return;
        try {
            await recordsManagementService.rejectDisposition(rejectDialog, rejectReason);
            toast.success('Disposition rejected');
            setRejectDialog(null);
            setRejectReason('');
            loadDispositions();
        } catch (err: any) { toast.error(err?.message || 'Failed to reject'); }
    };

    const handleExecute = async () => {
        if (!executeConfirm) return;
        try {
            await recordsManagementService.executeDisposition(executeConfirm.id);
            toast.success(`Document ${executeConfirm.actionType.toLowerCase()}d successfully`);
            setExecuteConfirm(null);
            loadDispositions();
        } catch (err: any) { toast.error(err?.message || 'Failed to execute'); }
    };

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Trash2 className="h-6 w-6 text-amber-600" /> Disposition Queue
                </h1>
                <p className="text-sm text-gray-500 mt-1">Review, approve, and execute document disposition actions</p>
            </div>

            <div className="flex gap-3">
                <select className="border rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="EXECUTED">Executed</option>
                    <option value="REJECTED">Rejected</option>
                </select>
                <select className="border rounded-md px-3 py-2 text-sm" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}>
                    <option value="">All Types</option>
                    <option value="ARCHIVE">Archive</option>
                    <option value="DESTROY">Destroy</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="REVIEW">Review</option>
                </select>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left">Document</th>
                            <th className="px-4 py-3 text-left">Action</th>
                            <th className="px-4 py-3 text-left">Policy</th>
                            <th className="px-4 py-3 text-left">Scheduled</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-left">Handled By</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
                        ) : dispositions.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400">No disposition actions found</td></tr>
                        ) : dispositions.map((d) => (
                            <tr key={d.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">{d.documentName || `Doc #${d.documentId}`}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(d.actionType)}`}>{d.actionType}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">{d.retentionPolicyName || '—'}</td>
                                <td className="px-4 py-3 text-xs text-gray-500">{new Date(d.scheduledAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(d.status)}`}>{d.status}</span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500">
                                    {d.status === 'APPROVED' && d.approvedByName && <span>Approved by {d.approvedByName}</span>}
                                    {d.status === 'EXECUTED' && d.executedByName && <span>Executed by {d.executedByName}</span>}
                                    {d.status === 'REJECTED' && d.rejectedByName && <span title={d.rejectReason || ''}>Rejected by {d.rejectedByName}</span>}
                                    {d.status === 'PENDING' && <span className="text-amber-500">Awaiting review</span>}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        {d.status === 'PENDING' && (
                                            <>
                                                <button onClick={() => handleApprove(d.id)} className="p-1.5 hover:bg-green-50 rounded" title="Approve">
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                </button>
                                                <button onClick={() => setRejectDialog(d.id)} className="p-1.5 hover:bg-red-50 rounded" title="Reject">
                                                    <XCircle className="h-4 w-4 text-red-400" />
                                                </button>
                                            </>
                                        )}
                                        {d.status === 'APPROVED' && (
                                            <button onClick={() => setExecuteConfirm(d)} className="p-1.5 hover:bg-amber-50 rounded" title="Execute">
                                                <Play className="h-4 w-4 text-amber-600" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                        <span className="text-xs text-gray-500">Page {page + 1} of {totalPages}</span>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reject Dialog */}
            <Dialog open={rejectDialog !== null} onOpenChange={() => setRejectDialog(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Reject Disposition</DialogTitle></DialogHeader>
                    <p className="text-sm text-gray-600">The document will be reverted to UNDER_RETENTION state.</p>
                    <div className="mt-3">
                        <label className="text-xs font-medium text-gray-600">Rejection Reason *</label>
                        <textarea className="w-full border rounded-md p-2 text-sm mt-1" rows={3} value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>Reject</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Execute Confirm Dialog */}
            <Dialog open={executeConfirm !== null} onOpenChange={() => setExecuteConfirm(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Execute Disposition</DialogTitle></DialogHeader>
                    <div className="py-2 text-sm text-gray-600">
                        <p>This will <strong>{executeConfirm?.actionType?.toLowerCase()}</strong> document <strong>{executeConfirm?.documentName || `#${executeConfirm?.documentId}`}</strong>.</p>
                        {executeConfirm?.actionType === 'DESTROY' && <p className="text-red-600 mt-2 font-medium">⚠️ This action is irreversible.</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExecuteConfirm(null)}>Cancel</Button>
                        <Button className={executeConfirm?.actionType === 'DESTROY' ? 'bg-red-600 hover:bg-red-700' : ''} onClick={handleExecute}>Execute</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getTypeColor(type: string): string {
    const map: Record<string, string> = {
        ARCHIVE: 'bg-purple-100 text-purple-700', DESTROY: 'bg-red-100 text-red-700',
        TRANSFER: 'bg-blue-100 text-blue-700', REVIEW: 'bg-amber-100 text-amber-700',
    };
    return map[type] || 'bg-gray-100 text-gray-700';
}

function getStatusColor(status: string): string {
    const map: Record<string, string> = {
        PENDING: 'bg-amber-100 text-amber-700', APPROVED: 'bg-blue-100 text-blue-700',
        EXECUTED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700',
        CANCELLED: 'bg-gray-100 text-gray-500',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
}
