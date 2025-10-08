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
  CheckCircle
} from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';
import { notificationApiClient } from '../../api/notificationClient';
import { formatFileSize, formatDate } from '../../utils/documentUtils';

interface VersionInfo {
  id: number;
  documentId: number;
  versionNumber: number;
  minioKey: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

interface VersionHistoryModalProps {
  document: DocumentViewDto;
  isOpen: boolean;
  onClose: () => void;
}

export default function VersionHistoryModal({ 
  document, 
  isOpen, 
  onClose
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      
      // Map the DocumentVersionResponse to VersionInfo format
      const versionInfos: VersionInfo[] = versions.map((version: any) => ({
        id: version.id,
        documentId: version.documentId,
        versionNumber: version.versionNumber,
        minioKey: version.minioKey,
        sizeBytes: version.sizeBytes,
        mimeType: version.mimeType,
        createdAt: version.createdAt
      }));
      
      setVersions(versionInfos);
    } catch (err) {
      console.error('Error fetching versions:', err);
      setError('Failed to load document versions');
      setVersions([]); // Ensure versions is always an array
    } finally {
      setLoading(false);
    }
  };


  const handleDownloadVersion = async (versionId: number) => {
    try {
      const version = versions.find(v => v.id === versionId);
      const downloadUrl = await notificationApiClient.downloadDocument(versionId, { version: version?.versionNumber });
      
      // Log the download operation
      try {
        await notificationApiClient.fileDownloaded(versionId, { version: version?.versionNumber });
      } catch (logError) {
        console.warn('Failed to log download operation:', logError);
        // Don't throw here as the download was successful
      }
      
      // Create a temporary link to download the file
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
      // Refresh the versions list to update the current version indicator
      await fetchVersions();
    } catch (err) {
      console.error('Error setting active version:', err);
      setError('Failed to set active version');
    }
  };

  const handleViewVersion = (versionId: number) => {
    // Open version in new tab
    window.open(`/documents/${document.documentId}?version=${versionId}`, '_blank');
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('image')) return '🖼️';
    return '📁';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ui">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-text-dark">Version History</h2>
              <p className="text-sm text-neutral-text-light">{document.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-background transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2 text-error">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}


          {/* Versions List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-text-dark">All Versions</h3>
            
            {loading ? (
        <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border border-ui rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-neutral-ui rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-ui rounded w-1/3"></div>
                        <div className="h-3 bg-neutral-ui rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !Array.isArray(versions) || versions.length === 0 ? (
              <div className="text-center py-8 text-neutral-text-light">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No versions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.isArray(versions) && versions.map((version) => (
                  <div key={version.id} className="p-4 border border-ui rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center text-xl">
                          {getFileIcon(version.mimeType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-text-dark">
                              Version {version.versionNumber}
                            </span>
                            {version.id === document.versionId && (
                              <span className="px-2 py-1 bg-primary text-surface text-xs rounded">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-neutral-text-light">
                            {formatFileSize(version.sizeBytes)} • {version.mimeType}
                          </div>
                          <div className="text-xs text-neutral-text-light">
                            Created: {formatDate(version.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewVersion(version.id)}
                          className="p-2 rounded hover:bg-neutral-background transition-colors"
                          title="View Version"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadVersion(version.id)}
                          className="p-2 rounded hover:bg-neutral-background transition-colors"
                          title="Download Version"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {version.id !== document.versionId && (
                          <button
                            onClick={() => handleSetActiveVersion(version.id)}
                            className="p-2 rounded hover:bg-neutral-background transition-colors text-primary hover:text-primary-dark"
                            title="Set as Current Version"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
