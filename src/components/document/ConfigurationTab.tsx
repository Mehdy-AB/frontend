// components/document/ConfigurationTab.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Info,
  Copy,
  Share2,
  Star,
  Globe,
  Lock,
  User,
  Mail,
  Calendar,
  Clock,
  FileText,
  Workflow,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Ban,
  Timer,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  GitBranch,
  ExternalLink
} from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';
import { formatFileSize, formatDate } from '../../utils/documentUtils';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { WorkflowInstanceResponse } from '@/types/workflow';

interface ConfigurationTabProps {
  document: DocumentViewDto;
  isLoading: boolean;
  onCopyLink: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  onSwitchToWorkflowTab?: () => void;
}

const WF_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  ACTIVE: { label: 'In Progress', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', icon: <Clock className="w-3.5 h-3.5 text-blue-500" /> },
  COMPLETED: { label: 'Completed', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200', icon: <Ban className="w-3.5 h-3.5 text-gray-400" /> },
  FAILED: { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: <XCircle className="w-3.5 h-3.5 text-red-500" /> },
  EXPIRED: { label: 'Expired', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200', icon: <Timer className="w-3.5 h-3.5 text-orange-500" /> },
};

export default function ConfigurationTab({
  document,
  isLoading,
  onCopyLink,
  onShare,
  onToggleFavorite,
  isFavorite,
  onSwitchToWorkflowTab
}: ConfigurationTabProps) {
  const [workflows, setWorkflows] = useState<WorkflowInstanceResponse[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [showPastWorkflows, setShowPastWorkflows] = useState(false);

  useEffect(() => {
    const fetchWorkflows = async () => {
      setLoadingWorkflows(true);
      try {
        const instances = await workflowAdminService.getAllWorkflowInstancesForDocument(document.documentId);
        setWorkflows(instances);
      } catch {
        // Silently fail — workflow info is supplementary
      } finally {
        setLoadingWorkflows(false);
      }
    };
    fetchWorkflows();
  }, [document.documentId]);

  const activeWorkflows = workflows.filter(w => w.status === 'ACTIVE');
  const pastWorkflows = workflows.filter(w => w.status !== 'ACTIVE');
  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-ui rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-neutral-ui rounded w-20"></div>
                <div className="h-4 bg-neutral-ui rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Document Information */}
      <div>
        <h3 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Document Information
        </h3>
        <div className="space-y-3 text-sm">
          {/* File Details */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-text-light flex items-center gap-1">
                <FileText className="h-3 w-3" />
                File Name:
              </span>
              <span className="text-neutral-text-dark font-medium">{document.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-text-light">File Size:</span>
              <span className="text-neutral-text-dark font-medium">{formatFileSize(document.sizeBytes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-text-light">MIME Type:</span>
              <span className="text-neutral-text-dark font-medium">{document.mimeType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-text-light">Version:</span>
              <span className="text-neutral-text-dark font-medium">v{document.versionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-text-light">Document ID:</span>
              <span className="text-neutral-text-dark font-medium">#{document.documentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-text-light">Visibility:</span>
              <span className="flex items-center gap-1">
                {document.isPublic ? (
                  <>
                    <Globe className="h-3 w-3 text-success" />
                    <span className="text-success">Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 text-neutral-text-light" />
                    <span className="text-neutral-text-dark">Private</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Owner Information */}
          <div className="border-t border-ui pt-3">
            <h4 className="font-medium text-neutral-text-dark mb-2 flex items-center gap-1">
              <User className="h-3 w-3" />
              Owner
            </h4>
            <div className="flex items-center gap-3 p-2 bg-neutral-background rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {document.ownedBy.imageUrl && document.ownedBy.imageUrl.trim() !== '' ? (
                  <img
                    src={document.ownedBy.imageUrl}
                    alt={document.ownedBy.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide image and show icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <User className={`h-4 w-4 text-primary ${document.ownedBy.imageUrl && document.ownedBy.imageUrl.trim() !== '' ? 'hidden' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-neutral-text-dark truncate">
                  {document.ownedBy.firstName} {document.ownedBy.lastName}
                </div>
                <div className="text-xs text-neutral-text-light flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {document.ownedBy.email}
                </div>
                <div className="text-xs text-neutral-text-light">
                  @{document.ownedBy.username}
                </div>
              </div>
            </div>
          </div>

          {/* Creator Information */}
          <div className="border-t border-ui pt-3">
            <h4 className="font-medium text-neutral-text-dark mb-2 flex items-center gap-1">
              <User className="h-3 w-3" />
              Created By
            </h4>
            <div className="flex items-center gap-3 p-2 bg-neutral-background rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {document.createdBy.imageUrl && document.createdBy.imageUrl.trim() !== '' ? (
                  <img
                    src={document.createdBy.imageUrl}
                    alt={document.createdBy.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide image and show icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <User className={`h-4 w-4 text-primary ${document.createdBy.imageUrl && document.createdBy.imageUrl.trim() !== '' ? 'hidden' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-neutral-text-dark truncate">
                  {document.createdBy.firstName} {document.createdBy.lastName}
                </div>
                <div className="text-xs text-neutral-text-light flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {document.createdBy.email}
                </div>
                <div className="text-xs text-neutral-text-light">
                  @{document.createdBy.username}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t border-ui pt-3">
            <h4 className="font-medium text-neutral-text-dark mb-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Timeline
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-text-light flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created:
                </span>
                <span className="text-neutral-text-dark font-medium">{formatDate(document.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-text-light flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last Modified:
                </span>
                <span className="text-neutral-text-dark font-medium">{formatDate(document.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Summary */}
      <div>
        <h3 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
          <Workflow className="h-4 w-4" />
          Workflows
          {workflows.length > 0 && (
            <span className="text-xs font-normal text-neutral-text-light">({workflows.length})</span>
          )}
        </h3>

        {/* Workflow Status from Document DTO (instant, no extra API call) */}
        {document.workflowInstance && (() => {
          const wi = document.workflowInstance;
          const statusCfg = WF_STATUS_CONFIG[wi.workflowStatus] || WF_STATUS_CONFIG.ACTIVE;
          const isActive = wi.workflowStatus === 'ACTIVE';
          return (
            <div
              className={`p-3 rounded-lg border mb-3 cursor-pointer hover:shadow-sm transition-all ${statusCfg.bgColor}`}
              onClick={() => onSwitchToWorkflowTab?.()}
            >
              {/* Name + Status Badge */}
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-shrink-0">
                  {statusCfg.icon}
                  {isActive && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate flex-1">{wi.workflowName}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusCfg.bgColor} ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
              </div>

              {/* Current Step */}
              {wi.currentStepName && (
                <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-700">
                  <ArrowRight className="w-3 h-3 text-blue-400 flex-shrink-0" />
                  <span className="truncate font-medium">{wi.currentStepName}</span>
                  {wi.currentNodeType && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/60 text-gray-500 border border-gray-200 flex-shrink-0">
                      {wi.currentNodeType.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              )}

              {/* Assigned Users */}
              {wi.assignedUsers && wi.assignedUsers.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2 text-[11px] text-gray-600">
                  <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="truncate">
                    {wi.assignedUsers.map(u => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username).join(', ')}
                  </span>
                </div>
              )}

              {/* Dates + Due Date */}
              <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(wi.workflowStartedAt || '')}
                </span>
                {wi.workflowCompletedAt && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {formatDate(wi.workflowCompletedAt)}
                  </span>
                )}
                {wi.currentStepDueDate && (
                  <span className={`flex items-center gap-1 ${new Date(wi.currentStepDueDate) < new Date() ? 'text-red-600 font-medium' : ''
                    }`}>
                    <AlertCircle className="w-3 h-3" />
                    Due: {formatDate(wi.currentStepDueDate)}
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* API-fetched Workflow List (enhanced details) */}
        {loadingWorkflows ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : !document.workflowInstance && workflows.length === 0 ? (
          <div className="text-center py-6 bg-neutral-background rounded-lg border border-dashed border-ui">
            <GitBranch className="h-6 w-6 text-neutral-text-light mx-auto mb-2" />
            <p className="text-xs text-neutral-text-light">No workflows for this document</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* Past Workflows (from API) */}
            {pastWorkflows.length > 0 && (
              <div>
                <button
                  onClick={() => setShowPastWorkflows(!showPastWorkflows)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-text-light hover:text-neutral-text-dark transition-colors"
                >
                  {showPastWorkflows ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <span>Past Workflows ({pastWorkflows.length})</span>
                </button>
                {showPastWorkflows && (
                  <div className="space-y-1.5 mt-1">
                    {pastWorkflows.map((wf) => {
                      const cfg = WF_STATUS_CONFIG[wf.status] || WF_STATUS_CONFIG.ACTIVE;
                      return (
                        <button
                          key={wf.id}
                          onClick={() => onSwitchToWorkflowTab?.()}
                          className="w-full text-left flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 transition-all group"
                        >
                          {cfg.icon}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-800 truncate">{wf.workflowName}</div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-2">
                              <span>{cfg.label}</span>
                              <span>·</span>
                              <span>{formatDate(wf.completedAt || wf.startedAt)}</span>
                            </div>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* View all button */}
            {onSwitchToWorkflowTab && (workflows.length > 0 || document.workflowInstance) && (
              <button
                onClick={onSwitchToWorkflowTab}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-primary hover:text-primary-dark font-medium transition-colors"
              >
                View Full Details
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-medium text-neutral-text-dark mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCopyLink}
            className="p-2 border border-ui rounded text-xs hover:bg-neutral-background transition-colors"
          >
            <Copy className="h-4 w-4 mx-auto mb-1" />
            Copy Link
          </button>
          <button
            onClick={onShare}
            className="p-2 border border-ui rounded text-xs hover:bg-neutral-background transition-colors"
          >
            <Share2 className="h-4 w-4 mx-auto mb-1" />
            Manage Permissions
          </button>
          <button
            onClick={onToggleFavorite}
            className={`p-2 border rounded text-xs transition-colors ${isFavorite
              ? 'border-warning bg-warning/10 text-warning'
              : 'border-ui hover:bg-neutral-background'
              }`}
          >
            <Star className={`h-4 w-4 mx-auto mb-1 ${isFavorite ? 'fill-current' : ''}`} />
            {isFavorite ? 'Favorited' : 'Add to Favorites'}
          </button>
        </div>
      </div>
    </div>
  );
}
