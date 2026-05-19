'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, FolderTree, ChevronLeft, ChevronRight } from 'lucide-react';
import { recordsManagementService, RecordCategoryDto, RecordCategoryRequest, RetentionPolicyDto } from '@/api/services/recordsManagementService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function RecordCategoriesPage() {
    const [categories, setCategories] = useState<RecordCategoryDto[]>([]);
    const [policies, setPolicies] = useState<RetentionPolicyDto[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<RecordCategoryDto | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const [form, setForm] = useState<RecordCategoryRequest>({
        name: '', code: '', description: '', retentionPolicyId: 0, isActive: true,
    });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [catRes, polRes] = await Promise.all([
                recordsManagementService.getRecordCategories(page, 10, search || undefined),
                recordsManagementService.getActiveRetentionPolicies(),
            ]);
            setCategories(catRes.content);
            setTotalPages(catRes.totalPages);
            setPolicies(polRes);
        } catch { toast.error('Failed to load categories'); }
        finally { setLoading(false); }
    }, [page, search]);

    useEffect(() => { loadData(); }, [loadData]);

    const openCreate = () => {
        setEditingCat(null);
        setForm({ name: '', code: '', description: '', retentionPolicyId: policies[0]?.id || 0, isActive: true });
        setDialogOpen(true);
    };

    const openEdit = (c: RecordCategoryDto) => {
        setEditingCat(c);
        setForm({ name: c.name, code: c.code, description: c.description || '', parentId: c.parentId ?? undefined, retentionPolicyId: c.retentionPolicyId, isActive: c.active });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        // Validation
        if (!form.name.trim()) { toast.error('Name is required'); return; }
        if (!form.code.trim()) { toast.error('Code is required'); return; }
        if (!form.retentionPolicyId) { toast.error('Retention policy is required'); return; }
        try {
            if (editingCat) {
                await recordsManagementService.updateRecordCategory(editingCat.id, form);
                toast.success('Category updated');
            } else {
                await recordsManagementService.createRecordCategory(form);
                toast.success('Category created');
            }
            setDialogOpen(false);
            loadData();
        } catch (err: any) { toast.error(err?.message || 'Failed to save'); }
    };

    const handleDelete = async (id: number) => {
        try {
            await recordsManagementService.deleteRecordCategory(id);
            toast.success('Category deleted');
            setDeleteConfirm(null);
            if (categories.length === 1 && page > 0) {
                setPage(p => p - 1);
            } else {
                loadData();
            }
        } catch (err: any) { toast.error(err?.message || 'Cannot delete — category in use'); }
    };

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FolderTree className="h-6 w-6 text-indigo-600" /> Record Categories
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Classify records by category with associated retention policies</p>
                </div>
                <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> New Category</Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search categories..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Code</th>
                            <th className="px-4 py-3 text-left">Parent</th>
                            <th className="px-4 py-3 text-left">Retention Policy</th>
                            <th className="px-4 py-3 text-left">Duration</th>
                            <th className="px-4 py-3 text-center">Docs</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            [...Array(5)].map((_, i) => <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
                        ) : categories.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-12 text-gray-400">No record categories found</td></tr>
                        ) : categories.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.code}</td>
                                <td className="px-4 py-3 text-gray-500 text-sm">{c.parentName || '—'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{c.retentionPolicyName || '—'}</td>
                                <td className="px-4 py-3 text-xs text-gray-500">{c.retentionDuration || '—'}</td>
                                <td className="px-4 py-3 text-center font-semibold text-gray-700">{c.documentCount}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {c.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded"><Edit className="h-3.5 w-3.5 text-gray-500" /></button>
                                        <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
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
                    <DialogHeader><DialogTitle>{editingCat ? 'Edit' : 'Create'} Record Category</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-xs font-medium text-gray-600">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                            <div><label className="text-xs font-medium text-gray-600">Code *</label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">Description</label>
                            <textarea className="w-full border rounded-md p-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">Retention Policy *</label>
                            <select className="w-full border rounded-md p-2 text-sm" value={form.retentionPolicyId} onChange={(e) => setForm({ ...form, retentionPolicyId: +e.target.value })}>
                                {policies.map(p => <option key={p.id} value={p.id}>{p.name} ({p.formattedDuration})</option>)}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>{editingCat ? 'Update' : 'Create'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Delete Category?</DialogTitle></DialogHeader>
                    <p className="text-sm text-gray-600 py-2">Categories in use cannot be deleted.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
