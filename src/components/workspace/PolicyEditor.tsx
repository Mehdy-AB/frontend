'use client';

import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

// =====================================================================
// PolicyEditor — Reusable policy form for create + edit workflows
// =====================================================================

export interface PolicyFormState {
    downloadAllowed: boolean;
    printAllowed: boolean;
    exportAllowed: boolean;
    externalSharingAllowed: boolean;
    externalLinkAllowed: boolean;
    watermarkRequired: boolean;
    viewAuditRequired: boolean;
    breakGlassRequired: boolean;
    maxFileSizeMb: string;
    virusScanRequired: boolean;
    ocrMode: string;
    archiveHandling: string;
    crossWorkspaceAclAllowed: boolean;
    directUserAclAllowed: boolean;
    inheritanceEnforced: boolean;
    classificationDefault: string;
    versioningRequired: boolean;
    // Model selections (IDs)
    allowedFileTypeIds: number[];
    allowedFilingCategoryIds: number[];
    defaultFilingCategoryId: number | null;
    allowedWorkflowIds: number[];
}

export const defaultPolicyForm: PolicyFormState = {
    downloadAllowed: true, printAllowed: true, exportAllowed: true,
    externalSharingAllowed: false, externalLinkAllowed: false,
    watermarkRequired: false, viewAuditRequired: false, breakGlassRequired: false,
    maxFileSizeMb: '', virusScanRequired: true, ocrMode: 'CONDITIONAL', archiveHandling: 'ALLOW',
    crossWorkspaceAclAllowed: true, directUserAclAllowed: false, inheritanceEnforced: true,
    classificationDefault: '', versioningRequired: true,
    allowedFileTypeIds: [], allowedFilingCategoryIds: [], defaultFilingCategoryId: null, allowedWorkflowIds: [],
};

// Available model data shape
export interface AvailableModel { id: number; label: string; }

interface PolicyEditorProps {
    value: PolicyFormState;
    onChange: (key: keyof PolicyFormState, val: unknown) => void;
    /** 'security' | 'ingestion' | 'access' | 'all' */
    section?: 'security' | 'ingestion' | 'access' | 'all';
    isSecured?: boolean;
    // Available models for multi-select
    availableFileTypes?: AvailableModel[];
    availableFilingCategories?: AvailableModel[];
    availableWorkflows?: AvailableModel[];
}

