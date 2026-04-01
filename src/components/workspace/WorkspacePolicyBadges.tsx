'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WorkspacePolicyDto } from '@/api/services/workspaceService';

interface WorkspacePolicyBadgesProps {
    policy: WorkspacePolicyDto;
    compact?: boolean;
}

interface PolicyItem {
    label: string;
    enabled: boolean;
    category: 'security' | 'ingestion' | 'access';
}

export default function WorkspacePolicyBadges({ policy, compact = false }: WorkspacePolicyBadgesProps) {
    const items: PolicyItem[] = [
        { label: 'Download', enabled: policy.downloadAllowed, category: 'security' },
        { label: 'Print', enabled: policy.printAllowed, category: 'security' },
        { label: 'Export', enabled: policy.exportAllowed, category: 'security' },
        { label: 'Ext. Sharing', enabled: policy.externalSharingAllowed, category: 'security' },
        { label: 'Ext. Links', enabled: policy.externalLinkAllowed, category: 'security' },
        { label: 'Watermark', enabled: policy.watermarkRequired, category: 'security' },
        { label: 'View Audit', enabled: policy.viewAuditRequired, category: 'security' },
        { label: 'Break Glass', enabled: policy.breakGlassRequired, category: 'security' },
        { label: 'Virus Scan', enabled: policy.virusScanRequired, category: 'ingestion' },
        { label: 'Versioning', enabled: policy.versioningRequired, category: 'ingestion' },
        { label: 'Cross-WS ACL', enabled: policy.crossWorkspaceAclAllowed, category: 'access' },
        { label: 'Direct ACL', enabled: policy.directUserAclAllowed, category: 'access' },
        { label: 'Enforce Inherit', enabled: policy.inheritanceEnforced, category: 'access' },
    ];

    if (compact) {
        const enabled = items.filter(i => i.enabled);
        const disabled = items.filter(i => !i.enabled);
        return (
            <div className="flex flex-wrap gap-1.5">
                {enabled.map(item => (
                    <Badge key={item.label} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        {item.label}
                    </Badge>
                ))}
                {disabled.length > 0 && (
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-400 border-gray-200">
                        +{disabled.length} disabled
                    </Badge>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {(['security', 'ingestion', 'access'] as const).map(cat => {
                const catItems = items.filter(i => i.category === cat);
                const catLabel = cat === 'security' ? 'Security & Distribution'
                    : cat === 'ingestion' ? 'Ingestion & Processing'
                        : 'Access Control';
                return (
                    <div key={cat}>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{catLabel}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {catItems.map(item => (
                                <div key={item.label} className="flex items-center gap-1.5 text-sm">
                                    {item.enabled
                                        ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                        : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                                    <span className="text-gray-600">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Extra metadata rows */}
            <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Processing</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-400">Max File Size:</span>{' '}
                        <span className="font-medium text-gray-700">{policy.maxFileSizeBytes ? `${Math.round(policy.maxFileSizeBytes / 1048576)} MB` : 'No limit'}</span>
                    </div>
                    <div><span className="text-gray-400">OCR Mode:</span>{' '}
                        <span className="font-medium text-gray-700">{policy.ocrMode}</span>
                    </div>
                    <div><span className="text-gray-400">Archive Handling:</span>{' '}
                        <span className="font-medium text-gray-700">{policy.archiveHandling}</span>
                    </div>
                    {policy.classificationDefault && (
                        <div><span className="text-gray-400">Classification:</span>{' '}
                            <span className="font-medium text-gray-700">{policy.classificationDefault}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
