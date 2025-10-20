'use client';

import { useState } from 'react';
import { ArrowLeft, Edit3, Save, X, FileText, Clock, History, Upload, Download } from 'lucide-react';
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
  onUpdateName: (newName: string) => Promise<void>;
  onUpdateTitle: (newTitle: string) => Promise<void>;
  onUpdateDescription: (newDescription: string) => Promise<void>;
  onSetActiveVersion: (versionId: number) => Promise<void>;
  onRevertToVersion: (versionId: number) => Promise<void>;
  onShowVersionHistory: () => void;
  onShowUploadVersion: () => void;
  onToggleFavorite: () => void;
  onDownload: () => void;
  onShare: () => void;
  onMove?: () => void;
  onShowComments?: () => void;
  onCopyLink: () => void;
  onDelete?: () => void;
}

export default function DocumentHeader({
  document,
  versions,
  currentVersion,
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
  onCopyLink,
  onDelete
}: DocumentHeaderProps) {
  const getFileNameWithoutExtension = (filename: string) => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  };

  const getFileExtension = (filename: string) => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1).toUpperCase() : '';
  };

  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editingName, setEditingName] = useState<string>(getFileNameWithoutExtension(document.name));
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editingTitle, setEditingTitle] = useState<string>(document.title || '');
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);
  const [editingDescription, setEditingDescription] = useState<string>(document.description || '');

  const handleUpdateDocumentName = async () => {
    const newName = editingName.trim();
    const fileExtension = document.name.split('.').pop();
    const fullName = fileExtension ? `${newName}.${fileExtension}` : newName;
    
    if (!newName || fullName === document.name) {
      setIsEditingName(false);
      return;
    }
    
    try {
      await onUpdateName(fullName);
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating document name:', error);
      setEditingName(getFileNameWithoutExtension(document.name));
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
      setEditingTitle(document.title || '');
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
      setEditingDescription(document.description || '');
    }
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
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="flex-1 text-lg font-semibold text-gray-900 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Save className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingTitle(document.title || '');
                      setIsEditingTitle(false);
                    }}
                    className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="group flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-gray-900 truncate">
                    {document.title || getFileNameWithoutExtension(document.name)}
                  </h1>
                  {document.userPermissions?.canEdit && (
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 rounded transition-all"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Filename */}
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="text-sm text-gray-600 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateDocumentName();
                        if (e.key === 'Escape') {
                          setEditingName(getFileNameWithoutExtension(document.name));
                          setIsEditingName(false);
                        }
                      }}
                      autoFocus
                    />
                    <span className="text-sm text-gray-500 font-medium">.{fileExtension.toLowerCase()}</span>
                  </div>
                  <button
                    onClick={handleUpdateDocumentName}
                    disabled={isUpdatingDocument}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Save className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(getFileNameWithoutExtension(document.name));
                      setIsEditingName(false);
                    }}
                    className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="group flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {document.name}
                  </span>
                  {document.userPermissions?.canEdit && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 rounded transition-all"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              {isEditingDescription ? (
                <div className="flex items-start gap-2">
                  <textarea
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    className="flex-1 text-sm text-gray-600 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
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
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingDescription(document.description || '');
                        setIsEditingDescription(false);
                      }}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group flex items-start gap-2">
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {document.description || 'No description'}
                  </p>
                  {document.userPermissions?.canEdit && (
                    <button
                      onClick={() => setIsEditingDescription(true)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 rounded transition-all flex-shrink-0"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Metadata and Actions */}
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
              </div>

              {/* Version Actions */}
              <div className="flex items-center gap-3">
                {versions.length > 1 && (
                  <select
                    value={document.activeVersion || currentVersion || document.documentId}
                    onChange={(e) => onSetActiveVersion(parseInt(e.target.value))}
                    className="text-xs border border-gray-300 rounded px-2 py-0.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isUpdatingDocument}
                  >
                    {versions.map((version) => (
                      <option key={version.versionId} value={version.versionId}>
                        v{version.versionNumber}
                      </option>
                    ))}
                  </select>
                )}
                
                <button
                  onClick={onShowVersionHistory}
                  className="flex items-center cursor-pointer gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <History className="h-3 w-3" />
                  <span>History</span>
                </button>
                
                <button
                  onClick={onShowUploadVersion}
                  className="flex items-center cursor-pointer gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Upload className="h-3 w-3" />
                  <span>Upload</span>
                </button>

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
          />
        </div>
      </div>
    </div>
  );
}