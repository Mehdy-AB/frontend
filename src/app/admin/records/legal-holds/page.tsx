'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Lock, Unlock, Shield, ChevronLeft, ChevronRight, FileText, Users } from 'lucide-react';
import { recordsManagementService, LegalHoldDto, LegalHoldRequest } from '@/api/services/recordsManagementService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function LegalHoldsPage() {
    const [holds, setHolds] = useState<LegalHoldDto[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingHold, setEditingHold] = useState<LegalHoldDto | null>(null);
    const [releaseDialog, setReleaseDialog] = useState<number | null>(null);
    const [releaseReason, setReleaseReason] = useState('');

    const [form, setForm] = useState<LegalHoldRequest>({ name: '', description: '', matterId: '' });

    const loadHolds = useCallback(async () => {
        try {
            setLoading(true);
            const res = await recordsManagementService.getLegalHolds(page, 10, search || undefined, statusFilter || undefined);
            setHolds(res.content);
            setTotalPages(res.totalPages);
        } catch { toast.error('Failed to load legal holds'); }
        finally { setLoading(false); }
    }, [page, search, statusFilter]);

    useEffect(() => { loadHolds(); }, [loadHolds]);

    const openCreate = () => {
        setEditingHold(null);
        setForm({ name: '', description: '', matterId: '' });
        setDialogOpen(true);
    };

    const openEdit = (h: LegalHoldDto) => {
        setEditingHold(h);
        setForm({ name: h.name, description: h.description || '', matterId: h.matterId || '' });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Name is required'); return; }
        try {
            if (editingHold) {
                await recordsManagementService.updateLegalHold(editingHold.id, form);
                toast.success('Legal hold updated');
            } else {
                await recordsManagementService.createLegalHold(form);
                toast.success('Legal hold created');
            }
            setDialogOpen(false);
            loadHolds();
        } catch (err: any) { toast.error(err?.message || 'Failed to save'); }
    };

    const handleRelease = async () => {
        if (!releaseDialog || !releaseReason.trim()) return;
        try {
            await recordsManagementService.releaseLegalHold(releaseDialog, releaseReason);
            toast.success('Legal hold released');
            setReleaseDialog(null);
            setReleaseReason('');
            loadHolds();
        } catch (err: any) { toast.error(err?.message || 'Failed to release'); }
    };

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Lock className="h-6 w-6 text-red-600" /> Legal Holds
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Place and manage legal holds to prevent document modification or destruction</p>
                </div>
                <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> New Legal Hold</Button>
            </div>

            <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search holds..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
                </div>
                <select className="border rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="RELEASED">Released</option>
                </select>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Matter ID</th>
                            <th className="px-4 py-3 text-left">Placed By</th>
                            <th className="px-4 py-3 text-left">Placed At</th>
                            <th className="px-4 py-3 text-center">Documents</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
                        ) : holds.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400">No legal holds found</td></tr>
                        ) : holds.map((h) => (
                            <tr key={h.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{h.name}</div>
                                    {h.description && <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{h.description}</div>}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-500">{h.matterId || '—'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{h.placedByName || h.placedBy}</td>
                                <td className="px-4 py-3 text-xs text-gray-500">{new Date(h.placedAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700">
                                        <FileText className="h-3.5 w-3.5" /> {h.documentCount}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${h.status === 'ACTIVE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {h.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        {h.status === 'ACTIVE' && (
                                            <>
                                                <button onClick={() => openEdit(h)} className="p-1.5 hover:bg-gray-100 rounded" title="Edit">
                                                    <Shield className="h-3.5 w-3.5 text-gray-500" />
                                                </button>
                                                <button onClick={() => setReleaseDialog(h.id)} className="p-1.5 hover:bg-green-50 rounded" title="Release">
                                                    <Unlock className="h-3.5 w-3.5 text-green-500" />
                                                </button>
                                            </>
                                        )}
                                        {h.status === 'RELEASED' && h.releasedByName && (
                                            <span className="text-xs text-gray-400">Released by {h.releasedByName}</span>
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

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{editingHold ? 'Edit' : 'Create'} Legal Hold</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div><label className="text-xs font-medium text-gray-600">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                        <div><label className="text-xs font-medium text-gray-600">Matter ID</label><Input value={form.matterId} onChange={(e) => setForm({ ...form, matterId: e.target.value })} placeholder="e.g. CASE-2026-001" /></div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">Description</label>
                            <textarea className="w-full border rounded-md p-2 text-sm" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>{editingHold ? 'Update' : 'Create'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Release Dialog */}
            <Dialog open={releaseDialog !== null} onOpenChange={() => setReleaseDialog(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Release Legal Hold</DialogTitle></DialogHeader>
                    <p className="text-sm text-gray-600">This will release the hold from all associated documents and restore their default lock settings.</p>
                    <div className="mt-3">
                        <label className="text-xs font-medium text-gray-600">Release Reason *</label>
                        <textarea className="w-full border rounded-md p-2 text-sm mt-1" rows={3} value={releaseReason}
                            onChange={(e) => setReleaseReason(e.target.value)} placeholder="Reason for releasing this legal hold..." />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReleaseDialog(null)}>Cancel</Button>
                        <Button onClick={handleRelease} disabled={!releaseReason.trim()} className="bg-green-600 hover:bg-green-700">Release Hold</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
