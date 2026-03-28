'use client';

import { useState } from 'react';
import { X, Send, Globe, ShieldCheck, ChevronRight, ChevronLeft, Shield, Filter, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    workspaceService, WorkspaceType, SubmitWorkspaceRequestPayload, WorkspaceRequestDto,
} from '@/api/services/workspaceService';
import PolicyEditor, { PolicyFormState, defaultPolicyForm } from '@/components/workspace/PolicyEditor';

type Step = 'basics' | 'policy' | 'justification';

interface SubmitRequestModalProps {
    open: boolean;
    onClose: () => void;
    onSubmitted: (request: WorkspaceRequestDto) => void;
}

export default function SubmitRequestModal({ open, onClose, onSubmitted }: SubmitRequestModalProps) {
    const [form, setForm] = useState<SubmitWorkspaceRequestPayload>({
        name: '', code: '', justification: '',
    });
    const [type, setType] = useState<WorkspaceType>('STANDARD');
    const [step, setStep] = useState<Step>('basics');
    const [policyForm, setPolicyForm] = useState<PolicyFormState>({ ...defaultPolicyForm });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!open) return null;

    const update = (key: keyof SubmitWorkspaceRequestPayload, val: string) =>
        setForm(prev => ({ ...prev, [key]: val }));

    const steps: { key: Step; label: string; icon: React.ElementType }[] = [
        { key: 'basics', label: 'Basic Info', icon: Globe },
        { key: 'policy', label: 'Policy', icon: Shield },
        { key: 'justification', label: 'Submit', icon: Send },
    ];

    const stepIndex = steps.findIndex(s => s.key === step);
    const canNext = () => {
        if (step === 'basics') return form.name.trim() && form.code.trim();
        if (step === 'policy') return true;
        if (step === 'justification') return form.justification.trim();
        return false;
    };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.code.trim() || !form.justification.trim()) {
            setError('Name, code, and justification are required');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const payload: SubmitWorkspaceRequestPayload = {
                ...form,
                type,
                // Include policy settings
                downloadAllowed: policyForm.downloadAllowed,
                printAllowed: policyForm.printAllowed,
                exportAllowed: policyForm.exportAllowed,
                externalSharingAllowed: policyForm.externalSharingAllowed,
                externalLinkAllowed: policyForm.externalLinkAllowed,
                watermarkRequired: policyForm.watermarkRequired,
                viewAuditRequired: policyForm.viewAuditRequired,
                breakGlassRequired: policyForm.breakGlassRequired,
                maxFileSizeBytes: policyForm.maxFileSizeMb ? parseInt(policyForm.maxFileSizeMb) * 1048576 : undefined,
                virusScanRequired: policyForm.virusScanRequired,
                ocrMode: policyForm.ocrMode,
                archiveHandling: policyForm.archiveHandling,
                crossWorkspaceAclAllowed: policyForm.crossWorkspaceAclAllowed,
                directUserAclAllowed: policyForm.directUserAclAllowed,
                inheritanceEnforced: policyForm.inheritanceEnforced,
                classificationDefault: policyForm.classificationDefault || undefined,
                versioningRequired: policyForm.versioningRequired,
            };
            const request = await workspaceService.submitRequest(payload);
            onSubmitted(request);
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center">
                            <Send className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Request Workspace</h2>
                            <p className="text-sm text-gray-500">Submit a request with configuration — an admin will review</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
                    {steps.map((s, i) => (
                        <div key={s.key} className="flex items-center gap-2">
                            <button onClick={() => (i <= stepIndex || canNext()) ? setStep(s.key) : undefined}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${step === s.key ? 'bg-blue-500 text-white shadow-sm' :
                                        i < stepIndex ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-200 text-gray-400'}`}>
                                <s.icon className="h-3.5 w-3.5" />
                                {s.label}
                            </button>
                            {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-gray-300" />}
                        </div>
                    ))}
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                    {/* ─── Step 1: Basics ─── */}
                    {step === 'basics' && (
                        <>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Workspace Name <span className="text-red-500">*</span></label>
                                <Input value={form.name} onChange={e => update('name', e.target.value)}
                                    placeholder="e.g. Legal Department Documents" className="rounded-xl h-11" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Code <span className="text-red-500">*</span></label>
                                <Input value={form.code}
                                    onChange={e => update('code', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    placeholder="e.g. legal-docs" className="rounded-xl h-11 font-mono" />
                                <p className="text-xs text-gray-400 mt-1">Unique identifier — lowercase, alphanumeric with hyphens</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Workspace Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {([
                                        { value: 'STANDARD' as const, title: 'Standard', desc: 'General-purpose workspace', icon: Globe },
                                        { value: 'SECURED' as const, title: 'Secured', desc: 'High-sensitivity controls', icon: ShieldCheck },
                                    ]).map(opt => (
                                        <button key={opt.value} type="button" onClick={() => setType(opt.value)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${type === opt.value
                                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                                                : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${type === opt.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    <opt.icon className="h-4 w-4" />
                                                </div>
                                                <span className="font-semibold text-gray-900">{opt.title}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 ml-10">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
                                <textarea value={form.description || ''} onChange={e => update('description', e.target.value)}
                                    placeholder="What will this workspace be used for?" rows={2}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
                            </div>
                        </>
                    )}

                    {/* ─── Step 2: Policy Config ─── */}
                    {step === 'policy' && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Proposed Policy Configuration</h3>
                            <p className="text-xs text-gray-400 mb-4">Configure the policies you'd like for this workspace. The admin may adjust these during approval.</p>
                            <PolicyEditor value={policyForm}
                                onChange={(key, val) => setPolicyForm(prev => ({ ...prev, [key]: val }))}
                                section="all" isSecured={type === 'SECURED'} />
                        </div>
                    )}

                    {/* ─── Step 3: Justification + Review ─── */}
                    {step === 'justification' && (
                        <>
                            {/* Summary */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Request Summary</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <span className="text-gray-400">Name</span><span className="font-medium text-gray-900">{form.name || '—'}</span>
                                    <span className="text-gray-400">Code</span><span className="font-mono text-gray-900">{form.code || '—'}</span>
                                    <span className="text-gray-400">Type</span><span className="text-gray-900">{type}</span>
                                    <span className="text-gray-400">Description</span><span className="text-gray-700">{form.description || '—'}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Justification <span className="text-red-500">*</span></label>
                                <textarea value={form.justification} onChange={e => update('justification', e.target.value)}
                                    placeholder="Explain why this workspace is needed, who will use it, and what documents it will contain..."
                                    rows={4}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <div>
                        {stepIndex > 0 && (
                            <Button variant="outline" onClick={() => setStep(steps[stepIndex - 1].key)} className="rounded-xl">
                                <ChevronLeft className="h-4 w-4 mr-1" />Back
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
                        {stepIndex < steps.length - 1 ? (
                            <Button onClick={() => setStep(steps[stepIndex + 1].key)}
                                disabled={!canNext()}
                                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6">
                                Next<ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit}
                                disabled={loading || !form.name.trim() || !form.code.trim() || !form.justification.trim()}
                                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6">
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
