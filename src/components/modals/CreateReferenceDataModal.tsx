'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Briefcase, Shield, Save, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { organizationService, ReferenceDataCategory, ReferenceDataItem, CreateReferenceDataRequest, UpdateReferenceDataRequest } from '@/api/services/organizationService';

interface CreateReferenceDataModalProps {
    isOpen: boolean;
    category: ReferenceDataCategory;
    onClose: () => void;
    onCreated: (item: ReferenceDataItem) => void;
    /** If provided, modal is in edit mode */
    editItem?: ReferenceDataItem | null;
}

const categoryConfig: Record<ReferenceDataCategory, { title: string; icon: React.ReactNode }> = {
    'job-families': { title: 'Job Family', icon: <Briefcase className="h-5 w-5 text-primary" /> },
    'employment-types': { title: 'Employment Type', icon: <Briefcase className="h-5 w-5 text-primary" /> },
    'clearance-levels': { title: 'Clearance Level', icon: <Shield className="h-5 w-5 text-primary" /> },
    'cost-centers': { title: 'Cost Center', icon: <DollarSign className="h-5 w-5 text-primary" /> },
};

const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6',
];

export default function CreateReferenceDataModal({
    isOpen, category, onClose, onCreated, editItem,
}: CreateReferenceDataModalProps) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [levelRank, setLevelRank] = useState('');
    const [color, setColor] = useState('#3B82F6');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEdit = !!editItem;
    const isClearance = category === 'clearance-levels';
    const { title, icon } = categoryConfig[category];

    // Populate form when editing
    useEffect(() => {
        if (editItem) {
            setName(editItem.name || '');
            setCode(editItem.code || '');
            setDescription(editItem.description || '');
            setSortOrder(editItem.sortOrder?.toString() || '');
            setLevelRank(editItem.levelRank?.toString() || '');
            setColor(editItem.color || '#3B82F6');
        } else {
            resetForm();
        }
    }, [editItem, isOpen]);

    const handleNameChange = (value: string) => {
        setName(value);
        if (!isEdit) {
            setCode(value.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, ''));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !code.trim()) { setError('Name and code are required'); return; }
        if (isClearance && !levelRank.trim()) { setError('Level rank is required for clearance levels'); return; }

        setIsSaving(true);
        setError(null);

        try {
            let result: ReferenceDataItem;
            if (isEdit) {
                const updateData: UpdateReferenceDataRequest = {
                    code: code.trim(),
                    name: name.trim(),
                    description: description.trim() || undefined,
                    sortOrder: sortOrder ? parseInt(sortOrder) : undefined,
                };
                if (isClearance) {
                    updateData.levelRank = levelRank ? parseInt(levelRank) : undefined;
                    updateData.color = color;
                }
                result = await organizationService.updateReferenceData(category, editItem!.id, updateData);
            } else {
                const createData: CreateReferenceDataRequest = {
                    code: code.trim(),
                    name: name.trim(),
                    description: description.trim() || undefined,
                    sortOrder: sortOrder ? parseInt(sortOrder) : undefined,
                };
                if (isClearance) {
                    createData.levelRank = levelRank ? parseInt(levelRank) : undefined;
                    createData.color = color;
                }
                result = await organizationService.createReferenceData(category, createData);
            }
            onCreated(result);
            resetForm();
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || `Failed to ${isEdit ? 'update' : 'create'} ${title.toLowerCase()}.`;
            setError(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setName(''); setCode(''); setDescription(''); setSortOrder('');
        setLevelRank(''); setColor('#3B82F6'); setError(null);
    };

    const handleClose = () => { if (!isSaving) { resetForm(); onClose(); } };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <Card className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-2">
                        {icon}
                        <h2 className="text-lg font-semibold">{isEdit ? 'Edit' : 'Create New'} {title}</h2>
                    </div>
                    <button onClick={handleClose} disabled={isSaving} className="p-1 hover:bg-muted rounded-full transition-colors disabled:opacity-50">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="refName">Name <span className="text-red-500">*</span></Label>
                        <Input id="refName" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder={`Enter ${title.toLowerCase()} name...`} disabled={isSaving} required />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="refCode">Code <span className="text-red-500">*</span></Label>
                        <Input id="refCode" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="AUTO_GENERATED" disabled={isSaving} required className="font-mono text-sm" />
                        {!isEdit && <p className="text-xs text-muted-foreground">Auto-generated from name. Uppercase letters, digits, underscores.</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="refDescription">Description</Label>
                        <Input id="refDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." disabled={isSaving} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="refSortOrder">Sort Order</Label>
                        <Input id="refSortOrder" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" disabled={isSaving} />
                    </div>

                    {/* Clearance-specific */}
                    {isClearance && (
                        <>
                            <div className="space-y-1">
                                <Label htmlFor="refLevelRank">Level Rank <span className="text-red-500">*</span></Label>
                                <Input id="refLevelRank" type="number" value={levelRank} onChange={(e) => setLevelRank(e.target.value)} placeholder="1" disabled={isSaving} required />
                                <p className="text-xs text-muted-foreground">Higher rank = higher clearance</p>
                            </div>
                            <div className="space-y-1">
                                <Label>Color</Label>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-2 flex-wrap">
                                        {predefinedColors.map((c) => (
                                            <button key={c} type="button" onClick={() => setColor(c)} disabled={isSaving}
                                                className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-muted hover:border-muted-foreground'}`}
                                                style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={isSaving} className="w-7 h-7 rounded border border-muted cursor-pointer" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Preview */}
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        {isClearance && color && <div className="w-3 h-3 rounded-full border border-muted-foreground/30" style={{ backgroundColor: color }} />}
                        <span className="text-sm font-medium">{name || `${title} Name`}</span>
                        <span className="text-xs text-muted-foreground font-mono">({code || 'CODE'})</span>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded border border-red-200 dark:border-red-800">{error}</div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving} className="flex-1">Cancel</Button>
                        <Button type="submit" disabled={isSaving || !name.trim()} className="flex-1">
                            {isSaving ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {isEdit ? 'Saving...' : 'Creating...'}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {isEdit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    {isEdit ? `Save ${title}` : `Create ${title}`}
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
