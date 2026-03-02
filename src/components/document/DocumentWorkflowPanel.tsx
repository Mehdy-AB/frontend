'use client';

import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { WorkflowInstanceResponse } from '@/types/workflow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    GitBranch, Clock, CheckCircle2, XCircle, AlertCircle, Pause,
    ChevronDown, ChevronRight, User, PlayCircle, Layers
} from 'lucide-react';
import UserAvatar from '@/components/main/UserAvatar';

interface DocumentWorkflowPanelProps {
    isOpen: boolean;
    onClose: () => void;
    workflowInstances: WorkflowInstanceResponse[];
    loading?: boolean;
}

const statusConfig: Record<string, { color: string; bgColor: string; borderColor: string; icon: React.ReactNode; label: string }> = {
    ACTIVE: { color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: <PlayCircle className="h-3.5 w-3.5" />, label: 'En cours' },
    COMPLETED: { color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Terminé' },
    CANCELLED: { color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: <XCircle className="h-3.5 w-3.5" />, label: 'Annulé' },
    FAILED: { color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: <AlertCircle className="h-3.5 w-3.5" />, label: 'Échoué' },
    PAUSED: { color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: <Pause className="h-3.5 w-3.5" />, label: 'En pause' },
};

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    try {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(dateStr));
    } catch {
        return dateStr;
    }
}

function getWorkflowName(instance: WorkflowInstanceResponse): string {
    return instance.workflow?.name || instance.workflowName || `Workflow #${instance.workflowId}`;
}

function getProgress(instance: WorkflowInstanceResponse): number {
    if (instance.progress != null) return instance.progress;
    if (instance.completedNodesCount != null && instance.totalNodesCount != null && instance.totalNodesCount > 0) {
        return Math.round((instance.completedNodesCount / instance.totalNodesCount) * 100);
    }
    if (instance.status === 'COMPLETED') return 100;
    return 0;
}

