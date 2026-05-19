'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Clock, Shield, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { recordsManagementService, RetentionPolicyDto, RetentionPolicyRequest } from '@/api/services/recordsManagementService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function RetentionPoliciesPage() {
    const [policies, setPolicies] = useState<RetentionPolicyDto[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<RetentionPolicyDto | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const [form, setForm] = useState<RetentionPolicyRequest>({
        name: '', code: '', description: '', retentionYears: 0, retentionMonths: 0, retentionDays: 0,
        triggerType: 'CREATION_DATE', dispositionAction: 'REVIEW',
        contentLockedDefault: true, metadataLockedDefault: false, versioningAllowedDefault: true, isActive: true,
    });

    const loadPolicies = useCallback(async () => {
        try {
            setLoading(true);
            const res = await recordsManagementService.getRetentionPolicies(page, 10, search || undefined);
            setPolicies(res.content);
            setTotalPages(res.totalPages);
        } catch { toast.error('Failed to load policies'); }
        finally { setLoading(false); }
    }, [page, search]);

    useEffect(() => { loadPolicies(); }, [loadPolicies]);

    const openCreate = () => {
        setEditingPolicy(null);
        setForm({
            name: '', code: '', description: '', retentionYears: 0, retentionMonths: 0, retentionDays: 0,
            triggerType: 'CREATION_DATE', dispositionAction: 'REVIEW',
            contentLockedDefault: true, metadataLockedDefault: false, versioningAllowedDefault: true, isActive: true
        });
        setDialogOpen(true);
    };

    const openEdit = (p: RetentionPolicyDto) => {
        setEditingPolicy(p);
        setForm({
            name: p.name, code: p.code, description: p.description || '', retentionYears: p.retentionYears,
            retentionMonths: p.retentionMonths, retentionDays: p.retentionDays,
            triggerType: p.triggerType, dispositionAction: p.dispositionAction,
            contentLockedDefault: p.contentLockedDefault, metadataLockedDefault: p.metadataLockedDefault,
            versioningAllowedDefault: p.versioningAllowedDefault, isActive: p.active,
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        // Validation
        if (!form.name.trim()) { toast.error('Name is required'); return; }
        if (!form.code.trim()) { toast.error('Code is required'); return; }
        if (((form.retentionYears ?? 0) + (form.retentionMonths ?? 0) + (form.retentionDays ?? 0)) <= 0) {
            toast.error('Retention duration must be at least 1 day, 1 month, or 1 year'); return;
        }
        try {
            if (editingPolicy) {
                await recordsManagementService.updateRetentionPolicy(editingPolicy.id, form);
                toast.success('Policy updated');
            } else {
                await recordsManagementService.createRetentionPolicy(form);
                toast.success('Policy created');
            }
            setDialogOpen(false);
            loadPolicies();
        } catch (err: any) { toast.error(err?.message || 'Failed to save'); }
    };

    const handleDelete = async (id: number) => {
        try {
            await recordsManagementService.deleteRetentionPolicy(id);
            toast.success('Policy deleted');
            setDeleteConfirm(null);
            // Fix: auto-decrement page if deleting last item on current page
            if (policies.length === 1 && page > 0) {
                setPage(p => p - 1);
            } else {
                loadPolicies();
            }
        } catch (err: any) { toast.error(err?.message || 'Cannot delete — policy in use'); }
    };

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="h-6 w-6 text-teal-600" /> Retention Policies
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Define document retention schedules and disposition rules</p>
                </div>
                <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> New Policy</Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search policies..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Code</th>
                            <th className="px-4 py-3 text-left">Duration</th>
                            <th className="px-4 py-3 text-left">Trigger</th>
                            <th className="px-4 py-3 text-left">Disposition</th>
                            <th className="px-4 py-3 text-center">Locks</th>
                            <th className="px-4 py-3 text-center">Docs</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                            ))
                        ) : policies.length === 0 ? (
                            <tr><td colSpan={9} className="text-center py-12 text-gray-400">No retention policies found</td></tr>
                        ) : policies.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.code}</td>
                                <td className="px-4 py-3 text-gray-600">{p.formattedDuration || '—'}</td>
                                <td className="px-4 py-3 text-xs text-gray-500">{p.triggerType}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDispositionColor(p.dispositionAction)}`}>
                                        {p.dispositionAction}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex justify-center gap-1">
                                        {p.contentLockedDefault && <span title="Content Locked" className="w-2 h-2 rounded-full bg-red-400" />}
                                        {p.metadataLockedDefault && <span title="Metadata Locked" className="w-2 h-2 rounded-full bg-amber-400" />}
                                        {!p.versioningAllowedDefault && <span title="Versioning Disabled" className="w-2 h-2 rounded-full bg-purple-400" />}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center font-semibold text-gray-700">{p.documentCount}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {p.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded" title="Edit">
                                            <Edit className="h-3.5 w-3.5 text-gray-500" />
                                        </button>
                                        <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 hover:bg-red-50 rounded" title="Delete">
                                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                        </button>
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
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingPolicy ? 'Edit' : 'Create'} Retention Policy</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-600">Name *</label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600">Code *</label>
                                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">Description</label>
                            <textarea className="w-full border rounded-md p-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-600">Years</label>
                                <Input type="number" min={0} value={form.retentionYears} onChange={(e) => setForm({ ...form, retentionYears: +e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600">Months</label>
                                <Input type="number" min={0} value={form.retentionMonths} onChange={(e) => setForm({ ...form, retentionMonths: +e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600">Days</label>
                                <Input type="number" min={0} value={form.retentionDays} onChange={(e) => setForm({ ...form, retentionDays: +e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-600">Trigger Type</label>
                                <select className="w-full border rounded-md p-2 text-sm" value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value as any })}>
                                    <option value="CREATION_DATE">Creation Date</option>
                                    <option value="LAST_MODIFIED">Last Modified</option>
                                    <option value="RECORD_DECLARATION">Record Declaration</option>
                                    <option value="WORKFLOW_COMPLETION">Workflow Completion</option>
                                    <option value="CUSTOM_DATE_FIELD">Custom Date Field</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600">Disposition Action</label>
                                <select className="w-full border rounded-md p-2 text-sm" value={form.dispositionAction} onChange={(e) => setForm({ ...form, dispositionAction: e.target.value as any })}>
                                    <option value="REVIEW">Review</option>
                                    <option value="ARCHIVE">Archive</option>
                                    <option value="DESTROY">Destroy</option>
                                    <option value="TRANSFER">Transfer</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={form.contentLockedDefault} onChange={(e) => setForm({ ...form, contentLockedDefault: e.target.checked })} />
                                Content Locked
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={form.metadataLockedDefault} onChange={(e) => setForm({ ...form, metadataLockedDefault: e.target.checked })} />
                                Metadata Locked
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={form.versioningAllowedDefault} onChange={(e) => setForm({ ...form, versioningAllowedDefault: e.target.checked })} />
                                Versioning Allowed
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>{editingPolicy ? 'Update' : 'Create'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Delete Policy?</DialogTitle></DialogHeader>
                    <p className="text-sm text-gray-600 py-2">This action cannot be undone. Policies in use cannot be deleted.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getDispositionColor(type: string): string {
    const map: Record<string, string> = {
        ARCHIVE: 'bg-purple-100 text-purple-700', DESTROY: 'bg-red-100 text-red-700',
        TRANSFER: 'bg-blue-100 text-blue-700', REVIEW: 'bg-amber-100 text-amber-700',
    };
    return map[type] || 'bg-gray-100 text-gray-700';
}
