'use client';

import { ArrowLeft, FileText, Clock, GitBranch, PlayCircle, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';
import { formatFileSize, formatDate } from '../../utils/documentUtils';
import DocumentActions from './DocumentActions';

interface DocumentHeaderProps {
  document: DocumentViewDto;
  versions: any[];
  currentVersion: number | null;
  isUpdatingDocument: boolean;
  isFavorite: boolean;
  onBack: () => void;
  onShowVersionHistory: () => void;
  onToggleFavorite: () => void;
  onDownload: () => void;
  onShare: () => void;
  onMove?: () => void;
  onShowComments?: () => void;
  onCopyLink: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onUploadVersion?: () => void;
  workflowInstances?: { id: number; status: string; workflowName?: string }[];
  onShowWorkflows?: () => void;
  // Checkout
  isCheckedOut?: boolean;
  checkedOutByName?: string | null;
  isCheckedOutByMe?: boolean;
  checkoutLoading?: boolean;
  onCheckout?: () => void;
  onCheckin?: () => void;
}

export default function DocumentHeader({
  document,
  versions,
  currentVersion,
  isUpdatingDocument,
  isFavorite,
  onBack,
  onShowVersionHistory,
  onToggleFavorite,
  onDownload,
  onShare,
  onMove,
  onShowComments,
  onCopyLink,
  onDelete,
  onRename,
  onUploadVersion,
  workflowInstances,
  onShowWorkflows,
  isCheckedOut,
  checkedOutByName,
  isCheckedOutByMe,
  checkoutLoading,
  onCheckout,
  onCheckin
}: DocumentHeaderProps) {
  const getFileNameWithoutExtension = (filename: string) => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  };

  const getFileExtension = (filename: string) => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1).toUpperCase() : '';
  };

  const fileExtension = getFileExtension(document.name);

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-start justify-between">
        {/* Left Section - Navigation and Basic Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0 mt-1"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>

          {/* File Extension Badge */}
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-xs font-bold text-white">
              {fileExtension || 'FILE'}
            </span>
          </div>

          {/* Document Info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title and Filename */}
            <div className="space-y-1">
              {/* Title */}
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {document.title || getFileNameWithoutExtension(document.name)}
              </h1>

              {/* Filename */}
              <span className="text-sm text-gray-600">
                {document.name}
              </span>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-gray-600 line-clamp-1">
                {document.description || 'No description'}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {/* File Info */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{formatFileSize(document.sizeBytes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(document.updatedAt)}</span>
                </div>
                <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  v{document.versionNumber || (currentVersion ? versions.find(v => v.versionId === currentVersion)?.versionNumber || '?' : 'Latest')}
                </div>
                {isCheckedOut && (
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isCheckedOutByMe ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    <Lock className="h-3 w-3" />
                    <span>{isCheckedOutByMe ? 'Checked out by you' : `Locked by ${checkedOutByName || 'another user'}`}</span>
                  </div>
                )}
              </div>

              {/* Version History Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onShowVersionHistory}
                  className="flex items-center cursor-pointer gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span>Version History</span>
                </button>

                {/* Workflow Status Button */}
                {workflowInstances && workflowInstances.length > 0 && onShowWorkflows && (() => {
                  const activeCount = workflowInstances.filter(i => i.status === 'ACTIVE').length;
                  const hasActive = activeCount > 0;
                  const hasCompleted = workflowInstances.some(i => i.status === 'COMPLETED');
                  const hasFailed = workflowInstances.some(i => i.status === 'FAILED' || i.status === 'CANCELLED');

                  return (
                    <button
                      onClick={onShowWorkflows}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors hover:shadow-sm cursor-pointer"
                      style={{
                        borderColor: hasActive ? '#10b981' : hasCompleted ? '#3b82f6' : hasFailed ? '#ef4444' : '#9ca3af',
                        backgroundColor: hasActive ? '#ecfdf5' : hasCompleted ? '#eff6ff' : hasFailed ? '#fef2f2' : '#f9fafb',
                      }}
                      title={`${workflowInstances.length} workflow instance(s)`}
                    >
                      <GitBranch className="h-3 w-3" style={{ color: hasActive ? '#10b981' : hasCompleted ? '#3b82f6' : hasFailed ? '#ef4444' : '#6b7280' }} />
                      {hasActive && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      <span className="text-[11px] font-medium" style={{ color: hasActive ? '#059669' : hasCompleted ? '#2563eb' : hasFailed ? '#dc2626' : '#6b7280' }}>
                        {hasActive ? `${activeCount} active` : hasCompleted ? 'Completed' : 'Workflow'}
                      </span>
                      {workflowInstances.length > 1 && (
                        <span className="text-[10px] bg-white/80 px-1 rounded text-gray-500">{workflowInstances.length}</span>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Document Actions */}
        <div className="flex-shrink-0">
          <DocumentActions
            document={document}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onDownload={onDownload}
            onShare={onShare}
            onMove={onMove}
            onShowComments={onShowComments}
            onCopyLink={onCopyLink}
            onDelete={onDelete}
            onRename={onRename}
            onUploadVersion={onUploadVersion}
            isCheckedOut={isCheckedOut}
            checkedOutByName={checkedOutByName}
            isCheckedOutByMe={isCheckedOutByMe}
            checkoutLoading={checkoutLoading}
            onCheckout={onCheckout}
            onCheckin={onCheckin}
          />
        </div>
      </div>
    </div>
  );
}