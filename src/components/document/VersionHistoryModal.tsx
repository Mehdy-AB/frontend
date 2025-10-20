// components/document/VersionHistoryModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Eye, 
  History, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  RefreshCw,
  MoreVertical
} from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';
import { notificationApiClient } from '../../api/notificationClient';
import { formatFileSize, formatDate } from '../../utils/documentUtils';

interface VersionInfo {
  id: number;
  documentId: number;
  versionNumber: number;
  sequentialNumber: number; // New field for sequential numbering
  minioKey: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

interface VersionHistoryModalProps {
  document: DocumentViewDto;
  isOpen: boolean;
  onClose: () => void;
  onVersionChange?: () => void;
  onRestoreVersion?: (versionId: number, versionNumber: number) => Promise<void>;
}

export default function VersionHistoryModal({ 
  document, 
  isOpen, 
  onClose,
  onVersionChange,
  onRestoreVersion
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, document.documentId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const versions = await notificationApiClient.getDocumentVersionsList(document.documentId) as any[];
      
      // Sort versions by ID (lowest to highest) to create sequential mapping
      const sortedVersions = versions.sort((a, b) =>  b.id-a.id);
      
      const versionInfos: VersionInfo[] = sortedVersions.map((version: any, index: number) => ({
        id: version.id,
        documentId: version.documentId,
        versionNumber: version.versionNumber,
        sequentialNumber: index + 1, // Map to sequential numbers (1, 2, 3, etc.)
        minioKey: version.minioKey,
        sizeBytes: version.sizeBytes,
        mimeType: version.mimeType,
        createdAt: version.createdAt,
        createdBy: version.createdBy || document.createdBy
      }));
      
      // Sort by sequential number descending (newest first)
      setVersions(versionInfos.sort((a, b) => a.sequentialNumber - b.sequentialNumber ));
    } catch (err) {
      console.error('Error fetching versions:', err);
      setError('Failed to load version history');
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVersion = async (versionId: number) => {
    try {
      const version = versions.find(v => v.id === versionId);
      const downloadUrl = await notificationApiClient.downloadDocument(versionId, { version: versionId });
      
      try {
        await notificationApiClient.fileDownloaded(versionId, { version: versionId });
      } catch (logError) {
        console.warn('Failed to log download operation:', logError);
      }
      
      const link = window.document.createElement('a');
      link.href = downloadUrl;
      link.download = `${document.name}_v${version?.versionNumber}`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading version:', err);
      setError('Failed to download version');
    }
  };

  const handleSetActiveVersion = async (versionId: number) => {
    try {
      await notificationApiClient.setActiveVersion(document.documentId, versionId);
      await fetchVersions();
      onVersionChange?.();
    } catch (err) {
      console.error('Error setting active version:', err);
      setError('Failed to set active version');
    }
  };

  const handleViewVersion = (versionId: number) => {
    window.open(`/documents/${document.documentId}?version=${versionId}`, '_blank');
  };

  const handleRestoreVersion = async (versionId: number) => {
    try {
      setActiveAction(versionId);
      
      // Find the version to get its version number
      const version = versions.find(v => v.id === versionId);
      if (!version) {
        setError('Version not found');
        return;
      }
      
      // Call the parent handler to handle the restore (includes API call and file content update)
      if (onRestoreVersion) {
        await onRestoreVersion(versionId, version.versionNumber);
        // Refresh versions to get updated data
        await fetchVersions();
        onClose();
      }
    } catch (err) {
      console.error('Error restoring version:', err);
      setError('Failed to restore version');
    } finally {
      setActiveAction(null);
    }
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'bg-red-100 text-red-700 border-red-200';
    if (mimeType.includes('word')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'bg-green-100 text-green-700 border-green-200';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (mimeType.includes('image')) return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word')) return 'DOC';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'XLS';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PPT';
    if (mimeType.includes('image')) return 'IMG';
    return 'FILE';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <History className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Version History</h2>
              <p className="text-sm text-gray-600 mt-1">{document.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchVersions}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Unable to load versions</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Versions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Document Versions</h3>
              <div className="text-sm text-gray-500">
                {versions.length} version{versions.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-8 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-medium">No versions found</p>
                <p className="text-gray-400 text-sm mt-2">Upload a new version to see history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div 
                    key={version.id} 
                    className={`p-4 border rounded-lg transition-all ${
                      version.id === document.activeVersion 
                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* File Type Badge */}
                        <div className={`h-12 w-12 rounded-lg border-2 flex items-center justify-center font-semibold text-sm ${getFileTypeColor(version.mimeType)}`}>
                          {getFileTypeLabel(version.mimeType)}
                        </div>

                        {/* Version Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">
                              Version {version.versionNumber}
                            </span>
                            {version.id === document.activeVersion && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                                Current Version
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(version.createdAt)}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500">{formatDate(version.createdAt)}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{formatFileSize(version.sizeBytes)}</span>
                            </div>

                            {version.createdBy && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{version.createdBy.firstName} {version.createdBy.lastName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewVersion(version.id)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview version"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDownloadVersion(version.id)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download version"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        
                        {version.id !== document.activeVersion && (
                          <button
                            onClick={() => handleRestoreVersion(version.id)}
                            disabled={activeAction === version.id}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Restore this version"
                          >
                            <RefreshCw className={`h-4 w-4 ${activeAction === version.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          {versions.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="h-4 w-4 text-gray-400" />
                <span>Restoring a previous version will create a new version while preserving the history</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}