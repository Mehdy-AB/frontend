import React from 'react';
import { MessageSquare, ChevronDown, ChevronUp, X } from 'lucide-react';
import CommentSection  from './CommentSection';

export type EntityType = 'FOLDER' | 'DOCUMENT';
export type DisplayMode = 'sidebar' | 'modal' | 'tab';

interface UnifiedCommentsProps {
  entityType: EntityType;
  entityId: number;
  entityName: string;
  displayMode: DisplayMode;
  canComment?: boolean;
  isLoading?: boolean;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  onClose?: () => void;
  maxHeight?: string;
  showHeader?: boolean;
}

export function UnifiedComments({
  entityType,
  entityId,
  entityName,
  displayMode,
  canComment = true,
  isLoading = false,
  isExpanded = true,
  onToggleExpanded,
  onClose,
  maxHeight = '400px',
  showHeader = true
}: UnifiedCommentsProps) {
  
  // Sidebar mode with collapsible header
  if (displayMode === 'sidebar') {
    return (
      <div>
        <button
          onClick={onToggleExpanded}
          className="flex items-center gap-2 w-full text-left hover:bg-white p-2 rounded-md transition-colors"
        >
          <h3 className="text-sm font-semibold text-gray-900">Comments</h3>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500 ml-auto" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500 ml-auto" />
          )}
        </button>
        
        {isExpanded && (
          <div className="mt-3">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              {isLoading ? (
                // Comments loading skeleton
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-gray-200 rounded w-16 animate-pulse"></div>
                          <div className="h-2 bg-gray-200 rounded w-12 animate-pulse"></div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                        <div className="h-2 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <CommentSection 
                  entityType={entityType}
                  entityId={entityId}
                  entityName={entityName}
                  canComment={canComment}
                  showHeader={false}
                  maxHeight="300px"
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modal mode with close button
  if (displayMode === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
                <p className="text-sm text-gray-500">{entityName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              // Comments loading skeleton
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                        <div className="h-2 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full">
                <CommentSection 
                  entityType={entityType}
                  entityId={entityId}
                  entityName={entityName}
                  canComment={canComment}
                  showHeader={false}
                  maxHeight="100%"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Tab mode - full height content
  if (displayMode === 'tab') {
    return (
      <div className="h-full">
        {isLoading ? (
          // Comments loading skeleton
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-2 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CommentSection 
            entityType={entityType}
            entityId={entityId}
            entityName={entityName}
            canComment={canComment}
            showHeader={showHeader}
            maxHeight="100%"
          />
        )}
      </div>
    );
  }

  return null;
}
