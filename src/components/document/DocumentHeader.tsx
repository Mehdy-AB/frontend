'use client';

import { useState } from 'react';
import { ArrowLeft, Edit3, Save, X } from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';
import { getFileIcon, formatFileSize, formatDate } from '../../utils/documentUtils';
import DocumentActions from './DocumentActions';

interface DocumentHeaderProps {
  document: DocumentViewDto;
  versions: any[];
  isUpdatingDocument: boolean;
  isFavorite: boolean;
  onBack: () => void;
  onUpdateName: (newName: string) => Promise<void>;
  onUpdateTitle: (newTitle: string) => Promise<void>;
  onUpdateDescription: (newDescription: string) => Promise<void>;
  onSetActiveVersion: (versionNumber: number) => Promise<void>;
  onRevertToVersion: (versionNumber: number) => Promise<void>;
  onShowVersionHistory: () => void;
  onShowUploadVersion: () => void;
  onToggleFavorite: () => void;
  onDownload: () => void;
  onShare: () => void;
  onMove?: () => void;
  onShowComments?: () => void;
  onCopyLink: () => void;
}

export default function DocumentHeader({
  document,
  versions,
  isUpdatingDocument,
  isFavorite,
  onBack,
  onUpdateName,
  onUpdateTitle,
  onUpdateDescription,
  onSetActiveVersion,
  onRevertToVersion,
  onShowVersionHistory,
  onShowUploadVersion,
  onToggleFavorite,
  onDownload,
  onShare,
  onMove,
  onShowComments,
  onCopyLink
}: DocumentHeaderProps) {
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editingName, setEditingName] = useState<string>(document.name);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editingTitle, setEditingTitle] = useState<string>(document.title || '');
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);
  const [editingDescription, setEditingDescription] = useState<string>(document.description || '');

  const handleUpdateDocumentName = async () => {
    if (!editingName.trim() || editingName === document.name) {
      setIsEditingName(false);
      return;
    }
    
    try {
      await onUpdateName(editingName.trim());
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating document name:', error);
      setEditingName(document.name); // Reset on error
    }
  };

  const handleUpdateDocumentTitle = async () => {
    if (editingTitle === document.title) {
      setIsEditingTitle(false);
      return;
    }
    
    try {
      await onUpdateTitle(editingTitle.trim());
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error updating document title:', error);
      setEditingTitle(document.title || ''); // Reset on error
    }
  };

  const handleUpdateDocumentDescription = async () => {
    if (editingDescription === document.description) {
      setIsEditingDescription(false);
      return;
    }
    
    try {
      await onUpdateDescription(editingDescription.trim());
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error updating document description:', error);
      setEditingDescription(document.description || ''); // Reset on error
    }
  };

  return (
    <div className="bg-surface border-b border-ui p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-neutral-background transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center text-xl">
              {getFileIcon(document.mimeType)}
            </div>
            <div>
              {/* Document Name */}
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="text-lg font-semibold text-neutral-text-dark bg-transparent border-b border-primary focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateDocumentName();
                      if (e.key === 'Escape') {
                        setEditingName(document.name);
                        setIsEditingName(false);
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateDocumentName}
                    disabled={isUpdatingDocument}
                    className="p-1 text-success hover:bg-success/10 rounded"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(document.name);
                      setIsEditingName(false);
                    }}
                    className="p-1 text-error hover:bg-error/10 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-neutral-text-dark">{document.name}</h1>
                  {document.userPermissions?.canEdit && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background rounded"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Document Title */}
              <div className="mt-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      placeholder="Enter document title..."
                      className="text-base text-neutral-text-dark bg-transparent border-b border-primary focus:outline-none w-full"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateDocumentTitle();
                        if (e.key === 'Escape') {
                          setEditingTitle(document.title || '');
                          setIsEditingTitle(false);
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateDocumentTitle}
                      disabled={isUpdatingDocument}
                      className="p-1 text-success hover:bg-success/10 rounded"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingTitle(document.title || '');
                        setIsEditingTitle(false);
                      }}
                      className="p-1 text-error hover:bg-error/10 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-base text-neutral-text-dark">
                      {document.title || 'No title'}
                    </h2>
                    {document.userPermissions?.canEdit && (
                      <button
                        onClick={() => setIsEditingTitle(true)}
                        className="p-1 text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background rounded"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Document Description */}
              <div className="mt-2">
                {isEditingDescription ? (
                  <div className="flex items-start gap-2">
                    <textarea
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      placeholder="Enter document description..."
                      className="text-sm text-neutral-text-dark bg-transparent border-b border-primary focus:outline-none w-full resize-none"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) handleUpdateDocumentDescription();
                        if (e.key === 'Escape') {
                          setEditingDescription(document.description || '');
                          setIsEditingDescription(false);
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={handleUpdateDocumentDescription}
                        disabled={isUpdatingDocument}
                        className="p-1 text-success hover:bg-success/10 rounded"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingDescription(document.description || '');
                          setIsEditingDescription(false);
                        }}
                        className="p-1 text-error hover:bg-error/10 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-neutral-text-light">
                      {document.description || 'No description'}
                    </p>
                    {document.userPermissions?.canEdit && (
                      <button
                        onClick={() => setIsEditingDescription(true)}
                        className="p-1 text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background rounded"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Version and Actions */}
              <div className="flex items-center gap-2 text-sm text-neutral-text-light mt-2">
                <span>v{document.versionNumber}</span>
                
                {/* Version Selector - Show if multiple versions exist */}
                {versions.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span>•</span>
                    <select
                      value={document.versionNumber}
                      onChange={(e) => onSetActiveVersion(parseInt(e.target.value))}
                      className="text-sm bg-transparent border border-ui rounded px-2 py-1 text-neutral-text-dark"
                      disabled={isUpdatingDocument}
                    >
                      {versions.map((version) => (
                        <option key={version.versionNumber} value={version.versionNumber}>
                          Version {version.versionNumber}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const previousVersion = versions.find(v => v.versionNumber === document.versionNumber - 1);
                        if (previousVersion) {
                          onRevertToVersion(previousVersion.versionNumber);
                        }
                      }}
                      disabled={document.versionNumber <= 1 || isUpdatingDocument}
                      className="text-primary hover:text-primary-dark underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Revert to Previous
                    </button>
                  </div>
                )}
                
                {document.versionNumber > 1 && (
                  <button
                    onClick={onShowVersionHistory}
                    className="text-primary hover:text-primary-dark underline"
                  >
                    View History
                  </button>
                )}
                <button
                  onClick={onShowUploadVersion}
                  className="text-primary cursor-pointer hover:text-primary-dark underline ml-2"
                >
                  Upload New Version
                </button>
                <span>•</span>
                <span>{formatFileSize(document.sizeBytes)}</span>
                <span>•</span>
                <span>{formatDate(document.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Document Actions */}
        <DocumentActions
          document={document}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onDownload={onDownload}
          onShare={onShare}
          onMove={onMove}
          onShowComments={onShowComments}
          onCopyLink={onCopyLink}
        />
      </div>
    </div>
  );
}
