'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Tag, ChevronLeft, ChevronRight, FolderInput, Zap, Archive, Flame, Clock, ShieldCheck } from 'lucide-react';
import { classificationService, ClassificationTypeDto, ClassificationTypeRequest } from '@/api/services/classificationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ClassificationTypesPage() {
    const [types, setTypes] = useState<ClassificationTypeDto[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<ClassificationTypeDto | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    // TODO: Replace with actual workspace selector
    const [workspaceId] = useState<string>('');

    const [form, setForm] = useState<ClassificationTypeRequest>({
        name: '', code: '', description: '', targetFolderId: null,
        color: '#6366f1', icon: 'tag', autoMove: false, isActive: true,
        retentionYears: 0, retentionMonths: 0, retentionDays: 0,
        retentionTrigger: 'CREATION_DATE', dispositionAction: 'ARCHIVE',
        autoDeclareRecord: false, recordCategoryId: null,
    });

    const loadTypes = useCallback(async () => {
        if (!workspaceId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const res = await classificationService.getTypes(workspaceId, page, 10, search || undefined);
            setTypes(res.content || []);
            setTotalPages(res.totalPages || 0);
        } catch { toast.error('Failed to load classification types'); }
        finally { setLoading(false); }
    }, [page, search, workspaceId]);

    useEffect(() => { loadTypes(); }, [loadTypes]);

    const openCreate = () => {
        setEditingType(null);
        setForm({
            name: '', code: '', description: '', targetFolderId: null,
            color: '#6366f1', icon: 'tag', autoMove: false, isActive: true,
            retentionYears: 0, retentionMonths: 0, retentionDays: 0,
            retentionTrigger: 'CREATION_DATE', dispositionAction: 'ARCHIVE',
            autoDeclareRecord: false, recordCategoryId: null,
        });
        setDialogOpen(true);
    };

    const openEdit = (t: ClassificationTypeDto) => {
        setEditingType(t);
        setForm({
            name: t.name, code: t.code, description: t.description || '',
            targetFolderId: t.targetFolderId, color: t.color, icon: t.icon,
            autoMove: t.autoMove, isActive: t.active,
            retentionYears: t.retentionYears || 0, retentionMonths: t.retentionMonths || 0,
            retentionDays: t.retentionDays || 0, retentionTrigger: t.retentionTrigger || 'CREATION_DATE',
            dispositionAction: t.dispositionAction || 'ARCHIVE',
            autoDeclareRecord: t.autoDeclareRecord || false,
            recordCategoryId: t.recordCategoryId || null,
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Name is required'); return; }
        if (!form.code.trim()) { toast.error('Code is required'); return; }
        try {
            if (editingType) {
                await classificationService.updateType(editingType.id, form);
                toast.success('Classification type updated');
            } else {
                await classificationService.createType(workspaceId, form);
                toast.success('Classification type created');
            }
            setDialogOpen(false);
            loadTypes();
        } catch (err: any) { toast.error(err?.response?.data?.message || err?.message || 'Failed to save'); }
    };

    const handleDelete = async (id: number) => {
        try {
            await classificationService.deleteType(id);
            toast.success('Classification type deleted');
            setDeleteConfirm(null);
            if (types.length === 1 && page > 0) {
                setPage(p => p - 1);
            } else {
                loadTypes();
            }
        } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to delete'); }
    };

    const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#3b82f6', '#8b5cf6', '#ef4444', '#10b981'];

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Tag className="h-6 w-6 text-indigo-600" /> Classification Types
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Define document types with routing rules for workspace folders</p>
                </div>
                <Button onClick={openCreate} className="gap-2" disabled={!workspaceId}>
                    <Plus className="h-4 w-4" /> New Type
                </Button>
            </div>

            {!workspaceId && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
                    <p className="text-amber-700 font-medium">Select a workspace to manage classification types</p>
                    <p className="text-sm text-amber-600 mt-1">Classification types are workspace-scoped and route to workspace folders only</p>
                </div>
            )}

            {workspaceId && (
                <>
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search types..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
                    </div>

                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Type</th>
                                    <th className="px-4 py-3 text-left">Code</th>
                                    <th className="px-4 py-3 text-left">Target Folder</th>
                                    <th className="px-4 py-3 text-center">Retention</th>
                                    <th className="px-4 py-3 text-center">Disposition</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                                    ))
                                ) : types.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">No classification types found</td></tr>
                                ) : types.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                                                <span className="font-medium text-gray-900">{t.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.code}</td>
                                        <td className="px-4 py-3">
                                            {t.targetFolderName ? (
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <FolderInput className="h-3.5 w-3.5 text-indigo-400" />
                                                    <span className="text-xs">{t.targetFolderName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">No target</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs font-medium text-gray-700">{t.formattedRetention}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {t.dispositionAction === 'DESTROY' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                                    <Flame className="h-3 w-3" /> Destroy
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                                    <Archive className="h-3 w-3" /> Archive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {t.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 rounded" title="Edit">
                                                    <Edit className="h-3.5 w-3.5 text-gray-500" />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(t.id)} className="p-1.5 hover:bg-red-50 rounded" title="Delete">
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
                </>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingType ? 'Edit' : 'Create'} Classification Type</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-600">Name *</label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600">Code *</label>
                                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">Description</label>
                            <textarea className="w-full border rounded-md p-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">Target Folder ID</label>
                            <Input type="number" value={form.targetFolderId ?? ''} onChange={(e) => setForm({ ...form, targetFolderId: e.target.value ? +e.target.value : null })} placeholder="Enter workspace folder ID" />
                            <p className="text-xs text-gray-400 mt-1">Only workspace folders are allowed as targets</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-2">Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {COLORS.map(c => (
                                    <button key={c} onClick={() => setForm({ ...form, color: c })}
                                        className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }} />
                                ))}
                                <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                                    className="w-7 h-7 p-0 border-0 cursor-pointer" />
                            </div>
                        </div>
                        {/* ── Retention ── */}
                        <div className="border-t pt-3 mt-1">
                            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-2"><Clock className="h-3.5 w-3.5" /> Retention Period</label>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">Years</label>
                                    <Input type="number" min={0} value={form.retentionYears ?? 0} onChange={(e) => setForm({ ...form, retentionYears: +e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Months</label>
                                    <Input type="number" min={0} value={form.retentionMonths ?? 0} onChange={(e) => setForm({ ...form, retentionMonths: +e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Days</label>
                                    <Input type="number" min={0} value={form.retentionDays ?? 0} onChange={(e) => setForm({ ...form, retentionDays: +e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-600">Retention Trigger</label>
                                <select className="w-full border rounded-md p-2 text-sm bg-white" value={form.retentionTrigger} onChange={(e) => setForm({ ...form, retentionTrigger: e.target.value })}>
                                    <option value="CREATION_DATE">Creation Date</option>
                                    <option value="LAST_MODIFIED">Last Modified</option>
                                    <option value="CLASSIFICATION_DATE">Classification Date</option>
                                    <option value="RECORD_DECLARATION">Record Declaration</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600">Disposition Action</label>
                                <select className="w-full border rounded-md p-2 text-sm bg-white" value={form.dispositionAction} onChange={(e) => setForm({ ...form, dispositionAction: e.target.value })}>
                                    <option value="ARCHIVE">Archive (keep in storage)</option>
                                    <option value="DESTROY">Destroy (permanent deletion)</option>
                                </select>
                            </div>
                        </div>

                        {/* ── Records & Toggles ── */}
                        <div className="border-t pt-3 mt-1">
                            <div>
                                <label className="text-xs font-medium text-gray-600">Record Category ID</label>
                                <Input type="number" value={form.recordCategoryId ?? ''} onChange={(e) => setForm({ ...form, recordCategoryId: e.target.value ? +e.target.value : null })} placeholder="Optional — auto-assign on classify" />
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm flex-wrap">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={form.autoMove} onChange={(e) => setForm({ ...form, autoMove: e.target.checked })} />
                                <Zap className="h-3.5 w-3.5 text-indigo-500" /> Auto-move to target folder
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={form.autoDeclareRecord ?? false} onChange={(e) => setForm({ ...form, autoDeclareRecord: e.target.checked })} />
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Auto-declare as Record
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                                Active
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>{editingType ? 'Update' : 'Create'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Delete Classification Type?</DialogTitle></DialogHeader>
                    <p className="text-sm text-gray-600 py-2">This will remove the classification type. Documents already classified will retain their classification.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
