// utils/documentUtils.ts

/**
 * Format file size in bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format date string to localized format
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get appropriate file icon based on MIME type
 */
export const getFileIcon = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
  if (mimeType.includes('image')) return '🖼️';
  return '📎';
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = (text: string): void => {
  navigator.clipboard.writeText(text);
};

/**
 * Create download link and trigger download
 */
export const downloadFile = (url: string, filename: string): void => {
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
};

/**
 * Get link type color classes for UI display
 */
export const getLinkTypeColor = (linkType: string): string => {
  const colors: Record<string, string> = {
    'related': 'bg-blue-100 text-blue-800',
    'reference': 'bg-green-100 text-green-800',
    'attachment': 'bg-purple-100 text-purple-800',
    'version': 'bg-orange-100 text-orange-800',
    'duplicate': 'bg-red-100 text-red-800',
    'parent': 'bg-indigo-100 text-indigo-800',
    'child': 'bg-pink-100 text-pink-800',
    'similar': 'bg-yellow-100 text-yellow-800',
    'dependency': 'bg-teal-100 text-teal-800'
  };
  return colors[linkType.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if file type is viewable in browser
 */
export const isViewableFileType = (mimeType: string): boolean => {
  const viewableTypes = [
    'application/pdf',
    'image/',
    'text/',
    'application/json',
    'application/xml'
  ];
  return viewableTypes.some(type => mimeType.includes(type));
};

/**
 * Generate document preview URL
 */
export const getDocumentPreviewUrl = (documentId: number, version?: number): string => {
  const baseUrl = `/api/documents/${documentId}/preview`;
  return version ? `${baseUrl}?version=${version}` : baseUrl;
};