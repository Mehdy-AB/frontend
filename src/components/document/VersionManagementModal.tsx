// components/document/VersionManagementModal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Download,
  Eye,
  History,
  FileText,
  Calendar,
  User,
  HardDrive,
  MoreVertical,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';
import { notificationApiClient } from '../../api/notificationClient';
import { formatFileSize, formatDate } from '../../utils/documentUtils';

interface VersionInfo {
  versionId: number;
  versionNumber: number;
  // Semantic versioning
  majorVersion: number;
  minorVersion: number;
  patchVersion: number;
  semanticVersion: string;
  modificationType: 'MAJOR' | 'MINOR' | 'PATCH' | 'RESTORE';
  versionComment?: string;
  // File info
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    username?: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

const MODIFICATION_TYPES = [
  { value: 'MAJOR', label: 'Major', description: 'Breaking changes', color: 'bg-red-100 text-red-700' },
  { value: 'MINOR', label: 'Minor', description: 'New features', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'PATCH', label: 'Patch', description: 'Bug fixes', color: 'bg-gray-100 text-gray-700' }
] as const;

interface VersionManagementModalProps {
  document: DocumentViewDto;
  isOpen: boolean;
  onClose: () => void;
}

export default function VersionManagementModal({
  document,
  isOpen,
  onClose
}: VersionManagementModalProps) {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modificationType, setModificationType] = useState<'MAJOR' | 'MINOR' | 'PATCH'>('MINOR');
  const [versionComment, setVersionComment] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, document.documentId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const versions = await notificationApiClient.getDocumentVersionsList(document.documentId);

      // Map the DocumentVersionResponseDto to VersionInfo format
      const versionInfos: VersionInfo[] = versions.map((version: any) => ({
        versionId: version.id,
        versionNumber: version.versionNumber,
        // Semantic versioning
        majorVersion: version.majorVersion || 1,
        minorVersion: version.minorVersion || 0,
        patchVersion: version.patchVersion || 0,
        semanticVersion: version.semanticVersion || `${version.majorVersion || 1}.${version.minorVersion || 0}.${version.patchVersion || 0}`,
        modificationType: version.modificationType || 'MINOR',
        versionComment: version.versionComment,
        // File info
        sizeBytes: version.sizeBytes,
        mimeType: version.mimeType,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt || version.createdAt,
        createdBy: version.createdBy || undefined
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUploadVersion = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);

      await notificationApiClient.uploadDocumentVersion(
        selectedFile,
        document.documentId,
        'eng', // Default language
        undefined, // filingCategory
        modificationType,
        versionComment || undefined
      );

      // Refresh versions list
      await fetchVersions();
      setSelectedFile(null);
      setShowUploadForm(false);
      setVersionComment('');
      setModificationType('MINOR');
    } catch (err) {
      console.error('Error uploading version:', err);
      setError('Failed to upload new version');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadVersion = async (versionId: number) => {
    try {
      const version = versions.find(v => v.versionId === versionId);
      const downloadUrl = await notificationApiClient.downloadDocument(document.documentId, versionId);

      // Log the download operation
      try {
        await notificationApiClient.fileDownloaded(document.documentId, versionId);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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

          {/* Upload New Version */}
          <div className="mb-6">
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="flex items-center gap-2 bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload New Version
            </button>

            {showUploadForm && (
              <div className="mt-4 p-4 border border-ui rounded-lg bg-neutral-background">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                      Select File
                    </label>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                      className="w-full p-2 border border-ui rounded-lg text-sm"
                    />
                  </div>

                  {selectedFile && (
                    <div className="p-3 bg-surface border border-ui rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getFileIcon(selectedFile.type)}</div>
                        <div className="flex-1">
                          <div className="font-medium text-neutral-text-dark">{selectedFile.name}</div>
                          <div className="text-sm text-neutral-text-light">
                            {formatFileSize(selectedFile.size)} • {selectedFile.type}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modification Type */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                      Version Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {MODIFICATION_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setModificationType(type.value)}
                          disabled={uploading}
                          className={`p-2 rounded-lg border-2 text-center transition-all ${modificationType === type.value
                            ? `${type.color} border-current font-semibold`
                            : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs opacity-75">{type.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Version Comment */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                      Version Comment <span className="text-neutral-text-light font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={versionComment}
                      onChange={(e) => setVersionComment(e.target.value)}
                      disabled={uploading}
                      placeholder="Describe what changed in this version..."
                      className="w-full p-2 border border-ui rounded-lg text-sm resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleUploadVersion}
                      disabled={!selectedFile || uploading}
                      className="flex items-center gap-2 bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-surface"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Version
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowUploadForm(false);
                        setSelectedFile(null);
                      }}
                      className="px-4 py-2 border border-ui text-neutral-text-dark rounded-lg hover:bg-neutral-background transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                  <div key={version.versionId} className="p-4 border border-ui rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center text-xl">
                          {getFileIcon(version.mimeType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-neutral-text-dark">
                              v{version.semanticVersion}
                            </span>
                            {/* Modification Type Badge */}
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${version.modificationType === 'MAJOR'
                                ? 'bg-red-100 text-red-700'
                                : version.modificationType === 'MINOR'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : version.modificationType === 'RESTORE'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-600'
                              }`}>
                              {version.modificationType}
                            </span>
                            {version.versionId === document.versionId && (
                              <span className="px-2 py-0.5 bg-primary text-surface text-xs rounded">
                                Current
                              </span>
                            )}
                          </div>
                          {/* Version Comment */}
                          {version.versionComment && (
                            <p className="text-sm text-neutral-text-light italic mb-1">
                              &ldquo;{version.versionComment}&rdquo;
                            </p>
                          )}
                          <div className="text-sm text-neutral-text-light">
                            {formatFileSize(version.sizeBytes)} • {version.mimeType}
                          </div>
                          <div className="text-xs text-neutral-text-light">
                            {version.createdBy ? `${version.createdBy.firstName} ${version.createdBy.lastName} • ` : ''}{formatDate(version.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewVersion(version.versionId)}
                          className="p-2 rounded hover:bg-neutral-background transition-colors"
                          title="View Version"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadVersion(version.versionId)}
                          className="p-2 rounded hover:bg-neutral-background transition-colors"
                          title="Download Version"
                        >
                          <Download className="h-4 w-4" />
                        </button>
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
