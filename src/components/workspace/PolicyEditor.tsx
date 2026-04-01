'use client';

import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { SearchSelect } from '@/components/main/SearchSelect';

// =====================================================================
// PolicyEditor — Reusable policy form for create + edit workflows
// =====================================================================

export interface PolicyFormState {
    // Security
    watermarkRequired: boolean;
    exportFolderEnabled: boolean;
    canEditDocuments: boolean;
    canEditFolders: boolean;
    canCreateFolders: boolean;
    canUploadDocuments: boolean;
    canMoveDocumentsOrFolders: boolean;
    canUploadDocumentVersions: boolean;
    canUpdateDocumentMetadata: boolean;
    // Legacy security (kept for backward compatibility)
    downloadAllowed: boolean;
    printAllowed: boolean;
    exportAllowed: boolean;
    externalSharingAllowed: boolean;
    externalLinkAllowed: boolean;
    viewAuditRequired: boolean;
    breakGlassRequired: boolean;
    // Access
    aclSharingAllowed: boolean;
    allowUsers: boolean;
    allowGroups: boolean;
    allowRoles: boolean;
    allowOrgUnits: boolean;
    abacAccessEnabled: boolean;
    crossWorkspaceAclAllowed: boolean;
    directUserAclAllowed: boolean;
    inheritanceEnforced: boolean;
    // Ingestion
    maxFileSizeMb: string;
    virusScanRequired: boolean;
    ocrMode: string;
    archiveHandling: string;
    classificationDefault: string;
    versioningRequired: boolean;
    // Content governance toggles
    restrictFileTypes: boolean;
    restrictDocumentModels: boolean;
    restrictWorkflows: boolean;
    // Content governance (IDs)
    allowedFileTypeIds: number[];
    allowedFilingCategoryIds: number[];
    defaultFilingCategoryId: number | null;
    allowedWorkflowIds: number[];
}

export const defaultPolicyForm: PolicyFormState = {
    watermarkRequired: false, exportFolderEnabled: false,
    canEditDocuments: true, canEditFolders: true,
    canCreateFolders: true, canUploadDocuments: true,
    canMoveDocumentsOrFolders: true, canUploadDocumentVersions: true,
    canUpdateDocumentMetadata: true,
    downloadAllowed: true, printAllowed: true, exportAllowed: true,
    externalSharingAllowed: false, externalLinkAllowed: false,
    viewAuditRequired: false, breakGlassRequired: false,
    aclSharingAllowed: true, allowUsers: true, allowGroups: true,
    allowRoles: true, allowOrgUnits: true, abacAccessEnabled: false,
    crossWorkspaceAclAllowed: true, directUserAclAllowed: false, inheritanceEnforced: true,
    maxFileSizeMb: '', virusScanRequired: true, ocrMode: 'CONDITIONAL', archiveHandling: 'ALLOW',
    classificationDefault: '', versioningRequired: true,
    restrictFileTypes: false, restrictDocumentModels: false, restrictWorkflows: false,
    allowedFileTypeIds: [], allowedFilingCategoryIds: [], defaultFilingCategoryId: null, allowedWorkflowIds: [],
};

// Available model data shape
export interface AvailableModel { id: number; label: string; description?: string; }