// Toggle switch
function Toggle({ label, description, checked, onChange }: {
    label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-gray-700">{label}</p>
                {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
            </div>
            <button type="button" onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
}

export default function PolicyEditor({ value, onChange, section = 'all', isSecured,
    availableFileTypes = [], availableFilingCategories = [], availableWorkflows = [],
}: PolicyEditorProps) {
    const showSecurity = section === 'all' || section === 'security';
    const showIngestion = section === 'all' || section === 'ingestion';
    const showAccess = section === 'all' || section === 'access';

    return (
        <div className="space-y-6">
            {/* ── Security ── */}
            {showSecurity && (
                <div className="space-y-3">
                    <div className="mb-4">
                        <h3 className="text-base font-semibold text-gray-900">Security & Distribution Policy</h3>
                        <p className="text-sm text-gray-500">Control what members can do with documents in this workspace</p>
                    </div>
                    <Toggle label="Allow Download" description="Members can download documents locally"
                        checked={value.downloadAllowed} onChange={v => onChange('downloadAllowed', v)} />
                    <Toggle label="Allow Print" description="Members can print documents"
                        checked={value.printAllowed} onChange={v => onChange('printAllowed', v)} />
                    <Toggle label="Allow Export" description="Members can export documents to external formats"
                        checked={value.exportAllowed} onChange={v => onChange('exportAllowed', v)} />
                    <Toggle label="Allow External Sharing" description="Documents can be shared outside the workspace"
                        checked={value.externalSharingAllowed} onChange={v => onChange('externalSharingAllowed', v)} />
                    <Toggle label="Allow External Links" description="Generate shareable links for external access"
                        checked={value.externalLinkAllowed} onChange={v => onChange('externalLinkAllowed', v)} />
                    <Toggle label="Require Watermark" description="Apply watermarks to downloaded/printed documents"
                        checked={value.watermarkRequired} onChange={v => onChange('watermarkRequired', v)} />
                    <Toggle label="Require View Audit" description="Log every document view for compliance"
                        checked={value.viewAuditRequired} onChange={v => onChange('viewAuditRequired', v)} />
                    <Toggle label="Require Break Glass" description="Elevated access required for sensitive operations"
                        checked={value.breakGlassRequired} onChange={v => onChange('breakGlassRequired', v)} />
                </div>
            )}

            {/* ── Ingestion ── */}
            {showIngestion && (
                <div className="space-y-5">
                    <div className="mb-4">
                        <h3 className="text-base font-semibold text-gray-900">Ingestion & Processing Policy</h3>
                        <p className="text-sm text-gray-500">Control how files are uploaded and processed</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Max File Size (MB)</label>
                        <Input type="number" value={value.maxFileSizeMb}
                            onChange={e => onChange('maxFileSizeMb', e.target.value)}
                            placeholder="Leave empty for system default" className="rounded-xl h-11 w-48" />
                    </div>
                    <Toggle label="Require Virus Scan" description="All uploads are scanned before storage"
                        checked={value.virusScanRequired} onChange={v => onChange('virusScanRequired', v)} />
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">OCR Mode</label>
                        <Select value={value.ocrMode} onValueChange={v => onChange('ocrMode', v)}>
                            <SelectTrigger className="rounded-xl w-64"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="OFF">Off — no OCR processing</SelectItem>
                                <SelectItem value="CONDITIONAL">Conditional — only when no text layer</SelectItem>
                                <SelectItem value="REQUIRED">Required — always OCR all documents</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Archive File Handling</label>
                        <Select value={value.archiveHandling} onValueChange={v => onChange('archiveHandling', v)}>
                            <SelectTrigger className="rounded-xl w-64"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALLOW">Allow — accept archive uploads</SelectItem>
                                <SelectItem value="BLOCK">Block — reject archive files</SelectItem>
                                <SelectItem value="QUARANTINE">Quarantine — hold for manual review</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Toggle label="Require Versioning" description="Maintain version history for all documents"
                        checked={value.versioningRequired} onChange={v => onChange('versioningRequired', v)} />
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Default Classification Label</label>
                        <Input value={value.classificationDefault}
                            onChange={e => onChange('classificationDefault', e.target.value)}
                            placeholder="e.g. Internal, Confidential" className="rounded-xl h-11 w-64" />
                    </div>

                    {/* ── Content Governance Models ── */}
                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-5">
                        <div className="mb-2">
                            <h3 className="text-base font-semibold text-gray-900">Content Governance</h3>
                            <p className="text-sm text-gray-500">Define which file types, filing categories, and workflows are allowed</p>
                        </div>

                        {/* Allowed File Types */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Allowed File Types</label>
                            {availableFileTypes.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No file types available from the system</p>
                            ) : (
                                <>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {value.allowedFileTypeIds.map(id => {
                                            const ft = availableFileTypes.find(f => f.id === id);
                                            return ft ? (
                                                <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg font-medium">
                                                    {ft.label}
                                                    <button type="button" onClick={() => onChange('allowedFileTypeIds', value.allowedFileTypeIds.filter(i => i !== id))} className="hover:text-red-600">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                    <Select value="" onValueChange={v => { const id = parseInt(v); if (!value.allowedFileTypeIds.includes(id)) onChange('allowedFileTypeIds', [...value.allowedFileTypeIds, id]); }}>
                                        <SelectTrigger className="rounded-xl w-64"><SelectValue placeholder="Add file type..." /></SelectTrigger>
                                        <SelectContent>
                                            {availableFileTypes.filter(ft => !value.allowedFileTypeIds.includes(ft.id)).map(ft => (
                                                <SelectItem key={ft.id} value={String(ft.id)}>{ft.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-400 mt-1">Leave empty to allow all file types</p>
                                </>
                            )}
                        </div>

                        {/* Allowed Filing Categories */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Allowed Filing Categories</label>
                            {availableFilingCategories.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No filing categories available</p>
                            ) : (
                                <>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {value.allowedFilingCategoryIds.map(id => {
                                            const cat = availableFilingCategories.find(c => c.id === id);
                                            return cat ? (
                                                <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-lg font-medium">
                                                    {cat.label}
                                                    <button type="button" onClick={() => onChange('allowedFilingCategoryIds', value.allowedFilingCategoryIds.filter(i => i !== id))} className="hover:text-red-600">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                    <Select value="" onValueChange={v => { const id = parseInt(v); if (!value.allowedFilingCategoryIds.includes(id)) onChange('allowedFilingCategoryIds', [...value.allowedFilingCategoryIds, id]); }}>
                                        <SelectTrigger className="rounded-xl w-64"><SelectValue placeholder="Add filing category..." /></SelectTrigger>
                                        <SelectContent>
                                            {availableFilingCategories.filter(c => !value.allowedFilingCategoryIds.includes(c.id)).map(c => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-400 mt-1">Leave empty to allow all categories</p>
                                </>
                            )}
                        </div>

                        {/* Default Filing Category */}
                        {availableFilingCategories.length > 0 && (
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Default Filing Category</label>
                                <Select value={value.defaultFilingCategoryId ? String(value.defaultFilingCategoryId) : ''}
                                    onValueChange={v => onChange('defaultFilingCategoryId', v ? parseInt(v) : null)}>
                                    <SelectTrigger className="rounded-xl w-64"><SelectValue placeholder="None (optional)" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None</SelectItem>
                                        {availableFilingCategories.map(c => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Allowed Workflows */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Allowed Workflows</label>
                            {availableWorkflows.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No workflows available</p>
                            ) : (
                                <>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {value.allowedWorkflowIds.map(id => {
                                            const wf = availableWorkflows.find(w => w.id === id);
                                            return wf ? (
                                                <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg font-medium">
                                                    {wf.label}
                                                    <button type="button" onClick={() => onChange('allowedWorkflowIds', value.allowedWorkflowIds.filter(i => i !== id))} className="hover:text-red-600">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                    <Select value="" onValueChange={v => { const id = parseInt(v); if (!value.allowedWorkflowIds.includes(id)) onChange('allowedWorkflowIds', [...value.allowedWorkflowIds, id]); }}>
                                        <SelectTrigger className="rounded-xl w-64"><SelectValue placeholder="Add workflow..." /></SelectTrigger>
                                        <SelectContent>
                                            {availableWorkflows.filter(w => !value.allowedWorkflowIds.includes(w.id)).map(w => (
                                                <SelectItem key={w.id} value={String(w.id)}>{w.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-400 mt-1">Leave empty to allow all workflows</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Access ── */}
            {showAccess && (
                <div className="space-y-3">
                    <div className="mb-4">
                        <h3 className="text-base font-semibold text-gray-900">Access Control Policy</h3>
                        <p className="text-sm text-gray-500">Control how permissions and ACLs work inside this workspace</p>
                    </div>
                    <Toggle label="Allow Cross-Workspace ACL" description="Folder-level ACL can reference users outside this workspace"
                        checked={value.crossWorkspaceAclAllowed} onChange={v => onChange('crossWorkspaceAclAllowed', v)} />
                    <Toggle label="Allow Direct User ACL" description="Permit user-to-user ACL grants (prefer groups/roles instead)"
                        checked={value.directUserAclAllowed} onChange={v => onChange('directUserAclAllowed', v)} />
                    <Toggle label="Enforce Inheritance" description="ACL inheritance from parent folders cannot be broken"
                        checked={value.inheritanceEnforced} onChange={v => onChange('inheritanceEnforced', v)} />
                    {isSecured && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mt-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-blue-800">⚠ Secured Space Note</span>
                            </div>
                            <p className="text-xs text-blue-700">Secured workspaces automatically enforce stricter defaults. Cross-workspace ACL and direct user ACL are recommended to be disabled.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
