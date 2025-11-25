// components/document/ConfigurationTab.tsx
'use client';

import { 
  Info, 
  Settings, 
  Copy, 
  Share2, 
  MessageSquare, 
  Star,
  Globe,
  Lock,
  User,
  Mail,
  Calendar,
  Clock,
  FileText,
  Hash,
  Workflow,
  CheckCircle2,
  Circle,
  AlertCircle
} from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';
import { formatFileSize, formatDate } from '../../utils/documentUtils';

interface ConfigurationTabProps {
  document: DocumentViewDto;
  isLoading: boolean;
  onCopyLink: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

export default function ConfigurationTab({ 
  document, 
  isLoading, 
  onCopyLink, 
  onShare, 
  onToggleFavorite, 
  isFavorite 
}: ConfigurationTabProps) {
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

      {/* Workflow Instance Information */}
      {document.workflowInstance && (
        <div>
          <h3 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflow Status
          </h3>
          <div className="space-y-3 p-4 bg-neutral-background rounded-lg border border-ui">
            {/* Workflow Name and Status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-primary" />
                <span className="font-medium text-neutral-text-dark">
                  {document.workflowInstance.workflowName}
                </span>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                document.workflowInstance.workflowStatus === 'ACTIVE' 
                  ? 'bg-primary/20 text-primary' 
                  : document.workflowInstance.workflowStatus === 'COMPLETED'
                  ? 'bg-success/20 text-success'
                  : 'bg-neutral-ui text-neutral-text-light'
              }`}>
                {document.workflowInstance.workflowStatus}
              </span>
            </div>

            {/* Current Step */}
            {document.workflowInstance.currentStepName && (
              <div className="border-t border-ui pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-text-dark">Current Step</span>
                  {document.workflowInstance.currentStepStatus === 'ACTIVE' ? (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <Circle className="h-3 w-3 fill-current animate-pulse" />
                      Active
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-neutral-text-light">
                      <Circle className="h-3 w-3" />
                      {document.workflowInstance.currentStepStatus || 'Pending'}
                    </div>
                  )}
                </div>
                <div className="text-sm text-neutral-text-dark mb-2">
                  {document.workflowInstance.currentStepOrder && (
                    <span className="text-neutral-text-light mr-2">
                      Step {document.workflowInstance.currentStepOrder}:
                    </span>
                  )}
                  {document.workflowInstance.currentStepName}
                </div>

                {/* Assigned Users */}
                {document.workflowInstance.assignedUsers && document.workflowInstance.assignedUsers.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-neutral-text-light mb-2 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Assigned To:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {document.workflowInstance.assignedUsers.map((user) => (
                        <div 
                          key={user.id} 
                          className="flex items-center gap-2 px-2 py-1 bg-ui rounded text-xs"
                        >
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {user.imageUrl && user.imageUrl.trim() !== '' ? (
                              <img 
                                src={user.imageUrl} 
                                alt={user.username}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <User className={`h-3 w-3 text-primary ${user.imageUrl && user.imageUrl.trim() !== '' ? 'hidden' : ''}`} />
                          </div>
                          <span className="text-neutral-text-dark">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Due Date */}
                {document.workflowInstance.currentStepDueDate && (
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <Calendar className="h-3 w-3 text-neutral-text-light" />
                    <span className="text-neutral-text-light">Due:</span>
                    <span className={`font-medium ${
                      new Date(document.workflowInstance.currentStepDueDate) < new Date()
                        ? 'text-error'
                        : 'text-neutral-text-dark'
                    }`}>
                      {formatDate(document.workflowInstance.currentStepDueDate)}
                      {new Date(document.workflowInstance.currentStepDueDate) < new Date() && (
                        <AlertCircle className="h-3 w-3 inline ml-1 text-error" />
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Workflow Dates */}
            <div className="border-t border-ui pt-3 space-y-2">
              {document.workflowInstance.workflowStartedAt && (
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-text-light flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Started:
                  </span>
                  <span className="text-neutral-text-dark">
                    {formatDate(document.workflowInstance.workflowStartedAt)}
                  </span>
                </div>
              )}
              {document.workflowInstance.workflowCompletedAt && (
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-text-light flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed:
                  </span>
                  <span className="text-neutral-text-dark">
                    {formatDate(document.workflowInstance.workflowCompletedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Model Configurations */}
      {/* <div>
        <h3 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Model Configurations
        </h3>
        <div className="space-y-3">
          {document.modelConfigurations?.map((config) => (
            <div key={config.id} className="p-3 border border-ui rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-neutral-text-dark">{config.name}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  config.status === 'active' ? 'bg-success/20 text-success' :
                  config.status === 'processing' ? 'bg-warning/20 text-warning' :
                  'bg-neutral-ui text-neutral-text-light'
                }`}>
                  {config.status}
                </span>
              </div>
              <div className="flex justify-between text-sm text-neutral-text-light">
                <span>Confidence: {(config.confidence * 100).toFixed(1)}%</span>
                <span>{formatDate(config.lastRun)}</span>
              </div>
              <button className="w-full mt-2 text-xs text-primary hover:text-primary-dark text-center py-1">
                Configure
              </button>
            </div>
          ))}
        </div>
      </div> */}

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
            className={`p-2 border rounded text-xs transition-colors ${
              isFavorite 
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