interface PolicyEditorProps {
    value: PolicyFormState;
    onChange: (key: keyof PolicyFormState, val: unknown) => void;
    section?: 'security' | 'ingestion' | 'access' | 'all';
    isSecured?: boolean;
    // Available models for searchable multi-select
    availableFileTypes?: AvailableModel[];
    availableFilingCategories?: AvailableModel[];
    availableWorkflows?: AvailableModel[];
    // Remote fetch functions (for SearchSelect)
    fetchFilingCategories?: (query: string) => Promise<AvailableModel[]>;
    fetchWorkflows?: (query: string) => Promise<AvailableModel[]>;
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

// Chip tag for selected items
function SelectedChip({ label, color = 'blue', onRemove }: { label: string; color?: string; onRemove: () => void }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-700',
        emerald: 'bg-emerald-100 text-emerald-700',
        purple: 'bg-purple-100 text-purple-700',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 ${colorClasses[color] || colorClasses.blue} text-xs rounded-lg font-medium`}>
            {label}
            <button type="button" onClick={onRemove} className="hover:text-red-600">
                <X className="h-3 w-3" />
            </button>
        </span>
    );
}

export default function PolicyEditor({ value, onChange, section = 'all', isSecured,
    availableFileTypes = [], availableFilingCategories = [], availableWorkflows = [],
    fetchFilingCategories, fetchWorkflows,
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
                        <h3 className="text-base font-semibold text-gray-900">Security Policy</h3>
                        <p className="text-sm text-gray-500">Control security features and editing permissions</p>
                    </div>
                    <Toggle label="Require Watermark" description="Apply watermarks to downloaded/printed documents"
                        checked={value.watermarkRequired} onChange={v => onChange('watermarkRequired', v)} />
                    <Toggle label="Enable Export Folder" description="Allow members to export workspace folders as archives"
                        checked={value.exportFolderEnabled} onChange={v => onChange('exportFolderEnabled', v)} />
                    <Toggle label="Can Edit Documents" description="Members with edit role can modify document content"
                        checked={value.canEditDocuments} onChange={v => onChange('canEditDocuments', v)} />
                    <Toggle label="Can Edit Folders" description="Members with edit role can rename or delete folders"
                        checked={value.canEditFolders} onChange={v => onChange('canEditFolders', v)} />
                    <Toggle label="Can Create Folders" description="Allow members to create new folders in the workspace"
                        checked={value.canCreateFolders} onChange={v => onChange('canCreateFolders', v)} />
                    <Toggle label="Can Upload Documents" description="Allow members to upload new documents"
                        checked={value.canUploadDocuments} onChange={v => onChange('canUploadDocuments', v)} />
                    <Toggle label="Can Move Documents / Folders" description="Allow moving items in or out of folders"
                        checked={value.canMoveDocumentsOrFolders} onChange={v => onChange('canMoveDocumentsOrFolders', v)} />
                    <Toggle label="Can Upload Document Versions" description="Allow uploading new versions of existing documents"
                        checked={value.canUploadDocumentVersions} onChange={v => onChange('canUploadDocumentVersions', v)} />
                    <Toggle label="Can Update Document Metadata" description="Allow editing document metadata fields"
                        checked={value.canUpdateDocumentMetadata} onChange={v => onChange('canUpdateDocumentMetadata', v)} />
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
                            placeholder="Leave empty for system default" className="rounded-xl h-11 w-full" />
                    </div>
                    <Toggle label="Require Virus Scan" description="All uploads are scanned before storage"
                        checked={value.virusScanRequired} onChange={v => onChange('virusScanRequired', v)} />
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">OCR Mode</label>
                        <Select value={value.ocrMode} onValueChange={v => onChange('ocrMode', v)}>
                            <SelectTrigger className="rounded-xl w-full"><SelectValue /></SelectTrigger>
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
                            <SelectTrigger className="rounded-xl w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALLOW">Allow — accept archive uploads</SelectItem>
                                <SelectItem value="BLOCK">Block — reject archive files</SelectItem>
                                <SelectItem value="QUARANTINE">Quarantine — hold for manual review</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Default Classification Label</label>
                        <Input value={value.classificationDefault}
                            onChange={e => onChange('classificationDefault', e.target.value)}
                            placeholder="e.g. Internal, Confidential" className="rounded-xl h-11 w-full" />
                    </div>

                    {/* ── Content Governance ── */}
                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-5">
                        <div className="mb-2">
                            <h3 className="text-base font-semibold text-gray-900">Content Governance</h3>
                            <p className="text-sm text-gray-500">Restrict which file types, document models, and workflows are allowed</p>
                        </div>

                        {/* ── Allowed File Types ── */}
                        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                            <Toggle label="Restrict File Types" description="Only allow specific file types to be uploaded"
                                checked={value.restrictFileTypes} onChange={v => {
                                    onChange('restrictFileTypes', v);
                                    if (!v) onChange('allowedFileTypeIds', []);
                                }} />
                            {value.restrictFileTypes && (
                                <div className="pl-1 space-y-2">
                                    {value.allowedFileTypeIds.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {value.allowedFileTypeIds.map(id => {
                                                const ft = availableFileTypes.find(f => f.id === id);
                                                return ft ? (
                                                    <SelectedChip key={id} label={ft.label} color="blue"
                                                        onRemove={() => onChange('allowedFileTypeIds', value.allowedFileTypeIds.filter(i => i !== id))} />
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                    <SearchSelect<AvailableModel>
                                        items={availableFileTypes.filter(ft => !value.allowedFileTypeIds.includes(ft.id))}
                                        onSelect={(item) => onChange('allowedFileTypeIds', [...value.allowedFileTypeIds, item.id])}
                                        displayField="label"
                                        placeholder="Search file types..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* ── Allowed Document Models ── */}
                        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                            <Toggle label="Restrict Document Models" description="Only allow specific document models (filing categories)"
                                checked={value.restrictDocumentModels} onChange={v => {
                                    onChange('restrictDocumentModels', v);
                                    if (!v) { onChange('allowedFilingCategoryIds', []); onChange('defaultFilingCategoryId', null); }
                                }} />
                            {value.restrictDocumentModels && (
                                <div className="pl-1 space-y-3">
                                    {value.allowedFilingCategoryIds.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {value.allowedFilingCategoryIds.map(id => {
                                                const cat = availableFilingCategories.find(c => c.id === id);
                                                return cat ? (
                                                    <SelectedChip key={id} label={cat.label} color="emerald"
                                                        onRemove={() => {
                                                            onChange('allowedFilingCategoryIds', value.allowedFilingCategoryIds.filter(i => i !== id));
                                                            if (value.defaultFilingCategoryId === id) onChange('defaultFilingCategoryId', null);
                                                        }} />
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                    <SearchSelect<AvailableModel>
                                        items={availableFilingCategories.filter(c => !value.allowedFilingCategoryIds.includes(c.id))}
                                        fetchFunction={fetchFilingCategories}
                                        onSelect={(item) => onChange('allowedFilingCategoryIds', [...value.allowedFilingCategoryIds, item.id])}
                                        displayField="label"
                                        descriptionField="description"
                                        placeholder="Search document models..."
                                    />
                                    {/* Default Document Model */}
                                    {value.allowedFilingCategoryIds.length > 0 && (
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Default Document Model (optional)</label>
                                            <Select
                                                value={value.defaultFilingCategoryId ? String(value.defaultFilingCategoryId) : '__none__'}
                                                onValueChange={v => onChange('defaultFilingCategoryId', v === '__none__' ? null : parseInt(v))}
                                            >
                                                <SelectTrigger className="rounded-xl w-full"><SelectValue placeholder="None" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">None</SelectItem>
                                                    {value.allowedFilingCategoryIds.map(id => {
                                                        const cat = availableFilingCategories.find(c => c.id === id);
                                                        return cat ? <SelectItem key={id} value={String(id)}>{cat.label}</SelectItem> : null;
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Allowed Workflows ── */}
                        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                            <Toggle label="Restrict Workflows" description="Only allow specific workflows to be used"
                                checked={value.restrictWorkflows} onChange={v => {
                                    onChange('restrictWorkflows', v);
                                    if (!v) onChange('allowedWorkflowIds', []);
                                }} />
                            {value.restrictWorkflows && (
                                <div className="pl-1 space-y-2">
                                    {value.allowedWorkflowIds.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {value.allowedWorkflowIds.map(id => {
                                                const wf = availableWorkflows.find(w => w.id === id);
                                                return wf ? (
                                                    <SelectedChip key={id} label={wf.label} color="purple"
                                                        onRemove={() => onChange('allowedWorkflowIds', value.allowedWorkflowIds.filter(i => i !== id))} />
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                    <SearchSelect<AvailableModel>
                                        items={availableWorkflows.filter(w => !value.allowedWorkflowIds.includes(w.id))}
                                        fetchFunction={fetchWorkflows}
                                        onSelect={(item) => onChange('allowedWorkflowIds', [...value.allowedWorkflowIds, item.id])}
                                        displayField="label"
                                        descriptionField="description"
                                        placeholder="Search workflows..."
                                    />
                                </div>
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
                        <p className="text-sm text-gray-500">Control how permissions, ACLs, and sharing work inside this workspace</p>
                    </div>
                    <Toggle label="Allow ACL Sharing" description="Members can share documents and folders via Access Control Lists"
                        checked={value.aclSharingAllowed} onChange={v => onChange('aclSharingAllowed', v)} />
                    <Toggle label="Allow Users" description="Individual users can be granted direct access"
                        checked={value.allowUsers} onChange={v => onChange('allowUsers', v)} />
                    <Toggle label="Allow Groups" description="User groups can be granted access"
                        checked={value.allowGroups} onChange={v => onChange('allowGroups', v)} />
                    <Toggle label="Allow Roles" description="System roles can be granted access"
                        checked={value.allowRoles} onChange={v => onChange('allowRoles', v)} />
                    <Toggle label="Allow Org Units" description="Organization units can be granted access"
                        checked={value.allowOrgUnits} onChange={v => onChange('allowOrgUnits', v)} />
                    <Toggle label="ABAC Access" description="Attribute-Based Access Control for fine-grained policy rules"
                        checked={value.abacAccessEnabled} onChange={v => onChange('abacAccessEnabled', v)} />
                    <Toggle label="Allow Cross-Workspace ACL" description="Folder-level ACL can reference users outside this workspace"
                        checked={value.crossWorkspaceAclAllowed} onChange={v => onChange('crossWorkspaceAclAllowed', v)} />
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
