/**
 * Utility functions for DMS Settings module
 */

/**
 * Get color class for status indicator
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'healthy':
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get color classes for log level
 */
export function getLogLevelColor(level: string): string {
  switch (level) {
    case 'error':
      return 'text-red-500 bg-red-50';
    case 'warning':
      return 'text-yellow-500 bg-yellow-50';
    case 'info':
      return 'text-blue-500 bg-blue-50';
    case 'debug':
      return 'text-gray-500 bg-gray-50';
    default:
      return 'text-gray-500 bg-gray-50';
  }
}

/**
 * Format date string to readable format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format GB to human-readable storage format
 */
export function formatStorageSize(gb: number): string {
  return `${gb} GB`;
}