function WorkflowInstanceCard({ instance }: { instance: WorkflowInstanceResponse }) {
    const [showNodes, setShowNodes] = useState(false);
    const { t } = useLanguage();
    const config = statusConfig[instance.status as string] || statusConfig.ACTIVE;
    const progress = getProgress(instance);

    // Get executed node instances (non-PENDING), sorted by startedAt
    const executedNodes = (instance.nodeInstances || [])
        .filter(n => n.status !== 'PENDING' && n.nodeType !== 'START' && n.nodeType !== 'END')
        .sort((a, b) => {
            if (!a.startedAt) return 1;
            if (!b.startedAt) return -1;
            return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
        });

    return (
        <div className={`rounded-xl border ${config.borderColor} bg-white shadow-sm overflow-hidden transition-all`}>
            {/* Top color bar */}
            <div className={`h-1 ${instance.status === 'ACTIVE' ? 'bg-emerald-500' :
                instance.status === 'COMPLETED' ? 'bg-blue-500' :
                    instance.status === 'FAILED' ? 'bg-red-500' :
                        instance.status === 'CANCELLED' ? 'bg-gray-400' :
                            'bg-amber-500'
                }`} />

            <div className="p-4 space-y-3">
                {/* Header: Workflow name + status badge */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <GitBranch className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                            {getWorkflowName(instance)}
                        </h4>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} flex-shrink-0`}>
                        {config.icon}
                        {config.label}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{t('progress') || 'Progression'}</span>
                        <span className="font-semibold text-gray-700">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${instance.status === 'COMPLETED' ? 'bg-blue-500' :
                                instance.status === 'FAILED' ? 'bg-red-400' :
                                    instance.status === 'CANCELLED' ? 'bg-gray-400' :
                                        'bg-emerald-500'
                                }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                    {(instance.completedNodesCount != null && instance.totalNodesCount != null) && (
                        <div className="text-[11px] text-gray-400 text-right">
                            {instance.completedNodesCount}/{instance.totalNodesCount} {t('steps') || 'étapes'}
                        </div>
                    )}
                </div>

                {/* Current Node - highlighted */}
                {instance.currentNodeLabel && instance.status === 'ACTIVE' && (
                    <div className="flex items-center gap-2.5 bg-emerald-50 rounded-lg px-3 py-2.5 border border-emerald-100">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold">
                                {t('currentStep') || 'Étape actuelle'}
                            </div>
                            <div className="text-sm font-medium text-gray-800 truncate">
                                {instance.currentNodeLabel}
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom status */}
                {instance.customStatus && (
                    <div className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-1.5 border border-amber-100">
                        <span className="font-medium">Statut :</span> {instance.customStatus}
                    </div>
                )}

                {/* Info Grid */}
                <div className="space-y-1.5 text-xs text-gray-500">
                    {/* Started by */}
                    {instance.startedBy && (
                        <div className="flex items-center gap-2">
                            <UserAvatar user={instance.startedBy} size="xs" showTooltip />
                            <span className="text-gray-700 font-medium">
                                {instance.startedBy.displayName ||
                                    (instance.startedBy.firstName ? `${instance.startedBy.firstName} ${instance.startedBy.lastName || ''}`.trim() : null) ||
                                    instance.startedBy.username || 'Utilisateur'}
                            </span>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Démarré : {formatDate(instance.startedAt)}</span>
                        </div>
                        {instance.completedAt && (
                            <div className="flex items-center gap-1 text-blue-600">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Terminé : {formatDate(instance.completedAt)}</span>
                            </div>
                        )}
                        {instance.cancelledAt && (
                            <div className="flex items-center gap-1 text-red-500">
                                <XCircle className="h-3 w-3" />
                                <span>Annulé : {formatDate(instance.cancelledAt)}</span>
                            </div>
                        )}
                    </div>

                    {/* Cancellation reason */}
                    {instance.cancellationReason && (
                        <div className="text-red-600 bg-red-50 rounded px-2 py-1 mt-1 text-[11px]">
                            <span className="font-medium">Raison :</span> {instance.cancellationReason}
                        </div>
                    )}
                </div>

                {/* Executed Nodes Timeline (collapsible) */}
                {executedNodes.length > 0 && (
                    <div className="border-t border-gray-100 pt-2">
                        <button
                            onClick={() => setShowNodes(!showNodes)}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors w-full"
                        >
                            {showNodes ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <Layers className="h-3 w-3" />
                            <span>{t('executedSteps') || 'Étapes exécutées'} ({executedNodes.length})</span>
                        </button>
                        {showNodes && (
                            <div className="mt-2 space-y-0 max-h-48 overflow-y-auto pl-2">
                                {executedNodes.map((node, idx) => {
                                    const isLast = idx === executedNodes.length - 1;
                                    const nodeStatusColor =
                                        node.status === 'COMPLETED' ? 'bg-blue-500' :
                                            node.status === 'ACTIVE' ? 'bg-emerald-500' :
                                                node.status === 'REJECTED' ? 'bg-red-500' :
                                                    node.status === 'FAILED' ? 'bg-red-400' :
                                                        'bg-gray-300';

                                    return (
                                        <div key={node.id || idx} className="flex items-start gap-2 relative">
                                            {/* Timeline line */}
                                            {!isLast && (
                                                <div className="absolute left-[5px] top-[14px] bottom-0 w-px bg-gray-200" />
                                            )}
                                            {/* Dot */}
                                            <div className={`h-[10px] w-[10px] rounded-full ${nodeStatusColor} mt-[5px] flex-shrink-0 relative z-10 ${node.status === 'ACTIVE' ? 'ring-2 ring-emerald-200 ring-offset-1' : ''
                                                }`} />
                                            {/* Content */}
                                            <div className="flex-1 pb-3 min-w-0">
                                                <div className="text-xs font-medium text-gray-800 truncate">{node.nodeName}</div>
                                                <div className="text-[10px] text-gray-400">
                                                    {node.completedAt ? formatDate(node.completedAt) : node.startedAt ? formatDate(node.startedAt) : '—'}
                                                    {node.completedBy && (
                                                        <span className="ml-1.5 text-gray-500">
                                                            — {node.completedBy.firstName || node.completedBy.displayName || ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DocumentWorkflowPanel({ isOpen, onClose, workflowInstances, loading }: DocumentWorkflowPanelProps) {
    const { t } = useLanguage();

    const activeInstances = workflowInstances.filter(i => i.status === 'ACTIVE');
    const otherInstances = workflowInstances.filter(i => i.status !== 'ACTIVE');

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-primary" />
                        {t('workflowInstances') || 'Instances de Workflow'}
                        <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-normal">
                            {workflowInstances.length}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
                    {/* Loading state */}
                    {loading && (
                        <div className="text-center py-8">
                            <div className="h-8 w-8 border-2 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm text-gray-400">Chargement...</p>
                        </div>
                    )}

                    {!loading && (<>
                        {/* Active instances first */}
                        {activeInstances.length > 0 && (
                            <div className="space-y-3">
                                {activeInstances.map(instance => (
                                    <WorkflowInstanceCard key={instance.id} instance={instance} />
                                ))}
                            </div>
                        )}

                        {/* Separator if both types exist */}
                        {activeInstances.length > 0 && otherInstances.length > 0 && (
                            <div className="flex items-center gap-2 py-1">
                                <div className="h-px flex-1 bg-gray-200" />
                                <span className="text-[11px] text-gray-400 uppercase tracking-wider">{t('history') || 'Historique'}</span>
                                <div className="h-px flex-1 bg-gray-200" />
                            </div>
                        )}

                        {/* Past instances */}
                        {otherInstances.length > 0 && (
                            <div className="space-y-3">
                                {otherInstances.map(instance => (
                                    <WorkflowInstanceCard key={instance.id} instance={instance} />
                                ))}
                            </div>
                        )}

                        {!loading && workflowInstances.length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                <GitBranch className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">{t('noWorkflowInstances') || 'Aucune instance de workflow pour ce document'}</p>
                            </div>
                        )}
                    </>)}
                </div>
            </DialogContent>
        </Dialog>
    );
}
