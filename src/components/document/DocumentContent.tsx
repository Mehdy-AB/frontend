'use client';

import { DocumentViewDto, DocumentTab } from '../../types/documentView';
import { AuditLog } from '../../types/api';
import {
  ConfigurationTab,
  ModelsTab,
  MetadataTab,
  ActivityTab
} from './index';
import { UnifiedComments } from '../comments/UnifiedComments';

interface DocumentContentProps {
  activeTab: DocumentTab;
  document: DocumentViewDto | null;
  auditLogs: AuditLog[];
  isLoadingConfig: boolean;
  isLoadingModels: boolean;
  isLoadingMetadata: boolean;
  isLoadingAuditLogs: boolean;
  isFavorite: boolean;
  onCopyLink: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
  onUpdateMetadata: (metadata: string[]) => void;
  onUpdateDocument?: (updatedDocument: DocumentViewDto) => void;
  onRefreshMetadata?: () => Promise<void>;
}

export default function DocumentContent({
  activeTab,
  document,
  auditLogs,
  isLoadingConfig,
  isLoadingModels,
  isLoadingMetadata,
  isLoadingAuditLogs,
  isFavorite,
  onCopyLink,
  onShare,
  onToggleFavorite,
  onUpdateMetadata,
  onUpdateDocument,
  onRefreshMetadata
}: DocumentContentProps) {
  if (!document) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {activeTab === 'config' && (
        <ConfigurationTab 
          document={document} 
          isLoading={isLoadingConfig}
          onCopyLink={onCopyLink}
          onShare={onShare}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite}
        />
      )}
      
      {/* {activeTab === 'models' && (
        <ModelsTab 
          document={document} 
          isLoading={isLoadingModels} 
        />
      )} */}
      {activeTab === 'workflows' && (
                      <div className="flex flex-col gap-4 p-4">
                      
                        <div className="workflow-section">
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Current Workflow</h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                                <span className="text-xs mt-1 text-gray-600">Draft</span>
                              </div>
                              
                              <div className="w-8 h-0.5 bg-green-500"></div>
                              
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                                <span className="text-xs mt-1 text-gray-600">Review</span>
                              </div>
                              
                              <div className="w-8 h-0.5 bg-green-500"></div>
                              
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-blue-600 flex items-center justify-center">
                                  <span className="text-white text-xs">3</span>
                                </div>
                                <span className="text-xs mt-1 font-medium text-blue-600">Approval</span>
                              </div>
                              
                              <div className="w-8 h-0.5 bg-gray-300"></div>
                              
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-gray-500 text-xs">4</span>
                                </div>
                                <span className="text-xs mt-1 text-gray-500">Signed</span>
                              </div>
                              
                              <div className="w-8 h-0.5 bg-gray-300"></div>
                              
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-gray-500 text-xs">5</span>
                                </div>
                                <span className="text-xs mt-1 text-gray-500">Archived</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      
                        <div className="workflow-section">
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Current Task</h3>
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <div className="font-medium text-gray-900 mb-2">Contract Final Approval</div>
                            <div className="text-sm text-gray-600 mb-1">
                              Assigned to: <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">@sarah.lee</span>
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                              Due Date: <span className="font-medium">05/11/2025</span>
                            </div>
                            <div className="flex space-x-2">
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                                Approve
                              </button>
                              <button className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm transition-colors">
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      
                        <div className="workflow-section">
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Workflow History</h3>
                          <div className="space-y-3">
                            <div className="flex items-start space-x-2">
                              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                                <span className="text-gray-600 text-xs">→</span>
                              </div>
                              <div className="flex-1">
                                <div className="text-sm text-gray-900">
                                  Document moved to <strong>Review</strong>
                                </div>
                                <div className="text-xs text-gray-500">
                                  By: @john.doe • 28/10/2025 14:30
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                                <span className="text-gray-600 text-xs">→</span>
                              </div>
                              <div className="flex-1">
                                <div className="text-sm text-gray-900">
                                  Document moved to <strong>Approval</strong>
                                </div>
                                <div className="text-xs text-gray-500">
                                  By: @review.team • 29/10/2025 10:15
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                                <span className="text-blue-600 text-xs">ⓘ</span>
                              </div>
                              <div className="flex-1">
                                <div className="text-sm text-gray-900">
                                  Task assigned to <strong>@sarah.lee</strong>
                                </div>
                                <div className="text-xs text-gray-500">
                                  By: Workflow System • 29/10/2025 10:15
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      
                        <div className="workflow-section">
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Actions</h3>
                          <div className="flex flex-col space-y-2">
                            <button className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm transition-colors text-left">
                              Delegate Task
                            </button>
                            <button className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm transition-colors text-left">
                              Change Due Date
                            </button>
                            <button className="w-full bg-white hover:bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-sm transition-colors text-left">
                              Escalate
                            </button>
                          </div>
                        </div>
                      
                      </div>

      )}
      
      {activeTab === 'metadata' && (
        <MetadataTab 
          document={document} 
          isLoading={isLoadingMetadata}
          onUpdateMetadata={onUpdateMetadata}
          onUpdateDocument={onUpdateDocument}
          onRefreshMetadata={onRefreshMetadata}
        />
      )}
      
      {activeTab === 'activity' && (
        <ActivityTab 
          document={document} 
          auditLogs={auditLogs} 
          isLoading={isLoadingAuditLogs} 
        />
      )}
      
      {activeTab === 'comments' && (
        <UnifiedComments 
          entityType="DOCUMENT"
          entityId={document.documentId}
          entityName={document.name}
          displayMode="tab"
          canComment={document.userPermissions?.canEdit}
          showHeader={false}
          maxHeight="100%"
        />
      )}
    </div>
  );
}
